import { useEffect, useState } from "react"
import { useJournal } from "@/lib/hooks/useJournal"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

function formatDateISO(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

type JournalCalendarProps = {
	currentMonth: Date
	onMonthChange: (month: Date) => void
}

export function JournalCalendar({ currentMonth, onMonthChange }: JournalCalendarProps) {
	const { getEntriesForMonth, loading } = useJournal()
	const navigate = useNavigate()
	const [entries, setEntries] = useState<Record<string, boolean>>({})
	const [entriesWithMoods, setEntriesWithMoods] = useState<Record<string, string[]>>({})
	const [monthPickerOpen, setMonthPickerOpen] = useState(false)

	const year = currentMonth.getFullYear()
	const month = currentMonth.getMonth()

	useEffect(() => {
		async function loadEntries() {
			const result = await getEntriesForMonth(year, month)
			if (result.data) {
				const entriesMap: Record<string, boolean> = {}
				const moodsMap: Record<string, string[]> = {}
				result.data.forEach((entry) => {
					entriesMap[entry.date] = true
					if (entry.moods && entry.moods.length > 0) {
						moodsMap[entry.date] = entry.moods
					}
				})
				setEntries(entriesMap)
				setEntriesWithMoods(moodsMap)
			}
		}
		loadEntries()
	}, [year, month, getEntriesForMonth])

	// Get first day of month and number of days
	const firstDay = new Date(year, month, 1)
	const lastDay = new Date(year, month + 1, 0)
	const daysInMonth = lastDay.getDate()
	const startingDayOfWeek = firstDay.getDay() // 0 = Sunday, 6 = Saturday

	// Get previous month's trailing days
	const prevMonth = new Date(year, month - 1, 0)
	const daysInPrevMonth = prevMonth.getDate()

	const today = new Date()
	const todayStr = formatDateISO(today)

	function handleDayClick(date: Date) {
		const dateStr = formatDateISO(date)
		navigate(`/journal?date=${dateStr}`)
	}

	function handlePreviousMonth() {
		const newDate = new Date(year, month - 1, 1)
		onMonthChange(newDate)
	}

	function handleNextMonth() {
		const newDate = new Date(year, month + 1, 1)
		onMonthChange(newDate)
	}

	function handleToday() {
		onMonthChange(new Date())
	}

	function handleMonthSelect(selectedMonth: number) {
		const newDate = new Date(year, selectedMonth, 1)
		onMonthChange(newDate)
		setMonthPickerOpen(false)
	}

	function handleYearSelect(selectedYear: number) {
		const newDate = new Date(selectedYear, month, 1)
		onMonthChange(newDate)
		setMonthPickerOpen(false)
	}

	const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })
	const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	
	// Generate years (current year ± 10 years)
	const currentYear = today.getFullYear()
	const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

	return (
		<Card className="p-3 sm:p-4 max-w-2xl mx-auto">
			{/* Month Navigation */}
			<div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mb-3">
				<div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
					<Button variant="outline" size="sm" onClick={handlePreviousMonth}>
						<ChevronLeft className="size-4" />
					</Button>
					<Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
						<PopoverTrigger asChild>
							<Button variant="ghost" className="text-xs sm:text-sm font-semibold min-w-[120px] sm:min-w-[150px] hover:bg-accent">
								{monthName}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-3" align="start">
							<div className="space-y-4">
								{/* Year Selector */}
								<div>
									<div className="text-xs font-medium text-muted-foreground mb-2">Year</div>
									<div className="grid grid-cols-5 gap-1 max-h-[200px] overflow-y-auto">
										{years.map((y) => (
											<Button
												key={y}
												variant={y === year ? "default" : "ghost"}
												size="sm"
												className="h-8 text-xs"
												onClick={() => handleYearSelect(y)}
											>
												{y}
											</Button>
										))}
									</div>
								</div>
								{/* Month Selector */}
								<div>
									<div className="text-xs font-medium text-muted-foreground mb-2">Month</div>
									<div className="grid grid-cols-3 gap-1">
										{monthNames.map((m, idx) => (
											<Button
												key={m}
												variant={idx === month ? "default" : "ghost"}
												size="sm"
												className="h-8 text-xs"
												onClick={() => handleMonthSelect(idx)}
											>
												{m.slice(0, 3)}
											</Button>
										))}
									</div>
								</div>
							</div>
						</PopoverContent>
					</Popover>
					<Button variant="outline" size="sm" onClick={handleNextMonth}>
						<ChevronRight className="size-4" />
					</Button>
				</div>
				<Button variant="outline" size="sm" onClick={handleToday} disabled={isCurrentMonth} className="w-full sm:w-auto">
					Today
				</Button>
			</div>

			{loading ? (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="size-4 animate-spin text-primary" />
				</div>
			) : (
				<div className="space-y-1">
					{/* Day Headers */}
					<div className="grid grid-cols-7 gap-0.5 max-w-full sm:max-w-[500px] mx-auto">
						{dayNames.map((day) => (
							<div key={day} className="text-center text-[10px] sm:text-[12px] font-medium text-muted-foreground py-0.5">
								{day}
							</div>
						))}
					</div>

					{/* Calendar Grid */}
					<div className="grid grid-cols-7 gap-0.5 max-w-full sm:max-w-[500px] mx-auto">
						{/* Previous month's trailing days */}
						{Array.from({ length: startingDayOfWeek }).map((_, idx) => {
							const day = daysInPrevMonth - startingDayOfWeek + idx + 1
							return (
								<div
									key={`prev-${day}`}
									className="aspect-square p-0 text-muted-foreground/30 cursor-not-allowed"
								>
									<div className="h-full flex items-center justify-center text-[10px]">
										{day}
									</div>
								</div>
							)
						})}

						{/* Current month's days */}
						{Array.from({ length: daysInMonth }).map((_, idx) => {
							const day = idx + 1
							const date = new Date(year, month, day)
							const dateStr = formatDateISO(date)
							const hasEntry = entries[dateStr] || false
							const moods = entriesWithMoods[dateStr] || []
							const isToday = dateStr === todayStr

							return (
								<button
									key={day}
									type="button"
									onClick={() => handleDayClick(date)}
									className={`
										aspect-square p-0 rounded border transition-all
										hover:bg-accent hover:border-primary/50
										${hasEntry ? "bg-primary/10 border-primary/30" : "border-muted/30"}
										${isToday ? "ring-1 ring-primary ring-offset-0" : ""}
									`}
								>
									<div className="h-full flex flex-col items-center justify-center gap-0">
										<span className={`text-[10px] font-medium ${isToday ? "text-primary font-bold" : ""}`}>
											{day}
										</span>
										{hasEntry && (
											<div className="flex items-center gap-0">
												{moods.length > 0 ? (
													<span className="text-[14px] leading-none">{moods[0]}</span>
												) : (
													<div className="size-0.5 rounded-full bg-primary" />
												)}
											</div>
										)}
									</div>
								</button>
							)
						})}

						{/* Next month's leading days */}
						{Array.from({ length: 42 - startingDayOfWeek - daysInMonth }).map((_, idx) => {
							const day = idx + 1
							return (
								<div
									key={`next-${day}`}
									className="aspect-square p-0 text-muted-foreground/30 cursor-not-allowed"
								>
									<div className="h-full flex items-center justify-center text-[10px]">
										{day}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</Card>
	)
}
