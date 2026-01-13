export default function UsersPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Хэрэглэгчид</h1>
          <p className="text-muted-foreground">
            Хэрэглэгчийн мэдээллийг удирдах хуудас
          </p>
        </div>

        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Хэрэглэгчийн мэдээлэл энд харагдана
          </p>
        </div>
      </div>
    </div>
  );
}

