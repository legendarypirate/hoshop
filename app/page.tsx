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
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Барааны код</h3>
            <p className="text-sm text-muted-foreground">
              Барааны кодыг удирдах, нэмэх, засах, устгах
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Бараа</h3>
            <p className="text-sm text-muted-foreground">
              Барааны мэдээллийг удирдах
            </p>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Хэрэглэгчид</h3>
            <p className="text-sm text-muted-foreground">
              Хэрэглэгчийн мэдээллийг удирдах
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
