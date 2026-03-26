<?php

namespace Database\Seeders;

use App\ProcessManagement\Models\TriggerDefinition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UnifiedTriggerDefinitionsSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = collect()
            ->merge($this->buildFamily(
                'leads',
                'Lead',
                'Buyer',
                [
                    1 => 'Новый лид поступил',
                    2 => 'Лид не назначен',
                    3 => 'Лид не обработан в SLA',
                    4 => 'Первый контакт не зафиксирован',
                    5 => 'Лид без квалификации',
                    6 => 'Клиент перестал отвечать',
                    7 => 'Клиент долго не выходил на связь',
                    8 => 'Клиент ответил после паузы',
                    9 => 'Клиент открыл сообщение, но не ответил',
                    10 => 'Клиент написал вне рабочего времени',
                    11 => 'Клиент позвонил, но звонок пропущен',
                    12 => 'Клиент повторно интересуется тем же объектом',
                    13 => 'Клиент интересуется несколькими объектами в одном ЖК/районе',
                    14 => 'Клиент изменил требования',
                    15 => 'Клиент сообщил о срочности',
                    16 => 'Клиент готов к следующему этапу',
                    17 => 'Клиент ушёл в тишину после показа',
                    18 => 'Клиент сомневается',
                    19 => 'Клиент сравнивает с конкурентом',
                    20 => 'Клиент отказался без причины',
                    21 => 'Клиент отказался по цене',
                    22 => 'Клиент отказался по локации',
                    23 => 'Клиент отказался из-за ипотеки',
                    24 => 'Клиент ушёл к другому агенту/агентству',
                    25 => 'Спящий лид можно реактивировать',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'high',
                    'default_action' => 'Связаться с клиентом и обновить статус лида',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 72,
                    'dedupe_scope' => 'entity',
                ],
                [
                    1 => ['source_event' => 'created', 'trigger_type' => 'entity_created', 'activation_ready' => true, 'priority' => 'critical'],
                    11 => ['runtime_entity_type' => 'Communication', 'source_event' => 'message_received', 'trigger_type' => 'entity_updated', 'activation_ready' => true, 'attention_state' => 'urgent', 'priority' => 'critical'],
                    12 => ['runtime_entity_type' => 'Communication', 'source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'opportunity', 'priority' => 'high'],
                    15 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'urgent', 'priority' => 'critical'],
                    16 => ['runtime_entity_type' => 'Transaction', 'source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                ]
            ))
            ->merge($this->buildFamily(
                'deals',
                'Deal',
                'Transaction',
                [
                    26 => 'Сделка создана',
                    27 => 'Сделка без следующего действия',
                    28 => 'Следующее действие просрочено',
                    29 => 'Сделка зависла на этапе',
                    30 => 'Сделка долго без комментариев',
                    31 => 'Сделка долго без касаний',
                    32 => 'Сделка переведена назад по этапу',
                    33 => 'Сделка перешла в горячую стадию',
                    34 => 'Сделка близка к дедлайну',
                    35 => 'Сделка потеряна',
                    36 => 'Не указана причина потери',
                    37 => 'Сделка возобновлена после потери',
                    38 => 'Сделка дублируется',
                    39 => 'Много касаний без прогресса',
                    40 => 'Много объектов просмотрено без выбора',
                    41 => 'Показ был, но нет решения',
                    42 => 'Отправлено предложение, но нет реакции',
                    43 => 'Договор отправлен, но не подписан',
                    44 => 'Аванс обещан, но не получен',
                    45 => 'Бронь оформлена, но срок истекает',
                    46 => 'Высокая вероятность срыва',
                    47 => 'Сделка близка к закрытию',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'high',
                    'default_action' => 'Открыть сделку и зафиксировать следующее действие',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 48,
                    'dedupe_scope' => 'entity',
                ],
                [
                    26 => ['source_event' => 'created', 'trigger_type' => 'entity_created', 'activation_ready' => true, 'attention_state' => 'need_action'],
                    32 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true],
                    33 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    35 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'priority' => 'critical'],
                    36 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'need_action'],
                    37 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    47 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                ]
            ))
            ->merge($this->buildFamily(
                'showings',
                'Showing',
                'PropertyShowing',
                [
                    48 => 'Показ назначен',
                    49 => 'Показ скоро',
                    50 => 'Показ не подтверждён',
                    51 => 'Показ подтверждён',
                    52 => 'Показ перенесён',
                    53 => 'Показ отменён клиентом',
                    54 => 'Показ отменён агентом',
                    55 => 'Клиент не пришёл на показ',
                    56 => 'Агент не зафиксировал результат показа',
                    57 => 'Нет follow-up после показа',
                    58 => 'После показа не отправлены материалы',
                    59 => 'После показа клиент проявил интерес',
                    60 => 'После показа клиент высказал возражение',
                    61 => 'Нужен повторный показ',
                    62 => 'Показов слишком много без перехода к брони',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'high',
                    'default_action' => 'Подтвердить или закрыть показ и зафиксировать результат',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 24,
                    'dedupe_scope' => 'entity',
                ],
                [
                    48 => ['source_event' => 'created', 'trigger_type' => 'entity_created', 'activation_ready' => true],
                    51 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true],
                    52 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true],
                    53 => ['source_event' => 'cancelled', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'priority' => 'critical'],
                    54 => ['source_event' => 'cancelled', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'priority' => 'critical'],
                    55 => ['source_event' => 'completed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'risk'],
                    59 => ['source_event' => 'completed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    60 => ['source_event' => 'completed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'risk'],
                    61 => ['source_event' => 'completed', 'trigger_type' => 'status_changed', 'activation_ready' => true],
                ]
            ))
            ->merge($this->buildFamily(
                'properties',
                'Property',
                'Property',
                [
                    63 => 'Объект добавлен',
                    64 => 'Объект опубликован',
                    65 => 'Объект снят с публикации',
                    66 => 'Объект снят с продажи/аренды',
                    67 => 'Объект забронирован',
                    68 => 'Объект продан/сдан',
                    69 => 'Объект снова активен',
                    70 => 'Объект недоступен, но есть активные клиенты',
                    71 => 'Цена объекта выросла',
                    72 => 'Цена объекта снизилась',
                    73 => 'Появилась скидка/акция',
                    74 => 'Изменились ипотечные условия',
                    75 => 'Изменилась рассрочка',
                    76 => 'Изменился размер комиссии',
                    77 => 'Появились специальные условия от застройщика',
                    78 => 'Остались последние лоты',
                    79 => 'Появился дефицит по типу объекта',
                    80 => 'Объект много смотрят, но не покупают',
                    81 => 'Объект долго без показов',
                    82 => 'Объект долго без заявок',
                    83 => 'Резко вырос интерес к объекту',
                    84 => 'Появился похожий объект под активный запрос клиента',
                    85 => 'Объект не соответствует обновлённым критериям клиента',
                    86 => 'У объекта не хватает данных/фото/документов',
                    87 => 'Объект требует перепроверки актуальности',
                    88 => 'Объект давно не обновлялся',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'high',
                    'default_action' => 'Проверить статус объекта и связанные клиентские сценарии',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 72,
                    'dedupe_scope' => 'entity',
                ],
                [
                    63 => ['source_event' => 'created', 'trigger_type' => 'entity_created', 'activation_ready' => true, 'attention_state' => 'need_action'],
                    64 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    66 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'priority' => 'critical'],
                    68 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true],
                    69 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    71 => ['source_event' => 'price_changed', 'trigger_type' => 'field_changed', 'activation_ready' => true],
                    72 => ['source_event' => 'price_changed', 'trigger_type' => 'field_changed', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                ]
            ))
            ->merge($this->buildFamily(
                'recommendations',
                'Selection',
                'Buyer',
                [
                    89 => 'Подборка не отправлена после запроса',
                    90 => 'Подборка отправлена',
                    91 => 'Клиент просмотрел подборку',
                    92 => 'Клиент не открыл подборку',
                    93 => 'Клиент открыл несколько объектов',
                    94 => 'Клиент выделил фаворита',
                    95 => 'Подборка устарела',
                    96 => 'Появились новые объекты под сохранённый запрос',
                    97 => 'Подборка не обновлялась X дней',
                    98 => 'В подборке слишком мало релевантных объектов',
                    99 => 'В подборке слишком много отказов клиента',
                    100 => 'Клиенту нужна новая подборка по изменённым условиям',
                ],
                [
                    'attention_state' => 'opportunity',
                    'priority' => 'medium',
                    'default_action' => 'Обновить подборку и отправить клиенту следующий пакет объектов',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager'],
                    'ttl_hours' => 48,
                    'dedupe_scope' => 'subject',
                ],
                [
                    95 => ['activation_ready' => true, 'source_event' => 'updated'],
                    100 => ['activation_ready' => true, 'source_event' => 'updated', 'attention_state' => 'need_action'],
                ]
            ))
            ->merge($this->buildFamily(
                'documents',
                'Document',
                'Transaction',
                [
                    101 => 'Не загружены обязательные документы',
                    102 => 'Документы загружены, но не проверены',
                    103 => 'Документы проверены',
                    104 => 'В документах ошибка',
                    105 => 'Данные клиента расходятся',
                    106 => 'Не хватает согласия/подписи',
                    107 => 'Договор не сформирован',
                    108 => 'Договор отправлен',
                    109 => 'Договор не открыт',
                    110 => 'Договор открыт, но не подписан',
                    111 => 'Договор подписан',
                    112 => 'Истекает срок документа',
                    113 => 'Истекает одобрение ипотеки',
                    114 => 'Истекает бронь',
                    115 => 'Истекает срок оплаты',
                    116 => 'Нет акта/счёта/приложения',
                    117 => 'Сделка готова к юридической проверке',
                    118 => 'Сделка заблокирована из-за документов',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'high',
                    'default_action' => 'Открыть сделку и закрыть документарный блокер',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 48,
                    'dedupe_scope' => 'entity',
                ],
                [
                    101 => ['source_event' => 'updated', 'activation_ready' => true],
                    104 => ['source_event' => 'updated', 'activation_ready' => true, 'priority' => 'critical'],
                    110 => ['source_event' => 'updated', 'activation_ready' => true],
                    111 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    118 => ['source_event' => 'updated', 'activation_ready' => true, 'priority' => 'critical'],
                ]
            ))
            ->merge($this->buildFamily(
                'finance',
                'Mortgage',
                'Transaction',
                [
                    119 => 'Клиенту нужна ипотека',
                    120 => 'Ипотека не начата',
                    121 => 'Ипотечная заявка подана',
                    122 => 'Ипотека предварительно одобрена',
                    123 => 'Ипотека одобрена',
                    124 => 'Ипотека отклонена',
                    125 => 'Истекает ипотечное одобрение',
                    126 => 'Изменились ипотечные ставки',
                    127 => 'Появилась выгодная программа под клиента',
                    128 => 'Финансовая модель клиента не подтверждена',
                    129 => 'Недостаточный первоначальный взнос',
                    130 => 'Клиент готов к брони по финансам',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'high',
                    'default_action' => 'Проверить финансовый сценарий и следующий шаг по ипотеке',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 72,
                    'dedupe_scope' => 'subject',
                ],
                [
                    123 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                    124 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'risk', 'priority' => 'critical'],
                    130 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                ]
            ))
            ->merge($this->buildFamily(
                'tasks',
                'Task',
                'Agent',
                [
                    131 => 'Задача создана',
                    132 => 'Задача без срока',
                    133 => 'Задача на сегодня',
                    134 => 'Задача просрочена',
                    135 => 'Задача критически просрочена',
                    136 => 'Нет задач на завтра',
                    137 => 'Слишком много просроченных задач',
                    138 => 'После звонка нет комментария',
                    139 => 'После встречи нет отчёта',
                    140 => 'После изменения стадии нет объяснения',
                    141 => 'Есть незакрытые старые задачи по активному клиенту',
                    142 => 'Есть дублирующие задачи',
                    143 => 'Задача выполнена без результата',
                    144 => 'Менеджер давно не логировал активность',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'medium',
                    'default_action' => 'Открыть рабочий контур менеджера и закрыть дисциплинарный gap',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 24,
                    'dedupe_scope' => 'family',
                ]
            ))
            ->merge($this->buildFamily(
                'communications',
                'Communication',
                'Communication',
                [
                    145 => 'Пропущенный звонок',
                    146 => 'Входящее сообщение без ответа',
                    147 => 'Не отправлено обещанное КП/подборка',
                    148 => 'Не отправлено напоминание о показе',
                    149 => 'Не отправлен follow-up после звонка',
                    150 => 'Не отправлен follow-up после встречи',
                    151 => 'Письмо не доставлено',
                    152 => 'Сообщение не прочитано',
                    153 => 'Клиент читает, но не отвечает',
                    154 => 'Негативный тон коммуникации',
                    155 => 'Клиент задаёт повторный вопрос',
                    156 => 'Клиент просит срочную обратную связь',
                    157 => 'Есть риск потери из-за долгого ответа',
                    158 => 'Коммуникация слишком редкая для стадии сделки',
                    159 => 'Коммуникация слишком частая и безрезультатная',
                    160 => 'Нужно сменить канал общения',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'high',
                    'default_action' => 'Выбрать следующий контакт и зафиксировать ответ клиенту',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 24,
                    'dedupe_scope' => 'entity',
                ],
                [
                    145 => ['source_event' => 'message_received', 'trigger_type' => 'entity_updated', 'activation_ready' => true, 'priority' => 'critical', 'attention_state' => 'urgent'],
                    146 => ['source_event' => 'message_received', 'trigger_type' => 'entity_updated', 'activation_ready' => true, 'priority' => 'critical'],
                    151 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'risk'],
                    153 => ['source_event' => 'response_needed', 'trigger_type' => 'entity_updated', 'activation_ready' => true, 'attention_state' => 'risk'],
                    156 => ['source_event' => 'message_received', 'trigger_type' => 'entity_updated', 'activation_ready' => true, 'attention_state' => 'urgent', 'priority' => 'critical'],
                    160 => ['source_event' => 'updated', 'activation_ready' => true],
                ]
            ))
            ->merge($this->buildFamily(
                'owners',
                'Owner',
                'Property',
                [
                    161 => 'Собственник долго не обновлял статус объекта',
                    162 => 'Собственник изменил цену',
                    163 => 'Собственник изменил условия',
                    164 => 'Собственник не подтвердил показ',
                    165 => 'Собственник не отвечает',
                    166 => 'Есть конфликт по условиям сделки',
                    167 => 'Застройщик обновил прайс',
                    168 => 'Застройщик изменил акцию',
                    169 => 'Застройщик ограничил доступность',
                    170 => 'Застройщик дал спецусловия под менеджера/клиента',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'high',
                    'default_action' => 'Проверить объект и синхронизировать условия с клиентом',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales'],
                    'ttl_hours' => 48,
                    'dedupe_scope' => 'entity',
                ],
                [
                    162 => ['source_event' => 'price_changed', 'trigger_type' => 'field_changed', 'activation_ready' => true],
                    163 => ['source_event' => 'updated', 'activation_ready' => true],
                    169 => ['source_event' => 'status_changed', 'trigger_type' => 'status_changed', 'activation_ready' => true, 'priority' => 'critical'],
                    170 => ['source_event' => 'updated', 'activation_ready' => true, 'attention_state' => 'opportunity'],
                ]
            ))
            ->merge($this->buildFamily(
                'data_quality',
                'DataQuality',
                null,
                [
                    171 => 'Карточка клиента заполнена неполно',
                    172 => 'Нет обязательного поля',
                    173 => 'Поле заполнено некорректно',
                    174 => 'Обнаружен дубль клиента',
                    175 => 'Обнаружен дубль объекта',
                    176 => 'Нет источника лида',
                    177 => 'Нет причины отказа',
                    178 => 'Нет тега интереса',
                    179 => 'Нет даты следующего действия',
                    180 => 'Нет результата контакта',
                    181 => 'Неверный номер телефона/email',
                    182 => 'Несвязанные сущности',
                ],
                [
                    'attention_state' => 'need_action',
                    'priority' => 'medium',
                    'default_action' => 'Исправить данные и восстановить управляемость CRM-карточки',
                    'owner_role' => 'manager',
                    'visibility_roles' => ['manager', 'head_of_sales', 'crm_admin'],
                    'ttl_hours' => 168,
                    'dedupe_scope' => 'family',
                ],
                [
                    171 => ['runtime_entity_type' => 'Buyer', 'source_event' => 'updated', 'activation_ready' => true],
                    174 => ['runtime_entity_type' => 'Buyer', 'source_event' => 'updated', 'activation_ready' => true],
                    175 => ['runtime_entity_type' => 'Property', 'source_event' => 'updated', 'activation_ready' => true],
                    181 => ['runtime_entity_type' => 'Buyer', 'source_event' => 'updated', 'activation_ready' => true],
                ]
            ))
            ->merge($this->buildFamily(
                'manager_efficiency',
                'Manager',
                'Agent',
                [
                    183 => 'Нет новых лидов в работе',
                    184 => 'Слишком много новых лидов без обработки',
                    185 => 'Низкая скорость первого ответа',
                    186 => 'Низкая конверсия лид → контакт',
                    187 => 'Низкая конверсия контакт → показ',
                    188 => 'Низкая конверсия показ → бронь',
                    189 => 'Низкая конверсия бронь → сделка',
                    190 => 'Высокий процент потерянных лидов',
                    191 => 'Много лидов зависают на одном этапе',
                    192 => 'Слишком мало повторных касаний',
                    193 => 'Слишком много касаний без результата',
                    194 => 'Менеджер не обновляет CRM вовремя',
                    195 => 'Менеджер перегружен',
                    196 => 'Менеджер недогружен',
                    197 => 'Неравномерное распределение лидов',
                    198 => 'Сильное падение эффективности за период',
                    199 => 'Резкий рост эффективности',
                    200 => 'Менеджер игнорирует системные триггеры',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'medium',
                    'default_action' => 'Проверить загрузку менеджера и корректирующие действия по воронке',
                    'owner_role' => 'head_of_sales',
                    'visibility_roles' => ['head_of_sales', 'crm_admin'],
                    'ttl_hours' => 168,
                    'dedupe_scope' => 'family',
                ]
            ))
            ->merge($this->buildFamily(
                'sales_management',
                'SalesManagement',
                'Agent',
                [
                    201 => 'Горячие лиды без обработки',
                    202 => 'Нарушен SLA по команде',
                    203 => 'Перегружен конкретный менеджер',
                    204 => 'Есть слабые менеджеры по конверсии',
                    205 => 'Сделки массово застряли на одном этапе',
                    206 => 'Растёт число потерь по одной причине',
                    207 => 'Проседает источник трафика',
                    208 => 'Определённый источник даёт некачественные лиды',
                    209 => 'Один объект даёт аномально много отказов',
                    210 => 'Есть несбалансированность между объектами и спросом',
                    211 => 'Много просроченных задач по отделу',
                    212 => 'CRM заполняется формально, но неуправляемо',
                    213 => 'Команда теряет деньги из-за несвоевременных действий',
                    214 => 'Нужна перераздача лидов',
                    215 => 'Есть сделки с высоким шансом закрытия в ближайшие дни',
                ],
                [
                    'attention_state' => 'risk',
                    'priority' => 'high',
                    'default_action' => 'Открыть управленческий сценарий и скорректировать командную нагрузку',
                    'owner_role' => 'head_of_sales',
                    'visibility_roles' => ['head_of_sales', 'crm_admin'],
                    'ttl_hours' => 168,
                    'dedupe_scope' => 'family',
                ],
                [
                    201 => ['priority' => 'critical'],
                    213 => ['priority' => 'critical'],
                    215 => ['attention_state' => 'opportunity'],
                ]
            ));

        $definitions->each(function (array $definition): void {
            TriggerDefinition::query()->updateOrCreate(
                ['catalog_number' => $definition['catalog_number']],
                $definition
            );
        });
    }

    private function buildFamily(
        string $family,
        string $sourceEntityType,
        ?string $runtimeEntityType,
        array $titles,
        array $defaults,
        array $overrides = []
    ) {
        $definitions = [];

        foreach ($titles as $catalogNumber => $title) {
            $config = array_merge($defaults, $overrides[$catalogNumber] ?? []);
            $activationReady = (bool) ($config['activation_ready'] ?? false);
            unset($config['activation_ready']);

            $definitions[] = [
                'catalog_number' => $catalogNumber,
                'code' => sprintf('%s_%03d', Str::slug($family, '_'), $catalogNumber),
                'title' => $title,
                'description' => $config['description'] ?? 'Нормализованное правило каталога триггеров CRM.',
                'family' => $family,
                'source_entity_type' => $sourceEntityType,
                'runtime_entity_type' => $config['runtime_entity_type'] ?? $runtimeEntityType,
                'source_event' => $config['source_event'] ?? 'updated',
                'trigger_type' => $config['trigger_type'] ?? 'entity_updated',
                'attention_state' => $config['attention_state'] ?? 'need_action',
                'priority' => $config['priority'] ?? 'medium',
                'default_action' => $config['default_action'] ?? null,
                'owner_role' => $config['owner_role'] ?? 'manager',
                'visibility_roles' => $config['visibility_roles'] ?? ['manager'],
                'resolution_policy' => [
                    'auto_close_on_source_clear' => true,
                    'manual_close_allowed' => true,
                ],
                'ttl_hours' => $config['ttl_hours'] ?? 72,
                'dedupe_scope' => $config['dedupe_scope'] ?? 'entity',
                'condition_summary' => $config['condition_summary'] ?? ('Срабатывает, когда CRM фиксирует состояние: ' . $title),
                'action_summary' => $config['action_summary'] ?? ($config['default_action'] ?? 'Открыть карточку и выполнить следующее действие'),
                'is_mvp' => $this->isMvpTitle($title),
                'is_active' => true,
                'metadata' => [
                    'activation_ready' => $activationReady,
                    'business_family' => $family,
                    'logical_catalog_number' => $catalogNumber,
                ],
            ];
        }

        return $definitions;
    }

    private function isMvpTitle(string $title): bool
    {
        return in_array($title, [
            'Новый лид поступил',
            'Лид не назначен',
            'Лид не обработан в SLA',
            'Лид без квалификации',
            'Клиент перестал отвечать',
            'Клиент позвонил, но звонок пропущен',
            'Клиент повторно интересуется тем же объектом',
            'Показ назначен',
            'Показ не подтверждён',
            'Агент не зафиксировал результат показа',
            'Нет follow-up после показа',
            'Сделка без следующего действия',
            'Сделка зависла на этапе',
            'Договор открыт, но не подписан',
            'Истекает бронь',
            'Не загружены обязательные документы',
            'Истекает одобрение ипотеки',
            'Объект снят с продажи/аренды',
            'Цена объекта снизилась',
            'Появился похожий объект под активный запрос клиента',
            'Не указана причина потери',
            'Обнаружен дубль клиента',
            'Карточка клиента заполнена неполно',
            'Низкая скорость первого ответа',
            'Горячие лиды без обработки',
            'Менеджер перегружен',
            'Подборка не отправлена после запроса',
            'Подборка устарела',
            'Сделка близка к дедлайну',
        ], true);
    }
}