'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Size {
  id: number;
  name: string;
  created_at: string;
}

export default function SizesSettingsPage() {
  const [items, setItems] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Size | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [error, setError] = useState('');

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sizes');
      if (!response.ok) throw new Error('Failed to fetch sizes');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load sizes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Create new item
  const handleCreate = async () => {
    if (!nameValue.trim()) {
      setError('Хэмжээний нэр оруулах шаардлагатай');
      return;
    }

    try {
      const response = await fetch('/api/sizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      setNameValue('');
      setIsDialogOpen(false);
      setError('');
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to create size');
    }
  };

  // Update item
  const handleUpdate = async () => {
    if (!nameValue.trim() || !editingItem) {
      setError('Хэмжээний нэр оруулах шаардлагатай');
      return;
    }

    try {
      const response = await fetch(`/api/sizes/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      setNameValue('');
      setEditingItem(null);
      setIsDialogOpen(false);
      setError('');
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to update size');
    }
  };

  // Delete item
  const handleDelete = async (id: number) => {
    if (!confirm('Та энэ хэмжээг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sizes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchItems();
    } catch (err) {
      setError('Failed to delete size');
      console.error(err);
    }
  };

  // Open dialog for create
  const openCreateDialog = () => {
    setEditingItem(null);
    setNameValue('');
    setError('');
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (item: Size) => {
    setEditingItem(item);
    setNameValue(item.name);
    setError('');
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Хэмжээ</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ нэмэх
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Хэмжээний нэр</TableHead>
              <TableHead className="w-[200px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Хэмжээ засах' : 'Шинэ хэмжээ нэмэх'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Хэмжээний нэрийг засварлана уу'
                : 'Шинэ хэмжээний нэрийг оруулна уу'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="name">Хэмжээний нэр</Label>
              <Input
                id="name"
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value);
                  setError('');
                }}
                placeholder="Хэмжээний нэр оруулна уу"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setError('');
              }}
            >
              Цуцлах
            </Button>
            <Button onClick={editingItem ? handleUpdate : handleCreate}>
              {editingItem ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

