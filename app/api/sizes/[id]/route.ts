import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update a size
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE sizes SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating size:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Size name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update size' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a size
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM sizes WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    return NextResponse.json(
      { error: 'Failed to delete size' },
      { status: 500 }
    );
  }
}

