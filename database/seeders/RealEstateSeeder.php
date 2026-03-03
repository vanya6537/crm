<?php

namespace Database\Seeders;

use App\CRM\Models\Agent;
use App\CRM\Models\Property;
use App\CRM\Models\Buyer;
use App\CRM\Models\Transaction;
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
        ]);
        $agents[] = Agent::create([
            'name' => 'Мария Сидорова',
            'email' => 'maria.sidorova@realestate.ru',
            'phone' => '+7 (911) 234-56-78',
            'license_number' => 'REA-2024-002',
            'status' => 'active',
            'specialization' => 'luxury',
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
            'features_json' => json_encode([
                'parking' => true,
                'balcony' => true,
                'elevator' => true,
                'security' => true,
            ]),
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
            'features_json' => json_encode([
                'parking' => true,
                'balcony' => true,
                'elevator' => true,
                'security' => true,
                'concierge' => true,
            ]),
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
            'features_json' => json_encode([
                'garage' => true,
                'garden' => true,
                'pool' => false,
                'security' => true,
            ]),
        ]);
        $properties[] = Property::create([
            'agent_id' => $agents[1]->id,
            'address' => 'ул. Красная, 50-52',
            'city' => 'Москва',
            'type' => 'commercial',
            'status' => 'available',
            'price' => 75000000,
            'area' => 500.0,
            'description' => 'Коммерческое помещение класса А в центре Москвы',
            'features_json' => json_encode([
                'parking' => true,
                'security' => true,
                'climate_control' => true,
            ]),
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
            'preferences_json' => json_encode([
                'type' => 'apartment',
                'city' => 'Санкт-Петербург',
                'rooms' => 3,
            ]),
        ]);
        $buyers[] = Buyer::create([
            'name' => 'Елена Волкова',
            'email' => 'elena.volkova@example.com',
            'phone' => '+7 (921) 456-78-90',
            'budget_min' => 20000000,
            'budget_max' => 30000000,
            'source' => 'referral',
            'status' => 'active',
            'preferences_json' => json_encode([
                'type' => 'apartment',
                'city' => 'Санкт-Петербург',
                'luxury' => true,
            ]),
        ]);
        $buyers[] = Buyer::create([
            'name' => 'Павел Иванов',
            'email' => 'pavel.ivanov@example.com',
            'phone' => '+7 (921) 567-89-01',
            'budget_min' => 40000000,
            'budget_max' => 60000000,
            'source' => 'agent_call',
            'status' => 'active',
            'preferences_json' => json_encode([
                'type' => 'house',
                'city' => 'Москва',
            ]),
        ]);

        // Create sample transactions
        Transaction::create([
            'property_id' => $properties[0]->id,
            'buyer_id' => $buyers[0]->id,
            'agent_id' => $agents[0]->id,
            'status' => 'lead',
            'offer_price' => 14500000,
            'started_at' => now(),
        ]);
        Transaction::create([
            'property_id' => $properties[1]->id,
            'buyer_id' => $buyers[1]->id,
            'agent_id' => $agents[1]->id,
            'status' => 'negotiation',
            'offer_price' => 24000000,
            'started_at' => now()->subDays(5),
        ]);
    }
}
