import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT i.*,
        bk.kod as baraanii_kod_name,
        c.name as color_name,
        s.name as size_name
      FROM items i
      LEFT JOIN baraanii_kod bk ON i.baraanii_kod_id = bk.id
      LEFT JOIN colors c ON i.color_id = c.id
      LEFT JOIN sizes s ON i.size_id = s.id
      WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...result.rows[0],
      baraanii_kod_name: result.rows[0].baraanii_kod_name || result.rows[0].baraanii_kod_id,
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PUT - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { baraanii_kod_id, color_id, size_id, initial_balance, final_balance, info } = body;

    const result = await pool.query(
      `UPDATE items SET
        baraanii_kod_id = COALESCE($1, baraanii_kod_id),
        color_id = $2,
        size_id = $3,
        initial_balance = $4,
        final_balance = $5,
        info = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 RETURNING *`,
      [
        baraanii_kod_id || null,
        color_id || null,
        size_id || null,
        initial_balance || 0,
        final_balance || 0,
        info || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

