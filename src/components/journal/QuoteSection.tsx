import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Loader2 } from "lucide-react"
import { useJournal } from "@/lib/hooks/useJournal"

type QuoteSectionProps = {
	quote?: string | null
	onQuoteChange: (quote: string) => void
}

export function QuoteSection({ quote: initialQuote, onQuoteChange }: QuoteSectionProps) {
	const { fetchRandomQuote } = useJournal()
	const [quote, setQuote] = useState<string>(initialQuote || "")
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (initialQuote) {
			setQuote(initialQuote)
		}
	}, [initialQuote])

	// Auto-load quote on mount if no quote exists
	useEffect(() => {
		if (!initialQuote && !quote) {
			loadRandomQuote()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	async function loadRandomQuote() {
		setIsLoading(true)
		try {
			const result = await fetchRandomQuote()
			if (result.data) {
				const formattedQuote = `"${result.data.content}" — ${result.data.author}`
				setQuote(formattedQuote)
				onQuoteChange(formattedQuote)
			}
		} catch (error) {
			console.error("Error loading quote:", error)
		} finally {
			setIsLoading(false)
		}
	}

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const newValue = e.target.value
		setQuote(newValue)
		onQuoteChange(newValue)
	}

	return (
		<Card className="p-4 space-y-0">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-base font-semibold leading-tight">Quote of the Day</h3>
				</div>
				<Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={loadRandomQuote} disabled={isLoading}>
					{isLoading ? (
						<Loader2 className="size-3 animate-spin" />
					) : (
						<RefreshCw className="size-3" />
					)}
				</Button>
			</div>

			<Input
				value={quote}
				onChange={handleChange}
				placeholder="Enter a quote or click refresh to get one..."
				className="font-serif text-sm"
			/>
		</Card>
	)
}
