import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch column mappings for a specific import type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const importType = searchParams.get('type'); // 'live' or 'order'

    if (!importType || !['live', 'order'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be "live" or "order"' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT field_name, column_names, is_required, display_order 
       FROM import_column_mappings 
       WHERE import_type = $1 
       ORDER BY COALESCE(display_order, 999), field_name`,
      [importType]
    );

    // Parse column_names JSON and format response
    const mappings = result.rows
      .map((row) => {
        try {
          const parsed = JSON.parse(row.column_names);
          // Validate that parsed value is an array
          if (!Array.isArray(parsed)) {
            console.error(`Invalid column_names format for ${row.field_name}: expected array`);
            return null;
          }
          // Validate array contains only strings
          if (!parsed.every(item => typeof item === 'string')) {
            console.error(`Invalid column_names format for ${row.field_name}: array must contain only strings`);
            return null;
          }
          return {
            fieldName: row.field_name,
            columnNames: parsed,
            isRequired: row.is_required,
            displayOrder: row.display_order,
          };
        } catch (error) {
          console.error(`Error parsing column_names for ${row.field_name}:`, error);
          return null;
        }
      })
      .filter((mapping) => mapping !== null);

    return NextResponse.json({ mappings });
  } catch (error: any) {
    console.error('Error fetching column mappings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch column mappings' },
      { status: 500 }
    );
  }
}

// POST - Save column mappings for a specific import type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { importType, mappings } = body;

    if (!importType || !['live', 'order'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be "live" or "order"' },
        { status: 400 }
      );
    }

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Mappings must be an array' },
        { status: 400 }
      );
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Delete existing mappings for this import type
      await pool.query('DELETE FROM import_column_mappings WHERE import_type = $1', [importType]);

      // Insert new mappings
      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        if (!mapping.fieldName || !Array.isArray(mapping.columnNames)) {
          throw new Error('Invalid mapping format');
        }

        await pool.query(
          `INSERT INTO import_column_mappings (import_type, field_name, column_names, is_required, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            importType,
            mapping.fieldName,
            JSON.stringify(mapping.columnNames),
            mapping.isRequired || false,
            mapping.displayOrder || i + 1,
          ]
        );
      }

      await pool.query('COMMIT');
      return NextResponse.json({ message: 'Column mappings saved successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error saving column mappings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save column mappings' },
      { status: 500 }
    );
  }
}

