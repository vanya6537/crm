import type { FieldOption } from '@/types/entity-schema';

export interface ModelFieldTypeMeta {
    label?: string;
    description?: string;
    category?: string;
    icon?: string;
    componentName?: string;
}

export interface ModelManagerField {
    uuid: string;
    id: number;
    entity_type: string;
    name: string;
    label: string;
    description?: string;
    field_type: string;
    sort_order: number;
    required: boolean;
    is_active: boolean;
    placeholder?: string;
    help_text?: string;
    options?: Array<FieldOption | string>;
    reference_table?: string;
    validation?: Record<string, unknown>;
    default_value?: unknown;
    ui_config?: Record<string, unknown>;
    is_master_relation?: boolean;
    allow_multiple?: boolean;
    max_items?: number;
    icon?: string;
    created_at?: string;
    updated_at?: string;
}