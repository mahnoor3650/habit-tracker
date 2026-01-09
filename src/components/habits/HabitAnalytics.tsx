import { useEffect, useState, useMemo } from "react"
import { useHabits, calculateConsistencyScore, getBestWorstDays, getLastNDates } from "@/lib/hooks/useHabits"
import { Card } from "@/components/ui/card"
import { Loader2, TrendingUp, Calendar, Award } from "lucide-react"
import * as icons from "lucide-react"

type HabitAnalyticsProps = {
	startDate?: string
	endDate?: string
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function SparklineChart({ data, width = 120, height = 30 }: { data: number[]; width?: number; height?: number }) {
	if (data.length === 0) return null
	
	const max = Math.max(...data, 1)
	const min = Math.min(...data, 0)
	const range = max - min || 1
	
	const points = data.map((value, index) => {
		const x = (index / (data.length - 1 || 1)) * width
		const y = height - ((value - min) / range) * height
		return `${x},${y}`
	}).join(" ")
	
	return (
		<svg width={width} height={height} className="overflow-visible">
			<polyline
				points={points}
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				className="text-primary"
			/>
		</svg>
	)
}

export function HabitAnalytics({ startDate, endDate }: HabitAnalyticsProps) {
	const { habits, getEntriesForHabit } = useHabits()
	const [analytics, setAnalytics] = useState<Record<string, {
		entries: Record<string, boolean>
		consistency: number
		bestWorst: { best: number[]; worst: number[] }
		sparklineData: number[]
	}>>({})
	const [loading, setLoading] = useState(true)

	const dateRange = useMemo(() => {
		if (startDate && endDate) {
			const start = new Date(startDate)
			const end = new Date(endDate)
			const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
			return { startDate, endDate, days }
		}
		// Default to last 30 days
		const dates = getLastNDates(30)
		return { startDate: dates[0], endDate: dates[dates.length - 1], days: 30 }
	}, [startDate, endDate])

	useEffect(() => {
		async function loadAnalytics() {
			setLoading(true)
			const analyticsMap: typeof analytics = {}
			
			for (const habit of habits) {
				const { data: entries } = await getEntriesForHabit(
					habit.id,
					dateRange.days,
					dateRange.startDate,
					dateRange.endDate
				)
				
				if (!entries) continue
				
				// Generate date range for calculations
				const start = new Date(dateRange.startDate)
				const end = new Date(dateRange.endDate)
				const allDates: string[] = []
				const current = new Date(start)
				while (current <= end) {
					allDates.push(current.toISOString().slice(0, 10))
					current.setDate(current.getDate() + 1)
				}
				
				// Calculate consistency score
				const consistency = calculateConsistencyScore(entries, allDates.length)
				
				// Get best/worst days
				const bestWorst = getBestWorstDays(entries, dateRange.startDate, dateRange.endDate)
				
				// Generate sparkline data (completion rate per week)
				const sparklineData: number[] = []
				
				const weeks = Math.ceil(allDates.length / 7)
				for (let week = 0; week < weeks; week++) {
					const weekStart = week * 7
					const weekEnd = Math.min(weekStart + 7, allDates.length)
					const weekDates = allDates.slice(weekStart, weekEnd)
					const completed = weekDates.filter((d) => entries[d]).length
					sparklineData.push(weekDates.length > 0 ? completed / weekDates.length : 0)
				}
				
				analyticsMap[habit.id] = {
					entries,
					consistency,
					bestWorst,
					sparklineData,
				}
			}
			
			setAnalytics(analyticsMap)
			setLoading(false)
		}
		
		if (habits.length > 0) {
			loadAnalytics()
		} else {
			setLoading(false)
		}
	}, [habits, getEntriesForHabit, dateRange])

	function getIcon(iconName?: string | null) {
		if (iconName && /[\p{Emoji}\u200d]/u.test(iconName)) {
			return <span className="text-xl">{iconName}</span>
		}
		if (iconName) {
			const IconComponent = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
			return IconComponent ? <IconComponent className="size-4" /> : null
		}
		return null
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="size-6 animate-spin text-primary" />
			</div>
		)
	}

	if (habits.length === 0) {
		return null
	}

	return (
		<div className="space-y-4 mt-8">
			<h2 className="text-xl font-semibold flex items-center gap-2">
				<TrendingUp className="size-5" />
				Analytics
			</h2>
			
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{habits.map((habit) => {
					const data = analytics[habit.id]
					if (!data) return null
					
					const { consistency, bestWorst, sparklineData } = data
					
					return (
						<Card key={habit.id} className="p-4 space-y-3">
							<div className="flex items-center gap-3">
								<div className="size-10 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
									{getIcon(habit.icon) || <span className="text-xl">📅</span>}
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm truncate">{habit.name}</div>
								</div>
							</div>
							
							{/* Consistency Score */}
							<div className="space-y-1">
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span className="flex items-center gap-1">
										<Award className="size-3" />
										Consistency
									</span>
									<span className="font-semibold text-foreground">{consistency}%</span>
								</div>
								<div className="h-2 bg-muted rounded-full overflow-hidden">
									<div
										className="h-full bg-primary transition-all"
										style={{ width: `${consistency}%` }}
									/>
								</div>
							</div>
							
							{/* Best/Worst Days */}
							<div className="space-y-1.5 text-xs">
								<div className="flex items-center gap-1 text-muted-foreground">
									<Calendar className="size-3" />
									<span>Best days:</span>
									<span className="font-medium text-foreground">
										{bestWorst.best.map((d) => dayNames[d]).join(", ") || "N/A"}
									</span>
								</div>
								<div className="flex items-center gap-1 text-muted-foreground">
									<span>Worst days:</span>
									<span className="font-medium text-foreground">
										{bestWorst.worst.map((d) => dayNames[d]).join(", ") || "N/A"}
									</span>
								</div>
							</div>
							
							{/* Sparkline Chart */}
							{sparklineData.length > 0 && (
								<div className="pt-2 border-t">
									<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
										<span>Weekly trend</span>
									</div>
									<SparklineChart data={sparklineData} width={140} height={24} />
								</div>
							)}
						</Card>
					)
				})}
			</div>
		</div>
	)
}
