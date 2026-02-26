import React from 'react'

// Interfaces para el componente KanbanBoard
interface KanbanItem {
  id: string
  nombre: string
  poblacion?: string
  stage: string
}

interface KanbanBoardProps {
  stages: string[]
  items: KanbanItem[]
  onMove: (itemId: string, newStage: string) => void
  className?: string
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stages,
  items,
  onMove,
  className = ''
}) => {
  const getItemsForStage = (stage: string): KanbanItem[] => {
    return items.filter((item) => item.stage === stage)
  }

  const getAvailableStages = (currentStage: string): string[] => {
    return stages.filter((stage) => stage !== currentStage)
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${className}`}>
      {stages.map((stage) => {
        const stageItems = getItemsForStage(stage)

        return (
          <div key={stage} className="bg-slate-50 border rounded-2xl p-3">
            <div className="font-semibold text-slate-700 mb-2">{stage}</div>
            <div className="space-y-2">
              {stageItems.map((item) => {
                const availableStages = getAvailableStages(item.stage)

                return (
                  <div key={item.id} className="bg-white border rounded-xl p-3">
                    <div className="font-medium">{item.nombre}</div>
                    {item.poblacion && (
                      <div className="text-xs text-slate-500">
                        {item.poblacion}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {availableStages.map((availableStage) => (
                        <button
                          key={availableStage}
                          onClick={() => onMove(item.id, availableStage)}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded transition hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                          aria-label={`Mover ${item.nombre} a ${availableStage}`}
                        >
                          → {availableStage}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              {stageItems.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No hay elementos en esta etapa
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard
