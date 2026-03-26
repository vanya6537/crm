"use client";

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { EntityFieldSchema, EntitySchema, FieldOption, SerializedDynamicFieldValueMap } from '@/types/entity-schema';

interface DynamicFieldValuesProps {
    entitySchema: EntitySchema;
    values?: Record<string, unknown>;
    dynamicFieldValues?: SerializedDynamicFieldValueMap;
    title?: string;
    variant?: 'compact' | 'section';
    maxFields?: number;
    emptyText?: string;
}

type RenderableValue = string | number | boolean | null | Array<string | number | boolean>;

export interface DynamicFieldDisplayItem {
    field: EntityFieldSchema;
    formatted: RenderableValue;
    rawValue: unknown;
    displayValue: unknown;
}

function normalizeOptions(options?: Array<FieldOption | string> | null): Record<string, string> {
    if (!options) {
        return {};
    }

    return options.reduce<Record<string, string>>((accumulator, option) => {
        if (typeof option === 'string') {
            accumulator[option] = option;
            return accumulator;
        }

        accumulator[String(option.value)] = option.label;
        return accumulator;
    }, {});
}

function hasRenderableValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
        return false;
    }

    return !Array.isArray(value) || value.length > 0;
}

function formatValue(field: EntityFieldSchema, value: unknown, displayValue: unknown): RenderableValue {
    const source = hasRenderableValue(displayValue) ? displayValue : value;

    if (source === null || source === undefined || source === '') {
        return null;
    }

    if (Array.isArray(source)) {
        return source
            .map((item) => {
                if (typeof item === 'boolean') {
                    return item ? 'Да' : 'Нет';
                }

                return String(item);
            })
            .filter((item) => item !== '');
    }

    if (typeof source === 'boolean') {
        return source ? 'Да' : 'Нет';
    }

    if (typeof source === 'number') {
        return source;
    }

    if (typeof source === 'string') {
        return source;
    }

    if (field.field_type === 'json') {
        return JSON.stringify(source);
    }

    const options = normalizeOptions(field.options);
    const fallback = typeof value === 'string' ? options[value] : null;

    return fallback || JSON.stringify(source);
}

export function getDynamicFieldDisplayItems(
    entitySchema: EntitySchema,
    values: Record<string, unknown> = {},
    dynamicFieldValues?: SerializedDynamicFieldValueMap,
): DynamicFieldDisplayItem[] {
    return entitySchema.dynamic_fields
        .map((field) => {
            const rawValue = dynamicFieldValues?.[field.name]?.value ?? values[field.name];
            const displayValue = dynamicFieldValues?.[field.name]?.display_value;
            const formatted = formatValue(field, rawValue, displayValue);

            if (!hasRenderableValue(formatted)) {
                return null;
            }

            return {
                field,
                formatted,
                rawValue,
                displayValue,
            };
        })
        .filter((item): item is DynamicFieldDisplayItem => item !== null);
}

export function DynamicFieldValues({
    entitySchema,
    values = {},
    dynamicFieldValues,
    title = 'Дополнительные поля',
    variant = 'section',
    maxFields = 3,
    emptyText = 'Нет дополнительных значений',
}: DynamicFieldValuesProps) {
    const items = getDynamicFieldDisplayItems(entitySchema, values, dynamicFieldValues);

    if (items.length === 0) {
        return variant === 'section' ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null;
    }

    if (variant === 'compact') {
        const visibleItems = items.slice(0, maxFields);
        const remaining = items.length - visibleItems.length;

        return (
            <div className="flex flex-wrap gap-2">
                {visibleItems.map(({ field, formatted }) => (
                    <Badge key={field.name} variant="outline" className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                        {field.label}: {Array.isArray(formatted) ? formatted.join(', ') : String(formatted)}
                    </Badge>
                ))}
                {remaining > 0 && (
                    <Badge variant="secondary">+{remaining}</Badge>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <Separator />
            <div className="grid gap-3 md:grid-cols-2">
                {items.map(({ field, formatted }) => (
                    <div key={field.name} className="space-y-1 rounded-md border p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {field.label}
                        </p>
                        {Array.isArray(formatted) ? (
                            <div className="flex flex-wrap gap-2">
                                {formatted.map((item, index) => (
                                    <Badge key={`${field.name}-${index}`} variant="outline">
                                        {String(item)}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-foreground wrap-break-word">{String(formatted)}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}