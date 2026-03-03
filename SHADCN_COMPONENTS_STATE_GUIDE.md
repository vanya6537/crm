# Shadcn State Management & Components Documentation

## 📋 Table of Contents
1. [Core State Management](#core-state-management)
2. [Installed Components](#installed-components)
3. [Component Architecture](#component-architecture)
4. [Usage Patterns](#usage-patterns)

---

## Core State Management

### 1. **useControlledState** Hook
**Location:** `hooks/use-controlled-state.tsx`

**Purpose:** Manages controlled vs uncontrolled component states

**Linked Components:**
- Dialog
- Accordion
- Alert Dialog
- Checkbox
- Dropdown Menu
- Hover Card
- Popover
- Radio Group
- Sheet
- Switch
- Tabs
- Toggle
- Tooltip

**Pattern:**
```typescript
const [state, setState] = useControlledState({
  defaultValue: initialValue,
  value: controlledValue,
  onChange: onChangeCallback,
})
```

**Use Cases:**
- Form inputs (Checkbox, Radio Group, Switch)
- Modal/Dialog visibility states
- Accordion expanded sections
- Tab selection

---

### 2. **get-strict-context** Utility
**Location:** `lib/get-strict-context.tsx`

**Purpose:** Type-safe context creation with strict null checking

**Linked Components:**
- All dialog/modal components (Dialog, Alert Dialog, Sheet)
- Menu components (Dropdown Menu)
- Popover
- Tooltip
- Tabs

**Pattern:**
```typescript
const [Provider, useContext] = getStrictContext(
  'ComponentNameContext',
  initialValue
)
```

**Benefits:**
- Prevents undefined context errors
- Type safety at compile time
- Better error messages at runtime

---

### 3. **useDataState** Hook
**Location:** `hooks/use-data-state.tsx`

**Purpose:** Enhanced state management with data transformation

**Linked Components:**
- Dropdown Menu (for menu item states)

**Pattern:**
```typescript
const [data, setData] = useDataState(initialData)
```

---

### 4. **useAutoHeight** Hook
**Location:** `hooks/use-auto-height.tsx`

**Purpose:** Dynamic height calculations for animated components

**Linked Components:**
- Tabs (for smooth tab content transitions)
- Accordion (for smooth expand/collapse)

**Pattern:**
```typescript
const ref = useRef<HTMLDivElement>(null)
const height = useAutoHeight(ref, dependencies)
```

---

### 5. **useMobile** Hook
**Location:** `resources/js/hooks/use-mobile.ts`

**Purpose:** Responsive design - detect mobile viewport

**Linked Components:**
- Sidebar (adapts layout on mobile)
- Sheet (drawer on mobile)

**Pattern:**
```typescript
const isMobile = useMobile()
```

---

## Installed Components

### 🎨 Dialog Components

#### 1. **Dialog** (Modal Dialog)
**Files:**
- `resources/js/components/primitives/radix/dialog.tsx` - Low-level primitives
- `resources/js/components/radix/dialog.tsx` - High-level component
- `hooks/use-controlled-state.tsx` - State management
- `lib/get-strict-context.tsx` - Context management

**State Management:**
```typescript
// Provider exports
<Dialog.Provider value={{ open, setOpen }}>
  <Dialog.Trigger onClick={() => setOpen(true)} />
  <Dialog.Content>
    <Dialog.Header>
    <Dialog.Title />
    <Dialog.Close onClick={() => setOpen(false)} />
    <Dialog.Body />
  </Dialog.Content>
</Dialog.Provider>
```

**Key Functions:**
- `Dialog.Provider` - Manages dialog open/close state
- `Dialog.Trigger` - Opens dialog
- `Dialog.Close` - Closes dialog
- `Dialog.useDialog()` - Hook to access dialog context

**Use Cases:**
- Создание справочников
- Редактирование LOV
- Подтверждение действий

---

#### 2. **Alert Dialog**
**Files:**
- `resources/js/components/primitives/radix/alert-dialog.tsx`
- `resources/js/components/radix/alert-dialog.tsx`
- `resources/js/components/buttons/button.tsx` - For action buttons
- `resources/js/components/primitives/animate/slot.tsx` - Animation wrapper

**State Management:**
```typescript
<AlertDialog.Provider value={{ open, setOpen }}>
  <AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
    <AlertDialog.Title>
    <AlertDialog.Description>
    <AlertDialog.Footer>
      <AlertDialog.Cancel />
      <AlertDialog.Action />
  </AlertDialog.Content>
</AlertDialog.Provider>
```

**Key Functions:**
- `AlertDialog.Action` - Confirm/destructive action
- `AlertDialog.Cancel` - Cancel action
- `AlertDialog.useAlertDialog()` - Access context

**Use Cases:**
- Удаление справочника (confirm delete)
- Критические подтверждения
- Необратимые действия

---

### 📊 Form Components

#### 3. **Checkbox**
**Files:**
- `resources/js/components/primitives/radix/checkbox.tsx`
- `resources/js/components/radix/checkbox.tsx`
- `hooks/use-controlled-state.tsx`

**State Management:**
```typescript
const [checked, setChecked] = useControlledState({
  defaultValue: false,
  value: controlledChecked,
  onChange: onCheckChange,
})

<Checkbox 
  checked={checked}
  onCheckedChange={setChecked}
>
```

**Key Functions:**
- `onCheckedChange` - Callback when checked state changes
- `checked` - Current state (boolean | 'indeterminate')

**Use Cases:**
- Выбор элементов в таблице
- Фильтры (Enable/Disable trigger)
- Согласие с условиями

---

#### 4. **Radio Group**
**Files:**
- `resources/js/components/primitives/radix/radio-group.tsx`
- `resources/js/components/radix/radio-group.tsx`
- `hooks/use-controlled-state.tsx`

**State Management:**
```typescript
const [value, setValue] = useControlledState({
  defaultValue: 'all',
  value: selectedValue,
  onChange: (newVal) => {}, // Only one item selected
})

<RadioGroup value={value} onValueChange={setValue}>
  <Radio value="option1" />
  <Radio value="option2" />
</RadioGroup>
```

**Key Functions:**
- `onValueChange` - Single selection callback
- `value` - Currently selected value

**Use Cases:**
- Фильтры (все/системные/пользовательские)
- Выбор типа триггера
- Выбор категории процесса

---

#### 5. **Switch** (Toggle)
**Files:**
- `resources/js/components/primitives/radix/switch.tsx`
- `resources/js/components/radix/switch.tsx`
- `hooks/use-controlled-state.tsx`

**State Management:**
```typescript
const [enabled, setEnabled] = useControlledState({
  defaultValue: true,
  value: controlledEnabled,
  onChange: onToggle,
})

<Switch 
  checked={enabled}
  onCheckedChange={setEnabled}
/>
```

**Key Functions:**
- `onCheckedChange` - Toggle callback
- `checked` - Current state

**Use Cases:**
- Включение/отключение триггеров
- Активация процессов
- Включение уведомлений

---

#### 6. **Toggle**
**Files:**
- `resources/js/components/primitives/radix/toggle.tsx`
- `resources/js/components/radix/toggle.tsx`
- `hooks/use-controlled-state.tsx`

**State Management:**
```typescript
const [pressed, setPressed] = useControlledState({
  defaultValue: false,
  value: controlledPressed,
  onChange: onPressChange,
})

<Toggle pressed={pressed} onPressedChange={setPressed}>
  Bold
</Toggle>
```

**Key Functions:**
- `onPressedChange` - State change callback
- `pressed` - Current state
- `variant` - Style variant (default, outline, ghost)
- `size` - Button size

**Use Cases:**
- Кнопка Play/Pause для процесса
- Sticky toolbar buttons
- Format toggle buttons

---

### 🗂️ Container Components

#### 7. **Accordion**
**Files:**
- `resources/js/components/primitives/radix/accordion.tsx`
- `resources/js/components/radix/accordion.tsx`
- `hooks/use-controlled-state.tsx`
- `hooks/use-auto-height.tsx` - For smooth animations

**State Management:**
```typescript
const [expandedItems, setExpandedItems] = useControlledState({
  defaultValue: ['item1'],
  value: controlledItems,
  onChange: onExpandChange,
})

<Accordion type="single" collapsible value={expandedItems} onValueChange={setExpandedItems}>
  <Accordion.Item value="item1">
    <Accordion.Trigger>Title</Accordion.Trigger>
    <Accordion.Content>Content</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

**Key Functions:**
- `onValueChange` - When accordion items expand/collapse
- `type` - 'single' (one open) or 'multiple' (many open)
- `collapsible` - Allow all items to be collapsed

**Use Cases:**
- FAQ раздел с Help
- Группировка этапов процесса
- Развёртывание деталей сделки

---

#### 8. **Tabs**
**Files:**
- `resources/js/components/primitives/radix/tabs.tsx`
- `resources/js/components/radix/tabs.tsx`
- `hooks/use-controlled-state.tsx`
- `hooks/use-auto-height.tsx` - For smooth content transitions

**State Management:**
```typescript
const [activeTab, setActiveTab] = useControlledState({
  defaultValue: 'tab1',
  value: selectedTab,
  onChange: onTabChange,
})

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content</Tabs.Content>
</Tabs>
```

**Key Functions:**
- `onValueChange` - When selected tab changes
- `value` - Currently selected tab
- `orientation` - 'horizontal' or 'vertical'

**Use Cases:**
- Фильтры (All/System/Custom) - уже используется в ListOfValues
- Вкладки процесса (Основное/Этапы/Статистика)
- Разделы в Справочниках

---

### 📍 Overlay Components

#### 9. **Popover**
**Files:**
- `resources/js/components/primitives/radix/popover.tsx`
- `resources/js/components/radix/popover.tsx`
- `hooks/use-controlled-state.tsx`
- `lib/get-strict-context.tsx`

**State Management:**
```typescript
const [open, setOpen] = useControlledState({
  defaultValue: false,
  value: isOpen,
  onChange: onOpenChange,
})

<Popover.Provider value={{ open, setOpen }}>
  <Popover.Trigger>Click</Popover.Trigger>
  <Popover.Content>
    Content
  </Popover.Content>
</Popover.Provider>
```

**Key Functions:**
- `Popover.Trigger` - Opens popover
- `Popover.Content` - Popover content with arrow
- `onOpenChange` - When opened/closed

**Use Cases:**
- Выбор даты/времени для показа
- Дополнительная информация при hover
- Меню действий с позиционированием

---

#### 10. **Hover Card**
**Files:**
- `resources/js/components/primitives/radix/hover-card.tsx`
- `resources/js/components/radix/hover-card.tsx`
- `hooks/use-controlled-state.tsx`

**State Management:**
```typescript
<HoverCard.Provider>
  <HoverCard.Trigger>Hover me</HoverCard.Trigger>
  <HoverCard.Content>
    Preview content
  </HoverCard.Content>
</HoverCard.Provider>
```

**Key Functions:**
- Auto-opens on hover
- Auto-closes when mouse leaves
- No click needed

**Use Cases:**
- Превью деталей лида
- Информация агента при hover
- Быстрая информация о сделке

---

#### 11. **Sheet** (Drawer)
**Files:**
- `resources/js/components/primitives/radix/sheet.tsx`
- `resources/js/components/radix/sheet.tsx`
- `hooks/use-controlled-state.tsx`
- `hooks/use-mobile.ts` - Responsive behavior

**State Management:**
```typescript
const [open, setOpen] = useControlledState({
  defaultValue: false,
  value: isOpen,
  onChange: onOpenChange,
})

<Sheet.Provider value={{ open, setOpen }}>
  <Sheet.Trigger>Open Drawer</Sheet.Trigger>
  <Sheet.Content side="right"> {/* top, right, bottom, left */}
    <Sheet.Header>
    <Sheet.Close />
  </Sheet.Content>
</Sheet.Provider>
```

**Key Functions:**
- `side` - Direction of drawer slide
- Responsive - fullscreen on mobile, sidebar on desktop
- `Sheet.useSheet()` - Access sheet context

**Use Cases:**
- Редактирование триггера (drawer вместо modal)
- Создание процесса на mobile
- Быстрый фильтр на мобильнике

---

#### 12. **Tooltip**
**Files:**
- `resources/js/components/primitives/radix/tooltip.tsx`
- `resources/js/components/radix/tooltip.tsx`
- `hooks/use-controlled-state.tsx`
- `lib/get-strict-context.tsx`

**State Management:**
```typescript
const [open, setOpen] = useControlledState({
  defaultValue: false,
  value: isOpen,
  onChange: onOpenChange,
})

<Tooltip.Provider>
  <Tooltip.Root open={open} onOpenChange={setOpen} delayDuration={200}>
    <Tooltip.Trigger>Hover me</Tooltip.Trigger>
    <Tooltip.Content>Help text</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
```

**Key Functions:**
- `delayDuration` - Delay before showing (ms)
- `side` - Position (top, right, bottom, left)
- `Tooltip.Provider` - Performance wrapper

**Use Cases:**
- Иконка помощи рядом с полями
- Описание триггера на hover
- Подсказки агенту

---

#### 13. **Dropdown Menu**
**Files:**
- `resources/js/components/primitives/radix/dropdown-menu.tsx`
- `resources/js/components/radix/dropdown-menu.tsx`
- `hooks/use-data-state.tsx` - For menu items
- `resources/js/components/primitives/effects/highlight.tsx` - For hover highlight

**State Management:**
```typescript
const [data, setData] = useDataState(menuItems)

<DropdownMenu.Provider>
  <DropdownMenu.Trigger>Menu</DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item onClick={(val) => {}}>
    <DropdownMenu.CheckboxItem>
    <DropdownMenu.RadioItem>
    <DropdownMenu.Separator />
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger />
      <DropdownMenu.SubContent />
    </DropdownMenu.Sub>
  </DropdownMenu.Content>
</DropdownMenu.Provider>
```

**Key Functions:**
- `DropdownMenu.Item` - Simple menu item
- `DropdownMenu.CheckboxItem` - Checkbox menu item
- `DropdownMenu.RadioItem` - Radio menu item
- `DropdownMenu.Sub` - Submenu support
- `DropdownMenu.Separator` - Visual separator

**Use Cases:**
- Действия над триггером (Edit, Copy, Delete)
- Фильтр по категориям
- Массовые действия в таблице

---

#### 14. **Sidebar**
**Files:**
- `resources/js/components/radix/sidebar.tsx`
- `hooks/use-mobile.ts` - Mobile responsiveness
- Updated: `components/ui/button.tsx`
- Updated: `components/ui/input.tsx`
- Updated: `components/ui/separator.tsx`
- Updated: `components/ui/skeleton.tsx`

**State Management:**
```typescript
const isMobile = useMobile()

<Sidebar.Provider>
  <Sidebar.Root collapsible={isMobile ? 'icon' : 'offcanvas'}>
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Label</Sidebar.GroupLabel>
        <Sidebar.Menu>
          <Sidebar.MenuItem>
            <Sidebar.MenuButton />
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
  </Sidebar.Root>
  <Sidebar.Inset>
    Content area
  </Sidebar.Inset>
</Sidebar.Provider>
```

**Key Functions:**
- Responsive layout with mobile detection
- Collapsible sidebar (icon mode on mobile)
- Already in use in CRMSidebar

---

#### 15. **Progress**
**Files:**
- `resources/js/components/primitives/radix/progress.tsx`
- `resources/js/components/radix/progress.tsx`
- `lib/get-strict-context.tsx`

**State Management:**
```typescript
<Progress.Root value={65} max={100}>
  <Progress.Indicator style={{ width: '65%' }} />
</Progress.Root>
```

**Key Functions:**
- `value` - Current progress (0-100)
- `max` - Maximum value
- Accessible ARIA labels

**Use Cases:**
- Прогресс обработки лидов
- Процент завершения этапа сделки
- Статистика успешности процесса

---

## Component Architecture

### State Flow Pattern

```
┌─────────────────────────────────────────┐
│       Parent Component State             │
│  - [trigger, setTrigger]                │
│  - [activeCategory, setActiveCategory]  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  useControlledState Hook                 │
│  - Manages controlled/uncontrolled      │
│  - Handles defaultValue/value/onChange  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  get-strict-context / Provider          │
│  - Provides state to nested components  │
│  - Type-safe context access            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  UI Components (Trigger/Content)        │
│  - Render based on state                │
│  - Dispatch state changes               │
└─────────────────────────────────────────┘
```

### Animation & Effects

- **Auto Height:** Smooth expand/collapse for Accordion & Tabs
- **Highlight:** Hover effect for Dropdown Menu items
- **Slot:** Animation wrapper primitives
- **Animate UI:** Smooth transitions between states

---

## Usage Patterns

### Pattern 1: Modal Dialog (Create/Edit)
```typescript
const [isOpen, setIsOpen] = useState(false)
const [selectedItem, setSelectedItem] = useState(null)

<Dialog.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
  <Dialog.Trigger onClick={() => {
    setIsOpen(true)
    setSelectedItem(null)
  }}>
    Новый справочник
  </Dialog.Trigger>
  
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        {selectedItem ? 'Редактировать' : 'Создать'} справочник
      </Dialog.Title>
      <Dialog.Close />
    </Dialog.Header>
    <Dialog.Body>
      {/* Form inputs */}
    </Dialog.Body>
    <Dialog.Footer>
      <Button onClick={() => setIsOpen(false)}>
        {selectedItem ? 'Сохранить' : 'Создать'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Provider>
```

### Pattern 2: Tabs with Filters
```typescript
const [activeTab, setActiveTab] = useState('all')
const [searchTerm, setSearchTerm] = useState('')

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <Tabs.List>
    <Tabs.Trigger value="all">Все ({countAll})</Tabs.Trigger>
    <Tabs.Trigger value="system">Системные ({countSystem})</Tabs.Trigger>
    <Tabs.Trigger value="custom">Пользовательские ({countCustom})</Tabs.Trigger>
  </Tabs.List>
  
  <Tabs.Content value="all">
    {filteredItems.map(item => ...)}
  </Tabs.Content>
</Tabs>
```

### Pattern 3: Confirmation Alert
```typescript
const [itemToDelete, setItemToDelete] = useState(null)
const [alertOpen, setAlertOpen] = useState(false)

const handleDelete = (item) => {
  setItemToDelete(item)
  setAlertOpen(true)
}

<AlertDialog.Provider value={{ open: alertOpen, setOpen: setAlertOpen }}>
  <AlertDialog.Trigger />
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Удалить "{itemToDelete?.name}"?</AlertDialog.Title>
      <AlertDialog.Description>
        Это действие нельзя отменить.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Отмена</AlertDialog.Cancel>
      <AlertDialog.Action onClick={() => {
        deleteItem(itemToDelete.id)
        setAlertOpen(false)
      }}>
        Удалить
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Provider>
```

### Pattern 4: Switch Component
```typescript
const [triggers, setTriggers] = useState([...])

const toggleTrigger = (id) => {
  setTriggers(prev =>
    prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t)
  )
}

{triggers.map(trigger => (
  <div key={trigger.id}>
    <Switch
      checked={trigger.enabled}
      onCheckedChange={() => toggleTrigger(trigger.id)}
    />
    {trigger.name}
  </div>
))}
```

### Pattern 5: Responsive Drawer
```typescript
const isMobile = useMobile()
const [isOpen, setIsOpen] = useState(false)

// Use Sheet on mobile, Dialog on desktop
const Component = isMobile ? Sheet : Dialog

<Component.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
  <Component.Trigger>Фильтры</Component.Trigger>
  <Component.Content side="right">
    {/* Filter form */}
  </Component.Content>
</Component.Provider>
```

---

## Key Insights

### State Management Principles
1. **Controlled State** - Parent component controls state
2. **Uncontrolled State** - Component manages its own state
3. **Hybrid** - Use `useControlledState` for both patterns

### Context Pattern
- All complex components (Dialog, Menu, Popover) use context
- Use `get-strict-context` for type safety
- Provider wraps triggers and content

### Performance
- `useAutoHeight` - Only animates when needed
- `useDataState` - Prevents unnecessary re-renders for menu items
- Context provider pattern - Avoids prop drilling

### Responsive Design
- `useMobile()` - True when viewport < 768px
- Sheet adapts from drawer on desktop to fullscreen on mobile
- Sidebar collapses to icon-only mode on mobile

---

## Integration with CRM

### Ready to Use in:
- ✅ ListOfValuesAdvanced.tsx - Dialog + Tabs + DropdownMenu
- ✅ Triggers.tsx - Switch + Tabs + AlertDialog
- ✅ ProcessModeler.tsx - Dialog + Accordion + Progress
- ✅ CRMSidebar.tsx - Already uses sidebar component

### Recommended Next Steps:
1. Replace modal dialogs with Dialog component
2. Use Switch for toggle controls
3. Add Tooltips to help icons
4. Use Popover for date pickers
5. Implement Hover Card for previews

