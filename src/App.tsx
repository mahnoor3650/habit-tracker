import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/lib/hooks/useAuth"
import { HabitsProvider } from "@/lib/hooks/useHabits"
import { JournalProvider } from "@/lib/hooks/useJournal"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import HabitDetail from "@/pages/HabitDetail"
import Journal from "@/pages/Journal"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Header } from "@/components/layout/Header"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<HabitsProvider>
					<JournalProvider>
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
								<Route
									path="/journal"
									element={
										<ProtectedRoute>
											<Journal />
										</ProtectedRoute>
									}
								/>
								<Route path="*" element={<Navigate to="/" replace />} />
							</Routes>
							<Toaster />
						</BrowserRouter>
					</JournalProvider>
				</HabitsProvider>
			</AuthProvider>
		</ThemeProvider>
	)
}
