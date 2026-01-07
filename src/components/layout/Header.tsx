import React from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { Switch } from "@/components/ui/switch"

export function Header() {
	const { theme, toggle } = useTheme()
	return (
		<header className="w-full border-b">
			<div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
				<h1 className="font-semibold">Habit Tracker</h1>
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
					<Switch checked={theme === "dark"} onCheckedChange={toggle} />
				</div>
			</div>
		</header>
	)
}


