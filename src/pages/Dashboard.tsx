import React, { useState } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { HabitTable } from "@/components/habits/HabitTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HabitForm } from "@/components/habits/HabitForm"
import type { HabitFormValues } from "@/components/habits/HabitForm"
import { Plus, Trash } from "lucide-react"
import { toast } from "sonner"

export default function Dashboard() {
	const { user } = useAuth()
	const { updateHabit, createHabit, deleteHabit } = useHabits()
	const [createOpen, setCreateOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

	async function handleCreate(values: HabitFormValues) {
		const result = await createHabit(values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit created")
			setCreateOpen(false)
		}
	}

	async function handleUpdate(values: HabitFormValues) {
		if (!selectedHabit) return
		const result = await updateHabit(selectedHabit.id, values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit updated")
			setEditOpen(false)
			setSelectedHabit(null)
		}
	}

	async function handleDelete() {
		if (!selectedHabit) return
		if (!confirm("Delete this habit?")) return
		const result = await deleteHabit(selectedHabit.id)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit deleted")
			setEditOpen(false)
			setSelectedHabit(null)
		}
	}

	function handleHabitClick(habit: Habit) {
		setSelectedHabit(habit)
		setEditOpen(true)
	}

	const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })

	return (
		<div className="w-full px-16 py-8 space-y-8">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Your Habits</h1>
					<p className="text-sm text-muted-foreground">
						{currentMonth} • {(user?.user_metadata?.display_name as string | undefined) ?? user?.email}
					</p>
				</div>
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 size-4" />
							Add Habit
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>New Habit</DialogTitle>
						</DialogHeader>
						<HabitForm onSubmit={handleCreate} submitLabel="Create" />
					</DialogContent>
				</Dialog>
			</header>

			<HabitTable onHabitClick={handleHabitClick} />

			{/* Edit Dialog */}
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Habit</DialogTitle>
					</DialogHeader>
					{selectedHabit && (
						<div className="space-y-4">
							<HabitForm
								initial={{
									name: selectedHabit.name,
									description: selectedHabit.description,
									icon: selectedHabit.icon,
								}}
								onSubmit={handleUpdate}
								submitLabel="Update"
							/>
							<Button
								variant="destructive"
								className="w-full"
								onClick={handleDelete}
							>
								<Trash className="mr-2 size-4" />
								Delete Habit
							</Button>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}


