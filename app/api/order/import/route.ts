import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Load column mappings from database, fallback to defaults
async function loadColumnMappings(importType: 'live' | 'order'): Promise<Map<string, { columnNames: string[]; isRequired: boolean }>> {
  const mappings = new Map<string, { columnNames: string[]; isRequired: boolean }>();
  
  try {
    const result = await pool.query(
      'SELECT field_name, column_names, is_required FROM import_column_mappings WHERE import_type = $1',
      [importType]
    );

    result.rows.forEach((row) => {
      try {
        const parsed = JSON.parse(row.column_names);
        // Validate that parsed value is an array
        if (!Array.isArray(parsed)) {
          console.error(`Invalid column_names format for ${row.field_name}: expected array`);
          return;
        }
        // Validate array contains only strings
        if (!parsed.every(item => typeof item === 'string')) {
          console.error(`Invalid column_names format for ${row.field_name}: array must contain only strings`);
          return;
        }
        mappings.set(row.field_name, {
          columnNames: parsed,
          isRequired: row.is_required,
        });
      } catch (error) {
        console.error(`Error parsing column_names for ${row.field_name}:`, error);
        // Skip invalid entries instead of crashing
      }
    });
  } catch (error) {
    console.error('Error loading column mappings, using defaults:', error);
  }

  // Fallback to defaults if no mappings found
  if (mappings.size === 0) {
    const defaults: { [key: string]: string[] } = {
      phone: ['дугаар', 'Дугаар', 'DUGAAR', 'Dugaar', 'Утас', 'phone', 'Phone', 'утас', 'Утасны дугаар', 'утасны дугаар', 'Утасны', 'утасны', 'Phone Number', 'phone_number', 'PHONE', 'Телефон', 'телефон', 'Tel', 'tel', 'Telephone', 'telephone'],
      kod: ['код', 'Код', 'kod', 'Kod', 'Барааны код', 'КОД'],
      price: ['үнэ', 'Үнэ', 'price', 'Price', 'PRICE'],
      feature: ['тайлбар', 'Тайлбар', 'TAILBAR', 'Tailbar', 'Онцлог', 'feature', 'Feature', 'онцлог', 'FEATURE'],
      comment: ['nemelt tailbar', 'Nemelt tailbar', 'NEMELT TAILBAR', 'нэмэлт тайлбар', 'Нэмэлт тайлбар', 'НЭМЭЛТ ТАЙЛБАР', 'comment', 'Comment', 'COMMENT', 'Тайлбар', 'тайлбар'],
      number: ['Тоо', 'тоо', 'TOO', 'Too', 'Тоо ширхэг', 'тоо ширхэг', 'number', 'Number', 'NUMBER'],
      order_date: ['Гүйлгээ хийсэн огноо', 'гүйлгээ хийсэн огноо', 'ГҮЙЛГЭЭ ХИЙСЭН ОГНОО', 'Захиалгын огноо', 'order_date', 'Order Date', 'захиалгын огноо'],
      paid_date: ['Тоо өгсөн огноо', 'тоо өгсөн огноо', 'ТОО ӨГСӨН ОГНОО', 'Төлбөрийн огноо', 'paid_date', 'Paid Date', 'төлбөрийн огноо'],
      received_date: ['Ирж авсан', 'ирж авсан', 'ИРЖ АВСАН', 'Ирж авсан огноо', 'received_date', 'Received Date', 'ирж авсан огноо'],
      with_delivery: ['Хүргэлттэй', 'with_delivery', 'With Delivery', 'хүргэлттэй'],
    };

    Object.entries(defaults).forEach(([fieldName, columnNames]) => {
      mappings.set(fieldName, {
        columnNames,
        isRequired: fieldName === 'phone' || fieldName === 'kod',
      });
    });
  }

  return mappings;
}

export async function POST(request: NextRequest) {
  try {
    // Use require for xlsx (CommonJS module) - works in Next.js API routes
    const XLSX = require('xlsx');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл оруулах шаардлагатай' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // Use raw: true to preserve numbers (phone numbers might be numbers in Excel)
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Excel файл хоосон эсвэл буруу форматтай байна' },
        { status: 400 }
      );
    }

    // Load column mappings
    const columnMappings = await loadColumnMappings('order');

    // Helper function to normalize string for comparison (remove all whitespace)
    const normalizeString = (str: string): string => {
      return str.replace(/\s+/g, '').toLowerCase();
    };

    // Helper function to find column value with flexible matching
    const getColumnValue = (row: any, possibleNames: string[]): any => {
      const rowKeys = Object.keys(row);
      
      // First try exact match
      for (const name of possibleNames) {
        const value = row[name];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
      
      // Try normalized matching (remove all whitespace for comparison)
      for (const name of possibleNames) {
        const nameNormalized = normalizeString(name);
        const found = rowKeys.find(key => {
          const keyNormalized = normalizeString(key);
          return keyNormalized === nameNormalized || 
                 keyNormalized.includes(nameNormalized) ||
                 nameNormalized.includes(keyNormalized);
        });
        if (found) {
          const value = row[found];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
      
      // Try case-insensitive and trimmed matching (fallback)
      for (const name of possibleNames) {
        const nameLower = name.trim().toLowerCase();
        const found = rowKeys.find(key => {
          const keyTrimmed = key.trim();
          const keyLower = keyTrimmed.toLowerCase();
          return keyLower === nameLower || 
                 keyTrimmed === name.trim();
        });
        if (found) {
          const value = row[found];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
      
      return null;
    };

    // Get all baraanii_kod for mapping
    const kodResult = await pool.query('SELECT id, kod FROM baraanii_kod');
    const kodMap = new Map<string, number>();
    kodResult.rows.forEach((row: { id: number; kod: string }) => {
      kodMap.set(row.kod.toLowerCase().trim(), row.id);
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract data from row using configured column mappings
        const getMappedValue = (fieldName: string): any => {
          const mapping = columnMappings.get(fieldName);
          if (!mapping) return null;
          return getColumnValue(row, mapping.columnNames);
        };

        const phone = String(getMappedValue('phone') || '').trim();
        const kod = String(getMappedValue('kod') || '').trim();
        const price = getMappedValue('price');
        const feature = String(getMappedValue('feature') || '').trim() || null;
        const comment = String(getMappedValue('comment') || '').trim() || null;
        const number = getMappedValue('number');
        const orderDate = getMappedValue('order_date');
        const paidDate = getMappedValue('paid_date');
        const receivedDate = getMappedValue('received_date');
        const withDeliveryValue = getMappedValue('with_delivery');

        // Validate required fields based on configured mappings
        const phoneMapping = columnMappings.get('phone');
        if (phoneMapping?.isRequired && (!phone || phone === '')) {
          results.failed++;
          const availableCols = Object.keys(row).join(', ');
          results.errors.push(`Мөр ${rowNum}: Утасны дугаар оруулах шаардлагатай${availableCols ? ` (Олдсон багана: ${availableCols})` : ''}`);
          continue;
        }

        const kodMapping = columnMappings.get('kod');
        if (kodMapping?.isRequired && !kod) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: Барааны код оруулах шаардлагатай`);
          continue;
        }

        // Find or create baraanii_kod
        let baraaniiKodId = kodMap.get(kod.toLowerCase());
        if (!baraaniiKodId) {
          // Create new baraanii_kod
          const insertResult = await pool.query(
            'INSERT INTO baraanii_kod (kod) VALUES ($1) ON CONFLICT (kod) DO UPDATE SET kod = EXCLUDED.kod RETURNING id',
            [kod]
          );
          const newId = insertResult.rows[0]?.id;
          if (newId === undefined) {
            results.failed++;
            results.errors.push(`Мөр ${rowNum}: Барааны код үүсгэхэд алдаа гарлаа`);
            continue;
          }
          baraaniiKodId = newId;
          kodMap.set(kod.toLowerCase(), newId);
        }
        
        // At this point, baraaniiKodId is guaranteed to be a number
        if (baraaniiKodId === undefined) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: Барааны код олдсонгүй`);
          continue;
        }

        // Parse price
        const parsePrice = (priceValue: any): number | null => {
          if (!priceValue) return null;
          const priceStr = String(priceValue).trim();
          if (!priceStr) return null;
          
          if (priceStr.toLowerCase().endsWith('k')) {
            const numValue = parseFloat(priceStr.slice(0, -1));
            if (!isNaN(numValue)) {
              return numValue * 1000;
            }
          }
          
          const numValue = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
          if (!isNaN(numValue)) {
            return numValue;
          }
          
          return null;
        };

        // Parse dates
        const parseDate = (dateValue: any): string | null => {
          if (!dateValue) return null;
          
          if (typeof dateValue === 'string') {
            const dateStr = dateValue.trim();
            if (!dateStr) return null;
            
            // Handle formats like "23-Nov", "20-Nov", "11-Dec" (DD-MMM format)
            const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[-/](\w{3})(?:[-/](\d{2,4}))?$/i);
            if (ddmmyyyyMatch) {
              const day = parseInt(ddmmyyyyMatch[1]);
              const monthStr = ddmmyyyyMatch[2].toLowerCase();
              const year = ddmmyyyyMatch[3] ? parseInt(ddmmyyyyMatch[3]) : new Date().getFullYear();
              
              const monthMap: { [key: string]: number } = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
              };
              
              const month = monthMap[monthStr];
              if (month !== undefined) {
                // Handle 2-digit years
                const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
                const date = new Date(fullYear, month, day);
                if (!isNaN(date.getTime())) {
                  return date.toISOString().split('T')[0];
                }
              }
            }
            
            // Try standard date parsing
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          } else if (typeof dateValue === 'number') {
            // Excel date serial number
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
          }
          
          return null;
        };

        // Parse final values
        const parsedPrice = parsePrice(price);
        const parsedNumber = number ? parseInt(String(number)) : null;
        const parsedOrderDate = parseDate(orderDate);
        const parsedPaidDate = parseDate(paidDate);
        const parsedReceivedDate = parseDate(receivedDate);
        const withDelivery = withDeliveryValue ? 
          (String(withDeliveryValue).toLowerCase() === 'тийм' || 
           String(withDeliveryValue).toLowerCase() === 'yes' || 
           String(withDeliveryValue).toLowerCase() === 'true' ||
           String(withDeliveryValue) === '1') : false;

        // Insert order with default status = 1 (шинэ үүссэн) and type = 2 (order menu)
        await pool.query(
          `INSERT INTO order_table (
            phone, baraanii_kod_id, price, comment, number,
            order_date, paid_date, received_date, feature, with_delivery, status, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            phone,
            baraaniiKodId,
            parsedPrice,
            comment,
            parsedNumber,
            parsedOrderDate,
            parsedPaidDate,
            parsedReceivedDate,
            feature,
            withDelivery,
            1, // Default status: шинэ үүссэн
            2, // Type: order menu
          ]
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Мөр ${rowNum}: ${error.message || 'Алдаа гарлаа'}`);
      }
    }

    return NextResponse.json({
      message: 'Импорт амжилттай',
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 50), // Limit to first 50 errors
    });
  } catch (error: any) {
    console.error('Error importing Excel:', error);
    return NextResponse.json(
      { error: error.message || 'Excel файл импортлоход алдаа гарлаа' },
      { status: 500 }
    );
  }
}

