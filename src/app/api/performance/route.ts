import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { districts, performanceData } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Use fin_year instead of year to avoid Next.js parameter stripping
    const url = new URL(request.url);
    const districtCode = url.searchParams.get('district_code') || request.nextUrl.searchParams.get('district_code');
    const finYear = url.searchParams.get('fin_year') || request.nextUrl.searchParams.get('fin_year');

    // Validate required parameters
    if (!districtCode) {
      return NextResponse.json(
        { 
          error: 'district_code parameter is required',
          code: 'MISSING_DISTRICT_CODE'
        },
        { status: 400 }
      );
    }

    if (!finYear) {
      return NextResponse.json(
        { 
          error: 'fin_year parameter is required',
          code: 'MISSING_FIN_YEAR',
          debug: {
            url: request.url,
            searchParams: Object.fromEntries(url.searchParams.entries())
          }
        },
        { status: 400 }
      );
    }

    // Query performance data with district join
    const results = await db
      .select({
        id: performanceData.id,
        districtId: performanceData.districtId,
        finYear: performanceData.finYear,
        month: performanceData.month,
        rawData: performanceData.rawData,
        metricWorkStatus: performanceData.metricWorkStatus,
        metricPaymentStatus: performanceData.metricPaymentStatus,
        metricTrend: performanceData.metricTrend,
        metricComparison: performanceData.metricComparison,
        activeWorkers: performanceData.activeWorkers,
        completedWorks: performanceData.completedWorks,
        avgPayment: performanceData.avgPayment,
        paymentDelayed: performanceData.paymentDelayed,
        budgetUtilization: performanceData.budgetUtilization,
        monthlyTrend: performanceData.monthlyTrend,
        stateAverage: performanceData.stateAverage,
        approvedLabourBudget: performanceData.approvedLabourBudget,
        avgWageRate: performanceData.avgWageRate,
        avgDaysEmployment: performanceData.avgDaysEmployment,
        totalHouseholdsWorked: performanceData.totalHouseholdsWorked,
        womenPersondays: performanceData.womenPersondays,
        totalExpenditure: performanceData.totalExpenditure,
        createdAt: performanceData.createdAt,
        updatedAt: performanceData.updatedAt,
        districtName: districts.districtName,
        districtCode: districts.districtCode,
        stateName: districts.stateName
      })
      .from(performanceData)
      .innerJoin(districts, eq(performanceData.districtId, districts.id))
      .where(
        and(
          eq(districts.districtCode, districtCode),
          eq(performanceData.finYear, finYear)
        )
      )
      .orderBy(desc(performanceData.createdAt))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { 
          error: 'No performance data found for the specified district and year',
          code: 'PERFORMANCE_DATA_NOT_FOUND',
          district_code: districtCode,
          fin_year: finYear
        },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0], { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      district_code,
      fin_year,
      month,
      raw_data,
      metric_work_status,
      metric_payment_status,
      metric_trend,
      metric_comparison,
      active_workers,
      completed_works,
      avg_payment,
      payment_delayed,
      budget_utilization,
      monthly_trend,
      state_average,
      approved_labour_budget,
      avg_wage_rate,
      avg_days_employment,
      total_households_worked,
      women_persondays,
      total_expenditure
    } = body;

    // Validate required fields
    if (!district_code) {
      return NextResponse.json(
        { 
          error: 'district_code is required',
          code: 'MISSING_DISTRICT_CODE'
        },
        { status: 400 }
      );
    }

    if (!fin_year) {
      return NextResponse.json(
        { 
          error: 'fin_year is required',
          code: 'MISSING_FIN_YEAR'
        },
        { status: 400 }
      );
    }

    if (!month) {
      return NextResponse.json(
        { 
          error: 'month is required',
          code: 'MISSING_MONTH'
        },
        { status: 400 }
      );
    }

    // Lookup district by district_code
    const district = await db
      .select()
      .from(districts)
      .where(eq(districts.districtCode, district_code))
      .limit(1);

    if (district.length === 0) {
      return NextResponse.json(
        { 
          error: 'District not found with the provided district_code',
          code: 'DISTRICT_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const districtId = district[0].id;
    const timestamp = new Date().toISOString();

    // Insert performance data
    const newPerformanceData = await db
      .insert(performanceData)
      .values({
        districtId,
        finYear: fin_year,
        month: month.trim(),
        rawData: raw_data || null,
        metricWorkStatus: metric_work_status || null,
        metricPaymentStatus: metric_payment_status || null,
        metricTrend: metric_trend || null,
        metricComparison: metric_comparison || null,
        activeWorkers: active_workers || null,
        completedWorks: completed_works || null,
        avgPayment: avg_payment || null,
        paymentDelayed: payment_delayed || null,
        budgetUtilization: budget_utilization || null,
        monthlyTrend: monthly_trend || null,
        stateAverage: state_average || null,
        approvedLabourBudget: approved_labour_budget || null,
        avgWageRate: avg_wage_rate || null,
        avgDaysEmployment: avg_days_employment || null,
        totalHouseholdsWorked: total_households_worked || null,
        womenPersondays: women_persondays || null,
        totalExpenditure: total_expenditure || null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    return NextResponse.json(newPerformanceData[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}