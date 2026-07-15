import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApp } from "@/lib/app-context"
import { createSession } from "@/server/functions"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
	const { t } = useApp()
	const navigate = useNavigate()
	const [title, setTitle] = useState("")
	const [busy, setBusy] = useState(false)

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (busy) return
		setBusy(true)
		try {
			const { sessionId } = await createSession({ data: { title } })
			await navigate({ to: "/s/$sessionId", params: { sessionId } })
		} catch {
			toast.error(t.errorGeneric)
			setBusy(false)
		}
	}

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-[12vh] pt-8">
			<h1 className="text-2xl font-semibold tracking-tight">{t.heroTitle}</h1>
			<p className="mt-2 text-muted-foreground">{t.heroHint}</p>
			<form
				onSubmit={submit}
				className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-5"
			>
				<div className="grid gap-1.5">
					<Label htmlFor="session-title">{t.sessionTitleLabel}</Label>
					<Input
						id="session-title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder={t.sessionTitlePlaceholder}
						maxLength={80}
					/>
				</div>
				<Button type="submit" disabled={busy}>
					{busy ? `${t.creating}…` : t.create}
				</Button>
			</form>
		</main>
	)
}
