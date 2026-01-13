'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface BaraaniiKod {
  id: number;
  kod: string;
}

interface Order {
  id: number;
  phone: string;
  baraanii_kod_id: number;
  baraanii_kod_name?: string;
  price: number | null;
  feature: string | null;
  number: number | null;
  order_date: string | null;
  paid_date: string | null;
  with_delivery: boolean;
  comment: string | null;
  created_at: string;
}

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [baraaniiKodList, setBaraaniiKodList] = useState<BaraaniiKod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [phone, setPhone] = useState('');
  const [baraaniiKodId, setBaraaniiKodId] = useState<string>('');
  const [price, setPrice] = useState('');
  const [feature, setFeature] = useState('');
  const [number, setNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [withDelivery, setWithDelivery] = useState(false);
  const [comment, setComment] = useState('');

  // Fetch all orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('Захиалга ачааллахад алдаа гарлаа');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product codes
  const fetchBaraaniiKod = async () => {
    try {
      const response = await fetch('/api/baraanii-kod');
      if (!response.ok) throw new Error('Failed to fetch product codes');
      const data = await response.json();
      setBaraaniiKodList(data);
    } catch (err) {
      console.error('Failed to load product codes:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBaraaniiKod();
  }, []);

  // Reset form
  const resetForm = () => {
    setPhone('');
    setBaraaniiKodId('');
    setPrice('');
    setFeature('');
    setNumber('');
    setOrderDate('');
    setPaidDate('');
    setWithDelivery(false);
    setComment('');
    setError('');
  };

  // Open dialog for create
  const openCreateDialog = () => {
    setEditingOrder(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for edit
  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setPhone(order.phone);
    setBaraaniiKodId(order.baraanii_kod_id.toString());
    setPrice(order.price?.toString() || '');
    setFeature(order.feature || '');
    setNumber(order.number?.toString() || '');
    setOrderDate(order.order_date || '');
    setPaidDate(order.paid_date || '');
    setWithDelivery(order.with_delivery);
    setComment(order.comment || '');
    setError('');
    setIsDialogOpen(true);
  };

  // Create new order
  const handleCreate = async () => {
    if (!phone.trim()) {
      setError('Утасны дугаар оруулах шаардлагатай');
      return;
    }

    if (!baraaniiKodId) {
      setError('Барааны код сонгох шаардлагатай');
      return;
    }

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          baraanii_kod_id: parseInt(baraaniiKodId),
          price: price ? parseFloat(price) : null,
          feature: feature.trim() || null,
          number: number ? parseInt(number) : null,
          order_date: orderDate || null,
          paid_date: paidDate || null,
          withDelivery,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      resetForm();
      setIsDialogOpen(false);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Захиалга үүсгэхэд алдаа гарлаа');
    }
  };

  // Update order
  const handleUpdate = async () => {
    if (!phone.trim() || !editingOrder) {
      setError('Утасны дугаар оруулах шаардлагатай');
      return;
    }

    if (!baraaniiKodId) {
      setError('Барааны код сонгох шаардлагатай');
      return;
    }

    try {
      const response = await fetch(`/api/order/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          baraanii_kod_id: parseInt(baraaniiKodId),
          price: price ? parseFloat(price) : null,
          feature: feature.trim() || null,
          number: number ? parseInt(number) : null,
          order_date: orderDate || null,
          paid_date: paidDate || null,
          withDelivery,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update');
      }

      resetForm();
      setEditingOrder(null);
      setIsDialogOpen(false);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Захиалга засахдаа алдаа гарлаа');
    }
  };

  // Delete order
  const handleDelete = async (id: number) => {
    if (!confirm('Та энэ захиалгыг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`/api/order/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      fetchOrders();
    } catch (err) {
      setError('Захиалга устгахад алдаа гарлаа');
      console.error(err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('mn-MN');
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('mn-MN').format(amount);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Захиалга</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ нэмэх
        </Button>
      </div>

      {error && !isDialogOpen && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Утас</TableHead>
              <TableHead>Барааны код</TableHead>
              <TableHead>Үнэ</TableHead>
              <TableHead>Онцлог</TableHead>
              <TableHead>Тоо ширхэг</TableHead>
              <TableHead>Захиалгын огноо</TableHead>
              <TableHead>Төлбөрийн огноо</TableHead>
              <TableHead>Хүргэлттэй</TableHead>
              <TableHead>Тайлбар</TableHead>
              <TableHead className="w-[150px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground"
                >
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell className="font-medium">{order.phone}</TableCell>
                  <TableCell>
                    {order.baraanii_kod_name || `ID: ${order.baraanii_kod_id}`}
                  </TableCell>
                  <TableCell>{formatCurrency(order.price)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.feature || '-'}
                  </TableCell>
                  <TableCell>{order.number || '-'}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{formatDate(order.paid_date)}</TableCell>
                  <TableCell>
                    {order.with_delivery ? 'Тийм' : 'Үгүй'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.comment || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(order)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? 'Захиалга засах' : 'Шинэ захиалга нэмэх'}
            </DialogTitle>
            <DialogDescription>
              {editingOrder
                ? 'Захиалгын мэдээллийг засварлана уу'
                : 'Шинэ захиалгын мэдээллийг оруулна уу'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">
                  Утасны дугаар <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="Утасны дугаар оруулна уу"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="baraaniiKod">
                  Барааны код <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={baraaniiKodId}
                  onValueChange={(value: string) => {
                    setBaraaniiKodId(value);
                    setError('');
                  }}
                >
                  <SelectTrigger id="baraaniiKod">
                    <SelectValue placeholder="Барааны код сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    {baraaniiKodList.map((bk) => (
                      <SelectItem key={bk.id} value={bk.id.toString()}>
                        {bk.kod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Үнэ</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Үнэ оруулна уу"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="number">Тоо ширхэг</Label>
                <Input
                  id="number"
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Тоо ширхэг оруулна уу"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="feature">Онцлог</Label>
              <Textarea
                id="feature"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                placeholder="Онцлог оруулна уу"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="orderDate">Захиалгын огноо</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paidDate">Төлбөрийн огноо</Label>
                <Input
                  id="paidDate"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="withDelivery"
                checked={withDelivery}
                onCheckedChange={(checked: boolean) =>
                  setWithDelivery(checked === true)
                }
              />
              <Label
                htmlFor="withDelivery"
                className="text-sm font-normal cursor-pointer"
              >
                Хүргэлттэй
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comment">Тайлбар</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Тайлбар оруулна уу"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Цуцлах
            </Button>
            <Button onClick={editingOrder ? handleUpdate : handleCreate}>
              {editingOrder ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

