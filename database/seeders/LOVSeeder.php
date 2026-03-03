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
        // Должности в компании
        $positions = ListOfValues::create([
            'name' => 'Должности',
            'key' => 'positions',
            'description' => 'Должности сотрудников',
            'is_system' => true,
            'sort_order' => 1,
        ]);

        $positionValues = [
            ['label' => 'Директор', 'value' => 'director', 'sort_order' => 1],
            ['label' => 'Менеджер по продажам', 'value' => 'sales_manager', 'sort_order' => 2],
            ['label' => 'Риелтор', 'value' => 'realtor', 'sort_order' => 3],
            ['label' => 'Агент по недвижимости', 'value' => 'real_estate_agent', 'sort_order' => 4],
            ['label' => 'Юрист', 'value' => 'lawyer', 'sort_order' => 5],
            ['label' => 'Бухгалтер', 'value' => 'accountant', 'sort_order' => 6],
            ['label' => 'Администратор', 'value' => 'administrator', 'sort_order' => 7],
            ['label' => 'Помощник', 'value' => 'assistant', 'sort_order' => 8],
        ];

        foreach ($positionValues as $item) {
            $positions->items()->create($item);
        }

        // Статусы сделок
        $dealStatuses = ListOfValues::create([
            'name' => 'Статусы сделок',
            'key' => 'deal_statuses',
            'description' => 'Статусы реальных сделок с недвижимостью',
            'is_system' => true,
            'sort_order' => 2,
        ]);

        $dealStatusValues = [
            ['label' => 'Лид', 'value' => 'lead', 'sort_order' => 1],
            ['label' => 'Просмотр', 'value' => 'showing', 'sort_order' => 2],
            ['label' => 'Переговоры', 'value' => 'negotiation', 'sort_order' => 3],
            ['label' => 'Оферта', 'value' => 'offer', 'sort_order' => 4],
            ['label' => 'Контракт подписан', 'value' => 'contract_signed', 'sort_order' => 5],
            ['label' => 'Завершено', 'value' => 'completed', 'sort_order' => 6],
            ['label' => 'Отменено', 'value' => 'cancelled', 'sort_order' => 7],
        ];

        foreach ($dealStatusValues as $item) {
            $dealStatuses->items()->create($item);
        }

        // Типы объектов недвижимости
        $propertyTypes = ListOfValues::create([
            'name' => 'Типы объектов',
            'key' => 'property_types',
            'description' => 'Типы объектов недвижимости',
            'is_system' => true,
            'sort_order' => 3,
        ]);

        $propertyTypeValues = [
            ['label' => 'Квартира', 'value' => 'apartment', 'sort_order' => 1],
            ['label' => 'Дом', 'value' => 'house', 'sort_order' => 2],
            ['label' => 'Коттедж', 'value' => 'cottage', 'sort_order' => 3],
            ['label' => 'Земельный участок', 'value' => 'land', 'sort_order' => 4],
            ['label' => 'Коммерческое помещение', 'value' => 'commercial', 'sort_order' => 5],
            ['label' => 'Офис', 'value' => 'office', 'sort_order' => 6],
            ['label' => 'Склад', 'value' => 'warehouse', 'sort_order' => 7],
            ['label' => 'Производство', 'value' => 'production', 'sort_order' => 8],
            ['label' => 'Гостиница', 'value' => 'hotel', 'sort_order' => 9],
        ];

        foreach ($propertyTypeValues as $item) {
            $propertyTypes->items()->create($item);
        }

        // Источники клиентов
        $clientSources = ListOfValues::create([
            'name' => 'Источники клиентов',
            'key' => 'client_sources',
            'description' => 'Источники поступления клиентов',
            'is_system' => true,
            'sort_order' => 4,
        ]);

        $clientSourceValues = [
            ['label' => 'Веб-сайт', 'value' => 'website', 'sort_order' => 1],
            ['label' => 'Рефераль', 'value' => 'referral', 'sort_order' => 2],
            ['label' => 'Звонок от агента', 'value' => 'agent_call', 'sort_order' => 3],
            ['label' => 'Реклама', 'value' => 'advertising', 'sort_order' => 4],
            ['label' => 'Социальные сети', 'value' => 'social_media', 'sort_order' => 5],
            ['label' => 'Email кампания', 'value' => 'email_campaign', 'sort_order' => 6],
            ['label' => 'Выставка', 'value' => 'event', 'sort_order' => 7],
            ['label' => 'Прямое обращение', 'value' => 'direct_appeal', 'sort_order' => 8],
        ];

        foreach ($clientSourceValues as $item) {
            $clientSources->items()->create($item);
        }

        // Уровни срочности
        $urgencyLevels = ListOfValues::create([
            'name' => 'Уровень срочности',
            'key' => 'urgency_levels',
            'description' => 'Уровни срочности в сделках',
            'is_system' => true,
            'sort_order' => 5,
        ]);

        $urgencyLevelValues = [
            ['label' => 'Низкая', 'value' => 'low', 'sort_order' => 1],
            ['label' => 'Средняя', 'value' => 'medium', 'sort_order' => 2],
            ['label' => 'Высокая', 'value' => 'high', 'sort_order' => 3],
            ['label' => 'Срочная', 'value' => 'urgent', 'sort_order' => 4],
        ];

        foreach ($urgencyLevelValues as $item) {
            $urgencyLevels->items()->create($item);
        }

        // Уровни интереса
        $interestLevels = ListOfValues::create([
            'name' => 'Уровень интереса',
            'key' => 'interest_levels',
            'description' => 'Уровни интереса клиента к объекту',
            'is_system' => true,
            'sort_order' => 6,
        ]);

        $interestLevelValues = [
            ['label' => 'Низкий', 'value' => 'low', 'sort_order' => 1],
            ['label' => 'Средний', 'value' => 'medium', 'sort_order' => 2],
            ['label' => 'Высокий', 'value' => 'high', 'sort_order' => 3],
            ['label' => 'Очень высокий', 'value' => 'very_high', 'sort_order' => 4],
        ];

        foreach ($interestLevelValues as $item) {
            $interestLevels->items()->create($item);
        }

        // Типы специализации агентов
        $specializations = ListOfValues::create([
            'name' => 'Специализация агента',
            'key' => 'agent_specializations',
            'description' => 'Специализация агента по недвижимости',
            'is_system' => true,
            'sort_order' => 7,
        ]);

        $specializationValues = [
            ['label' => 'Жилая недвижимость', 'value' => 'residential', 'sort_order' => 1],
            ['label' => 'Люкс сегмент', 'value' => 'luxury', 'sort_order' => 2],
            ['label' => 'Коммерческая', 'value' => 'commercial', 'sort_order' => 3],
            ['label' => 'Инвестиции', 'value' => 'investment', 'sort_order' => 4],
            ['label' => 'Земельные участки', 'value' => 'land', 'sort_order' => 5],
        ];

        foreach ($specializationValues as $item) {
            $specializations->items()->create($item);
        }
    }
}

