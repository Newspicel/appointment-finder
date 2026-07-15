import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Segmented<T extends string>({
	value,
	onChange,
	options,
	label,
	className,
	buttonClassName,
}: {
	value: T
	onChange: (value: T) => void
	options: Array<{ value: T; label: ReactNode; title: string }>
	label: string
	className?: string
	buttonClassName?: string
}) {
	return (
		<fieldset className={cn("flex rounded-md border border-border p-0.5", className)}>
			<legend className="sr-only">{label}</legend>
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					title={option.title}
					aria-label={option.title}
					aria-pressed={option.value === value}
					onClick={() => onChange(option.value)}
					className={cn(
						"flex h-6 min-w-7 items-center justify-center rounded-[4px] px-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
						option.value === value
							? "bg-secondary text-foreground"
							: "text-muted-foreground hover:text-foreground",
						buttonClassName,
					)}
				>
					{option.label}
				</button>
			))}
		</fieldset>
	)
}
