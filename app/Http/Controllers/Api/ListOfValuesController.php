<?php

namespace App\Http\Controllers\Api;

use App\Models\ListOfValues;
use App\Models\ListOfValuesItem;
use Illuminate\Http\Request;

class ListOfValuesController extends Controller
{
    /**
     * Display a listing of all list of values.
     */
    public function index()
    {
        return response()->json(
            ListOfValues::with('items')
                ->orderBy('sort_order')
                ->get()
        );
    }

    /**
     * Get a specific list of values by key.
     */
    public function getByKey(string $key)
    {
        $listOfValues = ListOfValues::where('key', $key)
            ->with(['items' => fn($q) => $q->where('is_active', true)->orderBy('sort_order')])
            ->firstOrFail();

        return response()->json($listOfValues);
    }

    /**
     * Store a newly created list of values.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|unique:list_of_values',
            'description' => 'nullable|string',
            'is_system' => 'boolean',
            'sort_order' => 'integer|min:0',
            'items' => 'array',
            'items.*.label' => 'required|string',
            'items.*.value' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.sort_order' => 'integer|min:0',
        ]);

        $lov = ListOfValues::create([
            'name' => $validated['name'],
            'key' => $validated['key'],
            'description' => $validated['description'] ?? null,
            'is_system' => $validated['is_system'] ?? false,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        if (isset($validated['items'])) {
            foreach ($validated['items'] as $item) {
                $lov->items()->create($item);
            }
        }

        return response()->json($lov->load('items'), 201);
    }

    /**
     * Display the specified list of values.
     */
    public function show(int $id)
    {
        $listOfValues = ListOfValues::with('items')
            ->findOrFail($id);

        return response()->json($listOfValues);
    }

    /**
     * Update the specified list of values.
     */
    public function update(Request $request, int $id)
    {
        $listOfValues = ListOfValues::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'items' => 'array',
            'items.*.id' => 'nullable|integer|exists:list_of_values_items',
            'items.*.label' => 'required|string',
            'items.*.value' => 'required|string',
            'items.*.description' => 'nullable|string',
            'items.*.sort_order' => 'integer|min:0',
            'items.*.is_active' => 'boolean',
        ]);

        $listOfValues->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        if (isset($validated['items'])) {
            $existingIds = [];
            foreach ($validated['items'] as $item) {
                if (isset($item['id'])) {
                    $existingIds[] = $item['id'];
                    ListOfValuesItem::find($item['id'])->update($item);
                } else {
                    $listOfValues->items()->create($item);
                }
            }
            // Delete removed items
            $listOfValues->items()->whereNotIn('id', $existingIds)->delete();
        }

        return response()->json($listOfValues->load('items'));
    }

    /**
     * Remove the specified list of values.
     */
    public function destroy(int $id)
    {
        $listOfValues = ListOfValues::findOrFail($id);
        
        if ($listOfValues->is_system) {
            return response()->json([
                'message' => 'Cannot delete system lists of values'
            ], 403);
        }

        $listOfValues->delete();
        return response()->json(null, 204);
    }

    /**
     * Create a new item in a list of values.
     */
    public function addItem(Request $request, int $lovId)
    {
        $lov = ListOfValues::findOrFail($lovId);

        $validated = $request->validate([
            'label' => 'required|string',
            'value' => 'required|string|unique:list_of_values_items,value,null,id,list_of_values_id,' . $lovId,
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'metadata' => 'nullable|array',
        ]);

        $item = $lov->items()->create($validated);

        return response()->json($item, 201);
    }

    /**
     * Update an item in a list of values.
     */
    public function updateItem(Request $request, int $itemId)
    {
        $item = ListOfValuesItem::findOrFail($itemId);

        $validated = $request->validate([
            'label' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
            'metadata' => 'nullable|array',
        ]);

        $item->update($validated);

        return response()->json($item);
    }

    /**
     * Delete an item from a list of values.
     */
    public function deleteItem(int $itemId)
    {
        $item = ListOfValuesItem::findOrFail($itemId);
        $item->delete();

        return response()->json(null, 204);
    }
}
