export interface FieldOption {
    value: string;
    label: string;
}

export interface EntityFieldSchema {
    uuid?: string;
    name: string;
    label: string;
    description?: string | null;
    field_type: string;
    field_type_group?: string;
    required: boolean;
    placeholder?: string | null;
    help_text?: string | null;
    options?: Array<FieldOption | string> | null;
    reference_table?: string | null;
    validation?: Record<string, unknown> | null;
    default_value?: unknown;
    ui_config?: Record<string, unknown> | null;
    allow_multiple?: boolean;
    max_items?: number | null;
    icon?: string | null;
    component?: string | null;
    source: 'core' | 'dynamic';
    storage: 'column' | 'custom_fields';
    searchable?: boolean;
    filterable?: boolean;
}

export interface SerializedDynamicFieldValue {
    field: EntityFieldSchema;
    value: unknown;
    display_value?: unknown;
}

export type SerializedDynamicFieldValueMap = Record<string, SerializedDynamicFieldValue>;

export interface EntitySchema {
    entity_type: string;
    core_fields: EntityFieldSchema[];
    dynamic_fields: EntityFieldSchema[];
    fields: EntityFieldSchema[];
}