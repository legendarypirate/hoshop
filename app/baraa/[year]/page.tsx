'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const monthNames = [
  '1-р сар',
  '2-р сар',
  '3-р сар',
  '4-р сар',
  '5-р сар',
  '6-р сар',
  '7-р сар',
  '8-р сар',
  '9-р сар',
  '10-р сар',
  '11-р сар',
  '12-р сар',
];

export default function BaraaMonthPage() {
  const params = useParams();
  const year = params?.year as string;
  const [months, setMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year) {
      fetchMonths();
    }
  }, [year]);

  const fetchMonths = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order?type=2');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      // Extract unique months from paid_date for this year
      const monthSet = new Set<number>();
      const yearNum = parseInt(year);
      
      data.forEach((order: any) => {
        if (order.paid_date) {
          const orderDate = new Date(order.paid_date);
          if (orderDate.getFullYear() === yearNum) {
            monthSet.add(orderDate.getMonth() + 1); // getMonth() returns 0-11, we want 1-12
          }
        }
      });
      
      // Always show all 12 months
      const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
      setMonths(allMonths);
    } catch (err) {
      console.error('Failed to fetch months:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/baraa" className="text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Буцах
        </Link>
        <h1 className="text-3xl font-bold">Бараа - {year}</h1>
        <p className="text-muted-foreground mt-2">Сар сонгоно уу</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month) => (
          <Link
            key={month}
            href={`/baraa/${year}/${month}`}
            className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer text-center"
          >
            <div className="text-xl font-semibold">{monthNames[month - 1]}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

