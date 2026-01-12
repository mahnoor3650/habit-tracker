import { useEffect, useState } from "react"
import { useMetrics } from "@/lib/hooks/useMetrics"
import type { Metric } from "@/lib/hooks/useMetrics"
import { Input } from "@/components/ui/input"
import { Loader2, GripVertical } from "lucide-react"
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

type MetricsTableProps = {
	onMetricClick: (metric: Metric) => void
	view: ViewMode
	dates?: Date[]
	startDate?: string
	endDate?: string
	onReorder?: (metricIds: string[]) => void
	metrics?: Metric[]
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
		const currentDay = now.getDay()
		const startOfWeek = new Date(now)
		startOfWeek.setDate(now.getDate() - currentDay)
		startOfWeek.setHours(0, 0, 0, 0)
		
		for (let i = 0; i < 7; i++) {
			const date = new Date(startOfWeek)
			date.setDate(startOfWeek.getDate() + i)
			dates.push(date)
		}
	} else if (view === "15days") {
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
	return date.toLocaleDateString("en-US", { weekday: "long" })
}

function SortableMetricRow({
	metric,
	dates,
	entriesMap,
	onMetricClick,
	onValueChange,
	getIcon,
}: {
	metric: Metric
	dates: Date[]
	entriesMap: Record<string, number>
	onMetricClick: (metric: Metric) => void
	onValueChange: (metricId: string, date: string, value: number) => void
	getIcon: (iconName?: string | null) => React.ReactNode
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	}

	return (
		<tr
			ref={setNodeRef}
			style={style}
			className="border-b hover:bg-muted/50 transition-colors"
		>
			<td className="sticky left-0 bg-background z-10 min-w-[200px] sm:min-w-[250px] md:min-w-[300px] border-r p-3 sm:p-4">
				<div className="flex items-center gap-2">
					<button
						{...attributes}
						{...listeners}
						className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
						type="button"
					>
						<GripVertical className="size-3 sm:size-4" />
					</button>
					<button
						type="button"
						onClick={() => onMetricClick(metric)}
						className="flex items-center gap-2 flex-1 text-left hover:underline min-w-0"
					>
						{getIcon(metric.icon)}
						<div className="flex flex-col items-start min-w-0 flex-1">
							<span className="font-medium text-sm sm:text-base truncate w-full">{metric.name}</span>
							{metric.unit && (
								<span className="text-xs text-muted-foreground">{metric.unit}</span>
							)}
						</div>
					</button>
				</div>
			</td>
			{dates.map((date) => {
				const dateStr = formatDateISO(date)
				const value = entriesMap[dateStr] ?? 0
				const isToday = dateStr === formatDateISO(new Date())
				const isWeekend = date.getDay() === 0 || date.getDay() === 6
				
				return (
					<td
						key={dateStr}
						className={`text-center p-2 sm:p-3 md:p-4 min-w-[80px] sm:min-w-[100px] md:min-w-[120px] transition-colors ${
							isToday ? "bg-primary/15" : isWeekend ? "bg-muted/20" : ""
						}`}
					>
						<Input
							type="number"
							step="1"
							min="0"
							value={value || ""}
							onChange={(e) => {
								const newValue = parseFloat(e.target.value) || 0
								onValueChange(metric.id, dateStr, newValue)
							}}
							className="w-full h-7 sm:h-8 text-center text-xs sm:text-sm"
							placeholder="0"
						/>
					</td>
				)
			})}
		</tr>
	)
}

export function MetricsTable({ onMetricClick, view, dates: customDates, startDate, endDate, onReorder, metrics: propMetrics }: MetricsTableProps) {
	const { metrics: contextMetrics, loading, getEntriesForMetric, upsertMetricEntry, reorderMetrics } = useMetrics()
	const metrics = propMetrics ?? contextMetrics
	const [entriesMap, setEntriesMap] = useState<Record<string, Record<string, number>>>({})
	const [loadingEntries, setLoadingEntries] = useState(true)
	const [sortedMetrics, setSortedMetrics] = useState<Metric[]>([])

	const dates = getDatesForView(view, customDates, startDate, endDate)
	const today = formatDateISO(new Date())

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	useEffect(() => {
		setSortedMetrics(metrics)
	}, [metrics])

	useEffect(() => {
		async function loadEntries() {
			setLoadingEntries(true)
			const map: Record<string, Record<string, number>> = {}
			
			// Calculate start and end dates
			let startDateISO: string | undefined
			let endDateISO: string | undefined
			
			if (view === "custom" && startDate && endDate) {
				startDateISO = startDate
				endDateISO = endDate
			} else if (dates.length > 0) {
				startDateISO = formatDateISO(dates[0])
				endDateISO = formatDateISO(dates[dates.length - 1])
			}
			
			if (startDateISO && endDateISO) {
				for (const metric of sortedMetrics) {
					const { data } = await getEntriesForMetric(metric.id, startDateISO, endDateISO)
					map[metric.id] = data ?? {}
				}
			}
			setEntriesMap(map)
			setLoadingEntries(false)
		}
		if (sortedMetrics.length > 0 && dates.length > 0) {
			loadEntries()
		} else {
			setLoadingEntries(false)
		}
	}, [sortedMetrics, getEntriesForMetric, view, dates, startDate, endDate])

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		
		if (over && active.id !== over.id) {
			const oldIndex = sortedMetrics.findIndex((m) => m.id === active.id)
			const newIndex = sortedMetrics.findIndex((m) => m.id === over.id)
			
			const newMetrics = arrayMove(sortedMetrics, oldIndex, newIndex)
			setSortedMetrics(newMetrics)
			
			const metricIds = newMetrics.map((m) => m.id)
			if (onReorder) {
				onReorder(metricIds)
			} else {
				const result = await reorderMetrics(metricIds)
				if (result.error) {
					toast.error(result.error)
				}
			}
		}
	}

	async function handleValueChange(metricId: string, dateStr: string, value: number) {
		// Update local state immediately
		setEntriesMap((prev) => ({
			...prev,
			[metricId]: {
				...prev[metricId],
				[dateStr]: value,
			},
		}))

		// Save to database
		const result = await upsertMetricEntry(metricId, dateStr, value)
		
		if (result.error) {
			toast.error(`Failed to save: ${result.error}`)
			// Revert local state on error
			setEntriesMap((prev) => ({
				...prev,
				[metricId]: {
					...prev[metricId],
					[dateStr]: prev[metricId]?.[dateStr] ?? 0,
				},
			}))
		}
	}

	function getIcon(iconName?: string | null) {
		// If it's an emoji (not a lucide icon name), return it directly
		if (iconName && /[\p{Emoji}\u200d]/u.test(iconName)) {
			return <span className="text-xl">{iconName}</span>
		}
		// Fallback to lucide icon if it's a string name
		if (iconName) {
			const IconComponent = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
			return IconComponent ? <IconComponent className="size-5" /> : null
		}
		return null
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		)
	}

	if (sortedMetrics.length === 0) {
		return (
			<div className="text-center py-16 bg-card rounded-xl border">
				<p className="text-muted-foreground text-lg">No metrics yet. Create your first one!</p>
			</div>
		)
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<div className="space-y-4">
				<div className="w-full overflow-x-auto border rounded-xl bg-card shadow-sm">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b bg-muted/30">
								<th className="text-left p-5 font-semibold sticky left-0 bg-muted/30 z-10 min-w-[300px] border-r">
									Metrics
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
							{loadingEntries ? (
								<tr>
									<td colSpan={dates.length + 1} className="text-center py-8">
										<Loader2 className="size-6 animate-spin text-primary mx-auto" />
									</td>
								</tr>
							) : (
								<SortableContext items={sortedMetrics.map((m) => m.id)} strategy={verticalListSortingStrategy}>
									{sortedMetrics.map((metric) => (
										<SortableMetricRow
											key={metric.id}
											metric={metric}
											dates={dates}
											entriesMap={entriesMap[metric.id] ?? {}}
											onMetricClick={onMetricClick}
											onValueChange={handleValueChange}
											getIcon={getIcon}
										/>
									))}
								</SortableContext>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</DndContext>
	)
}
