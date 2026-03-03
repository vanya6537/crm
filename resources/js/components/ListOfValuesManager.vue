<!-- resources/js/components/ListOfValuesManager.vue -->

<template>
  <div class="lov-manager">
    <div class="lov-header">
      <h2>{{ $t('list_of_values') }}</h2>
      <button @click="showCreateModal = true" class="btn btn-primary">
        {{ $t('add') }} {{ $t('lov') }}
      </button>
    </div>

    <div class="lov-list" v-if="listOfValues.length > 0">
      <table class="lov-table">
        <thead>
          <tr>
            <th>{{ $t('list_name') }}</th>
            <th>{{ $t('list_key') }}</th>
            <th>{{ $t('system') }}</th>
            <th>{{ $t('list_items') }}</th>
            <th>{{ $t('updated') }}</th>
            <th>{{ $t('status') }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lov in listOfValues" :key="lov.id">
            <td>{{ lov.name }}</td>
            <td><code>{{ lov.key }}</code></td>
            <td>{{ lov.is_system ? $t('system') : $t('custom') }}</td>
            <td>{{ lov.items?.length || 0 }}</td>
            <td>{{ formatDate(lov.updated_at) }}</td>
            <td class="status">
              <span v-if="lov.is_system" class="badge badge-info">System</span>
              <span v-else class="badge badge-success">Custom</span>
            </td>
            <td class="actions">
              <button @click="editLOV(lov)" class="btn btn-sm btn-primary">
                {{ $t('edit') }}
              </button>
              <button 
                v-if="!lov.is_system"
                @click="deleteLOV(lov.id)" 
                class="btn btn-sm btn-danger"
              >
                {{ $t('delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="empty-state">
      <p>{{ $t('no_data') }}</p>
    </div>

    <!-- Modal for creating/editing LOV -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditing ? $t('edit') : $t('add') }} {{ $t('lov') }}</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveLOV">
            <div class="form-group">
              <label>{{ $t('list_name') }} <span class="required">*</span></label>
              <input 
                v-model="currentLOV.name" 
                type="text" 
                class="form-control"
                required
              />
            </div>

            <div class="form-group">
              <label>{{ $t('list_key') }} <span class="required">*</span></label>
              <input 
                v-model="currentLOV.key" 
                type="text" 
                class="form-control"
                :disabled="isEditing"
                required
              />
            </div>

            <div class="form-group">
              <label>{{ $t('description') }}</label>
              <textarea 
                v-model="currentLOV.description" 
                class="form-control"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group">
              <h4>{{ $t('list_items') }}</h4>
              <div v-for="(item, index) in currentLOV.items" :key="index" class="item-row">
                <input 
                  v-model="item.label" 
                  type="text" 
                  placeholder="Label"
                  class="form-control"
                  required
                />
                <input 
                  v-model="item.value" 
                  type="text" 
                  placeholder="Value"
                  class="form-control"
                  required
                />
                <input 
                  v-model="item.sort_order" 
                  type="number" 
                  placeholder="Sort"
                  class="form-control"
                />
                <button 
                  type="button"
                  @click="removeItem(index)" 
                  class="btn btn-sm btn-danger"
                  v-if="currentLOV.items.length > 1"
                >
                  {{ $t('delete') }}
                </button>
              </div>
              <button 
                type="button"
                @click="addItem" 
                class="btn btn-sm btn-secondary mt-2"
              >
                + {{ $t('add') }} {{ $t('item_label') }}
              </button>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                {{ $t('save') }}
              </button>
              <button type="button" @click="closeModal" class="btn btn-secondary">
                {{ $t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ListOfValue {
  id?: number
  name: string
  key: string
  description?: string
  is_system?: boolean
  sort_order?: number
  items: Array<{
    id?: number
    label: string
    value: string
    description?: string
    sort_order?: number
    is_active?: boolean
  }>
  updated_at?: string
}

const listOfValues = ref<ListOfValue[]>([])
const showCreateModal = ref(false)
const isEditing = ref(false)

const currentLOV = ref<ListOfValue>({
  name: '',
  key: '',
  description: '',
  items: [{ label: '', value: '', sort_order: 1 }],
})

onMounted(async () => {
  await fetchListOfValues()
})

async function fetchListOfValues() {
  try {
    const response = await fetch('/api/v1/list-of-values', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    })
    if (response.ok) {
      listOfValues.value = await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch list of values:', error)
  }
}

async function saveLOV() {
  try {
    const url = isEditing.value 
      ? `/api/v1/list-of-values/${currentLOV.value.id}`
      : '/api/v1/list-of-values'
    
    const method = isEditing.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(currentLOV.value),
    })

    if (response.ok) {
      await fetchListOfValues()
      closeModal()
    }
  } catch (error) {
    console.error('Failed to save LOV:', error)
  }
}

async function deleteLOV(id: number) {
  if (confirm('Are you sure you want to delete this list?')) {
    try {
      const response = await fetch(`/api/v1/list-of-values/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      })

      if (response.ok) {
        await fetchListOfValues()
      }
    } catch (error) {
      console.error('Failed to delete LOV:', error)
    }
  }
}

function editLOV(lov: ListOfValue) {
  isEditing.value = true
  currentLOV.value = { ...lov }
  showCreateModal.value = true
}

function closeModal() {
  showCreateModal.value = false
  isEditing.value = false
  currentLOV.value = {
    name: '',
    key: '',
    description: '',
    items: [{ label: '', value: '', sort_order: 1 }],
  }
}

function addItem() {
  currentLOV.value.items.push({
    label: '',
    value: '',
    sort_order: (currentLOV.value.items.length || 0) + 1,
  })
}

function removeItem(index: number) {
  currentLOV.value.items.splice(index, 1)
}

function formatDate(date: string | undefined) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ru-RU')
}

function getAuthToken() {
  // Get CSRF token from meta tag or cookie
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  return token || ''
}
</script>

<style scoped>
.lov-manager {
  padding: 20px;
}

.lov-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.lov-header h2 {
  margin: 0;
}

.lov-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.lov-table thead {
  background: #f5f5f5;
  font-weight: 600;
}

.lov-table th {
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

.lov-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.lov-table code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.actions {
  display: flex;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-info {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-success {
  background: #e8f5e9;
  color: #388e3c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.required {
  color: red;
}

.form-control {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
}

.item-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.item-row input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}
</style>
