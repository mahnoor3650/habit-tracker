import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/useAuth"

export type Habit = {
	id: string
	user_id: string
	name: string
	description?: string | null
	color?: string | null
	icon?: string | null
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

export function getLastNDates(n: number): string[] {
	const dates: string[] = []
	const today = new Date()
	for (let i = 0; i < n; i++) {
		const d = new Date(today)
		d.setDate(today.getDate() - i)
		dates.push(d.toISOString().slice(0, 10))
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

export function useHabits() {
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
		async (payload: { name: string; description?: string | null; color?: string | null; icon?: string | null }) => {
			if (!userId) return { error: "Not authenticated" }
			const { data, error } = await supabase
				.from("habits")
				.insert([{ user_id: userId, ...payload }])
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

	const getEntriesForHabit = useCallback(async (habitId: string, days = 30) => {
		const startDate = getLastNDates(days)[0]
		const { data, error } = await supabase
			.from("habit_entries")
			.select("*")
			.eq("habit_id", habitId)
			.gte("date", startDate)
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

	return useMemo(
		() => ({
			habits,
			loading,
			error,
			refresh: fetchHabits,
			createHabit,
			updateHabit,
			deleteHabit,
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
			getEntriesForHabit,
			toggleHabitEntry,
			getHabitStreak,
		]
	)
}


