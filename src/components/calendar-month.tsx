import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import type { DayWindow } from "@/lib/availability"
import { personColor } from "@/lib/colors"
import { fmtDate, type GridDay, monthGrid } from "@/lib/dates"
import { cn } from "@/lib/utils"

export type DayInfo = {
	windows: DayWindow[][]
	availableCount: number
}

const MAX_ROWS = 6

function DayCell({
	day,
	info,
	total,
	isToday,
	onSelect,
	label,
}: {
	day: GridDay
	info: DayInfo
	total: number
	isToday: boolean
	onSelect: (iso: string) => void
	label: string
}) {
	const everyone = total >= 2 && info.availableCount === total
	const rows = info.windows
		.map((windows, personIndex) => ({ windows, personIndex }))
		.filter((row) => row.windows.length > 0)
	const visible = rows.slice(0, MAX_ROWS)
	const extra = rows.length - visible.length

	return (
		<button
			type="button"
			aria-label={label}
			onClick={() => onSelect(day.iso)}
			className={cn(
				"relative h-16 p-1.5 text-left align-top transition-colors outline-none sm:h-20 sm:p-2",
				"focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
				everyone ? "bg-everyone hover:bg-everyone/70" : "bg-card hover:bg-accent",
				!day.inMonth && "opacity-45",
			)}
		>
			<span
				className={cn(
					"tnum inline-flex size-5 items-center justify-center rounded-full font-mono text-xs",
					isToday ? "bg-primary font-medium text-primary-foreground" : "text-foreground",
				)}
			>
				{day.day}
			</span>
			{extra > 0 && (
				<span className="absolute end-1 top-1.5 font-mono text-[9px] text-muted-foreground">
					+{extra}
				</span>
			)}
			<span className="absolute inset-x-1.5 bottom-1.5 flex flex-col gap-[2px] sm:inset-x-2 sm:bottom-2">
				{visible.map((row) => (
					<span
						key={row.personIndex}
						className="relative block h-[3px] overflow-hidden rounded-full bg-foreground/10"
					>
						{row.windows.map((w) => (
							<span
								key={w.start}
								className="absolute inset-y-0 rounded-full"
								style={{
									left: `${(w.start / 1440) * 100}%`,
									width: `${((w.end - w.start) / 1440) * 100}%`,
									background: personColor(row.personIndex),
								}}
							/>
						))}
					</span>
				))}
			</span>
		</button>
	)
}

export function CalendarMonth({
	year,
	month0,
	today,
	total,
	getDay,
	onPrev,
	onNext,
	onToday,
	onSelect,
}: {
	year: number
	month0: number
	today: string
	total: number
	getDay: (iso: string) => DayInfo
	onPrev: () => void
	onNext: () => void
	onToday: () => void
	onSelect: (iso: string) => void
}) {
	const { t } = useApp()
	const weeks = monthGrid(year, month0)

	return (
		<section className="grid gap-2">
			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon-sm" aria-label={t.prevMonth} onClick={onPrev}>
					<ChevronLeftIcon />
				</Button>
				<h2 className="tnum w-36 text-center font-mono text-sm font-medium">
					{t.months[month0]} {year}
				</h2>
				<Button variant="ghost" size="icon-sm" aria-label={t.nextMonth} onClick={onNext}>
					<ChevronRightIcon />
				</Button>
				<Button variant="ghost" size="sm" className="ms-auto" onClick={onToday}>
					{t.today}
				</Button>
			</div>
			<div className="grid grid-cols-7 px-px">
				{t.weekdays.map((wd) => (
					<span
						key={wd}
						className="pb-1.5 text-center font-mono text-[11px] tracking-wider text-muted-foreground uppercase"
					>
						{wd}
					</span>
				))}
			</div>
			<div className="overflow-hidden rounded-lg border border-border">
				<div className="grid grid-cols-7 gap-px bg-border">
					{weeks.flat().map((day) => {
						const info = getDay(day.iso)
						return (
							<DayCell
								key={day.iso}
								day={day}
								info={info}
								total={total}
								isToday={day.iso === today}
								onSelect={onSelect}
								label={`${fmtDate(day.iso)}, ${t.availableCount(info.availableCount, total)}`}
							/>
						)
					})}
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1.5">
					<span className="inline-block h-[3px] w-6 rounded-full bg-foreground/60" />
					{t.legendAllDay}
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="relative inline-block h-[3px] w-6 overflow-hidden rounded-full bg-foreground/10">
						<span className="absolute inset-y-0 left-[40%] w-[35%] rounded-full bg-foreground/60" />
					</span>
					{t.legendPartial}
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="inline-block size-3 rounded-sm border border-border bg-everyone" />
					{t.legendEveryone}
				</span>
			</div>
		</section>
	)
}
