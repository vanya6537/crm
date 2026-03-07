/**
 * Get CSRF token from meta tag (most reliable source)
 */
export function getCsrfToken(): string | null {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.getAttribute('content');
    
    if (!token) {
        console.warn('[CSRF] Token not found in meta tag');
        return null;
    }
    
    return token;
}

/**
 * Check current authentication status from the API
 */
export async function checkAuthStatus(): Promise<any> {
    try {
        const response = await fetch('/api/status', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        console.debug('[Auth Status]', data);
        return data;
    } catch (error) {
        console.error('[Auth Status] Failed to check status:', error);
        return null;
    }
}

/**
 * Initialize CSRF protection by fetching the Sanctum CSRF cookie
 * This must be called before making any state-changing API requests
 */
export async function initializeCsrf(): Promise<void> {
    try {
        console.debug('[CSRF] Initializing CSRF cookie from /sanctum/csrf-cookie');
        
        const response = await fetch('/sanctum/csrf-cookie', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            console.error('[CSRF] Failed to initialize CSRF cookie:', {
                status: response.status,
                statusText: response.statusText,
            });
            return;
        }
        
        // Verify token is now available
        const token = getCsrfToken();
        if (token) {
            console.debug('[CSRF] CSRF token successfully initialized:', token.substring(0, 10) + '...');
        } else {
            console.warn('[CSRF] Token still not available after initialization');
        }

        // Check auth status after CSRF initialization
        await checkAuthStatus();
    } catch (error) {
        console.error('[CSRF] Exception during initialization:', error);
    }
}

/**
 * Make an authenticated API request with proper CSRF protection
 */
export async function apiRequest(
    url: string,
    options: RequestInit & { method?: string } = {}
): Promise<Response> {
    const method = (options.method || 'GET').toUpperCase();
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        ...(typeof options.headers === 'object' && options.headers !== null ? options.headers as Record<string, string> : {}),
    };

    // Add CSRF token for state-changing requests
    // Laravel Sanctum uses X-CSRF-TOKEN header for CSRF validation
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const token = getCsrfToken();
        if (!token) {
            console.error('[CSRF] No CSRF token available for', method, 'request to', url);
            throw new Error('CSRF token not found. Please refresh the page.');
        }
        headers['X-CSRF-TOKEN'] = token;
        console.debug('[CSRF] Added X-CSRF-TOKEN header for', method, 'request');
    }

    try {
        console.debug('[API]', method, url, { 
            cookies: document.cookie,
        });
        
        const response = await fetch(url, {
            ...options,
            method,
            headers,
            credentials: 'include',
        });

        // Log response status and headers
        console.debug('[API Response]', {
            url,
            method,
            status: response.status,
            contentType: response.headers.get('content-type'),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                try {
                    const errorData = await response.clone().json();
                    console.error('[API] Response error:', { status: response.status, error: errorData });
                } catch {
                    console.error('[API] Response error (text):', { status: response.status });
                }
            }
        }

        return response;
    } catch (error) {
        console.error('[API] Request failed:', { url, method, error });
        throw error;
    }
}


