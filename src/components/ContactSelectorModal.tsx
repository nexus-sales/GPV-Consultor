import React, { useCallback, useMemo, useState } from 'react'
import {
  BuildingOfficeIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import Modal from './ui/Modal'
import type { Distributor, Candidate } from '../lib/types'

// Interfaces para el selector de contactos
interface TabOption {
  id: 'distributors' | 'candidates'
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface SelectionEvent {
  type: 'distributor' | 'candidate'
  entity: Distributor | Candidate
}

interface ContactSelectorModalProps {
  onClose: () => void
  onSelect?: (selection: SelectionEvent) => void
  distributors?: Distributor[]
  candidates?: Candidate[]
  title?: string
  initialTab?: 'distributors' | 'candidates'
}

const tabOptions: TabOption[] = [
  { id: 'distributors', label: 'Distribuidores', icon: BuildingOfficeIcon },
  { id: 'candidates', label: 'Candidatos', icon: UserIcon }
]

const ContactSelectorModal: React.FC<ContactSelectorModalProps> = ({
  onClose,
  onSelect,
  distributors = [],
  candidates = [],
  title = 'Seleccionar contacto',
  initialTab = 'distributors'
}) => {
  const [activeTab, setActiveTab] = useState<'distributors' | 'candidates'>(
    () =>
      tabOptions.some((tab) => tab.id === initialTab)
        ? initialTab
        : 'distributors'
  )
  const [search, setSearch] = useState<string>('')

  const filterItems = useCallback(
    <T,>(items: T[], resolver: (item: T) => string[]) => {
      if (!search.trim()) return items
      const term = search.trim().toLowerCase()
      return items.filter((item) =>
        resolver(item).some((value) => value.includes(term))
      )
    },
    [search]
  )

  const distributorItems = useMemo(() => {
    return filterItems(distributors, (distributor: Distributor) => [
      distributor.name?.toLowerCase() ?? '',
      distributor.code?.toLowerCase() ?? '',
      distributor.contactPerson?.toLowerCase() ?? '',
      distributor.city?.toLowerCase() ?? '',
      distributor.province?.toLowerCase() ?? ''
    ])
  }, [distributors, filterItems])

  const candidateItems = useMemo(() => {
    return filterItems(candidates, (candidate: Candidate) => [
      candidate.name?.toLowerCase() ?? '',
      candidate.contact?.name?.toLowerCase() ?? '',
      candidate.city?.toLowerCase() ?? '',
      candidate.island?.toLowerCase() ?? '',
      candidate.channelCode?.toLowerCase() ?? ''
    ])
  }, [candidates, filterItems])

  const renderDistributor = (distributor: Distributor) => {
    const handleSelect = (): void => {
      onSelect?.({ type: 'distributor', entity: distributor })
    }

    return (
      <li
        key={distributor.id}
        className="rounded-2xl border border-teal-100 bg-teal-50/45 p-4 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {distributor.name}
            </p>
            {distributor.code && (
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                {distributor.code}
              </p>
            )}
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4" />
              {[distributor.city, distributor.province]
                .filter(Boolean)
                .join(', ') || 'Localización pendiente'}
            </p>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4" />
              {distributor.phone || 'Sin teléfono registrado'}
            </p>
            {distributor.contactPerson && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Responsable: {distributor.contactPerson}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSelect}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150"
            aria-label={`Seleccionar distribuidor ${distributor.name}`}
          >
            Usar
          </button>
        </div>
      </li>
    )
  }

  const renderCandidate = (candidate: Candidate) => {
    const handleSelect = (): void => {
      onSelect?.({ type: 'candidate', entity: candidate })
    }

    return (
      <li
        key={candidate.id}
        className="rounded-2xl border border-indigo-100 bg-indigo-50/45 p-4 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p className="text-base font-semibold text-gray-900">
              {candidate.name}
            </p>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4" />
              {[candidate.city, candidate.island].filter(Boolean).join(', ') ||
                'Localización pendiente'}
            </p>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4" />
              {candidate.contact?.phone || 'Sin teléfono registrado'}
            </p>
            {candidate.contact?.name && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contacto: {candidate.contact.name}
              </p>
            )}
            {candidate.channelCode && (
              <p className="text-xs text-gray-400 uppercase tracking-widest">
                {candidate.channelCode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSelect}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150"
            aria-label={`Seleccionar candidato ${candidate.name}`}
          >
            Usar
          </button>
        </div>
      </li>
    )
  }

  const activeItems =
    activeTab === 'distributors' ? distributorItems : candidateItems
  const hasResults = activeItems.length > 0

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearch(event.target.value)
  }

  const handleTabChange = (tabId: 'distributors' | 'candidates'): void => {
    setActiveTab(tabId)
  }

  return (
    <Modal title={title} maxWidth="max-w-[min(96vw,1280px)]" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/45 p-4 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
            Busqueda rapida
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Localiza contactos por nombre, codigo, ciudad o responsable.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr,auto] md:items-center">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, ciudad o contacto"
              className="w-full rounded-xl border border-indigo-100 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-indigo-400/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              aria-label="Buscar contactos"
            />
          </div>
          <div
            className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-white/80 p-1 shadow-sm dark:border-gray-600 dark:bg-gray-700"
            role="tablist"
          >
            {tabOptions.map((tabItem) => {
              const { id, label } = tabItem
              const IconComponent = tabItem.icon
              const isActive = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTabChange(id)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? id === 'distributors'
                        ? 'bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-500/10 dark:text-teal-300'
                        : 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  role="tab"
                  aria-controls={`panel-${id}`}
                  aria-selected={isActive ? 'true' : 'false'}
                >
                  <IconComponent className="h-4 w-4" />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {hasResults ? (
            <ul className="space-y-3" role="list">
              {activeTab === 'distributors'
                ? (distributorItems as Distributor[]).map(renderDistributor)
                : (candidateItems as Candidate[]).map(renderCandidate)}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/35 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-400">
              No se encontraron resultados para los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ContactSelectorModal
