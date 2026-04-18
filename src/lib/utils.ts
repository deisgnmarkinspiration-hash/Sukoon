import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely using clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes input strings by removing potentially dangerous HTML tags.
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Formats a given date into a human-readable HH:mm format.
 */
export function formatTime(date: Date | any): string {
  const d = date instanceof Date ? date : date?.toDate ? date.toDate() : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
