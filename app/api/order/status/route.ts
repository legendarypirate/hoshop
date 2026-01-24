import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update status for multiple orders
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds, status, date } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    if (!status || ![1, 2, 3].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (1, 2, or 3)' },
        { status: 400 }
      );
    }

    // If status is 3 (хүргэлтэнд гарсна) and date is provided, update received_date
    if (status === 3 && date) {
      const placeholders = orderIds.map((_, index) => `$${index + 3}`).join(', ');
      const result = await pool.query(
        `UPDATE order_table 
         SET status = $1, received_date = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id IN (${placeholders}) 
         RETURNING id, status, received_date`,
        [status, date, ...orderIds]
      );

      return NextResponse.json({
        message: 'Status updated successfully',
        updated: result.rows.length,
        orders: result.rows,
      });
    } else {
      // Update status only
      const placeholders = orderIds.map((_, index) => `$${index + 2}`).join(', ');
      const result = await pool.query(
        `UPDATE order_table 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id IN (${placeholders}) 
         RETURNING id, status`,
        [status, ...orderIds]
      );

      return NextResponse.json({
        message: 'Status updated successfully',
        updated: result.rows.length,
        orders: result.rows,
      });
    }
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

