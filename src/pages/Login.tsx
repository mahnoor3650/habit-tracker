import React, { useState } from "react"
import { LoginForm } from "@/components/auth/LoginForm"
import { SignupForm } from "@/components/auth/SignupForm"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/useAuth"
import { Navigate } from "react-router-dom"

export default function Login() {
	const [mode, setMode] = useState<"login" | "signup">("login")
	const { user } = useAuth()
	if (user) return <Navigate to="/" replace />

	return (
		<div className="min-h-screen grid place-items-center p-4">
			<Card className="w-full max-w-sm p-6 space-y-4">
				<div className="text-center space-y-1">
					<h1 className="text-xl font-semibold">{mode === "login" ? "Welcome back" : "Create account"}</h1>
					<p className="text-sm text-muted-foreground">
						{mode === "login" ? "Sign in to continue" : "Sign up to get started"}
					</p>
				</div>
				{mode === "login" ? (
					<LoginForm onSuccess={() => (window.location.href = "/")} />
				) : (
					<SignupForm onSuccess={() => setMode("login")} />
				)}
				<div className="text-sm text-center">
					{mode === "login" ? (
						<>
							Don't have an account?{" "}
							<Button variant="link" className="px-0" onClick={() => setMode("signup")}>
								Sign up
							</Button>
						</>
					) : (
						<>
							Already have an account?{" "}
							<Button variant="link" className="px-0" onClick={() => setMode("login")}>
								Sign in
							</Button>
						</>
					)}
				</div>
			</Card>
		</div>
	)
}


