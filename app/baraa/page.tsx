'use client';

import { useState, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
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

interface Item {
  id: number;
  baraanii_kod_id: number;
  baraanii_kod_name: string;
  color_id: number | null;
  color_name: string | null;
  size_id: number | null;
  size_name: string | null;
  initial_balance: number;
  final_balance: number;
  info: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemMovement {
  id: number;
  item_id: number;
  user_id: number | null;
  user_phone: string | null;
  movement_type: 'incoming' | 'outgoing' | 'adjustment';
  quantity: number;
  action_description: string | null;
  created_at: string;
}

interface BaraaniiKod {
  id: number;
  kod: string;
}

interface Color {
  id: number;
  name: string;
}

interface Size {
  id: number;
  name: string;
}

type ActionType = 'incoming' | 'outgoing' | 'adjustment' | 'edit' | null;

export default function BaraaPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [itemMovements, setItemMovements] = useState<Record<number, ItemMovement[]>>({});
  const [movementsLoading, setMovementsLoading] = useState<Record<number, boolean>>({});
  const [movementFilters, setMovementFilters] = useState<Record<number, { startDate: string; endDate: string; movementType: string }>>({});

  // Form state for new item
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [baraaniiKodList, setBaraaniiKodList] = useState<BaraaniiKod[]>([]);
  const [colorsList, setColorsList] = useState<Color[]>([]);
  const [sizesList, setSizesList] = useState<Size[]>([]);
  const [formBaraaniiKodId, setFormBaraaniiKodId] = useState<string>('');
  const [formColorId, setFormColorId] = useState<string>('');
  const [formSizeId, setFormSizeId] = useState<string>('');
  const [formInitialBalance, setFormInitialBalance] = useState<string>('');
  const [formInfo, setFormInfo] = useState<string>('');
  const [formError, setFormError] = useState('');

  // Action modals state
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [actionQuantity, setActionQuantity] = useState<string>('');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [actionError, setActionError] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  // History drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);

  // Fetch all items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
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

  // Fetch movements for a specific item
  const fetchItemMovements = async (itemId: number) => {
    try {
      setMovementsLoading(prev => ({ ...prev, [itemId]: true }));
      const filters = movementFilters[itemId] || { startDate: '', endDate: '', movementType: 'all' };
      let url = `/api/items/${itemId}/movements`;
      const params = new URLSearchParams();
      
      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }
      if (filters.movementType && filters.movementType !== 'all') {
        params.append('movement_type', filters.movementType);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch movements');
      const data = await response.json();
      setItemMovements(prev => ({ ...prev, [itemId]: data }));
    } catch (err) {
      console.error('Failed to load movements:', err);
    } finally {
      setMovementsLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Toggle item expansion
  const toggleItemExpansion = (itemId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
      fetchItemMovements(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Handle movement filter change
  const handleMovementFilterChange = (itemId: number, field: 'startDate' | 'endDate' | 'movementType', value: string) => {
    setMovementFilters(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { startDate: '', endDate: '', movementType: 'all' }),
        [field]: value,
      },
    }));
  };

  // Apply movement filters
  const applyMovementFilters = (itemId: number) => {
    fetchItemMovements(itemId);
  };

  // Clear movement filters
  const clearMovementFilters = (itemId: number) => {
    setMovementFilters(prev => ({
      ...prev,
      [itemId]: { startDate: '', endDate: '', movementType: 'all' },
    }));
    fetchItemMovements(itemId);
  };

  // Open action dialog
  const openActionDialog = (item: Item, action: ActionType) => {
    setCurrentItem(item);
    setCurrentAction(action);
    setActionQuantity('');
    setActionNotes('');
    setActionError('');
    
    if (action === 'adjustment') {
      setActionQuantity(item.final_balance.toString());
    }
    
    setActionDialogOpen(true);
  };

  // Handle action (incoming, outgoing, adjustment)
  const handleAction = async () => {
    if (!currentItem || !currentAction) return;
    
    setActionError('');
    
    const quantity = parseInt(actionQuantity);
    if (isNaN(quantity) || quantity < 0) {
      setActionError('Тоо ширхэг зөв оруулах шаардлагатай');
      return;
    }

    if (currentAction === 'outgoing' && quantity > currentItem.final_balance) {
      setActionError(`Илүүдэл тоо ширхэг. Одоогийн үлдэгдэл: ${currentItem.final_balance}`);
      return;
    }

    try {
      let movementType = currentAction;
      let movementQuantity = quantity;
      
      // For adjustment, the quantity is the new final balance
      if (currentAction === 'adjustment') {
        movementQuantity = quantity;
      }

      const response = await fetch('/api/item-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: currentItem.id,
          movement_type: movementType,
          quantity: movementQuantity,
          action_description: actionNotes.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to perform action');
      }

      setActionDialogOpen(false);
      fetchItems();
      // Refresh movements if item is expanded
      if (expandedItems.has(currentItem.id)) {
        fetchItemMovements(currentItem.id);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to perform action');
    }
  };

  // Create new item
  const handleCreateItem = async () => {
    setFormError('');
    
    if (!formBaraaniiKodId) {
      setFormError('Барааны код сонгох шаардлагатай');
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baraanii_kod_id: parseInt(formBaraaniiKodId),
          color_id: formColorId && formColorId !== 'none' ? parseInt(formColorId) : null,
          size_id: formSizeId && formSizeId !== 'none' ? parseInt(formSizeId) : null,
          initial_balance: parseInt(formInitialBalance) || 0,
          final_balance: parseInt(formInitialBalance) || 0,
          info: formInfo.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create item');
      }

      // Reset form
      setFormBaraaniiKodId('');
      setFormColorId('');
      setFormSizeId('');
      setFormInitialBalance('');
      setFormInfo('');
      setIsNewItemDialogOpen(false);
      setFormError('');
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create item');
    }
  };

  // Handle edit item
  const handleEditItem = async () => {
    if (!currentItem) return;
    
    setActionError('');
    
    if (!formBaraaniiKodId) {
      setActionError('Барааны код сонгох шаардлагатай');
      return;
    }

    try {
      const response = await fetch(`/api/items/${currentItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baraanii_kod_id: parseInt(formBaraaniiKodId),
          color_id: formColorId && formColorId !== 'none' ? parseInt(formColorId) : null,
          size_id: formSizeId && formSizeId !== 'none' ? parseInt(formSizeId) : null,
          initial_balance: parseInt(formInitialBalance) || 0,
          final_balance: parseInt(formFinalBalance) || 0,
          info: formInfo.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update item');
      }

      setActionDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update item');
    }
  };

  // Handle delete item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/items/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchItems();
    } catch (err: any) {
      console.error('Failed to delete item:', err);
      alert('Бараа устгахад алдаа гарлаа');
    }
  };

  // Open edit dialog
  const openEditDialog = (item: Item) => {
    setCurrentItem(item);
    setCurrentAction('edit');
    setFormBaraaniiKodId(item.baraanii_kod_id.toString());
    setFormColorId(item.color_id?.toString() || 'none');
    setFormSizeId(item.size_id?.toString() || 'none');
    setFormInitialBalance(item.initial_balance.toString());
    setFormFinalBalance(item.final_balance.toString());
    setFormInfo(item.info || '');
    setFormError('');
    setActionDialogOpen(true);
  };

  // Open history drawer
  const openHistoryDrawer = (item: Item) => {
    setHistoryItem(item);
    setHistoryDrawerOpen(true);
    fetchItemMovements(item.id);
  };

  useEffect(() => {
    fetchItems();
    fetchBaraaniiKod();
    fetchColors();
    fetchSizes();
  }, []);

  // Edit form state (reused from new item form)
  const [formFinalBalance, setFormFinalBalance] = useState<string>('');

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'Орлого';
      case 'outgoing':
        return 'Зарлага';
      case 'adjustment':
        return 'Тохируулга';
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'text-green-600 font-medium';
      case 'outgoing':
        return 'text-red-600 font-medium';
      case 'adjustment':
        return 'text-blue-600 font-medium';
      default:
        return '';
    }
  };

  const getActionDialogTitle = () => {
    switch (currentAction) {
      case 'incoming':
        return 'Орлого бүртгэх';
      case 'outgoing':
        return 'Зарлага бүртгэх';
      case 'adjustment':
        return 'Тохируулга хийх';
      case 'edit':
        return 'Бараа засах';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Бараа</h1>
            <p className="text-muted-foreground">
              Барааны мэдээллийг удирдах хуудас
            </p>
          </div>
          <Button onClick={() => setIsNewItemDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Шинэ бараа
          </Button>
        </div>

        {/* Items Table */}
        <div>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Барааны код</TableHead>
                  <TableHead>Барааны нэр</TableHead>
                  <TableHead>Өнгө / Хэмжээ</TableHead>
                  <TableHead>Эхний үлдэгдэл</TableHead>
                  <TableHead>Эцсийн үлдэгдэл</TableHead>
                  <TableHead>Барааны мэдээлэл</TableHead>
                  <TableHead className="w-64">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Ачааллаж байна...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Мэдээлэл олдсонгүй
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const movements = itemMovements[item.id] || [];
                    const isLoadingMovements = movementsLoading[item.id];
                    const filters = movementFilters[item.id] || { startDate: '', endDate: '', movementType: 'all' };

                    return (
                      <Fragment key={item.id}>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell>
                            <button
                              onClick={() => toggleItemExpansion(item.id)}
                              className="p-1 hover:bg-accent rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.baraanii_kod_name || `ID: ${item.baraanii_kod_id}`}
                          </TableCell>
                          <TableCell>
                            {item.baraanii_kod_name || `ID: ${item.baraanii_kod_id}`}
                          </TableCell>
                          <TableCell>
                            {[item.color_name, item.size_name].filter(Boolean).join(' / ') || '-'}
                          </TableCell>
                          <TableCell>{item.initial_balance}</TableCell>
                          <TableCell className="font-semibold">
                            {item.final_balance}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate">
                            {item.info || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(item, 'incoming')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <ArrowDownToLine className="mr-1 h-3 w-3" />
                                Орлого
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(item, 'outgoing')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <ArrowUpFromLine className="mr-1 h-3 w-3" />
                                Зарлага
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(item, 'adjustment')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Settings2 className="mr-1 h-3 w-3" />
                                Тохируулга
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Засах
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setItemToDelete(item);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Устгах
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openHistoryDrawer(item)}
                              >
                                <History className="mr-1 h-3 w-3" />
                                Түүх
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30 p-4">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-lg">
                                    Хөдөлгөөний түүх
                                  </h3>
                                  <div className="flex gap-2 items-end">
                                    <div className="grid gap-1">
                                      <Label htmlFor={`start-${item.id}`} className="text-xs">
                                        Эхлэх огноо
                                      </Label>
                                      <Input
                                        id={`start-${item.id}`}
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => {
                                          handleMovementFilterChange(item.id, 'startDate', e.target.value);
                                        }}
                                        className="w-40 h-9"
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label htmlFor={`end-${item.id}`} className="text-xs">
                                        Дуусах огноо
                                      </Label>
                                      <Input
                                        id={`end-${item.id}`}
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => {
                                          handleMovementFilterChange(item.id, 'endDate', e.target.value);
                                        }}
                                        className="w-40 h-9"
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label htmlFor={`type-${item.id}`} className="text-xs">
                                        Төрөл
                                      </Label>
                                      <Select
                                        value={filters.movementType || 'all'}
                                        onValueChange={(value) => {
                                          handleMovementFilterChange(item.id, 'movementType', value);
                                        }}
                                      >
                                        <SelectTrigger id={`type-${item.id}`} className="w-32 h-9">
                                          <SelectValue placeholder="Бүгд" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="all">Бүгд</SelectItem>
                                          <SelectItem value="incoming">Орлого</SelectItem>
                                          <SelectItem value="outgoing">Зарлага</SelectItem>
                                          <SelectItem value="adjustment">Тохируулга</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => applyMovementFilters(item.id)}
                                    >
                                      Хайх
                                    </Button>
                                    {(filters.startDate || filters.endDate || (filters.movementType && filters.movementType !== 'all')) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => clearMovementFilters(item.id)}
                                      >
                                        Цэвэрлэх
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="border rounded-lg overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Огноо</TableHead>
                                        <TableHead>Төрөл</TableHead>
                                        <TableHead>Тоо ширхэг</TableHead>
                                        <TableHead>Хэрэглэгч</TableHead>
                                        <TableHead>Тайлбар</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {isLoadingMovements ? (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-4">
                                            Ачааллаж байна...
                                          </TableCell>
                                        </TableRow>
                                      ) : movements.length === 0 ? (
                                        <TableRow>
                                          <TableCell
                                            colSpan={5}
                                            className="text-center py-4 text-muted-foreground"
                                          >
                                            Хөдөлгөөний түүх олдсонгүй
                                          </TableCell>
                                        </TableRow>
                                      ) : (
                                        movements.map((movement) => (
                                          <TableRow key={movement.id}>
                                            <TableCell>{formatDate(movement.created_at)}</TableCell>
                                            <TableCell>
                                              <span className={getMovementTypeColor(movement.movement_type)}>
                                                {getMovementTypeLabel(movement.movement_type)}
                                              </span>
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                              {movement.quantity}
                                            </TableCell>
                                            <TableCell>
                                              {movement.user_phone || 'Систем'}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                              {movement.action_description || '-'}
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* New Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Шинэ бараа нэмэх</DialogTitle>
            <DialogDescription>
              Барааны мэдээллийг оруулна уу
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="baraanii-kod">Барааны код *</Label>
              <Select value={formBaraaniiKodId} onValueChange={setFormBaraaniiKodId}>
                <SelectTrigger id="baraanii-kod">
                  <SelectValue placeholder="Барааны код сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {baraaniiKodList.map((kod) => (
                    <SelectItem key={kod.id} value={kod.id.toString()}>
                      {kod.kod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Өнгө</Label>
              <Select value={formColorId} onValueChange={setFormColorId}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Өнгө сонгох (сонголттой)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Өнгөгүй</SelectItem>
                  {colorsList.map((color) => (
                    <SelectItem key={color.id} value={color.id.toString()}>
                      {color.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Хэмжээ</Label>
              <Select value={formSizeId} onValueChange={setFormSizeId}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Хэмжээ сонгох (сонголттой)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Хэмжээгүй</SelectItem>
                  {sizesList.map((size) => (
                    <SelectItem key={size.id} value={size.id.toString()}>
                      {size.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial-balance">Эхний үлдэгдэл</Label>
              <Input
                id="initial-balance"
                type="number"
                min="0"
                value={formInitialBalance}
                onChange={(e) => setFormInitialBalance(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="info">Барааны мэдээлэл</Label>
              <Textarea
                id="info"
                value={formInfo}
                onChange={(e) => setFormInfo(e.target.value)}
                placeholder="Нэмэлт мэдээлэл..."
                rows={3}
              />
            </div>

            {formError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewItemDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={handleCreateItem}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog (Incoming, Outgoing, Adjustment, Edit) */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{getActionDialogTitle()}</DialogTitle>
            <DialogDescription>
              {currentAction === 'edit' 
                ? 'Барааны мэдээллийг засна уу'
                : currentAction === 'adjustment'
                ? 'Шинэ эцсийн үлдэгдэл оруулна уу'
                : 'Мэдээллийг оруулна уу'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentAction === 'edit' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-baraanii-kod">Барааны код *</Label>
                  <Select value={formBaraaniiKodId} onValueChange={setFormBaraaniiKodId}>
                    <SelectTrigger id="edit-baraanii-kod">
                      <SelectValue placeholder="Барааны код сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {baraaniiKodList.map((kod) => (
                        <SelectItem key={kod.id} value={kod.id.toString()}>
                          {kod.kod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-color">Өнгө</Label>
                  <Select value={formColorId} onValueChange={setFormColorId}>
                    <SelectTrigger id="edit-color">
                      <SelectValue placeholder="Өнгө сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Өнгөгүй</SelectItem>
                      {colorsList.map((color) => (
                        <SelectItem key={color.id} value={color.id.toString()}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-size">Хэмжээ</Label>
                  <Select value={formSizeId} onValueChange={setFormSizeId}>
                    <SelectTrigger id="edit-size">
                      <SelectValue placeholder="Хэмжээ сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Хэмжээгүй</SelectItem>
                      {sizesList.map((size) => (
                        <SelectItem key={size.id} value={size.id.toString()}>
                          {size.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-initial-balance">Эхний үлдэгдэл</Label>
                  <Input
                    id="edit-initial-balance"
                    type="number"
                    min="0"
                    value={formInitialBalance}
                    onChange={(e) => setFormInitialBalance(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-final-balance">Эцсийн үлдэгдэл</Label>
                  <Input
                    id="edit-final-balance"
                    type="number"
                    min="0"
                    value={formFinalBalance}
                    onChange={(e) => setFormFinalBalance(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-info">Барааны мэдээлэл</Label>
                  <Textarea
                    id="edit-info"
                    value={formInfo}
                    onChange={(e) => setFormInfo(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                {currentItem && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Бараа</div>
                    <div className="font-medium">{currentItem.baraanii_kod_name}</div>
                    <div className="text-sm text-muted-foreground">
                      Одоогийн үлдэгдэл: <span className="font-semibold">{currentItem.final_balance}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="action-quantity">
                    {currentAction === 'adjustment' ? 'Шинэ эцсийн үлдэгдэл *' : 'Тоо ширхэг *'}
                  </Label>
                  <Input
                    id="action-quantity"
                    type="number"
                    min="0"
                    value={actionQuantity}
                    onChange={(e) => setActionQuantity(e.target.value)}
                    placeholder={currentAction === 'adjustment' ? 'Шинэ үлдэгдэл' : 'Тоо ширхэг'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action-notes">Тайлбар / Тэмдэглэл</Label>
                  <Textarea
                    id="action-notes"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Нэмэлт мэдээлэл..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {actionError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {actionError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={currentAction === 'edit' ? handleEditItem : handleAction}>
              {currentAction === 'edit' ? 'Хадгалах' : 'Бүртгэх'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Бараа устгах</AlertDialogTitle>
            <AlertDialogDescription>
              Та энэ барааг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Устгах
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Dialog */}
      <Dialog open={historyDrawerOpen} onOpenChange={setHistoryDrawerOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Хөдөлгөөний түүх - {historyItem?.baraanii_kod_name}
            </DialogTitle>
            <DialogDescription>
              Барааны бүх хөдөлгөөний түүх
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {historyItem && (
              <>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="grid gap-1">
                    <Label htmlFor="history-start" className="text-xs">
                      Эхлэх огноо
                    </Label>
                    <Input
                      id="history-start"
                      type="date"
                      value={movementFilters[historyItem.id]?.startDate || ''}
                      onChange={(e) => {
                        handleMovementFilterChange(historyItem.id, 'startDate', e.target.value);
                      }}
                      className="w-40 h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="history-end" className="text-xs">
                      Дуусах огноо
                    </Label>
                    <Input
                      id="history-end"
                      type="date"
                      value={movementFilters[historyItem.id]?.endDate || ''}
                      onChange={(e) => {
                        handleMovementFilterChange(historyItem.id, 'endDate', e.target.value);
                      }}
                      className="w-40 h-9"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="history-type" className="text-xs">
                      Төрөл
                    </Label>
                    <Select
                      value={movementFilters[historyItem.id]?.movementType || 'all'}
                      onValueChange={(value) => {
                        handleMovementFilterChange(historyItem.id, 'movementType', value);
                      }}
                    >
                      <SelectTrigger id="history-type" className="w-32 h-9">
                        <SelectValue placeholder="Бүгд" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Бүгд</SelectItem>
                        <SelectItem value="incoming">Орлого</SelectItem>
                        <SelectItem value="outgoing">Зарлага</SelectItem>
                        <SelectItem value="adjustment">Тохируулга</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyMovementFilters(historyItem.id)}
                  >
                    Хайх
                  </Button>
                  {(movementFilters[historyItem.id]?.startDate || 
                    movementFilters[historyItem.id]?.endDate || 
                    (movementFilters[historyItem.id]?.movementType && movementFilters[historyItem.id]?.movementType !== 'all')) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => clearMovementFilters(historyItem.id)}
                    >
                      Цэвэрлэх
                    </Button>
                  )}
                </div>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Огноо</TableHead>
                        <TableHead>Төрөл</TableHead>
                        <TableHead>Тоо ширхэг</TableHead>
                        <TableHead>Хэрэглэгч</TableHead>
                        <TableHead>Тайлбар</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsLoading[historyItem.id] ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            Ачааллаж байна...
                          </TableCell>
                        </TableRow>
                      ) : (itemMovements[historyItem.id] || []).length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-4 text-muted-foreground"
                          >
                            Хөдөлгөөний түүх олдсонгүй
                          </TableCell>
                        </TableRow>
                      ) : (
                        (itemMovements[historyItem.id] || []).map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell>{formatDate(movement.created_at)}</TableCell>
                            <TableCell>
                              <span className={getMovementTypeColor(movement.movement_type)}>
                                {getMovementTypeLabel(movement.movement_type)}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {movement.quantity}
                            </TableCell>
                            <TableCell>
                              {movement.user_phone || 'Систем'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {movement.action_description || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
