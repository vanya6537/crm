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
import { Textarea } from '@/components/ui/textarea';
import type { EntityFieldSchema, EntitySchema, FieldOption } from '@/types/entity-schema';

interface DynamicFieldsSectionProps {
    entitySchema: EntitySchema;
    values: Record<string, unknown>;
    errors: Record<string, string>;
    onChange: (fieldName: string, value: unknown) => void;
    title?: string;
}

export function getDefaultCustomFieldValues(entitySchema: EntitySchema): Record<string, unknown> {
    return entitySchema.dynamic_fields.reduce<Record<string, unknown>>((accumulator, field) => {
        if (field.default_value !== undefined && field.default_value !== null) {
            accumulator[field.name] = field.default_value;
        }

        return accumulator;
    }, {});
}

export function DynamicFieldsSection({
    entitySchema,
    values,
    errors,
    onChange,
    title = 'Дополнительные поля модели',
}: DynamicFieldsSectionProps) {
    if (entitySchema.dynamic_fields.length === 0) {
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
        const errorKey = `custom_fields.${field.name}`;
        const fieldOptions = normalizeOptions(field.options);
        const validation = field.validation || {};
        const minValue = typeof validation.min === 'number' ? validation.min : undefined;
        const maxValue = typeof validation.max === 'number' ? validation.max : undefined;
        const minLength = typeof validation.minLength === 'number' ? validation.minLength : undefined;
        const maxLength = typeof validation.maxLength === 'number' ? validation.maxLength : undefined;
        const pattern = typeof validation.pattern === 'string' ? validation.pattern : undefined;

        const commonMeta = (
            <>
                {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
                {errors[errorKey] && <p className="text-xs text-red-500">{errors[errorKey]}</p>}
            </>
        );

        if (field.field_type === 'textarea' || field.field_type === 'long_text' || field.field_type === 'big_text') {
            return (
                <div key={field.name} className="space-y-2 md:col-span-2">
                    <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                    <Textarea
                        id={field.name}
                        placeholder={field.placeholder || ''}
                        value={String(value ?? '')}
                        minLength={minLength}
                        maxLength={maxLength}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                    {commonMeta}
                </div>
            );
        }

        if (field.field_type === 'json') {
            const jsonValue = typeof value === 'string'
                ? value
                : value != null
                ? JSON.stringify(value, null, 2)
                : '';

            return (
                <div key={field.name} className="space-y-2 md:col-span-2">
                    <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                    <Textarea
                        id={field.name}
                        placeholder={field.placeholder || '{\n  "key": "value"\n}'}
                        value={jsonValue}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="font-mono text-xs"
                    />
                    {commonMeta}
                </div>
            );
        }

        if (field.field_type === 'select' || field.field_type === 'radio') {
            return (
                <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                    <Select
                        value={typeof value === 'string' ? value : undefined}
                        onValueChange={(nextValue) => onChange(field.name, nextValue)}
                    >
                        <SelectTrigger id={field.name}>
                            <SelectValue placeholder={field.placeholder || 'Выберите значение'} />
                        </SelectTrigger>
                        <SelectContent>
                            {fieldOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {commonMeta}
                </div>
            );
        }

        if (field.field_type === 'checkbox') {
            return (
                <div key={field.name} className="space-y-2 rounded-md border p-3 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id={field.name}
                            checked={Boolean(value)}
                            onCheckedChange={(checked) => onChange(field.name, Boolean(checked))}
                        />
                        <Label htmlFor={field.name}>{field.label}</Label>
                    </div>
                    {commonMeta}
                </div>
            );
        }

        if (field.field_type === 'multiselect' || field.field_type === 'checklist') {
            const currentValues = Array.isArray(value) ? value.map(String) : [];

            return (
                <div key={field.name} className="space-y-3 md:col-span-2">
                    <Label>{field.label}{field.required ? ' *' : ''}</Label>
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
                    {commonMeta}
                </div>
            );
        }

        if (['reference', 'relation', 'master_relation', 'many_to_many'].includes(field.field_type)) {
            const isMultipleRelation = field.allow_multiple || field.field_type === 'many_to_many';

            return (
                <div key={field.name} className="space-y-2 md:col-span-2">
                    <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                    <Input
                        id={field.name}
                        type="text"
                        placeholder={isMultipleRelation ? 'ID1, ID2, ID3' : 'ID связанной записи'}
                        value={Array.isArray(value) ? value.join(', ') : String(value ?? '')}
                        onChange={(e) => onChange(field.name, e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        {isMultipleRelation
                            ? 'Укажите идентификаторы связанных записей через запятую.'
                            : 'Укажите идентификатор связанной записи.'}
                    </p>
                    {commonMeta}
                </div>
            );
        }

        const inputType = field.field_type === 'email'
            ? 'email'
            : field.field_type === 'url'
            ? 'url'
            : field.field_type === 'date'
            ? 'date'
            : field.field_type === 'datetime'
            ? 'datetime-local'
            : field.field_type === 'time'
            ? 'time'
            : field.field_type === 'number' || field.field_type === 'integer' || field.field_type === 'decimal'
            ? 'number'
            : 'text';

        const normalizedValue = field.field_type === 'datetime' && typeof value === 'string'
            ? value.replace(' ', 'T').slice(0, 16)
            : Array.isArray(value)
            ? value.join(', ')
            : String(value ?? '');

        return (
            <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}{field.required ? ' *' : ''}</Label>
                <Input
                    id={field.name}
                    type={inputType}
                    placeholder={field.placeholder || ''}
                    value={normalizedValue}
                    min={minValue}
                    max={maxValue}
                    minLength={minLength}
                    maxLength={maxLength}
                    pattern={pattern}
                    step={field.field_type === 'decimal' ? '0.01' : field.field_type === 'number' || field.field_type === 'integer' ? '1' : undefined}
                    onChange={(e) => onChange(field.name, e.target.value)}
                />
                {commonMeta}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold">{title}</h3>
            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {entitySchema.dynamic_fields.map((field) => renderField(field))}
            </div>
        </div>
    );
}