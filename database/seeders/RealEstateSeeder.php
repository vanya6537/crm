<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Property;
use App\Models\Buyer;
use App\Models\Transaction;
use App\Models\PropertyShowing;
use App\Models\Communication;
use Illuminate\Database\Seeder;

class RealEstateSeeder extends Seeder
{
    public function run(): void
    {
        // Create agents
        $agents = [];
        $agents[] = Agent::create([
            'name' => 'Иван Петров',
            'email' => 'ivan.petrov@realestate.ru',
            'phone' => '+7 (900) 123-45-67',
            'license_number' => 'REA-2024-001',
            'status' => 'active',
            'specialization' => 'residential',
            'custom_fields' => [
                'years_experience' => 10,
                'languages' => ['ru', 'en'],
                'certifications' => ['local'],
                'rating' => 4.8,
            ],
            'metadata' => [
                'properties_sold' => 47,
                'avg_transaction_value' => 17500000,
            ],
        ]);
        $agents[] = Agent::create([
            'name' => 'Мария Сидорова',
            'email' => 'maria.sidorova@realestate.ru',
            'phone' => '+7 (911) 234-56-78',
            'license_number' => 'REA-2024-002',
            'status' => 'active',
            'specialization' => 'luxury',
            'custom_fields' => [
                'years_experience' => 15,
                'languages' => ['ru', 'en', 'fr'],
                'certifications' => ['Re/MAX', 'local'],
                'rating' => 4.9,
            ],
            'metadata' => [
                'properties_sold' => 63,
                'avg_transaction_value' => 28500000,
            ],
        ]);

        // Create properties
        $properties = [];
        $properties[] = Property::create([
            'agent_id' => $agents[0]->id,
            'address' => 'ул. Невский проспект, 45',
            'city' => 'Санкт-Петербург',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 15000000,
            'area' => 85.5,
            'rooms' => 3,
            'description' => 'Современная квартира в исторической части города',
            'features_json' => [
                'parking' => true,
                'balcony' => true,
                'elevator' => true,
                'security' => true,
            ],
            'custom_fields' => [
                'energy_class' => 'B',
                'floor_number' => 5,
                'total_floors' => 9,
                'year_built' => 2015,
            ],
            'amenities' => [
                'gym' => false,
                'pool' => false,
                'security' => true,
                'parking' => true,
            ],
            'inspection_reports' => [
                [
                    'date' => '2025-06-15',
                    'status' => 'passed',
                    'inspector' => 'Иван Степанов',
                    'notes' => 'Все в порядке',
                ]
            ],
        ]);
        $properties[] = Property::create([
            'agent_id' => $agents[1]->id,
            'address' => 'ул. Невский проспект, 100',
            'city' => 'Санкт-Петербург',
            'type' => 'apartment',
            'status' => 'available',
            'price' => 25000000,
            'area' => 120.0,
            'rooms' => 4,
            'description' => 'Люкс апартамент с панорамным видом на Неву',
            'features_json' => [
                'parking' => true,
                'balcony' => true,
                'elevator' => true,
                'security' => true,
                'concierge' => true,
            ],
            'custom_fields' => [
                'energy_class' => 'A',
                'floor_number' => 12,
                'total_floors' => 15,
                'year_built' => 2020,
            ],
            'amenities' => [
                'gym' => true,
                'pool' => true,
                'security' => true,
                'parking' => true,
                'concierge' => true,
                'spa' => true,
            ],
        ]);
        $properties[] = Property::create([
            'agent_id' => $agents[0]->id,
            'address' => 'ул. Мира, 123',
            'city' => 'Москва',
            'type' => 'house',
            'status' => 'available',
            'price' => 45000000,
            'area' => 250.0,
            'rooms' => 5,
            'description' => 'Коттедж в пригороде Москвы',
            'features_json' => [
                'garage' => true,
                'garden' => true,
                'security' => true,
            ],
            'custom_fields' => [
                'energy_class' => 'C',
                'garage_spaces' => 3,
                'has_garden' => true,
            ],
        ]);
        $properties[] = Property::create([
            'agent_id' => $agents[1]->id,
            'address' => 'ул. Красная, 50-52',
            'city' => 'Москва',
            'type' => 'commercial',
            'status' => 'available',
            'price' => 75000000,
            'area' => 500.0,
            'description' => 'Коммерческое помещение класса А',
            'features_json' => [
                'parking' => true,
                'security' => true,
                'climate_control' => true,
            ],
            'custom_fields' => [
                'energy_class' => 'A',
                'zoning' => 'commercial',
            ],
        ]);

        // Create buyers
        $buyers = [];
        $buyers[] = Buyer::create([
            'name' => 'Алексей Морозов',
            'email' => 'alex.morozov@example.com',
            'phone' => '+7 (921) 345-67-89',
            'budget_min' => 10000000,
            'budget_max' => 20000000,
            'source' => 'website',
            'status' => 'active',
            'preferences_json' => [
                'type' => 'apartment',
                'city' => 'Санкт-Петербург',
                'rooms' => 3,
            ],
            'custom_fields' => [
                'occupation' => 'Софт-инженер',
                'investor_type' => 'first_time',
            ],
            'financing_info' => [
                'financing_approved' => true,
                'amount' => 12000000,
                'bank' => 'Сбербанк',
            ],
        ]);
        $buyers[] = Buyer::create([
            'name' => 'Елена Волкова',
            'email' => 'elena.volkova@example.com',
            'phone' => '+7 (921) 456-78-90',
            'budget_min' => 20000000,
            'budget_max' => 30000000,
            'source' => 'referral',
            'status' => 'active',
            'preferences_json' => [
                'type' => 'apartment',
                'city' => 'Санкт-Петербург',
                'luxury' => true,
            ],
            'custom_fields' => [
                'occupation' => 'Врач',
                'urgency_level' => 'high',
            ],
            'financing_info' => [
                'financing_approved' => true,
                'amount' => 20000000,
                'bank' => 'ВТБ',
            ],
        ]);
        $buyers[] = Buyer::create([
            'name' => 'Павел Иванов',
            'email' => 'pavel.ivanov@example.com',
            'phone' => '+7 (921) 567-89-01',
            'budget_min' => 40000000,
            'budget_max' => 60000000,
            'source' => 'agent_call',
            'status' => 'active',
            'preferences_json' => [
                'type' => 'house',
                'city' => 'Москва',
            ],
            'custom_fields' => [
                'occupation' => 'Бизнесмен',
                'investor_type' => 'investor',
            ],
            'financing_info' => [
                'financing_approved' => false,
                'expected_amount' => 30000000,
                'down_payment' => 25000000,
            ],
        ]);

        // Create sample transactions
        $trans1 = Transaction::create([
            'property_id' => $properties[0]->id,
            'buyer_id' => $buyers[0]->id,
            'agent_id' => $agents[0]->id,
            'status' => 'lead',
            'offer_price' => 14500000,
            'started_at' => now(),
            'custom_fields' => [
                'contingencies' => ['financing', 'inspection'],
            ],
            'timeline' => [[
                'milestone' => 'lead_created',
                'date' => now()->format('Y-m-d H:i:s'),
                'actor' => 'system',
            ]],
        ]);

        Transaction::create([
            'property_id' => $properties[1]->id,
            'buyer_id' => $buyers[1]->id,
            'agent_id' => $agents[1]->id,
            'status' => 'negotiation',
            'offer_price' => 24000000,
            'started_at' => now()->subDays(5),
            'custom_fields' => [
                'contingencies' => ['financing', 'inspection', 'appraisal'],
            ],
            'timeline' => [[
                'milestone' => 'lead_created',
                'date' => now()->subDays(5)->format('Y-m-d H:i:s'),
                'actor' => 'system',
            ]],
        ]);

        // Create property showings
        PropertyShowing::create([
            'property_id' => $properties[0]->id,
            'buyer_id' => $buyers[0]->id,
            'agent_id' => $agents[0]->id,
            'scheduled_at' => now()->addDays(3),
            'status' => 'scheduled',
            'feedback' => [
                'interest_level' => 'high',
            ],
        ]);

        PropertyShowing::create([
            'property_id' => $properties[1]->id,
            'buyer_id' => $buyers[1]->id,
            'agent_id' => $agents[1]->id,
            'scheduled_at' => now()->subDays(1),
            'completed_at' => now()->subDays(1),
            'status' => 'completed',
            'rating' => 5,
            'feedback' => [
                'interest_level' => 'very_high',
            ],
        ]);

        // Create communications
        Communication::create([
            'transaction_id' => $trans1->id,
            'type' => 'email',
            'direction' => 'outbound',
            'subject' => 'Предложение по квартире',
            'body' => 'Информация по квартире...',
            'status' => 'sent',
        ]);
    }
}
