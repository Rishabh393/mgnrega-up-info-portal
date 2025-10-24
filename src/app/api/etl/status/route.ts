import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceData } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get total count of records
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(performanceData);

    const totalRecords = countResult[0]?.count ?? 0;

    // Get the most recent timestamp
    const latestRecord = await db
      .select({ createdAt: performanceData.createdAt })
      .from(performanceData)
      .orderBy(desc(performanceData.createdAt))
      .limit(1);

    const lastRunTimestamp = latestRecord.length > 0 ? latestRecord[0].createdAt : null;

    return NextResponse.json({
      lastRunTimestamp,
      totalRecords
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}