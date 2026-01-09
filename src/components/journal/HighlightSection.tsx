import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

type HighlightSectionProps = {
	highlight?: string | null
	onHighlightChange: (highlights: string[]) => void
}

export function HighlightSection({ highlight, onHighlightChange }: HighlightSectionProps) {
	// Parse highlight - if it's a string, convert to array, otherwise use empty array
	const initialHighlights = highlight 
		? (typeof highlight === 'string' ? highlight.split('\n').filter(h => h.trim()) : [])
		: []
	
	const [highlights, setHighlights] = useState<string[]>(initialHighlights)
	const [newHighlight, setNewHighlight] = useState("")

	useEffect(() => {
		const parsed = highlight 
			? (typeof highlight === 'string' ? highlight.split('\n').filter(h => h.trim()) : [])
			: []
		setHighlights(parsed)
	}, [highlight])

	function handleAdd() {
		if (newHighlight.trim() && highlights.length < 3) {
			const updated = [...highlights, newHighlight.trim()]
			setHighlights(updated)
			onHighlightChange(updated)
			setNewHighlight("")
		}
	}

	function handleRemove(index: number) {
		const updated = highlights.filter((_, i) => i !== index)
		setHighlights(updated)
		onHighlightChange(updated)
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") {
			e.preventDefault()
			handleAdd()
		}
	}

	return (
		<Card className="p-4 space-y-0">
			<div>
				<h3 className="text-base font-semibold leading-tight">Today's Highlights</h3>
				<p className="text-xs text-muted-foreground leading-tight">What made today special? ({highlights.length}/3)</p>
			</div>

			{/* Highlights List */}
			{highlights.length > 0 && (
				<div className="space-y-1.5">
					{highlights.map((item, index) => (
						<div
							key={index}
							className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20"
						>
							<span className="text-primary font-medium text-sm">•</span>
							<span className="flex-1 text-sm">{item}</span>
							<Button
								variant="ghost"
								size="sm"
								className="h-6 w-6 p-0"
								onClick={() => handleRemove(index)}
							>
								<X className="size-3" />
							</Button>
						</div>
					))}
				</div>
			)}

			{/* Add New Highlight */}
			{highlights.length < 3 && (
				<div className="flex items-center gap-2">
					<Input
						value={newHighlight}
						onChange={(e) => setNewHighlight(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Add a highlight..."
						className="text-sm"
						maxLength={150}
					/>
					<Button
						size="sm"
						onClick={handleAdd}
						disabled={!newHighlight.trim()}
						className="shrink-0"
					>
						<Plus className="size-4" />
					</Button>
				</div>
			)}

			{highlights.length === 0 && (
				<p className="text-xs text-muted-foreground italic">
					Add up to 3 highlights from your day
				</p>
			)}
		</Card>
	)
}
