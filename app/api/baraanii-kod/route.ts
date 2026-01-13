import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all product codes
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM baraanii_kod ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching product codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product codes' },
      { status: 500 }
    );
  }
}

// POST - Create a new product code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kod } = body;

    if (!kod || kod.trim() === '') {
      return NextResponse.json(
        { error: 'Product code is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO baraanii_kod (kod) VALUES ($1) RETURNING *',
      [kod.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating product code:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create product code' },
      { status: 500 }
    );
  }
}

