import { describe, expect, it } from 'vitest';
import { settingsPantryLocationsPath, SETTINGS_PANTRY_LOCATIONS_HASH } from './settings-sections';

describe('settingsPantryLocationsPath', () => {
  it('points to pantry locations section', () => {
    expect(SETTINGS_PANTRY_LOCATIONS_HASH).toBe('ubicaciones-despensa');
    expect(settingsPantryLocationsPath()).toBe('/settings#ubicaciones-despensa');
  });
});
