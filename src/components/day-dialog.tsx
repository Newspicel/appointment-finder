import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/lib/app-context"
import {
	type DayWindow,
	dayWindows,
	type EntryInput,
	type EntryWindow,
	normalizeEntry,
	windowOn,
} from "@/lib/availability"
import { personColor } from "@/lib/colors"
import { fmtDate, fmtTime, parseTime } from "@/lib/dates"
import type { Messages } from "@/lib/i18n"
import { addEntry, removeEntry } from "@/server/functions"
import type { SessionEntry, SessionPerson } from "@/session-do"

function dayMonth(iso: string): string {
	return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

function windowLabel(w: DayWindow, t: Messages): string {
	if (w.start === 0 && w.end === 1440) return t.legendAllDay
	return `${fmtTime(w.start)}–${fmtTime(w.end)}`
}

function entryLabel(e: EntryWindow, t: Messages): string {
	if (e.startDate === e.endDate) {
		if (e.startMin === null && e.endMin === null) return t.legendAllDay
		return `${fmtTime(e.startMin ?? 0)}–${fmtTime(e.endMin ?? 1440)}`
	}
	const from = e.startMin !== null ? ` ${fmtTime(e.startMin)}` : ""
	const to = e.endMin !== null ? ` ${fmtTime(e.endMin)}` : ""
	return `${dayMonth(e.startDate)}${from} – ${dayMonth(e.endDate)}${to}`
}

function AddForm({
	iso,
	sessionId,
	onMutate,
}: {
	iso: string
	sessionId: string
	onMutate: () => Promise<void>
}) {
	const { t } = useApp()
	const [mode, setMode] = useState<"allday" | "times">("allday")
	const [from, setFrom] = useState("")
	const [to, setTo] = useState("")
	const [until, setUntil] = useState(iso)
	const [error, setError] = useState(false)
	const [busy, setBusy] = useState(false)

	const input: EntryInput = {
		startDate: iso,
		endDate: until || iso,
		startMin: mode === "times" && from ? parseTime(from) : undefined,
		endMin: mode === "times" && to ? parseTime(to) : undefined,
	}
	const preview = normalizeEntry(input)

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy) return
		if (!preview) {
			setError(true)
			return
		}
		setBusy(true)
		try {
			await addEntry({ data: { sessionId, entry: input } })
			await onMutate()
			setMode("allday")
			setFrom("")
			setTo("")
			setUntil(iso)
			setError(false)
		} catch {
			toast.error(t.errorGeneric)
		} finally {
			setBusy(false)
		}
	}

	return (
		<form onSubmit={submit} className="grid gap-3 border-t border-border pt-4">
			<Segmented<"allday" | "times">
				label={t.timeMode}
				value={mode}
				onChange={(next) => {
					setMode(next)
					setFrom("")
					setTo("")
					setError(false)
				}}
				options={[
					{ value: "allday", label: t.allDay, title: t.allDay },
					{ value: "times", label: t.withTimes, title: t.withTimes },
				]}
				buttonClassName="h-8 flex-1"
			/>
			{mode === "times" && (
				<div className="grid grid-cols-2 gap-2">
					<div className="grid min-w-0 gap-1">
						<Label htmlFor="entry-from" className="text-xs text-muted-foreground">
							{t.from}
						</Label>
						<Input
							id="entry-from"
							type="time"
							value={from}
							onChange={(e) => {
								setFrom(e.target.value)
								setError(false)
							}}
						/>
					</div>
					<div className="grid min-w-0 gap-1">
						<Label htmlFor="entry-to" className="text-xs text-muted-foreground">
							{t.to}
						</Label>
						<Input
							id="entry-to"
							type="time"
							value={to}
							onChange={(e) => {
								setTo(e.target.value)
								setError(false)
							}}
						/>
					</div>
				</div>
			)}
			<div className="grid min-w-0 gap-1">
				<Label htmlFor="entry-until" className="text-xs text-muted-foreground">
					{t.untilDate}
				</Label>
				<Input
					id="entry-until"
					type="date"
					min={iso}
					value={until}
					onChange={(e) => {
						setUntil(e.target.value)
						setError(false)
					}}
				/>
			</div>
			{error && <p className="text-sm text-destructive">{t.timeInvalid}</p>}
			<Button type="submit" disabled={busy} className="tnum">
				{preview ? `${t.add}: ${entryLabel(preview, t)}` : t.add}
			</Button>
		</form>
	)
}

export function DayDialog({
	iso,
	onClose,
	persons,
	meId,
	sessionId,
	onMutate,
}: {
	iso: string | null
	onClose: () => void
	persons: SessionPerson[]
	meId: string | null
	sessionId: string
	onMutate: () => Promise<void>
}) {
	const { t } = useApp()
	if (!iso) {
		return null
	}

	const weekday = t.weekdaysLong[(new Date(`${iso}T00:00:00`).getDay() + 6) % 7]
	const rows = persons
		.map((p, i) => ({ person: p, index: i, windows: dayWindows(p.entries, iso) }))
		.filter((r) => r.windows.length > 0)
	const total = persons.length
	const everyone = total >= 2 && rows.length === total
	const mine = persons.find((p) => p.id === meId)?.entries.filter((e) => windowOn(e, iso) !== null)

	const deleteEntry = async (entry: SessionEntry) => {
		try {
			await removeEntry({ data: { sessionId, entryId: entry.id } })
			await onMutate()
		} catch {
			toast.error(t.errorGeneric)
		}
	}

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="tnum font-mono text-base font-medium">
						{weekday}, {fmtDate(iso)}
					</DialogTitle>
					{total > 0 && (
						<DialogDescription>
							{everyone ? t.everyoneAvailable : t.availableCount(rows.length, total)}
						</DialogDescription>
					)}
				</DialogHeader>
				{rows.length > 0 && (
					<ul className="grid gap-1.5">
						{rows.map((row) => (
							<li key={row.person.id} className="flex items-baseline gap-2 text-sm">
								<span
									className="size-2 shrink-0 self-center rounded-full"
									style={{ background: personColor(row.index) }}
								/>
								<span className="min-w-0 truncate">
									{row.person.name}
									{row.person.id === meId && (
										<span className="text-muted-foreground"> · {t.you}</span>
									)}
								</span>
								<span className="tnum ms-auto text-end font-mono text-[13px] text-muted-foreground">
									{row.windows.map((w) => windowLabel(w, t)).join(", ")}
								</span>
							</li>
						))}
					</ul>
				)}
				{mine && mine.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{mine.map((entry) => (
							<span
								key={entry.id}
								className="tnum inline-flex items-center gap-1 rounded-md bg-secondary py-1 ps-2 pe-1 font-mono text-xs text-secondary-foreground"
							>
								{entryLabel(entry, t)}
								<button
									type="button"
									aria-label={`${t.removePerson}: ${entryLabel(entry, t)}`}
									onClick={() => deleteEntry(entry)}
									className="rounded-sm p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
								>
									<XIcon className="size-3" />
								</button>
							</span>
						))}
					</div>
				)}
				{meId && <AddForm key={iso} iso={iso} sessionId={sessionId} onMutate={onMutate} />}
			</DialogContent>
		</Dialog>
	)
}
