export const LIST_ACCENT_KEYS = ['lavender', 'mint', 'peach', 'cyan', 'coral'] as const;

export type ListAccentKey = (typeof LIST_ACCENT_KEYS)[number];
