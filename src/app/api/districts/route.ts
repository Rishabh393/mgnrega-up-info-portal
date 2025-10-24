import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { districts } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    let query = db.select({
      id: districts.id,
      districtName: districts.districtName,
      districtNameHindi: districts.districtNameHindi,
      districtCode: districts.districtCode
    }).from(districts);

    if (state) {
      query = query.where(eq(districts.stateName, state));
    }

    const results = await query.orderBy(asc(districts.districtName));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}