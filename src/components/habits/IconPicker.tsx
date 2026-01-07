import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { X, Search } from "lucide-react"

// Comprehensive list of habit-related emojis with categories
const habitEmojis = [
	// Health & Fitness
	{ emoji: "💪", name: "Flexed Biceps", keywords: ["muscle", "strong", "gym", "fitness", "workout", "exercise"] },
	{ emoji: "🏃", name: "Running", keywords: ["run", "jog", "cardio", "exercise", "fitness"] },
	{ emoji: "🚴", name: "Biking", keywords: ["bike", "cycle", "cycling", "exercise"] },
	{ emoji: "🧘", name: "Yoga", keywords: ["yoga", "meditation", "mindfulness", "zen", "peace"] },
	{ emoji: "🏋️", name: "Weight Lifting", keywords: ["weights", "gym", "strength", "lift"] },
	{ emoji: "💚", name: "Green Heart", keywords: ["heart", "health", "love", "care"] },
	{ emoji: "❤️", name: "Red Heart", keywords: ["heart", "love", "health", "care"] },
	{ emoji: "🍎", name: "Apple", keywords: ["apple", "fruit", "healthy", "eat", "food"] },
	{ emoji: "🥗", name: "Salad", keywords: ["salad", "healthy", "eat", "food", "vegetables"] },
	{ emoji: "💧", name: "Water", keywords: ["water", "drink", "hydration", "healthy"] },
	{ emoji: "🥤", name: "Drink", keywords: ["drink", "beverage", "water", "juice"] },
	{ emoji: "💊", name: "Pill", keywords: ["medicine", "pill", "health", "medication"] },
	{ emoji: "⚖️", name: "Scale", keywords: ["weight", "scale", "measure", "health"] },
	{ emoji: "🩺", name: "Stethoscope", keywords: ["doctor", "health", "medical", "checkup"] },
	
	// Learning & Growth
	{ emoji: "📚", name: "Books", keywords: ["read", "book", "learning", "study", "education"] },
	{ emoji: "📖", name: "Open Book", keywords: ["read", "book", "study", "learning"] },
	{ emoji: "🎓", name: "Graduation Cap", keywords: ["graduate", "education", "learning", "study"] },
	{ emoji: "💡", name: "Light Bulb", keywords: ["idea", "learn", "think", "creativity"] },
	{ emoji: "🎯", name: "Target", keywords: ["goal", "target", "aim", "focus"] },
	{ emoji: "🏆", name: "Trophy", keywords: ["trophy", "win", "achieve", "success", "goal"] },
	{ emoji: "⭐", name: "Star", keywords: ["star", "favorite", "important", "excellent"] },
	{ emoji: "📈", name: "Chart Increasing", keywords: ["growth", "progress", "increase", "improve"] },
	{ emoji: "🌱", name: "Seedling", keywords: ["grow", "plant", "growth", "nature"] },
	
	// Productivity & Organization
	{ emoji: "✅", name: "Check Mark", keywords: ["done", "complete", "check", "task"] },
	{ emoji: "📅", name: "Calendar", keywords: ["calendar", "date", "schedule", "plan"] },
	{ emoji: "⏰", name: "Alarm Clock", keywords: ["time", "alarm", "wake", "schedule"] },
	{ emoji: "⏱️", name: "Stopwatch", keywords: ["timer", "time", "track", "measure"] },
	{ emoji: "📝", name: "Memo", keywords: ["note", "write", "journal", "remember"] },
	{ emoji: "📋", name: "Clipboard", keywords: ["task", "list", "organize", "plan"] },
	
	// Creative & Hobbies
	{ emoji: "🎨", name: "Artist Palette", keywords: ["art", "paint", "creative", "draw"] },
	{ emoji: "🎵", name: "Musical Note", keywords: ["music", "song", "listen", "play"] },
	{ emoji: "🎸", name: "Guitar", keywords: ["guitar", "music", "play", "instrument"] },
	{ emoji: "🎤", name: "Microphone", keywords: ["sing", "music", "voice", "karaoke"] },
	{ emoji: "📷", name: "Camera", keywords: ["photo", "camera", "photography", "capture"] },
	{ emoji: "🎬", name: "Movie Camera", keywords: ["movie", "film", "watch", "cinema"] },
	{ emoji: "✍️", name: "Writing Hand", keywords: ["write", "journal", "pen", "note"] },
	
	// Food & Drink
	{ emoji: "☕", name: "Coffee", keywords: ["coffee", "drink", "morning", "caffeine"] },
	{ emoji: "🍽️", name: "Fork and Knife", keywords: ["eat", "meal", "food", "dinner"] },
	{ emoji: "🥑", name: "Avocado", keywords: ["avocado", "healthy", "food", "eat"] },
	{ emoji: "🥙", name: "Stuffed Flatbread", keywords: ["food", "eat", "meal", "sandwich"] },
	{ emoji: "🍌", name: "Banana", keywords: ["banana", "fruit", "healthy", "eat"] },
	{ emoji: "🍊", name: "Orange", keywords: ["orange", "fruit", "vitamin", "healthy"] },
	{ emoji: "🥛", name: "Glass of Milk", keywords: ["milk", "drink", "calcium", "healthy"] },
	
	// Sleep & Rest
	{ emoji: "😴", name: "Sleeping Face", keywords: ["sleep", "rest", "tired", "bed"] },
	{ emoji: "🛏️", name: "Bed", keywords: ["bed", "sleep", "rest", "night"] },
	{ emoji: "🌙", name: "Crescent Moon", keywords: ["moon", "night", "sleep", "dream"] },
	{ emoji: "🌅", name: "Sunrise", keywords: ["morning", "wake", "sunrise", "start"] },
	{ emoji: "🌞", name: "Sun with Face", keywords: ["sun", "day", "bright", "morning"] },
	
	// Mindfulness & Wellbeing
	{ emoji: "🧘‍♀️", name: "Woman in Lotus Position", keywords: ["meditation", "yoga", "peace", "mindfulness"] },
	{ emoji: "🧘‍♂️", name: "Man in Lotus Position", keywords: ["meditation", "yoga", "peace", "mindfulness"] },
	{ emoji: "🌸", name: "Cherry Blossom", keywords: ["flower", "spring", "beauty", "peace"] },
	{ emoji: "🌿", name: "Herb", keywords: ["plant", "nature", "green", "calm"] },
	{ emoji: "🕯️", name: "Candle", keywords: ["candle", "peace", "calm", "meditation"] },
	{ emoji: "🧘", name: "Person in Lotus Position", keywords: ["meditation", "yoga", "peace", "zen"] },
	
	// Social & Communication
	{ emoji: "👥", name: "People", keywords: ["friends", "social", "people", "group"] },
	{ emoji: "👤", name: "Person", keywords: ["person", "user", "profile"] },
	{ emoji: "💬", name: "Speech Balloon", keywords: ["chat", "message", "talk", "communicate"] },
	{ emoji: "📞", name: "Telephone", keywords: ["phone", "call", "contact", "talk"] },
	{ emoji: "✉️", name: "Envelope", keywords: ["email", "mail", "message", "letter"] },
	{ emoji: "😊", name: "Smiling Face", keywords: ["happy", "smile", "joy", "good"] },
	{ emoji: "😁", name: "Grinning Face", keywords: ["happy", "excited", "joy", "laugh"] },
	
	// Work & Career
	{ emoji: "💼", name: "Briefcase", keywords: ["work", "job", "career", "business"] },
	{ emoji: "💻", name: "Laptop", keywords: ["computer", "work", "code", "laptop"] },
	{ emoji: "📊", name: "Bar Chart", keywords: ["chart", "data", "analytics", "report"] },
	{ emoji: "📁", name: "File Folder", keywords: ["folder", "files", "organize", "work"] },
	
	// Travel & Adventure
	{ emoji: "✈️", name: "Airplane", keywords: ["travel", "plane", "trip", "flight"] },
	{ emoji: "🚗", name: "Car", keywords: ["car", "drive", "travel", "vehicle"] },
	{ emoji: "🗺️", name: "World Map", keywords: ["map", "travel", "world", "location"] },
	{ emoji: "🧭", name: "Compass", keywords: ["compass", "direction", "navigation", "adventure"] },
	{ emoji: "🎒", name: "Backpack", keywords: ["bag", "travel", "adventure", "trip"] },
	
	// Nature & Outdoors
	{ emoji: "🏔️", name: "Mountain", keywords: ["mountain", "hike", "nature", "outdoor"] },
	{ emoji: "🌳", name: "Tree", keywords: ["tree", "nature", "plant", "green"] },
	{ emoji: "🐦", name: "Bird", keywords: ["bird", "nature", "freedom", "fly"] },
	{ emoji: "🌊", name: "Water Wave", keywords: ["ocean", "water", "beach", "swim"] },
	
	// Finance
	{ emoji: "💰", name: "Money Bag", keywords: ["money", "save", "finance", "wealth"] },
	{ emoji: "💵", name: "Dollar Banknote", keywords: ["money", "dollar", "cash", "finance"] },
	{ emoji: "💳", name: "Credit Card", keywords: ["card", "payment", "buy", "finance"] },
	{ emoji: "🐷", name: "Piggy Bank", keywords: ["save", "money", "piggy bank", "finance"] },
	
	// Technology
	{ emoji: "📱", name: "Mobile Phone", keywords: ["phone", "mobile", "smartphone", "tech"] },
	{ emoji: "🎮", name: "Video Game", keywords: ["game", "play", "fun", "entertainment"] },
	{ emoji: "📺", name: "Television", keywords: ["tv", "watch", "entertainment", "screen"] },
	
	// Home & Lifestyle
	{ emoji: "🏠", name: "House", keywords: ["home", "house", "place", "live"] },
	{ emoji: "🛋️", name: "Couch and Lamp", keywords: ["couch", "relax", "home", "furniture"] },
	{ emoji: "👕", name: "T-Shirt", keywords: ["clothes", "shirt", "dress", "fashion"] },
	{ emoji: "🛒", name: "Shopping Cart", keywords: ["shopping", "buy", "cart", "store"] },
	
	// Misc
	{ emoji: "🎁", name: "Wrapped Gift", keywords: ["gift", "present", "celebration", "surprise"] },
	{ emoji: "🔒", name: "Locked", keywords: ["lock", "secure", "safe", "protect"] },
	{ emoji: "🔑", name: "Key", keywords: ["key", "unlock", "access", "open"] },
	{ emoji: "🚀", name: "Rocket", keywords: ["rocket", "launch", "start", "fast"] },
	{ emoji: "✨", name: "Sparkles", keywords: ["sparkle", "magic", "special", "shine"] },
	{ emoji: "🔥", name: "Fire", keywords: ["fire", "hot", "streak", "motivation"] },
	{ emoji: "💫", name: "Dizzy", keywords: ["star", "sparkle", "magic", "special"] },
] as const

type IconPickerProps = {
	selectedIcon?: string | null
	onIconSelect: (iconName: string | null) => void
}

export function IconPicker({ selectedIcon, onIconSelect }: IconPickerProps) {
	const [open, setOpen] = useState(false)

	const selectedEmoji = habitEmojis.find((e) => e.emoji === selectedIcon)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" type="button">
					<div className="flex items-center gap-3 w-full">
						{selectedEmoji ? (
							<div className="size-12 rounded-md bg-primary/10 flex items-center justify-center text-2xl shrink-0">
								{selectedEmoji.emoji}
							</div>
						) : (
							<div className="size-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
								<Search className="size-5" />
							</div>
						)}
						<div className="text-left flex-1 min-w-0">
							<div className="text-sm font-medium truncate">
								{selectedEmoji ? selectedEmoji.name : "Select an icon"}
							</div>
							<div className="text-xs text-muted-foreground">
								{selectedEmoji ? "Click to change" : "Click to choose an emoji"}
							</div>
						</div>
						{selectedIcon && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="size-8 shrink-0"
								onClick={(e) => {
									e.stopPropagation()
									onIconSelect(null)
								}}
							>
								<X className="size-4" />
							</Button>
						)}
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="start" sideOffset={8}>
				<Command shouldFilter={true}>
					<CommandInput placeholder="Search emojis..." />
					<CommandList className="max-h-[300px]">
						<CommandEmpty>No emoji found. Try a different search.</CommandEmpty>
						<CommandGroup>
							<div className="grid grid-cols-8 gap-2 p-3">
								{/* None option */}
								<CommandItem
									value="none remove clear"
									onSelect={() => {
										onIconSelect(null)
										setOpen(false)
									}}
									className="p-0 h-auto"
								>
									<Button
										type="button"
										variant={selectedIcon === null ? "default" : "outline"}
										size="icon"
										className={`size-12 ${selectedIcon === null ? "ring-2 ring-ring" : ""}`}
										title="None"
									>
										<X className="size-5" />
									</Button>
								</CommandItem>
								{habitEmojis.map((emojiData) => {
									const isSelected = selectedIcon === emojiData.emoji
									const searchValue = `${emojiData.name} ${emojiData.keywords.join(" ")}`
									return (
										<CommandItem
											key={emojiData.emoji}
											value={searchValue.toLowerCase()}
											keywords={[...emojiData.keywords]}
											onSelect={() => {
												onIconSelect(emojiData.emoji)
												setOpen(false)
											}}
											className="p-0 h-auto"
										>
											<Button
												type="button"
												variant={isSelected ? "default" : "outline"}
												size="icon"
												className={`size-12 text-2xl transition-all ${
													isSelected ? "ring-2 ring-ring ring-offset-1" : "hover:bg-accent"
												}`}
												title={emojiData.name}
											>
												{emojiData.emoji}
											</Button>
										</CommandItem>
									)
								})}
							</div>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
