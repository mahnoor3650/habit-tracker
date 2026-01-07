import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StreakBadge } from "@/components/habits/StreakBadge"
import type { Habit } from "@/lib/hooks/useHabits"
import { useHabits } from "@/lib/hooks/useHabits"
import { useNavigate } from "react-router-dom"

export function HabitCard({ habit }: { habit: Habit }) {
	const navigate = useNavigate()
	const { deleteHabit, getHabitStreak } = useHabits()
	const [streak, setStreak] = useState(0)

	useEffect(() => {
		let active = true
		;(async () => {
			const { data } = await getHabitStreak(habit.id)
			if (active && typeof data === "number") setStreak(data)
		})()
		return () => {
			active = false
		}
	}, [habit.id, getHabitStreak])

	async function onDelete() {
		await deleteHabit(habit.id)
	}

	return (
		<Card className="p-4 flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">{habit.name}</h3>
				<StreakBadge value={streak} />
			</div>
			{habit.description ? <p className="text-sm text-muted-foreground">{habit.description}</p> : null}
			<div className="flex items-center gap-2">
				<Button variant="secondary" onClick={() => navigate(`/habit/${habit.id}`)}>
					View
				</Button>
				<Button variant="destructive" onClick={onDelete}>
					Delete
				</Button>
			</div>
		</Card>
	)
}


