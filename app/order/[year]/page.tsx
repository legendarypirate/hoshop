'use client';

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

const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function OrderYearPage() {
  const params = useParams();
  const year = params?.year as string;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/order" className="text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Буцах
        </Link>
        <h1 className="text-3xl font-bold">Захиалга - {year}</h1>
        <p className="text-muted-foreground mt-2">Сар сонгоно уу</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ALL_MONTHS.map((month) => (
          <Link
            key={month}
            href={`/order/${year}/${month}`}
            className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer text-center"
          >
            <div className="text-xl font-semibold">{monthNames[month - 1]}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

