import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { districts, performanceData } from '@/db/schema';
import { eq, desc, and, isNotNull, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { district_code: string; fin_year: string } }
) {
  try {
    const { district_code, fin_year } = params;

    // Validate required parameters
    if (!district_code) {
      return NextResponse.json(
        { 
          error: 'district_code parameter is required',
          code: 'MISSING_DISTRICT_CODE'
        },
        { status: 400 }
      );
    }

    if (!fin_year) {
      return NextResponse.json(
        { 
          error: 'fin_year parameter is required',
          code: 'MISSING_FIN_YEAR'
        },
        { status: 400 }
      );
    }

    // First, try to get records with REAL data (non-null performance fields)
    const realDataResults = await db
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
          eq(districts.districtCode, district_code),
          eq(performanceData.finYear, fin_year),
          // Prioritize records with real data (non-null and > 0)
          isNotNull(performanceData.approvedLabourBudget),
          gt(performanceData.approvedLabourBudget, 0)
        )
      )
      .orderBy(desc(performanceData.createdAt))
      .limit(1);

    // If real data found, return it
    if (realDataResults.length > 0) {
      return NextResponse.json(realDataResults[0], { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Fall back to any record (including placeholders) if no real data exists
    const fallbackResults = await db
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
          eq(districts.districtCode, district_code),
          eq(performanceData.finYear, fin_year)
        )
      )
      .orderBy(desc(performanceData.createdAt))
      .limit(1);

    if (fallbackResults.length === 0) {
      return NextResponse.json(
        { 
          error: 'No performance data found for the specified district and year',
          code: 'PERFORMANCE_DATA_NOT_FOUND',
          district_code,
          fin_year
        },
        { status: 404 }
      );
    }

    return NextResponse.json(fallbackResults[0], { 
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