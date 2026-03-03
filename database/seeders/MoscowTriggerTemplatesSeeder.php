<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MoscowTriggerTemplatesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        $triggers = [
            // ===== 1. LEADS (Лиды) =====
            [
                'code' => 'lead_auto_assign_manager',
                'name' => '👤 Автоматическое распределение менеджера',
                'description' => 'Авто-назначение менеджера по специализации или нагрузке',
                'category' => 'leads',
                'entity_type' => 'Lead',
                'event_type' => 'created',
                'event_config' => json_encode([
                    'event' => 'lead.created',
                    'condition' => ['status' => 'new']
                ]),
                'action_config' => json_encode([
                    'type' => 'assign_agent',
                    'strategy' => ['by_specialization', 'by_load_balance'],
                    'notify' => true
                ]),
                'moscow_use_case' => 'Критично в москве - рынок перегрет, первые 1-2 мин решают все',
                'expected_impact' => 'Увеличивает конверсию на 15-20%',
                'is_recommended' => true,
            ],
            [
                'code' => 'lead_first_contact_reminder',
                'name' => '⏰ Напоминание о первом контакте',
                'description' => 'Напомнить менеджеру позвонить в течение 15 минут',
                'category' => 'leads',
                'entity_type' => 'Lead',
                'event_type' => 'time_based',
                'event_config' => json_encode(['event' => 'lead.created']),
                'timing_config' => json_encode(['delay' => '15min', 'frequency' => 'once']),
                'action_config' => json_encode([
                    'type' => 'send_notification',
                    'channels' => ['push', 'telegram'],
                    'template' => 'lead_first_contact_15min'
                ]),
                'moscow_use_case' => 'SLA критичен - конкуренция огромная',
                'expected_impact' => 'Дозвон в первый раз повышается в 2x раза',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => 'Лид: {{lead_name}}, район {{district}}. Позвонить в течение 15 мин!',
                    'priority' => 'high'
                ])
            ],
            [
                'code' => 'lead_unassigned_reassign',
                'name' => '🔄 Передача необработанного лида',
                'description' => 'Передать лид другому менеджеру если не обработан 1 час',
                'category' => 'leads',
                'entity_type' => 'Lead',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '1h', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['status' => 'new', 'assigned_at' => null]]),
                'action_config' => json_encode([
                    'type' => 'reassign_agent',
                    'notify_old' => true,
                    'notify_new' => true
                ]),
                'moscow_use_case' => 'Агенты "держат" лиды - нужна автоматическая проверка',
                'expected_impact' => 'Не теряются лиды, +10% конверсии',
                'is_recommended' => true,
            ],
            [
                'code' => 'lead_objection_warmup',
                'name' => '🔥 Прогрев возражения "дорого"',
                'description' => 'Отправить подборку похожих объектов дешевле при отказе по цене',
                'category' => 'leads',
                'entity_type' => 'Lead',
                'event_type' => 'status_changed',
                'event_config' => json_encode([
                    'from_status' => 'interested',
                    'to_status' => 'declined',
                    'reason' => 'price_too_high'
                ]),
                'action_config' => json_encode([
                    'type' => 'send_offer_list',
                    'channels' => ['whatsapp', 'email'],
                    'filter_criteria' => ['similar_district', 'lower_price']
                ]),
                'moscow_use_case' => 'Покупатели эластичны по цене, часто меняют мнение',
                'expected_impact' => 'Возвращает 15-25% отказавших',
                'is_recommended' => true,
            ],
            [
                'code' => 'lead_no_response_7days',
                'name' => '📧 Follow-up неактивного лида (7 дней)',
                'description' => 'Теплый follow-up для молчащих лидов через 7 дней',
                'category' => 'leads',
                'entity_type' => 'Lead',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '7d', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['status' => 'interested', 'last_contact' => null]]),
                'action_config' => json_encode([
                    'type' => 'send_message',
                    'channels' => ['whatsapp', 'telegram'],
                    'template' => 'lead_follow_up_7days'
                ]),
                'moscow_use_case' => 'Молчащие лиды = потеря, нужны напоминания',
                'expected_impact' => 'Реактивирует 10-15% молчащих',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => 'Привет! Актуальны ли ваши параметры поиска? У нас есть новые варианты!'
                ])
            ],

            // ===== 2. PROPERTIES (Объекты) =====
            [
                'code' => 'property_fraud_check',
                'name' => '🛡️ Проверка на мошенников и дубликаты',
                'description' => 'Авто-проверка нового объекта через ЦИАН API',
                'category' => 'properties',
                'entity_type' => 'Property',
                'event_type' => 'created',
                'event_config' => json_encode(['event' => 'property.created']),
                'action_config' => json_encode([
                    'type' => 'external_api_check',
                    'api' => 'cian_avito_check',
                    'alert_if_duplicate' => true
                ]),
                'moscow_use_case' => 'Москва переполнена фейками - критична проверка',
                'expected_impact' => 'Предотвращает репутационные риски',
                'is_recommended' => true,
            ],
            [
                'code' => 'property_expiry_renewal',
                'name' => '🔄 Продление объекта перед истечением',
                'description' => 'Напомнить менеджеру и авто-продлить объявление за 3 дня до срока',
                'category' => 'properties',
                'entity_type' => 'Property',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '-3d', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['status' => 'published']]),
                'action_config' => json_encode([
                    'type' => 'auto_renew_listing',
                    'notify_manager' => true,
                    'channels' => ['email', 'telegram']
                ]),
                'moscow_use_case' => 'Объект "упадет" из выдачи - потеря показов',
                'expected_impact' => 'Не теряются покупатели, +5-8% показов',
                'is_recommended' => true,
            ],
            [
                'code' => 'property_price_drop',
                'name' => '📉 Массовая рассылка при снижении цены',
                'description' => 'Уведомить всех заинтересованных при снижении цены на 5%+',
                'category' => 'properties',
                'entity_type' => 'Property',
                'event_type' => 'field_changed',
                'event_config' => json_encode([
                    'field' => 'price',
                    'change_threshold_percent' => 5
                ]),
                'action_config' => json_encode([
                    'type' => 'notify_interested_buyers',
                    'channels' => ['whatsapp', 'email'],
                    'template' => 'price_drop_notification'
                ]),
                'moscow_use_case' => 'Снижение цены = огромный скачок спроса',
                'expected_impact' => 'Показы +30-50%, позволяет закрыть быстро',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => '💥 ЦЕНА УПАЛА! {{property_name}} теперь {{new_price}}₽ (было {{old_price}}₽)',
                    'cta' => 'Смотреть объект'
                ])
            ],
            [
                'code' => 'property_new_in_district',
                'name' => '🌟 Новый объект в районе',
                'description' => 'Уведомить агентов специализирующихся в этом районе',
                'category' => 'properties',
                'entity_type' => 'Property',
                'event_type' => 'created',
                'event_config' => json_encode(['event' => 'property.created']),
                'action_config' => json_encode([
                    'type' => 'notify_district_specialists',
                    'match_criteria' => ['district', 'agent_specialization'],
                    'channels' => ['push', 'telegram']
                ]),
                'moscow_use_case' => 'Агенты работают по районам - нужна локальная информация',
                'expected_impact' => 'Лучше используются ресурсы команды',
                'is_recommended' => true,
            ],

            // ===== 3. BUYERS (Покупатели) =====
            [
                'code' => 'buyer_auto_matching',
                'name' => '🎯 Автоматический подбор объектов',
                'description' => 'Подобрать top-10 объектов по параметрам клиента',
                'category' => 'buyers',
                'entity_type' => 'Buyer',
                'event_type' => 'created',
                'event_config' => json_encode(['event' => 'buyer.created']),
                'action_config' => json_encode([
                    'type' => 'auto_matching',
                    'count' => 10,
                    'channels' => ['whatsapp', 'email'],
                    'template' => 'property_matching_results'
                ]),
                'moscow_use_case' => 'Ожидание авто-подбора - менеджеры тратят часы',
                'expected_impact' => 'Экономит 10+ часов в неделю на подбор',
                'is_recommended' => true,
            ],
            [
                'code' => 'buyer_inactivity_follow_up',
                'name' => '📞 Напоминание неактивному покупателю',
                'description' => 'Warm follow-up через 3 дня без активности',
                'category' => 'buyers',
                'entity_type' => 'Buyer',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '3d', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['inactivity_days' => '>=3']]),
                'action_config' => json_encode([
                    'type' => 'send_message',
                    'channels' => ['whatsapp'],
                    'template' => 'buyer_inactivity_check'
                ]),
                'moscow_use_case' => 'Молчащие клиенты теряются - нужны напоминания',
                'expected_impact' => 'Возвращает 20% молчащих',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => 'Привет! Актуальны ли ваши пожелания? Есть новые горячие предложения!'
                ])
            ],
            [
                'code' => 'buyer_viewed_feedback',
                'name' => '📋 Запрос отзыва после просмотра',
                'description' => 'Форма обратной связи через 1 час после показа',
                'category' => 'buyers',
                'entity_type' => 'Buyer',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '1h', 'frequency' => 'once']),
                'event_config' => json_encode(['event' => 'showing.completed']),
                'action_config' => json_encode([
                    'type' => 'send_form',
                    'form_type' => 'showing_feedback',
                    'channels' => ['whatsapp']
                ]),
                'moscow_use_case' => 'Нужна оперативная обратная связь для корректировки предложений',
                'expected_impact' => 'Улучшает quality скоринг лидов',
                'is_recommended' => true,
            ],

            // ===== 4. SHOWINGS (Показы) =====
            [
                'code' => 'showing_advance_reminder',
                'name' => '⏲️ Напоминание клиенту за 2 часа',
                'description' => 'SMS/WhatsApp напоминание за 2 часа, включая адрес и контакт агента',
                'category' => 'showings',
                'entity_type' => 'PropertyShowing',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '-2h', 'frequency' => 'once']),
                'event_config' => json_encode(['event' => 'showing.scheduled']),
                'action_config' => json_encode([
                    'type' => 'send_reminder',
                    'channels' => ['sms', 'whatsapp'],
                    'include' => ['address', 'agent_contacts', 'directions']
                ]),
                'moscow_use_case' => 'Пробки = опаздания, нужно заранее предупредить',
                'expected_impact' => 'Снижает no-show на 30-40%',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => 'Напоминание! Показ в {{address}} через 2 часа. Агент {{agent_name}}: {{phone}}'
                ])
            ],
            [
                'code' => 'showing_agent_delay',
                'name' => '🚗 Уведомление о задержке агента',
                'description' => 'Если агент опаздывает - уведомить клиента с eta',
                'category' => 'showings',
                'entity_type' => 'PropertyShowing',
                'event_type' => 'custom',
                'event_config' => json_encode(['event' => 'agent.location.delay']),
                'action_config' => json_encode([
                    'type' => 'send_notification',
                    'channels' => ['sms', 'whatsapp'],
                    'include_eta' => true
                ]),
                'moscow_use_case' => 'Опоздания стандартны - необходимо сохранять доверие',
                'expected_impact' => 'Держит клиента в ожидании, +15% успешных показов',
                'is_recommended' => true,
            ],

            // ===== 5. DEALS (Сделки) =====
            [
                'code' => 'deal_stalled_escalation',
                'name' => '🚨 Эскалация зависшей сделки',
                'description' => 'Напомнить менеджеру о сделке без изменений 3 дня',
                'category' => 'deals',
                'entity_type' => 'Transaction',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '3d', 'frequency' => 'repeat_daily']),
                'event_config' => json_encode(['condition' => ['status' => ['not' => 'completed'], 'inactivity_days' => '>=3']]),
                'action_config' => json_encode([
                    'type' => 'escalate_task',
                    'notify_manager' => true,
                    'channels' => ['push', 'email']
                ]),
                'moscow_use_case' => 'Паузы = потеря клиента, нужны напоминания',
                'expected_impact' => 'Завершает 20% зависших сделок',
                'is_recommended' => true,
            ],
            [
                'code' => 'deal_documents_stage',
                'name' => '📄 Запрос документов',
                'description' => 'Форма для загрузки паспорта/сканов при переходе на этап "Документы"',
                'category' => 'deals',
                'entity_type' => 'Transaction',
                'event_type' => 'status_changed',
                'event_config' => json_encode(['to_status' => 'documents_required']),
                'action_config' => json_encode([
                    'type' => 'send_form',
                    'form_type' => 'documents_upload',
                    'channels' => ['whatsapp']
                ]),
                'moscow_use_case' => 'Ускоряет обмен документами',
                'expected_impact' => 'Сокращает время на 20-30%',
                'is_recommended' => true,
            ],
            [
                'code' => 'deal_legal_stage_notif',
                'name' => '⚖️ Уведомление юристам',
                'description' => 'Авто-создание задачи для юриста при переходе на стадию "Согласование"',
                'category' => 'deals',
                'entity_type' => 'Transaction',
                'event_type' => 'status_changed',
                'event_config' => json_encode(['to_status' => 'legal_review']),
                'action_config' => json_encode([
                    'type' => 'create_task',
                    'assign_to' => 'legal_team',
                    'notify' => true
                ]),
                'moscow_use_case' => 'Юристы - узкое место, нужна ясная очередь',
                'expected_impact' => 'Ускоряет юр. согласование на 15-20%',
                'is_recommended' => true,
            ],
            [
                'code' => 'deal_completed_nps',
                'name' => '⭐ NPS опрос после закрытия',
                'description' => 'Форма оценки агента сразу после завершения сделки',
                'category' => 'deals',
                'entity_type' => 'Transaction',
                'event_type' => 'status_changed',
                'event_config' => json_encode(['to_status' => 'completed']),
                'action_config' => json_encode([
                    'type' => 'send_form',
                    'form_type' => 'nps_survey',
                    'channels' => ['whatsapp', 'email']
                ]),
                'moscow_use_case' => 'Нужна обратная связь для улучшения качества',
                'expected_impact' => 'Помогает identify top agents, улучшает сервис',
                'is_recommended' => true,
            ],

            // ===== 6. OWNERS (Собственники) =====
            [
                'code' => 'owner_contract_expiry',
                'name' => '📋 Продление договора перед истечением',
                'description' => 'Напомнить собственнику за 30 дней до окончания договора',
                'category' => 'owners',
                'entity_type' => 'Owner',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '-30d', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['status' => 'active']]),
                'action_config' => json_encode([
                    'type' => 'send_message',
                    'channels' => ['whatsapp', 'email'],
                    'template' => 'contract_renewal_notice'
                ]),
                'moscow_use_case' => 'Большой churn собственников - нужно удерживать',
                'expected_impact' => 'Удерживает 40-50% собственников',
                'is_recommended' => true,
            ],
            [
                'code' => 'owner_no_showings_advice',
                'name' => '📉 Совет по снижению цены',
                'description' => 'Если нет показов 10 дней - рекомендовать снизить цену',
                'category' => 'owners',
                'entity_type' => 'Property',
                'event_type' => 'time_based',
                'timing_config' => json_encode(['delay' => '10d', 'frequency' => 'once']),
                'event_config' => json_encode(['condition' => ['showing_count' => '0']]),
                'action_config' => json_encode([
                    'type' => 'send_advice',
                    'notify_owner' => true,
                    'notify_manager' => true,
                    'channels' => ['whatsapp']
                ]),
                'moscow_use_case' => 'Чем раньше реагировать на отсутствие спроса, тем лучше',
                'expected_impact' => 'Снижает время продажи на 20-30%',
                'is_recommended' => true,
            ],
            [
                'code' => 'owner_new_interest',
                'name' => '💬 Новый потенциальный покупатель',
                'description' => 'Уведомить собственника о заинтересованном клиенте',
                'category' => 'owners',
                'entity_type' => 'Property',
                'event_type' => 'created',
                'event_config' => json_encode(['event' => 'buyer_interest.created']),
                'action_config' => json_encode([
                    'type' => 'send_notification',
                    'channels' => ['whatsapp'],
                    'template' => 'buyer_interested'
                ]),
                'moscow_use_case' => 'Собственники хотят знать про интерес - мотивирует их',
                'expected_impact' => 'Улучшает отношения с собственниками',
                'is_recommended' => true,
                'sample_notification' => json_encode([
                    'text' => 'Хорошие новости! 🎉 Есть клиент, заинтересованный в вашей квартире!'
                ])
            ],

            // ===== 7. MESSAGING (Мессенджеры) =====
            [
                'code' => 'whatsapp_new_message_lead',
                'name' => '💬 Создание лида из WhatsApp',
                'description' => 'Авто-создание лида когда клиент пишет в WhatsApp',
                'category' => 'messaging',
                'entity_type' => 'Communication',
                'event_type' => 'created',
                'event_config' => json_encode(['event' => 'message.whatsapp.received']),
                'action_config' => json_encode([
                    'type' => 'create_lead',
                    'extract_fields' => ['name', 'phone', 'message_context'],
                    'auto_assign' => true
                ]),
                'moscow_use_case' => 'WhatsApp - основной канал продаж в Москве',
                'expected_impact' => 'Не теряются клиенты из мессенджера',
                'is_recommended' => true,
            ],
            [
                'code' => 'whatsapp_cta_showing',
                'name' => '📅 Создание показа по кнопке',
                'description' => 'Создание показа когда клиент нажимает "Записаться на показ"',
                'category' => 'messaging',
                'entity_type' => 'Communication',
                'event_type' => 'custom',
                'event_config' => json_encode(['event' => 'whatsapp_button.booking_pressed']),
                'action_config' => json_encode([
                    'type' => 'create_showing',
                    'auto_assign_slot' => true,
                    'estimate_arrival' => true
                ]),
                'moscow_use_case' => 'Прямой путь от интереса к показу',
                'expected_impact' => 'Конверсия +25-30%',
                'is_recommended' => true,
            ],

            // ===== 8. META TRIGGERS (Комплексные) =====
            [
                'code' => 'property_no_views_high_interest',
                'name' => '🎯 Комплексный анализ спроса',
                'description' => 'Высокие просмотры но нет показов = сигнал снизить цену',
                'category' => 'meta',
                'entity_type' => 'Property',
                'event_type' => 'custom',
                'event_config' => json_encode([
                    'event' => 'property.analysis',
                    'condition' => ['views_per_day' => '>=20', 'showing_count' => '0', 'days_listed' => '>=7']
                ]),
                'action_config' => json_encode([
                    'type' => 'send_advice',
                    'notify_manager' => true,
                    'notify_owner' => true,
                    'suggestion' => 'lower_price_5percent'
                ]),
                'moscow_use_case' => 'Сигнал неправильной цены - высокая конкуренция',
                'expected_impact' => 'Правильная ценовая стратегия = +40% продаж',
                'is_recommended' => true,
            ],
            [
                'code' => 'buyer_pattern_matching',
                'name' => '🔀 Поведение клиента типовое',
                'description' => 'Клиент смотрит 2-3 одинаковых объекта = рекомендовать похожие',
                'category' => 'meta',
                'entity_type' => 'Buyer',
                'event_type' => 'custom',
                'event_config' => json_encode(['event' => 'buyer.viewing_pattern']),
                'action_config' => json_encode([
                    'type' => 'auto_recommend',
                    'match_similar' => true,
                    'channels' => ['whatsapp']
                ]),
                'moscow_use_case' => 'Умное предложение - клиент видит, что поняли его',
                'expected_impact' => 'Конверсия +15-20%',
                'is_recommended' => true,
            ],
            [
                'code' => 'message_read_follow_up',
                'name' => '⏱️ Follow-up через 20 минут после прочтения',
                'description' => 'Отправить follow-up когда клиент прочитал сообщение',
                'category' => 'meta',
                'entity_type' => 'Communication',
                'event_type' => 'custom',
                'event_config' => json_encode(['event' => 'message.read']),
                'timing_config' => json_encode(['delay' => '20min']),
                'action_config' => json_encode([
                    'type' => 'send_follow_up',
                    'channels' => ['whatsapp'],
                    'template' => 'gentle_follow_up'
                ]),
                'moscow_use_case' => 'Прочитал = заинтересовался, не дать забыть',
                'expected_impact' => 'Увеличивает response rate на 30-40%',
                'is_recommended' => true,
            ],
        ];

        // Ensure all triggers have all required fields
        $processed = collect($triggers)->map(fn($t) => array_merge([
            'timing_config' => null,
            'default_template_vars' => null,
            'sample_notification' => null,
            'created_by' => null,
        ], $t, [
            'created_at' => $now,
            'updated_at' => $now,
        ]))->all();

        DB::table('trigger_templates')->insertOrIgnore($processed);

        $this->command->info('✅ Moscow trigger templates seeded: ' . count($triggers) . ' triggers');
    }
}
