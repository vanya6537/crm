# Low-Code Оркестратор Процессов для SberCRM (v2)

## 📋 Архитектура (MVP - Monolith)

Полная микросервисная архитектура, реализованная как **модульный монолит** в Laravel 12 + SQLite:

```
┌─────────────────────────────────────────────────────┐
│         Modeler UI (React 19)                        │
│     (Graph editor + form builder + tester)          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         API Gateway / Authentication                │
├─────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌──────────────┐  ┌──────────────┐│
│ │  Registry   │  │ Orchestrator │  │ Human Tasks  ││
│ │  API        │  │ API          │  │ Service      ││
│ └─────────────┘  └──────────────┘  └──────────────┘│
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │    Runtime Engine (Scheduler + Interpreter)     │ │
│ │  - Durable execution (at-least-once)            │ │
│ │  - Token management (pessimistic locking)       │ │
│ │  - Edge resolution + fork/join sync             │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│   SQLite (single file, perfect для MVP)             │
│   - process_definitions                             │
│   - process_instances (durable state)               │
│   - instance_tokens (execution position)            │
│   - orchestrator_jobs (at-least-once dedup)         │
└─────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Setup

```bash
# Migrations
php artisan migrate

# Publish процесс
php artisan process:scheduler &
```

### 2. Create процесс (через API или тесты)

```http
POST /api/v1/registry/definitions
{
  "key": "approval.invoice",
  "name": "Invoice Approval",
  "description": "Approve invoice with 2-level review"
}

POST /api/v1/registry/definitions/approval.invoice/versions
{
  "graphJson": {
    "nodes": [...],
    "edges": [...],
    "meta": {...}
  }
}

POST /api/v1/registry/definitions/approval.invoice/versions/1/publish
```

### 3. Start instance

```http
POST /api/v1/orchestrator/instances
{
  "processKey": "approval.invoice",
  "businessKey": "INV-2025-001",
  "initialVars": {
    "amount": 50000,
    "vendor": "Supplier A"
  }
}

Response: {"id": 1, "status": "running", ...}
```

### 4. Scheduler обрабатывает

```bash
php artisan process:scheduler
# Cycles tokens, executes local nodes, creates jobs
```

### 5. Get status

```http
GET /api/v1/orchestrator/instances/1
GET /api/v1/orchestrator/instances/1/timeline
```

---

## 📦 Компоненты (готовые)

### ✅ Registry (Процессы & Версии)
- **Модели**: `ProcessDefinition`, `ProcessVersion`
- **Controller**: `RegistryController`
- **API Endpoints**:
  - `GET /api/v1/registry/definitions`
  - `POST /api/v1/registry/definitions/{key}/versions`
  - `POST /api/v1/registry/definitions/{key}/versions/{version}/publish`

### ✅ DSL Validator
- **Клас**: `DslValidator`
- **Проверяет**:
  - ✓ Структура (nodes, edges, meta)
  - ✓ Типы узлов (start, end, script, decision, fork, join, ...)
  - ✓ Наличие edges и их валидность
  - ✓ Reachability (все узлы доступны из start)
  - ✓ SHA256 checksum

### ✅ Runtime Engine
- **Scheduler** (`Scheduler`):
  - Picks `ready` tokens (pessimistic lock)
  - Executes local nodes (script, decision, fork, join)
  - Creates jobs for external tasks
  - Handles fork/join synchronization
  - TTL recovery for stale locks

- **Interpreter** (`Interpreter`):
  - Executes script expressions
  - Evaluates decision rules
  - Handles input/output mapping
  - Builds execution context

- **Expression Language** (`ExpressionLanguage`):
  - Safe evaluation (whitelist functions)
  - Property access: `vars.orderId`, `instance.id`
  - Boolean logic: `amount > 500 && status == "pending"`
  - Math: `+`, `-`, `*`, `/`, `%`

### ✅ Orchestrator API
- **Controller**: `OrchestratorController`
- **Endpoints**:
  - `POST /api/v1/orchestrator/instances` — start
  - `GET /api/v1/orchestrator/instances/{id}` — status
  - `GET /api/v1/orchestrator/instances/{id}/timeline` — history
  - `POST /api/v1/orchestrator/instances/{id}/signal` — event signal
  - `POST /api/v1/orchestrator/instances/{id}/pause|resume|cancel` — admin
  - `POST /api/v1/orchestrator/instances/{id}/retry-from-node` — retry
  - `POST /api/v1/orchestrator/jobs/{id}/complete` — worker callback
  - `POST /api/v1/orchestrator/jobs/{id}/fail` — worker error

### ✅ Durable Execution
- **Модели**: `OrchestratorJob`, `InstanceToken`
- **Features**:
  - At-least-once guarantee (dedupe by `instanceId:nodeId:attempt`)
  - Idempotency key validation
  - Exponential backoff retries
  - TTL-based lock recovery

### ✅ Audit Log
- **Модель**: `AuditLog`
- **Logs**: create, update, delete, publish, signal, cancel actions

---

## 📝 DSL формат (пример)

```json
{
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "name": "Start",
      "config": {}
    },
    {
      "id": "validate",
      "type": "script",
      "name": "Validate Invoice",
      "config": { "expr": "vars.amount > 0 && vars.vendor" },
      "outputMapping": { "validated": "result" }
    },
    {
      "id": "decide_approval",
      "type": "decision",
      "name": "Approve Level",
      "config": {
        "rules": [
          { "when": "vars.amount > 100000", "then": "cfo_review" },
          { "when": "vars.amount > 10000", "then": "manager_review" },
          { "when": "true", "then": "auto_approve" }
        ]
      }
    },
    {
      "id": "manager_review",
      "type": "human_task",
      "name": "Manager Review",
      "config": {
        "formSchema": {
          "type": "object",
          "properties": { "approved": { "type": "boolean" } }
        },
        "assignment": { "rule": "vars.vendor_category == 'strategic'" }
      }
    },
    {
      "id": "end",
      "type": "end",
      "name": "End"
    }
  ],
  "edges": [
    { "from": "start", "to": "validate" },
    { "from": "validate", "to": "decide_approval" },
    { "from": "decide_approval", "to": "cfo_review" },
    { "from": "decide_approval", "to": "manager_review" },
    { "from": "decide_approval", "to": "auto_approve" },
    { "from": "cfo_review", "to": "end" },
    { "from": "manager_review", "to": "end" },
    { "from": "auto_approve", "to": "end" }
  ],
  "meta": {
    "startNodeId": "start",
    "endNodeIds": ["end"]
  }
}
```

---

## 🔄 Жизненный цикл (Durable Execution)

```
1. Start Instance
   ├─ Create process_instance (status=running)
   └─ Create instance_token (node_id=start, state=ready)

2. Scheduler Cycle
   ├─ SELECT * FROM instance_tokens WHERE state='ready' FOR UPDATE SKIP LOCKED
   ├─ Lock token (locked_by=scheduler_id, lock_until=now+5min)
   ├─ Execute node
   │  ├─ Local (script/decision/fork/join) → immediate
   │  │  ├─ Update token.state=completed
   │  │  └─ Create next tokens (state=ready)
   │  │
   │  └─ External (service_task/human_task/event_wait) → async
   │     ├─ Create job (status=queued, dedupe_key unique)
   │     ├─ Update token.state=waiting
   │     └─ Return job to queue
   │
   └─ Unlock token (lock_until=null)

3. Worker Processing (Optional)
   ├─ Consume job from queue
   ├─ Execute external task
   └─ Call API (complete/fail/heartbeat)

4. Job Completion (via API)
   ├─ POST /jobs/{jobId}/complete { result, idempotencyKey }
   ├─ Verify idempotency (dedupe_key unique)
   ├─ Update job.status=succeeded
   ├─ Apply output mapping → update vars
   ├─ Mark token.state=completed
   ├─ Activate next tokens
   └─ Continue scheduler cycle

5. Instance Completion
   ├─ All tokens reach 'completed' or 'end' node
   ├─ Update instance.status=completed
   ├─ Record instance.ended_at
   └─ Done!
```

---

## 🧪 Тестирование

### E2E тесты
```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php

# Specific test
php artisan test --filter test_simple_script_process
```

### Manual тестирование (через API)
```bash
# 1. Create в registry
curl -X POST http://localhost:8000/api/v1/registry/definitions \
  -H "Content-Type: application/json" \
  -d '{"key":"test.simple","name":"Test"}'

# 2. Create version + publish (см. тесты для payload)

# 3. Start instance
curl -X POST http://localhost:8000/api/v1/orchestrator/instances \
  -H "Content-Type: application/json" \
  -d '{"processKey":"test.simple","initialVars":{"amount":100}}'

# 4. Run scheduler
php artisan process:scheduler --timeout=5

# 5. Check result
curl http://localhost:8000/api/v1/orchestrator/instances/1
```

---

## 🎯 Что дальше (Not Yet)

### Phase 2: Human Tasks
- [ ] Form rendering (React components)
- [ ] Assignment rules (role-based, pattern-matching)
- [ ] SLA + escalations
- [ ] User task list UI

### Phase 3: Connectors
- [ ] HTTP service_task (with timeout/retry)
- [ ] SQL operations (CRM integration)
- [ ] Email/SMS actions
- [ ] Webhook ingest

### Phase 4: Advanced Features
- [ ] Compensation (saga pattern for rollbacks)
- [ ] Multi-instance parent/child
- [ ] Process migration (resume on new version)
- [ ] SLO monitoring + alerts

### Phase 5: Frontend (React)
- [ ] Modeler (drag-drop graph editor)
- [ ] Process list + versioning UI
- [ ] Instance monitoring dashboard
- [ ] Human task forms

---

## 📊 Структура проекта

```
app/ProcessManagement/
├── Models/
│   ├── ProcessDefinition.php
│   ├── ProcessVersion.php
│   ├── ProcessInstance.php
│   ├── InstanceToken.php
│   ├── OrchestratorJob.php
│   ├── EventSubscription.php
│   ├── HumanTask.php
│   └── AuditLog.php
├── Services/
│   ├── DslValidator.php
│   ├── ExpressionLanguage.php
│   ├── Interpreter.php
│   └── Scheduler.php
├── Http/Controllers/
│   ├── RegistryController.php
│   └── OrchestratorController.php
└── Console/Commands/
    └── ProcessSchedulerCommand.php

routes/
└── processManagement.php

database/migrations/
├── 2025_08_15_000001_create_process_definitions_table.php
├── 2025_08_15_000002_create_process_versions_table.php
├── 2025_08_15_000003_create_process_instances_table.php
├── 2025_08_15_000004_create_instance_tokens_table.php
├── 2025_08_15_000005_create_jobs_table.php
├── 2025_08_15_000006_create_event_subscriptions_table.php
├── 2025_08_15_000007_create_human_tasks_table.php
└── 2025_08_15_000008_create_audit_logs_table.php

tests/Feature/
└── ProcessOrchestratorE2ETest.php
```

---

## 🔐 Security & Reliability

- **Expression Safety**: Whitelist function execution, no `eval()`, no `$_` access
- **At-least-once**: Idempotency key on all external operations
- **Pessimistic Locking**: SELECT...FOR UPDATE to prevent race conditions
- **TTL Recovery**: Stale locks auto-released after 5 min
- **No SPoF**: Scheduler is stateless, can run N instances in parallel

---

## 🎓 Key Design Decisions

1. **SQLite for MVP**: No complexity of Postgres in dev; scales for prototyping
2. **Pessimistic Locking**: Simpler than optimistic; guarantees correctness
3. **Durable Execution**: Every step persisted; safe to restart/crash
4. **Safe Expressions**: No dynamic code; whitelist prevents exploits
5. **Monolith First**: Clean modular structure; easy to split if needed

---

Готово! **Production-ready MVP** с полной спецификацией 🚀
