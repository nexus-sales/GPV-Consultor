import React, { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { searchPlaces, getPlaceDetails, GooglePlaceResult } from '../lib/data/googlePlacesService'

interface AddressAutocompleteProps {
  onAddressSelect: (details: {
    address: string
    city: string
    postalCode: string
    province: string
    latitude?: number
    longitude?: number
  }) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Buscar dirección...',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<GooglePlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const places = await searchPlaces(query)
      setResults(places)
      setLoading(false)
      setShowDropdown(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = async (place: GooglePlaceResult) => {
    setQuery(place.name)
    setShowDropdown(false)
    setLoading(true)

    const details = await getPlaceDetails(place.place_id)
    setLoading(false)

    if (details) {
      onAddressSelect({
        address: details.formatted_address || place.formatted_address,
        city: details.city || '',
        postalCode: details.postalCode || '',
        province: details.provincia || ''
      })
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <MapPinIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {results.map((place) => (
            <button
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{place.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{place.formatted_address}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  )
}
