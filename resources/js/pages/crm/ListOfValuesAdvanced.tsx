import React, { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { Plus, Edit2, Trash2, Eye, Copy, Info, XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CRMLayout from '@/layouts/crm-layout'

interface LOVItem {
  id?: number
  label: string
  value: string
  description?: string
  sort_order?: number
  is_active?: boolean
}

interface ListOfValue {
  id?: number
  name: string
  key: string
  description?: string
  is_system?: boolean
  sort_order?: number
  items: LOVItem[]
  updated_at?: string
}

type TabType = 'all' | 'system' | 'custom'

export default function ListOfValuesAdvancedPage() {
  const [listOfValues, setListOfValues] = useState<ListOfValue[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLOV, setSelectedLOV] = useState<ListOfValue | null>(null)
  const [currentLOV, setCurrentLOV] = useState<ListOfValue>({
    name: '',
    key: '',
    description: '',
    items: [{ label: '', value: '', sort_order: 1 }],
  })

  useEffect(() => {
    fetchListOfValues()
  }, [])

  const fetchListOfValues = async () => {
    try {
      const response = await fetch('/api/v1/list-of-values', {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setListOfValues(data)
      }
    } catch (error) {
      console.error('Failed to fetch LOV:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveLOV = async () => {
    if (!currentLOV.name.trim() || !currentLOV.key.trim()) {
      alert('Заполните название и ключ справочника')
      return
    }

    if (currentLOV.items.some(item => !item.label.trim() || !item.value.trim())) {
      alert('Заполните название и значение для всех элементов')
      return
    }

    try {
      const url = isEditing
        ? `/api/v1/list-of-values/${currentLOV.id}`
        : '/api/v1/list-of-values'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentLOV),
      })

      if (response.ok) {
        await fetchListOfValues()
        setShowModal(false)
        setIsEditing(false)
        setCurrentLOV({
          name: '',
          key: '',
          description: '',
          items: [{ label: '', value: '', sort_order: 1 }],
        })
      } else {
        alert('Ошибка при сохранении справочника')
      }
    } catch (error) {
      console.error('Failed to save LOV:', error)
      alert('Ошибка при сохранении справочника')
    }
  }

  const deleteLOV = async (id: number) => {
    if (!window.confirm('Вы уверены что хотите удалить этот справочник? Это действие нельзя отменить.')) return

    try {
      const response = await fetch(`/api/v1/list-of-values/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchListOfValues()
      }
    } catch (error) {
      console.error('Failed to delete LOV:', error)
    }
  }

  const editLOV = (lov: ListOfValue) => {
    setIsEditing(true)
    setCurrentLOV({ ...lov })
    setShowModal(true)
  }

  const viewLOVDetails = (lov: ListOfValue) => {
    setSelectedLOV(lov)
    setShowDetailsModal(true)
  }

  const addItem = () => {
    setCurrentLOV({
      ...currentLOV,
      items: [...currentLOV.items, { label: '', value: '', sort_order: (currentLOV.items.length || 0) + 1 }],
    })
  }

  const removeItem = (index: number) => {
    if (currentLOV.items.length <= 1) {
      alert('Справочник должен содержать хотя бы один элемент')
      return
    }
    const newItems = currentLOV.items.filter((_, i) => i !== index)
    setCurrentLOV({ ...currentLOV, items: newItems })
  }

  const updateItem = (index: number, field: keyof LOVItem, value: any) => {
    const newItems = [...currentLOV.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setCurrentLOV({ ...currentLOV, items: newItems })
  }

  const getFilteredLOVs = () => {
    let filtered = listOfValues

    if (activeTab === 'system') {
      filtered = filtered.filter(lov => lov.is_system)
    } else if (activeTab === 'custom') {
      filtered = filtered.filter(lov => !lov.is_system)
    }

    if (searchTerm) {
      filtered = filtered.filter(lov =>
        lov.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lov.key.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const filteredLOVs = getFilteredLOVs()

  return (
    <>
      <Head title="Справочники: Списки значений" />
                  <CRMLayout
                      title="Справочники: Списки значений"
                      description="Управление системными и пользовательскими списками значений для использования в сущностях CRM"
                  >
      <div className="p-6 space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">📋 Справочники</h1>
            <p className="text-gray-600 mt-1">Управление системными и пользовательскими списками значений для использования в сущностях CRM</p>
          </div>
          <Button
            onClick={() => {
              setIsEditing(false)
              setCurrentLOV({
                name: '',
                key: '',
                description: '',
                items: [{ label: '', value: '', sort_order: 1 }],
              })
              setShowModal(true)
            }}
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Новый справочник
          </Button>
        </div>

        {/* Инфо блок */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <strong>Справочники</strong> - это списки значений, которые используются для выпадающих списков, фильтров и привязки данных к сущностям (объекты, клиенты, сделки).
            Создавайте собственные справочники для вашего бизнеса или используйте готовые системные справочники.
          </div>
        </div>

        {/* Табы и поиск */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 gap-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('all')}
                variant={activeTab === 'all' ? 'default' : 'secondary'}
              >
                Все ({listOfValues.length})
              </Button>
              <Button
                onClick={() => setActiveTab('system')}
                variant={activeTab === 'system' ? 'default' : 'secondary'}
              >
                Системные ({listOfValues.filter(l => l.is_system).length})
              </Button>
              <Button
                onClick={() => setActiveTab('custom')}
                variant={activeTab === 'custom' ? 'default' : 'secondary'}
              >
                Мои ({listOfValues.filter(l => !l.is_system).length})
              </Button>
            </div>
            <input
              type="text"
              placeholder="Поиск по названию или ключу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm w-80 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Таблица справочников */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-2">Загрузка справочников...</p>
            </div>
          ) : filteredLOVs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Название</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Ключ (API)</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Тип</th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">Элементов</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Описание</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Изменено</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLOVs.map((lov) => (
                    <tr key={lov.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lov.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-gray-100 px-2.5 py-1 rounded text-xs font-mono text-gray-700 border border-gray-200">
                          {lov.key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          lov.is_system
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {lov.is_system ? '🔒 Система' : '✎ Пользовательский'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 font-semibold text-blue-700">
                          {lov.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs max-w-xs truncate">
                        {lov.description || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {lov.updated_at ? new Date(lov.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => viewLOVDetails(lov)}
                            title="Просмотреть элементы"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => editLOV(lov)}
                            title="Редактировать"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!lov.is_system && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => lov.id && deleteLOV(lov.id)}
                              title="Удалить справочник"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Справочники не найдены</p>
            </div>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{listOfValues.length}</div>
            <div className="text-sm text-blue-700 mt-1">Всего справочников</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-900">{listOfValues.filter(l => !l.is_system).length}</div>
            <div className="text-sm text-emerald-700 mt-1">Созданных вами</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="text-3xl font-bold text-purple-900">{listOfValues.reduce((sum, lov) => sum + (lov.items?.length || 0), 0)}</div>
            <div className="text-sm text-purple-700 mt-1">Всего элементов</div>
          </div>
        </div>
      </div>

      {/* Модаль редактирования */}
      <Dialog 
        open={showModal} 
        onOpenChange={(open) => {
          setShowModal(open)
          if (!open) {
            setIsEditing(false)
            setCurrentLOV({
              name: '',
              key: '',
              description: '',
              items: [{ label: '', value: '', sort_order: 1 }],
            })
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? '📝 Редактировать справочник' : '➕ Новый справочник'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Основная информация */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Основная информация</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название справочника *</label>
                <input
                  type="text"
                  value={currentLOV.name}
                  onChange={(e) => setCurrentLOV({ ...currentLOV, name: e.target.value })}
                  placeholder="Например: Статусы сделок"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Технический ключ (API) *</label>
                <input
                  type="text"
                  value={currentLOV.key}
                  onChange={(e) => setCurrentLOV({ ...currentLOV, key: e.target.value })}
                  disabled={isEditing}
                  placeholder="Например: deal_statuses"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Используется в API для обращения к справочнику. Не может быть изменён после создания.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
                <textarea
                  value={currentLOV.description || ''}
                  onChange={(e) => setCurrentLOV({ ...currentLOV, description: e.target.value })}
                  placeholder="Введите описание справочника"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Элементы справочника */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Элементы справочника</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                >
                  + Добавить элемент
                </Button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {currentLOV.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 font-medium">Название</label>
                      <input
                        type="text"
                        placeholder="Например: Согласование"
                        value={item.label}
                        onChange={(e) => updateItem(idx, 'label', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 font-medium">Значение (API)</label>
                      <input
                        type="text"
                        placeholder="agreement"
                        value={item.value}
                        onChange={(e) => updateItem(idx, 'value', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-xs text-gray-600 font-medium">Порядок</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.sort_order || 0}
                        onChange={(e) => updateItem(idx, 'sort_order', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {currentLOV.items.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        title="Удалить элемент"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Кнопки действия */}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={saveLOV}
            >
              {isEditing ? 'Сохранить изменения' : 'Создать справочник'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модаль просмотра деталей */}
      <Dialog 
        open={showDetailsModal} 
        onOpenChange={(open) => {
          setShowDetailsModal(open)
          if (!open) {
            setSelectedLOV(null)
          }
        }}
      >
        {selectedLOV && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>👁️ {selectedLOV.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Ключ (API)</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">{selectedLOV.key}</code>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Тип</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${selectedLOV.is_system ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {selectedLOV.is_system ? '🔒 Система' : '✎ Пользовательский'}
                  </span>
                </div>
              </div>

              {selectedLOV.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Описание</p>
                  <p className="text-gray-700">{selectedLOV.description}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                  Элементы ({selectedLOV.items?.length || 0})
                </p>
                <div className="space-y-2">
                  {selectedLOV.items?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{item.label}</div>
                        <code className="text-xs text-gray-600 bg-white px-1.5 py-0.5 rounded font-mono border border-gray-200">
                          {item.value}
                        </code>
                        {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailsModal(false)}
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      </CRMLayout>
    </>
  )
}
