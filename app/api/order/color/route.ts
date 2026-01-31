import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update price column color (metadata.toollogo) for multiple orders
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds, color } = body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs are required' },
        { status: 400 }
      );
    }

    // color: 'blue' means toollogo = 3, 'white' means toollogo = null or remove it
    if (color !== 'blue' && color !== 'white') {
      return NextResponse.json(
        { error: 'Valid color is required (blue or white)' },
        { status: 400 }
      );
    }

    const toollogoValue = color === 'blue' ? 3 : null;

    // Update metadata for each order
    // We need to preserve existing metadata and only update toollogo
    const placeholders = orderIds.map((_, index) => `$${index + 1}`).join(', ');
    
    // First, get current metadata for all orders
    const getMetadataQuery = `SELECT id, metadata FROM order_table WHERE id IN (${placeholders})`;
    const metadataResult = await pool.query(getMetadataQuery, orderIds);

    // Update each order's metadata
    const updatePromises = metadataResult.rows.map(async (row: any) => {
      let metadata = row.metadata;
      
      // Ensure metadata is an object
      if (!metadata || typeof metadata !== 'object') {
        metadata = {};
      } else if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch {
          metadata = {};
        }
      }

      // Update price_toollogo (separate from toollogo used for барааны код column)
      if (toollogoValue === null) {
        // Remove price_toollogo from metadata
        delete metadata.price_toollogo;
      } else {
        metadata.price_toollogo = toollogoValue;
      }

      // If metadata is now empty, set it to null, otherwise keep it as JSONB
      const metadataValue = Object.keys(metadata).length === 0 ? null : JSON.stringify(metadata);

      await pool.query(
        `UPDATE order_table 
         SET metadata = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [metadataValue, row.id]
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'Price column color updated successfully',
      updated: orderIds.length,
    });
  } catch (error: any) {
    console.error('Error updating price column color:', error);
    return NextResponse.json(
      { error: 'Failed to update price column color' },
      { status: 500 }
    );
  }
}

