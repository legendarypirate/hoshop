'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Order {
  id: number;
  baraanii_kod_id: number;
  baraanii_kod_name?: string;
  status: number;
  paid_date: string | null;
  metadata?: {
    toollogo?: number;
    price_toollogo?: number;
    with_delivery_numeric?: number;
  } | null;
}

interface BaraaStatistics {
  baraanii_kod_id: number;
  baraanii_kod_name: string;
  delivered: number; // status = 3
  received: number; // status = 2
  noStatus: number; // status = 1 or null
  total: number;
}

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

export default function BaraaMonthStatisticsPage() {
  const params = useParams();
  const year = params?.year as string;
  const month = params?.month as string;
  const yearNum = parseInt(year || '0');
  const monthNum = parseInt(month || '0');

  const [statistics, setStatistics] = useState<BaraaStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year && month) {
      fetchStatistics();
    }
  }, [year, month]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order?type=2');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data: Order[] = await response.json();
      
      // Filter by paid_date year and month
      const allOrders = data.filter((order: any) => {
        if (!order.paid_date) return false;
        const orderDate = new Date(order.paid_date);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        return orderYear === yearNum && orderMonth === monthNum;
      });
      
      // Group by baraanii_kod_id
      const grouped = new Map<number, BaraaStatistics>();
      
      allOrders.forEach((order: any) => {
        const kodId = order.baraanii_kod_id;
        const kodName = order.baraanii_kod_name || `ID: ${kodId}`;
        const status = order.status || 1; // Default to 1 if null
        const withDeliveryNumeric = order.metadata?.with_delivery_numeric;
        
        if (!grouped.has(kodId)) {
          grouped.set(kodId, {
            baraanii_kod_id: kodId,
            baraanii_kod_name: kodName,
            delivered: 0,
            received: 0,
            noStatus: 0,
            total: 0,
          });
        }
        
        const stats = grouped.get(kodId)!;
        stats.total++;
        
        // Check for red (хүргэлтэнд гарсан): with_delivery_numeric === 7 OR status === 3
        const hasRed = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 7) || status === 3;
        // Check for green (ирж авсан): with_delivery_numeric === 1 OR status === 2
        const hasGreen = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 1) || status === 2;
        
        if (hasRed) {
          stats.delivered++;
        } else if (hasGreen) {
          stats.received++;
        } else {
          stats.noStatus++;
        }
      });
      
      // Convert to array and sort by baraanii_kod_name
      const statsArray = Array.from(grouped.values()).sort((a, b) => {
        return a.baraanii_kod_name.localeCompare(b.baraanii_kod_name);
      });
      
      setStatistics(statsArray);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!year || !month) {
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
        <div className="flex items-center gap-2 mb-4">
          <Link href="/baraa" className="text-muted-foreground hover:text-foreground">
            ← Бараа
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/baraa/${year}`} className="text-muted-foreground hover:text-foreground">
            {year}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{monthNames[monthNum - 1]}</span>
        </div>
        <h1 className="text-3xl font-bold">
          Бараа - {year} оны {monthNames[monthNum - 1]}
        </h1>
        <p className="text-muted-foreground mt-2">
          Барааны кодын дагуу статистик
        </p>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Барааны код</TableHead>
              <TableHead className="text-center">Хүргэлтэнд гаргасан</TableHead>
              <TableHead className="text-center">Ирж авсан</TableHead>
              <TableHead className="text-center">Төлөвгүй</TableHead>
              <TableHead className="text-center">Нийт</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : statistics.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              statistics.map((stat) => (
                <TableRow key={stat.baraanii_kod_id}>
                  <TableCell className="font-medium">
                    {stat.baraanii_kod_name}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-red-600">
                      {stat.delivered}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-green-600">
                      {stat.received}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-gray-600">
                      {stat.noStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold">
                      {stat.total}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {statistics.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Нийт {statistics.length} барааны код
        </div>
      )}
    </div>
  );
}

