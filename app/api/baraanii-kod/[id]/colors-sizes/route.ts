import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch colors and sizes for a specific baraanii_kod
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get colors for this baraanii_kod
    const colorsResult = await pool.query(
      `SELECT DISTINCT c.id, c.name 
       FROM colors c
       INNER JOIN baraanii_kod_options bko ON c.id = bko.color_id
       WHERE bko.baraanii_kod_id = $1 AND bko.color_id IS NOT NULL
       ORDER BY c.name ASC`,
      [id]
    );

    // Get sizes for this baraanii_kod
    const sizesResult = await pool.query(
      `SELECT DISTINCT s.id, s.name 
       FROM sizes s
       INNER JOIN baraanii_kod_options bko ON s.id = bko.size_id
       WHERE bko.baraanii_kod_id = $1 AND bko.size_id IS NOT NULL
       ORDER BY s.name ASC`,
      [id]
    );

    return NextResponse.json({
      colors: colorsResult.rows,
      sizes: sizesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching colors and sizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors and sizes' },
      { status: 500 }
    );
  }
}

// POST - Add color and/or size to a baraanii_kod
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { color_id, size_id } = body;

    if (!color_id && !size_id) {
      return NextResponse.json(
        { error: 'At least one of color_id or size_id is required' },
        { status: 400 }
      );
    }

    // Check if this exact combination already exists
    const existingResult = await pool.query(
      `SELECT id FROM baraanii_kod_options 
       WHERE baraanii_kod_id = $1 
       AND (color_id = $2 OR (color_id IS NULL AND $2 IS NULL))
       AND (size_id = $3 OR (size_id IS NULL AND $3 IS NULL))`,
      [id, color_id || null, size_id || null]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'This color/size combination already exists for this product code' },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `INSERT INTO baraanii_kod_options (baraanii_kod_id, color_id, size_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [id, color_id || null, size_id || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error adding color/size to baraanii_kod:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This combination already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add color/size' },
      { status: 500 }
    );
  }
}

