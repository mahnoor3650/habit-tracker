import  { useEffect, useMemo, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { getLastNDates, calculateCompletionPercent, calculateStreak } from "@/lib/hooks/useHabits"
import { useHabits } from "@/lib/hooks/useHabits"

export function HabitCalendar({ habitId }: { habitId: string }) {
	const { getEntriesForHabit, toggleHabitEntry } = useHabits()
	const [map, setMap] = useState<Record<string, boolean>>({})
	const days = useMemo(() => getLastNDates(30), [])

	useEffect(() => {
		let active = true
		;(async () => {
			const { data } = await getEntriesForHabit(habitId)
			if (active && data) setMap(data)
		})()
		return () => {
			active = false
		}
	}, [habitId, getEntriesForHabit])

	const streak = calculateStreak(map)
	const percent = calculateCompletionPercent(map)

	async function onToggle(date: string) {
		await toggleHabitEntry(habitId, date)
		setMap((prev) => ({ ...prev, [date]: !prev[date] }))
	}

	return (
		<div className="space-y-3">
			<div className="text-sm text-muted-foreground">{percent}% completed • Streak: {streak}</div>
			<div className="grid grid-cols-7 gap-2">
				{days.map((d) => {
					const isToday = d === new Date().toISOString().slice(0, 10)
					return (
						<label
							key={d}
							className={`flex flex-col items-center gap-1 rounded-md border p-2 hover:bg-accent ${
								isToday ? "ring-1 ring-primary" : ""
							}`}
						>
							<span className="text-[10px] text-muted-foreground">{new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
							<Checkbox checked={!!map[d]} onCheckedChange={() => onToggle(d)} />
						</label>
					)
				})}
			</div>
		</div>
	)
}


