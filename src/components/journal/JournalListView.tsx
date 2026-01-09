import { useJournal, type JournalEntry } from "@/lib/hooks/useJournal"
import { Card } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { Loader2, CalendarDays } from "lucide-react"

function formatDateISO(date: Date): string {
	return date.toISOString().slice(0, 10)
}

function formatDateDisplay(dateStr: string): string {
	const date = new Date(dateStr)
	const today = new Date()
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	if (formatDateISO(date) === formatDateISO(today)) {
		return "Today"
	} else if (formatDateISO(date) === formatDateISO(yesterday)) {
		return "Yesterday"
	} else {
		return date.toLocaleDateString("en-US", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric",
		})
	}
}

export function JournalListView() {
	const { entries, loading } = useJournal()
	const navigate = useNavigate()

	function handleEntryClick(entry: JournalEntry) {
		navigate(`/journal?date=${entry.date}`)
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="size-8 animate-spin text-primary" />
			</div>
		)
	}

	if (entries.length === 0) {
		return (
			<Card className="p-8 text-center">
				<CalendarDays className="size-12 mx-auto text-muted-foreground mb-4" />
				<p className="text-muted-foreground text-lg">No journal entries yet</p>
				<p className="text-sm text-muted-foreground mt-2">Start writing to see your entries here</p>
			</Card>
		)
	}

	return (
		<div className="space-y-3">
			{entries.map((entry) => {
				const preview = entry.content
					? entry.content.slice(0, 100) + (entry.content.length > 100 ? "..." : "")
					: entry.highlight
					? entry.highlight.slice(0, 100) + (entry.highlight.length > 100 ? "..." : "")
					: entry.quote
					? entry.quote.slice(0, 100) + (entry.quote.length > 100 ? "..." : "")
					: null

				return (
					<Card
						key={entry.id}
						className="p-4 cursor-pointer hover:bg-accent transition-colors"
						onClick={() => handleEntryClick(entry)}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3 mb-2">
									<h3 className="font-semibold text-base">{formatDateDisplay(entry.date)}</h3>
									{entry.moods && entry.moods.length > 0 && (
										<div className="flex items-center gap-1">
											{entry.moods.map((mood, idx) => (
												<span key={idx} className="text-lg">
													{mood}
												</span>
											))}
										</div>
									)}
								</div>
								{preview && (
									<p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
								)}
								<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
									{entry.gratitude && entry.gratitude.length > 0 && (
										<span>{entry.gratitude.length} gratitude{entry.gratitude.length !== 1 ? "s" : ""}</span>
									)}
									{entry.highlight && (
										<span>Highlight</span>
									)}
									{entry.quote && (
										<span>Quote</span>
									)}
									{entry.content && (
										<span>{entry.content.length} chars</span>
									)}
								</div>
							</div>
						</div>
					</Card>
				)
			})}
		</div>
	)
}
