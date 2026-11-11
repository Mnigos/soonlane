import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/** Custom font sizes from tokens.css; without them tailwind-merge reads text-caption as a color and drops it next to text-muted-foreground. */
const twMerge = extendTailwindMerge({
	extend: { classGroups: { 'font-size': [{ text: ['caption', 'label'] }] } },
})

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
