import { clsx, type ClassValue } from "clsx";

/**
 * Class-name combiner used by the shadcn-style ui/ components. The project
 * already ships `clsx`; we don't pull in tailwind-merge because the Tailwind v4
 * setup here doesn't have conflicting-utility churn in these components.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
