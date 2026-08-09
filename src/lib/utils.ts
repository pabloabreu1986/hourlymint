import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** cn(): combina clases (shadcn) — clsx + tailwind-merge para resolver
 *  conflictos de utilidades Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
