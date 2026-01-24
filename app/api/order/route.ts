import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let query = `
      SELECT o.*, 
        bk.kod as baraanii_kod_name,
        c.name as color_name,
        s.name as size_name,
        COALESCE(o.status, 1) as status
      FROM order_table o
      LEFT JOIN baraanii_kod bk ON o.baraanii_kod_id = bk.id
      LEFT JOIN colors c ON o.color_id = c.id
      LEFT JOIN sizes s ON o.size_id = s.id
    `;
    
    const queryParams: any[] = [];
    if (type) {
      query += ` WHERE o.type = $1`;
      queryParams.push(parseInt(type));
    }
    
    // For type 1 (live), order by display_order first, then by created_at
    // For other types, order by order_date and created_at
    if (type === '1') {
      query += ` ORDER BY 
        CASE WHEN o.display_order IS NULL THEN 1 ELSE 0 END,
        o.display_order ASC NULLS LAST,
        o.created_at DESC`;
    } else {
      query += ` ORDER BY o.order_date DESC, o.created_at DESC`;
    }
    
    const result = await pool.query(query, queryParams);
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
      color_id,
      size_id,
      price,
      feature,
      number,
      order_date,
      paid_date,
      received_date,
      withDelivery,
      comment,
      type,
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

    // Default to type 1 if not provided
    const orderType = type || 1;

    const result = await pool.query(
      `INSERT INTO order_table (
        phone, baraanii_kod_id, color_id, size_id, price, feature, number, 
        order_date, paid_date, received_date, with_delivery, comment, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        phone.trim(),
        baraanii_kod_id,
        color_id || null,
        size_id || null,
        price || null,
        feature || null,
        number || null,
        order_date || null,
        paid_date || null,
        received_date || null,
        withDelivery || false,
        comment || null,
        orderType,
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

