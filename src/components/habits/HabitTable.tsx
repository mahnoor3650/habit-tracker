import { useEffect, useState } from "react"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CalendarDays, GripVertical } from "lucide-react"
import * as icons from "lucide-react"
import { toast } from "sonner"
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

export type ViewMode = "week" | "15days" | "month" | "custom"

type HabitTableProps = {
	onHabitClick: (habit: Habit) => void
	view: ViewMode
	dates?: Date[]
	startDate?: string
	endDate?: string
	onReorder?: (habitIds: string[]) => void
	habits?: Habit[]
}

function getDatesForView(view: ViewMode, customDates?: Date[], startDateStr?: string, endDateStr?: string): Date[] {
	if (customDates && customDates.length > 0) {
		return customDates
	}
	
	if (view === "custom" && startDateStr && endDateStr) {
		const start = new Date(startDateStr)
		const end = new Date(endDateStr)
		const dates: Date[] = []
		const current = new Date(start)
		while (current <= end) {
			dates.push(new Date(current))
			current.setDate(current.getDate() + 1)
		}
		return dates
	}
	
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

function SortableHabitRow({
	habit,
	dates,
	entriesMap,
	today,
	onHabitClick,
	onToggle,
	getIcon,
	index,
}: {
	habit: Habit
	dates: Date[]
	entriesMap: Record<string, Record<string, boolean>>
	today: string
	onHabitClick: (habit: Habit) => void
	onToggle: (habitId: string, date: string, e: React.MouseEvent) => void
	getIcon: (iconName?: string | null) => React.ReactNode
	index: number
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: habit.id,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<tr
			ref={setNodeRef}
			style={style}
			className={`border-b hover:bg-accent/30 cursor-pointer transition-colors ${
				index % 2 === 1 ? "bg-muted/10" : ""
			} ${isDragging ? "z-50" : ""}`}
			onClick={() => onHabitClick(habit)}
		>
			<td className="p-5 sticky left-0 bg-card hover:bg-accent/30 z-10 border-r transition-colors">
				<div className="flex items-center gap-4">
					<button
						{...attributes}
						{...listeners}
						className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
						onClick={(e) => e.stopPropagation()}
					>
						<GripVertical className="size-4" />
					</button>
					<div className="size-12 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
						{getIcon(habit.icon) || <span className="text-2xl">📅</span>}
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
            className={`p-4 text-center min-w-[150px] transition-colors ${
              isToday ? "bg-primary/15" : isWeekend ? "bg-muted/20" : ""
            }`}
            onClick={(e) => onToggle(habit.id, dateStr, e)}
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
        );
			})}
		</tr>
	)
}

function formatDateISO(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function formatDayShort(date: Date): string {
	return date.getDate().toString()
}

function formatDayHeader(date: Date): string {
	return date.toLocaleDateString("en-US", { weekday: "long" })
}

export function HabitTable({ onHabitClick, view, dates: customDates, startDate, endDate, onReorder, habits: propHabits }: HabitTableProps) {
	const { habits: contextHabits, loading, getEntriesForHabit, toggleHabitEntry, reorderHabits } = useHabits()
	const habits = propHabits ?? contextHabits
	const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, boolean>>>({})
	const [loadingEntries, setLoadingEntries] = useState(true)
	const [sortedHabits, setSortedHabits] = useState<Habit[]>([])

	const dates = getDatesForView(view, customDates, startDate, endDate)
	const today = formatDateISO(new Date())

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	useEffect(() => {
		setSortedHabits(habits)
	}, [habits])

	useEffect(() => {
		async function loadEntries() {
			setLoadingEntries(true)
			const map: Record<string, Record<string, boolean>> = {}
			
			// Calculate start and end dates
			let startDateISO: string | undefined
			let endDateISO: string | undefined
			
			if (view === "custom" && startDate && endDate) {
				startDateISO = startDate
				endDateISO = endDate
			} else if (dates.length > 0) {
				startDateISO = formatDateISO(dates[0])
				endDateISO = formatDateISO(dates[dates.length - 1])
			} else {
				// Fallback to default calculation
				const now = new Date()
				if (view === "month") {
					startDateISO = formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1))
					endDateISO = formatDateISO(new Date(now.getFullYear(), now.getMonth() + 1, 0))
				} else if (view === "week") {
					const currentDay = now.getDay()
					const startOfWeek = new Date(now)
					startOfWeek.setDate(now.getDate() - currentDay)
					startOfWeek.setHours(0, 0, 0, 0)
					startDateISO = formatDateISO(startOfWeek)
					const endOfWeek = new Date(startOfWeek)
					endOfWeek.setDate(startOfWeek.getDate() + 6)
					endDateISO = formatDateISO(endOfWeek)
				} else if (view === "15days") {
					const today = new Date(now)
					today.setHours(0, 0, 0, 0)
					startDateISO = formatDateISO(today)
					const end = new Date(today)
					end.setDate(today.getDate() + 14)
					endDateISO = formatDateISO(end)
				}
			}
			
			if (startDateISO && endDateISO) {
				for (const habit of sortedHabits) {
					const { data } = await getEntriesForHabit(habit.id, dates.length, startDateISO, endDateISO)
					map[habit.id] = data ?? {}
				}
			}
			setEntriesMap(map)
			setLoadingEntries(false)
		}
		if (sortedHabits.length > 0 && dates.length > 0) {
			loadEntries()
		} else {
			setLoadingEntries(false)
		}
	}, [sortedHabits, getEntriesForHabit, view, dates, startDate, endDate])

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		
		if (over && active.id !== over.id) {
			const oldIndex = sortedHabits.findIndex((h) => h.id === active.id)
			const newIndex = sortedHabits.findIndex((h) => h.id === over.id)
			
			const newHabits = arrayMove(sortedHabits, oldIndex, newIndex)
			setSortedHabits(newHabits)
			
			const habitIds = newHabits.map((h) => h.id)
			if (onReorder) {
				onReorder(habitIds)
			} else {
				await reorderHabits(habitIds)
			}
		}
	}

	async function handleToggle(habitId: string, date: string, e: React.MouseEvent) {
		e.stopPropagation()
		const habit = sortedHabits.find((h) => h.id === habitId)
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

	if (sortedHabits.length === 0) {
		return (
			<div className="text-center py-16 bg-card rounded-xl border">
				<CalendarDays className="size-12 mx-auto text-muted-foreground mb-4" />
				<p className="text-muted-foreground text-lg">No habits yet. Create your first one!</p>
			</div>
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<div className="space-y-4">
				{/* Table */}
				<div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b bg-muted/30">
								<th className="text-left p-5 font-semibold sticky left-0 bg-muted/30 z-10 min-w-[300px] border-r">
									Habits
								</th>
								{dates.map((date) => {
									const dateStr = formatDateISO(date)
									const isToday = dateStr === today
									const isWeekend = date.getDay() === 0 || date.getDay() === 6
									return (
										<th
											key={dateStr}
											className={`p-4 text-center font-normal min-w-[120px] transition-colors ${
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
							<SortableContext
								items={sortedHabits.map((h) => h.id)}
								strategy={verticalListSortingStrategy}
							>
								{sortedHabits.map((habit, idx) => (
									<SortableHabitRow
										key={habit.id}
										habit={habit}
										dates={dates}
										entriesMap={entriesMap}
										today={today}
										onHabitClick={onHabitClick}
										onToggle={handleToggle}
										getIcon={getIcon}
										index={idx}
									/>
								))}
							</SortableContext>
						</tbody>
					</table>
				</div>
			</div>
		</DndContext>
	)
}
