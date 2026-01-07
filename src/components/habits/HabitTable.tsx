import React, { useEffect, useState } from "react"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import * as icons from "lucide-react"

type ViewMode = "week" | "15days" | "month"

type HabitTableProps = {
	onHabitClick: (habit: Habit) => void
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
	} else {
		const daysToShow = view === "week" ? 7 : 15
		for (let i = daysToShow - 1; i >= 0; i--) {
			const d = new Date(now)
			d.setDate(now.getDate() - i)
			dates.push(d)
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

export function HabitTable({ onHabitClick }: HabitTableProps) {
	const { habits, loading, getEntriesForHabit, toggleHabitEntry } = useHabits()
	const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, boolean>>>({})
	const [loadingEntries, setLoadingEntries] = useState(true)
	const [view, setView] = useState<ViewMode>("15days")

	const dates = getDatesForView(view)
	const today = formatDateISO(new Date())

	useEffect(() => {
		async function loadEntries() {
			setLoadingEntries(true)
			const map: Record<string, Record<string, boolean>> = {}
			for (const habit of habits) {
				const { data } = await getEntriesForHabit(habit.id, 31)
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
	}, [habits, getEntriesForHabit])

	async function handleToggle(habitId: string, date: string, e: React.MouseEvent) {
		e.stopPropagation()
		await toggleHabitEntry(habitId, date)
		setEntriesMap((prev) => ({
			...prev,
			[habitId]: {
				...prev[habitId],
				[date]: !prev[habitId]?.[date],
			},
		}))
	}

	function getIcon(iconName?: string | null) {
		if (!iconName) return null
		const IconComponent = (icons as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
		return IconComponent ? <IconComponent className="size-5" /> : null
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
			{/* View Switcher */}
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground mr-2">View:</span>
				<Button
					variant={view === "week" ? "default" : "outline"}
					size="sm"
					onClick={() => setView("week")}
					className="gap-2"
				>
					<Calendar className="size-4" />
					Week
				</Button>
				<Button
					variant={view === "15days" ? "default" : "outline"}
					size="sm"
					onClick={() => setView("15days")}
					className="gap-2"
				>
					<CalendarRange className="size-4" />
					15 Days
				</Button>
				<Button
					variant={view === "month" ? "default" : "outline"}
					size="sm"
					onClick={() => setView("month")}
					className="gap-2"
				>
					<CalendarDays className="size-4" />
					Month
				</Button>
			</div>

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
										<div className="size-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
											{getIcon(habit.icon) || <CalendarDays className="size-5" />}
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
