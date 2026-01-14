import { useState, useMemo } from "react"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { useMetrics } from "@/lib/hooks/useMetrics"
import type { Metric } from "@/lib/hooks/useMetrics"
import { HabitTable } from "@/components/habits/HabitTable"
import { MetricsTable } from "@/components/metrics/MetricsTable"
import { MetricForm, type MetricFormValues } from "@/components/metrics/MetricForm"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HabitForm, type HabitFormValues } from "@/components/habits/HabitForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash, Calendar, CalendarDays, CalendarRange, ChevronLeft, ChevronRight, CalendarCheck, Filter } from "lucide-react"
import { toast } from "sonner"

type ViewMode = "week" | "15days" | "month" | "custom"

function formatDateISO(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
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
	const { habits, updateHabit, createHabit, deleteHabit, refresh, reorderHabits } = useHabits()
	const { metrics, updateMetric, createMetric, deleteMetric, refresh: refreshMetrics, reorderMetrics } = useMetrics()
	const [createOpen, setCreateOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
	const [metricCreateOpen, setMetricCreateOpen] = useState(false)
	const [metricEditOpen, setMetricEditOpen] = useState(false)
	const [selectedMetric, setSelectedMetric] = useState<Metric | null>(null)
	const [view, setView] = useState<ViewMode>("week")
	const [dateOffset, setDateOffset] = useState(0)
	const [customStartDate, setCustomStartDate] = useState<string>("")
	const [customEndDate, setCustomEndDate] = useState<string>("")
	const [customDateOpen, setCustomDateOpen] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<string>("all")

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

	// Metric handlers
	async function handleCreateMetric(values: MetricFormValues) {
		const result = await createMetric(values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Metric created")
			setMetricCreateOpen(false)
			await refreshMetrics()
		}
	}

	async function handleUpdateMetric(values: MetricFormValues) {
		if (!selectedMetric) return
		const result = await updateMetric(selectedMetric.id, values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Metric updated")
			setMetricEditOpen(false)
			setSelectedMetric(null)
			await refreshMetrics()
		}
	}

	async function handleDeleteMetric() {
		if (!selectedMetric) return
		if (!confirm("Delete this metric?")) return
		const result = await deleteMetric(selectedMetric.id)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Metric deleted")
			setMetricEditOpen(false)
			setSelectedMetric(null)
			await refreshMetrics()
		}
	}

	function handleMetricClick(metric: Metric) {
		setSelectedMetric(metric)
		setMetricEditOpen(true)
	}

	async function handleReorderMetrics(metricIds: string[]) {
		const result = await reorderMetrics(metricIds)
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

	// Get unique categories from habits
	const availableCategories = useMemo(() => {
		const categories = new Set<string>()
		habits.forEach((habit) => {
			if (habit.category) {
				categories.add(habit.category)
			}
		})
		return Array.from(categories).sort()
	}, [habits])

	// Filter habits by category
	const filteredHabits = useMemo(() => {
		if (selectedCategory === "all") {
			return habits
		}
		return habits.filter((habit) => habit.category === selectedCategory)
	}, [habits, selectedCategory])

	return (
    <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Your Habits</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 lg:gap-4">
        <div className="text-sm sm:text-base text-muted-foreground text-center lg:text-left">{dateRangeLabel}</div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
          {/* Date Navigation Buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevious} className="h-9">
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleToday}
              className="min-w-[80px] h-9 text-sm"
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-9">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          {/* Filters and View Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Filter className="size-4" />
                    <span className="truncate">
                      {selectedCategory === "all" ? "All" : selectedCategory}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Filter className="size-4" />
                    All
                  </div>
                </SelectItem>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={view}
              onValueChange={(value) => {
                setView(value as ViewMode);
                setDateOffset(0);
                if (value !== "custom") {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {view === "week" && <Calendar className="size-4" />}
                    {view === "15days" && <CalendarRange className="size-4" />}
                    {view === "month" && <CalendarDays className="size-4" />}
                    {view === "custom" && <CalendarCheck className="size-4" />}
                    <span className="truncate">
                      {view === "week"
                        ? "Week"
                        : view === "15days"
                        ? "15 Days"
                        : view === "month"
                        ? "Month"
                        : "Custom"}
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
                  <Button
                    variant="outline"
                    className="w-full sm:w-[240px] justify-start text-left font-normal h-9 text-sm"
                  >
                    <CalendarCheck className="mr-2 size-4" />
                    <span className="truncate">
                      {customStartDate && customEndDate
                        ? dateRangeLabel
                        : "Select date range"}
                    </span>
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
        </div>
      </div>

      <HabitTable
        onHabitClick={handleHabitClick}
        view={view}
        dates={dateRange.dates}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onReorder={handleReorder}
        habits={filteredHabits}
      />

      {/* Metrics Section */}
      <div className="space-y-4">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Daily Metrics</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Track numeric values like sleep, water, steps, etc.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Dialog open={metricCreateOpen} onOpenChange={setMetricCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="mr-2 size-4" />
                  Add Metric
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Metric</DialogTitle>
                </DialogHeader>
                <MetricForm onSubmit={handleCreateMetric} submitLabel="Create" />
              </DialogContent>
            </Dialog>
          </div>
        </header>
        <MetricsTable
          onMetricClick={handleMetricClick}
          view={view}
          dates={dateRange.dates}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onReorder={handleReorderMetrics}
          metrics={metrics}
        />
      </div>

      {/* Edit Habit Dialog */}
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
                  category: selectedHabit.category,
                }}
                onSubmit={handleUpdate}
                submitLabel="Update"
              />
              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash className="mr-2 size-4" />
                  Delete
                </Button>
                <Button type="submit" form="habit-form">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Metric Dialog */}
      <Dialog open={metricEditOpen} onOpenChange={setMetricEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Metric</DialogTitle>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <MetricForm
                initial={{
                  name: selectedMetric.name,
                  description: selectedMetric.description,
                  unit: selectedMetric.unit,
                  icon: selectedMetric.icon,
                  color: selectedMetric.color,
                }}
                onSubmit={handleUpdateMetric}
                submitLabel="Update"
              />
              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button variant="destructive" onClick={handleDeleteMetric}>
                  <Trash className="mr-2 size-4" />
                  Delete
                </Button>
                <Button type="submit" form="metric-form">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


