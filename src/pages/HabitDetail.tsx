import  { useMemo } from "react"
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
		<div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 lg:px-16 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
				<div>
					<h1 className="text-xl sm:text-2xl font-semibold">{habit?.name ?? "Habit"}</h1>
					{habit?.description ? <p className="text-xs sm:text-sm text-muted-foreground">{habit.description}</p> : null}
				</div>
				<Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
					<Link to="/">Back</Link>
				</Button>
			</div>
			<HabitCalendar habitId={habitId} />
		</div>
	)
}


