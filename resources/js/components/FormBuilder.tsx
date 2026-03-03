import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Field {
  id?: number;
  uuid?: string;
  name: string;
  label: string;
  description?: string;
  field_type: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: Record<string, any>;
  default_value?: any;
  icon?: string;
  ui_config?: Record<string, any>;
}

interface FormSchema {
  id?: number;
  uuid?: string;
  name: string;
  description?: string;
  entity_type: 'agent' | 'property' | 'buyer' | 'transaction' | 'property_showing' | 'communication';
  form_type?: string;
  status: 'draft' | 'published' | 'deprecated';
  version: number;
  fields: Field[];
  metadata?: Record<string, any>;
  config?: Record<string, any>;
  created_at?: string;
  published_at?: string;
}

interface FieldType {
  label: string;
  description: string;
  icon: string;
  componentName: string;
  defaultConfig: Record<string, any>;
  defaultValidation: Record<string, any>;
}

export const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null);
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldType>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [entityType, setEntityType] = useState<'agent' | 'property' | 'buyer' | 'transaction' | 'property_showing' | 'communication'>('agent');

  // Load field types on mount
  useEffect(() => {
    loadFieldTypes();
    loadForms();
  }, []);

  const loadFieldTypes = async () => {
    try {
      const response = await axios.get('/api/v1/field-types');
      setFieldTypes(response.data);
    } catch (error) {
      console.error('Error loading field types:', error);
    }
  };

  const loadForms = async () => {
    try {
      const response = await axios.get('/api/v1/forms');
      setForms(response.data.data);
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const createNewForm = async () => {
    if (!formName.trim()) {
      alert('Form name is required');
      return;
    }

    try {
      const response = await axios.post('/api/v1/forms', {
        name: formName,
        description: formDescription,
        entity_type: entityType,
        form_type: 'custom',
        fields: [],
      });

      setCurrentForm(response.data);
      setFormName('');
      setFormDescription('');
      setIsCreating(false);
      loadForms();
    } catch (error) {
      console.error('Error creating form:', error);
      alert('Failed to create form');
    }
  };

  const addFieldToForm = async (fieldTypeKey: string) => {
    if (!currentForm) return;

    const fieldType = fieldTypes[fieldTypeKey];
    if (!fieldType) {
      alert('Invalid field type');
      return;
    }

    const newField: Field = {
      name: `field_${Date.now()}`,
      label: fieldType.label,
      field_type: fieldTypeKey,
      required: false,
      options: fieldType.defaultConfig.options || undefined,
      validation: fieldType.defaultValidation,
      ui_config: fieldType.defaultConfig,
    };

    try {
      const response = await axios.post(`/api/v1/forms/${currentForm.id}/fields`, {
        fields: [newField],
      });

      setCurrentForm(response.data.form);
    } catch (error) {
      console.error('Error adding field:', error);
      alert('Failed to add field');
    }
  };

  const updateField = async (field: Field) => {
    if (!field.id) return;

    try {
      await axios.put(`/api/v1/fields/${field.id}`, field);
      if (currentForm) {
        const updatedFields = currentForm.fields.map(f =>
          f.id === field.id ? field : f
        );
        setCurrentForm({ ...currentForm, fields: updatedFields });
      }
      setSelectedField(null);
    } catch (error) {
      console.error('Error updating field:', error);
      alert('Failed to update field');
    }
  };

  const deleteField = async (fieldId: number | undefined) => {
    if (!fieldId || !currentForm) return;

    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      await axios.delete(`/api/v1/fields/${fieldId}`);
      const updatedFields = currentForm.fields.filter(f => f.id !== fieldId);
      setCurrentForm({ ...currentForm, fields: updatedFields });
      setSelectedField(null);
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('Failed to delete field');
    }
  };

  const publishForm = async () => {
    if (!currentForm) return;

    if (currentForm.fields.length === 0) {
      alert('Please add at least one field before publishing');
      return;
    }

    try {
      const response = await axios.post(`/api/v1/forms/${currentForm.id}/publish`);
      setCurrentForm(response.data);
      loadForms();
    } catch (error) {
      console.error('Error publishing form:', error);
      alert('Failed to publish form');
    }
  };

  const updateFormMetadata = async (updates: Record<string, any>) => {
    if (!currentForm) return;

    try {
      const response = await axios.put(`/api/v1/forms/${currentForm.id}`, updates);
      setCurrentForm(response.data);
    } catch (error) {
      console.error('Error updating form:', error);
      alert('Failed to update form');
    }
  };

  return (
    <div className="form-builder-container bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Form Builder</h1>
          <p className="text-gray-600 mt-2">Create and manage custom forms for your CRM</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Forms List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Forms</h2>

              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 mb-4"
                >
                  + New Form
                </button>
              ) : (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <input
                    type="text"
                    placeholder="Form name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                  />
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-2"
                  >
                    <option value="agent">Agent</option>
                    <option value="property">Property</option>
                    <option value="buyer">Buyer</option>
                    <option value="transaction">Transaction</option>
                    <option value="property_showing">Property Showing</option>
                    <option value="communication">Communication</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={createNewForm}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setFormName('');
                        setFormDescription('');
                      }}
                      className="flex-1 bg-gray-400 text-white py-2 px-4 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => setCurrentForm(form)}
                    className={`w-full text-left p-3 rounded border-l-4 transition ${
                      currentForm?.id === form.id
                        ? 'bg-blue-50 border-blue-600 border'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{form.name}</div>
                    <div className="text-xs text-gray-500">
                      {form.fields.length} fields • {form.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="lg:col-span-3">
            {currentForm ? (
              <div className="space-y-6">
                {/* Form Header */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{currentForm.name}</h2>
                      <p className="text-gray-600 mt-1">{currentForm.description}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                          {currentForm.entity_type}
                        </span>
                        <span className={`inline-block text-xs px-3 py-1 rounded-full ${
                          currentForm.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : currentForm.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {currentForm.status}
                        </span>
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                          v{currentForm.version}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {currentForm.status === 'draft' && (
                        <button
                          onClick={publishForm}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Publish
                        </button>
                      )}
                      {currentForm.status === 'published' && (
                        <button
                          onClick={() => alert('Create new version functionality')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          New Version
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Field Types Palette */}
                {currentForm.status === 'draft' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Add Fields</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.entries(fieldTypes).map(([key, fieldType]) => (
                        <button
                          key={key}
                          onClick={() => addFieldToForm(key)}
                          className="flex flex-col items-center p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-500 transition"
                          title={fieldType.description}
                        >
                          <i className={`${fieldType.icon} text-xl text-gray-600 mb-2`}></i>
                          <span className="text-xs text-center text-gray-700 font-medium">
                            {fieldType.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fields List */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Fields ({currentForm.fields.length})
                  </h3>
                  {currentForm.fields.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No fields yet. Add fields from the palette above.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {currentForm.fields.map((field) => (
                        <FieldCard
                          key={field.id || field.uuid}
                          field={field}
                          fieldType={fieldTypes[field.field_type]}
                          isSelected={selectedField?.id === field.id}
                          onSelect={() => setSelectedField(field)}
                          onDelete={() => deleteField(field.id)}
                          isEditingDisabled={currentForm.status !== 'draft'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <i className="fas fa-edit text-5xl text-gray-300 mb-4 block"></i>
                <p className="text-gray-500 text-lg">Select or create a form to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Field Editor Panel */}
        {selectedField && currentForm && currentForm.status === 'draft' && (
          <FieldEditor
            field={selectedField}
            fieldType={fieldTypes[selectedField.field_type]}
            onSave={(updated) => updateField(updated)}
            onClose={() => setSelectedField(null)}
          />
        )}
      </div>
    </div>
  );
};

// Field Card Component
const FieldCard: React.FC<{
  field: Field;
  fieldType?: FieldType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isEditingDisabled: boolean;
}> = ({ field, fieldType, isSelected, onSelect, onDelete, isEditingDisabled }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {fieldType?.icon && <i className={`${fieldType.icon} text-gray-600`}></i>}
            <h4 className="font-semibold text-gray-900">{field.label}</h4>
            {field.required && <span className="text-red-600 font-bold">*</span>}
          </div>
          <p className="text-sm text-gray-600">{field.name}</p>
          {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
          <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
            {field.field_type}
          </span>
        </div>
        {!isEditingDisabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-800 p-2"
            title="Delete field"
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  );
};

// Field Editor Panel
const FieldEditor: React.FC<{
  field: Field;
  fieldType?: FieldType;
  onSave: (field: Field) => void;
  onClose: () => void;
}> = ({ field, fieldType, onSave, onClose }) => {
  const [editedField, setEditedField] = useState(field);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Field</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
            <input
              type="text"
              value={editedField.name}
              onChange={(e) => setEditedField({ ...editedField, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={editedField.label}
              onChange={(e) => setEditedField({ ...editedField, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={editedField.description || ''}
              onChange={(e) => setEditedField({ ...editedField, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
            <input
              type="text"
              value={editedField.help_text || ''}
              onChange={(e) => setEditedField({ ...editedField, help_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={editedField.placeholder || ''}
              onChange={(e) => setEditedField({ ...editedField, placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={editedField.required}
              onChange={(e) => setEditedField({ ...editedField, required: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="required" className="ml-2 text-sm font-medium text-gray-700">
              Required Field
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 border-t pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(editedField);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
