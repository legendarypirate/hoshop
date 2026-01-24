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
        if (!Array.isArray(parsed)) {
          console.error(`Invalid column_names format for ${row.field_name}: expected array`);
          return;
        }
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
      }
    });
  } catch (error) {
    console.error('Error loading column mappings, using defaults:', error);
  }

  if (mappings.size === 0) {
    const defaults: { [key: string]: string[] } = {
      phone: ['дугаар', 'Дугаар', 'DUGAAR', 'Dugaar', 'Утас', 'phone', 'Phone', 'утас', 'Утасны дугаар', 'утасны дугаар', 'Утасны', 'утасны', 'Phone Number', 'phone_number', 'PHONE', 'Телефон', 'телефон', 'Tel', 'tel', 'Telephone', 'telephone'],
      kod: ['код', 'Код', 'kod', 'Kod', 'Барааны код', 'КОД', 'барааны код'],
      price: ['үнэ', 'Үнэ', 'price', 'Price', 'PRICE'],
      feature: ['тайлбар', 'Тайлбар', 'TAILBAR', 'Tailbar', 'Онцлог', 'feature', 'Feature', 'онцлог', 'FEATURE'],
      comment: ['nemelt tailbar', 'Nemelt tailbar', 'NEMELT TAILBAR', 'нэмэлт тайлбар', 'Нэмэлт тайлбар', 'НЭМЭЛТ ТАЙЛБАР', 'comment', 'Comment', 'COMMENT'],
      number: ['Тоо', 'тоо', 'TOO', 'Too', 'Тоо ширхэг', 'тоо ширхэг', 'number', 'Number', 'NUMBER'],
      order_date: ['Захиалгын огноо', 'захиалгын огноо', 'ЗАХИАЛГЫН ОГНОО', 'order_date', 'Order Date', 'order date', 'Order date', 'ORDER_DATE'],
      received_date: ['Ирж авсан', 'ирж авсан', 'ИРЖ АВСАН', 'Ирж авсан огноо', 'ирж авсан огноо', 'received_date', 'Received Date'],
      paid_date: ['Гүйлгээний огноо', 'гүйлгээний огноо', 'ГҮЙЛГЭЭНИЙ ОГНОО', 'paid_date', 'Paid Date', 'paid date', 'PAID_DATE', 'Transaction Date', 'transaction_date'],
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
    const XLSX = require('xlsx');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл оруулах шаардлагатай' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Excel файл хоосон эсвэл буруу форматтай байна' },
        { status: 400 }
      );
    }

    const columnMappings = await loadColumnMappings('live');

    // Debug: Log first row to see what columns are available
    if (data.length > 0) {
      console.log('Available columns in Excel:', Object.keys(data[0]));
      console.log('First row data:', data[0]);
    }

    const normalizeString = (str: string): string => {
      return str.replace(/\s+/g, '').toLowerCase();
    };

    const getColumnValue = (row: any, possibleNames: string[]): any => {
      const rowKeys = Object.keys(row);
      
      // First try exact match (case-sensitive)
      for (const name of possibleNames) {
        if (rowKeys.includes(name)) {
          const value = row[name];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
      }
      
      // Try exact match (case-insensitive, trimmed)
      for (const name of possibleNames) {
        const nameTrimmed = name.trim();
        const found = rowKeys.find(key => key.trim() === nameTrimmed);
        if (found) {
          const value = row[found];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
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

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2;

      try {
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
        const receivedDate = getMappedValue('received_date');
        const paidDate = getMappedValue('paid_date');
        const withDeliveryValue = getMappedValue('with_delivery');

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

        let baraaniiKodId: number | undefined = undefined;
        if (kod && kod.trim() !== '') {
          baraaniiKodId = kodMap.get(kod.toLowerCase().trim());
          if (!baraaniiKodId) {
            try {
              const insertResult = await pool.query(
                'INSERT INTO baraanii_kod (kod) VALUES ($1) ON CONFLICT (kod) DO UPDATE SET kod = EXCLUDED.kod RETURNING id',
                [kod.trim()]
              );
              const newId = insertResult.rows[0]?.id;
              if (newId === undefined) {
                results.failed++;
                results.errors.push(`Мөр ${rowNum}: Барааны код үүсгэхэд алдаа гарлаа`);
                continue;
              }
              baraaniiKodId = newId;
              kodMap.set(kod.toLowerCase().trim(), newId);
            } catch (error: any) {
              results.failed++;
              results.errors.push(`Мөр ${rowNum}: Барааны код үүсгэхэд алдаа: ${error.message || 'Алдаа гарлаа'}`);
              continue;
            }
          }
        }

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

        const parseDate = (dateValue: any): string | null => {
          if (!dateValue) return null;
          
          // Helper function to format date as YYYY-MM-DD using local timezone
          const formatDateLocal = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          if (typeof dateValue === 'string') {
            const dateStr = dateValue.trim();
            if (!dateStr) return null;
            
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
                const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year;
                const date = new Date(fullYear, month, day);
                if (!isNaN(date.getTime())) {
                  return formatDateLocal(date);
                }
              }
            }
            
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return formatDateLocal(date);
            }
          } else if (typeof dateValue === 'number') {
            // Excel date serial number (days since 1900-01-01, but Excel incorrectly treats 1900 as leap year)
            // Excel epoch is actually 1899-12-30
            const excelEpoch = new Date(1899, 11, 30);
            const date = new Date(excelEpoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
            if (!isNaN(date.getTime())) {
              return formatDateLocal(date);
            }
          } else if (dateValue instanceof Date) {
            if (!isNaN(dateValue.getTime())) {
              return formatDateLocal(dateValue);
            }
          }
          
          return null;
        };

        const parsedPrice = parsePrice(price);
        const parsedNumber = number ? parseInt(String(number)) : null;
        const parsedOrderDate = parseDate(orderDate);
        const parsedReceivedDate = parseDate(receivedDate);
        const parsedPaidDate = parseDate(paidDate);
        const withDelivery = withDeliveryValue ? 
          (String(withDeliveryValue).toLowerCase() === 'тийм' || 
           String(withDeliveryValue).toLowerCase() === 'yes' || 
           String(withDeliveryValue).toLowerCase() === 'true' ||
           String(withDeliveryValue) === '1') : false;

        // Validate that we have at least phone or kod (one should be present)
        if ((!phone || phone === '') && (!kod || kod === '')) {
          results.failed++;
          const availableCols = Object.keys(row).join(', ');
          results.errors.push(`Мөр ${rowNum}: Утасны дугаар эсвэл Барааны код заавал байх ёстой${availableCols ? ` (Олдсон багана: ${availableCols})` : ''}`);
          continue;
        }

        await pool.query(
          `INSERT INTO order_table (
            phone, baraanii_kod_id, price, comment, number,
            order_date, received_date, paid_date, feature, with_delivery, status, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            phone || null,
            baraaniiKodId || null,
            parsedPrice,
            comment,
            parsedNumber,
            parsedOrderDate,
            parsedReceivedDate,
            parsedPaidDate,
            feature,
            withDelivery,
            1,
            1,
          ]
        );

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Мөр ${rowNum}: ${error.message || 'Алдаа гарлаа'}`);
      }
    }

    // If no rows were successfully imported, return error
    if (results.success === 0 && results.failed > 0) {
      return NextResponse.json(
        {
          error: 'Импорт амжилтгүй',
          message: `Бүх мөр амжилтгүй боллоо (${results.failed} мөр)`,
          success: results.success,
          failed: results.failed,
          errors: results.errors.slice(0, 50),
        },
        { status: 400 }
      );
    }

    // If no rows at all were processed, return error
    if (results.success === 0 && results.failed === 0) {
      return NextResponse.json(
        {
          error: 'Импорт амжилтгүй',
          message: 'Ямар ч мөр олдсонгүй эсвэл боловсруулаагүй',
          success: 0,
          failed: 0,
          errors: [],
        },
        { status: 400 }
      );
    }

    // Return success with details
    return NextResponse.json({
      message: results.failed > 0 
        ? `Импорт хэсэгчлэн амжилттай (${results.success} амжилттай, ${results.failed} амжилтгүй)`
        : 'Импорт амжилттай',
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 50),
    });
  } catch (error: any) {
    console.error('Error importing Excel:', error);
    return NextResponse.json(
      { error: error.message || 'Excel файл импортлоход алдаа гарлаа' },
      { status: 500 }
    );
  }
}

