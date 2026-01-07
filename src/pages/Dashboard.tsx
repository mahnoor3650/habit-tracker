import  { useState } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useHabits } from "@/lib/hooks/useHabits"
import type { Habit } from "@/lib/hooks/useHabits"
import { HabitTable } from "@/components/habits/HabitTable"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HabitForm, type HabitFormValues } from "@/components/habits/HabitForm"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import { toast } from "sonner"

type ViewMode = "week" | "15days" | "month"

export default function Dashboard() {
	const { user } = useAuth()
	const { updateHabit, createHabit, deleteHabit, refresh } = useHabits()
	const [createOpen, setCreateOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)
	const [view, setView] = useState<ViewMode>("15days")

	async function handleCreate(values: HabitFormValues) {
		const result = await createHabit(values)
		if (result.error) {
			toast.error(result.error)
		} else {
			toast.success("Habit created")
			setCreateOpen(false)
			await refresh()
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
			await refresh()
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
			await refresh()
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
				<div className="flex items-center gap-3">
					<Select value={view} onValueChange={(value) => setView(value as ViewMode)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue>
								<div className="flex items-center gap-2">
									{view === "week" && <Calendar className="size-4" />}
									{view === "15days" && <CalendarRange className="size-4" />}
									{view === "month" && <CalendarDays className="size-4" />}
									<span>
										{view === "week" ? "Week" : view === "15days" ? "15 Days" : "Month"}
									</span>
								</div>
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="week">
								<div className="flex items-center gap-2">
									<Calendar className="size-4" />
									Week
								</div>
							</SelectItem>
							<SelectItem value="15days">
								<div className="flex items-center gap-2">
									<CalendarRange className="size-4" />
									15 Days
								</div>
							</SelectItem>
							<SelectItem value="month">
								<div className="flex items-center gap-2">
									<CalendarDays className="size-4" />
									Month
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
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
				</div>
			</header>

			<HabitTable onHabitClick={handleHabitClick} view={view} />

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
							<div className="flex items-center justify-end gap-3 pt-2 border-t">
								<Button
									variant="destructive"
									onClick={handleDelete}
								>
									<Trash className="mr-2 size-4" />
									Delete
								</Button>
								<Button
									type="submit"
									form="habit-form"
								>
									Update
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	)
}


