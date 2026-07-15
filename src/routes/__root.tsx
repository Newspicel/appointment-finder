import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router"
import { AppHeader } from "@/components/app-header"
import { Toaster } from "@/components/ui/sonner"
import { AppProvider } from "@/lib/app-context"
import { messages } from "@/lib/i18n"
import { THEME_INIT_SCRIPT } from "@/lib/theme"
import { getLocale } from "@/server/functions"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
	loader: () => getLocale(),
	head: ({ loaderData }) => {
		const t = messages[loaderData ?? "en"]
		return {
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ title: t.appName },
				{ name: "description", content: t.heroHint },
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
			],
		}
	},
	shellComponent: RootDocument,
	component: RootComponent,
})

function RootComponent() {
	const locale = Route.useLoaderData()
	return (
		<AppProvider initialLocale={locale}>
			<div className="flex min-h-dvh flex-col">
				<AppHeader />
				<Outlet />
			</div>
			<Toaster position="bottom-center" />
		</AppProvider>
	)
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	)
}
