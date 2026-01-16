import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Fetch item movements with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('item_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const movementType = searchParams.get('movement_type');

    let query = `
      SELECT im.*,
        i.baraanii_kod_id,
        bk.kod as baraanii_kod_name,
        c.name as color_name,
        s.name as size_name,
        u.phone as user_phone
      FROM item_movements im
      LEFT JOIN items i ON im.item_id = i.id
      LEFT JOIN baraanii_kod bk ON i.baraanii_kod_id = bk.id
      LEFT JOIN colors c ON i.color_id = c.id
      LEFT JOIN sizes s ON i.size_id = s.id
      LEFT JOIN users u ON im.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (itemId) {
      query += ` AND im.item_id = $${paramIndex}`;
      params.push(itemId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND im.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND im.created_at <= $${paramIndex}`;
      params.push(endDate + ' 23:59:59');
      paramIndex++;
    }

    if (movementType) {
      query += ` AND im.movement_type = $${paramIndex}`;
      params.push(movementType);
      paramIndex++;
    }

    query += ` ORDER BY im.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching item movements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item movements' },
      { status: 500 }
    );
  }
}

// POST - Create a new item movement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_id, movement_type, quantity, action_description } = body;
    
    // Get current user from session
    const session = await getSession();
    const user_id = session?.id || null;

    if (!item_id || !movement_type || !quantity) {
      return NextResponse.json(
        { error: 'Item ID, movement type, and quantity are required' },
        { status: 400 }
      );
    }

    if (!['incoming', 'outgoing', 'adjustment'].includes(movement_type)) {
      return NextResponse.json(
        { error: 'Movement type must be "incoming", "outgoing", or "adjustment"' },
        { status: 400 }
      );
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create movement
      const movementResult = await client.query(
        `INSERT INTO item_movements (
          item_id, user_id, movement_type, quantity, action_description
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          item_id,
          user_id || null,
          movement_type,
          quantity,
          action_description || null,
        ]
      );

      // Update item balance
      if (movement_type === 'incoming') {
        await client.query(
          `UPDATE items SET 
            final_balance = final_balance + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [quantity, item_id]
        );
      } else if (movement_type === 'outgoing') {
        await client.query(
          `UPDATE items SET 
            final_balance = final_balance - $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [quantity, item_id]
        );
      } else if (movement_type === 'adjustment') {
        // For adjustment, quantity is the new final balance
        await client.query(
          `UPDATE items SET 
            final_balance = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
          [quantity, item_id]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json(movementResult.rows[0], { status: 201 });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error creating item movement:', error);
    return NextResponse.json(
      { error: 'Failed to create item movement' },
      { status: 500 }
    );
  }
}

