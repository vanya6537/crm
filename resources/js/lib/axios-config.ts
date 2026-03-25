import axios from 'axios';
import { getCsrfToken } from './csrf';

/**
 * Configure axios to include CSRF token in all requests
 * This is needed for Inertia Form submissions to work with Laravel CSRF protection
 */
export function configureAxios(): void {
    const token = getCsrfToken();
    
    console.debug('[Axios Config] Starting axios configuration');
    console.debug('[Axios Config] CSRF Token found:', !!token, token?.substring(0, 10) + '...' || 'NONE');
    
    // Set X-CSRF-TOKEN header for all requests
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token || '';
    
    // Also set X-Requested-With to indicate XHR request
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
    
    // Include credentials (cookies) with all requests
    axios.defaults.withCredentials = true;

    console.debug('[Axios Config] Default headers configured:', {
        'X-CSRF-TOKEN': axios.defaults.headers.common['X-CSRF-TOKEN']?.substring(0, 10) + '...',
        'X-Requested-With': axios.defaults.headers.common['X-Requested-With'],
        withCredentials: axios.defaults.withCredentials,
    });

    // Interceptor to update CSRF token if needed
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // If we get a 419 error, refresh the CSRF token and retry
            if (error.response?.status === 419) {
                const newToken = getCsrfToken();
                if (newToken) {
                    axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                    console.warn('[CSRF] Token refreshed after 419 error');
                }
            }
            return Promise.reject(error);
        }
    );

    console.debug('[Axios] Fully configured with CSRF token support');
}
