/** Fragment on {@link routes.settings} for pantry storage locations. */
export const SETTINGS_PANTRY_LOCATIONS_HASH = 'ubicaciones-despensa';

export function settingsPantryLocationsPath(): string {
  return `/settings#${SETTINGS_PANTRY_LOCATIONS_HASH}`;
}
