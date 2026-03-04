<?php

namespace App\Http\Controllers;

use App\Models\Buyer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuyerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'source']);

        $query = Buyer::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        $buyers = $query
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function (Buyer $buyer) {
                return [
                    'id' => $buyer->id,
                    'name' => $buyer->name,
                    'email' => $buyer->email,
                    'phone' => $buyer->phone,
                    'budget_min' => $buyer->budget_min,
                    'budget_max' => $buyer->budget_max,
                    'source' => $buyer->source,
                    'status' => $buyer->status,
                    'notes' => $buyer->notes,
                    'created_at' => optional($buyer->created_at)->toDateTimeString(),
                    'updated_at' => optional($buyer->updated_at)->toDateTimeString(),
                ];
            });

        return Inertia::render('crm/Buyers', [
            'filters' => $filters,
            'buyers' => $buyers,
        ]);
    }
}
