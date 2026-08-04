import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  LayoutGrid,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvasEditable from '@/components/tyre/TyrePositionCanvasEditable';
import { masterAPI } from '@/api/master';

// ─── Mini Preview ─────────────────────────────────────────────────────────

function TemplatePreview({ config }) {
  if (!config?.position_config?.length) {
    return (
      <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-gray-400">
        No positions configured
      </div>
    );
  }

  // Group positions by axle
  const axleGroups = {};
  config.position_config.forEach((p) => {
    const axle = p.axle || 'unknown';
    if (!axleGroups[axle]) axleGroups[axle] = [];
    axleGroups[axle].push(p);
  });

  const axleLabels = {
    rear_1: 'REAR',
    bogie: 'BOGIE',
    front: 'FRONT',
    rear: 'REAR',
    rear_2: 'REAR 2',
  };

  const axleOrder = ['rear_1', 'bogie', 'front', 'rear', 'rear_2'];

  return (
    <div className="h-24 flex flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-50 to-gray-50 rounded-lg border border-gray-200 overflow-hidden px-2 py-2">
      {axleOrder.map((axle) => {
        const slots = axleGroups[axle];
        if (!slots?.length) return null;
        return (
          <div key={axle} className="flex items-center gap-0.5">
            <span className="text-[7px] text-gray-400 font-medium w-6 text-right">{axleLabels[axle] || axle}</span>
            {slots.sort((a, b) => (a.side?.includes('left') ? 0 : 1) - (b.side?.includes('left') ? 0 : 1)).map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                title={slot.label}
              >
                <img
                  src="/tyre-pattern.png"
                  alt={slot.label}
                  className="object-contain opacity-60"
                  style={{ width: 10, height: 12 }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Template Card ─────────────────────────────────────────────────────────

function TemplateCard({ template, onEdit, onDuplicate, onDelete }) {
  const positionCount = template.position_config?.length || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
      <div className="p-4">
        <TemplatePreview config={template} />
      </div>
      <div className="px-4 pb-4">
        <h4 className="font-semibold text-gray-900 text-sm truncate">{template.display_name}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            {template.unit_type}
          </span>
          <span className="text-[10px] text-gray-400">
            {positionCount} positions
          </span>
        </div>
      </div>
      <div className="px-4 pb-3 flex items-center gap-1 border-t border-gray-100 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(template)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => onDuplicate(template)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Copy className="w-3 h-3" />
          Clone
        </button>
        <button
          onClick={() => onDelete(template)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Template Editor Modal ──────────────────────────────────────────────────

function TemplateEditorModal({ isOpen, onClose, onSave, template, positions }) {
  const [form, setForm] = useState({
    unit_type: '',
    display_name: '',
    max_position: 6,
  });
  const [localPositions, setLocalPositions] = useState([]);

  React.useEffect(() => {
    if (template) {
      setForm({
        unit_type: template.unit_type || '',
        display_name: template.display_name || '',
        max_position: template.max_position || 6,
      });
      setLocalPositions(template.position_config || []);
    } else {
      setForm({ unit_type: '', display_name: '', max_position: 6 });
      setLocalPositions([]);
    }
  }, [template, isOpen]);

  const handleSave = (savedPositions) => {
    onSave(form, savedPositions || localPositions);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Unit Type Template' : 'New Unit Type Template'}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            if (localPositions.length > 0) {
              handleSave(localPositions);
            }
          }} disabled={localPositions.length === 0}>
            {template ? 'Update' : 'Create'} Template
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Unit Type Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.unit_type}
              onChange={(e) => setForm({ ...form, unit_type: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })}
              placeholder="e.g. CUSTOM_8POS"
              disabled={!!template} // Can't change code on edit
            />
            <p className="text-[10px] text-gray-400 mt-1">Unique identifier (can't change after create)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="e.g. Custom 8 Position"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max Position <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={form.max_position}
              onChange={(e) => setForm({ ...form, max_position: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        {/* Visual Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Position Layout
            </label>
            <span className="text-xs text-gray-400">
              {localPositions.length} positions defined
            </span>
          </div>
          <TyrePositionCanvasEditable
            positions={localPositions}
            maxPosition={form.max_position}
            unitType={form.unit_type || 'CUSTOM'}
            onSave={(savedPositions) => {
              setLocalPositions(savedPositions);
            }}
          />
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function UnitTypeTemplatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [duplicateSource, setDuplicateSource] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['master', 'unit-types'],
    queryFn: () => masterAPI.listUnitTypes({ per_page: 100 }),
  });

  const templates = data?.data?.data || data?.data || [];

  const saveMutation = useMutation({
    mutationFn: ({ form, positions, id }) => {
      const payload = {
        unit_type: form.unit_type,
        display_name: form.display_name,
        max_position: form.max_position,
        position_config: positions,
      };
      if (id) {
        return masterAPI.updateUnitType(id, payload);
      }
      return masterAPI.createUnitType(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'unit-types'] });
      queryClient.invalidateQueries({ queryKey: ['unit-tyres'] });
      closeEditor();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => masterAPI.deleteUnitType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'unit-types'] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setEditingTemplate(null);
    setEditorOpen(true);
  };

  const openEdit = (template) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const openDuplicate = (template) => {
    setEditingTemplate({
      ...template,
      id: null,
      unit_type: template.unit_type + '_COPY',
      display_name: template.display_name + ' (Copy)',
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = (form, positions) => {
    saveMutation.mutate({
      form,
      positions,
      id: editingTemplate?.id || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/master')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Unit Type Templates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage tyre position layouts and vehicle configurations
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-24 bg-gray-100 rounded-lg mb-4" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No templates yet"
          message="Create your first unit type template to define tyre position layouts."
          action={
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={openEdit}
              onDuplicate={openDuplicate}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <TemplateEditorModal
        isOpen={editorOpen}
        onClose={closeEditor}
        onSave={handleSave}
        template={editingTemplate}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id);
        }}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteTarget?.display_name}"? This cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isLoading}
      />
    </div>
  );
}
