import React, { useMemo } from "react"
import { useParams, Link } from "react-router-dom"
import { useHabits } from "@/lib/hooks/useHabits"
import { HabitCalendar } from "@/components/habits/HabitCalendar"
import { Button } from "@/components/ui/button"

export default function HabitDetail() {
	const params = useParams<{ id: string }>()
	const habitId = params.id!
	const { habits } = useHabits()
	const habit = useMemo(() => habits.find((h) => h.id === habitId), [habits, habitId])

	return (
		<div className="mx-auto max-w-3xl p-4 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">{habit?.name ?? "Habit"}</h1>
					{habit?.description ? <p className="text-sm text-muted-foreground">{habit.description}</p> : null}
				</div>
				<Button asChild variant="outline">
					<Link to="/">Back</Link>
				</Button>
			</div>
			<HabitCalendar habitId={habitId} />
		</div>
	)
}


