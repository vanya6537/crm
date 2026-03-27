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

    // Interceptor to handle 419 CSRF token errors
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // If we get a 419 error, refresh the CSRF token
            if (error.response?.status === 419) {
                console.warn('[CSRF] Got 419 error, attempting to refresh CSRF token');
                
                // Reinitialize CSRF to get fresh token
                fetch('/sanctum/csrf-cookie', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                }).then(() => {
                    const newToken = getCsrfToken();
                    if (newToken) {
                        axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                        console.debug('[CSRF] Token updated after 419:', newToken.substring(0, 10) + '...');
                    }
                }).catch(err => {
                    console.error('[CSRF] Failed to refresh token after 419:', err);
                });
            }
            return Promise.reject(error);
        }
    );

    console.debug('[Axios] Fully configured with CSRF token support');
}
