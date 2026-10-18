function requiredLegalValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized || fallback;
}

export const legalConfig = {
  operator: requiredLegalValue(
    import.meta.env.VITE_LEGAL_OPERATOR,
    'Responsable pendiente de configurar',
  ),
  contact: requiredLegalValue(
    import.meta.env.VITE_LEGAL_CONTACT,
    'contacto-pendiente@example.com',
  ),
  lastUpdated: '10 de agosto de 2026',
} as const;
