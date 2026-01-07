import React, { useState } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { useHabits } from "@/lib/hooks/useHabits"
import { HabitCard } from "@/components/habits/HabitCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HabitForm, HabitFormValues } from "@/components/habits/HabitForm"
import { Plus } from "lucide-react"

export default function Dashboard() {
	const { user, signOut } = useAuth()
	const { habits, createHabit, loading } = useHabits()
	const [open, setOpen] = useState(false)

	async function handleCreate(values: HabitFormValues) {
		await createHabit(values)
		setOpen(false)
	}

	return (
		<div className="mx-auto max-w-4xl p-4 space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Your Habits</h1>
					<p className="text-sm text-muted-foreground">{user?.email}</p>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={open} onOpenChange={setOpen}>
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
					<Button variant="outline" onClick={signOut}>
						Sign out
					</Button>
				</div>
			</header>

			{loading ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : habits.length === 0 ? (
				<p className="text-sm text-muted-foreground">No habits yet. Create your first one.</p>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{habits.map((h) => (
						<HabitCard key={h.id} habit={h} />
					))}
				</div>
			)}
		</div>
	)
}


