import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceData, districts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtCode = searchParams.get('district_code');
    const year = searchParams.get('year');

    // Get all performance data to see what's actually stored
    const allData = await db
      .select({
        id: performanceData.id,
        districtCode: districts.districtCode,
        districtName: districts.districtName,
        finYear: performanceData.finYear,
        month: performanceData.month,
      })
      .from(performanceData)
      .innerJoin(districts, eq(performanceData.districtId, districts.id))
      .limit(20);

    // Get unique years
    const allYears = await db.select({ finYear: performanceData.finYear }).from(performanceData);
    const uniqueYears = [...new Set(allYears.map(r => r.finYear))];

    // Count by year
    const yearCounts: Record<string, number> = {};
    allYears.forEach(r => {
      yearCounts[r.finYear] = (yearCounts[r.finYear] || 0) + 1;
    });

    return NextResponse.json({
      params_received: {
        district_code: districtCode,
        year: year,
      },
      full_url: request.url,
      total_records: allYears.length,
      unique_years: uniqueYears,
      records_by_year: yearCounts,
      sample_data: allData,
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}