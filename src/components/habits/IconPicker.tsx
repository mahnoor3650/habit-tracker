import React, { useState } from "react"
import * as lucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

// Popular habit-related icons
const popularIcons = [
	"Flame",
	"CheckCircle2",
	"Star",
	"Heart",
	"Calendar",
	"Target",
	"Trophy",
	"Zap",
	"TrendingUp",
	"Activity",
	"Book",
	"Coffee",
	"Water",
	"Apple",
	"Dumbbell",
	"Bed",
	"Sun",
	"Moon",
	"BookOpen",
	"Smile",
	"Music",
	"Palette",
	"Medal",
	"Lightbulb",
	"Pill",
	"Shield",
	"Leaf",
	"Running",
	"Beer",
	"Circle",
	"Square",
	"Triangle",
	"Home",
	"Briefcase",
	"GraduationCap",
	"Users",
	"MessageCircle",
	"Phone",
	"Mail",
	"Instagram",
	"Twitter",
	"Youtube",
	"Facebook",
	"Github",
	"Camera",
	"Video",
	"Mic",
	"Headphones",
	"Gamepad2",
] as const

type IconPickerProps = {
	selectedIcon?: string | null
	onIconSelect: (iconName: string | null) => void
}

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
	const [search, setSearch] = useState("")

	// Filter icons based on search
	const filteredIcons = popularIcons.filter((iconName) =>
		iconName.toLowerCase().includes(search.toLowerCase())
	)

	function getIconComponent(iconName: string) {
		const IconComponent = (lucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
		return IconComponent ? <IconComponent className="size-5" /> : null
	}

	return (
		<div className="space-y-3">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search icons..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto p-1">
				{/* None option */}
				<Button
					type="button"
					variant={selectedIcon === null ? "default" : "outline"}
					size="icon"
					className="size-12"
					onClick={() => onIconSelect(null)}
					title="None"
				>
					<X className="size-5" />
				</Button>
				{filteredIcons.map((iconName) => {
					const isSelected = selectedIcon === iconName
					return (
						<Button
							key={iconName}
							type="button"
							variant={isSelected ? "default" : "outline"}
							size="icon"
							className={`size-12 transition-all ${
								isSelected ? "ring-2 ring-ring ring-offset-2" : ""
							}`}
							onClick={() => onIconSelect(iconName)}
							title={iconName}
						>
							{getIconComponent(iconName)}
						</Button>
					)
				})}
			</div>
		</div>
	)
}

