/**
 * ETL Script for MGNREGA Data Pipeline
 * 
 * This script fetches data from data.gov.in API, transforms it with business logic,
 * and loads it into the PostgreSQL database via our API.
 * 
 * Schedule this script to run periodically (e.g., daily via cron job)
 */

interface DataGovRecord {
  district_name?: string;
  Total_Households_Worked?: string;
  Approved_Labour_Budget?: string;
  percentage_payments_gererated_within_15_days?: string;
  Total_Exp?: string;
  Average_days_of_employment_provided_per_Household?: string;
  Women_Persondays?: string;
  Total_No_of_Active_Workers?: string;
  Number_of_Completed_Works?: string;
  Average_Wage_rate_per_day_per_person?: string;
  [key: string]: any;
}

interface ProcessedMetrics {
  metricWorkStatus: 'GOOD' | 'OKAY' | 'POOR';
  metricPaymentStatus: 'YES' | 'NO';
  metricTrend: 'UP' | 'DOWN' | 'SAME';
  metricComparison: 'BETTER' | 'SAME' | 'WORSE';
  activeWorkers: number;
  completedWorks: number;
  avgPayment: number;
  paymentDelayed: number;
  budgetUtilization: number;
  monthlyTrend: number;
  stateAverage: number;
}

// API Configuration
const DATA_GOV_API_URL = 'https://api.data.gov.in/resource/ee03643a-ee4c-48c2-ac30-9f2ff26ab722';
const API_KEY = '579b464db66ec23bdd000001e53fa3110afd4add6e96d2966647b4b8';
const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Cache districts to avoid repeated API calls
let districtCache: any[] = [];

/**
 * Initialize district cache
 */
async function initDistrictCache(): Promise<void> {
  try {
    const response = await fetch(`${BASE_API_URL}/api/districts?state=UTTAR%20PRADESH`);
    districtCache = await response.json();
    console.log(`📋 Loaded ${districtCache.length} districts into cache`);
  } catch (error) {
    console.error('❌ Failed to load district cache:', error);
    throw error;
  }
}

/**
 * Normalize district name for matching
 */
function normalizeDistrictName(name: string): string {
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/\-/g, ' ');
}

/**
 * Fetch data from data.gov.in API
 */
async function fetchDataGovAPI(year: string): Promise<DataGovRecord[]> {
  const params = new URLSearchParams({
    'api-key': API_KEY,
    'format': 'json',
    'limit': '100',
    'filters[state_name]': 'UTTAR PRADESH',
    'filters[fin_year]': year
  });

  const url = `${DATA_GOV_API_URL}?${params.toString()}`;
  
  console.log(`📡 Fetching data from data.gov.in for year ${year}...`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.records || !Array.isArray(data.records)) {
      throw new Error('Invalid API response format');
    }
    
    console.log(`✅ Fetched ${data.records.length} records from data.gov.in`);
    return data.records;
  } catch (error) {
    console.error('❌ Failed to fetch from data.gov.in:', error);
    throw error;
  }
}

/**
 * Calculate work status metric
 */
function calculateWorkStatus(record: DataGovRecord): 'GOOD' | 'OKAY' | 'POOR' {
  const householdsWorked = parseFloat(record.Total_Households_Worked || '0');
  const approvedBudget = parseFloat(record.Approved_Labour_Budget || '1');
  const percentage = (householdsWorked / approvedBudget) * 100;
  
  if (percentage >= 80) return 'GOOD';
  if (percentage >= 50) return 'OKAY';
  return 'POOR';
}

/**
 * Calculate payment status metric
 */
function calculatePaymentStatus(record: DataGovRecord): 'YES' | 'NO' {
  const timelyPaymentPercent = parseFloat(record.percentage_payments_gererated_within_15_days || '0');
  return timelyPaymentPercent >= 90 ? 'YES' : 'NO';
}

/**
 * Calculate trend metric (compare with previous year)
 */
function calculateTrend(currentRecord: DataGovRecord, previousRecord?: DataGovRecord): 'UP' | 'DOWN' | 'SAME' {
  if (!previousRecord) return 'SAME';
  
  const currentExp = parseFloat(currentRecord.Total_Exp || '0');
  const previousExp = parseFloat(previousRecord.Total_Exp || '0');
  
  if (previousExp === 0) return 'SAME';
  
  const changePercent = ((currentExp - previousExp) / previousExp) * 100;
  
  if (changePercent > 10) return 'UP';
  if (changePercent < -10) return 'DOWN';
  return 'SAME';
}

/**
 * Calculate comparison metric (compare with state average)
 */
function calculateComparison(record: DataGovRecord, allRecords: DataGovRecord[]): 'BETTER' | 'SAME' | 'WORSE' {
  const avgDays = parseFloat(record.Average_days_of_employment_provided_per_Household || '0');
  
  // Sort all districts by employment days
  const sorted = allRecords
    .map(r => parseFloat(r.Average_days_of_employment_provided_per_Household || '0'))
    .sort((a, b) => b - a);
  
  const currentIndex = sorted.indexOf(avgDays);
  const totalDistricts = sorted.length;
  const percentile = (currentIndex / totalDistricts) * 100;
  
  if (percentile <= 33) return 'BETTER';
  if (percentile <= 66) return 'SAME';
  return 'WORSE';
}

/**
 * Transform raw API data into our database format
 */
function transformRecord(
  record: DataGovRecord,
  allRecords: DataGovRecord[],
  previousYearRecord?: DataGovRecord
): ProcessedMetrics {
  const activeWorkers = parseInt(record.Total_No_of_Active_Workers || '0');
  const householdsWorked = parseInt(record.Total_Households_Worked || '0');
  const timelyPaymentPercent = parseFloat(record.percentage_payments_gererated_within_15_days || '0');
  const avgDays = parseFloat(record.Average_days_of_employment_provided_per_Household || '0');
  
  // Calculate metrics
  const metricWorkStatus = calculateWorkStatus(record);
  const metricPaymentStatus = calculatePaymentStatus(record);
  const metricTrend = calculateTrend(record, previousYearRecord);
  const metricComparison = calculateComparison(record, allRecords);
  
  // Use actual values from API instead of estimates
  const completedWorks = parseInt(record.Number_of_Completed_Works || '0');
  const avgWageRate = parseFloat(record.Average_Wage_rate_per_day_per_person || '0');
  const avgPayment = Math.floor(avgWageRate * avgDays); // Actual wage rate * days worked
  const paymentDelayed = timelyPaymentPercent >= 90 ? 5 : 15; // Estimate delay days
  const budgetUtilization = Math.min(100, Math.floor((householdsWorked / parseFloat(record.Approved_Labour_Budget || '1')) * 100));
  
  // Calculate trend percentage
  let monthlyTrend = 0;
  if (previousYearRecord) {
    const currentExp = parseFloat(record.Total_Exp || '0');
    const previousExp = parseFloat(previousYearRecord.Total_Exp || '1');
    monthlyTrend = Math.floor(((currentExp - previousExp) / previousExp) * 100);
  }
  
  // Calculate state average comparison percentage
  const stateAvg = allRecords.reduce((sum, r) => sum + parseFloat(r.Average_days_of_employment_provided_per_Household || '0'), 0) / allRecords.length;
  const stateAverage = Math.floor(((avgDays - stateAvg) / stateAvg) * 100);
  
  return {
    metricWorkStatus,
    metricPaymentStatus,
    metricTrend,
    metricComparison,
    activeWorkers,
    completedWorks,
    avgPayment,
    paymentDelayed,
    budgetUtilization,
    monthlyTrend,
    stateAverage
  };
}

/**
 * Get district code from district name with fuzzy matching
 */
async function getDistrictCode(districtName: string): Promise<string | null> {
  try {
    const normalizedInput = normalizeDistrictName(districtName);
    
    // Try exact match first
    let district = districtCache.find((d: any) => 
      normalizeDistrictName(d.districtName) === normalizedInput
    );
    
    // Try partial match if exact fails
    if (!district) {
      district = districtCache.find((d: any) => {
        const normalized = normalizeDistrictName(d.districtName);
        return normalized.includes(normalizedInput) || normalizedInput.includes(normalized);
      });
    }
    
    // Handle special cases
    if (!district) {
      const specialCases: { [key: string]: string } = {
        'SANT RAVIDAS NAGAR BHADOHI': 'BHADOHI',
        'SANT RAVIDAS NAGAR': 'BHADOHI',
        'FAIZABAD': 'AYODHYA',
        'ALLAHABAD': 'PRAYAGRAJ',
        'LAKHIMPUR KHERI': 'KHERI',
        'GAUTAM BUDH NAGAR': 'GAUTAM BUDDHA NAGAR',
        'GB NAGAR': 'GAUTAM BUDDHA NAGAR',
        'SANT KABEER NAGAR': 'SANT KABIR NAGAR',
      };
      
      const mappedName = specialCases[normalizedInput];
      if (mappedName) {
        district = districtCache.find((d: any) => 
          normalizeDistrictName(d.districtName) === normalizeDistrictName(mappedName)
        );
      }
    }
    
    if (district) {
      return district.districtCode;
    }
    
    console.warn(`⚠️  No match found for district: "${districtName}"`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to get district code for ${districtName}:`, error);
    return null;
  }
}

/**
 * Load transformed data into database via API
 */
async function loadDataToDatabase(
  districtCode: string,
  year: string,
  rawData: DataGovRecord,
  metrics: ProcessedMetrics
): Promise<boolean> {
  try {
    const payload = {
      district_code: districtCode,
      fin_year: year,
      month: new Date().toISOString().split('T')[0], // Current date as month
      raw_data: JSON.stringify(rawData),
      metric_work_status: metrics.metricWorkStatus,
      metric_payment_status: metrics.metricPaymentStatus,
      metric_trend: metrics.metricTrend,
      metric_comparison: metrics.metricComparison,
      active_workers: metrics.activeWorkers,
      completed_works: metrics.completedWorks,
      avg_payment: metrics.avgPayment,
      payment_delayed: metrics.paymentDelayed,
      budget_utilization: metrics.budgetUtilization,
      monthly_trend: metrics.monthlyTrend,
      state_average: metrics.stateAverage,
      // New comprehensive MGNREGA fields
      approved_labour_budget: parseInt(rawData.Approved_Labour_Budget || '0'),
      avg_wage_rate: Math.floor(parseFloat(rawData.Average_Wage_rate_per_day_per_person || '0')),
      avg_days_employment: Math.floor(parseFloat(rawData.Average_days_of_employment_provided_per_Household || '0')),
      total_households_worked: parseInt(rawData.Total_Households_Worked || '0'),
      women_persondays: parseInt(rawData.Women_Persondays || '0'),
      total_expenditure: parseInt(rawData.Total_Exp || '0')
    };
    
    const response = await fetch(`${BASE_API_URL}/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to insert data');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to load data for district ${districtCode}:`, error);
    return false;
  }
}

/**
 * Main ETL process
 */
async function runETL(year: string, previousYear?: string) {
  console.log('\n🚀 Starting MGNREGA ETL Pipeline...\n');
  console.log(`📅 Target Year: ${year}`);
  console.log(`📅 Previous Year: ${previousYear || 'N/A'}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const unmatchedDistricts: string[] = [];
  
  try {
    // Initialize district cache
    await initDistrictCache();
    
    // Extract: Fetch current year data
    const currentYearData = await fetchDataGovAPI(year);
    
    // Extract: Fetch previous year data for trend comparison (optional)
    let previousYearData: DataGovRecord[] = [];
    if (previousYear) {
      try {
        previousYearData = await fetchDataGovAPI(previousYear);
      } catch (error) {
        console.warn('⚠️  Could not fetch previous year data for trend comparison');
      }
    }
    
    console.log('\n🔄 Transforming and loading data...\n');
    
    // Transform and Load: Process each district
    for (const record of currentYearData) {
      const districtName = record.district_name;
      
      if (!districtName) {
        console.warn('⚠️  Skipping record without district name');
        skippedCount++;
        continue;
      }
      
      // Get district code from our database
      const districtCode = await getDistrictCode(districtName);
      
      if (!districtCode) {
        console.warn(`⚠️  District not found in database: "${districtName}"`);
        unmatchedDistricts.push(districtName);
        skippedCount++;
        continue;
      }
      
      // Find previous year record for this district
      const previousRecord = previousYearData.find(
        r => normalizeDistrictName(r.district_name || '') === normalizeDistrictName(districtName)
      );
      
      // Transform data
      const metrics = transformRecord(record, currentYearData, previousRecord);
      
      // Load data into database
      const success = await loadDataToDatabase(districtCode, year, record, metrics);
      
      if (success) {
        successCount++;
        console.log(`✅ ${districtName} (${districtCode}) - ${metrics.metricWorkStatus}`);
      } else {
        errorCount++;
      }
      
      // Add small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 ETL Pipeline Summary:');
    console.log(`✅ Successfully processed: ${successCount} districts`);
    console.log(`⚠️  Skipped (not found): ${skippedCount} districts`);
    console.log(`❌ Failed: ${errorCount} districts`);
    console.log(`📦 Total API records: ${currentYearData.length}`);
    console.log(`📋 Total DB districts: ${districtCache.length}`);
    
    if (unmatchedDistricts.length > 0) {
      console.log('\n⚠️  Unmatched districts from API:');
      unmatchedDistricts.forEach(d => console.log(`   - ${d}`));
    }
    
    // Create placeholder data for districts without API data
    const districtsWithData = new Set<string>();
    for (const record of currentYearData) {
      const code = await getDistrictCode(record.district_name || '');
      if (code) districtsWithData.add(code);
    }
    
    const missingDistricts = districtCache.filter(
      (d: any) => !districtsWithData.has(d.districtCode)
    );
    
    if (missingDistricts.length > 0) {
      console.log(`\n📝 Creating placeholder data for ${missingDistricts.length} districts without API data...`);
      
      for (const district of missingDistricts) {
        const placeholderMetrics: ProcessedMetrics = {
          metricWorkStatus: 'OKAY',
          metricPaymentStatus: 'YES',
          metricTrend: 'SAME',
          metricComparison: 'SAME',
          activeWorkers: 0,
          completedWorks: 0,
          avgPayment: 0,
          paymentDelayed: 0,
          budgetUtilization: 0,
          monthlyTrend: 0,
          stateAverage: 0
        };
        
        const placeholderData: DataGovRecord = {
          district_name: district.districtName,
          Total_Households_Worked: '0',
          Approved_Labour_Budget: '0',
          percentage_payments_gererated_within_15_days: '100',
          Total_Exp: '0',
          Average_days_of_employment_provided_per_Household: '0',
          Total_No_of_Active_Workers: '0'
        };
        
        const success = await loadDataToDatabase(
          district.districtCode,
          year,
          placeholderData,
          placeholderMetrics
        );
        
        if (success) {
          console.log(`✅ Placeholder: ${district.districtName} (${district.districtCode})`);
          successCount++;
        }
      }
    }
    
    console.log('\n📊 Final Summary:');
    console.log(`✅ Total districts with data: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    if (successCount > 0) {
      console.log('\n✨ ETL Pipeline completed successfully!');
      return true;
    } else {
      console.error('\n❌ ETL Pipeline failed - no data was loaded');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ ETL Pipeline failed with error:', error);
    return false;
  }
}

/**
 * Run the ETL script
 * Usage: tsx src/scripts/etl-mgnrega.ts [year] [previousYear]
 */
async function main() {
  const args = process.argv.slice(2);
  const year = args[0] || '2024';
  const previousYear = args[1] || '2023';
  
  const success = await runETL(year, previousYear);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runETL, fetchDataGovAPI, transformRecord };