<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EnsureApiAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $isAuthenticated = auth('sanctum')->check() || auth()->check();
        
        // Debug logging
        if (config('app.debug')) {
            \Log::debug('[Auth] API Request', [
                'path' => $request->path(),
                'method' => $request->method(),
                'authenticated' => $isAuthenticated,
                'user_id' => auth()->id(),
                'sanctum_user' => auth('sanctum')->id(),
                'session_id' => $request->getSession()?->getId(),
                'cookies' => array_keys($request->cookies->all()),
                'headers' => array_filter($request->headers->all(), fn($k) => in_array($k, ['authorization', 'cookie']), ARRAY_FILTER_USE_KEY),
            ]);
        }

        // Check if user is authenticated via session or Sanctum token
        if ($isAuthenticated) {
            return $next($request);
        }

        // Return JSON response for unauthenticated API requests
        return response()->json(
            [
                'message' => 'Unauthenticated.',
                'debug' => config('app.debug') ? [
                    'user_id' => auth()->id(),
                    'sanctum_user' => auth('sanctum')->id(),
                ] : null,
            ],
            401
        );
    }
}
