import { useEffect, useState } from "react"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CalendarDays } from "lucide-react"
import * as icons from "lucide-react"
import { toast } from "sonner"

export type ViewMode = "week" | "15days" | "month"

type HabitTableProps = {
	onHabitClick: (habit: Habit) => void
	view: ViewMode
}

function getDatesForView(view: ViewMode): Date[] {
	const now = new Date()
	const dates: Date[] = []

	if (view === "month") {
		const year = now.getFullYear()
		const month = now.getMonth()
		const daysInMonth = new Date(year, month + 1, 0).getDate()
		for (let day = 1; day <= daysInMonth; day++) {
			dates.push(new Date(year, month, day))
		}
	} else if (view === "week") {
		// Show current week (Sunday to Saturday)
		const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
		const startOfWeek = new Date(now)
		startOfWeek.setDate(now.getDate() - currentDay) // Go back to Sunday
		startOfWeek.setHours(0, 0, 0, 0)
		
		for (let i = 0; i < 7; i++) {
			const date = new Date(startOfWeek)
			date.setDate(startOfWeek.getDate() + i)
			dates.push(date)
		}
	} else if (view === "15days") {
		// Show 15 days starting from today (today + next 14 days)
		const today = new Date(now)
		today.setHours(0, 0, 0, 0)
		
		for (let i = 0; i < 15; i++) {
			const date = new Date(today)
			date.setDate(today.getDate() + i)
			dates.push(date)
		}
	}

	return dates
}

function formatDateISO(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function formatDayShort(date: Date): string {
	return date.getDate().toString()
}

function formatDayHeader(date: Date): string {
	return date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2)
}

export function HabitTable({ onHabitClick, view }: HabitTableProps) {
	const { habits, loading, getEntriesForHabit, toggleHabitEntry } = useHabits()
	const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, boolean>>>({})
	const [loadingEntries, setLoadingEntries] = useState(true)

	const dates = getDatesForView(view)
	const today = formatDateISO(new Date())

	useEffect(() => {
		async function loadEntries() {
			setLoadingEntries(true)
			const map: Record<string, Record<string, boolean>> = {}
			
			// Calculate start date based on view
			let startDate: string | undefined
			let daysToFetch: number
			
			if (view === "month") {
				// For month view, fetch from the first day of the current month
				const now = new Date()
				startDate = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
				daysToFetch = 31
			} else if (view === "week") {
				// For week view, fetch from the first day of the current week (Sunday)
				const now = new Date()
				const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday
				const startOfWeek = new Date(now)
				startOfWeek.setDate(now.getDate() - currentDay) // Go back to Sunday
				startOfWeek.setHours(0, 0, 0, 0)
				startDate = formatDateISO(startOfWeek)
				daysToFetch = 7
			} else if (view === "15days") {
				// For 15 days view, fetch from today
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				startDate = formatDateISO(today)
				daysToFetch = 15
			} else {
				daysToFetch = 7
			}
			
			for (const habit of habits) {
				// Fetch entries for the specific date range
				const { data } = await getEntriesForHabit(habit.id, daysToFetch, startDate)
				map[habit.id] = data ?? {}
			}
			setEntriesMap(map)
			setLoadingEntries(false)
		}
		if (habits.length > 0) {
			loadEntries()
		} else {
			setLoadingEntries(false)
		}
	}, [habits, getEntriesForHabit, view])

	async function handleToggle(habitId: string, date: string, e: React.MouseEvent) {
		e.stopPropagation()
		const habit = habits.find((h) => h.id === habitId)
		const wasChecked = entriesMap[habitId]?.[date] || false
		const result = await toggleHabitEntry(habitId, date)
		
		if (result.error) {
			toast.error(result.error)
			return
		}
		
		setEntriesMap((prev) => ({
			...prev,
			[habitId]: {
				...prev[habitId],
				[date]: !prev[habitId]?.[date],
			},
		}))
		
		const habitName = habit?.name || "Habit"
		const dateStr = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
		
		if (wasChecked) {
			toast.info(`${habitName} unchecked for ${dateStr}`)
		} else {
			toast.success(`${habitName} checked for ${dateStr}! 🎉`)
		}
	}

	function getIcon(iconName?: string | null) {
		// If it's an emoji (not a lucide icon name), return it directly
		if (iconName && /[\p{Emoji}\u200d]/u.test(iconName)) {
			return <span className="text-2xl">{iconName}</span>
		}
		// Fallback to lucide icon if it's a string name (for backwards compatibility)
		if (iconName) {
			const IconComponent = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
			return IconComponent ? <IconComponent className="size-5" /> : null
		}
		return null
	}

	if (loading || loadingEntries) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		)
	}

	if (habits.length === 0) {
		return (
			<div className="text-center py-16 bg-card rounded-xl border">
				<CalendarDays className="size-12 mx-auto text-muted-foreground mb-4" />
				<p className="text-muted-foreground text-lg">No habits yet. Create your first one!</p>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Table */}
			<div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
				<table className="w-full border-collapse">
					<thead>
						<tr className="border-b bg-muted/30">
							<th className="text-left p-5 font-semibold sticky left-0 bg-muted/30 z-10 min-w-[280px] border-r">
								Habit
							</th>
							{dates.map((date) => {
								const dateStr = formatDateISO(date)
								const isToday = dateStr === today
								const isWeekend = date.getDay() === 0 || date.getDay() === 6
								return (
									<th
										key={dateStr}
										className={`p-4 text-center font-normal min-w-[60px] transition-colors ${
											isToday
												? "bg-primary/15"
												: isWeekend
												? "bg-muted/20"
												: ""
										}`}
									>
										<div className="flex flex-col items-center gap-1">
											<span className={`text-xs ${isWeekend ? "text-primary/70" : "text-muted-foreground"}`}>
												{formatDayHeader(date)}
											</span>
											<span className={`text-sm ${isToday ? "font-bold text-primary" : ""}`}>
												{formatDayShort(date)}
											</span>
										</div>
									</th>
								)
							})}
						</tr>
					</thead>
					<tbody>
						{habits.map((habit, idx) => (
							<tr
								key={habit.id}
								className={`border-b hover:bg-accent/30 cursor-pointer transition-colors ${
									idx % 2 === 1 ? "bg-muted/10" : ""
								}`}
								onClick={() => onHabitClick(habit)}
							>
								<td className="p-5 sticky left-0 bg-card hover:bg-accent/30 z-10 border-r transition-colors">
									<div className="flex items-center gap-4">
										<div className="size-12 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
											{getIcon(habit.icon) || (
												<span className="text-2xl">📅</span>
											)}
										</div>
										<div>
											<div className="font-medium text-base">{habit.name}</div>
											{habit.description && (
												<div className="text-sm text-muted-foreground mt-0.5">
													{habit.description}
												</div>
											)}
										</div>
									</div>
								</td>
								{dates.map((date) => {
									const dateStr = formatDateISO(date)
									const isChecked = entriesMap[habit.id]?.[dateStr] ?? false
									const isToday = dateStr === today
									const isWeekend = date.getDay() === 0 || date.getDay() === 6
									return (
										<td
											key={dateStr}
											className={`p-4 text-center transition-colors ${
												isToday
													? "bg-primary/15"
													: isWeekend
													? "bg-muted/20"
													: ""
											}`}
											onClick={(e) => handleToggle(habit.id, dateStr, e)}
										>
											<div className="flex items-center justify-center">
												<Checkbox
													checked={isChecked}
													className={`cursor-pointer size-6 rounded-md transition-all ${
														isChecked
															? "bg-primary border-primary data-[state=checked]:bg-primary"
															: "border-2 border-muted-foreground/30 hover:border-primary/50"
													}`}
												/>
											</div>
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}
