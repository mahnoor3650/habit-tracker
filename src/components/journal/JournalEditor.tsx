import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type JournalEditorProps = {
	content?: string | null
	onContentChange: (content: string) => void
}

export function JournalEditor({ content, onContentChange }: JournalEditorProps) {
	const [value, setValue] = useState(content || "")

	useEffect(() => {
		setValue(content || "")
	}, [content])

	function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
		const newValue = e.target.value
		setValue(newValue)
		onContentChange(newValue)
	}

	return (
		<Card className="p-4 space-y-0">
			<div>
				<h3 className="text-base font-semibold leading-tight">Journal Entry</h3>
				<p className="text-xs text-muted-foreground leading-tight">Write freely about your day, thoughts, and feelings</p>
			</div>
			<div className="space-y-1.5">
				<Textarea
					value={value}
					onChange={handleChange}
					placeholder="Today I felt... I learned... I'm grateful for..."
					className="min-h-[250px] resize-none font-sans text-sm"
				/>
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>Your private thoughts and reflections</span>
					<span>{value.length} characters</span>
				</div>
			</div>
		</Card>
	)
}
