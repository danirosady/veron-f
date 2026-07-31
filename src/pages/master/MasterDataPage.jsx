import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Database, Plus, Pencil, Trash2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import PageHeader from '@/components/list/PageHeader';
import DataTable from '@/components/list/DataTable';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import { usePermission } from '@/hooks/usePermission';
import { masterAPI } from '@/api/master';

const MASTER_TYPES = [
  { key: 'brands', label: 'Brands', icon: '🏷️' },
  { key: 'sizes', label: 'Tyre Sizes', icon: '📏' },
  { key: 'types', label: 'Tyre Types', icon: '🛞' },
  { key: 'patterns', label: 'Patterns', icon: '🔘' },
  { key: 'reasons', label: 'Replacement Reasons', icon: '⚠️' },
  { key: 'actions', label: 'Actions', icon: '🔁' },
  { key: 'remarks', label: 'Remarks', icon: '📝' },
  { key: 'unit-types', label: 'Unit Types', icon: '🚜' },
];

export default function MasterDataPage() {
  const { isSuperadmin } = usePermission();
  const [selectedType, setSelectedType] = useState('brands');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', status: 'active' });
  const queryClient = useQueryClient();

  if (!isSuperadmin()) {
    return <Navigate to="/" replace />;
  }

  const listFn = {
    brands: masterAPI.listBrands,
    sizes: masterAPI.listSizes,
    types: masterAPI.listTypes,
    patterns: masterAPI.listPatterns,
    reasons: masterAPI.listReasons,
    actions: masterAPI.listActions,
    remarks: masterAPI.listRemarks,
    'unit-types': masterAPI.listUnitTypes,
  }[selectedType];

  const createFn = {
    brands: masterAPI.createBrand,
    sizes: masterAPI.createSize,
    types: masterAPI.createType,
    patterns: masterAPI.createPattern,
    reasons: masterAPI.createReason,
    actions: masterAPI.createAction,
    remarks: masterAPI.createRemark,
    'unit-types': masterAPI.createUnitType,
  }[selectedType];

  const updateFn = {
    brands: masterAPI.updateBrand,
    sizes: masterAPI.updateSize,
    types: masterAPI.updateType,
    patterns: masterAPI.updatePattern,
    reasons: masterAPI.updateReason,
    actions: masterAPI.updateAction,
    remarks: masterAPI.updateRemark,
    'unit-types': masterAPI.updateUnitType,
  }[selectedType];

  const deleteFn = {
    brands: masterAPI.deleteBrand,
    sizes: masterAPI.deleteSize,
    types: masterAPI.deleteType,
    patterns: masterAPI.deletePattern,
    reasons: masterAPI.deleteReason,
    actions: masterAPI.deleteAction,
    remarks: masterAPI.deleteRemark,
    'unit-types': masterAPI.deleteUnitType,
  }[selectedType];

  const { data, isLoading } = useQuery({
    queryKey: ['master', selectedType],
    queryFn: () => listFn({ per_page: 200 }),
    enabled: Boolean(listFn),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing ? updateFn(editing.id, payload) : createFn(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', selectedType] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', selectedType] });
      setDeleteTarget(null);
    },
  });

  const items = data?.data?.data || data?.data || [];
  const currentLabel = MASTER_TYPES.find((t) => t.key === selectedType)?.label || '';

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      code: '',
      description: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ name: form.name });
  };

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'code', header: 'Code', render: (v) => v || '-' },
    { key: 'description', header: 'Description', render: (v) => v || '-' },
    {
      key: 'status',
      header: 'Status',
      render: (v) => v || '-',
    },
  ];

  const actions = (row) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => openEdit(row)}
        className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setDeleteTarget(row)}
        className="p-1.5 rounded text-red-600 hover:bg-red-50"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        subtitle="Manage brands, sizes, types, patterns, and other reference data"
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add {currentLabel.slice(0, -1) || 'Item'}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {MASTER_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedType(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedType === t.key
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <Card padding={false}>
        <DataTable
          columns={columns}
          data={items}
          loading={isLoading}
          actions={actions}
          emptyIcon={Database}
          emptyTitle={`No ${currentLabel.toLowerCase()} found`}
          emptyMessage={`Add your first ${currentLabel.toLowerCase().slice(0, -1)} to get started.`}
          emptyAction={openCreate}
          emptyActionLabel={`Add ${currentLabel.slice(0, -1) || 'Item'}`}
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${currentLabel.slice(0, -1) || 'Item'}` : `New ${currentLabel.slice(0, -1) || 'Item'}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saveMutation.isLoading}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code</label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}