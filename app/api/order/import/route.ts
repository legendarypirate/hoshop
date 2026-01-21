import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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
        // Extract data from row with flexible column matching
        // Phone can be in дугаар column or утас column
        let phoneValue = getColumnValue(row, [
          'дугаар', 'Дугаар', 'DUGAAR', 'Dugaar',
          'Утас', 'phone', 'Phone', 'утас', 'Утасны дугаар', 'утасны дугаар',
          'Утасны', 'утасны', 'Phone Number', 'phone_number', 'PHONE',
          'Телефон', 'телефон', 'Tel', 'tel', 'Telephone', 'telephone'
        ]);
        
        const phone = phoneValue !== null && phoneValue !== undefined 
          ? String(phoneValue).trim() 
          : '';
        const kod = String(getColumnValue(row, ['код', 'Код', 'kod', 'Kod', 'Барааны код', 'КОД']) || '').trim();
        const price = getColumnValue(row, ['үнэ', 'Үнэ', 'price', 'Price', 'PRICE']);
        // тайлбар maps to feature (description)
        const feature = String(getColumnValue(row, [
          'тайлбар', 'Тайлбар', 'TAILBAR', 'Tailbar',
          'Онцлог', 'feature', 'Feature', 'онцлог', 'FEATURE'
        ]) || '').trim() || null;
        // nemelt tailbar maps to comment (additional notes)
        const comment = String(getColumnValue(row, [
          'nemelt tailbar', 'Nemelt tailbar', 'NEMELT TAILBAR',
          'нэмэлт тайлбар', 'Нэмэлт тайлбар', 'НЭМЭЛТ ТАЙЛБАР',
          'comment', 'Comment', 'COMMENT', 'Тайлбар', 'тайлбар'
        ]) || '').trim() || null;
        const number = getColumnValue(row, ['Тоо', 'тоо', 'TOO', 'Too', 'Тоо ширхэг', 'тоо ширхэг', 'number', 'Number', 'NUMBER']);
        // Гүйлгээ хийсэн огноо maps to order_date
        const orderDate = getColumnValue(row, [
          'Гүйлгээ хийсэн огноо', 'гүйлгээ хийсэн огноо', 'ГҮЙЛГЭЭ ХИЙСЭН ОГНОО',
          'Захиалгын огноо', 'order_date', 'Order Date', 'захиалгын огноо'
        ]);
        // Тоо өгсөн огноо maps to paid_date
        const paidDate = getColumnValue(row, [
          'Тоо өгсөн огноо', 'тоо өгсөн огноо', 'ТОО ӨГСӨН ОГНОО',
          'Төлбөрийн огноо', 'paid_date', 'Paid Date', 'төлбөрийн огноо'
        ]);
        // Ирж авсан maps to received_date
        const receivedDate = getColumnValue(row, [
          'Ирж авсан', 'ирж авсан', 'ИРЖ АВСАН',
          'Ирж авсан огноо', 'received_date', 'Received Date', 'ирж авсан огноо'
        ]);
        const withDeliveryValue = getColumnValue(row, ['Хүргэлттэй', 'with_delivery', 'With Delivery', 'хүргэлттэй']);

        // Validate required fields
        if (!phone || phone === '') {
          results.failed++;
          const availableCols = Object.keys(row).join(', ');
          results.errors.push(`Мөр ${rowNum}: Утасны дугаар оруулах шаардлагатай${availableCols ? ` (Олдсон багана: ${availableCols})` : ''}`);
          continue;
        }

        if (!kod) {
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

