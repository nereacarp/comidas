/** Models for Google AI (generativelanguage.googleapis.com). Newest first. */
export const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
] as const;

export function isRetriableGeminiError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('404') ||
    lower.includes('not found') ||
    lower.includes('is not supported')
  );
}
