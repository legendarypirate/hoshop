import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE - Revert an import batch (delete all orders from that batch)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = await pool.connect();
  
  try {
    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return NextResponse.json(
        { error: 'Буруу импорт ID' },
        { status: 400 }
      );
    }

    // Check if batch exists
    const batchResult = await client.query(
      'SELECT id, import_type, file_name FROM import_batches WHERE id = $1',
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Импорт олдсонгүй' },
        { status: 404 }
      );
    }

    const batch = batchResult.rows[0];

    // Start transaction
    await client.query('BEGIN');

    try {
      // Count orders that will be deleted
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM order_table WHERE import_batch_id = $1',
        [batchId]
      );
      const orderCount = parseInt(countResult.rows[0].count);

      // Delete all orders from this batch
      await client.query(
        'DELETE FROM order_table WHERE import_batch_id = $1',
        [batchId]
      );

      // Delete the import batch record
      await client.query(
        'DELETE FROM import_batches WHERE id = $1',
        [batchId]
      );

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        message: 'Импорт амжилттай устгалаа',
        deleted_orders: orderCount,
        batch: {
          id: batch.id,
          import_type: batch.import_type,
          file_name: batch.file_name,
        },
      });
    } catch (error: any) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error reverting import:', error);
    return NextResponse.json(
      { error: error.message || 'Импортыг устгахад алдаа гарлаа' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET - Get details of a specific import batch
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batchId = parseInt(id);

    if (isNaN(batchId)) {
      return NextResponse.json(
        { error: 'Буруу импорт ID' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
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
      WHERE ib.id = $1
      GROUP BY ib.id, ib.import_type, ib.file_name, ib.total_rows, ib.successful_rows, ib.failed_rows, ib.created_at, ib.created_by, u.phone`,
      [batchId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Импорт олдсонгүй' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching import batch:', error);
    return NextResponse.json(
      { error: error.message || 'Импортыг авахад алдаа гарлаа' },
      { status: 500 }
    );
  }
}

