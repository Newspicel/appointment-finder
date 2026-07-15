import { Link } from "@tanstack/react-router"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { Segmented } from "@/components/segmented"
import { useApp } from "@/lib/app-context"
import { type ThemeMode, useTheme } from "@/lib/theme"

export function AppHeader() {
	const { locale, setLocale, t } = useApp()
	const { mode, setMode } = useTheme()

	return (
		<header className="border-b border-border">
			<div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between gap-3 px-4">
				<Link
					to="/"
					className="rounded-sm font-mono text-sm font-medium tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{t.appName.toLowerCase()}
				</Link>
				<div className="flex items-center gap-2">
					<Segmented
						label={t.language}
						value={locale}
						onChange={setLocale}
						options={[
							{ value: "de", label: "DE", title: "Deutsch" },
							{ value: "en", label: "EN", title: "English" },
						]}
					/>
					<Segmented<ThemeMode>
						label={t.themeSystem}
						value={mode}
						onChange={setMode}
						options={[
							{ value: "light", label: <SunIcon className="size-3.5" />, title: t.themeLight },
							{
								value: "system",
								label: <MonitorIcon className="size-3.5" />,
								title: t.themeSystem,
							},
							{ value: "dark", label: <MoonIcon className="size-3.5" />, title: t.themeDark },
						]}
					/>
				</div>
			</div>
		</header>
	)
}
