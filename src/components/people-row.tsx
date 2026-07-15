import { PencilIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useApp } from "@/lib/app-context"
import { personColor } from "@/lib/colors"
import { removePerson, renameSelf } from "@/server/functions"
import type { SessionPerson } from "@/session-do"

function Dot({ index }: { index: number }) {
	return (
		<span className="size-2 shrink-0 rounded-full" style={{ background: personColor(index) }} />
	)
}

function MeChip({
	person,
	index,
	sessionId,
	onMutate,
}: {
	person: SessionPerson
	index: number
	sessionId: string
	onMutate: () => Promise<void>
}) {
	const { t } = useApp()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(person.name)
	const [busy, setBusy] = useState(false)

	const save = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy || name.trim().length === 0) return
		setBusy(true)
		try {
			await renameSelf({ data: { sessionId, name } })
			await onMutate()
			setOpen(false)
		} catch {
			toast.error(t.errorGeneric)
		} finally {
			setBusy(false)
		}
	}

	return (
		<Popover
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (next) setName(person.name)
			}}
		>
			<PopoverTrigger
				aria-label={t.rename}
				className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 ps-2.5 pe-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
			>
				<Dot index={index} />
				{person.name}
				<span className="text-muted-foreground"> · {t.you}</span>
				<PencilIcon className="size-3 text-muted-foreground" />
			</PopoverTrigger>
			<PopoverContent className="w-60 p-3">
				<form onSubmit={save} className="flex gap-2">
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={40}
						aria-label={t.yourName}
					/>
					<Button type="submit" size="sm" disabled={busy || name.trim().length === 0}>
						{t.save}
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	)
}

function OtherChip({
	person,
	index,
	canRemove,
	sessionId,
	onMutate,
}: {
	person: SessionPerson
	index: number
	canRemove: boolean
	sessionId: string
	onMutate: () => Promise<void>
}) {
	const { t } = useApp()
	const [busy, setBusy] = useState(false)

	const remove = async () => {
		if (busy) return
		setBusy(true)
		try {
			await removePerson({ data: { sessionId, personId: person.id } })
			await onMutate()
		} catch {
			toast.error(t.errorGeneric)
		} finally {
			setBusy(false)
		}
	}

	return (
		<span className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 ps-2.5 pe-2.5 text-sm">
			<Dot index={index} />
			{person.name}
			{canRemove && (
				<Popover>
					<PopoverTrigger
						aria-label={`${t.removePerson}: ${person.name}`}
						className="-me-1 rounded-full p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
					>
						<XIcon className="size-3" />
					</PopoverTrigger>
					<PopoverContent className="w-64 p-3">
						<p className="text-sm">{t.removePersonConfirm(person.name)}</p>
						<Button
							variant="destructive"
							size="sm"
							className="mt-2 w-full"
							disabled={busy}
							onClick={remove}
						>
							{t.removePerson}
						</Button>
					</PopoverContent>
				</Popover>
			)}
		</span>
	)
}

export function PeopleRow({
	persons,
	meId,
	isCreator,
	sessionId,
	onMutate,
}: {
	persons: SessionPerson[]
	meId: string | null
	isCreator: boolean
	sessionId: string
	onMutate: () => Promise<void>
}) {
	if (persons.length === 0) return null
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{persons.map((person, index) =>
				person.id === meId ? (
					<MeChip
						key={person.id}
						person={person}
						index={index}
						sessionId={sessionId}
						onMutate={onMutate}
					/>
				) : (
					<OtherChip
						key={person.id}
						person={person}
						index={index}
						canRemove={isCreator}
						sessionId={sessionId}
						onMutate={onMutate}
					/>
				),
			)}
		</div>
	)
}
