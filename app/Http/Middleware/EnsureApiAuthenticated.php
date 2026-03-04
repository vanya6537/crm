<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class EnsureApiAuthenticated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if user is authenticated via session or Sanctum token
        if (auth('sanctum')->check() || auth()->check()) {
            return $next($request);
        }

        // Return JSON response for unauthenticated API requests
        return response()->json(
            ['message' => 'Unauthenticated.'],
            401
        );
    }
}
