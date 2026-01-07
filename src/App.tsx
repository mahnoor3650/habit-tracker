import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/lib/hooks/useAuth"
import { HabitsProvider } from "@/lib/hooks/useHabits"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import HabitDetail from "@/pages/HabitDetail"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Header } from "@/components/layout/Header"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<HabitsProvider>
					<BrowserRouter>
						<Header />
						<Routes>
							<Route path="/login" element={<Login />} />
							<Route
								path="/"
								element={
									<ProtectedRoute>
										<Dashboard />
									</ProtectedRoute>
								}
							/>
							<Route
								path="/habit/:id"
								element={
									<ProtectedRoute>
										<HabitDetail />
									</ProtectedRoute>
								}
							/>
							<Route path="*" element={<Navigate to="/" replace />} />
						</Routes>
						<Toaster />
					</BrowserRouter>
				</HabitsProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
