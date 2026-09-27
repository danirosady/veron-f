import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/form/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import TyrePositionCanvasEditable from '@/components/tyre/TyrePositionCanvasEditable';
import { masterAPI } from '@/api/master';
import { VEHICLE_CHASSIS_IMAGES } from '@/utils/vehicleLayouts';

// ─── Mini Preview ─────────────────────────────────────────────────────────

function TemplatePreview({ config }) {
  const chassisSrc = VEHICLE_CHASSIS_IMAGES[config.unit_type];
  const positions = config.position_config || [];
  const containerRef = useRef(null);
  const [tyreSize, setTyreSize] = useState(16);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setTyreSize(Math.round(el.clientWidth * 0.1));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="aspect-[16/9] bg-gradient-to-b from-slate-100 to-gray-100 rounded-lg border border-gray-200 overflow-hidden relative"
    >
      {chassisSrc ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={chassisSrc}
            alt="Vehicle chassis"
            className="h-full object-contain opacity-60"
            draggable={false}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-gray-400 italic">No chassis</div>
        </div>
      )}

      {/* Center mirror line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-gray-400 opacity-40" />

      {/* Tyre icons: scaled inward to fit inside chassis body area */}
      {positions.map((pos, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${(0.50  + pos.x * 1) * 50}%`,
            top: `${(0.03 + pos.y * 1) * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src="/tyre-pattern.png"
            alt={pos.label}
            className="object-contain opacity-90"
            style={{ width: tyreSize, height: tyreSize * 1.1 }}
            draggable={false}
          />
        </div>
      ))}

      {positions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs text-gray-400">No positions configured</div>
        </div>
      )}
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

// ─── Save Button (owns mutation + toast) ──────────────────────────────────────

import { useToast } from '@/components/ui/Toast';

function TemplateSaveButton({ form, positions, templateId, onSuccess }) {
  const { toast_success, toast_error } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        unit_type: form.unit_type,
        display_name: form.display_name,
        max_position: form.max_position,
        position_config: positions,
        status: form.status || 'active',
      };
      if (templateId) return masterAPI.updateUnitType(templateId, payload);
      return masterAPI.createUnitType(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master', 'unit-types'] });
      queryClient.invalidateQueries({ queryKey: ['unit-tyres'] });
      toast_success('Template berhasil disimpan!');
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
      toast_error(`Gagal menyimpan: ${msg}`);
    },
  });

  return (
    <Button
      onClick={() => mutation.mutate()}
      loading={mutation.isLoading}
      disabled={positions.length === 0}
    >
      {templateId ? 'Update' : 'Create'} Template
    </Button>
  );
}

// ─── Template Editor Modal ──────────────────────────────────────────────────

function TemplateEditorModal({ isOpen, onClose, template }) {
  const [form, setForm] = useState({
    unit_type: '',
    display_name: '',
    max_position: 6,
  });
  const [localPositions, setLocalPositions] = useState([]);

  useEffect(() => {
    if (template) {
      setForm({
        id: template.id,
        unit_type: template.unit_type || '',
        display_name: template.display_name || '',
        max_position: template.max_position || 6,
      });
      setLocalPositions(template.position_config || []);
    } else {
      setForm({ id: null, unit_type: '', display_name: '', max_position: 6 });
      setLocalPositions([]);
    }
  }, [template, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? 'Edit Unit Type Template' : 'New Unit Type Template'}
      size="xxl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <TemplateSaveButton
            form={form}
            positions={localPositions}
            templateId={template?.id}
            onSuccess={onClose}
          />
        </div>
      }
    >
      <div style={{ height: '80vh', maxHeight: '900px' }}>
        <TyrePositionCanvasEditable
          key={template?.id ?? 'new'}
          initialPositions={localPositions}
          maxPosition={form.max_position}
          unitType={form.unit_type || 'CUSTOM'}
          onSave={(savedPositions) => {
            const sorted = [...savedPositions].sort((a, b) => parseInt(a.position, 10) - parseInt(b.position, 10));
            setLocalPositions(sorted);
          }}
          form={form}
          onFormChange={setForm}
        />
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

  const { data, isLoading } = useQuery({
    queryKey: ['master', 'unit-types'],
    queryFn: () => masterAPI.listUnitTypes({ per_page: 100 }),
  });

  const templates = data?.data?.data || data?.data || [];

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
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="aspect-[16/9] bg-gray-100 rounded-lg mb-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
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
