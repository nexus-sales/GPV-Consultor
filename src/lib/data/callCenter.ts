import { pipelineStages, type PipelineStageId } from './config'
import type {
  Candidate,
  Distributor,
  Visit,
  LookupOption,
  CallCenterTask,
  CallCenterSummary
} from '../types'

type TaskWithoutMeta = Omit<CallCenterTask, 'meta'>

interface BuildCallCenterOptions {
  candidates?: Candidate[]
  distributors?: Distributor[]
  visits?: Visit[]
  statusLookup?: Record<string, LookupOption>
  distributorsLookup?: Record<string, Distributor>
  candidatesLookup?: Record<string, Candidate>
}

const visitTypeLabelMap: Record<string, string> = {
  presentacion: 'Presentación',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  incidencias: 'Incidencias',
  apertura: 'Apertura',
  otros: 'Visita programada'
}

const normaliseLocation = (
  ...parts: Array<string | undefined | null>
): string => parts.filter(Boolean).join(', ')

const buildStageIndex = (stages: typeof pipelineStages) =>
  stages.reduce<Record<PipelineStageId, number>>(
    (acc, stage, index) => {
      acc[stage.id] = index
      return acc
    },
    {} as Record<PipelineStageId, number>
  )

const nextStageFactory =
  (sequence: PipelineStageId[], indexMap: Record<PipelineStageId, number>) =>
  (stageId: PipelineStageId | undefined | null): PipelineStageId | null => {
    if (!stageId) return sequence[0] ?? null
    const index = indexMap[stageId]
    if (typeof index !== 'number') return sequence[0] ?? null
    return index < sequence.length - 1 ? sequence[index + 1] : null
  }

const previousStageFactory =
  (sequence: PipelineStageId[], indexMap: Record<PipelineStageId, number>) =>
  (stageId: PipelineStageId | undefined | null): PipelineStageId | null => {
    if (!stageId) return null
    const index = indexMap[stageId]
    if (typeof index !== 'number') return null
    return index > 0 ? sequence[index - 1] : null
  }

const isOverdueVisit = (date: string): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(date)
  dueDate.setHours(0, 0, 0, 0)
  return dueDate < today
}

export const buildCallCenter = ({
  candidates = [],
  distributors = [],
  visits = [],
  statusLookup = {},
  distributorsLookup = {},
  candidatesLookup = {}
}: BuildCallCenterOptions): CallCenterSummary => {
  const stageSequence = pipelineStages.map((stage) => stage.id)
  const stageIndex = buildStageIndex(pipelineStages)

  const getNextStage = nextStageFactory(stageSequence, stageIndex)
  const getPreviousStage = previousStageFactory(stageSequence, stageIndex)

  const firstContact: CallCenterTask[] = []
  const followUp: CallCenterTask[] = []
  const activation: CallCenterTask[] = []
  const postVisit: CallCenterTask[] = []

  candidates.forEach((candidate) => {
    const baseTask: TaskWithoutMeta = {
      id: `candidate-${candidate.id}`,
      refType: 'candidate',
      refId: candidate.id,
      visitId: null,
      candidateId: candidate.id,
      distributorId: null,
      name: candidate.name,
      contact: candidate.contact?.name ?? '',
      phone: candidate.contact?.phone ?? '',
      email: candidate.contact?.email ?? '',
      channelCode: candidate.channelCode ?? '',
      stageId: candidate.stage as PipelineStageId,
      pendingData: false,
      note: candidate.notes ?? '',
      context: candidate.channelCode
        ? `Canal ${candidate.channelCode}`
        : 'Sin canal definido',
      location: normaliseLocation(candidate.city, candidate.island),
      taskType: 'first-contact',
      priority: 'medium',
      dueDate: null,
      isOverdue: false
    }

    if (candidate.stage === 'new') {
      firstContact.push({
        ...baseTask,
        meta: 'Nuevo registro',
        priority: 'high',
        note: 'Registrar primer contacto y presentar onboarding inicial.',
        taskType: 'first-contact'
      })
    } else if (
      candidate.stage === 'contacted' ||
      candidate.stage === 'evaluation'
    ) {
      followUp.push({
        ...baseTask,
        meta:
          candidate.stage === 'contacted'
            ? 'Contacto inicial'
            : 'Documentación',
        priority:
          candidate.notes && candidate.notes.includes('pendiente')
            ? 'high'
            : 'medium',
        context:
          candidate.notes && candidate.notes.includes('pendiente')
            ? 'Checklist incompleto'
            : 'Validar documentación pendiente',
        note:
          candidate.notes ||
          'Revisar avances y solicitar documentación faltante.',
        taskType: 'follow-up'
      })
    }
  })

  distributors.forEach((distributor) => {
    if (distributor.status === 'active' && !distributor.pendingData) return

    activation.push({
      id: `distributor-${distributor.id}`,
      refType: 'distributor',
      refId: distributor.id,
      visitId: null,
      distributorId: distributor.id,
      candidateId: null,
      name: distributor.name,
      contact:
        distributor.contactPerson || distributor.contactPersonBackup || '',
      phone: distributor.phone || '',
      email: distributor.email || '',
      meta: statusLookup[distributor.status]?.label ?? 'Seguimiento',
      context: distributor.pendingData
        ? 'Checklist fiscal en curso'
        : 'Validar activación comercial',
      priority: distributor.pendingData ? 'high' : 'medium',
      note: distributor.pendingData
        ? 'Confirma recepción de CIF, dirección fiscal y datos de contacto.'
        : 'Revisa estado del alta y próximos hitos.',
      stageId: null,
      pendingData: Boolean(distributor.pendingData),
      location: normaliseLocation(distributor.city, distributor.province),
      taskType: 'activation',
      dueDate: null,
      isOverdue: false
    })
  })

  visits.forEach((visit) => {
    if (visit.result !== 'pendiente') return

    const distributor = visit.distributorId
      ? distributorsLookup[visit.distributorId]
      : undefined
    const candidate = visit.candidateId
      ? candidatesLookup[visit.candidateId]
      : undefined
    const overdue = isOverdueVisit(visit.date)

    postVisit.push({
      id: `visit-${visit.id}`,
      refType: 'visit',
      refId: visit.id,
      visitId: visit.id,
      distributorId: visit.distributorId ?? null,
      candidateId: visit.candidateId ?? null,
      name: distributor?.name ?? candidate?.name ?? 'Contacto sin nombre',
      contact: distributor?.contactPerson ?? candidate?.contact?.name ?? '',
      phone: distributor?.phone ?? candidate?.contact?.phone ?? '',
      email: distributor?.email ?? candidate?.contact?.email ?? '',
      meta: visitTypeLabelMap[visit.type] ?? visitTypeLabelMap.otros,
      context: visit.objective || 'Objetivo sin definir',
      priority: overdue ? 'high' : 'medium',
      note: visit.nextSteps || 'Registrar resultado y acciones de seguimiento.',
      stageId: null,
      pendingData: false,
      taskType: 'post-visit',
      dueDate: visit.date,
      isOverdue: overdue,
      location: distributor
        ? normaliseLocation(distributor.city, distributor.province)
        : normaliseLocation(candidate?.city, candidate?.island)
    })
  })

  const allTasks: CallCenterTask[] = [
    ...firstContact,
    ...followUp,
    ...activation,
    ...postVisit
  ]
  const urgentTasks = allTasks.filter(
    (task) => task.priority === 'high' || task.isOverdue
  )
  const contactableTasks = allTasks.filter(
    (task) => task.phone.trim().length > 0
  )
  const nextTask = urgentTasks[0] || contactableTasks[0] || null

  const byCandidate: Record<string | number, CallCenterTask[]> = {}
  const byDistributor: Record<string | number, CallCenterTask[]> = {}
  const byVisit: Record<string | number, CallCenterTask> = {}

  allTasks.forEach((task) => {
    if (task.refType === 'candidate' && task.refId != null) {
      const key = task.refId
      if (!byCandidate[key]) byCandidate[key] = []
      byCandidate[key].push(task)
    }

    if (task.distributorId != null) {
      const key = task.distributorId
      if (!byDistributor[key]) byDistributor[key] = []
      byDistributor[key].push(task)
    }

    if (task.candidateId != null) {
      const key = task.candidateId
      if (!byCandidate[key]) byCandidate[key] = []
      byCandidate[key].push(task)
    }

    if (task.refType === 'visit' && task.refId != null) {
      byVisit[task.refId] = task
    }
  })

  return {
    tasks: {
      firstContact,
      followUp,
      activation,
      postVisit
    },
    stats: {
      total: allTasks.length,
      urgent: urgentTasks.length,
      contactable: contactableTasks.length,
      missingData: allTasks.length - contactableTasks.length,
      nextTask
    },
    lookup: {
      byCandidate,
      byDistributor,
      byVisit
    },
    helpers: {
      nextCandidateStage: getNextStage,
      previousCandidateStage: getPreviousStage
    }
  }
}
