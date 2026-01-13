import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/useAuth"

export type Habit = {
	id: string
	user_id: string
	name: string
	description?: string | null
	color?: string | null
	icon?: string | null
	category?: string | null
	order?: number | null
	created_at?: string
	updated_at?: string
}

export type HabitEntry = {
	id: string
	habit_id: string
	date: string // yyyy-mm-dd
	completed: boolean
	created_at?: string
}

function formatDateISO(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function getLastNDates(n: number): string[] {
	const dates: string[] = []
	const today = new Date()
	for (let i = 0; i < n; i++) {
		const d = new Date(today)
		d.setDate(today.getDate() - i)
		dates.push(formatDateISO(d))
	}
	return dates.reverse()
}

export function calculateStreak(entriesByDate: Record<string, boolean>): number {
	let streak = 0
	const days = getLastNDates(30).reverse() // start from today backwards
	for (const date of days) {
		if (entriesByDate[date]) streak++
		else break
	}
	return streak
}

export function calculateCompletionPercent(entriesByDate: Record<string, boolean>): number {
	const days = getLastNDates(30)
	const completed = days.filter((d) => entriesByDate[d]).length
	return Math.round((completed / days.length) * 100)
}

export function calculateConsistencyScore(entriesByDate: Record<string, boolean>, days: number = 30): number {
	const dates = getLastNDates(days)
	if (dates.length === 0) return 0
	
	const completed = dates.filter((d) => entriesByDate[d]).length
	const total = dates.length
	
	// Calculate variance in completion patterns
	const dayOfWeekCounts: Record<number, { total: number; completed: number }> = {}
	dates.forEach((dateStr) => {
		const date = new Date(dateStr)
		const dayOfWeek = date.getDay()
		if (!dayOfWeekCounts[dayOfWeek]) {
			dayOfWeekCounts[dayOfWeek] = { total: 0, completed: 0 }
		}
		dayOfWeekCounts[dayOfWeek].total++
		if (entriesByDate[dateStr]) {
			dayOfWeekCounts[dayOfWeek].completed++
		}
	})
	
	// Calculate consistency: lower variance = higher consistency
	const dayCompletionRates = Object.values(dayOfWeekCounts).map(
		(d) => d.total > 0 ? d.completed / d.total : 0
	)
	
	if (dayCompletionRates.length === 0) return 0
	
	const avgRate = dayCompletionRates.reduce((a, b) => a + b, 0) / dayCompletionRates.length
	const variance = dayCompletionRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / dayCompletionRates.length
	
	// Consistency score: 0-100, higher is more consistent
	// Base score from completion rate (70% weight) + consistency bonus (30% weight)
	const completionScore = (completed / total) * 70
	const consistencyBonus = Math.max(0, (1 - variance) * 30)
	
	return Math.round(completionScore + consistencyBonus)
}

export function getBestWorstDays(entriesByDate: Record<string, boolean>, startDate?: string, endDate?: string): { best: number[]; worst: number[] } {
	let dates: string[]
	if (startDate && endDate) {
		const start = new Date(startDate)
		const end = new Date(endDate)
		dates = []
		const current = new Date(start)
		while (current <= end) {
			dates.push(formatDateISO(current))
			current.setDate(current.getDate() + 1)
		}
	} else {
		dates = getLastNDates(30)
	}
	const dayOfWeekCounts: Record<number, { total: number; completed: number }> = {}
	
	dates.forEach((dateStr) => {
		const date = new Date(dateStr)
		const dayOfWeek = date.getDay()
		if (!dayOfWeekCounts[dayOfWeek]) {
			dayOfWeekCounts[dayOfWeek] = { total: 0, completed: 0 }
		}
		dayOfWeekCounts[dayOfWeek].total++
		if (entriesByDate[dateStr]) {
			dayOfWeekCounts[dayOfWeek].completed++
		}
	})
	
	const dayRates: Array<{ day: number; rate: number }> = []
	for (let day = 0; day < 7; day++) {
		const counts = dayOfWeekCounts[day] || { total: 0, completed: 0 }
		const rate = counts.total > 0 ? counts.completed / counts.total : 0
		dayRates.push({ day, rate })
	}
	
	dayRates.sort((a, b) => b.rate - a.rate)
	
	const bestRate = dayRates[0]?.rate ?? 0
	const worstRate = dayRates[dayRates.length - 1]?.rate ?? 0
	
	const best = dayRates.filter((d) => Math.abs(d.rate - bestRate) < 0.01).map((d) => d.day)
	const worst = dayRates.filter((d) => Math.abs(d.rate - worstRate) < 0.01).map((d) => d.day)
	
	return { best, worst }
}

type HabitsContextValue = {
	habits: Habit[]
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
	createHabit: (payload: { name: string; description?: string | null; color?: string | null; icon?: string | null; category?: string | null }) => Promise<{ data?: Habit; error?: string }>
	updateHabit: (id: string, updates: Partial<Omit<Habit, "id" | "user_id">>) => Promise<{ data?: Habit; error?: string }>
	deleteHabit: (id: string) => Promise<{ error?: string }>
	reorderHabits: (habitIds: string[]) => Promise<{ error?: string }>
	getEntriesForHabit: (habitId: string, days?: number, startDateISO?: string, endDateISO?: string) => Promise<{ data?: Record<string, boolean>; error?: string }>
	toggleHabitEntry: (habitId: string, dateISO: string) => Promise<{ error?: string }>
	getHabitStreak: (habitId: string) => Promise<{ data?: number; error?: string }>
}

const HabitsContext = createContext<HabitsContextValue | undefined>(undefined)

export function HabitsProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth()
	const [habits, setHabits] = useState<Habit[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const userId = user?.id

	const fetchHabits = useCallback(async () => {
		if (!userId) return
		setLoading(true)
		setError(null)
		const { data, error } = await supabase
			.from("habits")
			.select("*")
			.eq("user_id", userId)
			.order("order", { ascending: true, nullsFirst: false })
			.order("created_at", { ascending: true })
		setLoading(false)
		if (error) {
			setError(error.message)
			return
		}
		setHabits(data ?? [])
	}, [userId])

	useEffect(() => {
		fetchHabits()
	}, [fetchHabits])

	const createHabit = useCallback(
		async (payload: { name: string; description?: string | null; color?: string | null; icon?: string | null; category?: string | null }) => {
			if (!userId) return { error: "Not authenticated" }
			// Get max order value for this user
			const { data: existingHabits } = await supabase
				.from("habits")
				.select("order")
				.eq("user_id", userId)
				.order("order", { ascending: false, nullsFirst: false })
				.limit(1)
				.single()
			
			const maxOrder = existingHabits?.order ?? -1
			const { data, error } = await supabase
				.from("habits")
				.insert([{ user_id: userId, ...payload, order: maxOrder + 1 }])
				.select("*")
				.single()
			if (error) return { error: error.message }
			setHabits((prev) => [...prev, data as Habit])
			return { data }
		},
		[userId]
	)

	const updateHabit = useCallback(async (id: string, updates: Partial<Omit<Habit, "id" | "user_id">>) => {
		const { data, error } = await supabase.from("habits").update(updates).eq("id", id).select("*").single()
		if (error) return { error: error.message }
		setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...(data as Habit) } : h)))
		return { data }
	}, [])

	const deleteHabit = useCallback(async (id: string) => {
		const { error } = await supabase.from("habits").delete().eq("id", id)
		if (error) return { error: error.message }
		setHabits((prev) => prev.filter((h) => h.id !== id))
		return {}
	}, [])

	const reorderHabits = useCallback(async (habitIds: string[]) => {
		// Update order for all habits in the new order
		const updates = habitIds.map((id, index) => ({
			id,
			order: index,
		}))
		
		for (const update of updates) {
			const { error } = await supabase
				.from("habits")
				.update({ order: update.order })
				.eq("id", update.id)
			if (error) return { error: error.message }
		}
		
		// Update local state
		setHabits((prev) => {
			const habitMap = new Map(prev.map((h) => [h.id, h]))
			return habitIds.map((id) => habitMap.get(id)!).filter(Boolean)
		})
		
		return {}
	}, [])

	const getEntriesForHabit = useCallback(async (habitId: string, days = 30, startDateISO?: string, endDateISO?: string) => {
		let startDate: string
		if (startDateISO) {
			// Use the provided start date (e.g., first day of current month)
			startDate = startDateISO
		} else {
			// Default: get last N days from today
			startDate = getLastNDates(days)[0]
		}
		
		let query = supabase
			.from("habit_entries")
			.select("*")
			.eq("habit_id", habitId)
			.gte("date", startDate)
		
		if (endDateISO) {
			query = query.lte("date", endDateISO)
		}
		
		const { data, error } = await query
		if (error) return { error: error.message }
		const map: Record<string, boolean> = {}
		for (const entry of data ?? []) {
			map[entry.date] = !!entry.completed
		}
		return { data: map }
	}, [])

	const toggleHabitEntry = useCallback(async (habitId: string, dateISO: string) => {
		// Try to fetch existing entry
		const { data: existing } = await supabase
			.from("habit_entries")
			.select("*")
			.eq("habit_id", habitId)
			.eq("date", dateISO)
			.maybeSingle()

		if (existing) {
			const { error } = await supabase
				.from("habit_entries")
				.update({ completed: !existing.completed })
				.eq("id", existing.id)
			if (error) return { error: error.message }
			return {}
		} else {
			const { error } = await supabase
				.from("habit_entries")
				.insert([{ habit_id: habitId, date: dateISO, completed: true }])
			if (error) return { error: error.message }
			return {}
		}
	}, [])

	const getHabitStreak = useCallback(async (habitId: string) => {
		const { data: map, error } = await getEntriesForHabit(habitId)
		if (error) return { error }
		const streak = calculateStreak(map!)
		return { data: streak }
	}, [getEntriesForHabit])

	const value = useMemo<HabitsContextValue>(
		() => ({
			habits,
			loading,
			error,
			refresh: fetchHabits,
			createHabit,
			updateHabit,
			deleteHabit,
			reorderHabits,
			getEntriesForHabit,
			toggleHabitEntry,
			getHabitStreak,
		}),
		[
			habits,
			loading,
			error,
			fetchHabits,
			createHabit,
			updateHabit,
			deleteHabit,
			reorderHabits,
			getEntriesForHabit,
			toggleHabitEntry,
			getHabitStreak,
		]
	)

	return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits() {
	const ctx = useContext(HabitsContext)
	if (!ctx) throw new Error("useHabits must be used within HabitsProvider")
	return ctx
}


