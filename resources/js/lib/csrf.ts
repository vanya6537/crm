/**
 * Get CSRF token from meta tag or cookies
 */
export function getCsrfToken(): string {
    // Try to get from meta tag first
    let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    
    if (!token) {
        // Fallback: try to get from XSRF-TOKEN cookie (Sanctum)
        const name = 'XSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let cookie of cookieArray) {
            cookie = cookie.trim();
            if (cookie.indexOf(name) === 0) {
                token = decodeURIComponent(cookie.substring(name.length));
                break;
            }
        }
    }

    if (!token) {
        console.warn('CSRF token not found in meta tag or cookies');
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
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        ...options.headers,
    };

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const token = getCsrfToken();
        if (token) {
            headers['X-CSRF-TOKEN'] = token;
        }
    }

    return fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include',
    });
}
