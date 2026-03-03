<?php

return [
    /**
     * Процесс 1: Продажа недвижимости (Property Sale Flow)
     * lead → qualification → showing → negotiation → offer → close
     */
    'property_sale_flow' => [
        'key' => 'property.sale',
        'name' => 'Property Sale Flow',
        'description' => 'Complete workflow from lead to closed deal',
        'graph' => [
            'nodes' => [
                [
                    'id' => 'start',
                    'type' => 'start',
                    'name' => 'Sale Started',
                    'config' => [],
                ],
                [
                    'id' => 'qualify_buyer',
                    'type' => 'human_task',
                    'name' => 'Qualify Buyer',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'budget_confirmed' => ['type' => 'boolean'],
                                'financing_arranged' => ['type' => 'boolean'],
                                'motivation_level' => ['type' => 'string', 'enum' => ['high', 'medium', 'low']],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                        'dueMs' => 86400000, // 24 hours
                    ],
                    'outputMapping' => [
                        'qualified' => 'result.budget_confirmed',
                        'financing_ok' => 'result.financing_arranged',
                    ],
                ],
                [
                    'id' => 'check_qualification',
                    'type' => 'decision',
                    'name' => 'Buyer Qualified?',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.qualified && vars.financing_ok', 'then' => 'schedule_showing'],
                            ['when' => 'true', 'then' => 'disqualify'],
                        ],
                    ],
                ],
                [
                    'id' => 'schedule_showing',
                    'type' => 'human_task',
                    'name' => 'Schedule Property Showing',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'showing_date' => ['type' => 'string', 'format' => 'date-time'],
                                'notes' => ['type' => 'string'],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                    ],
                    'outputMapping' => [
                        'showing_scheduled' => 'true',
                    ],
                ],
                [
                    'id' => 'conduct_showing',
                    'type' => 'service_task',
                    'name' => 'Conduct Property Showing',
                    'config' => [
                        'connector' => 'internal_crm',
                        'request' => ['action' => 'create_showing', 'propertyId' => 'vars.property_id'],
                    ],
                ],
                [
                    'id' => 'evaluate_interest',
                    'type' => 'human_task',
                    'name' => 'Evaluate Buyer Interest',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'buyer_interested' => ['type' => 'boolean'],
                                'feedback' => ['type' => 'string'],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                    ],
                    'outputMapping' => [
                        'interested' => 'result.buyer_interested',
                    ],
                ],
                [
                    'id' => 'check_interest',
                    'type' => 'decision',
                    'name' => 'Buyer Interested?',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.interested', 'then' => 'prepare_offer'],
                            ['when' => 'true', 'then' => 'lose_lead'],
                        ],
                    ],
                ],
                [
                    'id' => 'prepare_offer',
                    'type' => 'human_task',
                    'name' => 'Prepare & Submit Offer',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'offer_price' => ['type' => 'number'],
                                'offer_terms' => ['type' => 'string'],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                    ],
                    'outputMapping' => [
                        'offer_price' => 'result.offer_price',
                    ],
                ],
                [
                    'id' => 'calculate_commission',
                    'type' => 'script',
                    'name' => 'Calculate Commission',
                    'config' => [
                        'expr' => 'vars.offer_price * vars.commission_percent / 100',
                    ],
                    'outputMapping' => [
                        'commission' => 'result',
                    ],
                ],
                [
                    'id' => 'negotiate',
                    'type' => 'human_task',
                    'name' => 'Negotiate Terms',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'offer_accepted' => ['type' => 'boolean'],
                                'counter_offer' => ['type' => 'number'],
                                'final_price' => ['type' => 'number'],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                        'dueMs' => 604800000, // 7 days
                    ],
                    'outputMapping' => [
                        'accepted' => 'result.offer_accepted',
                        'final_price' => 'result.final_price',
                    ],
                ],
                [
                    'id' => 'check_offer',
                    'type' => 'decision',
                    'name' => 'Offer Accepted?',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.accepted', 'then' => 'prepare_closing'],
                            ['when' => 'true', 'then' => 'lose_lead'],
                        ],
                    ],
                ],
                [
                    'id' => 'prepare_closing',
                    'type' => 'service_task',
                    'name' => 'Prepare Closing Documents',
                    'config' => [
                        'connector' => 'document_service',
                        'request' => [
                            'action' => 'generate_closing_docs',
                            'transactionId' => 'vars.transaction_id',
                            'finalPrice' => 'vars.final_price',
                        ],
                    ],
                ],
                [
                    'id' => 'finalize_deal',
                    'type' => 'human_task',
                    'name' => 'Finalize Deal',
                    'config' => [
                        'formSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'close_date' => ['type' => 'string', 'format' => 'date'],
                                'signed' => ['type' => 'boolean'],
                            ],
                        ],
                        'assignment' => ['agentId' => 'vars.agent_id'],
                    ],
                    'outputMapping' => [
                        'deal_closed' => 'result.signed',
                    ],
                ],
                [
                    'id' => 'disqualify',
                    'type' => 'script',
                    'name' => 'Mark as Lost',
                    'config' => ['expr' => '"lost"'],
                ],
                [
                    'id' => 'lose_lead',
                    'type' => 'script',
                    'name' => 'Mark as Lost',
                    'config' => ['expr' => '"lost"'],
                ],
                [
                    'id' => 'close_success',
                    'type' => 'script',
                    'name' => 'Mark as Closed',
                    'config' => ['expr' => '"closed"'],
                ],
                [
                    'id' => 'end_success',
                    'type' => 'end',
                    'name' => 'Deal Closed',
                ],
                [
                    'id' => 'end_lost',
                    'type' => 'end',
                    'name' => 'Lead Lost',
                ],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'qualify_buyer'],
                ['from' => 'qualify_buyer', 'to' => 'check_qualification'],
                ['from' => 'check_qualification', 'to' => 'schedule_showing'],
                ['from' => 'check_qualification', 'to' => 'disqualify'],
                ['from' => 'disqualify', 'to' => 'end_lost'],
                ['from' => 'schedule_showing', 'to' => 'conduct_showing'],
                ['from' => 'conduct_showing', 'to' => 'evaluate_interest'],
                ['from' => 'evaluate_interest', 'to' => 'check_interest'],
                ['from' => 'check_interest', 'to' => 'prepare_offer'],
                ['from' => 'check_interest', 'to' => 'lose_lead'],
                ['from' => 'lose_lead', 'to' => 'end_lost'],
                ['from' => 'prepare_offer', 'to' => 'calculate_commission'],
                ['from' => 'calculate_commission', 'to' => 'negotiate'],
                ['from' => 'negotiate', 'to' => 'check_offer'],
                ['from' => 'check_offer', 'to' => 'prepare_closing'],
                ['from' => 'check_offer', 'to' => 'lose_lead'],
                ['from' => 'prepare_closing', 'to' => 'finalize_deal'],
                ['from' => 'finalize_deal', 'to' => 'close_success'],
                ['from' => 'close_success', 'to' => 'end_success'],
            ],
            'meta' => [
                'startNodeId' => 'start',
                'endNodeIds' => ['end_success', 'end_lost'],
            ],
        ],
    ],

    /**
     * Процесс 2: Lead Qualification (быстрый процесс)
     */
    'lead_qualification' => [
        'key' => 'lead.qualify',
        'name' => 'Lead Qualification',
        'description' => 'Quick buyer qualification process',
        'graph' => [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start'],
                [
                    'id' => 'validate_budget',
                    'type' => 'script',
                    'name' => 'Check Budget Match',
                    'config' => [
                        'expr' => 'vars.buyer_budget_max >= vars.property_price * 0.9',
                    ],
                    'outputMapping' => ['budget_ok' => 'result'],
                ],
                [
                    'id' => 'check_budget',
                    'type' => 'decision',
                    'name' => 'Budget Suitable?',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.budget_ok', 'then' => 'qualified'],
                            ['when' => 'true', 'then' => 'not_qualified'],
                        ],
                    ],
                ],
                [
                    'id' => 'qualified',
                    'type' => 'script',
                    'name' => 'Mark Qualified',
                    'config' => ['expr' => '"qualified"'],
                    'outputMapping' => ['status' => 'result'],
                ],
                [
                    'id' => 'not_qualified',
                    'type' => 'script',
                    'name' => 'Mark Not Qualified',
                    'config' => ['expr' => '"not_qualified"'],
                    'outputMapping' => ['status' => 'result'],
                ],
                ['id' => 'end', 'type' => 'end', 'name' => 'Done'],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'validate_budget'],
                ['from' => 'validate_budget', 'to' => 'check_budget'],
                ['from' => 'check_budget', 'to' => 'qualified'],
                ['from' => 'check_budget', 'to' => 'not_qualified'],
                ['from' => 'qualified', 'to' => 'end'],
                ['from' => 'not_qualified', 'to' => 'end'],
            ],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ],
    ],

    /**
     * Процесс 3: Send Follow-up Email (service task example)
     */
    'follow_up_email' => [
        'key' => 'communication.followup',
        'name' => 'Send Follow-up Communication',
        'description' => 'Send email or SMS to buyer/seller',
        'graph' => [
            'nodes' => [
                ['id' => 'start', 'type' => 'start', 'name' => 'Start'],
                [
                    'id' => 'decide_channel',
                    'type' => 'decision',
                    'name' => 'Email or SMS?',
                    'config' => [
                        'rules' => [
                            ['when' => 'vars.channel == "email"', 'then' => 'send_email'],
                            ['when' => 'vars.channel == "sms"', 'then' => 'send_sms'],
                        ],
                    ],
                ],
                [
                    'id' => 'send_email',
                    'type' => 'service_task',
                    'name' => 'Send Email',
                    'config' => [
                        'connector' => 'mail_service',
                        'request' => [
                            'to' => 'vars.recipient_email',
                            'template' => 'vars.template_name',
                            'data' => 'vars.template_data',
                        ],
                    ],
                ],
                [
                    'id' => 'send_sms',
                    'type' => 'service_task',
                    'name' => 'Send SMS',
                    'config' => [
                        'connector' => 'sms_service',
                        'request' => [
                            'phone' => 'vars.recipient_phone',
                            'message' => 'vars.sms_text',
                        ],
                    ],
                ],
                [
                    'id' => 'log_communication',
                    'type' => 'script',
                    'name' => 'Log to CRM',
                    'config' => ['expr' => '"logged"'],
                ],
                ['id' => 'end', 'type' => 'end', 'name' => 'Sent'],
            ],
            'edges' => [
                ['from' => 'start', 'to' => 'decide_channel'],
                ['from' => 'decide_channel', 'to' => 'send_email'],
                ['from' => 'decide_channel', 'to' => 'send_sms'],
                ['from' => 'send_email', 'to' => 'log_communication'],
                ['from' => 'send_sms', 'to' => 'log_communication'],
                ['from' => 'log_communication', 'to' => 'end'],
            ],
            'meta' => ['startNodeId' => 'start', 'endNodeIds' => ['end']],
        ],
    ],
];
