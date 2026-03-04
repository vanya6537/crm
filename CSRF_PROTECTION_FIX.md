# 🔐 Исправление CSRF защиты в ModelManager

## Проблема

ModelManager.tsx использовал **axios напрямую** вместо стандартного `apiRequest()`:

```tsx
// ❌ БЫЛО (уходит от стандарта):
import axios from 'axios';

const response = await axios.get('/api/v1/model-fields/types');
const updated = await axios.put(`/api/v1/model-fields/${id}`, data);
```

**Почему это проблема:**
1. ⚠️ **CSRF защита может не работать** - axios не знает про наши CSRF tokens
2. ⚠️ **Уязвимость** - возможны атаки на изменение state
3. ⚠️ **Несоответствие стандартам** - все другие страницы используют `apiRequest()`
4. ⚠️ **Дублирование кода** - нет единого способа работы с API

## Решение

### Что использует `apiRequest()`:

```tsx
// ✅ СТАЛО (правильный стандарт):
import { apiRequest } from '@/lib/csrf';

// Автоматически добавляет:
const response = await apiRequest('/api/v1/model-fields/types', {
    method: 'GET',
});
const data = await response.json();

// POST/PUT/DELETE автоматически добавляют:
// ✅ X-CSRF-TOKEN header
// ✅ X-Requested-With: XMLHttpRequest
// ✅ Content-Type: application/json
// ✅ credentials: 'include'
```

### Как это работает

**Файл**: `resources/js/lib/csrf.ts`

```typescript
export async function apiRequest(
    url: string,
    options: RequestInit & { method?: string } = {}
) {
    const method = options.method?.toUpperCase() || 'GET';
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...options.headers,
    };

    // ✅ Автоматически добавляет CSRF token для POST/PUT/DELETE/PATCH
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        headers['X-CSRF-TOKEN'] = getCsrfToken();
    }

    return fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include',  // ✅ Включает cookies(session)
    });
}
```

## 📋 Что изменилось в ModelManager.tsx

### Import
```tsx
// ❌ Было:
import axios from 'axios';

// ✅ Стало:
import { apiRequest } from '@/lib/csrf';
```

### Load Field Types
```tsx
// ❌ Было:
const response = await axios.get('/api/v1/model-fields/types');
setFieldTypes(response.data.data);

// ✅ Стало:
const response = await apiRequest('/api/v1/model-fields/types', {
    method: 'GET',
});
const data = await response.json();
setFieldTypes(data.data);
```

### Load Fields
```tsx
// ❌ Было:
const response = await axios.get(url);
setFields(response.data.data || []);

// ✅ Стало:
const response = await apiRequest(url, { method: 'GET' });
const data = await response.json();
setFields(data.data || []);
```

### Save Field (Create/Update)
```tsx
// ❌ Было:
await axios.put(`/api/v1/model-fields/${id}`, fieldData);
await axios.post(`/api/v1/model-fields/${entityType}`, fieldData);

// ✅ Стало:
const response = await apiRequest(
    `/api/v1/model-fields/${entityType}/${id}`,
    { method: 'PUT', body: JSON.stringify(fieldData) }
);
if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
}
```

### Delete Field
```tsx
// ❌ Было:
await axios.delete(`/api/v1/model-fields/${id}`);

// ✅ Стало:
const response = await apiRequest(
    `/api/v1/model-fields/${id}`,
    { method: 'DELETE' }
);
if (!response.ok) throw new Error('Delete failed');
```

### Reorder Fields
```tsx
// ❌ Было:
await axios.post(`/api/v1/model-fields/${entityType}/reorder`, { fields: orderData });

// ✅ Стало:
const response = await apiRequest(
    `/api/v1/model-fields/${entityType}/reorder`,
    { method: 'POST', body: JSON.stringify({ fields: orderData }) }
);
if (!response.ok) throw new Error('Reorder failed');
```

## 🔍 Различие axios vs apiRequest

| Аспект | axios | apiRequest |
|--------|-------|-----------|
| **CSRF Token** | ❌ Требует manual config | ✅ Автоматический |
| **Синтаксис** | `response.data` | `await response.json()` |
| **Credentials** | ⚠️ Зависит от config | ✅ Всегда 'include' |
| **Headers** | ⚠️ Нужно настраивать | ✅ Готовые правильные |
| **Error Handling** | try/catch на axios | ✅ Standard Fetch API |
| **Стандарт** | Сторонняя библиотека | Встроенный fetch |
| **Bundle Size** | +30KB | 0 (встроенный) |

## ✅ Тестирование

После исправления:
1. ✅ ModelManager работает с apiRequest
2. ✅ CSRF токены добавляются автоматически
3. ✅ Все операции (create/update/delete/reorder) работают
4. ✅ Нет несоответствий со стандартом
5. ✅ Build компилируется без ошибок (7.92s)

## 🎯 General Standard

Все страницы в CRM теперь используют **один стандарт**:

```tsx
import { apiRequest } from '@/lib/csrf';

// GET
const response = await apiRequest('/api/endpoint', { method: 'GET' });
const data = await response.json();

// POST
const response = await apiRequest('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
});

// PUT
const response = await apiRequest(`/api/endpoint/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
});

// DELETE
const response = await apiRequest(`/api/endpoint/${id}`, {
    method: 'DELETE',
});

// Error handling - Standard Fetch API
if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
}
```

## 📊 Статус всех страниц

| Страница | Стандарт | CSRF | Статус |
|----------|----------|------|--------|
| Properties | ✅ apiRequest | ✅ OK | ✅ FIXED |
| Agents | ✅ apiRequest | ✅ OK | ✅ OK |
| Buyers | ✅ apiRequest | ✅ OK | ✅ OK |
| Transactions | ✅ apiRequest | ✅ OK | ✅ OK |
| **ModelManager** | **✅ apiRequest** | **✅ OK** | **✅ FIXED** |

## 🚀 Преимущества

✅ **Безопасность**: CSRF токены добавляются автоматически для всех изменяющих операций  
✅ **Консистентность**: Все страницы используют один и тот же паттерн  
✅ **Поддерживаемость**: Легче отлаживать и расширять  
✅ **Performance**: Нет лишних зависимостей (axios → встроенный fetch)  
✅ **Stanardization**: Следуем Laravel + Inertia best practices  

---

**Status**: ✅ FIXED  
**Build**: ✅ Compiled (7.92s)  
**Type Safety**: ✅ TypeScript OK  
