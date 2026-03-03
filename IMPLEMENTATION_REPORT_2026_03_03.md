# Изменения версии 2026-03-03

## Интеграция интернационализации, переоснащение Dashboard и добавление List of Values

### 📋 Что было сделано:

#### 1. **Интернационализация (i18n)**
- ✅ Установлен **русский язык как дефолтный** в приложении
- ✅ Обновлены файлы конфигурации:
  - `config/app.php`: `locale` и `fallback_locale` установлены на `ru`
  - `.env`: `APP_LOCALE=ru`, `APP_FALLBACK_LOCALE=ru`, `APP_FAKER_LOCALE=ru_RU`
- ✅ Созданы файлы переводов:
  - `resources/lang/ru.json` - русские переводы
  - `resources/lang/en.json` - английские переводы (для обратной совместимости)
- ✅ Создан хелпер `resources/js/composables/useTranslation.ts` для использования в Vue компонентах

#### 2. **Переоснащение Dashboard**
- ✅ CRMDashboard теперь отображается на главном `/dashboard` маршруте
- ✅ Старый маршрут `/crm/dashboard` сохранен для обратной совместимости
- ✅ Обновлены маршруты в `routes/web.php`

#### 3. **List of Values (LOV) система**

**Модели и Миграции:**
- ✅ Создана миграция `2026_03_03_161936_create_list_of_values_table.php`
  - Таблица `list_of_values` - для хранения списков значений
  - Таблица `list_of_values_items` - для хранения элементов списков
- ✅ Модели:
  - `App\Models\ListOfValues` с отношениями к items
  - `App\Models\ListOfValuesItem` с обратным отношением

**API Endpoints:**
- `GET /api/v1/list-of-values` - получить все списки
- `POST /api/v1/list-of-values` - создать новый список
- `GET /api/v1/list-of-values/{id}` - получить список по ID
- `PUT /api/v1/list-of-values/{id}` - обновить список
- `DELETE /api/v1/list-of-values/{id}` - удалить список
- `GET /api/v1/list-of-values/key/{key}` - получить список по ключу
- `POST /api/v1/list-of-values/{lovId}/items` - добавить элемент
- `PUT /api/v1/list-of-values/items/{itemId}` - обновить элемент
- `DELETE /api/v1/list-of-values/items/{itemId}` - удалить элемент

**Предзагруженные Системные Списки:**
- 🎯 **Должности** (positions):
  - Директор, Менеджер по продажам, Риелтор, Агент по недвижимости, Юрист, Бухгалтер, Администратор, Помощник

- 🎯 **Статусы сделок** (deal_statuses):
  - Лид, Просмотр, Переговоры, Оферта, Контракт подписан, Завершено, Отменено

- 🎯 **Типы объектов** (property_types):
  - Квартира, Дом, Коттедж, Земельный участок, Коммерческое помещение, Офис, Склад, Производство, Гостиница

- 🎯 **Источники клиентов** (client_sources):
  - Веб-сайт, Рефераль, Звонок от агента, Реклама, Социальные сети, Email кампания, Выставка, Прямое обращение

- 🎯 **Уровень срочности** (urgency_levels):
  - Низкая, Средняя, Высокая, Срочная

- 🎯 **Уровень интереса** (interest_levels):
  - Низкий, Средний, Высокий, Очень высокий

- 🎯 **Специализация агента** (agent_specializations):
  - Жилая недвижимость, Люкс сегмент, Коммерческая, Инвестиции, Земельные участки

**Vue Компоненты:**
- ✅ `resources/js/components/ListOfValuesManager.vue` - полнофункциональный компонент управления LOV
- ✅ `resources/js/pages/crm/ListOfValues.tsx` - страница управления LOV
- ✅ Добавлен маршрут `/crm/list-of-values` в `routes/web.php`

---

### 🗄️ Структура базы данных

```
list_of_values
├── id (PK)
├── name (string) - Название списка
├── key (unique string) - Уникальный ключ
├── description (text)
├── is_system (boolean)
├── sort_order (integer)
└── timestamps

list_of_values_items
├── id (PK)
├── list_of_values_id (FK)
├── label (string)
├── value (string, unique per LOV)
├── description (text)
├── sort_order (integer)
├── is_active (boolean)
├── metadata (jsonb)
└── timestamps
```

---

### 🚀 Использование

#### На Backend (Laravel)

```php
// Получить список по ключу
$positions = ListOfValues::where('key', 'positions')->with(['activeItems'])->first();

// Итерировать элементы
foreach ($positions->activeItems as $position) {
    // $position->label, $position->value, $position->metadata
}
```

#### На Frontend (Vue/React)

```typescript
// Используйте хелпер для переводов
import { useTranslation } from '@/composables/useTranslation'

const { t } = useTranslation()

// Используйте как:
<span>{{ t('list_of_values') }}</span>
```

#### Получение LOV через API

```javascript
// Получить все списки
const response = await fetch('/api/v1/list-of-values', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const lists = await response.json()

// Получить список по ключу
const response = await fetch('/api/v1/list-of-values/key/positions', {
  headers: { 'Authorization': `Bearer ${token}` }
})
const positions = await response.json()
```

---

### 📝 Примеры использования API

#### Создать новый список значений

```bash
curl -X POST http://localhost:3000/api/v1/list-of-values \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Статусы платежей",
    "key": "payment_statuses",
    "description": "Статусы платежей в CRM",
    "items": [
      {"label": "Ожидание", "value": "pending", "sort_order": 1},
      {"label": "Подтверждено", "value": "confirmed", "sort_order": 2},
      {"label": "Завершено", "value": "completed", "sort_order": 3}
    ]
  }'
```

#### Получить список по ключу

```bash
curl http://localhost:3000/api/v1/list-of-values/key/positions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 🔄 Миграции и Сиды

Запуск миграций и сидов:

```bash
php artisan migrate --seed
```

Это создаст все таблицы и заполнит их русскими данными из `LOVSeeder` и `RealEstateSeeder`.

---

### 📚 Файлы которые были изменены/созданы

- ✅ `config/app.php` - обновлена локализация
- ✅ `.env` - обновлены переменные локализации
- ✅ `routes/web.php` - добавлены маршруты
- ✅ `routes/api.php` - добавлены API маршруты
- ✅ `resources/lang/ru.json` - создан
- ✅ `resources/lang/en.json` - создан
- ✅ `resources/js/composables/useTranslation.ts` - создан
- ✅ `resources/js/components/ListOfValuesManager.vue` - создан
- ✅ `resources/js/pages/crm/ListOfValues.tsx` - создан
- ✅ `database/migrations/2026_03_03_161936_create_list_of_values_table.php` - создана
- ✅ `database/seeders/LOVSeeder.php` - создан
- ✅ `database/seeders/DatabaseSeeder.php` - обновлен
- ✅ `app/Models/ListOfValues.php` - создан
- ✅ `app/Models/ListOfValuesItem.php` - создан
- ✅ `app/Http/Controllers/Api/ListOfValuesController.php` - создан
- ✅ `database/seeders/RealEstateSeeder.php` - содержит русские данные

---

### ✨ Следующие шаги

1. Запустить сервер: `php artisan serve --port=3000`
2. Запустить фронтенд: `npm run dev`
3. Перейти на `/crm/list-of-values` для управления LOV
4. Использовать компоненты с переводами используя `useTranslation()` хелпер
5. Интегрировать LOV в другие компоненты по мере необходимости
