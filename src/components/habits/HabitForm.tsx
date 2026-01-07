import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export type HabitFormValues = {
	name: string
	description?: string | null
	color?: string | null
	icon?: string | null
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
		color: initial?.color ?? "",
		icon: initial?.icon ?? "",
	})
	const [loading, setLoading] = useState(false)

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
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					placeholder="Drink water"
					value={values.name}
					onChange={(e) => update("name", e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Input
					id="description"
					placeholder="Details"
					value={values.description ?? ""}
					onChange={(e) => update("description", e.target.value)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="color">Color (optional)</Label>
					<Input
						id="color"
						placeholder="#22c55e"
						value={values.color ?? ""}
						onChange={(e) => update("color", e.target.value)}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="icon">Icon (lucide name)</Label>
					<Input
						id="icon"
						placeholder="flame"
						value={values.icon ?? ""}
						onChange={(e) => update("icon", e.target.value)}
					/>
				</div>
			</div>
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? "Saving..." : submitLabel}
			</Button>
		</form>
	)
}


