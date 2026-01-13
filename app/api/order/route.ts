import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all orders
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT o.*, bk.kod as baraanii_kod_name
      FROM order_table o
      LEFT JOIN baraanii_kod bk ON o.baraanii_kod_id = bk.id
      ORDER BY o.order_date DESC, o.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  try {
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
      `INSERT INTO order_table (
        phone, baraanii_kod_id, price, feature, number, 
        order_date, paid_date, with_delivery, comment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
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
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

