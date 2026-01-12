import { useState } from "react"
import { useTheme } from "@/components/layout/ThemeProvider"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Moon, Sun, User, LogOut, BookOpen, Calendar } from "lucide-react"
import { ProfileDialog } from "@/components/auth/ProfileDialog"
import { useLocation, Link } from "react-router-dom"

export function Header() {
	const { theme, toggle } = useTheme()
	const { user, signOut } = useAuth()
	const location = useLocation()
	const [profileOpen, setProfileOpen] = useState(false)

	// Don't show user menu on login page
	const isLoginPage = location.pathname === "/login"

	function getInitials(email: string, displayName?: string) {
		if (displayName) {
			return displayName
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		}
		return email[0].toUpperCase()
	}

	const isJournalPage = location.pathname.startsWith("/journal")
	const isDashboardPage = location.pathname === "/"

	return (
    <header className="w-full border-b bg-card/50 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-16 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-semibold hover:opacity-80 transition-opacity text-sm sm:text-base"
        >
          Habit Pilot
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {!isLoginPage && (
            <nav className="flex items-center gap-0.5 sm:gap-1 mr-2 sm:mr-4">
              <Button
                asChild
                variant={isDashboardPage ? "secondary" : "ghost"}
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <Link to="/">
                  <Calendar className="mr-1 sm:mr-2 size-3 sm:size-4" />
                  <span className="hidden sm:inline">Habits</span>
                </Link>
              </Button>
              <Button
                asChild
                variant={isJournalPage ? "secondary" : "ghost"}
                size="sm"
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <Link to="/journal">
                  <BookOpen className="mr-1 sm:mr-2 size-3 sm:size-4" />
                  <span className="hidden sm:inline">Journal</span>
                </Link>
              </Button>
            </nav>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          {!isLoginPage && user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="size-8">
                      <AvatarFallback>
                        {getInitials(
                          user.email ?? "",
                          user.user_metadata?.display_name as string | undefined
                        )}
                      </AvatarFallback>
                    </Avatar>
					
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {(user.user_metadata?.display_name as
                          | string
                          | undefined) ?? "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                    <User className="mr-2 size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={signOut}>
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}


