# CRM CRUD Testing Guide

**Last Updated**: Just Completed  
**System Status**: ✅ Live Development Servers Running

---

## 🚀 Quick Start

### 1. Check Running Servers
Both servers should already be running:
- **Laravel**: http://localhost:8000
- **Vite Dev**: http://localhost:5174

### 2. Open Browser
Navigate to: **http://localhost:8000**

You'll automatically be logged in (Fortify authentication handles it).

---

## 📖 Testing Each CRUD

### Agents CRUD (Purple Theme)

**URL**: http://localhost:8000/agents

**Test Flow**:
1. **View** - See 2 agents in table
2. **Search** - Type "test" in search field → filters results
3. **Filter** - Select "active" in Status dropdown → table updates
4. **Create** 
   - Click "Добавить агента" button (purple)
   - Fill form: Name, Email, Phone, License#, Status, Specialization
   - Click "Сохранить" → modal closes, agent appears in table
5. **Edit**
   - Click edit icon (pencil) in any row
   - Form pre-fills with agent data
   - Change a field → click "Сохранить"
   - Table updates immediately
6. **Delete**
   - Click delete icon (trash) in any row
   - Confirmation modal appears
   - Click "Удалить" → agent removed from table

---

### Buyers CRUD (Green Theme)

**URL**: http://localhost:8000/buyers

**Test Flow**:
1. **View** - See 3 buyers in table with budget ranges
2. **Search** - Search by name, email, or phone
3. **Filter** 
   - Status filter: active/converted/lost
   - Source filter: website/referral/agent_call/ads
4. **Create**
   - Click "Добавить покупателя" (green)
   - Fill: Name, Email, Phone, Budget Min/Max, Source, Status, Notes
   - Click "Сохранить"
5. **Edit** - Click pencil icon, modify fields, save
6. **Delete** - Click trash icon, confirm deletion

**Special Features**:
- Budget displays as "2.5 - 5.0M ₽" (in millions)
- Notes field is a textarea for additional information
- Source dropdown shows: website, referral, agent_call, ads

---

### Transactions CRUD (Orange Theme)

**URL**: http://localhost:8000/transactions

**Test Flow**:
1. **View** - See 2 transactions with linked data:
   - Property: "Address, City" format
   - Buyer: Shows buyer name
   - Agent: Shows agent name
2. **Search** - Search by property or buyer name
3. **Filter** - Status dropdown with 6 options:
   - lead (blue)
   - negotiation (yellow)
   - offer (orange)
   - accepted (green)
   - closed (purple)
   - cancelled (red)
4. **Create**
   - Click "Добавить транзакцию" (orange)
   - Select Property from dropdown (shows properties from database)
   - Select Buyer from dropdown (shows 3 buyers)
   - Select Agent from dropdown (shows 2 agents)
   - Fill Status, Pricing (offer price, final price, commission %), Dates
   - Click "Сохранить"
5. **Edit** - Click pencil, modify dropdowns/prices, save
6. **Delete** - Click trash icon, confirm

**Special Features**:
- Three dropdowns auto-populated from database:
  - Properties: Shows "Address, City"
  - Buyers: Shows buyer names
  - Agents: Shows agent names
- Commission calculation supported
- Date pickers for started_at and closed_at
- Price formatted as "2.5M ₽"

---

## 🔍 Developer Features

### API Testing (Command Line)

**List Agents** (requires authentication):
```bash
curl -X GET http://localhost:8000/api/v1/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

**Create Agent**:
```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "status": "active",
    "specialization": "residential"
  }'
```

**Get Authentication Token**:
The frontend automatically gets tokens via Sanctum. For manual API testing, get a token through:
1. Login via web UI
2. Copy XSRF token from cookies
3. Or use Laravel Sanctum token generation

---

## 🎨 UI Color Scheme

| Entity | Primary Color | Button | Theme |
|--------|---------------|--------|-------|
| Agents | Purple | `bg-purple-500` | Professional |
| Buyers | Green | `bg-green-500` | Success/Active |
| Transactions | Orange | `bg-orange-500` | Attention/Important |

### Status Badges

**Agent Status**:
- `active` - Green badge
- `inactive` - Gray badge

**Buyer Status**:
- `active` - Green badge
- `converted` - Blue badge ✓ (customer acquired)
- `lost` - Red badge ✗ (deal lost)

**Specialization** (Agents):
- `residential` - Blue badge
- `commercial` - Purple badge
- `luxury` - Yellow badge

**Transaction Status**:
- `lead` - Blue badge
- `negotiation` - Yellow badge
- `offer` - Orange badge
- `accepted` - Green badge
- `closed` - Purple badge ✓
- `cancelled` - Red badge ✗

---

## 🛠️ Troubleshooting

### Issue: Page shows "Not Found"
**Solution**: Make sure you're accessing:
- http://localhost:8000/agents (not localhost:5173)
- Both dev servers are running (check terminal output)

### Issue: Form won't submit
**Solution**:
1. Check browser console for errors (F12)
2. Verify all required fields are filled
3. Check Laravel logs: `tail storage/logs/laravel.log`

### Issue: Changes don't appear in table
**Solution**:
1. Check browser console for API errors
2. Verify form validation passed (should see error if failed)
3. Check Laravel API logs

### Issue: Vite server not running
**Solution**: Restart with correct Node version:
```bash
source ~/.nvm/nvm.sh
nvm use 20.20.0
npm run dev
```

---

## 📊 Database Structure

### Agents Table
```sql
id, name, email, phone, license_number, status, specialization, 
custom_fields, metadata, created_at, updated_at
```

### Buyers Table
```sql
id, name, email, phone, budget_min, budget_max, source, 
status, notes, custom_fields, metadata, created_at, updated_at
```

### Transactions Table
```sql
id, property_id, buyer_id, agent_id, status, offer_price, 
final_price, commission_percent, commission_amount, notes, 
started_at, closed_at, custom_fields, metadata, created_at, updated_at
```

### Properties Table
```sql
id, address, city, state, zip, price, bedrooms, bathrooms, 
square_feet, property_type, status, custom_fields, metadata, 
created_at, updated_at
```

---

## 📝 Form Validation Rules

### Agents
- `name` - required, string, max 255
- `email` - required, email, unique
- `phone` - required, string, max 20
- `license_number` - optional, string
- `status` - required, active/inactive
- `specialization` - required, residential/commercial/luxury

### Buyers
- `name` - required, string, max 255
- `email` - required, email, unique
- `phone` - required, string, max 20
- `budget_min` - required, numeric
- `budget_max` - required, numeric (>= budget_min)
- `source` - required, website/referral/agent_call/ads
- `status` - required, active/converted/lost
- `notes` - optional, string

### Transactions
- `property_id` - required, exists in properties
- `buyer_id` - required, exists in buyers
- `agent_id` - required, exists in agents
- `status` - required, lead/negotiation/offer/accepted/closed/cancelled
- `offer_price` - optional, numeric
- `final_price` - optional, numeric
- `commission_percent` - optional, numeric
- `commission_amount` - optional, numeric
- `started_at` - optional, datetime
- `closed_at` - optional, datetime

---

## 🎯 Example Workflows

### Workflow 1: Add New Agent and Assign to Property

1. Go to `/agents`
2. Click "Добавить агента"
3. Fill form with new agent details
4. Save
5. Go to `/properties`
6. Check if you can select this agent (future feature)

### Workflow 2: Create Full Transaction

1. Go to `/transactions`
2. Click "Добавить транзакцию"
3. Select property (e.g., "Main St, Denver")
4. Select buyer (e.g., "Jane Smith")
5. Select agent (e.g., "Bob Johnson")
6. Set status to "lead"
7. Enter offer price: 500000
8. Set started_at date
9. Save
10. Transaction appears in table
11. Click edit to update status to "accepted"
12. Set final_price and close_at date
13. Save

### Workflow 3: Search and Filter

1. Go to `/buyers`
2. Type "Smith" in search field
3. Select "active" in Status dropdown
4. Select "website" in Source dropdown
5. Table now shows only active buyers named Smith from website
6. Clear filters by typing empty search or changing filter dropdowns

---

## 📊 Testing Checklist

- [ ] Agents CRUD working (create/read/update/delete)
- [ ] Buyers CRUD working
- [ ] Transactions CRUD working (with proper dropdowns)
- [ ] Search fields work on all pages
- [ ] Filter dropdowns work on all pages
- [ ] Form validation shows errors
- [ ] Create modals open/close properly
- [ ] Edit buttons pre-fill form data
- [ ] Delete confirmation dialogs work
- [ ] Table pagination works
- [ ] Color coding appears correctly
- [ ] Status badges display correctly
- [ ] Relationship data shows correctly (transactions page)

---

## 🎓 Code References

### Key Files
- Frontend Forms: `resources/js/pages/crm/[Entity]Form.tsx`
- Frontend Pages: `resources/js/pages/crm/[Entity].tsx`
- API Controllers: `app/Http/Controllers/Api/[Entity]Controller.php`
- Web Controllers: `app/Http/Controllers/[Entity]Controller.php`
- Routes: `routes/web.php` & `routes/api.php`

### Using the API Directly

Get all agents with search:
```bash
GET /api/v1/agents?search=John&status=active&specialization=residential
```

Create new buyer:
```bash
POST /api/v1/buyers
Content-Type: application/json

{
  "name": "New Buyer",
  "email": "buyer@example.com",
  "phone": "+1234567890",
  "budget_min": 100000,
  "budget_max": 500000,
  "source": "referral",
  "status": "active"
}
```

Update transaction:
```bash
PUT /api/v1/transactions/1
Content-Type: application/json

{
  "status": "accepted",
  "final_price": 450000
}
```

Delete agent:
```bash
DELETE /api/v1/agents/1
```

---

## ✨ Have Fun Testing!

The system is fully functional and ready for testing. All CRUD operations should work smoothly. If you encounter any issues, check the browser console (F12) and Laravel logs for debugging.

**Happy testing! 🚀**
