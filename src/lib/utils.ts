import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneStr: string | undefined | null): string {
  if (!phoneStr) {
    return 'N/A';
  }
  const cleaned = phoneStr.replace(/\D/g, ''); // Remove non-digits

  // Format for 11-digit numbers like 07084491438 -> 070-8449-1438
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7, 11)}`;
  }
  
  // Format for 10-digit numbers like 0901234567 -> 090-123-4567
  if (cleaned.startsWith('0') && cleaned.length === 10) {
     return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`;
  }
  
  // Fallback for other formats or if cleaning resulted in an empty string
  return cleaned || phoneStr;
}

export function normalizeStringForSearch(str: string | undefined | null): string {
  if (!str) {
    return '';
  }
  return str
    .toLowerCase()
    .normalize('NFD') // Decompose combined diacritic characters (e.g., "à" to "a" + "ˋ")
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritic marks
}
