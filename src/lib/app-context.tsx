import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import { type Locale, type Messages, messages } from "./i18n"

type AppContextValue = {
	locale: Locale
	t: Messages
	setLocale: (locale: Locale) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
	initialLocale,
	children,
}: {
	initialLocale: Locale
	children: ReactNode
}) {
	const [locale, setLocaleState] = useState<Locale>(initialLocale)

	useEffect(() => {
		document.documentElement.lang = locale
	}, [locale])

	const setLocale = useCallback((next: Locale) => {
		setLocaleState(next)
		document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`
	}, [])

	const value = useMemo(() => ({ locale, t: messages[locale], setLocale }), [locale, setLocale])

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
	const ctx = useContext(AppContext)
	if (!ctx) throw new Error("useApp must be used within AppProvider")
	return ctx
}
