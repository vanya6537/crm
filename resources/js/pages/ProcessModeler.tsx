import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Plus, Play, Copy, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import CRMLayout from '@/layouts/crm-layout'

interface ProcessTemplate {
  id: string
  name: string
  description: string
  type: 'lead' | 'showing' | 'deal' | 'follow-up'
  stages: string[]
  duration: string
  successRate: string
  recommended: boolean
}

const processTemplates: ProcessTemplate[] = [
  {
    id: 'lead_qualification',
    name: 'Квалификация лидов',
    description: 'Стандартный процесс обработки и квалификации входящих лидов',
    type: 'lead',
    stages: [
      '📥 Получение контакта',
      '📞 Первый контакт (2 часа)',
      '🔍 Уточнение потребностей',
      '✅ Определение квалификации',
      '📊 Распределение по агентам',
    ],
    duration: '2-3 часа',
    successRate: '45-60%',
    recommended: true,
  },
  {
    id: 'showing_workflow',
    name: 'Процесс показа объекта',
    description: 'Полный цикл процесса показа: от согласования до получения решения',
    type: 'showing',
    stages: [
      '📅 Согласование времени показа',
      '🔔 Напоминание клиенту (1 час)',
      '🏠 Проведение показа',
      '💬 Получение первого впечатления',
      '⏲️ Follow-up (2 часа)',
      '📋 Документирование результата',
    ],
    duration: '2-4 часа',
    successRate: '30-50%',
    recommended: true,
  },
  {
    id: 'deal_closing',
    name: 'Закрытие сделки',
    description: 'Управление ключевыми этапами до финального заключения договора',
    type: 'deal',
    stages: [
      '💼 Предоставление предложения',
      '📄 Подготовка документов',
      '🏦 Согласование условий',
      '✍️ Подписание договора',
      '💳 Оплата и платежи',
      '🎉 Завершение и передача',
    ],
    duration: '5-15 дней',
    successRate: '80-95%',
    recommended: true,
  },
  {
    id: 'follow_up_not_ready',
    name: 'Follow-up для "подумать нужно"',
    description: 'Систематический follow-up для клиентов, которые заинтересованы но ещё не готовы',
    type: 'follow-up',
    stages: [
      '📧 Day 1: Спасибо за уделённое время',
      '📞 Day 3: Проверка оставшихся вопросов',
      '🏠 Day 7: Альтернативные варианты',
      '💬 Day 14: Обновление по аналогичным объектам',
      '📊 Day 30: Финальное предложение',
    ],
    duration: '30 дней',
    successRate: '15-25%',
    recommended: true,
  },
  {
    id: 'cold_lead_warming',
    name: 'Прогрев холодных лидов',
    description: 'Постепенное вовлечение лидов которые долго не контактировали',
    type: 'follow-up',
    stages: [
      '⚠️ Определение: неактивно 7+ дней',
      '📬 Email: "Мы скучаем по вам"',
      '🎁 SMS: Специальное предложение',
      '📞 Звонок: Персональное общение',
      '🔄 Re-engagement: Новые варианты',
    ],
    duration: '14-21 день',
    successRate: '10-20%',
    recommended: false,
  },
  {
    id: 'property_listing',
    name: 'Размещение объекта на продажу',
    description: 'Процесс подготовки и размещения нового объекта недвижимости',
    type: 'lead',
    stages: [
      '📸 Фотографирование и видео',
      '✍️ Описание и характеристики',
      '💻 Размещение на портале',
      '📱 Продвижение в соцсетях',
      '🔔 Уведомление соответствующих клиентов',
      '📊 Мониторинг интереса',
    ],
    duration: '1-2 дня',
    successRate: '60-75%',
    recommended: false,
  },
]

interface SavedProcess {
  id: string
  name: string
  template: ProcessTemplate
  active: boolean
  createdAt: string
}

export default function ProcessModelerPage() {
  const [savedProcesses, setSavedProcesses] = useState<SavedProcess[]>([
    {
      id: '1',
      name: 'Основной процесс квалификации',
      template: processTemplates[0],
      active: true,
      createdAt: '2024-03-01',
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessTemplate | null>(null)
  const [newProcessName, setNewProcessName] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')

  const createProcess = (template: ProcessTemplate) => {
    setSelectedTemplate(template)
    setNewProcessName('')
    setShowModal(true)
  }

  const saveProcess = () => {
    if (!newProcessName.trim() || !selectedTemplate) return

    const newProcess: SavedProcess = {
      id: String(savedProcesses.length + 1),
      name: newProcessName,
      template: selectedTemplate,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setSavedProcesses([...savedProcesses, newProcess])
    setShowModal(false)
    setNewProcessName('')
    setSelectedTemplate(null)
  }

  const deleteProcess = (id: string) => {
    if (window.confirm('Удалить процесс?')) {
      setSavedProcesses(prev => prev.filter(p => p.id !== id))
    }
  }

  const toggleProcess = (id: string) => {
    setSavedProcesses(prev =>
      prev.map(p => (p.id === id ? { ...p, active: !p.active } : p))
    )
  }

  const filteredTemplates = selectedType === 'all'
    ? processTemplates
    : processTemplates.filter(t => t.type === selectedType)

  const typeNames: Record<string, string> = {
    all: 'Все процессы',
    lead: '🎯 Квалификация лидов',
    showing: '🏠 Показы',
    deal: '💼 Сделки',
    'follow-up': '📞 Follow-up',
  }

  return (
    <>
      <Head title="Конструктор процессов" />
      <CRMLayout>
      <div className="p-6 space-y-6">
        {/* Заголовок */}
        <div className="border-b pb-6">
          <h1 className="text-3xl font-bold">🔄 Конструктор процессов</h1>
          <p className="text-gray-600 mt-2 max-w-3xl">
            Готовые шаблоны процессов для управления лидами, показами и сделками. Выберите процесс, 
            настройте под себя и начните использовать в команде.
          </p>
        </div>

        {/* Активные процессы */}
        {savedProcesses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">📋 Ваши процессы</h2>
            <div className="space-y-3">
              {savedProcesses.map(process => (
                <div
                  key={process.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{process.name}</h3>
                        {process.active ? (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800">
                            ✓ Активен
                          </span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-800">
                            ○ Неактивен
                          </span>
                        )}
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                          {process.template.name}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">{process.template.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleProcess(process.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={process.active ? 'Отключить' : 'Включить'}
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => alert('Редактирование скоро будет доступно')}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Редактировать"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProcess(process.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Этапы процесса */}
                  <div className="mt-4 pl-4 border-l-2 border-blue-300">
                    <div className="space-y-2">
                      {process.template.stages.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="text-xs font-bold text-blue-600 w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                            {idx + 1}
                          </span>
                          {stage}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Метрики */}
                  <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-gray-500">Длительность: </span>
                      <span className="font-semibold text-gray-900">{process.template.duration}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Успешность: </span>
                      <span className="font-semibold text-green-600">{process.template.successRate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Фильтър по типам */}
        <div>
          <h2 className="text-xl font-bold mb-4">📁 Шаблоны процессов</h2>
          <div className="flex gap-2 flex-wrap mb-6">
            {Object.entries(typeNames).map(([key, name]) => (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Шаблоны */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold flex-1">{template.name}</h3>
                  {template.recommended && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-yellow-100 text-yellow-800">
                      ⭐ Рекомендуемый
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm mb-4">{template.description}</p>

                {/* Этап процесса в компактном виде */}
                <div className="space-y-2 mb-4">
                  {template.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded"></span>
                      <span className="line-clamp-1">{stage}</span>
                    </div>
                  ))}
                </div>

                {/* Метрики */}
                <div className="grid grid-cols-2 gap-2 mb-4 pb-4 border-t pt-4">
                  <div className="text-xs">
                    <span className="text-gray-500">Время: </span>
                    <span className="font-semibold">{template.duration}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Успех: </span>
                    <span className="font-semibold text-green-600">{template.successRate}</span>
                  </div>
                </div>

                {/* Кнопка создания */}
                <button
                  onClick={() => createProcess(template)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Использовать шаблон
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Советы */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3">💡 Как использовать процессы</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Выберите подходящий шаблон и создайте процесс для вашей команды</li>
            <li>✓ Каждый процесс показывает ожидаемую длительность и процент успеха</li>
            <li>✓ Активные процессы автоматически применяются к новым лидам и сделкам</li>
            <li>✓ Регулярно анализируйте метрики и корректируйте процессы под ваши результаты</li>
            <li>✓ Используйте несколько процессов для разных типов клиентов</li>
          </ul>
        </div>
      </div>

      {/* Модаль создания процесса */}
      {showModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Создать процесс из шаблона</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название процесса *</label>
                <input
                  type="text"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  placeholder={selectedTemplate.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Этапы процесса ({selectedTemplate.stages.length})</h3>
                <div className="space-y-2">
                  {selectedTemplate.stages.map((stage, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 pb-2 border-b last:border-b-0">
                      <span className="font-bold text-blue-600 w-6 flex-shrink-0">{idx + 1}.</span>
                      <span>{stage}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Ожидаемая длительность</p>
                  <p className="text-lg font-bold text-blue-900">{selectedTemplate.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Порядок успеха</p>
                  <p className="text-lg font-bold text-green-600">{selectedTemplate.successRate}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={saveProcess}
                disabled={!newProcessName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Создать процесс
              </button>
            </div>
          </div>
        </div>
      )}
      </CRMLayout>
    </>
  )
}

