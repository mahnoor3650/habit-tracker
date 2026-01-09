import { useState, useEffect } from "react"
import { useJournal } from "@/lib/hooks/useJournal"
import { MoodSelector } from "@/components/journal/MoodSelector"
import { GratitudeSection } from "@/components/journal/GratitudeSection"
import { HighlightSection } from "@/components/journal/HighlightSection"
import { QuoteSection } from "@/components/journal/QuoteSection"
import { JournalEditor } from "@/components/journal/JournalEditor"
import { JournalCalendar } from "@/components/journal/JournalCalendar"
import { JournalListView } from "@/components/journal/JournalListView"
import { Button } from "@/components/ui/button"
import { Save, Loader2, Calendar, List } from "lucide-react"
import { toast } from "sonner"
import { useSearchParams } from "react-router-dom"

function formatDateISO(date: Date): string {
	return date.toISOString().slice(0, 10)
}

type ViewMode = "calendar" | "list"

export default function Journal() {
	const { getEntryByDate, upsertEntry, loading } = useJournal()
	const [searchParams, setSearchParams] = useSearchParams()
	
	// Get date from URL - if exists, show editor; otherwise show calendar/list
	const dateParam = searchParams.get("date")
	const viewMode = (searchParams.get("view") as ViewMode) || "calendar"
	const [currentMonth, setCurrentMonth] = useState(new Date())
	
	const selectedDate = dateParam ? new Date(dateParam) : null
	const dateStr = selectedDate ? formatDateISO(selectedDate) : ""
	
	const [moods, setMoods] = useState<string[]>([])
	const [gratitude, setGratitude] = useState<string[]>([])
	const [highlights, setHighlights] = useState<string[]>([])
	const [quote, setQuote] = useState<string | null>(null)
	const [content, setContent] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)

	// Load entry for selected date (only if date is selected)
	useEffect(() => {
		if (!dateStr) return
		
		async function loadEntry() {
			const result = await getEntryByDate(dateStr)
			if (result.data) {
				setMoods(result.data.moods || [])
				setGratitude(result.data.gratitude || [])
				// Parse highlight - if it's a string, split by newlines
				const highlightData = result.data.highlight || ""
				const parsedHighlights = highlightData 
					? (typeof highlightData === 'string' ? highlightData.split('\n').filter(h => h.trim()) : [])
					: []
				setHighlights(parsedHighlights)
				setQuote(result.data.quote || null)
				setContent(result.data.content || "")
				setHasChanges(false)
			} else {
				// New entry - reset all fields
				setMoods([])
				setGratitude([])
				setHighlights([])
				setQuote(null)
				setContent("")
				setHasChanges(false)
			}
		}
		loadEntry()
	}, [dateStr, getEntryByDate])

	// Track changes
	useEffect(() => {
		setHasChanges(true)
	}, [moods, gratitude, highlights, quote, content])

	async function handleSave() {
		setIsSaving(true)
		const result = await upsertEntry(dateStr, {
			moods,
			gratitude: gratitude.length > 0 ? gratitude : null,
			highlight: highlights.length > 0 ? highlights.join('\n') : null,
			quote: quote || null,
			content: content || null,
		})
		setIsSaving(false)

		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Journal entry saved!")
			setHasChanges(false)
		}
	}

	function handleDateChange(date: Date) {
		const newDateStr = formatDateISO(date)
		setSearchParams({ date: newDateStr })
	}

	function handlePreviousDay() {
		if (!selectedDate) return
		const newDate = new Date(selectedDate)
		newDate.setDate(newDate.getDate() - 1)
		handleDateChange(newDate)
	}

	function handleNextDay() {
		if (!selectedDate) return
		const newDate = new Date(selectedDate)
		newDate.setDate(newDate.getDate() + 1)
		handleDateChange(newDate)
	}

	function handleToday() {
		handleDateChange(new Date())
	}

	function handleViewChange(view: ViewMode) {
		const params = new URLSearchParams()
		params.set("view", view)
		setSearchParams(params)
	}

	function handleBackToCalendar() {
		const params = new URLSearchParams()
		if (viewMode) {
			params.set("view", viewMode)
		}
		setSearchParams(params)
	}

	// If date is selected, show editor view
	if (selectedDate && dateStr) {
		const isToday = formatDateISO(new Date()) === dateStr
		const dateLabel = selectedDate.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		})

		return (
			<div className="w-full px-16 py-8 space-y-6 max-w-7xl mx-auto">
				{/* Header with Date Navigation */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold">Journal Entry</h1>
						<p className="text-sm text-muted-foreground">{dateLabel}</p>
					</div>
					<div className="flex items-center gap-3">
						<Button variant="outline" size="sm" onClick={handleBackToCalendar}>
							← Back
						</Button>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={handlePreviousDay}>
								←
							</Button>
							<Button variant="outline" size="sm" onClick={handleToday} disabled={isToday}>
								Today
							</Button>
							<Button variant="outline" size="sm" onClick={handleNextDay} disabled={!isToday && new Date(selectedDate) > new Date()}>
								→
							</Button>
						</div>
						<Button onClick={handleSave} disabled={isSaving || !hasChanges}>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="mr-2 size-4" />
									Save
								</>
							)}
						</Button>
					</div>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-16">
						<Loader2 className="size-8 animate-spin text-primary" />
					</div>
				) : (
					<div className="space-y-6">
						{/* Row 1: Moods and Quote */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<MoodSelector selectedMoods={moods} onMoodsChange={setMoods} />
							<QuoteSection quote={quote} onQuoteChange={setQuote} />
						</div>

						{/* Row 2: Gratitude and Highlight */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<GratitudeSection gratitude={gratitude} onGratitudeChange={setGratitude} />
							<HighlightSection highlight={highlights.join('\n')} onHighlightChange={setHighlights} />
						</div>

						{/* Row 3: Journal Editor (Full Width) */}
						<JournalEditor content={content} onContentChange={setContent} />
					</div>
				)}
			</div>
		)
	}

	// Otherwise show calendar/list view
	return (
		<div className="w-full px-16 py-8 space-y-6 max-w-7xl mx-auto">
			{/* Header with View Toggle */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Journal</h1>
					<p className="text-sm text-muted-foreground">View and manage your journal entries</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant={viewMode === "calendar" ? "default" : "outline"}
						size="sm"
						onClick={() => handleViewChange("calendar")}
					>
						<Calendar className="mr-2 size-4" />
						Calendar
					</Button>
					<Button
						variant={viewMode === "list" ? "default" : "outline"}
						size="sm"
						onClick={() => handleViewChange("list")}
					>
						<List className="mr-2 size-4" />
						List
					</Button>
				</div>
			</div>

			{viewMode === "calendar" ? (
				<JournalCalendar currentMonth={currentMonth} onMonthChange={setCurrentMonth} />
			) : (
				<JournalListView />
			)}
		</div>
	)
}
