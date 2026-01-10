import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconPicker } from "@/components/habits/IconPicker"

export type MetricFormValues = {
	name: string
	description?: string | null
	unit?: string | null
	icon?: string | null
	color?: string | null
}

export function MetricForm({
	initial,
	onSubmit,
	submitLabel = "Save",
}: {
	initial?: MetricFormValues
	onSubmit: (values: MetricFormValues) => Promise<void> | void
	submitLabel?: string
}) {
	const [values, setValues] = useState<MetricFormValues>({
		name: initial?.name ?? "",
		description: initial?.description ?? "",
		unit: initial?.unit ?? "",
		icon: initial?.icon ?? null,
		color: initial?.color ?? null,
	})
	const [loading, setLoading] = useState(false)

	// Reset form when initial changes
	useEffect(() => {
		setValues({
			name: initial?.name ?? "",
			description: initial?.description ?? "",
			unit: initial?.unit ?? "",
			icon: initial?.icon ?? null,
			color: initial?.color ?? null,
		})
	}, [initial])

	function update<K extends keyof MetricFormValues>(key: K, v: MetricFormValues[K]) {
		setValues((prev) => ({ ...prev, [key]: v }))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		await onSubmit(values)
		setLoading(false)
	}

	return (
		<form id="metric-form" onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="name">Name</Label>
				<Input
					id="name"
					placeholder="e.g., Sleep, Water, Steps, Weight"
					value={values.name}
					onChange={(e) => update("name", e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="description">Description (optional)</Label>
				<Input
					id="description"
					placeholder="Add more details about this metric"
					value={values.description ?? ""}
					onChange={(e) => update("description", e.target.value)}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="unit">Unit (optional)</Label>
				<Input
					id="unit"
					placeholder="e.g., hours, glasses, steps, kg"
					value={values.unit ?? ""}
					onChange={(e) => update("unit", e.target.value)}
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
