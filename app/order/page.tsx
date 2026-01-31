'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function OrderYearPage() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order?type=2');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      // Extract unique years from paid_date
      const yearSet = new Set<number>();
      data.forEach((order: any) => {
        if (order.paid_date) {
          const year = new Date(order.paid_date).getFullYear();
          yearSet.add(year);
        }
      });
      
      // Also include current year and next year if they don't exist
      const currentYear = new Date().getFullYear();
      yearSet.add(currentYear);
      yearSet.add(currentYear + 1);
      
      const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
      setYears(sortedYears);
    } catch (err) {
      console.error('Failed to fetch years:', err);
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
        <h1 className="text-3xl font-bold">Захиалга</h1>
        <p className="text-muted-foreground mt-2">Он сонгоно уу</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {years.map((year) => (
          <Link
            key={year}
            href={`/order/${year}`}
            className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer text-center"
          >
            <div className="text-2xl font-bold">{year}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
