import { NextRequest, NextResponse } from 'next/server';
import { runETL } from '@/scripts/etl-mgnrega';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, previousYear } = body;

    // Validate year parameter
    if (!year) {
      return NextResponse.json(
        { error: 'year parameter is required' },
        { status: 400 }
      );
    }

    // Convert simple year (e.g., "2024") to financial year format (e.g., "2023-2024")
    const convertToFinancialYear = (yr: string | number): string => {
      const yearNum = typeof yr === 'string' ? parseInt(yr) : yr;
      return `${yearNum - 1}-${yearNum}`;
    };

    const currentYear = typeof year === 'string' && year.includes('-') ? year : convertToFinancialYear(year);
    const prevYear = previousYear 
      ? (typeof previousYear === 'string' && previousYear.includes('-') ? previousYear : convertToFinancialYear(previousYear))
      : convertToFinancialYear(parseInt(year.toString()) - 1);

    console.log(`\n🚀 ETL Pipeline triggered via API for financial year ${currentYear}\n`);

    // Run ETL in background (don't await to avoid timeout)
    runETL(currentYear, prevYear)
      .then((success) => {
        if (success) {
          console.log(`✅ ETL Pipeline completed successfully for year ${currentYear}`);
        } else {
          console.error(`❌ ETL Pipeline failed for year ${currentYear}`);
        }
      })
      .catch((error) => {
        console.error(`❌ ETL Pipeline error for year ${currentYear}:`, error);
      });

    return NextResponse.json({
      message: `ETL pipeline started for financial year ${currentYear}`,
      year: currentYear,
      previousYear: prevYear,
      status: 'processing'
    }, { status: 202 });

  } catch (error) {
    console.error('ETL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'MGNREGA ETL Pipeline API',
    description: 'Use POST method to trigger ETL pipeline',
    usage: {
      method: 'POST',
      body: {
        year: '2024 or 2023-2024',
        previousYear: '2023 or 2022-2023 (optional)'
      }
    },
    endpoints: {
      trigger: 'POST /api/etl',
      status: 'GET /api/etl/status'
    }
  });
}