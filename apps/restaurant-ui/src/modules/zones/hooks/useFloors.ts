import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'restaurant-floors'

export interface FloorDefinition {
  level: number
  label: string
}

const DEFAULT_FLOORS: FloorDefinition[] = [
  { level: 0, label: 'Ground Floor' },
  { level: 1, label: 'First Floor' },
  { level: 2, label: 'Second Floor' },
  { level: 3, label: 'Third Floor' },
  { level: 4, label: 'Fourth Floor' },
  { level: 5, label: 'Rooftop' },
]

function loadFloors(): FloorDefinition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_FLOORS
}

function saveFloors(floors: FloorDefinition[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(floors))
}

export function useFloors() {
  const [floors, setFloors] = useState<FloorDefinition[]>(loadFloors)

  useEffect(() => { saveFloors(floors) }, [floors])

  const addFloor = useCallback((level: number, label: string) => {
    setFloors((prev) => {
      if (prev.some((f) => f.level === level)) return prev
      return [...prev, { level, label }].sort((a, b) => a.level - b.level)
    })
  }, [])

  const renameFloor = useCallback((level: number, label: string) => {
    setFloors((prev) => prev.map((f) => (f.level === level ? { ...f, label } : f)))
  }, [])

  const removeFloor = useCallback((level: number) => {
    setFloors((prev) => prev.filter((f) => f.level !== level))
  }, [])

  const getFloorLabel = useCallback(
    (level: number) => floors.find((f) => f.level === level)?.label || `Floor ${level}`,
    [floors],
  )

  const nextLevel = floors.length > 0 ? floors[floors.length - 1].level + 1 : 0

  return { floors, addFloor, renameFloor, removeFloor, getFloorLabel, nextLevel }
}
