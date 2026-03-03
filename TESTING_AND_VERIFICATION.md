# Инструкция по Проверке и Тестированию Системы

## ✅ Что Уже Сидировано

### Запуск Сидирования
```bash
cd /Users/netslayer/WebstormProjects/crm
php artisan migrate:fresh --seed
```

**Результат:**
```
✅ LOVSeeder                    - 116ms  (21 справочник значения)
✅ RealEstateSeeder            - 9ms    (2 агента, 4 объекта, 3 покупателя)
✅ MoscowTriggerTemplatesSeeder - 2ms   (26 триггеров в 8 категориях)
```

## 📊 Что Находится в Базе Данных

### Все данные хранятся в: `/database/database.sqlite`

```bash
# Проверить количество триггеров
sqlite3 database/database.sqlite "SELECT COUNT(*) FROM trigger_templates;"
# Результат: 26

# Проверить все категории
sqlite3 database/database.sqlite "SELECT category, COUNT(*) FROM trigger_templates GROUP BY category;"
# Результат:
# buyers|3
# deals|4
# leads|5
# messaging|2
# meta|3
# owners|3
# properties|4
# showings|2

# Проверить LOV значения
sqlite3 database/database.sqlite "SELECT COUNT(*) FROM list_of_values;"
# Результат: 21

# Проверить тестовых агентов
sqlite3 database/database.sqlite "SELECT name, email, status FROM agents;"
```

## 🌐 API Endpoints (Требуют Аутентификации)

### 1. Триггеры
```bash
# Получить триггеры по категории (ТРЕБУЕТ LOGIN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/triggers/templates/category/leads"

# Активировать триггер (ТРЕБУЕТ LOGIN)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trigger_template_id": 1}' \
  "http://localhost:3000/api/v1/triggers/"

# Получить статистику триггеров (ТРЕБУЕТ LOGIN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/triggers/stats"
```

### 2. List of Values (LOV)
```bash
# Получить все справочники
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/list-of-values"

# Получить справочник по ключу
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/list-of-values/key/agent_specialization"
```

## 🖥️ Тестирование в Браузере

### Шаг 1: Запустите Сервер
```bash
cd /Users/netslayer/WebstormProjects/crm
php artisan serve --port=3000
```

### Шаг 2: Откройте в Браузере
```
http://localhost:3000/login
Email: test@example.com
Password: password
```

### Шаг 3: Перейдите на Страницу Триггеров
```
http://localhost:3000/triggers
```

### Шаг 4: Откройте DevTools (F12) → Network Tab
Вы должны увидеть запросы:
- ✅ `GET /api/v1/triggers/templates/category/leads` → Status 200
- ✅ `GET /api/v1/triggers/stats` → Status 200
- ✅ `GET /api/v1/triggers/` → Status 200

### Шаг 5: Проверьте Response в DevTools
Правым кликом на запрос → Response → должна быть JSON с данными

## 🔧 Если Данные Не Показываются

### Проблема 1: Пустыми массив (`[]`)
```javascript
// В DevTools Console введите:
fetch('/api/v1/triggers/templates/category/leads')
  .then(r => r.json())
  .then(d => console.log(d))
```
**Если empty** - проверьте БД: `sqlite3 database/database.sqlite "SELECT COUNT(*) FROM trigger_templates;"`

### Проблема 2: Ошибка 401/403
Означает, что вы не залогированы. Попробуйте:
```bash
# Зайти как тестовый пользователь (есть в DatabaseSeeder)
Email: test@example.com
Password: password
```

### Проблема 3: Ошибка 404
API endpoint не найден. Запустите:
```bash
php artisan route:clear
php artisan config:clear
php artisan serve --port=3000
```

## 📝 Данные Для Кастомизации

### 1. Добавить Новый Триггер
(Отредактируйте `/database/seeders/MoscowTriggerTemplatesSeeder.php`)
```php
[
    'code' => 'new_trigger_code',
    'name' => '📌 Название триггера',
    'description' => 'Описание',
    'category' => 'leads', // или другая
    'entity_type' => 'Lead',
    'event_type' => 'created',
    'event_config' => json_encode(['event' => 'lead.created']),
    'action_config' => json_encode(['type' => 'send_notification']),
    'moscow_use_case' => 'Зачем это нужно в Москве',
    'expected_impact' => '15-20% улучшение',
    'is_recommended' => true,
],
```

Затем:
```bash
php artisan db:seed --class=MoscowTriggerTemplatesSeeder
```

### 2. Добавить Новое Значение LOV
(Отредактируйте `/database/seeders/LOVSeeder.php`)
```php
[
    'name' => 'Премиум',
    'key' => 'agent_level_premium',
    'description' => 'Премиум уровень агента',
    'is_system' => false,
    'sort_order' => 1,
],
```

Затем:
```bash
php artisan db:seed --class=LOVSeeder
```

### 3. Добавить Тестового Агента
(Отредактируйте `/database/seeders/RealEstateSeeder.php`)
```php
Agent::create([
    'name' => 'Новый Агент',
    'email' => 'agent@example.com',
    'phone' => '+7 (900) 000-00-00',
    'status' => 'active',
    'specialization' => 'residential',
],
```

Затем:
```bash
php artisan db:seed --class=RealEstateSeeder
```

## 🎯 Полный Цикл: Добавлять данные → Видеть в UI

### Пример: Добавить новый триггер
1. Отредактируйте `MoscowTriggerTemplatesSeeder.php`
2. Запустите: `php artisan db:seed --class=MoscowTriggerTemplatesSeeder`
3. Пересегрузите страницу `/triggers` в браузере
4. Должны видеть новый триггер в соответствующей категории

## 📚 Файлы Сидирования

- `/database/seeders/DatabaseSeeder.php` - главный файл (вызывает остальные)
- `/database/seeders/LOVSeeder.php` - справочники
- `/database/seeders/RealEstateSeeder.php` - агенты, объекты, покупатели
- `/database/seeders/MoscowTriggerTemplatesSeeder.php` - 26 триггеров

## 🚀 Быстрый Старт

```bash
# 1. Пересоздать БД со всеми данными
php artisan migrate:fresh --seed

# 2. Очистить кэш
php artisan route:clear && php artisan config:clear

# 3. Запустить сервер
php artisan serve --port=3000

# 4. Открыть в браузере
open http://localhost:3000/login
# Email: test@example.com
# Password: password

# 5. Перейти на /triggers
open http://localhost:3000/triggers
```

## ✅ Чек-лист

- [x] DB migration выполнена
- [x] 26 триггеров seeded
- [x] 21 LOV значение seeded
- [x] 2 агента created
- [x] 4 объекта created
- [x] API endpoints существуют
- [x] Frontend Triggers.tsx интегрирован
- [ ] Проверить в браузере (вы должны сделать)

---

**Что дальше?**
1. Зайдите в систему (test@example.com)
2. Перейдите на /triggers
3. Убедитесь, что видите триггеры
4. Если пусто - проверьте DevTools Network tab
5. Если нужно добавить данные - отредактируйте seeders и запустите `php artisan db:seed`
