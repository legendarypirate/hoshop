import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - List all import batches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const importType = searchParams.get('type'); // 'live' or 'order' or null for all

    let query = `
      SELECT 
        ib.id,
        ib.import_type,
        ib.file_name,
        ib.total_rows,
        ib.successful_rows,
        ib.failed_rows,
        ib.created_at,
        ib.created_by,
        u.phone as created_by_phone,
        COUNT(ot.id) as actual_imported_count
      FROM import_batches ib
      LEFT JOIN users u ON ib.created_by = u.id
      LEFT JOIN order_table ot ON ot.import_batch_id = ib.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (importType) {
      params.push(importType);
      query += ` AND ib.import_type = $${params.length}`;
    }
    
    query += ` GROUP BY ib.id, ib.import_type, ib.file_name, ib.total_rows, ib.successful_rows, ib.failed_rows, ib.created_at, ib.created_by, u.phone
               ORDER BY ib.created_at DESC
               LIMIT 100`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching import batches:', error);
    return NextResponse.json(
      { error: error.message || 'Импортуудыг авахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

