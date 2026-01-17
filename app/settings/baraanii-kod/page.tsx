'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';

interface BaraaniiKod {
  id: number;
  kod: string;
  created_at: string;
}

interface Color {
  id: number;
  name: string;
}

interface Size {
  id: number;
  name: string;
}

export default function BaraaniiKodSettingsPage() {
  const [items, setItems] = useState<BaraaniiKod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BaraaniiKod | null>(null);
  const [kodValue, setKodValue] = useState('');
  const [error, setError] = useState('');

  // Color/Size modal state
  const [isAddColorSizeDialogOpen, setIsAddColorSizeDialogOpen] = useState(false);
  const [selectedBaraaniiKod, setSelectedBaraaniiKod] = useState<BaraaniiKod | null>(null);
  const [colorsList, setColorsList] = useState<Color[]>([]);
  const [sizesList, setSizesList] = useState<Size[]>([]);
  const [addColorId, setAddColorId] = useState<string>('none');
  const [addSizeId, setAddSizeId] = useState<string>('none');
  const [addColorSizeError, setAddColorSizeError] = useState('');
  const [isNewColor, setIsNewColor] = useState(false);
  const [isNewSize, setIsNewSize] = useState(false);
  const [newColorName, setNewColorName] = useState('');
  const [newSizeName, setNewSizeName] = useState('');

  // View colors/sizes modal state
  const [isViewColorSizeDialogOpen, setIsViewColorSizeDialogOpen] = useState(false);
  const [viewingBaraaniiKod, setViewingBaraaniiKod] = useState<BaraaniiKod | null>(null);
  const [viewColors, setViewColors] = useState<Color[]>([]);
  const [viewSizes, setViewSizes] = useState<Size[]>([]);
  const [loadingColorsSizes, setLoadingColorsSizes] = useState(false);
  
  // Store colors and sizes for each baraanii_kod
  const [itemColorsSizes, setItemColorsSizes] = useState<Record<number, { colors: Color[]; sizes: Size[] }>>({});

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/baraanii-kod');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError('Failed to load product codes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch colors
  const fetchColors = async () => {
    try {
      const response = await fetch('/api/colors');
      if (!response.ok) throw new Error('Failed to fetch colors');
      const data = await response.json();
      setColorsList(data);
    } catch (err) {
      console.error('Failed to load colors:', err);
    }
  };

  // Fetch sizes
  const fetchSizes = async () => {
    try {
      const response = await fetch('/api/sizes');
      if (!response.ok) throw new Error('Failed to fetch sizes');
      const data = await response.json();
      setSizesList(data);
    } catch (err) {
      console.error('Failed to load sizes:', err);
    }
  };

  // Fetch colors and sizes for a specific baraanii_kod
  const fetchColorsSizesForItem = async (itemId: number) => {
    try {
      const response = await fetch(`/api/baraanii-kod/${itemId}/colors-sizes`);
      if (!response.ok) throw new Error('Failed to fetch colors and sizes');
      const data = await response.json();
      setItemColorsSizes((prev) => ({
        ...prev,
        [itemId]: {
          colors: data.colors || [],
          sizes: data.sizes || [],
        },
      }));
    } catch (err) {
      console.error('Failed to load colors and sizes for item:', err);
      setItemColorsSizes((prev) => ({
        ...prev,
        [itemId]: { colors: [], sizes: [] },
      }));
    }
  };

  useEffect(() => {
    fetchItems();
    fetchColors();
    fetchSizes();
  }, []);

  // Fetch colors/sizes for all items when items are loaded
  useEffect(() => {
    if (items.length > 0) {
      items.forEach((item) => {
        fetchColorsSizesForItem(item.id);
      });
    }
  }, [items]);

  // Create new item
  const handleCreate = async () => {
    if (!kodValue.trim()) {
      setError('Барааны код оруулах шаардлагатай');
      return;
    }

    try {
      const response = await fetch('/api/baraanii-kod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod: kodValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      setKodValue('');
      setIsDialogOpen(false);
      setError('');
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to create product code');
    }
  };

  // Update item
  const handleUpdate = async () => {
    if (!kodValue.trim() || !editingItem) {
      setError('Барааны код оруулах шаардлагатай');
      return;
    }

    try {
      const response = await fetch(`/api/baraanii-kod/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kod: kodValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      setKodValue('');
      setEditingItem(null);
      setIsDialogOpen(false);
      setError('');
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Failed to update product code');
    }
  };

  // Delete item
  const handleDelete = async (id: number) => {
    if (!confirm('Та энэ барааны кодыг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`/api/baraanii-kod/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchItems();
    } catch (err) {
      setError('Failed to delete product code');
      console.error(err);
    }
  };

  // Open dialog for create
  const openCreateDialog = () => {
    setEditingItem(null);
    setKodValue('');
    setError('');
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (item: BaraaniiKod) => {
    setEditingItem(item);
    setKodValue(item.kod);
    setError('');
    setIsDialogOpen(true);
  };

  // Open dialog for adding color/size
  const openAddColorSizeDialog = (item: BaraaniiKod) => {
    setSelectedBaraaniiKod(item);
    setAddColorId('none');
    setAddSizeId('none');
    setAddColorSizeError('');
    setIsNewColor(false);
    setIsNewSize(false);
    setNewColorName('');
    setNewSizeName('');
    setIsAddColorSizeDialogOpen(true);
  };

  // Open dialog for viewing colors/sizes
  const openViewColorSizeDialog = async (item: BaraaniiKod) => {
    setViewingBaraaniiKod(item);
    setLoadingColorsSizes(true);
    setIsViewColorSizeDialogOpen(true);
    
    try {
      const response = await fetch(`/api/baraanii-kod/${item.id}/colors-sizes`);
      if (!response.ok) throw new Error('Failed to fetch colors and sizes');
      const data = await response.json();
      setViewColors(data.colors || []);
      setViewSizes(data.sizes || []);
    } catch (err) {
      console.error('Failed to load colors and sizes:', err);
      setViewColors([]);
      setViewSizes([]);
    } finally {
      setLoadingColorsSizes(false);
    }
  };

  // Reset add color/size form
  const resetAddColorSizeForm = () => {
    setAddColorId('none');
    setAddSizeId('none');
    setAddColorSizeError('');
    setIsNewColor(false);
    setIsNewSize(false);
    setNewColorName('');
    setNewSizeName('');
  };

  // Handle adding color/size to baraanii_kod
  const handleAddColorSize = async () => {
    if (!selectedBaraaniiKod) {
      setAddColorSizeError('Барааны код сонгоогүй байна');
      return;
    }

    let finalColorId: number | null = null;
    let finalSizeId: number | null = null;

    // Handle color - create new or use existing
    if (isNewColor) {
      if (!newColorName.trim()) {
        setAddColorSizeError('Өнгөний нэрийг оруулна уу');
        return;
      }
      try {
        const colorResponse = await fetch('/api/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newColorName.trim() }),
        });
        if (!colorResponse.ok) {
          const data = await colorResponse.json();
          throw new Error(data.error || 'Failed to create color');
        }
        const newColor = await colorResponse.json();
        finalColorId = newColor.id;
        // Refresh colors list
        fetchColors();
      } catch (err: any) {
        setAddColorSizeError(err.message || 'Өнгө үүсгэхэд алдаа гарлаа');
        return;
      }
    } else if (addColorId !== 'none') {
      finalColorId = parseInt(addColorId);
    }

    // Handle size - create new or use existing
    if (isNewSize) {
      if (!newSizeName.trim()) {
        setAddColorSizeError('Хэмжээний нэрийг оруулна уу');
        return;
      }
      try {
        const sizeResponse = await fetch('/api/sizes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSizeName.trim() }),
        });
        if (!sizeResponse.ok) {
          const data = await sizeResponse.json();
          throw new Error(data.error || 'Failed to create size');
        }
        const newSize = await sizeResponse.json();
        finalSizeId = newSize.id;
        // Refresh sizes list
        fetchSizes();
      } catch (err: any) {
        setAddColorSizeError(err.message || 'Хэмжээ үүсгэхэд алдаа гарлаа');
        return;
      }
    } else if (addSizeId !== 'none') {
      finalSizeId = parseInt(addSizeId);
    }

    if (!finalColorId && !finalSizeId) {
      setAddColorSizeError('Өнгө эсвэл хэмжээ сонгоно уу эсвэл шинээр үүсгэнэ үү');
      return;
    }

    try {
      const response = await fetch(
        `/api/baraanii-kod/${selectedBaraaniiKod.id}/colors-sizes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            color_id: finalColorId,
            size_id: finalSizeId,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add color/size');
      }

      resetAddColorSizeForm();
      setIsAddColorSizeDialogOpen(false);
      setAddColorSizeError('');
      // Refresh colors/sizes for this item
      if (selectedBaraaniiKod) {
        fetchColorsSizesForItem(selectedBaraaniiKod.id);
      }
    } catch (err: any) {
      setAddColorSizeError(err.message || 'Өнгө/хэмжээ нэмэхэд алдаа гарлаа');
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Барааны код</h1>
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
              <TableHead>Барааны код</TableHead>
           
              <TableHead className="w-[200px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const colorsSizes = itemColorsSizes[item.id] || { colors: [], sizes: [] };
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell className="font-medium">{item.kod}</TableCell>
                
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewColorSizeDialog(item)}
                          title="Өнгө, хэмжээ харах"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddColorSizeDialog(item)}
                          title="Өнгө, хэмжээ нэмэх"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Барааны код засах' : 'Шинэ барааны код нэмэх'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Барааны кодыг засварлана уу'
                : 'Шинэ барааны кодыг оруулна уу'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="kod">Барааны код</Label>
              <Input
                id="kod"
                value={kodValue}
                onChange={(e) => {
                  setKodValue(e.target.value);
                  setError('');
                }}
                placeholder="Барааны код оруулна уу"
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

      {/* Add Color/Size Dialog */}
      <Dialog open={isAddColorSizeDialogOpen} onOpenChange={setIsAddColorSizeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Өнгө, хэмжээ нэмэх</DialogTitle>
            <DialogDescription>
              {selectedBaraaniiKod && (
                <span>
                  Барааны код: <strong>{selectedBaraaniiKod.kod}</strong> -д өнгө эсвэл хэмжээ нэмнэ үү
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {addColorSizeError && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {addColorSizeError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="addColor">Өнгө</Label>
              {isNewColor ? (
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Input
                      id="newColorName"
                      value={newColorName}
                      onChange={(e) => {
                        setNewColorName(e.target.value);
                        setAddColorSizeError('');
                      }}
                      placeholder="Өнгөний нэрийг оруулна уу"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsNewColor(false);
                        setNewColorName('');
                        setAddColorId('none');
                      }}
                    >
                      Цуцлах
                    </Button>
                  </div>
                </div>
              ) : (
                <Select
                  value={addColorId}
                  onValueChange={(value: string) => {
                    if (value === 'new') {
                      setIsNewColor(true);
                      setAddColorId('none');
                    } else {
                      setAddColorId(value);
                      setAddColorSizeError('');
                    }
                  }}
                >
                  <SelectTrigger id="addColor">
                    <SelectValue placeholder="Өнгө сонгох эсвэл шинээр үүсгэх" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Өнгө нэмэхгүй</SelectItem>
                    <SelectItem value="new" className="font-semibold text-primary">
                      + Шинэ өнгө үүсгэх
                    </SelectItem>
                    {colorsList.map((color) => (
                      <SelectItem key={color.id} value={color.id.toString()}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="addSize">Хэмжээ</Label>
              {isNewSize ? (
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Input
                      id="newSizeName"
                      value={newSizeName}
                      onChange={(e) => {
                        setNewSizeName(e.target.value);
                        setAddColorSizeError('');
                      }}
                      placeholder="Хэмжээний нэрийг оруулна уу"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsNewSize(false);
                        setNewSizeName('');
                        setAddSizeId('none');
                      }}
                    >
                      Цуцлах
                    </Button>
                  </div>
                </div>
              ) : (
                <Select
                  value={addSizeId}
                  onValueChange={(value: string) => {
                    if (value === 'new') {
                      setIsNewSize(true);
                      setAddSizeId('none');
                    } else {
                      setAddSizeId(value);
                      setAddColorSizeError('');
                    }
                  }}
                >
                  <SelectTrigger id="addSize">
                    <SelectValue placeholder="Хэмжээ сонгох эсвэл шинээр үүсгэх" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Хэмжээ нэмэхгүй</SelectItem>
                    <SelectItem value="new" className="font-semibold text-primary">
                      + Шинэ хэмжээ үүсгэх
                    </SelectItem>
                    {sizesList.map((size) => (
                      <SelectItem key={size.id} value={size.id.toString()}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddColorSizeDialogOpen(false);
                resetAddColorSizeForm();
              }}
            >
              Цуцлах
            </Button>
            <Button onClick={handleAddColorSize}>Нэмэх</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Color/Size Dialog */}
      <Dialog open={isViewColorSizeDialogOpen} onOpenChange={setIsViewColorSizeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Өнгө, хэмжээний жагсаалт</DialogTitle>
            <DialogDescription>
              {viewingBaraaniiKod && (
                <span>
                  Барааны код: <strong>{viewingBaraaniiKod.kod}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loadingColorsSizes ? (
              <div className="text-center py-8">Ачааллаж байна...</div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label className="text-base font-semibold">Өнгө</Label>
                  {viewColors.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                      {viewColors.map((color) => (
                        <span
                          key={color.id}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-blue-100 text-blue-800 text-sm font-medium"
                        >
                          {color.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md text-muted-foreground text-sm text-center">
                      Өнгө олдсонгүй
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label className="text-base font-semibold">Хэмжээ</Label>
                  {viewSizes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[60px]">
                      {viewSizes.map((size) => (
                        <span
                          key={size.id}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-800 text-sm font-medium"
                        >
                          {size.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border rounded-md text-muted-foreground text-sm text-center">
                      Хэмжээ олдсонгүй
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewColorSizeDialogOpen(false);
                setViewingBaraaniiKod(null);
                setViewColors([]);
                setViewSizes([]);
              }}
            >
              Хаах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

