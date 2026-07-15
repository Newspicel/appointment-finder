import { useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "system"

export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`

function apply(mode: ThemeMode) {
	const dark =
		mode === "dark" ||
		(mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
	document.documentElement.classList.toggle("dark", dark)
}

export function useTheme() {
	const [mode, setModeState] = useState<ThemeMode>("system")

	useEffect(() => {
		const stored = localStorage.getItem("theme")
		if (stored === "light" || stored === "dark") setModeState(stored)
	}, [])

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)")
		const onChange = () => {
			if (!localStorage.getItem("theme")) apply("system")
		}
		media.addEventListener("change", onChange)
		return () => media.removeEventListener("change", onChange)
	}, [])

	const setMode = (next: ThemeMode) => {
		setModeState(next)
		if (next === "system") {
			localStorage.removeItem("theme")
		} else {
			localStorage.setItem("theme", next)
		}
		apply(next)
	}

	return { mode, setMode }
}
