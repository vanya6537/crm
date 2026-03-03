<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DiagnosticsController
{
    /**
     * Get system diagnostics (no auth required)
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
            'database' => [
                'triggers' => DB::table('trigger_templates')->count(),
                'lov_values' => DB::table('list_of_values')->count(),
                'agents' => DB::table('agents')->count(),
                'properties' => DB::table('properties')->count(),
                'buyers' => DB::table('buyers')->count(),
                'active_triggers' => DB::table('active_triggers')->count(),
            ],
            'api_endpoints' => [
                'triggers' => '/api/v1/triggers/templates/category/{category}',
                'lov' => '/api/v1/list-of-values',
                'stats' => '/api/v1/triggers/stats',
            ]
        ]);
    }

    /**
     * Get trigger templates sample (no auth required)
     */
    public function triggersSample(): JsonResponse
    {
        $templates = DB::table('trigger_templates')
            ->limit(3)
            ->get();

        return response()->json([
            'count' => DB::table('trigger_templates')->count(),
            'sample' => $templates
        ]);
    }

    /**
     * Get LOV sample (no auth required)
     */
    public function lovSample(): JsonResponse
    {
        $lovs = DB::table('list_of_values')
            ->limit(5)
            ->get();

        return response()->json([
            'total' => DB::table('list_of_values')->count(),
            'sample' => $lovs
        ]);
    }

    /**
     * Get detailed diagnostics
     */
    public function detailed(): JsonResponse
    {
        return response()->json([
            'triggers_by_category' => DB::table('trigger_templates')
                ->select('category')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('category')
                ->get(),
            
            'lov_keys' => DB::table('list_of_values')
                ->pluck('key')
                ->take(10)
                ->toArray(),
            
            'agents' => DB::table('agents')
                ->select('id', 'name', 'email', 'status')
                ->get(),
            
            'properties' => DB::table('properties')
                ->select('id', 'address', 'price', 'status')
                ->limit(3)
                ->get(),
        ]);
    }
}
