<?php

namespace App\Http\Controllers;

use App\CRM\Services\EntitySchemaService;
use App\Models\Buyer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BuyerController extends Controller
{
    public function index(Request $request, EntitySchemaService $entitySchemaService): Response
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
            ->through(fn (Buyer $buyer) => $entitySchemaService->serializeModel($buyer, 'buyer'));

        return Inertia::render('crm/Buyers', [
            'filters' => $filters,
            'buyers' => $buyers,
            'entitySchema' => $entitySchemaService->getEntitySchema('buyer'),
        ]);
    }
}
