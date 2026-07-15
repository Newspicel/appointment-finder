import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router"
import { Link2Icon, Trash2Icon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarMonth, type DayInfo } from "@/components/calendar-month"
import { DayDialog } from "@/components/day-dialog"
import { PeopleRow } from "@/components/people-row"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/lib/app-context"
import { dayWindows } from "@/lib/availability"
import { addMonths, monthOf, todayIso } from "@/lib/dates"
import { deleteSession, getSession, joinSession } from "@/server/functions"

export const Route = createFileRoute("/s/$sessionId")({
	loader: async ({ params }) => ({
		session: await getSession({ data: { sessionId: params.sessionId } }),
		loadedToday: todayIso(),
	}),
	component: SessionPage,
})

function NotFound() {
	const { t } = useApp()
	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-[12vh] text-center">
			<h1 className="text-xl font-semibold">{t.notFoundTitle}</h1>
			<p className="mt-2 text-muted-foreground">{t.notFoundHint}</p>
			<Button asChild className="mx-auto mt-6">
				<Link to="/">{t.backHome}</Link>
			</Button>
		</main>
	)
}

function JoinCard({ sessionId, onMutate }: { sessionId: string; onMutate: () => Promise<void> }) {
	const { t } = useApp()
	const [name, setName] = useState("")
	const [error, setError] = useState(false)
	const [busy, setBusy] = useState(false)

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy) return
		if (name.trim().length === 0) {
			setError(true)
			return
		}
		setBusy(true)
		try {
			await joinSession({ data: { sessionId, name } })
			await onMutate()
		} catch {
			toast.error(t.errorGeneric)
		} finally {
			setBusy(false)
		}
	}

	return (
		<section className="rounded-xl border border-border bg-card p-4">
			<h2 className="text-sm font-medium">{t.joinTitle}</h2>
			<p className="mt-0.5 text-sm text-muted-foreground">{t.joinHint}</p>
			<form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
				<div className="min-w-40 flex-1">
					<Label htmlFor="join-name" className="sr-only">
						{t.yourName}
					</Label>
					<Input
						id="join-name"
						value={name}
						onChange={(e) => {
							setName(e.target.value)
							setError(false)
						}}
						placeholder={t.yourName}
						maxLength={40}
						aria-invalid={error}
					/>
				</div>
				<Button type="submit" disabled={busy}>
					{t.join}
				</Button>
			</form>
			{error && <p className="mt-2 text-sm text-destructive">{t.nameRequired}</p>}
		</section>
	)
}

function DeleteSessionButton({ sessionId }: { sessionId: string }) {
	const { t } = useApp()
	const navigate = useNavigate()
	const [busy, setBusy] = useState(false)

	const remove = async () => {
		if (busy) return
		setBusy(true)
		try {
			await deleteSession({ data: { sessionId } })
			await navigate({ to: "/" })
		} catch {
			toast.error(t.errorGeneric)
			setBusy(false)
		}
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon-sm" aria-label={t.deleteSession}>
					<Trash2Icon className="text-muted-foreground" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t.deleteSession}</DialogTitle>
					<DialogDescription>{t.deleteSessionConfirm}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="destructive" disabled={busy} onClick={remove}>
						{t.delete}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function SessionPage() {
	const { session, loadedToday } = Route.useLoaderData()
	const { sessionId } = Route.useParams()
	const { t } = useApp()
	const router = useRouter()
	const [today, setToday] = useState(loadedToday)
	const [[year, month0], setMonth] = useState(() => monthOf(loadedToday))
	const [selected, setSelected] = useState<string | null>(null)

	useEffect(() => {
		setToday(todayIso())
	}, [])

	const getDay = useMemo(() => {
		const cache = new Map<string, DayInfo>()
		return (iso: string): DayInfo => {
			if (!session) return { windows: [], availableCount: 0 }
			let info = cache.get(iso)
			if (!info) {
				const windows = session.persons.map((p) => dayWindows(p.entries, iso))
				info = {
					windows,
					availableCount: windows.filter((ws) => ws.length > 0).length,
				}
				cache.set(iso, info)
			}
			return info
		}
	}, [session])

	if (!session) return <NotFound />

	const onMutate = () => router.invalidate()
	const hasEntries = session.persons.some((p) => p.entries.length > 0)

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href)
			toast.success(t.linkCopied)
		} catch {
			toast.error(t.errorGeneric)
		}
	}

	return (
		<main className="mx-auto grid w-full max-w-3xl flex-1 content-start gap-5 px-4 py-6">
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="me-auto text-lg font-semibold tracking-tight">
					{session.title || t.untitled}
				</h1>
				<Button variant="outline" size="sm" onClick={copyLink}>
					<Link2Icon />
					{t.copyLink}
				</Button>
				{session.isCreator && <DeleteSessionButton sessionId={sessionId} />}
			</div>
			{!session.meId && <JoinCard sessionId={sessionId} onMutate={onMutate} />}
			<PeopleRow
				persons={session.persons}
				meId={session.meId}
				isCreator={session.isCreator}
				sessionId={sessionId}
				onMutate={onMutate}
			/>
			{session.meId && !hasEntries && (
				<p className="text-sm text-muted-foreground">{t.noEntries}</p>
			)}
			<CalendarMonth
				year={year}
				month0={month0}
				today={today}
				total={session.persons.length}
				getDay={getDay}
				onPrev={() => setMonth(([y, m]) => addMonths(y, m, -1))}
				onNext={() => setMonth(([y, m]) => addMonths(y, m, 1))}
				onToday={() => setMonth(monthOf(today))}
				onSelect={setSelected}
			/>
			<DayDialog
				iso={selected}
				onClose={() => setSelected(null)}
				persons={session.persons}
				meId={session.meId}
				sessionId={sessionId}
				onMutate={onMutate}
			/>
		</main>
	)
}
