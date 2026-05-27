import { describe, it, expect } from 'vitest';
import { GEMINI_MODELS, isRetriableGeminiError } from './gemini-models.js';

describe('gemini-models', () => {
  it('does not include deprecated gemini-1.5-flash', () => {
    expect(GEMINI_MODELS).not.toContain('gemini-1.5-flash');
  });

  it('treats model-not-found errors as retriable', () => {
    const msg =
      'models/gemini-1.5-flash is not found for API version v1beta';
    expect(isRetriableGeminiError(msg)).toBe(true);
  });

  it('treats quota errors as retriable', () => {
    expect(isRetriableGeminiError('429 Too Many Requests')).toBe(true);
  });
});
