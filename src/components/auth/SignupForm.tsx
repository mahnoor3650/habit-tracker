import React, { useState } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
	const { signUp } = useAuth()
	const [displayName, setDisplayName] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setLoading(true)
		const { error } = await signUp(email, password, displayName.trim() || undefined)
		setLoading(false)
		if (error) setError(error)
		else {
			toast.success("Verification email sent", {
				description: "Please verify your account to sign in.",
			})
			onSuccess?.()
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="displayName">Display name</Label>
				<Input
					id="displayName"
					placeholder="Horizon"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					type="email"
					placeholder="you@example.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<Input
					id="password"
					type="password"
					placeholder="At least 6 characters"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
				/>
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
			<Button type="submit" disabled={loading} className="w-full">
				{loading ? "Creating account..." : "Sign Up"}
			</Button>
		</form>
	)
}


