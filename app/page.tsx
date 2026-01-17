'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Нүүр хуудас</h1>
          <p className="text-muted-foreground">
            Khos shop системд тавтай морилно уу
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        

          <Link 
            href="/order"
            className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer"
          >
            <h3 className="text-lg font-semibold mb-2">Захиалга</h3>
            <p className="text-sm text-muted-foreground">
              Захиалгын мэдээллийг харах, удирдах
            </p>
          </Link>

          <Link 
            href="/live"
            className="border rounded-lg p-6 hover:bg-accent transition-colors cursor-pointer"
          >
            <h3 className="text-lg font-semibold mb-2">Live</h3>
            <p className="text-sm text-muted-foreground">
              Live мэдээлэл харах
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
