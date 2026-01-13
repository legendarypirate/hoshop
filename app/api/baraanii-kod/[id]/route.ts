import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update a product code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { kod } = body;

    if (!kod || kod.trim() === '') {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE baraanii_kod SET kod = $1 WHERE id = $2 RETURNING *',
      [kod.trim(), id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating product code:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update product code' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM baraanii_kod WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Product code deleted successfully' });
  } catch (error) {
    console.error('Error deleting product code:', error);
    return NextResponse.json(
      { error: 'Failed to delete product code' },
      { status: 500 }
    );
  }
}

