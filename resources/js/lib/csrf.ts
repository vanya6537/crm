/**
 * Get CSRF token from meta tag
 */
export function getCsrfToken(): string {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        console.warn('CSRF token not found in meta tag');
        return '';
    }
    return token;
}

/**
 * Make an authenticated API request with CSRF token
 */
export async function apiRequest(
    url: string,
    options: RequestInit & { method?: string } = {}
) {
    const method = options.method?.toUpperCase() || 'GET';
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        headers['X-CSRF-TOKEN'] = getCsrfToken();
    }

    return fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include',
    });
}
