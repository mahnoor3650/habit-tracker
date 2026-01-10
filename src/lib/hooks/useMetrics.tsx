import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/useAuth"

export type Metric = {
	id: string
	user_id: string
	name: string
	description?: string | null
	unit?: string | null
	icon?: string | null
	color?: string | null
	order?: number | null
	created_at?: string
	updated_at?: string
}

export type MetricEntry = {
	id: string
	metric_id: string
	date: string // yyyy-mm-dd
	value: number
	created_at?: string
}

type MetricsContextValue = {
	metrics: Metric[]
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
	createMetric: (payload: { name: string; description?: string | null; unit?: string | null; icon?: string | null; color?: string | null }) => Promise<{ data?: Metric; error?: string }>
	updateMetric: (id: string, updates: Partial<Omit<Metric, "id" | "user_id">>) => Promise<{ data?: Metric; error?: string }>
	deleteMetric: (id: string) => Promise<{ error?: string }>
	reorderMetrics: (metricIds: string[]) => Promise<{ error?: string }>
	getEntriesForMetric: (metricId: string, startDateISO?: string, endDateISO?: string) => Promise<{ data?: Record<string, number>; error?: string }>
	upsertMetricEntry: (metricId: string, dateISO: string, value: number) => Promise<{ error?: string }>
}

const MetricsContext = createContext<MetricsContextValue | undefined>(undefined)

export function MetricsProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth()
	const [metrics, setMetrics] = useState<Metric[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const userId = user?.id

	const fetchMetrics = useCallback(async () => {
		if (!userId) return
		setLoading(true)
		setError(null)
		const { data, error } = await supabase
			.from("metrics")
			.select("*")
			.eq("user_id", userId)
			.order("order", { ascending: true, nullsFirst: false })
			.order("created_at", { ascending: true })
		setLoading(false)
		if (error) {
			setError(error.message)
			return
		}
		setMetrics(data ?? [])
	}, [userId])

	useEffect(() => {
		fetchMetrics()
	}, [fetchMetrics])

	const createMetric = useCallback(
		async (payload: { name: string; description?: string | null; unit?: string | null; icon?: string | null; color?: string | null }) => {
			if (!userId) return { error: "Not authenticated" }
			// Get max order value for this user
			const { data: existingMetrics } = await supabase
				.from("metrics")
				.select("order")
				.eq("user_id", userId)
				.order("order", { ascending: false, nullsFirst: false })
				.limit(1)
				.single()
			
			const maxOrder = existingMetrics?.order ?? -1
			const { data, error } = await supabase
				.from("metrics")
				.insert([{ user_id: userId, ...payload, order: maxOrder + 1 }])
				.select("*")
				.single()
			if (error) return { error: error.message }
			setMetrics((prev) => [...prev, data as Metric])
			return { data }
		},
		[userId]
	)

	const updateMetric = useCallback(async (id: string, updates: Partial<Omit<Metric, "id" | "user_id">>) => {
		const { data, error } = await supabase.from("metrics").update(updates).eq("id", id).select("*").single()
		if (error) return { error: error.message }
		setMetrics((prev) => prev.map((m) => (m.id === id ? (data as Metric) : m)))
		return { data }
	}, [])

	const deleteMetric = useCallback(async (id: string) => {
		const { error } = await supabase.from("metrics").delete().eq("id", id)
		if (error) return { error: error.message }
		setMetrics((prev) => prev.filter((m) => m.id !== id))
		return {}
	}, [])

	const reorderMetrics = useCallback(async (metricIds: string[]) => {
		if (!userId) return { error: "Not authenticated" }
		const updates = metricIds.map((id, index) => ({
			id,
			order: index,
		}))
		
		for (const update of updates) {
			const { error } = await supabase
				.from("metrics")
				.update({ order: update.order })
				.eq("id", update.id)
			if (error) return { error: error.message }
		}
		
		setMetrics((prev) => {
			const map = new Map(prev.map((m) => [m.id, m]))
			return metricIds.map((id) => map.get(id)!).filter(Boolean)
		})
		
		return {}
	}, [userId])

	const getEntriesForMetric = useCallback(async (metricId: string, startDateISO?: string, endDateISO?: string) => {
		let query = supabase
			.from("metric_entries")
			.select("*")
			.eq("metric_id", metricId)
		
		if (startDateISO) {
			query = query.gte("date", startDateISO)
		}
		
		if (endDateISO) {
			query = query.lte("date", endDateISO)
		}
		
		const { data, error } = await query
		if (error) return { error: error.message }
		const map: Record<string, number> = {}
		for (const entry of data ?? []) {
			map[entry.date] = Number(entry.value) || 0
		}
		return { data: map }
	}, [])

	const upsertMetricEntry = useCallback(async (metricId: string, dateISO: string, value: number) => {
		// Try to fetch existing entry
		const { data: existing } = await supabase
			.from("metric_entries")
			.select("*")
			.eq("metric_id", metricId)
			.eq("date", dateISO)
			.maybeSingle()

		if (existing) {
			const { error } = await supabase
				.from("metric_entries")
				.update({ value })
				.eq("id", existing.id)
			if (error) return { error: error.message }
			return {}
		} else {
			const { error } = await supabase
				.from("metric_entries")
				.insert([{ metric_id: metricId, date: dateISO, value }])
			if (error) return { error: error.message }
			return {}
		}
	}, [])

	const value = useMemo<MetricsContextValue>(
		() => ({
			metrics,
			loading,
			error,
			refresh: fetchMetrics,
			createMetric,
			updateMetric,
			deleteMetric,
			reorderMetrics,
			getEntriesForMetric,
			upsertMetricEntry,
		}),
		[
			metrics,
			loading,
			error,
			fetchMetrics,
			createMetric,
			updateMetric,
			deleteMetric,
			reorderMetrics,
			getEntriesForMetric,
			upsertMetricEntry,
		]
	)

	return <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
}

export function useMetrics() {
	const ctx = useContext(MetricsContext)
	if (!ctx) {
		throw new Error("useMetrics must be used within MetricsProvider")
	}
	return ctx
}
