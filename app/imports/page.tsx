'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, RefreshCw } from 'lucide-react';

interface ImportBatch {
  id: number;
  import_type: 'live' | 'order';
  file_name: string | null;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  created_at: string;
  created_by: number | null;
  created_by_phone: string | null;
  actual_imported_count: string;
}

export default function ImportsPage() {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [revertingId, setRevertingId] = useState<number | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null);

  useEffect(() => {
    fetchImports();
  }, [filterType]);

  const fetchImports = async () => {
    try {
      setLoading(true);
      const url = filterType === 'all' 
        ? '/api/imports' 
        : `/api/imports?type=${filterType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch imports');
      const data = await response.json();
      setImports(data);
    } catch (error) {
      console.error('Error fetching imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (importId: number) => {
    try {
      setRevertingId(importId);
      const response = await fetch(`/api/imports/${importId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Импортыг устгахад алдаа гарлаа');
      }

      const result = await response.json();
      alert(`Импорт амжилттай устгалаа. ${result.deleted_orders} захиалга устгагдлаа.`);
      
      // Refresh the list
      await fetchImports();
    } catch (error: any) {
      alert(error.message || 'Импортыг устгахад алдаа гарлаа');
    } finally {
      setRevertingId(null);
      setConfirmDialogOpen(false);
      setSelectedImportId(null);
    }
  };

  const openConfirmDialog = (importId: number) => {
    setSelectedImportId(importId);
    setConfirmDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getImportTypeLabel = (type: string) => {
    return type === 'live' ? 'Live' : 'Захиалга';
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Excel Импортууд</h1>
          <p className="text-muted-foreground mt-2">
            Импорт хийсэн түүх болон буцаах
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Төрөл сонгох" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="order">Захиалга</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchImports} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {imports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Импорт олдсонгүй</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Файлын нэр</TableHead>
                <TableHead>Нийт мөр</TableHead>
                <TableHead>Амжилттай</TableHead>
                <TableHead>Амжилтгүй</TableHead>
                <TableHead>Импортлогдсон</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Хэрэглэгч</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importBatch) => (
                <TableRow key={importBatch.id}>
                  <TableCell className="font-medium">{importBatch.id}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      importBatch.import_type === 'live' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {getImportTypeLabel(importBatch.import_type)}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {importBatch.file_name || '-'}
                  </TableCell>
                  <TableCell>{importBatch.total_rows}</TableCell>
                  <TableCell className="text-green-600">
                    {importBatch.successful_rows}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {importBatch.failed_rows}
                  </TableCell>
                  <TableCell className="font-medium">
                    {importBatch.actual_imported_count}
                  </TableCell>
                  <TableCell>{formatDate(importBatch.created_at)}</TableCell>
                  <TableCell>
                    {importBatch.created_by_phone || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openConfirmDialog(importBatch.id)}
                      disabled={revertingId === importBatch.id}
                    >
                      {revertingId === importBatch.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Импортыг буцаах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Энэ импортын бүх захиалгууд устгагдана. Энэ үйлдлийг буцаах боломжгүй.
              Та үүнийг хийхдээ итгэлтэй байна уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedImportId) {
                  handleRevert(selectedImportId);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Буцаах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

