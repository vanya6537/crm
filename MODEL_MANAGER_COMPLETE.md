# Менеджер объектов (Model Manager) - Полная реализация

## ✅ Что реализовано

### 1. Фронтенд с Drag-and-Drop
- **Файлы**:
  - `resources/js/pages/settings/ModelManager.tsx` - Главная страница с контролем сущностей
  - `resources/js/components/model-manager/DragDropFieldsList.tsx` - Список полей с drag-and-drop
  - `resources/js/components/model-manager/FieldModal.tsx` - Модальное окно для добавления/редактирования полей

- **Функции**:
  - ✅ Перетаскивание полей для изменения порядка (grip-dots слева от каждого поля)
  - ✅ Визуальная обратная связь при перетаскивании (полупрозрачность, подсветка зон дропа)
  - ✅ Автоматическое сохранение порядка при отпускании поля
  - ✅ Создание новых полей через модальное окно
  - ✅ Редактирование существующих полей
  - ✅ Удаление полей с подтверждением
  - ✅ Архивирование/восстановление полей
  - ✅ Переключение между типами объектов (Агенты, Недвижимость, Покупатели и т.д.)
  - ✅ Фильтрация по статусу (Активные/Архив)
  - ✅ Уведомления об успехе/ошибке

### 2. API Endpoints
- `GET /api/v1/model-fields/types` - Получить типы полей
- `GET /api/v1/model-fields/entity-types` - Получить типы сущностей
- `GET /api/v1/model-fields/{entityType}?status=active|archived` - Получить поля сущности
- `POST /api/v1/model-fields/{entityType}` - Создать поле
- `PUT /api/v1/model-fields/{entityType}/{uuid}` - Обновить поле
- `DELETE /api/v1/model-fields/{entityType}/{uuid}` - Удалить поле
- `POST /api/v1/model-fields/{entityType}/reorder` - Изменить порядок полей

### 3. Программная миграция (Programmatic Migration)
- **Файл**: `app/Services/MigrationService.php`
- **Функции**:
  - `addFieldToTable()` - Добавляет столбец в таблицу при создании поля
  - `removeFieldFromTable()` - Удаляет столбец из таблицы при удалении поля
  - `updateFieldInTable()` - Изменяет столбец при обновлении поля
  - `getTableNameForEntity()` - Возвращает название таблицы для типа сущности

- **Поддерживаемые типы полей** и их типы данных в БД:
  - `text`, `short_text` → VARCHAR(255)
  - `long_text`, `textarea` → TEXT
  - `big_text` → LONGTEXT
  - `number`, `integer` → INTEGER
  - `decimal` → DECIMAL(10,2)
  - `date` → DATE
  - `datetime` → DATETIME
  - `time` → TIME
  - `duration` → VARCHAR(50)
  - `select`, `radio`, `checkbox` → JSON
  - `reference`, `relation`, `master_relation`, `many_to_many` → JSON
  - `phone` → VARCHAR(20)
  - `email`, `url`, `autonumber` → VARCHAR
  - `file`, `checklist` → JSON

### 4. Модель данных
- **Таблица**: `model_fields`
- **Поля**:
  - `id` (PK), `uuid` (Unique)
  - `entity_type` (enum) - Тип сущности
  - `name` - Системное имя поля
  - `label` - Отображаемое название
  - `description` - Описание
  - `field_type` - Тип поля
  - `sort_order` - Порядок в списке
  - `required` - Обязательное ли поле
  - `is_active` - Активное ли поле
  - `placeholder`, `help_text` - Вспомогательные тексты
  - `options` - Варианты для select-полей (JSON)
  - `reference_table` - Связанная таблица
  - `validation` - Правила валидации (JSON)
  - `default_value` - Значение по умолчанию
  - `ui_config` - UI конфигурация (JSON)
  - `is_master_relation` - Мастер-связь?
  - `allow_multiple` - Множественный выбор?
  - `max_items` - Максимальное кол-во элементов
  - `created_by` - Кто создал
  - `created_at`, `updated_at` - Временные метки

## 🎯 Как это работает

### Поток создания нового поля:

1. **Пользователь нажимает "Новое поле"** → открывается FieldModal
2. **Выбирает тип поля** → выбор категории и типа
3. **Заполняет параметры** → имя, описание, обязательность и т.д.
4. **Нажимает "Добавить"** → отправляется POST запрос на `/api/v1/model-fields/{entityType}`
5. **API сохраняет в БД** → создается запись в `model_fields`
6. **Вызывает MigrationService** → автоматически добавляется столбец в соответствующую таблицу
7. **Возвращает результат** → фронтенд обновляет список полей
8. **Пользователь видит** → новое поле в списке и может сразу его перетащить

### Поток изменения порядка полей:

1. **Пользователь начинает перетаскивать** → `onDragStart` срабатывает
2. **Перемещает над другим полем** → `onDragOver` подсвечивает зону дропа
3. **Отпускает на новую позицию** → `onDrop` вызывает `handleReorderFields`
4. **Отправляется POST запрос** → на `/api/v1/model-fields/{entityType}/reorder`
5. **API обновляет sort_order** → для всех полей
6. **Оновляется локальное состояние** → фронтенд показывается новый порядок
7. **Показывается уведомление** → "Порядок полей сохранён"

### Поток удаления поля:

1. **Пользователь нажимает иконку удаления** → показывается подтверждение
2. **Подтверждает удаление** → отправляется DELETE запрос
3. **API удаляет запись** → из `model_fields`
4. **Вызывает MigrationService** → удаляет столбец из таблицы
5. **Возвращает результат** → фронтенд обновляет список
6. **Показывается уведомление** → "Поле успешно удалено"

## 📊 Примеры использования

### Создание поля "Email" для агентов:
```http
POST /api/v1/model-fields/agent
Content-Type: application/json

{
  "name": "email_work",
  "label": "Work Email",
  "field_type": "email",
  "required": true,
  "placeholder": "agent@example.com"
}
```

**Результат**: 
- Создается запись в `model_fields`
- Добавляется столбец `email_work VARCHAR(255)` в таблицу `agents`
- Фронтенд показывает новое поле в списке

### Создание поля связи "Агент":
```http
POST /api/v1/model-fields/property
Content-Type: application/json

{
  "name": "agent_id",
  "label": "Agent",
  "field_type": "relation",
  "reference_table": "agent",
  "required": true,
  "allow_multiple": false
}
```

**Результат**: 
- Создается запись в `model_fields`
- Добавляется столбец `agent_id JSON` в таблицу `properties`
- Можно хранить структурированные данные связано объекта

### Переупорядочивание полей:
```http
POST /api/v1/model-fields/agent/reorder
Content-Type: application/json

{
  "fields": [
    {"id": "uuid-1", "sort_order": 0},
    {"id": "uuid-2", "sort_order": 1},
    {"id": "uuid-3", "sort_order": 2}
  ]
}
```

## 🔄 Синхронизация с БД

При каждом CRUD операции над полем автоматически:
1. Создается/обновляется запись в таблице `model_fields`
2. Синхронизируется соответствующая таблица (agents, properties, buyers и т.д.)
3. Проверяется типизация и добавляются нужные конструкции (nullable, default и т.д.)

**Это полностью имитирует процесс миграции, но делается программно на лету!**

## 🚀 Готово к использованию

Система полностью функциональна и готова к:
- ✅ Созданию пользовательских полей
- ✅ Управлению порядком полей
- ✅ Архивированию неиспользуемых полей
- ✅ Автоматическому обновлению схемы БД
- ✅ Хранению структурированных данных в JSON полях

Вся работа синхронизирована между фронтендом и бэкендом в реальном времени.
