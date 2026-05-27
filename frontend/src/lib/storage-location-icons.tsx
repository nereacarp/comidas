import type { ReactNode } from 'react';
import { APP_PALETTE } from './app-palette';
import { HOUSEHOLD_DEFAULT_LOCATION_COLORS, pantryColorForNewLocation } from './pantry-location-colors';
import {
  BagIcon,
  BalconyIcon,
  BasketIcon,
  BottleIcon,
  CabinetIcon,
  CoffeeIcon,
  CounterIcon,
  CuteBoxIcon,
  CuteMapPinIcon,
  CuteSnowflakeIcon,
  DishwasherIcon,
  DrawerIcon,
  FridgeIcon,
  FreezerDrawerIcon,
  GarageIcon,
  JarIcon,
  KettleIcon,
  KitchenFlameIcon,
  LaundryIcon,
  MicrowaveIcon,
  OvenIcon,
  ShelvesIcon,
  SinkIcon,
  SpiceIcon,
  StoveIcon,
  WineCellarIcon,
} from '../components/ui/KitchenStorageIcons';

export const STORAGE_LOCATION_ICON_IDS = [
  'fridge',
  'snowflake',
  'freezerDrawer',
  'cabinet',
  'shelf',
  'drawer',
  'box',
  'bag',
  'basket',
  'jar',
  'bottle',
  'spice',
  'oven',
  'flame',
  'microwave',
  'stove',
  'sink',
  'dishwasher',
  'counter',
  'coffee',
  'kettle',
  'wine',
  'garage',
  'balcony',
  'laundry',
  'mapPin',
] as const;

export type StorageLocationIconId = (typeof STORAGE_LOCATION_ICON_IDS)[number];

interface StorageLocationIconOption {
  id: StorageLocationIconId;
  label: string;
  defaultColor: string;
}

const SEMANTIC_ICON_COLORS: Partial<Record<StorageLocationIconId, string>> = {
  fridge: HOUSEHOLD_DEFAULT_LOCATION_COLORS.fridge,
  snowflake: HOUSEHOLD_DEFAULT_LOCATION_COLORS.snowflake,
  freezerDrawer: HOUSEHOLD_DEFAULT_LOCATION_COLORS.snowflake,
  cabinet: HOUSEHOLD_DEFAULT_LOCATION_COLORS.cabinet,
};

const STORAGE_LOCATION_ICON_DEFS: { id: StorageLocationIconId; label: string }[] = [
  { id: 'fridge', label: 'Nevera' },
  { id: 'snowflake', label: 'Congelado' },
  { id: 'freezerDrawer', label: 'Cajón congelador' },
  { id: 'cabinet', label: 'Armario / despensa' },
  { id: 'shelf', label: 'Estantería' },
  { id: 'drawer', label: 'Cajón' },
  { id: 'box', label: 'Caja' },
  { id: 'bag', label: 'Bolsa' },
  { id: 'basket', label: 'Cesta' },
  { id: 'jar', label: 'Tarro' },
  { id: 'bottle', label: 'Botella' },
  { id: 'spice', label: 'Especias' },
  { id: 'oven', label: 'Horno' },
  { id: 'flame', label: 'Fuego / calor' },
  { id: 'microwave', label: 'Microondas' },
  { id: 'stove', label: 'Vitro' },
  { id: 'sink', label: 'Fregadero' },
  { id: 'dishwasher', label: 'Lavavajillas' },
  { id: 'counter', label: 'Encimera' },
  { id: 'coffee', label: 'Café' },
  { id: 'kettle', label: 'Tetera' },
  { id: 'wine', label: 'Bodega' },
  { id: 'garage', label: 'Garaje' },
  { id: 'balcony', label: 'Balcón' },
  { id: 'laundry', label: 'Lavadero' },
  { id: 'mapPin', label: 'Otro lugar' },
];

export const STORAGE_LOCATION_ICON_OPTIONS: StorageLocationIconOption[] =
  STORAGE_LOCATION_ICON_DEFS.map((def, index) => ({
    ...def,
    defaultColor:
      SEMANTIC_ICON_COLORS[def.id] ?? pantryColorForNewLocation(index),
  }));

const ICON_MAP: Record<StorageLocationIconId, (className: string) => ReactNode> = {
  fridge: (c) => <FridgeIcon className={c} />,
  snowflake: (c) => <CuteSnowflakeIcon className={c} />,
  freezerDrawer: (c) => <FreezerDrawerIcon className={c} />,
  cabinet: (c) => <CabinetIcon className={c} />,
  shelf: (c) => <ShelvesIcon className={c} />,
  drawer: (c) => <DrawerIcon className={c} />,
  box: (c) => <CuteBoxIcon className={c} />,
  bag: (c) => <BagIcon className={c} />,
  basket: (c) => <BasketIcon className={c} />,
  jar: (c) => <JarIcon className={c} />,
  bottle: (c) => <BottleIcon className={c} />,
  spice: (c) => <SpiceIcon className={c} />,
  oven: (c) => <OvenIcon className={c} />,
  flame: (c) => <KitchenFlameIcon className={c} />,
  microwave: (c) => <MicrowaveIcon className={c} />,
  stove: (c) => <StoveIcon className={c} />,
  sink: (c) => <SinkIcon className={c} />,
  dishwasher: (c) => <DishwasherIcon className={c} />,
  counter: (c) => <CounterIcon className={c} />,
  coffee: (c) => <CoffeeIcon className={c} />,
  kettle: (c) => <KettleIcon className={c} />,
  wine: (c) => <WineCellarIcon className={c} />,
  garage: (c) => <GarageIcon className={c} />,
  balcony: (c) => <BalconyIcon className={c} />,
  laundry: (c) => <LaundryIcon className={c} />,
  mapPin: (c) => <CuteMapPinIcon className={c} />,
};

export function isStorageLocationIconId(value: string): value is StorageLocationIconId {
  return (STORAGE_LOCATION_ICON_IDS as readonly string[]).includes(value);
}

function getStorageLocationIconOption(iconId: string): StorageLocationIconOption | undefined {
  return STORAGE_LOCATION_ICON_OPTIONS.find((o) => o.id === iconId);
}

export function getDefaultColorForIcon(iconId: string): string {
  return getStorageLocationIconOption(iconId)?.defaultColor ?? APP_PALETTE.pastelLavender;
}

export function renderStorageLocationIcon(iconId: string, className = 'w-4 h-4'): ReactNode {
  if (isStorageLocationIconId(iconId)) {
    return ICON_MAP[iconId](className);
  }
  return <CabinetIcon className={className} />;
}
