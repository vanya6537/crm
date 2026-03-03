import React, { useState } from 'react'
import { Head } from '@inertiajs/react'
import { Plus, Power, Copy, Edit2, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface Trigger {
  id: string
  name: string
  description: string
  event: string
  action: string
  condition?: string
  enabled: boolean
  category: 'leads' | 'showings' | 'deals' | 'communication' | 'follow-up'
  frequency?: string
}

interface TriggerTemplate {
  id: string
  name: string
  description: string
  event: string
  action: string
  condition?: string
  category: 'leads' | 'showings' | 'deals' | 'communication' | 'follow-up'
  icon: string
  recommended: boolean
}

const triggerTemplates: TriggerTemplate[] = [
  {
    id: 'new_lead_notification',
    name: 'Уведомление о новом лиде',
    description: 'Отправить уведомление агенту и в Telegram сразу после поступления нового лида',
    event: 'lead.created',
    action: 'send_notification + send_telegram',
    category: 'leads',
    icon: '🔔',
    recommended: true,
  },
  {
    id: 'lead_source_assignment',
    name: 'Автоматическое распределение лидов',
    description: 'Распределить лиды по агентам автоматически в зависимости от специализации',
    event: 'lead.created',
    action: 'assign_to_agent',
    condition: 'По специализации и нагрузке',
    category: 'leads',
    icon: '👤',
    recommended: true,
  },
  {
    id: 'first_contact_reminder',
    name: 'Напоминание о первом контакте',
    description: 'Напомнить агенту связаться с клиентом в течение 2 часов после поступления лида',
    event: 'lead.created',
    action: 'send_reminder',
    condition: 'Через 2 часа',
    category: 'follow-up',
    icon: '⏰',
    recommended: true,
  },
  {
    id: 'showing_confirmation',
    name: 'Подтверждение показа',
    description: 'Отправить SMS/WhatsApp клиенту с подтверждением показа и напоминанием за 1 час',
    event: 'showing.scheduled',
    action: 'send_message + send_reminder',
    condition: 'За 1 час до показа',
    category: 'showings',
    icon: '🏠',
    recommended: true,
  },
  {
    id: 'post_showing_feedback',
    name: 'Запрос отзыва после показа',
    description: 'Автоматически отправить клиенту опрос о результатах показа через 2 часа',
    event: 'showing.completed',
    action: 'send_feedback_form',
    condition: 'Через 2 часа после показа',
    category: 'showings',
    icon: '📋',
    recommended: true,
  },
  {
    id: 'deal_status_update',
    name: 'Обновление статуса сделки',
    description: 'Обновить статус сделки автоматически при завершении ключевой стадии',
    event: 'deal.milestone_reached',
    action: 'update_status + notify_team',
    category: 'deals',
    icon: '✅',
    recommended: false,
  },
  {
    id: 'commission_calculation',
    name: 'Расчёт комиссии',
    description: 'Автоматически рассчитать комиссию агента при завершении сделки',
    event: 'deal.completed',
    action: 'calculate_commission + generate_invoice',
    category: 'deals',
    icon: '💰',
    recommended: false,
  },
  {
    id: 'inactive_lead_follow_up',
    name: 'Follow-up неактивных лидов',
    description: 'Теплый follow-up для лидов, которые не контактировали 7+ дней',
    event: 'lead.inactive_7days',
    action: 'send_follow_up_email + create_task',
    condition: 'Более 7 дней без активности',
    category: 'follow-up',
    icon: '📧',
    recommended: true,
  },
  {
    id: 'hot_property_alert',
    name: 'Алерт на горячие предложения',
    description: 'Отправить алерт и уведомление в Telegram когда появился подходящий объект',
    event: 'property.added',
    action: 'send_alert + send_telegram + notify_matching_leads',
    condition: 'Совпадает с пожеланиями клиентов',
    category: 'leads',
    icon: '🔥',
    recommended: true,
  },
  {
    id: 'deal_milestone_notification',
    name: 'Уведомление о важных этапах сделки',
    description: 'Напомнить всей команде о ключевых датах (закрытие, проверка документов)',
    event: 'deal.milestone_approaching',
    action: 'send_notification + calendar_alert',
    condition: 'За 3 дня до ключевой даты',
    category: 'deals',
    icon: '📅',
    recommended: true,
  },
  {
    id: 'price_adjustment_notification',
    name: 'Автоматическое уведомление при изменении цены',
    description: 'Уведомить заинтересованных клиентов если цена объекта снизилась',
    event: 'property.price_changed',
    action: 'send_notification_to_interested',
    condition: 'Цена упала на 5%+',
    category: 'leads',
    icon: '📉',
    recommended: false,
  },
  {
    id: 'document_reminder',
    name: 'Напоминание о документах',
    description: 'Автоматическое напоминание о необходимых документах на каждой стадии сделки',
    event: 'deal.stage_changed',
    action: 'send_document_checklist + create_task',
    category: 'deals',
    icon: '📄',
    recommended: false,
  },
]

export default function TriggersPage() {
  const [activeTriggers, setActiveTriggers] = useState<Trigger[]>(
    triggerTemplates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      event: t.event,
      action: t.action,
      condition: t.condition,
      category: t.category,
      enabled: t.recommended,
      frequency: 'real-time',
    }))
  )

  const [showModal, setShowModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const toggleTrigger = (id: string) => {
    setActiveTriggers(prev =>
      prev.map(t => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    )
  }

  const deleteTrigger = (id: string) => {
    if (window.confirm('Удалить этот триггер?')) {
      setActiveTriggers(prev => prev.filter(t => t.id !== id))
    }
  }

  const filteredTriggers = selectedCategory === 'all'
    ? activeTriggers
    : activeTriggers.filter(t => t.category === selectedCategory)

  const categoryNames: Record<string, string> = {
    leads: '🎯 Лиды',
    showings: '🏠 Показы',
    deals: '💼 Сделки',
    communication: '💬 Общение',
    'follow-up': '📞 Follow-up',
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      leads: 'bg-blue-100 text-blue-800',
      showings: 'bg-purple-100 text-purple-800',
      deals: 'bg-green-100 text-green-800',
      communication: 'bg-orange-100 text-orange-800',
      'follow-up': 'bg-pink-100 text-pink-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Head title="Триггеры автоматизации" />
      <div className="p-6 space-y-6">
        {/* Заголовок */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold">⚡ Триггеры автоматизации</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Автоматизируйте рутинные задачи. Включайте готовые триггеры для ускорения работы с лидами, показами и сделками.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="h-5 w-5" />
            Новый триггер
          </button>
        </div>

        {/* Информационный блок */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">Активных</p>
              <p className="text-2xl font-bold text-blue-600">{activeTriggers.filter(t => t.enabled).length}</p>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3">
            <Clock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Всего</p>
              <p className="text-2xl font-bold text-gray-600">{activeTriggers.length}</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900">Рекомендуемых</p>
              <p className="text-2xl font-bold text-yellow-600">{triggerTemplates.filter(t => t.recommended).length}</p>
            </div>
          </div>
        </div>

        {/* Фильтр по категориям */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все триггеры
          </button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Список триггеров */}
        <div className="space-y-3">
          {filteredTriggers.length > 0 ? (
            filteredTriggers.map(trigger => (
              <div
                key={trigger.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <button
                      onClick={() => toggleTrigger(trigger.id)}
                      className="mt-1 text-gray-400 hover:text-gray-600"
                    >
                      <Power 
                        className={`h-6 w-6 transition-colors ${
                          trigger.enabled ? 'text-green-600' : 'text-gray-300'
                        }`}
                      />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{trigger.name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getCategoryBadgeColor(trigger.category)}`}>
                          {categoryNames[trigger.category]}
                        </span>
                        {trigger.enabled && (
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-800">
                            ✓ Активен
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mt-1">{trigger.description}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Событие: </span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">
                            {trigger.event}
                          </code>
                        </div>
                        <div>
                          <span className="text-gray-500">Действие: </span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">
                            {trigger.action}
                          </code>
                        </div>
                        {trigger.condition && (
                          <div>
                            <span className="text-gray-500">Условие: </span>
                            <span className="text-gray-700 font-medium">{trigger.condition}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => alert('Редактирование скоро будет доступно')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => alert('Копирование скоро будет доступно')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Дублировать"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTrigger(trigger.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">Нет триггеров в этой категории</p>
            </div>
          )}
        </div>

        {/* Подсказки для новичков */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-3">💡 Советы по использованию триггеров</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Начните с <strong>Рекомендуемых</strong> триггеров - они дают максимальный результат</li>
            <li>✓ Триггер <strong>«Уведомление о новом лиде»</strong> поможет не пропустить важные контакты</li>
            <li>✓ Триггер <strong>«Подтверждение показа»</strong> повысит no-show rate</li>
            <li>✓ <strong>Follow-up триггеры</strong> автоматически напомнят о важных действиях</li>
            <li>✓ Комбинируйте несколько триггеров для максимальной эффективности</li>
          </ul>
        </div>
      </div>

      {/* Модаль создания триггера */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Создать новый триггер</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Функциональность создания пользовательских триггеров будет добавлена в следующем обновлении.</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

