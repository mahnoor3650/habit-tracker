import React from "react"
import { Flame } from "lucide-react"

export function StreakBadge({ value }: { value: number }) {
	return (
		<div className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 text-xs">
			<Flame className="size-4" />
			<span>{value}</span>
		</div>
	)
}


