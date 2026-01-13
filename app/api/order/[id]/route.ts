import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update an order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      phone,
      baraanii_kod_id,
      price,
      feature,
      number,
      order_date,
      paid_date,
      withDelivery,
      comment,
    } = body;

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: 'Phone is required' },
        { status: 400 }
      );
    }

    if (!baraanii_kod_id) {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE order_table SET
        phone = $1,
        baraanii_kod_id = $2,
        price = $3,
        feature = $4,
        number = $5,
        order_date = $6,
        paid_date = $7,
        with_delivery = $8,
        comment = $9
      WHERE id = $10 RETURNING *`,
      [
        phone.trim(),
        baraanii_kod_id,
        price || null,
        feature || null,
        number || null,
        order_date || null,
        paid_date || null,
        withDelivery || false,
        comment || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      'DELETE FROM order_table WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}

