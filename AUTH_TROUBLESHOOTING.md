# Quick Troubleshooting: Auth 401 Errors

## Your Setup
- **Vite Frontend**: http://localhost:5173
- **Laravel API**: http://localhost:3000
- **Solution**: Vite proxy (configured in `vite.config.ts`)

## ✅ Fix Applied

1. ✅ **Vite Proxy Configured** in `vite.config.ts`
   - `/api/*` requests → proxied to `http://localhost:3000`
   - `/sanctum/*` requests → proxied to `http://localhost:3000`
   - Browser sees same-origin → cookies work!

2. ✅ **Session Config Optimized** in `config/session.php`
   - Automatically disables SameSite for local dev
   - HTTP cookies allowed (not HTTPS required)

3. ✅ **CSRF Protection Enhanced** in `resources/js/lib/csrf.ts`
   - Automatic token extraction from meta tag
   - Token added to X-CSRF-TOKEN header
   - Detailed debug logging

4. ✅ **Auth Status Endpoint** in `/api/status`
   - Test endpoint to verify authentication
   - No auth required, shows session status

## 🚀 How to Test

### Step 1: Start Servers

```bash
# Terminal 1: Laravel API on port 3000
php artisan serve --port=3000

# Terminal 2: Vite on port 5173 (default)
npm run dev
```

### Step 2: Open in Browser

```
http://localhost:5173
```

### Step 3: Check Auth Status

Open browser DevTools (F12), go to Console, and you'll see:
```
[CSRF] CSRF token successfully initialized: XYZ...
[Auth Status] {authenticated: true, user: {...}}
```

Or visit: `http://localhost:5173/api/status`

### Step 4: Navigate to Model Manager

1. Go to: http://localhost:5173/model-manager
2. Try creating a field
3. Should work without 401 errors!

## 🐛 If Still Getting 401

### Check 1: Clear Everything
```bash
# Kill both servers
Ctrl+C (in both terminals)

# Clear browser cookies
DevTools → Application → Cookies → Select all → Delete

# Restart servers
# Terminal 1
php artisan serve --port=3000

# Terminal 2
npm run dev
```

### Check 2: Verify Proxy is Working
1. Open DevTools → Network tab
2. Make any API request (e.g., load model manager)
3. Look for requests to `/api/v1/...`
4. Should see `200 OK` or `401 Unauthenticated` (not `CORS` errors)
5. **CORS errors = proxy not working**

### Check 3: Verify Session Cookie
1. DevTools → Application → Cookies
2. Should see cookies like:
   - `LARAVEL_SESSION=...`
   - `XSRF-TOKEN=...`
3. If missing = session not being created

### Check 4: Check Laravel Log
```bash
tail -f storage/logs/laravel.log
```

Look for `[Auth]` entries showing what `auth()->check()` returns.

## 📝 Debug Output Examples

### ✅ Success (DevTools Console)
```
[CSRF] Initializing CSRF cookie from /sanctum/csrf-cookie
[CSRF] CSRF token successfully initialized: abc123def...
[Auth Status] {animated: true, user: {id: 1, email: "user@example.com"}, ...}
[API] GET /api/v1/model-fields/property
[API Response] {url: "/api/v1/model-fields/property", method: "GET", status: 200, ...}
```

### ❌ Problem (CORS Error)
```
Access to XMLHttpRequest at 'http://localhost:3000/api/v1/...' from origin
'http://localhost:5173' has been blocked by CORS policy
→ Proxy not working, check Vite restart
```

### ❌ Problem (401 Auth Error)
```
[API Response] {status: 401, error: {message: "Unauthenticated."}}
→ Session not persisting, check cookie handling or restart servers
```

## 🔧 Config Locations

| File | Purpose |
|------|---------|
| `vite.config.ts` | Proxy configuration (✅ Updated) |
| `config/session.php` | Session cookie settings (✅ Updated) |
| `resources/js/lib/csrf.ts` | CSRF & Auth helpers (✅ Updated) |
| `routes/api.php` | `/api/status` debug endpoint (✅ Added) |
| `app/Http/Middleware/EnsureApiAuthenticated.php` | Auth middleware (✅ Enhanced logging) |

## 📞 Still Having Issues?

1. **Check the browser console** - Look for `[CSRF]`, `[Auth Status]`, `[API]` logs
2. **Check the Laravel log** - `storage/logs/laravel.log`
3. **Test `/api/status`** - Visit `http://localhost:5173/api/status` to see raw auth status
4. **Verify session config** - Make sure `APP_ENV=local` in `.env`
