'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';

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

interface Order {
  id: number;
  phone: string;
  baraanii_kod_id: number;
  baraanii_kod_name?: string;
  color_id: number | null;
  color_name?: string;
  size_id: number | null;
  size_name?: string;
  price: number | null;
  feature: string | null;
  number: number | null;
  order_date: string | null;
  received_date: string | null;
  paid_date: string | null;
  with_delivery: boolean;
  comment: string | null;
  status?: number;
  created_at: string;
  metadata?: {
    toollogo?: number;
    price_toollogo?: number;
    with_delivery_numeric?: number;
  } | null;
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

export default function OrderMonthPage() {
  const params = useParams();
  const router = useRouter();
  const year = params?.year as string;
  const month = params?.month as string;
  const yearNum = parseInt(year || '0');
  const monthNum = parseInt(month || '0');

  const [orders, setOrders] = useState<Order[]>([]);
  const [baraaniiKodList, setBaraaniiKodList] = useState<BaraaniiKod[]>([]);
  const [colorsList, setColorsList] = useState<Color[]>([]);
  const [sizesList, setSizesList] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<number>(1);
  const [showColorModal, setShowColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<'blue' | 'white'>('blue');
  
  // Pagination states
  const [itemsPerPage, setItemsPerPage] = useState<number>(200);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Filter states for each column
  const [filters, setFilters] = useState({
    phone: '',
    kod: '',
    price: '',
    feature: '',
    number: '',
    order_date: '',
    received_date: '',
    comment: '',
    phoneColor: 'all',
    kodColor: 'all',
    priceColor: 'all',
  });

  // Date range filter states
  const [dateRangeFilter, setDateRangeFilter] = useState({
    dateField: '' as 'order_date' | 'received_date' | '',
    startDate: '',
    endDate: '',
  });

  // Form state
  const [phone, setPhone] = useState('');
  const [baraaniiKodId, setBaraaniiKodId] = useState<string>('');
  const [newBaraaniiKod, setNewBaraaniiKod] = useState('');
  const [isNewBaraaniiKod, setIsNewBaraaniiKod] = useState(false);
  const [colorId, setColorId] = useState<string>('none');
  const [sizeId, setSizeId] = useState<string>('none');
  const [price, setPrice] = useState('');
  const [feature, setFeature] = useState('');
  const [number, setNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [statusChangeDate, setStatusChangeDate] = useState('');
  const [withDelivery, setWithDelivery] = useState(false);
  const [comment, setComment] = useState('');

  // Fetch all orders and filter by year/month
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/order?type=2');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      // Filter by paid_date year and month
      const filtered = data.filter((order: Order) => {
        if (!order.paid_date) return false;
        const orderDate = new Date(order.paid_date);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth() + 1; // getMonth() returns 0-11
        return orderYear === yearNum && orderMonth === monthNum;
      });
      
      setOrders(filtered);
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

  useEffect(() => {
    if (year && month) {
      fetchOrders();
      fetchBaraaniiKod();
      fetchColors();
      fetchSizes();
    }
  }, [year, month]);

  // Reset form
  const resetForm = () => {
    setPhone('');
    setBaraaniiKodId('');
    setNewBaraaniiKod('');
    setIsNewBaraaniiKod(false);
    setColorId('none');
    setSizeId('none');
    setPrice('');
    setFeature('');
    setNumber('');
    setOrderDate('');
    setReceivedDate('');
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
    setIsNewBaraaniiKod(false);
    setColorId(order.color_id?.toString() || 'none');
    setSizeId(order.size_id?.toString() || 'none');
    setPrice(order.price?.toString() || '');
    setFeature(order.feature || '');
    setNumber(order.number?.toString() || '');
    setOrderDate(order.order_date || '');
    setReceivedDate(order.received_date || '');
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

    let finalBaraaniiKodId = baraaniiKodId;

    if (isNewBaraaniiKod) {
      if (!newBaraaniiKod.trim()) {
        setError('Барааны код оруулах шаардлагатай');
        return;
      }

      try {
        const createResponse = await fetch('/api/baraanii-kod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kod: newBaraaniiKod.trim() }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create product code');
        }

        const newKod = await createResponse.json();
        finalBaraaniiKodId = newKod.id.toString();
        fetchBaraaniiKod();
      } catch (err: any) {
        setError(err.message || 'Барааны код үүсгэхэд алдаа гарлаа');
        return;
      }
    } else {
      if (!baraaniiKodId) {
        setError('Барааны код сонгох шаардлагатай');
        return;
      }
    }

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          baraanii_kod_id: parseInt(finalBaraaniiKodId),
          color_id: colorId && colorId !== 'none' ? parseInt(colorId) : null,
          size_id: sizeId && sizeId !== 'none' ? parseInt(sizeId) : null,
          price: price ? parseFloat(price) : null,
          feature: feature.trim() || null,
          number: number ? parseInt(number) : null,
          order_date: orderDate || null,
          received_date: receivedDate || null,
          withDelivery,
          comment: comment.trim() || null,
          type: 2,
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
          color_id: colorId && colorId !== 'none' ? parseInt(colorId) : null,
          size_id: sizeId && sizeId !== 'none' ? parseInt(sizeId) : null,
          price: price ? parseFloat(price) : null,
          feature: feature.trim() || null,
          number: number ? parseInt(number) : null,
          order_date: orderDate || null,
          received_date: receivedDate || null,
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

  // Get background color for phone column
  const getPhoneBackgroundColor = (order: Order): string => {
    // First check with_delivery_numeric from metadata
    const withDeliveryNumeric = order.metadata?.with_delivery_numeric;
    if (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null) {
      if (Number(withDeliveryNumeric) === 1) {
        // Ирж авсан - deep green with white text
        return 'bg-green-700 text-white';
      } else if (Number(withDeliveryNumeric) === 7) {
        // Хүргэлтэнд гарсан - deep red with white text
        return 'bg-red-700 text-white';
      }
    }
    // Fall back to status if with_delivery_numeric is not available
    const status = order.status;
    if (status === 2) {
      // Ирж авсан - deep green with white text
      return 'bg-green-700 text-white';
    } else if (status === 3) {
      // Хүргэлтэнд гарсан - deep red with white text
      return 'bg-red-700 text-white';
    }
    return '';
  };

  // Get background color for baraanii_kod column
  const getKodBackgroundColor = (order: Order): string => {
    const toollogo = order.metadata?.toollogo;
    if (toollogo !== undefined && toollogo !== null && Number(toollogo) === 3) {
      return 'bg-yellow-100';
    }
    return 'bg-white';
  };

  // Get background color for price column
  const getPriceBackgroundColor = (order: Order): string => {
    const priceToollogo = order.metadata?.price_toollogo;
    if (priceToollogo !== undefined && priceToollogo !== null && Number(priceToollogo) === 3) {
      return 'bg-blue-100';
    }
    return 'bg-white';
  };

  // Handle Excel import
  const handleExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      setError('Зөвхөн Excel файл (.xlsx, .xls) эсвэл CSV файл оруулна уу');
      return;
    }

    try {
      setImporting(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/order/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Excel файл импортлоход алдаа гарлаа');
      }

      await fetchOrders();
      alert('Excel файл амжилттай импортлогдлоо');
    } catch (err: any) {
      setError(err.message || 'Excel файл импортлоход алдаа гарлаа');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  // Handle checkbox selection
  const handleCheckboxChange = (orderId: number, checked: boolean) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(orderId);
      } else {
        newSet.delete(orderId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(paginatedOrders.map((order) => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (selectedOrders.size === 0) {
      setError('Хамгийн багадаа нэг захиалга сонгоно уу');
      return;
    }

    if ((newStatus === 2 || newStatus === 3) && !statusChangeDate) {
      const statusLabel = newStatus === 2 ? 'Ирж авсан' : 'Хүргэлтэнд гарсна';
      setError(`${statusLabel} төлөвт шилжүүлэхдээ огноо оруулах шаардлагатай`);
      return;
    }

    try {
      const response = await fetch('/api/order/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          status: newStatus,
          date: (newStatus === 2 || newStatus === 3) ? statusChangeDate : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Төлөв шинэчлэхэд алдаа гарлаа');
      }

      await fetchOrders();
      setSelectedOrders(new Set());
      setShowStatusModal(false);
      setNewStatus(1);
      setStatusChangeDate('');
    } catch (err: any) {
      setError(err.message || 'Төлөв шинэчлэхэд алдаа гарлаа');
    }
  };

  // Handle color change
  const handleColorChange = async () => {
    if (selectedOrders.size === 0) {
      setError('Хамгийн багадаа нэг захиалга сонгоно уу');
      return;
    }

    try {
      const response = await fetch('/api/order/color', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrders),
          color: selectedColor,
        }),
      });

      if (!response.ok) {
        throw new Error('Үнэний баганы өнгийг шинэчлэхэд алдаа гарлаа');
      }

      await fetchOrders();
      setSelectedOrders(new Set());
      setShowColorModal(false);
      setSelectedColor('blue');
    } catch (err: any) {
      setError(err.message || 'Үнэний баганы өнгийг шинэчлэхэд алдаа гарлаа');
    }
  };

  // Get status color
  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-white hover:bg-gray-50';
      case 2:
        return 'bg-green-100 hover:bg-green-200';
      case 3:
        return 'bg-red-100 hover:bg-red-200';
      default:
        return '';
    }
  };

  // Get status label
  const getStatusLabel = (status: number) => {
    switch (status) {
      case 1:
        return 'Шинэ үүссэн';
      case 2:
        return 'Ирж авсан';
      case 3:
        return 'Хүргэлтгэнд гаргасан';
      default:
        return 'Шинэ үүссэн';
    }
  };

  // Filter orders based on filter values
  const filteredOrders = orders.filter((order) => {
    if (filters.phone && !order.phone.toLowerCase().includes(filters.phone.toLowerCase())) {
      return false;
    }
    
    if (filters.phoneColor && filters.phoneColor !== 'all') {
      const withDeliveryNumeric = order.metadata?.with_delivery_numeric;
      const status = order.status || 1;
      const filterValue = parseInt(filters.phoneColor);
      
      if (filterValue === 0) {
        // Filter for white (no red or green background)
        // White means: not (with_delivery_numeric === 1 or 7) AND not (status === 2 or 3)
        const hasGreen = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 1) || status === 2;
        const hasRed = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 7) || status === 3;
        if (hasGreen || hasRed) {
          return false;
        }
      } else if (filterValue === 2) {
        // Filter for green (ирж авсан): with_delivery_numeric === 1 OR status === 2
        const hasGreen = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 1) || status === 2;
        if (!hasGreen) {
          return false;
        }
      } else if (filterValue === 3) {
        // Filter for red (хүргэлтэнд гарсан): with_delivery_numeric === 7 OR status === 3
        const hasRed = (withDeliveryNumeric !== undefined && withDeliveryNumeric !== null && Number(withDeliveryNumeric) === 7) || status === 3;
        if (!hasRed) {
          return false;
        }
      }
    }
    
    if (filters.kod && !(order.baraanii_kod_name || '').toLowerCase().includes(filters.kod.toLowerCase())) {
      return false;
    }
    
    if (filters.kodColor && filters.kodColor !== 'all') {
      const toollogo = order.metadata?.toollogo;
      const filterValue = parseInt(filters.kodColor);
      if (filterValue === 0) {
        if (toollogo !== undefined && toollogo !== null && Number(toollogo) === 3) {
          return false;
        }
      } else {
        if (toollogo === undefined || toollogo === null || Number(toollogo) !== filterValue) {
          return false;
        }
      }
    }
    
    if (filters.price) {
      const priceFilter = parseFloat(filters.price);
      if (isNaN(priceFilter) || order.price === null || order.price !== priceFilter) {
        if (!formatCurrency(order.price).includes(filters.price)) {
          return false;
        }
      }
    }
    
    if (filters.priceColor && filters.priceColor !== 'all') {
      const priceToollogo = order.metadata?.price_toollogo;
      const status = order.status || 1;
      const filterValue = filters.priceColor;
      
      if (filterValue === 'red') {
        // Filter for red background (status 3)
        if (status !== 3) {
          return false;
        }
      } else if (filterValue === 'green') {
        // Filter for green background (status 2)
        if (status !== 2) {
          return false;
        }
      } else if (filterValue === 'white') {
        // Filter for white background (status 1 and no blue overlay)
        if (status !== 1 || (priceToollogo !== undefined && priceToollogo !== null && Number(priceToollogo) === 3)) {
          return false;
        }
      } else if (filterValue === 'blue') {
        // Filter for blue background (price_toollogo === 3)
        if (priceToollogo === undefined || priceToollogo === null || Number(priceToollogo) !== 3) {
          return false;
        }
      }
    }
    
    if (filters.feature && !(order.feature || '').toLowerCase().includes(filters.feature.toLowerCase())) {
      return false;
    }
    
    if (filters.number) {
      const numberFilter = parseFloat(filters.number);
      if (isNaN(numberFilter) || order.number === null || order.number !== numberFilter) {
        if (!String(order.number || '').includes(filters.number)) {
          return false;
        }
      }
    }
    
    if (dateRangeFilter.dateField && (dateRangeFilter.startDate || dateRangeFilter.endDate)) {
      const orderDateValue = order[dateRangeFilter.dateField];
      if (!orderDateValue) {
        return false;
      }
      
      const orderDate = new Date(orderDateValue);
      orderDate.setHours(0, 0, 0, 0);
      
      if (dateRangeFilter.startDate) {
        const startDate = new Date(dateRangeFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (orderDate < startDate) {
          return false;
        }
      }
      
      if (dateRangeFilter.endDate) {
        const endDate = new Date(dateRangeFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) {
          return false;
        }
      }
    }
    
    if (!dateRangeFilter.dateField || dateRangeFilter.dateField !== 'order_date') {
      if (filters.order_date && order.order_date) {
        const filterDate = new Date(filters.order_date);
        const orderDateValue = new Date(order.order_date);
        if (
          filterDate.getFullYear() !== orderDateValue.getFullYear() ||
          filterDate.getMonth() !== orderDateValue.getMonth() ||
          filterDate.getDate() !== orderDateValue.getDate()
        ) {
          return false;
        }
      }
    }
    
    if (!dateRangeFilter.dateField || dateRangeFilter.dateField !== 'received_date') {
      if (filters.received_date && order.received_date) {
        const filterDate = new Date(filters.received_date);
        const orderDate = new Date(order.received_date);
        if (
          filterDate.getFullYear() !== orderDate.getFullYear() ||
          filterDate.getMonth() !== orderDate.getMonth() ||
          filterDate.getDate() !== orderDate.getDate()
        ) {
          return false;
        }
      }
    }
    
    if (filters.comment && !(order.comment || '').toLowerCase().includes(filters.comment.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle date range filter changes
  const handleDateRangeChange = (field: keyof typeof dateRangeFilter, value: string) => {
    setDateRangeFilter((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1);
  };

  // Clear date range filter
  const clearDateRangeFilter = () => {
    setDateRangeFilter({
      dateField: '',
      startDate: '',
      endDate: '',
    });
    setCurrentPage(1);
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
          <Link href="/order" className="text-muted-foreground hover:text-foreground">
            ← Захиалга
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/order/${year}`} className="text-muted-foreground hover:text-foreground">
            {year}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">{monthNames[monthNum - 1]}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Захиалга - {year} оны {monthNames[monthNum - 1]}</h1>
        </div>
        
        {/* Date Range Filter */}
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex flex-wrap items-end gap-4">
            {dateRangeFilter.dateField && (
              <>
                <div className="grid gap-1">
                  <Label htmlFor="start-date" className="text-sm font-medium">
                    Эхлэх огноо
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRangeFilter.startDate}
                    onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                    className="w-[180px]"
                  />
                </div>
                
                <div className="grid gap-1">
                  <Label htmlFor="end-date" className="text-sm font-medium">
                    Дуусах огноо
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRangeFilter.endDate}
                    onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                    className="w-[180px]"
                    min={dateRangeFilter.startDate || undefined}
                  />
                </div>
                
                <Button
                  variant="outline"
                  onClick={clearDateRangeFilter}
                  className="h-10"
                >
                  Цэвэрлэх
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Шинэ нэмэх
            </Button>
            {selectedOrders.size > 0 && (
              <>
                <Button
                  onClick={() => setShowStatusModal(true)}
                  variant="default"
                >
                  Төлөв өөрчлөх ({selectedOrders.size})
                </Button>
                <Button
                  onClick={() => setShowColorModal(true)}
                  variant="outline"
                >
                  Үнэний баганы өнгө өөрчлөх ({selectedOrders.size})
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm whitespace-nowrap">
                Хуудас бүрт:
              </Label>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
              >
                <SelectTrigger id="items-per-page" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="2000">2000</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExcelImport} disabled={importing}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? 'Импортлож байна...' : 'Excel импорт'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {error && !isDialogOpen && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Төлөв өөрчлөх</DialogTitle>
            <DialogDescription>
              {selectedOrders.size} захиалгын төлөв өөрчлөх
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="status-select">Шинэ төлөв</Label>
              <Select
                value={String(newStatus)}
                onValueChange={(value) => {
                  setNewStatus(parseInt(value));
                  if (parseInt(value) !== 2 && parseInt(value) !== 3) {
                    setStatusChangeDate('');
                  }
                }}
              >
                <SelectTrigger id="status-select" className="mt-2">
                  <SelectValue placeholder="Төлөв сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Шинэ үүссэн</SelectItem>
                  <SelectItem value="2">Ирж авсан</SelectItem>
                  <SelectItem value="3">Хүргэлтгэнд гаргасан</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newStatus === 2 || newStatus === 3) && (
              <div>
                <Label htmlFor="status-date">Ирж авсан огноо <span className="text-destructive">*</span></Label>
                <Input
                  id="status-date"
                  type="date"
                  value={statusChangeDate}
                  onChange={(e) => setStatusChangeDate(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowStatusModal(false);
              setStatusChangeDate('');
            }}>
              Цуцлах
            </Button>
            <Button onClick={handleStatusChange}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Change Modal */}
      <Dialog open={showColorModal} onOpenChange={setShowColorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Үнэний баганы өнгө өөрчлөх</DialogTitle>
            <DialogDescription>
              {selectedOrders.size} захиалгын үнэний баганы өнгө өөрчлөх
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="color-select">Өнгө сонгох</Label>
              <Select
                value={selectedColor}
                onValueChange={(value) => setSelectedColor(value as 'blue' | 'white')}
              >
                <SelectTrigger id="color-select" className="mt-2">
                  <SelectValue placeholder="Өнгө сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                      <span>Цэнхэр</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="white">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                      <span>Цагаан</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowColorModal(false);
              setSelectedColor('blue');
            }}>
              Цуцлах
            </Button>
            <Button onClick={handleColorChange}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedOrders.length > 0 &&
                    paginatedOrders.every((order) =>
                      selectedOrders.has(order.id)
                    )
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Утас</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.phone}
                    onChange={(e) => handleFilterChange('phone', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select
                    value={filters.phoneColor}
                    onValueChange={(value) => handleFilterChange('phoneColor', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Өнгөөр шүүх" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      <SelectItem value="3">🔴 Улаан (хүргэлтэнд гарсан)</SelectItem>
                      <SelectItem value="2">🟢 Ногоон (ирж авсан)</SelectItem>
                      <SelectItem value="0">⚪ Цагаан (өөр)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Барааны код</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.kod}
                    onChange={(e) => handleFilterChange('kod', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select
                    value={filters.kodColor}
                    onValueChange={(value) => handleFilterChange('kodColor', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Өнгөөр шүүх" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      <SelectItem value="3">🟡 Шар (тооллого)</SelectItem>
                      <SelectItem value="0">⚪ Цагаан (өөр)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Үнэ</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.price}
                    onChange={(e) => handleFilterChange('price', e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Select
                    value={filters.priceColor}
                    onValueChange={(value) => handleFilterChange('priceColor', value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Өнгөөр шүүх" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Бүгд</SelectItem>
                      <SelectItem value="red">🔴 Улаан</SelectItem>
                      <SelectItem value="green">🟢 Ногоон</SelectItem>
                      <SelectItem value="blue">🔵 Цэнхэр</SelectItem>
                      <SelectItem value="white">⚪ Цагаан</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Онцлог</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.feature}
                    onChange={(e) => handleFilterChange('feature', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Тоо ширхэг</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.number}
                    onChange={(e) => handleFilterChange('number', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Ирж авсан огноо</span>
                  <Input
                    type="date"
                    value={filters.received_date}
                    onChange={(e) => handleFilterChange('received_date', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Захиалгын огноо</span>
                  <Input
                    type="date"
                    value={filters.order_date}
                    onChange={(e) => handleFilterChange('order_date', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>Хүргэлттэй</TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Тайлбар</span>
                  <Input
                    placeholder="Шүүх..."
                    value={filters.comment}
                    onChange={(e) => handleFilterChange('comment', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col gap-1">
                  <span>Төлбөрийн огноо</span>
                </div>
              </TableHead>
              <TableHead className="w-[150px]">Үйлдэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8">
                  Ачааллаж байна...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={15}
                  className="text-center py-8 text-muted-foreground"
                >
                  Мэдээлэл олдсонгүй
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className={order.status ? getStatusColor(order.status) : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange(order.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>{order.id}</TableCell>
                  <TableCell className={`font-medium ${getPhoneBackgroundColor(order)}`}>
                    {order.phone}
                  </TableCell>
                  <TableCell className={getKodBackgroundColor(order)}>
                    {order.baraanii_kod_name || `ID: ${order.baraanii_kod_id}`}
                  </TableCell>
                  <TableCell className={getPriceBackgroundColor(order)}>
                    {formatCurrency(order.price)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.feature || '-'}
                  </TableCell>
                  <TableCell>{order.number || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded ${
                        order.status === 3
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {formatDate(order.received_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatDate(order.order_date)}
                  </TableCell>
                  <TableCell>
                    {order.metadata?.with_delivery_numeric !== undefined && order.metadata?.with_delivery_numeric !== null
                      ? String(order.metadata.with_delivery_numeric)
                      : order.with_delivery ? 'Тийм' : 'Үгүй'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.comment || '-'}
                  </TableCell>
                  <TableCell>
                    {formatDate(order.paid_date)}
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

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Нийт: {filteredOrders.length} захиалга | 
            Хуудас {currentPage} / {totalPages} | 
            {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} харуулж байна
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Өмнөх
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Дараах
            </Button>
          </div>
        </div>
      )}

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
                {!editingOrder && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      id="newBaraaniiKod"
                      checked={isNewBaraaniiKod}
                      onCheckedChange={(checked: boolean) => {
                        setIsNewBaraaniiKod(checked === true);
                        setBaraaniiKodId('');
                        setNewBaraaniiKod('');
                        setError('');
                      }}
                    />
                    <Label
                      htmlFor="newBaraaniiKod"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Шинэ барааны код нэмэх
                    </Label>
                  </div>
                )}
                {isNewBaraaniiKod && !editingOrder ? (
                  <Input
                    id="newBaraaniiKod"
                    value={newBaraaniiKod}
                    onChange={(e) => {
                      setNewBaraaniiKod(e.target.value);
                      setError('');
                    }}
                    placeholder="Шинэ барааны код оруулна уу"
                  />
                ) : (
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
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Өнгө</Label>
                <Select
                  value={colorId}
                  onValueChange={(value: string) => {
                    setColorId(value);
                    setError('');
                  }}
                >
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Өнгө сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Өнгө сонгохгүй</SelectItem>
                    {colorsList.map((color) => (
                      <SelectItem key={color.id} value={color.id.toString()}>
                        {color.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Хэмжээ</Label>
                <Select
                  value={sizeId}
                  onValueChange={(value: string) => {
                    setSizeId(value);
                    setError('');
                  }}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Хэмжээ сонгоно уу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Хэмжээ сонгохгүй</SelectItem>
                    {sizesList.map((size) => (
                      <SelectItem key={size.id} value={size.id.toString()}>
                        {size.name}
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
                <Label htmlFor="receivedDate">Ирж авсан огноо</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
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

