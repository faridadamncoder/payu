import type { CSSProperties } from "react";

/** Warna tema toko. Nilai berupa kanal RGB agar bisa dipakai dengan opacity di Tailwind. */
export const STORE_THEMES = {
  emerald: { name: "Zamrud", primary: "5 150 105", soft: "209 250 229", ink: "6 78 59" },
  ocean: { name: "Samudra", primary: "37 99 235", soft: "219 234 254", ink: "30 58 138" },
  sunset: { name: "Senja", primary: "234 88 12", soft: "255 237 213", ink: "124 45 18" },
  berry: { name: "Beri", primary: "219 39 119", soft: "252 231 243", ink: "131 24 67" },
  grape: { name: "Anggur", primary: "124 58 237", soft: "237 233 254", ink: "76 29 149" },
  graphite: { name: "Grafit", primary: "39 39 42", soft: "228 228 231", ink: "24 24 27" },
} as const;

export type StoreThemeKey = keyof typeof STORE_THEMES;

export function themeVars(key: string): CSSProperties {
  const t = STORE_THEMES[(key as StoreThemeKey)] || STORE_THEMES.emerald;
  return {
    ["--brand" as string]: t.primary,
    ["--brand-soft" as string]: t.soft,
    ["--brand-ink" as string]: t.ink,
  };
}
