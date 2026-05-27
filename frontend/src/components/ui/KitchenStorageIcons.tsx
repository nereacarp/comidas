import type { ReactNode, SVGProps } from 'react';
import type { IconProps } from './Icons';

const STROKE = 1.85;

function kitchenIconProps(props: IconProps): SVGProps<SVGSVGElement> {
  const { title, className, ...rest } = props;
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: STROKE,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': title ? undefined : true,
    className: className ?? 'w-5 h-5',
    ...rest,
  };
}

function KIcon({ title, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg {...kitchenIconProps(props)}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

/** Nevera: cuerpo redondeado, compartimentos y pomos */
export function FridgeIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="5.5" y="3" width="13" height="18" rx="3" />
      <path d="M5.5 11h13" />
      <circle cx="8.25" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.25" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
    </KIcon>
  );
}

/** Copo redondeado, estilo “congelado” */
export function CuteSnowflakeIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M12 4.5v15M7.5 7.5l9 9M16.5 7.5l-9 9M6 12h12M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </KIcon>
  );
}

export function FreezerDrawerIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="4.5" y="8" width="15" height="11" rx="2.5" />
      <path d="M8 12.5h8M8 15h5.5" />
      <path d="M16.5 6.5 14 9h4l-2.5-2.5Z" fill="currentColor" stroke="none" />
    </KIcon>
  );
}

/** Armario / despensa con dos puertas */
export function CabinetIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
      <path d="M12 3v18" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <path d="M7 6.5h3M14 6.5h3" strokeWidth="1.4" />
    </KIcon>
  );
}

export function ShelvesIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2.5" />
      <path d="M7 9h10M7 12.5h10M7 16h10" strokeWidth="1.6" />
    </KIcon>
  );
}

export function DrawerIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="4.5" y="6" width="15" height="13" rx="2.5" />
      <rect x="7" y="11" width="10" height="3" rx="1.5" fill="currentColor" stroke="none" opacity="0.35" />
      <path d="M9.5 12.5h5" strokeWidth="2.2" />
    </KIcon>
  );
}

/** Caja de cartón con solapa */
export function CuteBoxIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M4.5 8.5 12 5l7.5 3.5v9.5L12 20l-7.5-2V8.5Z" />
      <path d="M4.5 8.5 12 12l7.5-3.5M12 12v8" />
    </KIcon>
  );
}

/** Bolsa de la compra con asas */
export function BagIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M8 9.5V8a4 4 0 0 1 8 0v1.5" />
      <path d="M6.5 9.5h11l-1.2 10.5H7.7L6.5 9.5Z" />
      <path d="M9.5 14h5" strokeWidth="1.5" opacity="0.5" />
    </KIcon>
  );
}

export function BasketIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M8 10 12 6.5 16 10" />
      <path d="M6.5 10h11l-1.5 9.5H8L6.5 10Z" />
      <path d="M8.5 13.5h7M9 16h6" strokeWidth="1.4" />
    </KIcon>
  );
}

export function JarIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M9.5 5.5h5v1.8a3.2 3.2 0 0 0-5 0V5.5Z" />
      <path d="M8 9.5h8v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9Z" />
      <path d="M10 13h4" strokeWidth="1.4" />
    </KIcon>
  );
}

export function SpiceIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M9.5 5h5l-.8 2.2H10.3L9.5 5Z" />
      <path d="M8.5 9h7l-1.3 10H9.8L8.5 9Z" />
      <circle cx="12" cy="6.2" r="0.8" fill="currentColor" stroke="none" />
      <path d="M10.5 12h3M11 15h2" strokeWidth="1.3" />
    </KIcon>
  );
}

export function OvenIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="5" y="4" width="14" height="16" rx="2.5" />
      <rect x="7.5" y="11" width="9" height="6" rx="1.5" />
      <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <path d="M9 14.5h6" strokeWidth="1.4" />
    </KIcon>
  );
}

/** Llama suave para horno / calor */
export function KitchenFlameIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path
        d="M12 20c3-2.5 5-5.2 5-8.2 0-2.2-1.4-3.8-3.2-4.5.3 1.6-.5 2.8-1.8 3.5C10.5 8.8 9 6.5 10 4c-2.8 1.2-4 3.8-4 6.8 0 3 2 5.7 5 9.2Z"
        fill="currentColor"
        stroke="none"
      />
      <path d="M12 16.5c1.2-1 2-2.2 2-3.5a2.5 2.5 0 0 0-4-1.5c.4 1-.2 1.8-1 2.3-.8-.9-1.5-2-1-3.2-1.5.7-2.3 2.2-2.3 3.9 0 1.4.8 2.6 2 3.5Z" fill="currentColor" stroke="none" opacity="0.45" />
    </KIcon>
  );
}

export function MicrowaveIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="4.5" y="7" width="15" height="11" rx="2.5" />
      <rect x="7" y="9.5" width="8.5" height="6" rx="1.2" />
      <circle cx="17" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </KIcon>
  );
}

export function StoveIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="4.5" y="9" width="15" height="9" rx="2" />
      <circle cx="9" cy="13.5" r="2" />
      <circle cx="15" cy="13.5" r="2" />
      <path d="M8 18.5h8" strokeWidth="1.4" />
    </KIcon>
  );
}

export function SinkIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M6 11.5h12v5.5a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5.5Z" />
      <path d="M9 8.5c0-1.5 1.2-2.5 3-2.5s3 1 3 2.5" />
      <path d="M12 6v2.5" />
    </KIcon>
  );
}

export function DishwasherIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="6" y="3" width="12" height="18" rx="2.5" />
      <circle cx="12" cy="14" r="3.5" />
      <path d="M8 6.5h8" strokeWidth="1.4" />
    </KIcon>
  );
}

export function CounterIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M4 11h16v2.5H4V11Z" fill="currentColor" stroke="none" opacity="0.2" />
      <path d="M5 13.5h14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-5Z" />
    </KIcon>
  );
}

export function CoffeeIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M8.5 9h7v7.5a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9Z" />
      <path d="M15.5 10.5H17a1.5 1.5 0 0 1 0 3h-1.5" />
      <path d="M10 6.5c0-1 .8-1.8 2-1.8s2 .8 2 1.8" />
    </KIcon>
  );
}

export function KettleIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M9 6.5h6l1.2 2.3H7.8L9 6.5Z" />
      <path d="M7.5 9.5h9l-1.2 9H8.7l-1.2-9Z" />
      <path d="M16.5 11c1.2.8 2 2 2 3.3s-.8 2.5-2 3.2" />
    </KIcon>
  );
}

/** Botella */
export function BottleIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M10.5 4.5h3v2.2c0 1.2.9 2.2 2 2.5v10.3a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5V9.2c1.1-.3 2-1.3 2-2.5V4.5Z" />
      <path d="M11 13h2" strokeWidth="1.3" />
    </KIcon>
  );
}

export function WineCellarIcon(props: IconProps) {
  return <BottleIcon {...props} />;
}

export function GarageIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M4 11 12 5l8 6v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V11Z" />
      <rect x="9.5" y="14" width="5" height="5" rx="1" />
    </KIcon>
  );
}

export function BalconyIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M5 12.5h14v6H5v-6Z" />
      <path d="M7.5 12.5 12 8l4.5 4.5" />
      <path d="M10.5 8V5.5M13.5 8V5.5" />
    </KIcon>
  );
}

export function LaundryIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <circle cx="12" cy="13.5" r="4" />
      <path d="M9.5 6.5h5" strokeWidth="1.4" />
    </KIcon>
  );
}

export function CuteMapPinIcon(props: IconProps) {
  return (
    <KIcon {...props}>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.2" fill="currentColor" stroke="none" />
    </KIcon>
  );
}
