// User-selected reference palette, listed in Regen's post (read 2026-10-31).
// https://x.com/huqinyiyayuguan/status/2114717415942783384
// Shared frozen v1 base. Project-specific overrides stay local; never mutate shared warm C.
// Paper background and light subtitle text can reuse shared C.bg / C.card.
export const MEMPHIS = {
  ink: '#25214A',
  yellow: '#FFC93C',
  pink: '#FF8DB5',
  cobalt: '#2E5BE6',
  coral: '#FF5A5F',
  mint: '#A9E6C6',
  sky: '#8DD3F6',
  lavender: '#D3BEFF',
} as const;
