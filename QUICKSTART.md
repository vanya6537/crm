# ⚡ QUICKSTART — Test Low-Code Процесс-Оркестратор

## 1️⃣ Setup (One-time)

```bash
# В корне проекта
cd /Users/netslayer/Herd/crm

# Настроить БД
php artisan migrate --seed

# Убедись что SQLite готов (создается в database/database.sqlite)
ls -la database/database.sqlite
```

## 2️⃣ Test #1: Simple Script Process (3 minutes)

### Run test
```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php::test_simple_script_process
```

**What happens:**
1. Creates ProcessDefinition (key=test.simple)
2. Publishes DSL graph: start → script → end
3. Starts instance with {amount: 100}
4. Scheduler processes it
5. Script evaluates: 100 * 2 = 200
6. Instance completes with result stored

**Expected output:**
```
PASS tests/Feature/ProcessOrchestratorE2ETest::test_simple_script_process
✓ Instance status = completed
✓ Variables contain _scriptResult = 200
```

---

## 3️⃣ Test #2: Decision Branching (3 minutes)

```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php::test_decision_branching
```

**What happens:**
1. Creates decision node with 2 branches:
   - If amount > 500 → "HIGH"
   - If amount ≤ 500 → "LOW"
2. Starts with amount=600
3. Scheduler evaluates condition (600 > 500? YES)
4. Activates branch1
5. Completes with level="HIGH"

**Expected output:**
```
PASS tests/Feature/ProcessOrchestratorE2ETest::test_decision_branching
✓ Decision routed correctly
✓ Variables contain level = "HIGH"
```

---

## 4️⃣ Test #3: Admin Operations (2 minutes)

```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php::test_admin_operations
```

**What happens:**
1. Starts instance
2. Pauses it (status → paused)
3. Resumes it (status → running)
4. Cancels it (status → cancelled)
5. Checks all state transitions work

---

## 5️⃣ Test #4: DSL Validation (1 minute)

```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php::test_dsl_validation
```

**What happens:**
1. Validates correct graphs
2. Rejects invalid graphs (missing nodes, unreachable nodes, etc.)
3. Returns helpful error messages

---

## 6️⃣ Run All Tests

```bash
php artisan test tests/Feature/ProcessOrchestratorE2ETest.php -v
```

**Expected:**
```
tests/Feature/ProcessOrchestratorE2ETest
  - test_simple_script_process ✓
  - test_decision_branching ✓
  - test_admin_operations ✓
  - test_dsl_validation ✓

Pass: 4, Fail: 0
Time: 2.45s
```

---

## 7️⃣ Manual Testing via API

### Terminal 1: Start scheduler (background)
```bash
php artisan process:scheduler --timeout=30 &
```

### Terminal 2: Create & run process

```bash
# 1. Create definition
curl -X POST http://localhost:8000/api/v1/registry/definitions \
  -H "Content-Type: application/json" \
  -d '{
    "key": "invoice.approval",
    "name": "Invoice Approval",
    "description": "Simple 2-level approval"
  }'

# 2. Create version (see PROCESS_ORCHESTRATOR.md for full DSL)
curl -X POST http://localhost:8000/api/v1/registry/definitions/invoice.approval/versions \
  -H "Content-Type: application/json" \
  -d '{
    "graphJson": {
      "nodes": [
        {"id": "start", "type": "start", "name": "Start", "config": {}},
        {"id": "validate", "type": "script", "name": "Validate", "config": {"expr": "true"}},
        {"id": "end", "type": "end", "name": "End", "config": {}}
      ],
      "edges": [
        {"from": "start", "to": "validate"},
        {"from": "validate", "to": "end"}
      ],
      "meta": {"startNodeId": "start", "endNodeIds": ["end"]}
    },
    "variablesSchemaJson": {}
  }'

# 3. Publish version
curl -X POST http://localhost:8000/api/v1/registry/definitions/invoice.approval/versions/1/publish

# 4. Start instance
curl -X POST http://localhost:8000/api/v1/orchestrator/instances \
  -H "Content-Type: application/json" \
  -d '{
    "processKey": "invoice.approval",
    "businessKey": "INV-2025-001",
    "initialVars": {"amount": 50000}
  }'

# Response: {"id": 1, "status": "running", ...}

# 5. Wait for scheduler (or it already processed)

# 6. Check result
curl http://localhost:8000/api/v1/orchestrator/instances/1

# Expected: {"id": 1, "status": "completed", ...}

# 7. Get timeline
curl http://localhost:8000/api/v1/orchestrator/instances/1/timeline
```

---

## 🐛 Troubleshooting

### Issue: "No published version available"
→ You forgot to publish. Run: `POST /definitions/{key}/versions/{version}/publish`

### Issue: "Tests fail with 'tokens must be ready'"
→ Scheduler wasn't run. Either:
- Run in test: `$this->scheduler->cycle()`
- Or run CLI: `php artisan process:scheduler`

### Issue: "SQLite database locked"
→ Multiple processes writing simultaneously
→ Use `--timeout=30` to auto-exit scheduler after 30s
→ Or run scheduler in single process

### Issue: "Expression evaluation failed"
→ Function not in whitelist. See ExpressionLanguage.php for allowed functions
→ Use only: strlen, trim, explode, count, abs, round, etc.

---

## 📊 Database inspection

```bash
# See all tables
php artisan tinker
>>> DB::table('process_definitions')->get();
>>> DB::table('process_instances')->get();
>>> DB::table('instance_tokens')->get();
>>> DB::table('orchestrator_jobs')->get();
```

---

## ✅ What This Proves

- ✓ **Durable Execution**: Process state persisted to DB
- ✓ **Token Management**: Tokens move through states (created → ready → running → completed)
- ✓ **Expression Evaluation**: Variables evaluated safely
- ✓ **Branching**: Decision nodes work correctly
- ✓ **Admin Ops**: pause/resume/cancel implemented
- ✓ **Idempotency**: Same request twice = no duplication

---

## 🎯 Next: Build a Real Process

Once tests pass, define your own:

```json
{
  "key": "approval.workflow",
  "nodes": [
    {"id": "start", "type": "start", ...},
    {"id": "validate", "type": "script", ...},
    {"id": "check_amount", "type": "decision", ...},
    {"id": "low_approval", "type": "script", ...},
    {"id": "high_approval", "type": "human_task", ...},
    {"id": "end", "type": "end", ...}
  ],
  "edges": [...],
  "meta": {
    "startNodeId": "start",
    "endNodeIds": ["end"]
  }
}
```

Then use API to create, publish, and run it!

---

## 📞 Questions?

- See `PROCESS_ORCHESTRATOR.md` for full spec
- See `PROCESS_STATUS.md` for current status  
- Check `tests/Feature/ProcessOrchestratorE2ETest.php` for examples
- Review `app/ProcessManagement/Services/Scheduler.php` for core logic

Happy orchestrating! 🚀
