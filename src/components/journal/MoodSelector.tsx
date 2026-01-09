import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const MOOD_EMOJIS = [
	{ emoji: "😊", label: "Happy" },
	{ emoji: "😢", label: "Sad" },
	{ emoji: "😡", label: "Angry" },
	{ emoji: "😴", label: "Tired" },
	{ emoji: "😌", label: "Peaceful" },
	{ emoji: "😰", label: "Anxious" },
]

type MoodSelectorProps = {
	selectedMoods: string[]
	onMoodsChange: (moods: string[]) => void
}

export function MoodSelector({ selectedMoods, onMoodsChange }: MoodSelectorProps) {
	const [moods, setMoods] = useState<string[]>(selectedMoods)

	useEffect(() => {
		setMoods(selectedMoods)
	}, [selectedMoods])

	function toggleMood(emoji: string) {
		// Only allow one mood - if clicking the same mood, deselect it
		const newMoods = moods.includes(emoji) ? [] : [emoji]
		setMoods(newMoods)
		onMoodsChange(newMoods)
	}

	return (
		<Card className="p-4 space-y-0">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-base font-semibold leading-tight">Today's Mood</h3>
					<p className="text-xs text-muted-foreground leading-tight">Select how you're feeling</p>
				</div>
				{moods.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs"
						onClick={() => {
							setMoods([])
							onMoodsChange([])
						}}
					>
						<RefreshCw className="size-3" />
					</Button>
				)}
			</div>
			<div className="grid grid-cols-6 gap-1.5">
				{MOOD_EMOJIS.map(({ emoji, label }) => {
					const isSelected = moods.includes(emoji)
					return (
						<button
							key={emoji}
							type="button"
							onClick={() => toggleMood(emoji)}
							className={`
								aspect-square rounded-md border-2 transition-all duration-200
								flex items-center justify-center text-2xl
								hover:scale-105 active:scale-95
								${
									isSelected
										? "border-primary bg-primary/10 scale-105 shadow-sm"
										: "border-muted hover:border-primary/50 bg-card"
								}
							`}
							title={label}
							aria-label={label}
						>
							{emoji}
						</button>
					)
				})}
			</div>
		</Card>
	)
}
