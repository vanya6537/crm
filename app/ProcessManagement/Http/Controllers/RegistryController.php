<?php

namespace App\ProcessManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use App\ProcessManagement\Models\ProcessDefinition;
use App\ProcessManagement\Models\ProcessVersion;
use App\ProcessManagement\Models\AuditLog;
use App\ProcessManagement\Services\DslValidator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RegistryController extends Controller
{
    protected DslValidator $validator;

    public function __construct(DslValidator $validator)
    {
        $this->validator = $validator;
    }

    /**
     * List all process definitions with status
     */
    public function listDefinitions(): JsonResponse
    {
        $definitions = ProcessDefinition::query()
            ->with(['versions' => fn ($q) => $q->orderByDesc('version')])
            ->get()
            ->map(fn ($def) => [
                'id' => $def->id,
                'key' => $def->key,
                'name' => $def->name,
                'status' => $def->status,
                'description' => $def->description,
                'latestVersion' => $def->latestPublishedVersion()?->version,
                'createdAt' => $def->created_at,
                'updatedAt' => $def->updated_at,
            ]);

        return response()->json($definitions);
    }

    /**
     * Create new process definition (draft)
     */
    public function createDefinition(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:process_definitions,key',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $definition = ProcessDefinition::create($validated);

        AuditLog::log(
            action: 'create',
            entityType: 'ProcessDefinition',
            entityId: $definition->id,
            description: "Created draft process: {$validated['key']}"
        );

        return response()->json($definition, 201);
    }

    /**
     * Get definition + all versions
     */
    public function getDefinition(string $key): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)
            ->with(['versions' => fn ($q) => $q->orderByDesc('version')])
            ->firstOrFail();

        return response()->json([
            'id' => $definition->id,
            'key' => $definition->key,
            'name' => $definition->name,
            'status' => $definition->status,
            'description' => $definition->description,
            'versions' => $definition->versions->map(fn ($v) => [
                'id' => $v->id,
                'version' => $v->version,
                'status' => $v->status,
                'checksum' => $v->checksum,
                'changelog' => $v->changelog,
                'createdAt' => $v->created_at,
            ]),
            'createdAt' => $definition->created_at,
            'updatedAt' => $definition->updated_at,
        ]);
    }

    /**
     * Create new version draft (from scratch or clone)
     */
    public function createVersion(string $key, Request $request): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();

        $validated = $request->validate([
            'graphJson' => 'required|json',
            'variablesSchemaJson' => 'nullable|json',
            'changelog' => 'nullable|string',
        ]);

        try {
            $graph = json_decode($validated['graphJson'], true);
            $this->validator->validate($graph);
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['graphJson' => $e->getMessage()]);
        }

        $checksum = DslValidator::checksum($graph);

        // Get next version number
        $nextVersion = $definition->versions()->max('version') + 1 ?? 1;

        $version = $definition->versions()->create([
            'version' => $nextVersion,
            'status' => 'draft',
            'graph_json' => $validated['graphJson'],
            'variables_schema_json' => $validated['variablesSchemaJson'],
            'checksum' => $checksum,
            'changelog' => $validated['changelog'],
        ]);

        // Update definition status to draft if it was published
        if ($definition->status === 'published') {
            $definition->update(['status' => 'draft']);
        }

        AuditLog::log(
            action: 'create',
            entityType: 'ProcessVersion',
            entityId: $version->id,
            description: "Created version {$version->version} for {$key}"
        );

        return response()->json([
            'id' => $version->id,
            'definitionId' => $definition->id,
            'version' => $version->version,
            'status' => $version->status,
            'checksum' => $version->checksum,
            'createdAt' => $version->created_at,
        ], 201);
    }

    /**
     * Get specific version details
     */
    public function getVersion(string $key, int $version): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();
        
        $version = $definition->versions()
            ->where('version', $version)
            ->firstOrFail();

        return response()->json([
            'id' => $version->id,
            'definitionId' => $definition->id,
            'definitionKey' => $definition->key,
            'version' => $version->version,
            'status' => $version->status,
            'graph' => json_decode($version->graph_json, true),
            'variablesSchema' => json_decode($version->variables_schema_json, true),
            'checksum' => $version->checksum,
            'changelog' => $version->changelog,
            'createdAt' => $version->created_at,
        ]);
    }

    /**
     * Update version draft (only if not published/deprecated)
     */
    public function updateVersion(string $key, int $versionNum, Request $request): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();
        
        $version = $definition->versions()
            ->where('version', $versionNum)
            ->firstOrFail();

        if ($version->status !== 'draft') {
            return response()->json([
                'error' => "Cannot update {$version->status} version",
            ], 409);
        }

        $validated = $request->validate([
            'graphJson' => 'nullable|json',
            'variablesSchemaJson' => 'nullable|json',
            'changelog' => 'nullable|string',
        ]);

        if (isset($validated['graphJson'])) {
            try {
                $graph = json_decode($validated['graphJson'], true);
                $this->validator->validate($graph);
            } catch (\InvalidArgumentException $e) {
                throw ValidationException::withMessages(['graphJson' => $e->getMessage()]);
            }
            $validated['checksum'] = DslValidator::checksum($graph);
        }

        $before = $version->only(['graph_json', 'variables_schema_json', 'checksum']);

        $version->update($validated);

        AuditLog::log(
            action: 'update',
            entityType: 'ProcessVersion',
            entityId: $version->id,
            description: "Updated draft version {$versionNum} for {$key}",
            changes: ['before' => $before, 'after' => $version->only(['graph_json', 'variables_schema_json', 'checksum'])]
        );

        return response()->json([
            'id' => $version->id,
            'version' => $version->version,
            'status' => $version->status,
            'checksum' => $version->checksum,
            'updatedAt' => $version->updated_at,
        ]);
    }

    /**
     * Publish version (draft → published)
     */
    public function publishVersion(string $key, int $versionNum): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();
        
        $version = $definition->versions()
            ->where('version', $versionNum)
            ->firstOrFail();

        if ($version->status !== 'draft') {
            return response()->json([
                'error' => "Only draft versions can be published (current: {$version->status})",
            ], 409);
        }

        // Deprecate previous published versions
        $definition->versions()
            ->where('status', 'published')
            ->update(['status' => 'deprecated']);

        $version->publish();
        $definition->update(['status' => 'published']);

        AuditLog::log(
            action: 'publish',
            entityType: 'ProcessVersion',
            entityId: $version->id,
            description: "Published version {$versionNum} for {$key}"
        );

        return response()->json([
            'id' => $version->id,
            'version' => $version->version,
            'status' => $version->status,
            'checksum' => $version->checksum,
            'publishedAt' => $version->updated_at,
        ]);
    }

    /**
     * Deprecate version
     */
    public function deprecateVersion(string $key, int $versionNum): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();
        
        $version = $definition->versions()
            ->where('version', $versionNum)
            ->firstOrFail();

        if ($version->status === 'deprecated') {
            return response()->json([
                'error' => 'Version already deprecated',
            ], 409);
        }

        $version->deprecate();

        AuditLog::log(
            action: 'deprecate',
            entityType: 'ProcessVersion',
            entityId: $version->id,
            description: "Deprecated version {$versionNum} for {$key}"
        );

        return response()->json([
            'id' => $version->id,
            'version' => $version->version,
            'status' => $version->status,
            'deprecatedAt' => $version->updated_at,
        ]);
    }

    /**
     * Delete draft version
     */
    public function deleteVersion(string $key, int $versionNum): JsonResponse
    {
        $definition = ProcessDefinition::where('key', $key)->firstOrFail();
        
        $version = $definition->versions()
            ->where('version', $versionNum)
            ->firstOrFail();

        if ($version->status !== 'draft') {
            return response()->json([
                'error' => 'Can only delete draft versions',
            ], 409);
        }

        $versionId = $version->id;
        $version->delete();

        AuditLog::log(
            action: 'delete',
            entityType: 'ProcessVersion',
            entityId: $versionId,
            description: "Deleted draft version {$versionNum} for {$key}"
        );

        return response()->json(null, 204);
    }
}
