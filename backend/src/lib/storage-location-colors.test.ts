import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS,
  normalizeStorageLocationColor,
  pantryColorForNewLocation,
} from './storage-location-colors.js';

describe('storage-location-colors', () => {
  it('creates five default household locations with pastel hex', () => {
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS).toHaveLength(5);
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS[0]).toEqual(
      expect.objectContaining({ name: 'Nevera', color: '#a8e6cf' }),
    );
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS[1]).toEqual(
      expect.objectContaining({ name: 'Congelador', color: '#e6ccff' }),
    );
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS[2]).toEqual(
      expect.objectContaining({ name: 'Despensa', color: '#ffd8a8' }),
    );
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS[3]).toEqual(
      expect.objectContaining({ name: 'Armario', color: '#9bf6ff' }),
    );
    expect(DEFAULT_HOUSEHOLD_STORAGE_LOCATIONS[4]).toEqual(
      expect.objectContaining({ name: 'Otros', color: '#ffadad' }),
    );
  });

  it('cycles random pastels for new locations', () => {
    expect(pantryColorForNewLocation(0)).toBe('#e6ccff');
    expect(pantryColorForNewLocation(3)).toBe('#9bf6ff');
  });

  it('uses pastel defaults for legacy icon colors', () => {
    expect(normalizeStorageLocationColor('fridge', '#0ea5e9')).toBe('#a8e6cf');
    expect(normalizeStorageLocationColor('cabinet', '#d97706')).toBe('#ffd8a8');
  });
});
