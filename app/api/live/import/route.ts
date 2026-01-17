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
          // Handle both string and number values (phone can be a number in Excel)
          // Also handle 0 as a valid value (though unlikely for phone)
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

    // Helper to auto-detect phone column by checking if values look like phone numbers
    const detectPhoneColumn = (row: any, allRows: any[]): string | null => {
      const rowKeys = Object.keys(row);
      
      // Check each column to see if it contains phone-like data
      for (const key of rowKeys) {
        const value = row[key];
        if (value === null || value === undefined || value === '') continue;
        
        const valueStr = String(value).trim();
        // Check if it looks like a phone number (8+ digits, or starts with common patterns)
        if (/^\d{8,}$/.test(valueStr) || /^\+?\d{8,}$/.test(valueStr) || /^\d{4,}\s*\d{4,}$/.test(valueStr)) {
          // Verify with a few more rows
          let phoneLikeCount = 0;
          const sampleSize = Math.min(5, allRows.length);
          for (let j = 0; j < sampleSize; j++) {
            const sampleValue = allRows[j]?.[key];
            if (sampleValue && /^\d{8,}$/.test(String(sampleValue).trim())) {
              phoneLikeCount++;
            }
          }
          // If at least 60% of samples look like phone numbers, consider it a phone column
          if (phoneLikeCount >= sampleSize * 0.6) {
            return key;
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

    // Auto-detect phone column if standard names don't work
    let detectedPhoneColumn: string | null = null;
    if (data.length > 0) {
      detectedPhoneColumn = detectPhoneColumn(data[0], data.slice(0, 10));
      if (detectedPhoneColumn) {
        console.log(`Auto-detected phone column: "${detectedPhoneColumn}"`);
      }
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Log available columns for debugging (only once)
    if (data.length > 0) {
      const firstRow = data[0] as any;
      const availableColumns = Object.keys(firstRow).join(', ');
      console.log('Available columns in CSV/Excel:', availableColumns);
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2; // +2 because Excel rows start at 1 and we have header

      try {
        // Extract data from row with flexible column matching
        // Phone can be a number in Excel, so handle both string and number
        // Try expanded list of possible phone column names
        let phoneValue = getColumnValue(row, [
          'Утас', 'phone', 'Phone', 'утас', 'Утасны дугаар', 'утасны дугаар',
          'Утасны', 'утасны', 'Phone Number', 'phone_number', 'PHONE',
          'Телефон', 'телефон', 'Tel', 'tel', 'Telephone', 'telephone'
        ]);
        
        // If not found and we detected a phone column, use that
        if ((!phoneValue || phoneValue === '') && detectedPhoneColumn) {
          phoneValue = row[detectedPhoneColumn];
        }
        
        const phone = phoneValue !== null && phoneValue !== undefined 
          ? String(phoneValue).trim() 
          : '';
        const kod = String(getColumnValue(row, ['Код', 'kod', 'Kod', 'Барааны код', 'код']) || '').trim();
        const price = getColumnValue(row, ['Үнэ', 'price', 'Price', 'үнэ']);
        const comment = String(getColumnValue(row, ['Тайлбар', 'comment', 'Comment', 'тайлбар']) || '').trim() || null;
        const number = getColumnValue(row, ['Тоо', 'Тоо ширхэг', 'number', 'Number', 'тоо']);
        const receivedDate = getColumnValue(row, ['Ирж авсан огноо', 'received_date', 'Received Date', 'ирж авсан огноо']);
        const deliveredDate = getColumnValue(row, ['Хүргэлттэй', 'Хүргэсэн огноо', 'delivered_date', 'Delivered Date', 'хүргэлттэй']);
        const paidDate = getColumnValue(row, ['Гүйлгээ хйисэн огноо', 'Гүйлгээний огноо', 'paid_date', 'Paid Date', 'Төлбөрийн огноо', 'гүйлгээ хйисэн огноо']);
        const feature = String(getColumnValue(row, ['Нэмэлт тайлбар', 'feature', 'Feature', 'Онцлог', 'нэмэлт тайлбар']) || '').trim() || null;

        // Validate required fields
        if (!phone || phone === '') {
          results.failed++;
          // Log available columns for debugging (only for first error)
          if (results.errors.length === 0 && i === 0) {
            const availableColumns = Object.keys(row).join(', ');
            console.log('Available columns in Excel/CSV:', availableColumns);
            console.log('First row data:', JSON.stringify(row, null, 2));
            console.log('Phone value found:', phoneValue, 'Type:', typeof phoneValue);
            console.log('Detected phone column:', detectedPhoneColumn);
            // Try to find phone in all possible variations
            for (const key of Object.keys(row)) {
              const val = row[key];
              console.log(`Column "${key}":`, val, 'Type:', typeof val, 'String:', String(val));
            }
          }
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
        let baraaniiKodId: number | undefined = kodMap.get(kod.toLowerCase());
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

        // Ensure baraaniiKodId is defined before proceeding
        if (baraaniiKodId === undefined) {
          results.failed++;
          results.errors.push(`Мөр ${rowNum}: Барааны код олдсонгүй`);
          continue;
        }

        // Parse price (handle "189k", "196k" format)
        const parsePrice = (priceValue: any): number | null => {
          if (!priceValue) return null;
          const priceStr = String(priceValue).trim();
          if (!priceStr) return null;
          
          // Remove "k" suffix and multiply by 1000
          if (priceStr.toLowerCase().endsWith('k')) {
            const numValue = parseFloat(priceStr.slice(0, -1));
            if (!isNaN(numValue)) {
              return numValue * 1000;
            }
          }
          
          // Try direct parse
          const numValue = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
          if (!isNaN(numValue)) {
            return numValue;
          }
          
          return null;
        };

        // Parse dates (handle "8-Oct", "7-Oct" format and Excel dates)
        const parseDate = (dateValue: any): string | null => {
          if (!dateValue) return null;
          
          if (typeof dateValue === 'string') {
            const dateStr = dateValue.trim();
            if (!dateStr) return null;
            
            // Handle "8-Oct", "7-Oct" format (assuming current year)
            const dateMatch = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})$/i);
            if (dateMatch) {
              const day = parseInt(dateMatch[1]);
              const monthStr = dateMatch[2].toLowerCase();
              const monthMap: { [key: string]: number } = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
              };
              const month = monthMap[monthStr];
              if (month !== undefined) {
                const currentYear = new Date().getFullYear();
                const date = new Date(currentYear, month, day);
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
            // Excel date serial number (days since 1900-01-01)
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
        const parsedReceivedDate = parseDate(receivedDate);
        const parsedPaidDate = parseDate(paidDate);

        // Handle delivery cost (Хүргэлттэй column might contain cost like "7k" or a date)
        let withDelivery = false;
        let parsedDeliveredDate: string | null = null;
        if (deliveredDate) {
          const deliveryStr = String(deliveredDate).trim();
          // If it looks like a price (contains "k" or starts with digits), treat as delivery cost
          if (deliveryStr.toLowerCase().endsWith('k') || /^\d+/.test(deliveryStr)) {
            withDelivery = true;
            // Delivery cost is stored, but we don't have a separate column for it
            // Just mark as with_delivery = true
          } else {
            // Otherwise treat as date
            parsedDeliveredDate = parseDate(deliveredDate);
            if (parsedDeliveredDate) {
              withDelivery = true;
            }
          }
        }

        // Insert order with default status = 1 (шинэ үүссэн) and type = 1 (live menu)
        await pool.query(
          `INSERT INTO order_table (
            phone, baraanii_kod_id, price, comment, number,
            received_date, delivered_date, paid_date, feature, with_delivery, status, type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            phone,
            baraaniiKodId,
            parsedPrice,
            comment,
            parsedNumber,
            parsedReceivedDate,
            parsedDeliveredDate,
            parsedPaidDate,
            feature,
            withDelivery,
            1, // Default status: шинэ үүссэн
            1, // Type: live menu
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

