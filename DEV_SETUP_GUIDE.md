# Development Setup Guide

## Your Setup: Vite 5173 + Laravel 3000

You're running:
- **Vite (Frontend)**: http://localhost:5173
- **Laravel (API)**: http://localhost:3000

## ✅ SOLUTION: Vite Proxy (ALREADY CONFIGURED)

The Vite proxy is now configured in `vite.config.ts` to handle this automatically:

```typescript
proxy: {
    '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
    },
    '/sanctum': {
        target: 'http://localhost:3000',
        changeOrigin: true,
    },
}
```

**This means:**
- All `/api/*` requests are proxied from `http://localhost:5173/api/*` → `http://localhost:3000/api/*`
- All `/sanctum/*` requests are proxied automatically
- From the browser's perspective, everything is same-origin (localhost:5173)
- **Session cookies are properly sent and maintained!**

## Quick Start

### Terminal 1: Start Laravel API
```bash
php artisan serve --port=3000
```

### Terminal 2: Start Vite Dev Server
```bash
npm run dev
```

### Access the App
Open your browser:
```
http://localhost:5173
```

✅ Session authentication should now work across all API requests!

## Why This Works

1. **Vite Proxy** intercepts `/api/` requests
2. Forwards them to `http://localhost:3000`  
3. Browser sees everything as `localhost:5173` (same-origin)
4. Session cookies automatically sent and persisted
5. No CORS errors, no authentication issues

## Troubleshooting

### Still Getting 401 Errors?

1. **Clear browser cache & cookies**
   - Press F12 → Application → Cookies → Delete all

2. **Restart both servers**
   ```bash
   # Terminal 1
   Ctrl+C (stop Laravel)
   php artisan serve --port=3000
   
   # Terminal 2
   Ctrl+C (stop Vite)
   npm run dev
   ```

3. **Check API Status**
   Visit: `http://localhost:5173/api/status`
   
   Should show:
   ```json
   {
     "authenticated": true,
     "user": {
       "id": 1,
       "email": "user@example.com"
     }
   }
   ```

### Check Browser Console

Look for logs starting with:
- `[CSRF]` - Token operations ✓
- `[Auth Status]` - Authentication status ✓
- `[API]` - Request details ✓

### Check Laravel Logs

```bash
tail -f storage/logs/laravel.log
```

Look for `[Auth]` entries showing authentication checks.

## Environment Variables

You can customize ports via `.env`:

```env
# .env
API_URL=http://localhost:3000
VITE_HMR_HOST=localhost
VITE_HMR_PORT=5173
```

If using different hosts (not localhost):
```env
API_URL=http://192.168.1.100:3000
VITE_HMR_HOST=192.168.1.100
```

## Session Configuration

Session settings are automatically optimized for local development in `config/session.php`:

```php
'same_site' => env('SESSION_SAME_SITE', env('APP_ENV') === 'local' ? null : 'lax'),
'secure' => env('SESSION_SECURE_COOKIE', env('APP_ENV') === 'production'),
```

For local development:
- `SameSite` is disabled (allows cross-origin cookies via proxy)
- `Secure` is disabled (allows HTTP)
- `HttpOnly` is true (JavaScript can't access cookies)

## Production Deployment

Once deployed (same origin):
```env
APP_ENV=production
SESSION_SAME_SITE=lax
SESSION_SECURE_COOKIE=true
```

The proxy won't be needed since both frontend and API will be served from the same origin via nginx/Apache.
