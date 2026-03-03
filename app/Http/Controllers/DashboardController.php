<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Property;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = Auth::user();
        
        // Get counts
        $propertiesCount = Property::count();
        $buyersCount = Buyer::count();
        $agentsCount = Agent::count();
        $pendingTransactionsCount = Transaction::whereIn('status', ['pending', 'in_progress'])->count();
        
        // Calculate trends (% change from last 30 days)
        $thirtyDaysAgo = now()->subDays(30);
        
        // Properties trend
        $propertiesLastMonth = Property::where('created_at', '>=', $thirtyDaysAgo)->count();
        $propertiesTrend = $propertiesCount > 0 
            ? round((($propertiesLastMonth / $propertiesCount) * 100) - 100)
            : 0;
        
        // Transactions trend
        $transactionsLastMonth = Transaction::where('created_at', '>=', $thirtyDaysAgo)->count();
        $totalTransactions = Transaction::count();
        $transactionsTrend = $totalTransactions > 0
            ? round((($transactionsLastMonth / max($totalTransactions, 1)) * 100) - 100)
            : 0;
        
        // Get recent transactions with relationships
        $recentTransactions = Transaction::query()
            ->with(['property', 'buyer'])
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                $finalPrice = $transaction->final_price ?? $transaction->offer_price;
                
                return [
                    'id' => (string) $transaction->id,
                    'property_title' => $transaction->property?->address ?? 'N/A',
                    'buyer_name' => $transaction->buyer?->name ?? 'N/A',
                    'status' => (string) ($transaction->status ?? 'pending'),
                    'amount' => $finalPrice 
                        ? '₽ ' . number_format((float) $finalPrice, 0, '.', ' ')
                        : 'N/A',
                    'updated_at' => $transaction->updated_at 
                        ? $transaction->updated_at->format('Y-m-d H:i')
                        : null,
                ];
            })
            ->values()
            ->toArray();
        
        return Inertia::render('CRMDashboard', [
            'properties_count' => (int) $propertiesCount,
            'buyers_count' => (int) $buyersCount,
            'agents_count' => (int) $agentsCount,
            'pending_transactions' => (int) $pendingTransactionsCount,
            'properties_trend' => (int) $propertiesTrend,
            'transactions_trend' => (int) $transactionsTrend,
            'recent_transactions' => $recentTransactions,
        ]);
    }
}
