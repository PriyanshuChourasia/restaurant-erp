import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Loader2, User, Check, AlertCircle } from 'lucide-react'
import { searchCustomers, createCustomer } from '../api/customer.api'
import type { CustomerSearchResult } from '../types/customer.types'

interface CustomerComboboxProps {
  onSelect: (customer: CustomerSearchResult | null) => void
  selected: CustomerSearchResult | null
}

export function CustomerCombobox({ onSelect, selected }: CustomerComboboxProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addName, setAddName] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: results, isFetching } = useQuery({
    queryKey: ['customer-search', query],
    queryFn: () => searchCustomers(query, 8),
    enabled: query.length >= 2,
    staleTime: 15_000,
  })

  const createMutation = useMutation({
    mutationFn: (dto: { name: string; phone: string }) => createCustomer(dto),
    onSuccess: (newCustomer) => {
      onSelect({
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        customerType: newCustomer.customerType,
        priceLevelId: newCustomer.priceLevelId,
      })
      setQuery('')
      setIsOpen(false)
      setShowAddForm(false)
      setAddName('')
      setAddPhone('')
      setError(null)
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save customer. Please try again.'
      // Handle both string and array validation errors from NestJS
      const errorText = Array.isArray(message) ? message.join(', ') : message
      setError(errorText)
    },
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setShowAddForm(false)
        setError(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (customer: CustomerSearchResult) => {
    onSelect(customer)
    setQuery('')
    setIsOpen(false)
    setShowAddForm(false)
    setError(null)
  }

  const handleClear = () => {
    onSelect(null)
    setQuery('')
  }

  const handleCreate = () => {
    if (!addName.trim() || !addPhone.trim()) return
    setError(null)
    createMutation.mutate({ name: addName.trim(), phone: addPhone.trim() })
  }

  // Reset add form fields when query changes
  useEffect(() => {
    if (!showAddForm && query.length >= 2) {
      setAddName(query)
    }
  }, [query, showAddForm])

  const showDropdown = isOpen && query.length >= 2

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={selected ? selected.name : 'Search customer...'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setShowAddForm(false)
            setError(null)
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full h-8 rounded-lg border border-gray-300 pl-8 pr-8 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        {selected && !query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
        {isFetching && !selected && (
          <Loader2 size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
        )}
      </div>

      {selected && !query && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium">
            <Check size={10} />
            {selected.customerType}
          </span>
          <span className="text-[11px] text-gray-400">{selected.phone}</span>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="mt-1 flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-red-50 border border-red-100">
          <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {/* Search results */}
          {results && results.length > 0 && (
            <div className="max-h-48 overflow-auto divide-y divide-gray-100">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                    <p className="text-xs text-gray-400">{customer.phone}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase font-medium">
                    {customer.customerType}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* "+ Add" row */}
          {!showAddForm && (
            <button
              onClick={() => {
                setShowAddForm(true)
                setError(null)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 border-t border-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Plus size={14} />
              </div>
              <div className="text-sm">
                <span className="text-gray-600">+ Add </span>
                <span className="font-medium text-gray-900">&ldquo;{query}&rdquo;</span>
                <span className="text-gray-600"> as new customer</span>
              </div>
            </button>
          )}

          {/* Inline add form */}
          {showAddForm && (
            <div className="p-3 border-t border-gray-100 space-y-2">
              <input
                type="text"
                placeholder="Name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                className="w-full h-8 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40"
              />
              <input
                type="tel"
                placeholder="Phone number (10-20 digits)"
                value={addPhone}
                onChange={(e) => {
                  setAddPhone(e.target.value)
                  setError(null)
                }}
                className="w-full h-8 rounded-md border border-gray-300 px-2.5 text-sm outline-none focus:border-primary/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setError(null)
                  }}
                  className="flex-1 h-7 rounded-md border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!addName.trim() || !addPhone.trim() || createMutation.isPending}
                  className="flex-1 h-7 rounded-md bg-primary text-xs font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </span>
                  ) : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* No results */}
          {results && results.length === 0 && !showAddForm && (
            <div className="px-3 py-2 text-center text-xs text-gray-400">
              No customers found
            </div>
          )}
        </div>
      )}
    </div>
  )
}
