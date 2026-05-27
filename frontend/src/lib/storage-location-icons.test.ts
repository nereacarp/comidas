import { describe, expect, it } from 'vitest';
import {
  STORAGE_LOCATION_ICON_IDS,
  getDefaultColorForIcon,
  isStorageLocationIconId,
  renderStorageLocationIcon,
} from './storage-location-icons';

describe('storage-location-icons', () => {
  it('exposes many kitchen-related icon ids', () => {
    expect(STORAGE_LOCATION_ICON_IDS.length).toBeGreaterThanOrEqual(20);
    expect(STORAGE_LOCATION_ICON_IDS).toContain('fridge');
    expect(STORAGE_LOCATION_ICON_IDS).toContain('oven');
    expect(STORAGE_LOCATION_ICON_IDS).toContain('wine');
    expect(STORAGE_LOCATION_ICON_IDS).toContain('bag');
    expect(STORAGE_LOCATION_ICON_IDS).toContain('flame');
    expect(STORAGE_LOCATION_ICON_IDS).toContain('bottle');
  });

  it('validates known icon ids', () => {
    expect(isStorageLocationIconId('microwave')).toBe(true);
    expect(isStorageLocationIconId('unknown')).toBe(false);
  });

  it('returns pastel defaults for household icons and fallback for unknown', () => {
    expect(getDefaultColorForIcon('cabinet')).toBe('#ffd8a8');
    expect(getDefaultColorForIcon('fridge')).toBe('#a8e6cf');
    expect(getDefaultColorForIcon('snowflake')).toBe('#e6ccff');
    expect(getDefaultColorForIcon('legacy-icon')).toBe('#e6ccff');
  });

  it('renders icon nodes for known and unknown ids', () => {
    expect(renderStorageLocationIcon('sink')).toBeTruthy();
    expect(renderStorageLocationIcon('legacy')).toBeTruthy();
  });
});
