import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all items with balances
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baraaniiKodId = searchParams.get('baraanii_kod_id');
    const colorId = searchParams.get('color_id');
    const sizeId = searchParams.get('size_id');

    let query = `
      SELECT i.*,
        bk.kod as baraanii_kod_name,
        c.name as color_name,
        s.name as size_name
      FROM items i
      LEFT JOIN baraanii_kod bk ON i.baraanii_kod_id = bk.id
      LEFT JOIN colors c ON i.color_id = c.id
      LEFT JOIN sizes s ON i.size_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (baraaniiKodId) {
      query += ` AND i.baraanii_kod_id = $${paramIndex}`;
      params.push(baraaniiKodId);
      paramIndex++;
    }

    if (colorId) {
      query += ` AND i.color_id = $${paramIndex}`;
      params.push(colorId);
      paramIndex++;
    }

    if (sizeId) {
      query += ` AND i.size_id = $${paramIndex}`;
      params.push(sizeId);
      paramIndex++;
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST - Create or update an item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      baraanii_kod_id,
      color_id,
      size_id,
      initial_balance,
      final_balance,
      info,
    } = body;

    if (!baraanii_kod_id) {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    // Check if item already exists
    const checkResult = await pool.query(
      `SELECT id FROM items 
       WHERE baraanii_kod_id = $1 
       AND (color_id = $2 OR (color_id IS NULL AND $2 IS NULL))
       AND (size_id = $3 OR (size_id IS NULL AND $3 IS NULL))`,
      [baraanii_kod_id, color_id || null, size_id || null]
    );

    if (checkResult.rows.length > 0) {
      // Update existing item
      const result = await pool.query(
        `UPDATE items SET
          initial_balance = $1,
          final_balance = $2,
          info = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 RETURNING *`,
        [
          initial_balance || 0,
          final_balance || 0,
          info || null,
          checkResult.rows[0].id,
        ]
      );
      return NextResponse.json(result.rows[0]);
    } else {
      // Create new item
      const result = await pool.query(
        `INSERT INTO items (
          baraanii_kod_id, color_id, size_id, initial_balance, final_balance, info
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          baraanii_kod_id,
          color_id || null,
          size_id || null,
          initial_balance || 0,
          final_balance || 0,
          info || null,
        ]
      );
      return NextResponse.json(result.rows[0], { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating/updating item:', error);
    return NextResponse.json(
      { error: 'Failed to create/update item' },
      { status: 500 }
    );
  }
}

