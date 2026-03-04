<?php

namespace Database\Seeders;

use App\Models\ModelField;
use Illuminate\Database\Seeder;

class ModelFieldSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing fields
        ModelField::truncate();

        // Agent fields
        $agentFields = [
            [
                'entity_type' => 'agent',
                'name' => 'description',
                'label' => 'Description',
                'field_type' => 'textarea',
                'sort_order' => 1,
                'required' => false,
            ],
            [
                'entity_type' => 'agent',
                'name' => 'phone_mobile',
                'label' => 'Mobile Phone',
                'field_type' => 'phone',
                'sort_order' => 2,
                'required' => false,
            ],
            [
                'entity_type' => 'agent',
                'name' => 'email_work',
                'label' => 'Work Email',
                'field_type' => 'email',
                'sort_order' => 3,
                'required' => false,
            ],
            [
                'entity_type' => 'agent',
                'name' => 'specialization',
                'label' => 'Specialization',
                'field_type' => 'select',
                'sort_order' => 4,
                'required' => false,
                'options' => [
                    ['label' => 'Residential', 'value' => 'residential'],
                    ['label' => 'Commercial', 'value' => 'commercial'],
                    ['label' => 'Industrial', 'value' => 'industrial'],
                ],
            ],
        ];

        // Property fields
        $propertyFields = [
            [
                'entity_type' => 'property',
                'name' => 'property_type',
                'label' => 'Property Type',
                'field_type' => 'select',
                'sort_order' => 1,
                'required' => true,
                'options' => [
                    ['label' => 'Apartment', 'value' => 'apartment'],
                    ['label' => 'House', 'value' => 'house'],
                    ['label' => 'Office', 'value' => 'office'],
                    ['label' => 'Commercial', 'value' => 'commercial'],
                ],
            ],
            [
                'entity_type' => 'property',
                'name' => 'square_meters',
                'label' => 'Area (m²)',
                'field_type' => 'decimal',
                'sort_order' => 2,
                'required' => false,
                'validation' => ['min' => 1],
            ],
            [
                'entity_type' => 'property',
                'name' => 'floor_number',
                'label' => 'Floor Number',
                'field_type' => 'integer',
                'sort_order' => 3,
                'required' => false,
            ],
            [
                'entity_type' => 'property',
                'name' => 'total_floors',
                'label' => 'Total Floors',
                'field_type' => 'integer',
                'sort_order' => 4,
                'required' => false,
            ],
            [
                'entity_type' => 'property',
                'name' => 'year_built',
                'label' => 'Year Built',
                'field_type' => 'integer',
                'sort_order' => 5,
                'required' => false,
            ],
        ];

        // Buyer fields
        $buyerFields = [
            [
                'entity_type' => 'buyer',
                'name' => 'occupation',
                'label' => 'Occupation',
                'field_type' => 'text',
                'sort_order' => 1,
                'required' => false,
            ],
            [
                'entity_type' => 'buyer',
                'name' => 'nationality',
                'label' => 'Nationality',
                'field_type' => 'select',
                'sort_order' => 2,
                'required' => false,
                'options' => [
                    ['label' => 'Russian', 'value' => 'russian'],
                    ['label' => 'Other', 'value' => 'other'],
                ],
            ],
            [
                'entity_type' => 'buyer',
                'name' => 'preapproved',
                'label' => 'Pre-approved',
                'field_type' => 'checkbox',
                'sort_order' => 3,
                'required' => false,
            ],
        ];

        // Transaction fields
        $transactionFields = [
            [
                'entity_type' => 'transaction',
                'name' => 'commission_rate',
                'label' => 'Commission Rate (%)',
                'field_type' => 'decimal',
                'sort_order' => 1,
                'required' => false,
                'validation' => ['min' => 0, 'max' => 100],
            ],
            [
                'entity_type' => 'transaction',
                'name' => 'expected_closing_date',
                'label' => 'Expected Closing Date',
                'field_type' => 'date',
                'sort_order' => 2,
                'required' => false,
            ],
        ];

        // Create all fields
        foreach ($agentFields as $field) {
            ModelField::create($field);
        }

        foreach ($propertyFields as $field) {
            ModelField::create($field);
        }

        foreach ($buyerFields as $field) {
            ModelField::create($field);
        }

        foreach ($transactionFields as $field) {
            ModelField::create($field);
        }
    }
}
