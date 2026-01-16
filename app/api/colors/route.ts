import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all colors
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM colors ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}

// POST - Create a new color
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Color name is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO colors (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating color:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Color already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create color' },
      { status: 500 }
    );
  }
}

