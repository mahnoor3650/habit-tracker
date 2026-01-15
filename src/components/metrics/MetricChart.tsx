import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import * as icons from "lucide-react"
import type { Metric } from "@/lib/hooks/useMetrics"

type MetricChartProps = {
	metric: Metric
	entries: Record<string, number>
	dates: Date[]
	loading?: boolean
}

function formatDateISO(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDateLabel(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function MetricChart({ metric, entries, dates, loading }: MetricChartProps) {
	const chartData = useMemo(() => {
		return dates.map((date) => {
			const dateStr = formatDateISO(date)
			return {
				date,
				dateStr,
				value: entries[dateStr] ?? 0,
				label: formatDateLabel(date),
			}
		})
	}, [dates, entries])

	const maxValue = useMemo(() => {
		const values = chartData.map((d) => d.value)
		const max = Math.max(...values, 1)
		// Round up to nearest nice number
		if (max <= 10) return 10
		if (max <= 20) return 20
		if (max <= 50) return Math.ceil(max / 10) * 10
		if (max <= 100) return Math.ceil(max / 20) * 20
		return Math.ceil(max / 50) * 50
	}, [chartData])

	const chartHeight = 200
	const chartPadding = { top: 20, right: 20, bottom: 40, left: 50 }
	const chartWidth = Math.max(600, dates.length * 40)
	const innerWidth = chartWidth - chartPadding.left - chartPadding.right
	const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom

	const points = useMemo(() => {
		return chartData.map((point, index) => {
			const x = chartPadding.left + (index / (chartData.length - 1 || 1)) * innerWidth
			const y = chartPadding.top + innerHeight - (point.value / maxValue) * innerHeight
			return { ...point, x, y }
		})
	}, [chartData, maxValue, innerWidth, innerHeight, chartPadding])

	const pathData = useMemo(() => {
		if (points.length === 0) return ""
		if (points.length === 1) {
			return `M ${points[0].x} ${points[0].y}`
		}
		return points
			.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
			.join(" ")
	}, [points])

	const areaPathData = useMemo(() => {
		if (points.length === 0) return ""
		const firstPoint = points[0]
		const lastPoint = points[points.length - 1]
		return `${pathData} L ${lastPoint.x} ${chartPadding.top + innerHeight} L ${firstPoint.x} ${chartPadding.top + innerHeight} Z`
	}, [pathData, points, chartPadding, innerHeight])

	// Generate Y-axis labels
	const yAxisLabels = useMemo(() => {
		const steps = 5
		const labels: Array<{ value: number; y: number }> = []
		for (let i = 0; i <= steps; i++) {
			const value = (maxValue / steps) * (steps - i)
			const y = chartPadding.top + (i / steps) * innerHeight
			labels.push({ value, y })
		}
		return labels
	}, [maxValue, innerHeight, chartPadding])

	// Generate X-axis labels (show every nth label to avoid crowding)
	const xAxisLabels = useMemo(() => {
		const step = Math.max(1, Math.floor(dates.length / 8))
		return points.filter((_, index) => index % step === 0 || index === points.length - 1)
	}, [points, dates.length])

	function getIcon(iconName?: string | null) {
		if (iconName && /[\p{Emoji}\u200d]/u.test(iconName)) {
			return <span className="text-xl">{iconName}</span>
		}
		if (iconName) {
			const IconComponent = (icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName]
			return IconComponent ? <IconComponent className="size-5" /> : null
		}
		return null
	}

	if (loading) {
		return (
			<Card className="p-6">
				<div className="flex items-center justify-center h-[200px]">
					<Loader2 className="size-6 animate-spin text-primary" />
				</div>
			</Card>
		)
	}

	const hasData = chartData.some((d) => d.value > 0)

	return (
		<Card className="p-4 sm:p-6">
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					{getIcon(metric.icon)}
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-base sm:text-lg truncate">{metric.name}</h3>
						{metric.unit && <p className="text-xs sm:text-sm text-muted-foreground">{metric.unit}</p>}
					</div>
				</div>

				{hasData ? (
					<div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
						<svg width={chartWidth} height={chartHeight} className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
							{/* Grid lines */}
							<g className="text-muted-foreground/30">
								{yAxisLabels.map((label, index) => (
									<line
										key={index}
										x1={chartPadding.left}
										y1={label.y}
										x2={chartPadding.left + innerWidth}
										y2={label.y}
										stroke="currentColor"
										strokeWidth="1"
										strokeDasharray="2,2"
									/>
								))}
							</g>

							{/* Y-axis labels */}
							<g className="text-xs text-muted-foreground">
								{yAxisLabels.map((label, index) => (
									<text
										key={index}
										x={chartPadding.left - 10}
										y={label.y + 4}
										textAnchor="end"
										className="fill-current"
									>
										{label.value.toFixed(label.value < 10 ? 1 : 0)}
									</text>
								))}
							</g>

							{/* Area fill */}
							<path
								d={areaPathData}
								fill="currentColor"
								className="text-primary/10"
							/>

							{/* Line */}
							<path
								d={pathData}
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								className="text-primary"
							/>

							{/* Data points */}
							{points.map((point, index) => (
								<g key={index}>
									<circle
										cx={point.x}
										cy={point.y}
										r="4"
										fill="currentColor"
										className="text-primary"
									/>
									{/* Tooltip on hover */}
									<title>
										{point.label}: {point.value.toFixed(1)} {metric.unit || ""}
									</title>
								</g>
							))}

							{/* X-axis labels */}
							<g className="text-xs text-muted-foreground">
								{xAxisLabels.map((point, index) => (
									<text
										key={index}
										x={point.x}
										y={chartHeight - chartPadding.bottom + 20}
										textAnchor="middle"
										className="fill-current"
									>
										{point.label}
									</text>
								))}
							</g>
						</svg>
					</div>
				) : (
					<div className="flex items-center justify-center h-[200px] text-muted-foreground">
						<p className="text-sm">No data available for this period</p>
					</div>
				)}
			</div>
		</Card>
	)
}
