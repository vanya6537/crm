import React, { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { Plus, Edit2, Trash2 } from 'lucide-react'

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

export default function ListOfValuesPage() {
  const [listOfValues, setListOfValues] = useState<ListOfValue[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
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
        closeModal()
      }
    } catch (error) {
      console.error('Failed to save LOV:', error)
    }
  }

  const deleteLOV = async (id: number) => {
    if (!window.confirm('Вы уверены что хотите удалить этот список?')) return

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

  const closeModal = () => {
    setShowModal(false)
    setIsEditing(false)
    setCurrentLOV({
      name: '',
      key: '',
      description: '',
      items: [{ label: '', value: '', sort_order: 1 }],
    })
  }

  const addItem = () => {
    setCurrentLOV({
      ...currentLOV,
      items: [...currentLOV.items, { label: '', value: '', sort_order: (currentLOV.items.length || 0) + 1 }],
    })
  }

  const removeItem = (index: number) => {
    const newItems = currentLOV.items.filter((_, i) => i !== index)
    setCurrentLOV({ ...currentLOV, items: newItems })
  }

  const updateItem = (index: number, field: keyof LOVItem, value: any) => {
    const newItems = [...currentLOV.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setCurrentLOV({ ...currentLOV, items: newItems })
  }

  return (
    <>
      <Head title="Списки значений" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Списки значений</h1>
            <p className="text-gray-600">Управление системными и пользовательскими списками</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Добавить список
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : listOfValues.length > 0 ? (
          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Название</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Ключ</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Тип</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Элементы</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Обновлено</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listOfValues.map((lov) => (
                  <tr key={lov.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{lov.name}</td>
                    <td className="px-6 py-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{lov.key}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        lov.is_system
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {lov.is_system ? 'Система' : 'Пользовательский'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{lov.items?.length || 0}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {lov.updated_at ? new Date(lov.updated_at).toLocaleDateString('ru-RU') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => editLOV(lov)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        title="Редактировать"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {!lov.is_system && (
                        <button
                          onClick={() => lov.id && deleteLOV(lov.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">Списки не найдены</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white">
                <h2 className="text-xl font-bold">
                  {isEditing ? 'Редактировать' : 'Добавить'} список значений
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Название *</label>
                  <input
                    type="text"
                    value={currentLOV.name}
                    onChange={(e) => setCurrentLOV({ ...currentLOV, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ключ *</label>
                  <input
                    type="text"
                    value={currentLOV.key}
                    onChange={(e) => setCurrentLOV({ ...currentLOV, key: e.target.value })}
                    disabled={isEditing}
                    className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Описание</label>
                  <textarea
                    value={currentLOV.description || ''}
                    onChange={(e) => setCurrentLOV({ ...currentLOV, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Элементы списка</h3>
                  <div className="space-y-2">
                    {currentLOV.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Подпись"
                          value={item.label}
                          onChange={(e) => updateItem(idx, 'label', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Значение"
                          value={item.value}
                          onChange={(e) => updateItem(idx, 'value', e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Порядок"
                          value={item.sort_order || 0}
                          onChange={(e) => updateItem(idx, 'sort_order', parseInt(e.target.value))}
                          className="w-24 px-3 py-2 border rounded-lg text-sm"
                        />
                        {currentLOV.items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-600 hover:text-red-800"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addItem}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Добавить элемент
                  </button>
                </div>
              </div>

              <div className="sticky bottom-0 flex gap-3 justify-end p-6 border-t bg-white">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={saveLOV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
