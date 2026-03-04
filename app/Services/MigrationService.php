<?php

namespace App\Services;

use App\Models\ModelField;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Exception;

class MigrationService
{
    /**
     * Add a field to the database table programmatically
     */
    public static function addFieldToTable(string $tableName, ModelField $field): bool
    {
        try {
            // Check if column already exists
            if (Schema::hasColumn($tableName, $field->name)) {
                return true; // Column already exists
            }

            // Add column based on field type
            Schema::table($tableName, function (Blueprint $table) use ($field) {
                self::addColumnByType($table, $field);
            });

            return true;
        } catch (Exception $e) {
            \Log::error("Failed to add field to table", [
                'table' => $tableName,
                'field' => $field->name,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Remove a field from the database table programmatically
     */
    public static function removeFieldFromTable(string $tableName, string $fieldName): bool
    {
        try {
            // Check if column exists
            if (!Schema::hasColumn($tableName, $fieldName)) {
                return true; // Column doesn't exist
            }

            // Drop column
            Schema::table($tableName, function (Blueprint $table) use ($fieldName) {
                $table->dropColumn($fieldName);
            });

            return true;
        } catch (Exception $e) {
            \Log::error("Failed to remove field from table", [
                'table' => $tableName,
                'field' => $fieldName,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Update field definition in the database
     */
    public static function updateFieldInTable(string $tableName, ModelField $oldField, ModelField $newField): bool
    {
        try {
            // If field name changed, we need to rename the column
            if ($oldField->name !== $newField->name) {
                if (Schema::hasColumn($tableName, $oldField->name)) {
                    Schema::table($tableName, function (Blueprint $table) use ($oldField, $newField) {
                        $table->renameColumn($oldField->name, $newField->name);
                    });
                }
            }

            // If field type changed, we need to modify the column
            if ($oldField->field_type !== $newField->field_type) {
                Schema::table($tableName, function (Blueprint $table) use ($newField) {
                    self::modifyColumnByType($table, $newField);
                });
            }

            return true;
        } catch (Exception $e) {
            \Log::error("Failed to update field in table", [
                'table' => $tableName,
                'oldField' => $oldField->name,
                'newField' => $newField->name,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get the table name for an entity type
     */
    public static function getTableNameForEntity(string $entityType): ?string
    {
        $tableMap = [
            'agent' => 'agents',
            'property' => 'properties',
            'buyer' => 'buyers',
            'transaction' => 'transactions',
            'property_showing' => 'property_showings',
            'communication' => 'communications',
        ];

        return $tableMap[$entityType] ?? null;
    }

    /**
     * Add a column to a blueprint based on field type
     */
    private static function addColumnByType(Blueprint $table, ModelField $field)
    {
        $column = null;

        switch ($field->field_type) {
            // Text fields
            case 'text':
            case 'short_text':
                $column = $table->string($field->name, 255);
                break;

            case 'long_text':
            case 'textarea':
                $column = $table->text($field->name);
                break;

            case 'big_text':
                $column = $table->longText($field->name);
                break;

            // Numbers
            case 'number':
            case 'integer':
                $column = $table->integer($field->name);
                break;

            case 'decimal':
                $column = $table->decimal($field->name, 10, 2);
                break;

            // Date/Time
            case 'date':
                $column = $table->date($field->name);
                break;

            case 'datetime':
                $column = $table->dateTime($field->name);
                break;

            case 'time':
                $column = $table->time($field->name);
                break;

            case 'duration':
                // Store as string in format "0 дн. 0 ч. 0 мин."
                $column = $table->string($field->name, 50);
                break;

            // Select/Checkbox
            case 'select':
            case 'radio':
            case 'checkbox':
                // Store selected value(s) as JSON
                $column = $table->json($field->name);
                break;

            // Relations
            case 'reference':
            case 'relation':
            case 'master_relation':
            case 'many_to_many':
                // Store relations as JSON
                $column = $table->json($field->name);
                break;

            // Special fields
            case 'phone':
                $column = $table->string($field->name, 20);
                break;

            case 'email':
                $column = $table->string($field->name);
                break;

            case 'url':
                $column = $table->string($field->name);
                break;

            case 'autonumber':
                $column = $table->string($field->name);
                break;

            case 'file':
                $column = $table->json($field->name); // Store file paths/metadata
                break;

            case 'checklist':
                $column = $table->json($field->name);
                break;

            default:
                // Default to string
                $column = $table->string($field->name);
        }

        // Set nullable based on field required status
        if ($column) {
            if (!$field->required) {
                $column->nullable();
            }

            // Set default value if provided
            if ($field->default_value !== null) {
                $column->default($field->default_value);
            }

            // Add comment/description
            if ($field->description) {
                $column->comment($field->description);
            }
        }
    }

    /**
     * Modify a column in a blueprint based on field type
     */
    private static function modifyColumnByType(Blueprint $table, ModelField $field)
    {
        // Drop and re-add the column with new type
        try {
            $table->dropColumn($field->name);
        } catch (Exception $e) {
            // Column might not exist, that's okay
        }

        self::addColumnByType($table, $field);
    }
}
