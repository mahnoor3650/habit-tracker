import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type AuthContextValue = {
	user: User | null
	session: Session | null
	loading: boolean
	signIn: (email: string, password: string) => Promise<{ error?: string }>
	signUp: (email: string, password: string) => Promise<{ error?: string }>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let isActive = true
		;(async () => {
			const { data } = await supabase.auth.getSession()
			if (!isActive) return
			setSession(data.session ?? null)
			setUser(data.session?.user ?? null)
			setLoading(false)
		})()

		const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
			setSession(newSession)
			setUser(newSession?.user ?? null)
			setLoading(false)
		})

		return () => {
			isActive = false
			listener.subscription.unsubscribe()
		}
	}, [])

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			session,
			loading,
			signIn: async (email: string, password: string) => {
				const { error } = await supabase.auth.signInWithPassword({ email, password })
				return { error: error?.message }
			},
			signUp: async (email: string, password: string) => {
				const { error } = await supabase.auth.signUp({ email, password })
				return { error: error?.message }
			},
			signOut: async () => {
				await supabase.auth.signOut()
			},
		}),
		[user, session, loading]
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used within AuthProvider")
	return ctx
}


