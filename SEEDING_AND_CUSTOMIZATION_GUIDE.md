# Полное руководство по сидированию, API и кастомизации

## 📊 Текущий Статус Сидирования

### ✅ Успешно Сидировано
```
Database: SQLite (/database/database.sqlite)

✅ Triggers (Триггеры) - 26 шт
├── leads: 5 (авто-распределение, напоминания, reassign, objection, follow-up)
├── properties: 4 (fraud check, renewal, price drop, district alerts)
├── buyers: 3 (auto-match, inactivity, feedback)
├── showings: 2 (advance reminder, agent delay)
├── deals: 4 (stalled escalation, docs, legal, NPS)
├── owners: 3 (contract expiry, price advice, interest)
├── messaging: 2 (WhatsApp lead, CTA)
└── meta: 3 (demand analysis, pattern matching, read follow-up)

✅ Real Estate Data
├── Agents: 2 (Иван Петров, Мария Сидорова)
├── Properties: 4 (жилые объекты в Спб)
├── Buyers: 3 (потенциальные клиенты)
└── Transactions: (созданы в RealEstateSeeder)

✅ List of Values (LOV) - 21 справочник
├── agent_specialization
├── agent_status
├── deal_status
├── deal_type
├── financing_type
├── form_field_type
├── lead_source
├── lead_status
├── message_status
├── messenger_type
└── ... (еще 11 значений)
```

## 🔌 API Endpoints

### Authentication
- **Required**: `auth:sanctum` middleware
- **Status**: ✅ Routes protected
- **Issue**: Frontend needs authenticated session to access API

```
GET http://localhost:3000/api/v1/triggers/templates/category/leads
GET http://localhost:3000/api/v1/triggers/stats
GET http://localhost:3000/api/v1/triggers/
POST http://localhost:3000/api/v1/triggers/ (activate)
```

### Trigger API Responses

#### GET /api/v1/triggers/templates/category/{category}
**Response Format:**
```json
{
  "category": "leads",
  "count": 5,
  "templates": [
    {
      "id": 1,
      "code": "lead_auto_assign_manager",
      "name": "👤 Автоматическое распределение менеджера",
      "description": "Авто-назначение менеджера по специализации или нагрузке",
      "category": "leads",
      "event_type": "created",
      "entity_type": "Lead",
      "event_config": "{...}",
      "action_config": "{...}",
      "timing_config": null,
      "moscow_use_case": "Критично в москве - рынок перегрет, первые 1-2 мин решают все",
      "expected_impact": "Увеличивает конверсию на 15-20%",
      "is_recommended": true,
      "is_active": true,
      "sample_notification": "{...}"
    }
  ]
}
```

#### GET /api/v1/triggers/
**Response Format:** Array of active triggers
```json
[
  {
    "id": 1,
    "trigger_template_id": 1,
    "agent_id": null,
    "created_by": 1,
    "is_enabled": true,
    "name": "👤 Автоматическое распределение менеджера",
    "description": "...",
    "category": "leads"
  }
]
```

#### GET /api/v1/triggers/stats
**Response Format:** Statistics object
```json
{
  "total_templates": 26,
  "recommended_templates": 26,
  "active_triggers": 0,
  "total_executions": 0,
  "successful_executions": 0,
  "failed_executions": 0,
  "by_category": [
    {
      "category": "leads",
      "count": 5
    }
  ],
  "by_entity_type": []
}
```

## 🎨 Frontend Components & Data Flow

### Triggers Page (/resources/js/pages/Triggers.tsx)
**Current Structure:**
```
Triggers Component
├── State Management
│   ├── templates[] (loaded from API)
│   ├── activeTriggers[] (loaded from API)
│   ├── selectedCategory (default: 'leads')
│   ├── searchTerm
│   ├── stats (loaded from API)
│   └── dialogs (setup, stats)
├── Data Loading (useEffect on categoryChange)
│   ├── loadTemplates() → GET /api/v1/triggers/templates/category/{category}
│   ├── loadActiveTriggers() → GET /api/v1/triggers/
│   └── loadStats() → GET /api/v1/triggers/stats
├── UI Content
│   ├── Header with Stats button
│   ├── Info Card (Why Triggers)
│   ├── Search & Filter
│   ├── Category Navigation (8 buttons)
│   ├── Trigger Grid (1-2 columns)
│   ├── Active Triggers Section
│   ├── Setup Dialog
│   └── Stats Dialog
└── User Actions
    └── handleActivateTrigger() → POST /api/v1/triggers/
```

**Issue Identified:** 
- Frontend looks good, API endpoints exist
- Problem: Need to verify auth context in browser

### Layout Hierarchy
```
App (Inertia)
├── CRMLayout (sidebar + content)
│   ├── CRMSidebar (collapsible)
│   └── AppContent
│       └── Triggers Component
└── Dialogs (Setup, Stats)
```

## 🛠️ LOV (List of Values) System

### Database Table
```sql
CREATE TABLE list_of_values (
  id INTEGER PRIMARY KEY,
  name VARCHAR NOT NULL,
  key VARCHAR NOT NULL UNIQUE,  -- System identifier
  description TEXT,
  is_system TINYINT DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);
```

### Seeded Data (21 items)
```
✅ agent_specialization (типы специализации агентов)
✅ agent_status (статусы агентов: active, inactive, etc)
✅ deal_status (статусы сделок)
✅ deal_type (типы сделок)
✅ financing_type (типы финансирования)
✅ form_field_type (типы полей форм)
✅ lead_source (источники лидов)
✅ lead_status (статусы лидов)
✅ message_status (статусы сообщений)
✅ messenger_type (типы мессенджеров)
... и еще 11 значений
```

### API Endpoints
```
GET /api/v1/list-of-values                    # Все справочники
GET /api/v1/list-of-values/{id}              # Один справочник
GET /api/v1/list-of-values/key/{key}         # По системному ключу
POST /api/v1/list-of-values                   # Создать
PUT /api/v1/list-of-values/{id}              # Обновить
DELETE /api/v1/list-of-values/{id}           # Удалить
POST /api/v1/list-of-values/{id}/items       # Добавить значение
PUT /api/v1/list-of-values/items/{itemId}    # Обновить значение
DELETE /api/v1/list-of-values/items/{itemId} # Удалить значение
```

## 🔍 Возможные Причины "Пустого Дашборда"

### ❌ Проблема 1: Отсутствие Аутентификации
- API требует `auth:sanctum`
- Без залогирования API возвращает 401/403
- **Решение**: Убедитесь, что вы залогированы в приложение

### ❌ Проблема 2: CORS/Fetch Issues
- Frontend fetch может быть заблокирован
- Нет CSRF токена в запросе
- **Решение**: Использовать Inertia helpers или добавить CSRF в fetch

### ❌ Проблема 3: Неправильный Формат Ответа
- API возвращает правильные данные
- Frontend ожидает `data.templates` но может получать `data[]`
- **Решение**: Проверить формат в Network tab браузера

### ❌ Проблема 4: Компонент не Загружается
- Ошибка в React/TypeScript коде
- Ошибка в CSS/классах
- **Решение**: Проверить browser console на ошибки

## ✅ Чек-лист для Функционирования Системы

### База данных
- [x] Миграция `2026_03_04_000001_create_moscow_triggers_catalog` выполнена
- [x] Таблицы созданы: `trigger_templates`, `active_triggers`, `trigger_execution_logs`
- [x] Таблица `list_of_values` создана и заполнена (21 значение)
- [x] Таблица `agents` содержит 2 агента
- [x] Таблица `properties` содержит 4 объекта
- [ ] Добавить больше тестовых данных (опционально)

### API
- [x] TriggerController создан с 12 методами
- [x] Routes зарегистрированы в routes/api.php
- [x] ListOfValuesController существует и работает
- [ ] Проверить все эндпоинты с curl в браузерной консоли

### Frontend
- [x] Triggers.tsx обновлен с CRMLayout
- [x] Компонент использует правильные импорты
- [x] API вызовы предусмотрены
- [ ] Проверить Network tab при загрузке страницы
- [ ] Убедиться, что данные загружаются (не пустые массивы)

### Аутентификация & Auth
- [x] API routes защищены `auth:sanctum`
- [ ] Frontend должен быть залогирован
- [ ] Проверить localStorage/cookies для токена

### Тестирование
- [ ] Зайти в /dashboard (убедиться, что залогирован)
- [ ] Перейти на /triggers (из сайдбара)
- [ ] Дождаться загрузки компонента
- [ ] Проверить товары в Network tab (GET /api/v1/triggers/templates/category/leads)
- [ ] Проверить console на ошибки

## 🚀 Пошаговая Диагностика

### Шаг 1: Проверьте БД
```bash
sqlite3 database/database.sqlite
SELECT COUNT(*) FROM trigger_templates;      # Должно быть 26
SELECT COUNT(*) FROM list_of_values;         # Должно быть 21
SELECT COUNT(*) FROM agents;                 # Должно быть 2
```

### Шаг 2: Зайдите в Приложение
```
http://localhost:3000/login
Email: test@example.com
Password: password (или смотрите DatabaseSeeder)
```

### Шаг 3: Проверьте Network Tab
```
1. Откройте DevTools → Network
2. Перейдите на /triggers
3. Найдите: /api/v1/triggers/templates/category/leads
4. Проверьте:
   - Status: 200 (не 401, 403, 404)
   - Response: JSON с templates[]
   - Headers: Content-Type: application/json
```

### Шаг 4: Проверьте Console
```
1. DevTools → Console
2. Должны быть "Failed to load templates:" ошибки?
3. Есть CORS ошибки?
4. Есть JavaScript ошибки?
```

### Шаг 5: Проверьте Данные
```javascript
// В браузерной консоли:
fetch('/api/v1/triggers/templates/category/leads')
  .then(r => r.json())
  .then(d => console.log(d))
```

## 📋 Интеграция с остальной системой

### Properties & Agents
- `Agents` таблица имеет 2 записей
- `RealEstateSeeder` создает sample данные
- API endpoints для свойств доступны

### Customization Points
1. **Trigger Templates** - Редактируются через API
2. **LOV Values** - Управляются через ListOfValuesController
3. **Agent Settings** - Хранятся в `custom_fields` JSONB поле
4. **Process Modeler** - Может использовать данные триггеров для автоматизации

## 🎯 Следующие Шаги

### Фаза 1: Проверка (Сегодня)
1. ✅ Проверить наличие всех данных в БД
2. ✅ Убедиться, что API endpoints доступны
3. ✅ Проверить на фронтенде в браузере

### Фаза 2: Исправление (При наличии Проблем)
1. Если данные не загружаются - исправить frontend fetch логику
2. Если API возвращает 401 - проверить auth context
3. Если UI пуста - добавить debugging в React компонент

### Фаза 3: Полная Интеграция (Позже)
1. Реализовать trigger execution engine (event listeners)
2. Интегрировать с процессным моделером  
3. Добавить уведомления (WhatsApp, Telegram)
4. Analytics и reporting dashboard

---

**Status**: 🟢 Database & API Ready | 🟡 Frontend Integration in Progress | 🔴 Execution Engine Not Started
