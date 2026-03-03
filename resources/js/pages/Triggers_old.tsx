import React, { useState, useEffect } from 'react'
import { Head } from '@inertiajs/react'
import { Plus, Settings, BarChart3, Zap, Filter, Search, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TriggerTemplate {
  id: number
  code: string
  name: string
  description: string
  category: string
  event_type: string
  entity_type: string
  is_recommended: boolean
  moscow_use_case: string
  expected_impact: string
  sample_notification?: any
}

interface ActiveTrigger {
  id: number
  trigger_template_id: number
  name: string
  description: string
  category: string
  is_enabled: boolean
  execution_count: number
  last_executed_at?: string
}

const categoryIcons: Record<string, string> = {
  leads: '📞',
  properties: '🏠',
  buyers: '👤',
  showings: '🚗',
  owners: '👨‍💼',
  deals: '💼',
  messaging: '💬',
  meta: '🎯',
}

const categoryLabels: Record<string, string> = {
  leads: 'Лиды',
  properties: 'Объекты',
  buyers: 'Покупатели',
  showings: 'Показы',
  owners: 'Собственники',
  deals: 'Сделки',
  messaging: 'Мессенджеры',
  meta: 'Комплексные',
}

export default function TriggersCatalog() {
  const [templates, setTemplates] = useState<TriggerTemplate[]>([])
  const [activeTriggers, setActiveTriggers] = useState<ActiveTrigger[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('leads')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TriggerTemplate | null>(null)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadTemplates()
    loadActiveTriggers()
    loadStats()
  }, [selectedCategory])

  const loadTemplates = async () => {
    try {
      const response = await fetch(
        `/api/v1/triggers/templates/category/${selectedCategory}`,
        { headers: { 'Accept': 'application/json' } }
      )
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveTriggers = async () => {
    try {
      const response = await fetch('/api/v1/triggers/', {
        headers: { 'Accept': 'application/json' }
      })
      const data = await response.json()
      setActiveTriggers(data)
    } catch (error) {
      console.error('Failed to load active triggers:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/triggers/stats', {
        headers: { 'Accept': 'application/json' }
      })
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleActivateTrigger = async (template: TriggerTemplate) => {
    setSelectedTemplate(template)
    setShowSetupDialog(true)
  }

  const confirmActivate = async () => {
    if (!selectedTemplate) return

    try {
      const response = await fetch('/api/v1/triggers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_template_id: selectedTemplate.id,
        }),
      })

      if (response.ok) {
        await loadActiveTriggers()
        setShowSetupDialog(false)
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Failed to activate trigger:', error)
    }
  }

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isTemplateActive = (templateId: number) => {
    return activeTriggers.some(t => t.trigger_template_id === templateId)
  }

  return (
    <>
      <Head title="Триггеры для агентов" />
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">⚡ Каталог триггеров</h1>
            <p className="text-gray-600 mt-1">
              Готовые триггеры для московского агентства недвижимости
            </p>
          </div>
          <Button onClick={() => setShowStatsDialog(true)} variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Статистика
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">💡 Почему триггеры?</CardTitle>
            <CardDescription className="text-blue-800">
              Триггеры автоматизируют типовые рабочие процессы и увеличивают конверсию на 20-35%.
              Выбирайте готовые триггеры или создавайте свои под вашу стратегию.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск триггеров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {categoryIcons[key]} {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(categoryLabels).map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Загрузка...</div>
              ) : filteredTemplates.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {filteredTemplates.map((template) => {
                    const isActive = isTemplateActive(template.id)
                    return (
                      <Card key={template.id} className={isActive ? 'border-green-500 bg-green-50' : ''}>
                        <CardHeader>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              <CardDescription>{template.description}</CardDescription>
                            </div>
                            {isActive && (
                              <Badge className="bg-green-600">Активен</Badge>
                            )}
                            {template.is_recommended && (
                              <Badge variant="secondary">⭐ Рекомендуется</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="text-sm">
                            <p className="font-semibold text-gray-700">Полезно для Москвы:</p>
                            <p className="text-gray-600">{template.moscow_use_case}</p>
                          </div>

                          <div className="text-sm">
                            <p className="font-semibold text-gray-700">Ожидаемый эффект:</p>
                            <p className="text-green-700 font-medium">{template.expected_impact}</p>
                          </div>

                          <div className="flex gap-2 pt-3 border-t">
                            <Badge variant="outline" className="text-xs">
                              {template.event_type === 'time_based' ? '⏰' : '🔔'} {template.event_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.entity_type}
                            </Badge>
                          </div>

                          <div className="flex gap-2 pt-3">
                            {!isActive && (
                              <Button
                                size="sm"
                                onClick={() => handleActivateTrigger(template)}
                                className="flex-1"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Активировать
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Настроить
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Триггеры в этой категории не найдены
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Active Triggers Section */}
        {activeTriggers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Активные триггеры</CardTitle>
              <CardDescription>
                {activeTriggers.length} триггер{activeTriggers.length % 10 === 1 ? '' : 'ов'} работает
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activeTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{trigger.name}</p>
                      <p className="text-sm text-green-800">
                        Выполнено: {trigger.execution_count} раз
                        {trigger.last_executed_at && (
                          <span className="ml-2">
                            (последний раз: {new Date(trigger.last_executed_at).toLocaleDateString('ru-RU')})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {trigger.is_enabled && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        {selectedTemplate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Активировать триггер</DialogTitle>
              <DialogDescription>
                {selectedTemplate.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  {selectedTemplate.description}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-700 mb-2">Как это работает:</p>
                <p className="text-sm text-gray-600">
                  Триггер будет автоматически активирован для вашей команды.
                  Событие: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{selectedTemplate.event_type}</code>
                </p>
              </div>

              {selectedTemplate.sample_notification && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Пример уведомления:</p>
                  <div className="bg-gray-100 p-3 rounded text-sm text-gray-700 italic">
                    {selectedTemplate.sample_notification.text}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSetupDialog(false)}
              >
                Отмена
              </Button>
              <Button onClick={confirmActivate} className="bg-green-600 hover:bg-green-700">
                ✓ Активировать
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Статистика триггеров</DialogTitle>
          </DialogHeader>

          {stats && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.total_templates}
                    </div>
                    <p className="text-sm text-gray-600">Всего триггеров</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.active_triggers}
                    </div>
                    <p className="text-sm text-gray-600">Активных</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.total_executions}
                    </div>
                    <p className="text-sm text-gray-600">Всего выполнено</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.successful_executions}
                    </div>
                    <p className="text-sm text-gray-600">Успешно</p>
                  </CardContent>
                </Card>
              </div>

              {stats.by_category && stats.by_category.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">По категориям:</p>
                  <div className="space-y-2">
                    {stats.by_category.map((cat: any) => (
                      <div key={cat.category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{categoryIcons[cat.category]} {categoryLabels[cat.category]}</span>
                        <Badge>{cat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
