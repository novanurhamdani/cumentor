import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToAscii(str: string) {
  // Remove non-ASCII characters
  const asciiStr = str.replace(/[^\x00-\x7F]/g, "");

  return asciiStr;
}
