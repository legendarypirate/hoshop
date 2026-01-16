import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all sizes
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM sizes ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}

// POST - Create a new size
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO sizes (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating size:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Size already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create size' },
      { status: 500 }
    );
  }
}

