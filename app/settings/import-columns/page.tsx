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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, X, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnMapping {
  fieldName: string;
  columnNames: string[];
  isRequired: boolean;
  displayOrder?: number;
}

// Field definitions for each import type
const LIVE_FIELDS = [
  { name: 'phone', label: 'Утасны дугаар', required: true },
  { name: 'kod', label: 'Барааны код', required: true },
  { name: 'price', label: 'Үнэ', required: false },
  { name: 'comment', label: 'Тайлбар', required: false },
  { name: 'number', label: 'Тоо ширхэг', required: false },
  { name: 'order_date', label: 'Захиалгын огноо', required: false },
  { name: 'received_date', label: 'Ирж авсан огноо', required: false },
  { name: 'paid_date', label: 'Гүйлгээний огноо', required: false },
  { name: 'feature', label: 'Нэмэлт тайлбар', required: false },
];

const ORDER_FIELDS = [
  { name: 'phone', label: 'Утасны дугаар', required: true },
  { name: 'kod', label: 'Барааны код', required: true },
  { name: 'price', label: 'Үнэ', required: false },
  { name: 'feature', label: 'Тайлбар', required: false },
  { name: 'comment', label: 'Нэмэлт тайлбар', required: false },
  { name: 'number', label: 'Тоо ширхэг', required: false },
  { name: 'order_date', label: 'Захиалгын огноо', required: false },
  { name: 'paid_date', label: 'Төлбөрийн огноо', required: false },
  { name: 'received_date', label: 'Ирж авсан огноо', required: false },
  { name: 'with_delivery', label: 'Хүргэлттэй', required: false },
];

// Sortable Row Component
function SortableRow({
  mapping,
  fields,
  handleColumnNameChange,
  handleAddColumnName,
  handleRemoveColumnName,
  handleRequiredChange,
}: {
  mapping: ColumnMapping;
  fields: typeof LIVE_FIELDS;
  handleColumnNameChange: (fieldName: string, index: number, value: string) => void;
  handleAddColumnName: (fieldName: string) => void;
  handleRemoveColumnName: (fieldName: string, index: number) => void;
  handleRequiredChange: (fieldName: string, checked: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mapping.fieldName });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const field = fields.find((f) => f.name === mapping.fieldName);

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[50px] cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      <TableCell className="font-medium">
        {field?.label || mapping.fieldName}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          {mapping.columnNames.map((columnName, index) => (
            <div key={index} className="flex items-center gap-1">
              <Input
                value={columnName}
                onChange={(e) =>
                  handleColumnNameChange(
                    mapping.fieldName,
                    index,
                    e.target.value
                  )
                }
                placeholder="Баганын нэр"
                className="w-[150px]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleRemoveColumnName(mapping.fieldName, index)
                }
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddColumnName(mapping.fieldName)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Нэмэх
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Checkbox
          checked={mapping.isRequired}
          onCheckedChange={(checked) =>
            handleRequiredChange(
              mapping.fieldName,
              checked as boolean
            )
          }
        />
      </TableCell>
    </TableRow>
  );
}

export default function ImportColumnsSettingsPage() {
  const [importType, setImportType] = useState<'live' | 'order'>('live');
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fields = importType === 'live' ? LIVE_FIELDS : ORDER_FIELDS;

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load mappings when import type changes
  useEffect(() => {
    fetchMappings();
  }, [importType]);

  const fetchMappings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/import-columns?type=${importType}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch mappings');
      }

      const data = await response.json();
      
      // Initialize mappings with defaults if none exist
      if (data.mappings.length === 0) {
        const defaultMappings: ColumnMapping[] = fields.map((field, index) => ({
          fieldName: field.name,
          columnNames: getDefaultColumnNames(field.name),
          isRequired: field.required,
          displayOrder: index + 1,
        }));
        setMappings(defaultMappings);
      } else {
        // Merge with field definitions to ensure all fields are present
        const mappingMap = new Map<string, ColumnMapping>(
          data.mappings.map((m: ColumnMapping) => [m.fieldName, m])
        );
        const mergedMappings: ColumnMapping[] = fields.map((field, index) => {
          const existing = mappingMap.get(field.name);
          if (existing) {
            return {
              fieldName: existing.fieldName,
              columnNames: existing.columnNames,
              isRequired: existing.isRequired,
              displayOrder: existing.displayOrder || index + 1,
            };
          }
          return {
            fieldName: field.name,
            columnNames: getDefaultColumnNames(field.name),
            isRequired: field.required,
            displayOrder: index + 1,
          };
        });
        // Sort by displayOrder
        mergedMappings.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setMappings(mergedMappings);
      }
    } catch (err: any) {
      setError(err.message || 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultColumnNames = (fieldName: string): string[] => {
    const defaults: { [key: string]: string[] } = {
      phone: ['Утас', 'phone', 'Phone', 'утас', 'Утасны дугаар', 'утасны дугаар'],
      kod: ['Код', 'kod', 'Kod', 'Барааны код', 'код'],
      price: ['Үнэ', 'price', 'Price', 'үнэ'],
      comment: ['Тайлбар', 'comment', 'Comment', 'тайлбар'],
      number: ['Тоо', 'Тоо ширхэг', 'number', 'Number', 'тоо'],
      received_date: ['Ирж авсан огноо', 'received_date', 'Received Date', 'ирж авсан огноо'],
      paid_date: ['Гүйлгээ хйисэн огноо', 'Гүйлгээний огноо', 'paid_date', 'Paid Date', 'Төлбөрийн огноо'],
      feature: ['Нэмэлт тайлбар', 'feature', 'Feature', 'Онцлог', 'нэмэлт тайлбар'],
      order_date: ['Гүйлгээ хийсэн огноо', 'гүйлгээ хийсэн огноо', 'Захиалгын огноо', 'order_date'],
      with_delivery: ['Хүргэлттэй', 'with_delivery', 'With Delivery', 'хүргэлттэй'],
    };
    return defaults[fieldName] || [];
  };

  const handleAddColumnName = (fieldName: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.fieldName === fieldName
          ? { ...m, columnNames: [...m.columnNames, ''] }
          : m
      )
    );
  };

  const handleRemoveColumnName = (fieldName: string, index: number) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.fieldName === fieldName
          ? {
              ...m,
              columnNames: m.columnNames.filter((_, i) => i !== index),
            }
          : m
      )
    );
  };

  const handleColumnNameChange = (
    fieldName: string,
    index: number,
    value: string
  ) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.fieldName === fieldName
          ? {
              ...m,
              columnNames: m.columnNames.map((name, i) =>
                i === index ? value : name
              ),
            }
          : m
      )
    );
  };

  const handleRequiredChange = (fieldName: string, checked: boolean) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.fieldName === fieldName ? { ...m, isRequired: checked } : m
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = mappings.findIndex((m) => m.fieldName === active.id);
    const newIndex = mappings.findIndex((m) => m.fieldName === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    setMappings((items) => arrayMove(items, oldIndex, newIndex));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Filter out empty column names and add displayOrder
      const cleanedMappings = mappings.map((m, index) => ({
        ...m,
        columnNames: m.columnNames.filter((name) => name.trim() !== ''),
        displayOrder: index + 1,
      }));

      const response = await fetch('/api/import-columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importType,
          mappings: cleanedMappings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Хадгалахад алдаа гарлаа');
      }

      setSuccess('Амжилттай хадгаллаа');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Хадгалахад алдаа гарлаа');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Excel импортын багана тохируулах</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 text-green-600 rounded-md text-sm">
          {success}
        </div>
      )}

      <div className="mb-6">
        <Label htmlFor="import-type" className="mb-2 block">
          Импортын төрөл
        </Label>
        <Select value={importType} onValueChange={(value: 'live' | 'order') => setImportType(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="live">Live цэс</SelectItem>
            <SelectItem value="order">Захиалга цэс</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[200px]">Талбарын нэр</TableHead>
                <TableHead>Excel баганын нэрүүд</TableHead>
                <TableHead className="w-[100px]">Заавал</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={mappings.map((m) => m.fieldName)}
                strategy={verticalListSortingStrategy}
              >
                {mappings.map((mapping) => (
                  <SortableRow
                    key={mapping.fieldName}
                    mapping={mapping}
                    fields={fields}
                    handleColumnNameChange={handleColumnNameChange}
                    handleAddColumnName={handleAddColumnName}
                    handleRemoveColumnName={handleRemoveColumnName}
                    handleRequiredChange={handleRequiredChange}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Хадгалж байна...' : 'Хадгалах'}
        </Button>
      </div>
    </div>
  );
}

