'use client';

import { useEffect, useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/csrf';
import type { EntityFieldSchema, EntitySchema, FieldOption } from '@/types/entity-schema';

interface DynamicEntityFiltersProps {
    entitySchema: EntitySchema;
    values: Record<string, unknown>;
    onChange: (fieldName: string, value: unknown) => void;
}

export function appendDynamicFilterParams(params: URLSearchParams, values: Record<string, unknown>) {
    for (const [fieldName, value] of Object.entries(values)) {
        if (value === null || value === undefined || value === '') {
            continue;
        }

        if (Array.isArray(value)) {
            for (const item of value) {
                if (item === null || item === undefined || item === '') {
                    continue;
                }

                params.append(`dynamic_filters[${fieldName}][]`, String(item));
            }

            continue;
        }

        params.append(`dynamic_filters[${fieldName}]`, String(value));
    }
}

export function DynamicEntityFilters({ entitySchema, values, onChange }: DynamicEntityFiltersProps) {
    const filterableFields = useMemo(
        () => entitySchema.dynamic_fields.filter((field) => field.filterable),
        [entitySchema.dynamic_fields]
    );

    const relationFields = useMemo(
        () => filterableFields.filter((field) => ['reference', 'relation', 'master_relation', 'many_to_many'].includes(field.field_type) && field.reference_table),
        [filterableFields]
    );

    const [relationOptions, setRelationOptions] = useState<Record<string, FieldOption[]>>({});

    useEffect(() => {
        const tables = Array.from(new Set(relationFields.map((field) => field.reference_table).filter(Boolean))) as string[];
        if (tables.length === 0) {
            return;
        }

        let isCancelled = false;

        const loadOptions = async () => {
            await Promise.all(
                tables.map(async (table) => {
                    try {
                        const response = await apiRequest(`/api/v1/model-fields/relation-options/${table}?limit=100`, {
                            method: 'GET',
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to load relation options for ${table}`);
                        }

                        const payload = await response.json();
                        if (!isCancelled) {
                            setRelationOptions((prev) => ({ ...prev, [table]: payload.data || [] }));
                        }
                    } catch (error) {
                        console.error(error);
                    }
                })
            );
        };

        void loadOptions();

        return () => {
            isCancelled = true;
        };
    }, [relationFields]);

    if (filterableFields.length === 0) {
        return null;
    }

    const normalizeOptions = (options?: Array<FieldOption | string> | null): FieldOption[] => {
        if (!options) {
            return [];
        }

        return options.map((option) =>
            typeof option === 'string'
                ? { value: option, label: option }
                : { value: option.value, label: option.label }
        );
    };

    const renderField = (field: EntityFieldSchema) => {
        const value = values[field.name];
        const fieldOptions = ['reference', 'relation', 'master_relation', 'many_to_many'].includes(field.field_type)
            ? relationOptions[field.reference_table || ''] || []
            : normalizeOptions(field.options);

        if (['text', 'short_text', 'textarea', 'long_text', 'big_text', 'email', 'phone', 'url'].includes(field.field_type)) {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    <Input
                        id={`filter-${field.name}`}
                        value={String(value ?? '')}
                        placeholder={field.placeholder || 'Фильтр'}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                </div>
            );
        }

        if (['integer', 'number', 'decimal'].includes(field.field_type)) {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    <Input
                        id={`filter-${field.name}`}
                        type="number"
                        value={String(value ?? '')}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                </div>
            );
        }

        if (['date', 'datetime', 'time'].includes(field.field_type)) {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    <Input
                        id={`filter-${field.name}`}
                        type={field.field_type === 'datetime' ? 'datetime-local' : field.field_type}
                        value={String(value ?? '')}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                </div>
            );
        }

        if (field.field_type === 'checkbox') {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    <Select
                        value={value === undefined || value === null || value === '' ? '__all__' : String(value)}
                        onValueChange={(nextValue) => onChange(field.name, nextValue === '__all__' ? '' : nextValue)}
                    >
                        <SelectTrigger id={`filter-${field.name}`}>
                            <SelectValue placeholder="Любое значение" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Любое значение</SelectItem>
                            <SelectItem value="true">Да</SelectItem>
                            <SelectItem value="false">Нет</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        if (['multiselect', 'checklist', 'many_to_many'].includes(field.field_type) || field.allow_multiple) {
            const currentValues = Array.isArray(value) ? value.map(String) : [];

            return (
                <div key={field.name} className="space-y-3 md:col-span-2">
                    <Label>{field.label}</Label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {fieldOptions.map((option) => {
                            const checked = currentValues.includes(option.value);
                            return (
                                <label key={option.value} className="flex items-center gap-3 rounded-md border p-3 text-sm">
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={(nextChecked) => {
                                            const nextValues = nextChecked
                                                ? [...currentValues, option.value]
                                                : currentValues.filter((item) => item !== option.value);
                                            onChange(field.name, nextValues);
                                        }}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (['select', 'radio', 'reference', 'relation', 'master_relation'].includes(field.field_type)) {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={`filter-${field.name}`}>{field.label}</Label>
                    <Select
                        value={value === undefined || value === null || value === '' ? '__all__' : String(value)}
                        onValueChange={(nextValue) => onChange(field.name, nextValue === '__all__' ? '' : nextValue)}
                    >
                        <SelectTrigger id={`filter-${field.name}`}>
                            <SelectValue placeholder="Любое значение" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all__">Любое значение</SelectItem>
                            {fieldOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">Дополнительные фильтры</h3>
            <Separator />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filterableFields.map((field) => renderField(field))}
            </div>
        </div>
    );
}