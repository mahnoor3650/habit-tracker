import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconPicker } from "./IconPicker"

export type HabitFormValues = {
	name: string
	description?: string | null
	icon?: string | null
	category?: string | null
}

export function HabitForm({
	initial,
	onSubmit,
	submitLabel = "Save",
}: {
	initial?: HabitFormValues
	onSubmit: (values: HabitFormValues) => Promise<void> | void
	submitLabel?: string
}) {
	const [values, setValues] = useState<HabitFormValues>({
		name: initial?.name ?? "",
		description: initial?.description ?? "",
		icon: initial?.icon ?? null,
		category: initial?.category ?? null,
	})
	const [loading, setLoading] = useState(false)

	// Reset form when initial changes
	useEffect(() => {
		setValues({
			name: initial?.name ?? "",
			description: initial?.description ?? "",
			icon: initial?.icon ?? null,
			category: initial?.category ?? null,
		})
	}, [initial])

	function update<K extends keyof HabitFormValues>(key: K, v: HabitFormValues[K]) {
		setValues((prev) => ({ ...prev, [key]: v }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		await onSubmit(values)
		setLoading(false)
	}

	return (
		<form id="habit-form" onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					placeholder="e.g., Drink water, Exercise, Read book"
					value={values.name}
					onChange={(e) => update("name", e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Input
					id="description"
					placeholder="Add more details about this habit"
					value={values.description ?? ""}
					onChange={(e) => update("description", e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="category">Category (optional)</Label>
				<Input
					id="category"
					placeholder="e.g., Health, Fitness, Learning"
					value={values.category ?? ""}
					onChange={(e) => update("category", e.target.value.trim() || null)}
				/>
			</div>
			<div className="space-y-3">
				<Label>Icon</Label>
				<IconPicker selectedIcon={values.icon} onIconSelect={(icon) => update("icon", icon)} />
			</div>
			{submitLabel === "Create" && (
				<div className="flex justify-end pt-2">
					<Button type="submit" disabled={loading}>
						{loading ? "Creating..." : submitLabel}
					</Button>
				</div>
			)}
		</form>
	)
}
