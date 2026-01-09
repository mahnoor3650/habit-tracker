import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/hooks/useAuth"

export type JournalEntry = {
	id: string
	user_id: string
	date: string // yyyy-mm-dd
	moods: string[]
	gratitude?: string[] | null
	highlight?: string | null
	quote?: string | null
	content?: string | null
	created_at?: string
	updated_at?: string
}

export type Quote = {
	content: string
	author: string
}

type JournalContextValue = {
	entries: JournalEntry[]
	loading: boolean
	error: string | null
	refresh: () => Promise<void>
	getEntryByDate: (date: string) => Promise<{ data?: JournalEntry; error?: string }>
	upsertEntry: (date: string, data: Partial<Omit<JournalEntry, "id" | "user_id" | "date" | "created_at" | "updated_at">>) => Promise<{ data?: JournalEntry; error?: string }>
	getEntriesForMonth: (year: number, month: number) => Promise<{ data?: JournalEntry[]; error?: string }>
	fetchRandomQuote: () => Promise<{ data?: Quote; error?: string }>
}

const JournalContext = createContext<JournalContextValue | undefined>(undefined)

export function JournalProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth()
	const [entries, setEntries] = useState<JournalEntry[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const userId = user?.id

	const fetchEntries = useCallback(async () => {
		if (!userId) return
		setLoading(true)
		setError(null)
		const { data, error } = await supabase
			.from("journal_entries")
			.select("*")
			.eq("user_id", userId)
			.order("date", { ascending: false })
		setLoading(false)
		if (error) {
			setError(error.message)
			return
		}
		setEntries(data ?? [])
	}, [userId])

	useEffect(() => {
		fetchEntries()
	}, [fetchEntries])

	const getEntryByDate = useCallback(async (date: string) => {
		if (!userId) return { error: "Not authenticated" }
		const { data, error } = await supabase
			.from("journal_entries")
			.select("*")
			.eq("user_id", userId)
			.eq("date", date)
			.maybeSingle()
		if (error) return { error: error.message }
		return { data: data as JournalEntry | undefined }
	}, [userId])

	const upsertEntry = useCallback(async (
		date: string,
		entryData: Partial<Omit<JournalEntry, "id" | "user_id" | "date" | "created_at" | "updated_at">>
	) => {
		if (!userId) return { error: "Not authenticated" }
		const { data, error } = await supabase
			.from("journal_entries")
			.upsert({
				user_id: userId,
				date,
				...entryData,
			}, {
				onConflict: "user_id,date",
			})
			.select("*")
			.single()
		if (error) return { error: error.message }
		
		// Update local state
		setEntries((prev) => {
			const existing = prev.find((e) => e.date === date)
			if (existing) {
				return prev.map((e) => (e.date === date ? { ...e, ...(data as JournalEntry) } : e))
			}
			return [data as JournalEntry, ...prev]
		})
		
		return { data: data as JournalEntry }
	}, [userId])

	const getEntriesForMonth = useCallback(async (year: number, month: number) => {
		if (!userId) return { error: "Not authenticated" }
		const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`
		const endDate = `${year}-${String(month + 1).padStart(2, "0")}-31`
		const { data, error } = await supabase
			.from("journal_entries")
			.select("*")
			.eq("user_id", userId)
			.gte("date", startDate)
			.lte("date", endDate)
			.order("date", { ascending: true })
		if (error) return { error: error.message }
		return { data: data as JournalEntry[] }
	}, [userId])

	const fetchRandomQuote = useCallback(async () => {
		try {
			const response = await fetch("https://api.quotable.io/random")
			if (!response.ok) throw new Error("Failed to fetch quote")
			const data = await response.json()
			return {
				data: {
					content: data.content,
					author: data.author,
				} as Quote,
			}
		} catch (err) {
			return { error: err instanceof Error ? err.message : "Failed to fetch quote" }
		}
	}, [])

	const value = useMemo<JournalContextValue>(
		() => ({
			entries,
			loading,
			error,
			refresh: fetchEntries,
			getEntryByDate,
			upsertEntry,
			getEntriesForMonth,
			fetchRandomQuote,
		}),
		[
			entries,
			loading,
			error,
			fetchEntries,
			getEntryByDate,
			upsertEntry,
			getEntriesForMonth,
			fetchRandomQuote,
		]
	)

	return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>
}

export function useJournal() {
	const ctx = useContext(JournalContext)
	if (!ctx) throw new Error("useJournal must be used within JournalProvider")
	return ctx
}
