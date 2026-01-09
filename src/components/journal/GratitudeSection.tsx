import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

type GratitudeSectionProps = {
	gratitude?: string[] | null
	onGratitudeChange: (gratitude: string[]) => void
}

export function GratitudeSection({ gratitude, onGratitudeChange }: GratitudeSectionProps) {
	const [items, setItems] = useState<string[]>(gratitude || [])
	const [newItem, setNewItem] = useState("")

	useEffect(() => {
		setItems(gratitude || [])
	}, [gratitude])

	function handleAdd() {
		if (newItem.trim() && items.length < 3) {
			const updated = [...items, newItem.trim()]
			setItems(updated)
			onGratitudeChange(updated)
			setNewItem("")
		}
	}

	function handleRemove(index: number) {
		const updated = items.filter((_, i) => i !== index)
		setItems(updated)
		onGratitudeChange(updated)
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
				<h3 className="text-base font-semibold leading-tight">Gratitude List</h3>
				<p className="text-xs text-muted-foreground leading-tight">What are you grateful for today? ({items.length}/3)</p>
			</div>

			{/* Gratitude Items */}
			{items.length > 0 && (
				<div className="space-y-1.5">
					{items.map((item, index) => (
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

			{/* Add New Item */}
			{items.length < 3 && (
				<div className="flex items-center gap-2">
					<Input
						value={newItem}
						onChange={(e) => setNewItem(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="I'm grateful for..."
						className="text-sm"
						maxLength={100}
					/>
					<Button
						size="sm"
						onClick={handleAdd}
						disabled={!newItem.trim()}
						className="shrink-0"
					>
						<Plus className="size-4" />
					</Button>
				</div>
			)}

			{items.length === 0 && (
				<p className="text-xs text-muted-foreground italic">
					Add things you're grateful for today to boost your mood
				</p>
			)}
		</Card>
	)
}
