import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, ArrowLeftRight, RefreshCw } from 'lucide-react'
import { getUnits, convertUnits } from '../api/units.api'
import type { Unit } from '../types/units.types'

interface UnitConversionWidgetProps {
  quantity: number
  unitCode: string
  onClose: () => void
}

/**
 * Group units that share the same base unit chain into compatibility groups.
 * Two units are compatible if they share the same ultimate base unit.
 */
function getCompatibleUnits(units: Unit[], fromSymbol: string): Unit[] {
  const unit = units.find((u) => u.symbol === fromSymbol)
  if (!unit) return units
  // Find the root base unit (the top of the chain)
  const resolveRoot = (u: Unit): string => {
    if (!u.baseUnitId) return u.id
    const parent = units.find((p) => p.id === u.baseUnitId)
    return parent ? resolveRoot(parent) : u.id
  }
  const rootId = resolveRoot(unit)
  // All units under this root are compatible
  const compatibleIds = new Set<string>()
  const collectDescendants = (parentId: string) => {
    compatibleIds.add(parentId)
    for (const u of units) {
      if (u.baseUnitId === parentId) {
        compatibleIds.add(u.id)
        collectDescendants(u.id)
      }
    }
  }
  collectDescendants(rootId)
  return units.filter((u) => compatibleIds.has(u.id))
}

export function UnitConversionWidget({ quantity, unitCode, onClose }: UnitConversionWidgetProps) {
  const [fromCode, setFromCode] = useState(unitCode)
  const [toCode, setToCode] = useState('')
  const [inputQty, setInputQty] = useState(String(quantity))
  const [debouncedQty, setDebouncedQty] = useState(quantity)

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => getUnits(),
  })

  const fromUnit = units.find((u) => u.symbol === fromCode)
  const compatibleUnits = fromUnit ? getCompatibleUnits(units, fromCode) : units

  // Reset 'to' when from changes if 'to' is same or empty
  useEffect(() => {
    if (!toCode || toCode === fromCode) {
      const others = compatibleUnits.filter((u) => u.symbol !== fromCode)
      setToCode(others[0]?.symbol || '')
    }
  }, [fromCode])

  // Debounce quantity input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQty(Number(inputQty) || 0)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputQty])

  const { data: conversion, isFetching } = useQuery({
    queryKey: ['convert', debouncedQty, fromCode, toCode],
    queryFn: () => convertUnits(debouncedQty, fromCode, toCode),
    enabled: debouncedQty > 0 && !!fromCode && !!toCode && fromCode !== toCode,
  })

  const handleSwap = useCallback(() => {
    setFromCode(toCode)
    setToCode(fromCode)
  }, [fromCode, toCode])

  const formatNum = (n: number) => {
    if (Number.isInteger(n) && Math.abs(n) < 1e9) return n.toString()
    return n.toLocaleString('en-IN', { maximumFractionDigits: 4, minimumFractionDigits: 0 })
  }

  const toUnit = units.find((u) => u.symbol === toCode)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Unit Converter</h3>
            <p className="text-xs text-gray-500 mt-0.5">Convert between compatible units</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5 mb-4">
          <label className="text-xs font-medium text-gray-500">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={inputQty}
            onChange={(e) => setInputQty(e.target.value)}
            className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all font-medium"
          />
        </div>

        {/* From / To Units */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-gray-500">From</label>
            <select
              value={fromCode}
              onChange={(e) => setFromCode(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat pr-9"
            >
              {compatibleUnits.map((u) => (
                <option key={u.id} value={u.symbol}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
            title="Swap units"
          >
            <ArrowLeftRight size={14} />
          </button>

          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-gray-500">To</label>
            <select
              value={toCode}
              onChange={(e) => setToCode(e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239ca3af%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_10px_center] bg-no-repeat pr-9"
            >
              {compatibleUnits.map((u) => (
                <option key={u.id} value={u.symbol}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compatibility note */}
        {compatibleUnits.length > 1 && (
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200">
              {compatibleUnits.length} compatible units
            </span>
          </div>
        )}

        {/* Result Card */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          {isFetching ? (
            <div className="flex items-center justify-center py-3">
              <RefreshCw size={18} className="text-gray-400 animate-spin" />
            </div>
          ) : conversion && fromUnit && toUnit ? (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Result</p>
              <p className="text-xl font-bold text-gray-900 tracking-tight">
                {formatNum(conversion.result)}{' '}
                <span className="text-sm font-medium text-gray-500">{toUnit.symbol}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                {formatNum(debouncedQty)} {fromUnit.symbol} = {formatNum(conversion.result)} {toUnit.symbol}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3">
              {!fromCode || !toCode
                ? 'Select units to convert'
                : fromCode === toCode
                ? 'Select different units'
                : 'Enter a quantity to convert'}
            </p>
          )}
        </div>

        {/* Quick reference: common conversions */}
        {units.length > 0 && fromUnit && (
          <div className="mt-3 px-4 py-2.5 rounded-lg border border-gray-100 bg-white">
            <p className="text-xs font-medium text-gray-500 mb-2">Quick Conversions</p>
            <div className="flex flex-wrap gap-1.5">
              {compatibleUnits
                .filter((u) => u.symbol !== fromCode)
                .slice(0, 4)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setToCode(u.symbol)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      toCode === u.symbol
                        ? 'border-primary/40 bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {u.symbol}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
