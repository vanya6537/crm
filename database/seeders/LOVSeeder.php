<?php

namespace Database\Seeders;

use App\Models\ListOfValues;
use App\Models\ListOfValuesItem;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LOVSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        ListOfValuesItem::query()->delete();
        ListOfValues::query()->delete();

        // ===== LEADS (ЛИДЫ) =====
        
        // Источники лидов
        $leadSource = ListOfValues::create([
            'name' => 'Источники лидов',
            'key' => 'lead_source',
            'description' => 'Источники поступления лидов',
            'is_system' => true,
            'sort_order' => 1,
        ]);
        $leadSource->items()->createMany([
            ['label' => 'ЦИАН', 'value' => 'cian', 'sort_order' => 1],
            ['label' => 'Яндекс.Недвижимость', 'value' => 'yandex_realty', 'sort_order' => 2],
            ['label' => 'Авито', 'value' => 'avito', 'sort_order' => 3],
            ['label' => 'Viber', 'value' => 'viber', 'sort_order' => 4],
            ['label' => 'WhatsApp', 'value' => 'whatsapp', 'sort_order' => 5],
            ['label' => 'Телефон', 'value' => 'phone', 'sort_order' => 6],
            ['label' => 'Email', 'value' => 'email', 'sort_order' => 7],
            ['label' => 'VK', 'value' => 'vk', 'sort_order' => 8],
            ['label' => 'Instagram', 'value' => 'instagram', 'sort_order' => 9],
            ['label' => 'Telegram', 'value' => 'telegram', 'sort_order' => 10],
            ['label' => 'Facebook', 'value' => 'facebook', 'sort_order' => 11],
            ['label' => 'Google Карты', 'value' => 'google_maps', 'sort_order' => 12],
            ['label' => '2Gis', 'value' => '2gis', 'sort_order' => 13],
            ['label' => 'CPA сеть', 'value' => 'cpa_network', 'sort_order' => 14],
            ['label' => 'Реклама (Google Ads)', 'value' => 'google_ads', 'sort_order' => 15],
            ['label' => 'Реклама (Yandex Direct)', 'value' => 'yandex_direct', 'sort_order' => 16],
            ['label' => 'Рефераль', 'value' => 'referral', 'sort_order' => 17],
            ['label' => 'Прямое обращение', 'value' => 'direct_appeal', 'sort_order' => 18],
        ]);

        // Статусы лидов
        $leadStatus = ListOfValues::create([
            'name' => 'Статусы лидов',
            'key' => 'lead_status',
            'description' => 'Статусы лидов в CRM',
            'is_system' => true,
            'sort_order' => 2,
        ]);
        $leadStatus->items()->createMany([
            ['label' => 'Новый', 'value' => 'new', 'sort_order' => 1],
            ['label' => 'Принят', 'value' => 'accepted', 'sort_order' => 2],
            ['label' => 'В работе', 'value' => 'in_progress', 'sort_order' => 3],
            ['label' => 'Назначен показ', 'value' => 'showing_scheduled', 'sort_order' => 4],
            ['label' => 'Проведен показ', 'value' => 'showing_completed', 'sort_order' => 5],
            ['label' => 'Интерес проявлен', 'value' => 'interested', 'sort_order' => 6],
            ['label' => 'Переговоры', 'value' => 'negotiation', 'sort_order' => 7],
            ['label' => 'Оферта отправлена', 'value' => 'offer_sent', 'sort_order' => 8],
            ['label' => 'Сделка в процессе', 'value' => 'deal_in_progress', 'sort_order' => 9],
            ['label' => 'Контракт подписан', 'value' => 'contract_signed', 'sort_order' => 10],
            ['label' => 'Сделка завершена', 'value' => 'deal_closed', 'sort_order' => 11],
            ['label' => 'Потеран лид', 'value' => 'lost', 'sort_order' => 12],
            ['label' => 'Отказ', 'value' => 'rejected', 'sort_order' => 13],
        ]);

        // ===== TRANSACTIONS / DEALS (СДЕЛКИ) =====
        
        // Статусы сделок
        $dealStatus = ListOfValues::create([
            'name' => 'Статусы сделок',
            'key' => 'deal_status',
            'description' => 'Статусы реальных сделок',
            'is_system' => true,
            'sort_order' => 3,
        ]);
        $dealStatus->items()->createMany([
            ['label' => 'Одобрение', 'value' => 'approval', 'sort_order' => 1],
            ['label' => 'Согласование', 'value' => 'agreement', 'sort_order' => 2],
            ['label' => 'Подготовка документов', 'value' => 'docs_preparation', 'sort_order' => 3],
            ['label' => 'Регистрация в Росреестре', 'value' => 'rosreestr_registration', 'sort_order' => 4],
            ['label' => 'Освидетельствование', 'value' => 'inspection', 'sort_order' => 5],
            ['label' => 'Передача денег', 'value' => 'payment_transfer', 'sort_order' => 6],
            ['label' => 'Вкладка в Сбербанке', 'value' => 'bank_deposit', 'sort_order' => 7],
            ['label' => 'Завершено - деньги получены', 'value' => 'completed_payment_received', 'sort_order' => 8],
            ['label' => 'Завершено - контракт подписан', 'value' => 'completed_contract_signed', 'sort_order' => 9],
            ['label' => 'Отменено', 'value' => 'cancelled', 'sort_order' => 10],
        ]);

        // Тип сделки
        $dealType = ListOfValues::create([
            'name' => 'Тип сделки',
            'key' => 'deal_type',
            'description' => 'Тип реальной сделки (продажа, аренда, обмен)',
            'is_system' => true,
            'sort_order' => 4,
        ]);
        $dealType->items()->createMany([
            ['label' => 'Продажа', 'value' => 'sale', 'sort_order' => 1],
            ['label' => 'Аренда короткая', 'value' => 'short_rent', 'sort_order' => 2],
            ['label' => 'Аренда длительная', 'value' => 'long_rent', 'sort_order' => 3],
            ['label' => 'Обмен', 'value' => 'exchange', 'sort_order' => 4],
        ]);

        // ===== PROPERTIES (ОБЪЕКТЫ) =====
        
        // Тип объекта
        $propertyType = ListOfValues::create([
            'name' => 'Тип объекта',
            'key' => 'property_type',
            'description' => 'Тип объекта недвижимости',
            'is_system' => true,
            'sort_order' => 5,
        ]);
        $propertyType->items()->createMany([
            ['label' => 'Квартира', 'value' => 'apartment', 'sort_order' => 1],
            ['label' => 'Студия', 'value' => 'studio', 'sort_order' => 2],
            ['label' => 'Апартаменты', 'value' => 'aparthotel', 'sort_order' => 3],
            ['label' => 'Дом', 'value' => 'house', 'sort_order' => 4],
            ['label' => 'Коттедж', 'value' => 'cottage', 'sort_order' => 5],
            ['label' => 'Усадьба', 'value' => 'estate', 'sort_order' => 6],
            ['label' => 'Земельный участок', 'value' => 'land', 'sort_order' => 7],
            ['label' => 'Офис', 'value' => 'office', 'sort_order' => 8],
            ['label' => 'Коммерческое помещение', 'value' => 'commercial', 'sort_order' => 9],
            ['label' => 'Склад', 'value' => 'warehouse', 'sort_order' => 10],
            ['label' => 'Производство', 'value' => 'production', 'sort_order' => 11],
            ['label' => 'Гостевой дом', 'value' => 'guest_house', 'sort_order' => 12],
            ['label' => 'Отель', 'value' => 'hotel', 'sort_order' => 13],
            ['label' => 'Гараж', 'value' => 'garage', 'sort_order' => 14],
            ['label' => 'Машиноместо', 'value' => 'parking_space', 'sort_order' => 15],
        ]);

        // Статус объекта
        $propertyStatus = ListOfValues::create([
            'name' => 'Статус объекта',
            'key' => 'property_status',
            'description' => 'Статус объекта недвижимости',
            'is_system' => true,
            'sort_order' => 6,
        ]);
        $propertyStatus->items()->createMany([
            ['label' => 'Доступен', 'value' => 'available', 'sort_order' => 1],
            ['label' => 'Занят', 'value' => 'occupied', 'sort_order' => 2],
            ['label' => 'Зарезервирован', 'value' => 'reserved', 'sort_order' => 3],
            ['label' => 'На продаже', 'value' => 'for_sale', 'sort_order' => 4],
            ['label' => 'На аренде', 'value' => 'for_rent', 'sort_order' => 5],
            ['label' => 'На аукционе', 'value' => 'at_auction', 'sort_order' => 6],
            ['label' => 'Продан', 'value' => 'sold', 'sort_order' => 7],
            ['label' => 'Сдан в аренду', 'value' => 'rented_out', 'sort_order' => 8],
            ['label' => 'Выключен', 'value' => 'inactive', 'sort_order' => 9],
        ]);

        // Тип подразделения (районы Москвы)
        $district = ListOfValues::create([
            'name' => 'Районы Москвы',
            'key' => 'moscow_district',
            'description' => 'Административные округа и районы Москвы',
            'is_system' => true,
            'sort_order' => 7,
        ]);
        $districts = [
            'Центральный АО' => ['arbat', 'tverskoy', 'khamovniki', 'meshchanskiy', 'taganskiy', 'basmanny'],
            'Северный АО' => ['aeroport', 'begovoy', 'dmitrovskiy', 'krasnoselskiy', 'rostokintskiy'],
            'Северо-Восточный АО' => ['alekseevskiy', 'losinyy_ostrov', 'severnoye_medvedkovo', 'sokolniki'],
            'Восточный АО' => ['golyanovo', 'ivanovskoe', 'kosino_ukhtinskoe', 'krasnokazarmennoe'],
            'Юго-Восточный АО' => ['brateyevo', 'kuznetskiy', 'lyublino', 'kuplino'],
            'Южный АО' => ['biryulevo_vostochnoe', 'biryulevo_zapadnoe', 'donskoj', 'nagornoe'],
            'Юго-Западный АО' => ['chertanovo_centralnoe', 'chertanovo_severnoe', 'chertanovo_yuzhnoe', 'konkovo'],
            'Западный АО' => ['fili_davydkovo', 'krasnopresnenskiy', 'kuryakin', 'mozhayskiy'],
            'Северо-Западный АО' => ['khoroshevskiy', 'krylatskoye', 'mitino', 'novo_peredelkino'],
            'Зеленоградский АО' => ['zelenogradskiy'],
            'Новомосковский АО' => ['novomoskovsky'],
            'Троицкий АО' => ['troitskiy'],
        ];
        $sortOrder = 1;
        foreach ($districts as $name => $values) {
            foreach ($values as $value) {
                $district->items()->create([
                    'label' => ucfirst(str_replace('_', ' ', $value)),
                    'value' => $value,
                    'sort_order' => $sortOrder++,
                ]);
            }
        }

        // ===== PROPERTY SHOWINGS (ПОКАЗЫ) =====
        
        // Статус показа
        $showingStatus = ListOfValues::create([
            'name' => 'Статусы показов',
            'key' => 'showing_status',
            'description' => 'Статусы показов объектов',
            'is_system' => true,
            'sort_order' => 8,
        ]);
        $showingStatus->items()->createMany([
            ['label' => 'Запланирован', 'value' => 'scheduled', 'sort_order' => 1],
            ['label' => 'Подтвержден', 'value' => 'confirmed', 'sort_order' => 2],
            ['label' => 'Проведен', 'value' => 'completed', 'sort_order' => 3],
            ['label' => 'Отменен', 'value' => 'cancelled', 'sort_order' => 4],
            ['label' => 'Перенесен', 'value' => 'postponed', 'sort_order' => 5],
        ]);

        // Реакция на показ
        $showingReaction = ListOfValues::create([
            'name' => 'Реакция на показ',
            'key' => 'showing_reaction',
            'description' => 'Реакция клиента на показ объекта',
            'is_system' => true,
            'sort_order' => 9,
        ]);
        $showingReaction->items()->createMany([
            ['label' => 'Очень низкий интерес', 'value' => 'very_low', 'sort_order' => 1],
            ['label' => 'Низкий интерес', 'value' => 'low', 'sort_order' => 2],
            ['label' => 'Средний интерес', 'value' => 'medium', 'sort_order' => 3],
            ['label' => 'Высокий интерес', 'value' => 'high', 'sort_order' => 4],
            ['label' => 'Очень высокий интерес', 'value' => 'very_high', 'sort_order' => 5],
        ]);

        // ===== AGENTS (АГЕНТЫ) =====
        
        // Должности агентов
        $position = ListOfValues::create([
            'name' => 'Должности',
            'key' => 'position',
            'description' => 'Должности сотрудников компании',
            'is_system' => true,
            'sort_order' => 10,
        ]);
        $position->items()->createMany([
            ['label' => 'Директор', 'value' => 'director', 'sort_order' => 1],
            ['label' => 'Генеральный директор', 'value' => 'ceo', 'sort_order' => 2],
            ['label' => 'Начальник отдела продаж', 'value' => 'sales_manager', 'sort_order' => 3],
            ['label' => 'Риелтор', 'value' => 'realtor', 'sort_order' => 4],
            ['label' => 'Агент по продажам', 'value' => 'sales_agent', 'sort_order' => 5],
            ['label' => 'Агент по аренде', 'value' => 'rental_agent', 'sort_order' => 6],
            ['label' => 'Юрист', 'value' => 'lawyer', 'sort_order' => 7],
            ['label' => 'Главный бухгалтер', 'value' => 'chief_accountant', 'sort_order' => 8],
            ['label' => 'Бухгалтер', 'value' => 'accountant', 'sort_order' => 9],
            ['label' => 'Администратор', 'value' => 'administrator', 'sort_order' => 10],
            ['label' => 'Помощник', 'value' => 'assistant', 'sort_order' => 11],
            ['label' => 'IT специалист', 'value' => 'it_specialist', 'sort_order' => 12],
        ]);

        // Специализация агента
        $specialization = ListOfValues::create([
            'name' => 'Специализация агента',
            'key' => 'agent_specialization',
            'description' => 'Специализация агента по сегментам',
            'is_system' => true,
            'sort_order' => 11,
        ]);
        $specialization->items()->createMany([
            ['label' => 'Жилая недвижимость (продажа)', 'value' => 'residential_sale', 'sort_order' => 1],
            ['label' => 'Жилая недвижимость (аренда)', 'value' => 'residential_rent', 'sort_order' => 2],
            ['label' => 'Люкс сегмент', 'value' => 'luxury', 'sort_order' => 3],
            ['label' => 'Коммерческая недвижимость', 'value' => 'commercial', 'sort_order' => 4],
            ['label' => 'Офисная недвижимость', 'value' => 'office', 'sort_order' => 5],
            ['label' => 'Земельные участки', 'value' => 'land', 'sort_order' => 6],
            ['label' => 'Инвестиционная недвижимость', 'value' => 'investment', 'sort_order' => 7],
        ]);

        // Статус агента
        $agentStatus = ListOfValues::create([
            'name' => 'Статус агента',
            'key' => 'agent_status',
            'description' => 'Статус работы агента',
            'is_system' => true,
            'sort_order' => 12,
        ]);
        $agentStatus->items()->createMany([
            ['label' => 'Активный', 'value' => 'active', 'sort_order' => 1],
            ['label' => 'На отпуске', 'value' => 'on_vacation', 'sort_order' => 2],
            ['label' => 'Неактивный', 'value' => 'inactive', 'sort_order' => 3],
            ['label' => 'Уволен', 'value' => 'dismissed', 'sort_order' => 4],
        ]);

        // ===== COMMUNICATION / MESSENGERS (СВЯЗЬ) =====
        
        // Типы мессенджеров
        $messenger = ListOfValues::create([
            'name' => 'Мессенджеры',
            'key' => 'messenger_type',
            'description' => 'Типы мессенджеров для связи',
            'is_system' => true,
            'sort_order' => 13,
        ]);
        $messenger->items()->createMany([
            ['label' => 'WhatsApp', 'value' => 'whatsapp', 'sort_order' => 1],
            ['label' => 'Viber', 'value' => 'viber', 'sort_order' => 2],
            ['label' => 'Telegram', 'value' => 'telegram', 'sort_order' => 3],
            ['label' => 'VK', 'value' => 'vk', 'sort_order' => 4],
            ['label' => 'Instagram', 'value' => 'instagram', 'sort_order' => 5],
            ['label' => 'Facebook', 'value' => 'facebook', 'sort_order' => 6],
            ['label' => 'Email', 'value' => 'email', 'sort_order' => 7],
            ['label' => 'SMS', 'value' => 'sms', 'sort_order' => 8],
            ['label' => 'Телефон', 'value' => 'phone', 'sort_order' => 9],
        ]);

        // Статус сообщения
        $messageStatus = ListOfValues::create([
            'name' => 'Статус сообщения',
            'key' => 'message_status',
            'description' => 'Статус отправки сообщения',
            'is_system' => true,
            'sort_order' => 14,
        ]);
        $messageStatus->items()->createMany([
            ['label' => 'Черновик', 'value' => 'draft', 'sort_order' => 1],
            ['label' => 'Отправлено', 'value' => 'sent', 'sort_order' => 2],
            ['label' => 'Доставлено', 'value' => 'delivered', 'sort_order' => 3],
            ['label' => 'Прочитано', 'value' => 'read', 'sort_order' => 4],
            ['label' => 'Ошибка', 'value' => 'failed', 'sort_order' => 5],
            ['label' => 'Ответил', 'value' => 'replied', 'sort_order' => 6],
        ]);

        // ===== ПРОЦЕССЫ И WORKFLOW =====
        
        // Приоритет
        $priority = ListOfValues::create([
            'name' => 'Приоритет',
            'key' => 'priority',
            'description' => 'Уровень приоритета',
            'is_system' => true,
            'sort_order' => 15,
        ]);
        $priority->items()->createMany([
            ['label' => 'Низкий', 'value' => 'low', 'sort_order' => 1],
            ['label' => 'Средний', 'value' => 'medium', 'sort_order' => 2],
            ['label' => 'Высокий', 'value' => 'high', 'sort_order' => 3],
            ['label' => 'Критичный', 'value' => 'critical', 'sort_order' => 4],
        ]);

        // Тип задачи
        $taskType = ListOfValues::create([
            'name' => 'Типы задач',
            'key' => 'task_type',
            'description' => 'Типы задач в процессах',
            'is_system' => true,
            'sort_order' => 16,
        ]);
        $taskType->items()->createMany([
            ['label' => 'Звонок', 'value' => 'call', 'sort_order' => 1],
            ['label' => 'Встреча', 'value' => 'meeting', 'sort_order' => 2],
            ['label' => 'Email', 'value' => 'email', 'sort_order' => 3],
            ['label' => 'Сообщение', 'value' => 'message', 'sort_order' => 4],
            ['label' => 'Документ', 'value' => 'document', 'sort_order' => 5],
            ['label' => 'Проверка', 'value' => 'review', 'sort_order' => 6],
            ['label' => 'Утверждение', 'value' => 'approval', 'sort_order' => 7],
        ]);

        // Статус задачи
        $taskStatus = ListOfValues::create([
            'name' => 'Статусы задач',
            'key' => 'task_status',
            'description' => 'Статусы задач в процессах',
            'is_system' => true,
            'sort_order' => 17,
        ]);
        $taskStatus->items()->createMany([
            ['label' => 'Новая', 'value' => 'new', 'sort_order' => 1],
            ['label' => 'В процессе', 'value' => 'in_progress', 'sort_order' => 2],
            ['label' => 'Ожидание', 'value' => 'waiting', 'sort_order' => 3],
            ['label' => 'Приостановлена', 'value' => 'suspended', 'sort_order' => 4],
            ['label' => 'Завершена', 'value' => 'completed', 'sort_order' => 5],
            ['label' => 'Отменена', 'value' => 'cancelled', 'sort_order' => 6],
            ['label' => 'Отложена', 'value' => 'deferred', 'sort_order' => 7],
        ]);

        // ===== ФОРМЫ =====
        
        // Типы полей формы
        $fieldType = ListOfValues::create([
            'name' => 'Типы полей формы',
            'key' => 'form_field_type',
            'description' => 'Типы полей в формах',
            'is_system' => true,
            'sort_order' => 18,
        ]);
        $fieldType->items()->createMany([
            ['label' => 'Текст', 'value' => 'text', 'sort_order' => 1],
            ['label' => 'Email', 'value' => 'email', 'sort_order' => 2],
            ['label' => 'Телефон', 'value' => 'phone', 'sort_order' => 3],
            ['label' => 'Число', 'value' => 'number', 'sort_order' => 4],
            ['label' => 'Дата', 'value' => 'date', 'sort_order' => 5],
            ['label' => 'Дата/Время', 'value' => 'datetime', 'sort_order' => 6],
            ['label' => 'Выпадающий список', 'value' => 'select', 'sort_order' => 7],
            ['label' => 'Множественный выбор', 'value' => 'checkbox', 'sort_order' => 8],
            ['label' => 'Радиокнопка', 'value' => 'radio', 'sort_order' => 9],
            ['label' => 'Текстовая область', 'value' => 'textarea', 'sort_order' => 10],
            ['label' => 'Файл', 'value' => 'file', 'sort_order' => 11],
            ['label' => 'Адрес', 'value' => 'address', 'sort_order' => 12],
            ['label' => 'Карта', 'value' => 'map', 'sort_order' => 13],
            ['label' => 'Рейтинг', 'value' => 'rating', 'sort_order' => 14],
        ]);

        // ===== ДОПОЛНИТЕЛЬНЫЕ =====

        // Уровень срочности
        $urgency = ListOfValues::create([
            'name' => 'Уровень срочности',
            'key' => 'urgency_level',
            'description' => 'Уровни срочности',
            'is_system' => true,
            'sort_order' => 19,
        ]);
        $urgency->items()->createMany([
            ['label' => 'Низкая', 'value' => 'low', 'sort_order' => 1],
            ['label' => 'Средняя', 'value' => 'medium', 'sort_order' => 2],
            ['label' => 'Высокая', 'value' => 'high', 'sort_order' => 3],
            ['label' => 'Срочная', 'value' => 'urgent', 'sort_order' => 4],
        ]);

        // Финансирование
        $financing = ListOfValues::create([
            'name' => 'Типы финансирования',
            'key' => 'financing_type',
            'description' => 'Способ финансирования покупки',
            'is_system' => true,
            'sort_order' => 20,
        ]);
        $financing->items()->createMany([
            ['label' => 'Наличный расчет', 'value' => 'cash', 'sort_order' => 1],
            ['label' => 'Ипотека (Сбербанк)', 'value' => 'sber_mortgage', 'sort_order' => 2],
            ['label' => 'Ипотека (ВТБ)', 'value' => 'vtb_mortgage', 'sort_order' => 3],
            ['label' => 'Ипотека (Альфа-Банк)', 'value' => 'alfa_mortgage', 'sort_order' => 4],
            ['label' => 'Ипотека (Раифайзен)', 'value' => 'raiffeisen_mortgage', 'sort_order' => 5],
            ['label' => 'Ипотека (другое ЛК)', 'value' => 'other_mortgage', 'sort_order' => 6],
            ['label' => 'Рассрочка', 'value' => 'installment', 'sort_order' => 7],
            ['label' => 'Материнский капитал', 'value' => 'maternity_capital', 'sort_order' => 8],
            ['label' => 'По документам', 'value' => 'by_documents', 'sort_order' => 9],
        ]);

        // Источник информации на сайте портала
        $portalSource = ListOfValues::create([
            'name' => 'Источники на портальных сайтах',
            'key' => 'portal_source',
            'description' => 'Источники лидов с платформ недвижимости',
            'is_system' => true,
            'sort_order' => 21,
        ]);
        $portalSource->items()->createMany([
            ['label' => 'Объявление ЦИАН', 'value' => 'cian_listing', 'sort_order' => 1],
            ['label' => 'Объявление Авито', 'value' => 'avito_listing', 'sort_order' => 2],
            ['label' => 'Объявление Яндекс', 'value' => 'yandex_listing', 'sort_order' => 3],
            ['label' => 'Мобильное приложение', 'value' => 'mobile_app', 'sort_order' => 4],
            ['label' => 'Веб-сайт агентства', 'value' => 'agency_website', 'sort_order' => 5],
        ]);
    }
}

