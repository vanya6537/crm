'use client';

import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/radix/dialog';
import { DynamicFieldValues, getDynamicFieldDisplayItems } from '@/components/forms/DynamicFieldValues';
import type { EntitySchema, SerializedDynamicFieldValueMap } from '@/types/entity-schema';

export interface EntityDetailsField {
    label: string;
    value: unknown;
}

export interface EntityDetailsSection {
    title: string;
    fields: EntityDetailsField[];
}

interface EntityDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    entitySchema: EntitySchema;
    values?: Record<string, unknown>;
    dynamicFieldValues?: SerializedDynamicFieldValueMap;
    sections?: EntityDetailsSection[];
    exportFileName?: string;
}

function formatPlainValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (Array.isArray(value)) {
        return value.map((item) => formatPlainValue(item)).join(', ');
    }

    if (typeof value === 'boolean') {
        return value ? 'Да' : 'Нет';
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }

    return String(value);
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function normalizeFileName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'entity-details';
}

export function EntityDetailsDialog({
    open,
    onOpenChange,
    title,
    description,
    entitySchema,
    values = {},
    dynamicFieldValues,
    sections = [],
    exportFileName,
}: EntityDetailsDialogProps) {
    const dynamicItems = getDynamicFieldDisplayItems(entitySchema, values, dynamicFieldValues);

    const handleExport = () => {
        const payload = {
            title,
            description,
            exported_at: new Date().toISOString(),
            sections: sections.map((section) => ({
                title: section.title,
                fields: section.fields.map((field) => ({
                    label: field.label,
                    value: field.value,
                    display_value: formatPlainValue(field.value),
                })),
            })),
            dynamic_fields: dynamicItems.map((item) => ({
                name: item.field.name,
                label: item.field.label,
                raw_value: item.rawValue,
                display_value: item.formatted,
            })),
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${normalizeFileName(exportFileName || title)}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
        if (!printWindow) {
            return;
        }

        const sectionsHtml = sections
            .filter((section) => section.fields.some((field) => field.value !== null && field.value !== undefined && field.value !== ''))
            .map((section) => `
                <section>
                    <h2>${escapeHtml(section.title)}</h2>
                    <div class="grid">
                        ${section.fields
                            .map((field) => `
                                <div class="card">
                                    <div class="label">${escapeHtml(field.label)}</div>
                                    <div class="value">${escapeHtml(formatPlainValue(field.value))}</div>
                                </div>
                            `)
                            .join('')}
                    </div>
                </section>
            `)
            .join('');

        const dynamicHtml = dynamicItems.length > 0
            ? `
                <section>
                    <h2>Дополнительные поля</h2>
                    <div class="grid">
                        ${dynamicItems
                            .map((item) => `
                                <div class="card">
                                    <div class="label">${escapeHtml(item.field.label)}</div>
                                    <div class="value">${escapeHtml(formatPlainValue(item.formatted))}</div>
                                </div>
                            `)
                            .join('')}
                    </div>
                </section>
            `
            : '';

        printWindow.document.write(`
            <html>
                <head>
                    <title>${escapeHtml(title)}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; color: #111827; padding: 32px; }
                        h1 { margin: 0 0 8px; font-size: 28px; }
                        p.meta { margin: 0 0 24px; color: #6b7280; }
                        section { margin-top: 24px; }
                        h2 { margin: 0 0 12px; font-size: 16px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
                        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
                        .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; break-inside: avoid; }
                        .label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
                        .value { font-size: 14px; white-space: pre-wrap; word-break: break-word; }
                        @media print { body { padding: 0; } }
                    </style>
                </head>
                <body>
                    <h1>${escapeHtml(title)}</h1>
                    ${description ? `<p class="meta">${escapeHtml(description)}</p>` : ''}
                    ${sectionsHtml}
                    ${dynamicHtml}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>

                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Печать
                    </Button>
                    <Button type="button" variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Экспорт JSON
                    </Button>
                </div>

                <div className="space-y-4">
                    {sections
                        .filter((section) => section.fields.some((field) => field.value !== null && field.value !== undefined && field.value !== ''))
                        .map((section) => (
                            <div key={section.title} className="space-y-3">
                                <h3 className="text-sm font-semibold">{section.title}</h3>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {section.fields.map((field) => (
                                        <div key={`${section.title}-${field.label}`} className="rounded-md border p-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {field.label}
                                            </p>
                                            <p className="text-sm wrap-break-word whitespace-pre-wrap">{formatPlainValue(field.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                    <DynamicFieldValues
                        entitySchema={entitySchema}
                        values={values}
                        dynamicFieldValues={dynamicFieldValues}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}