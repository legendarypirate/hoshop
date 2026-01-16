import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch movements for a specific item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const movementType = searchParams.get('movement_type');

    let query = `
      SELECT im.*,
        u.phone as user_phone
      FROM item_movements im
      LEFT JOIN users u ON im.user_id = u.id
      WHERE im.item_id = $1
    `;
    const params_array: any[] = [id];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND im.created_at >= $${paramIndex}`;
      params_array.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND im.created_at <= $${paramIndex}`;
      params_array.push(endDate + ' 23:59:59');
      paramIndex++;
    }

    if (movementType) {
      query += ` AND im.movement_type = $${paramIndex}`;
      params_array.push(movementType);
      paramIndex++;
    }

    query += ` ORDER BY im.created_at DESC`;

    const result = await pool.query(query, params_array);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching item movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item movements' },
      { status: 500 }
    );
  }
}

