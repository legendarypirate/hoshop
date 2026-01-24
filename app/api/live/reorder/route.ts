import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400 }
      );
    }

    // Update display_order for each order based on its position in the array
    // Use a transaction to ensure all updates succeed or fail together
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        await client.query(
          'UPDATE order_table SET display_order = $1 WHERE id = $2 AND type = 1',
          [i + 1, orderId]
        );
      }

      await client.query('COMMIT');
      
      return NextResponse.json({ 
        message: 'Order updated successfully',
        updated: orderIds.length 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error updating order positions:', error);
    return NextResponse.json(
      { error: 'Failed to update order positions' },
      { status: 500 }
    );
  }
}

