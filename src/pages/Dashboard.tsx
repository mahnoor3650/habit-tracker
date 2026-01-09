import { useState, useMemo } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { HabitTable } from "@/components/habits/HabitTable"
import { HabitAnalytics } from "@/components/habits/HabitAnalytics"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HabitForm, type HabitFormValues } from "@/components/habits/HabitForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash, Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react"
import { toast } from "sonner"

type ViewMode = "week" | "15days" | "month" | "custom"

function formatDateISO(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function getDatesForView(view: ViewMode, offset: number = 0, customStart?: string, customEnd?: string): { dates: Date[]; startDate: string; endDate: string } {
	const now = new Date()
	const dates: Date[] = []
	let startDate: Date
	let endDate: Date

	if (view === "custom" && customStart && customEnd) {
		startDate = new Date(customStart)
		endDate = new Date(customEnd)
	} else if (view === "month") {
		const year = now.getFullYear()
		const month = now.getMonth() + offset
		const adjustedDate = new Date(year, month, 1)
		startDate = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth(), 1)
		endDate = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth() + 1, 0)
	} else if (view === "week") {
		const currentDay = now.getDay()
		const startOfWeek = new Date(now)
		startOfWeek.setDate(now.getDate() - currentDay + (offset * 7))
		startOfWeek.setHours(0, 0, 0, 0)
		startDate = new Date(startOfWeek)
		endDate = new Date(startOfWeek)
		endDate.setDate(startOfWeek.getDate() + 6)
	} else if (view === "15days") {
		const today = new Date(now)
		today.setDate(now.getDate() + (offset * 15))
		today.setHours(0, 0, 0, 0)
		startDate = new Date(today)
		endDate = new Date(today)
		endDate.setDate(today.getDate() + 14)
	} else {
		// Default to current month
		startDate = new Date(now.getFullYear(), now.getMonth(), 1)
		endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
	}

	const current = new Date(startDate)
	while (current <= endDate) {
		dates.push(new Date(current))
		current.setDate(current.getDate() + 1)
	}

	return {
		dates,
		startDate: formatDateISO(startDate),
		endDate: formatDateISO(endDate),
	}
}

export default function Dashboard() {
	const { user } = useAuth()
	const { updateHabit, createHabit, deleteHabit, refresh, reorderHabits } = useHabits()
	const [createOpen, setCreateOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
	const [view, setView] = useState<ViewMode>("15days")
	const [dateOffset, setDateOffset] = useState(0)
	const [customStartDate, setCustomStartDate] = useState<string>("")
	const [customEndDate, setCustomEndDate] = useState<string>("")
	const [customDateOpen, setCustomDateOpen] = useState(false)

	async function handleCreate(values: HabitFormValues) {
		const result = await createHabit(values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit created")
			setCreateOpen(false)
			await refresh()
		}
	}

	async function handleUpdate(values: HabitFormValues) {
		if (!selectedHabit) return
		const result = await updateHabit(selectedHabit.id, values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit updated")
			setEditOpen(false)
			setSelectedHabit(null)
			await refresh()
		}
	}

	async function handleDelete() {
		if (!selectedHabit) return
		if (!confirm("Delete this habit?")) return
		const result = await deleteHabit(selectedHabit.id)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit deleted")
			setEditOpen(false)
			setSelectedHabit(null)
			await refresh()
		}
	}

	function handleHabitClick(habit: Habit) {
		setSelectedHabit(habit)
		setEditOpen(true)
	}

	async function handleReorder(habitIds: string[]) {
		const result = await reorderHabits(habitIds)
		if (result.error) {
			toast.error(result.error)
		}
	}

	function handlePrevious() {
		setDateOffset((prev) => prev - 1)
	}

	function handleNext() {
		setDateOffset((prev) => prev + 1)
	}

	function handleToday() {
		setDateOffset(0)
	}

	function handleCustomDateRange() {
		if (customStartDate && customEndDate) {
			if (new Date(customStartDate) > new Date(customEndDate)) {
				toast.error("Start date must be before end date")
				return
			}
			setView("custom")
			setCustomDateOpen(false)
			setDateOffset(0)
		}
	}

	const dateRange = useMemo(() => {
		return getDatesForView(view, dateOffset, customStartDate, customEndDate)
	}, [view, dateOffset, customStartDate, customEndDate])

	const dateRangeLabel = useMemo(() => {
		if (view === "custom" && customStartDate && customEndDate) {
			const start = new Date(customStartDate)
			const end = new Date(customEndDate)
			return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
		} else if (view === "month") {
			const date = new Date()
			date.setMonth(date.getMonth() + dateOffset)
			return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
		} else if (view === "week") {
			const start = dateRange.dates[0]
			const end = dateRange.dates[dateRange.dates.length - 1]
			return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
		} else if (view === "15days") {
			const start = dateRange.dates[0]
			const end = dateRange.dates[dateRange.dates.length - 1]
			return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
		}
		return ""
	}, [view, dateOffset, dateRange, customStartDate, customEndDate])

	return (
		<div className="w-full px-16 py-8 space-y-8">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Your Habits</h1>
					<p className="text-sm text-muted-foreground">
						{(user?.user_metadata?.display_name as string | undefined) ?? user?.email}
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Dialog open={createOpen} onOpenChange={setCreateOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="mr-2 size-4" />
								Add Habit
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>New Habit</DialogTitle>
							</DialogHeader>
							<HabitForm onSubmit={handleCreate} submitLabel="Create" />
						</DialogContent>
					</Dialog>
				</div>
			</header>

			{/* Date Navigation */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Select value={view} onValueChange={(value) => {
						setView(value as ViewMode)
						setDateOffset(0)
						if (value !== "custom") {
							setCustomStartDate("")
							setCustomEndDate("")
						}
					}}>
						<SelectTrigger className="w-[140px]">
							<SelectValue>
								<div className="flex items-center gap-2">
									{view === "week" && <Calendar className="size-4" />}
									{view === "15days" && <CalendarRange className="size-4" />}
									{view === "month" && <CalendarDays className="size-4" />}
									{view === "custom" && <CalendarCheck className="size-4" />}
									<span>
										{view === "week" ? "Week" : view === "15days" ? "15 Days" : view === "month" ? "Month" : "Custom"}
									</span>
								</div>
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="week">
								<div className="flex items-center gap-2">
									<Calendar className="size-4" />
									Week
								</div>
							</SelectItem>
							<SelectItem value="15days">
								<div className="flex items-center gap-2">
									<CalendarRange className="size-4" />
									15 Days
								</div>
							</SelectItem>
							<SelectItem value="month">
								<div className="flex items-center gap-2">
									<CalendarDays className="size-4" />
									Month
								</div>
							</SelectItem>
							<SelectItem value="custom">
								<div className="flex items-center gap-2">
									<CalendarCheck className="size-4" />
									Custom Range
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
					
					{view === "custom" && (
						<Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
							<PopoverTrigger asChild>
								<Button variant="outline" className="w-[240px] justify-start text-left font-normal">
									<CalendarCheck className="mr-2 size-4" />
									{customStartDate && customEndDate ? dateRangeLabel : "Select date range"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-4" align="start">
								<div className="space-y-4">
									<div className="space-y-2">
										<Label>Start Date</Label>
										<Input
											type="date"
											value={customStartDate}
											onChange={(e) => setCustomStartDate(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label>End Date</Label>
										<Input
											type="date"
											value={customEndDate}
											onChange={(e) => setCustomEndDate(e.target.value)}
										/>
									</div>
									<Button onClick={handleCustomDateRange} className="w-full">
										Apply Range
									</Button>
								</div>
							</PopoverContent>
						</Popover>
					)}
				</div>

				<div className="flex items-center gap-2">
					<Button variant="outline" size="icon" onClick={handlePrevious}>
						<ChevronLeft className="size-4" />
					</Button>
					<Button variant="outline" onClick={handleToday} className="min-w-[80px]">
						Today
					</Button>
					<Button variant="outline" size="icon" onClick={handleNext}>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>

			{/* Date Range Label */}
			<div className="text-sm text-muted-foreground">
				{dateRangeLabel}
			</div>

			<HabitTable
				onHabitClick={handleHabitClick}
				view={view}
				dates={dateRange.dates}
				startDate={dateRange.startDate}
				endDate={dateRange.endDate}
				onReorder={handleReorder}
			/>

			{/* Analytics Section */}
			<HabitAnalytics startDate={dateRange.startDate} endDate={dateRange.endDate} />

			{/* Edit Dialog */}
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Habit</DialogTitle>
					</DialogHeader>
					{selectedHabit && (
						<div className="space-y-4">
							<HabitForm
								initial={{
									name: selectedHabit.name,
									description: selectedHabit.description,
									icon: selectedHabit.icon,
								}}
								onSubmit={handleUpdate}
								submitLabel="Update"
							/>
							<div className="flex items-center justify-end gap-3 pt-2 border-t">
								<Button
									variant="destructive"
									onClick={handleDelete}
								>
									<Trash className="mr-2 size-4" />
									Delete
								</Button>
								<Button
									type="submit"
									form="habit-form"
								>
									Update
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}


