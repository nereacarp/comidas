import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement> & { title?: string };

const DEFAULT_NAV = 'w-5 h-5';

function mergeProps(
  props: IconProps,
  viewBox: string,
  defaultClass = DEFAULT_NAV,
): SVGProps<SVGSVGElement> {
  const { title, className, ...rest } = props;
  return {
    viewBox,
    fill: 'currentColor',
    'aria-hidden': title ? undefined : true,
    className: className ?? defaultClass,
    ...rest,
  };
}

export function HomeIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M10.75 16.82A7.462 7.462 0 0 1 15 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0 0 18 15.06v-11a.75.75 0 0 0-.546-.721A9.006 9.006 0 0 0 15 3a8.963 8.963 0 0 0-4.25 1.065V16.82ZM9.25 4.065A8.963 8.963 0 0 0 5 3c-.85 0-1.673.118-2.454.339A.75.75 0 0 0 2 4.06v11a.75.75 0 0 0 .954.721A7.506 7.506 0 0 1 5 15.5c1.579 0 3.042.487 4.25 1.32V4.065Z" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
    </svg>
  );
}

export function PantryIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" clipRule="evenodd" d="M5 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3Zm2 0h10v6H7V3Zm0 8h10v10H7V11ZM8.5 4a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1h-4Zm7 9a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

export function ShoppingCartIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M1 1.75A.75.75 0 0 1 1.75 1h1.628a1.75 1.75 0 0 1 1.734 1.51L5.43 3h8.82a1.75 1.75 0 0 1 1.543 2.575l-2.155 3.583A1.75 1.75 0 0 1 12.117 10H5.744l.068.399A.75.75 0 0 0 6.557 11h8.693a.75.75 0 0 1 0 1.5H6.557a2.25 2.25 0 0 1-2.218-1.87L2.9 2.607A.25.25 0 0 0 2.653 2.5H1.75A.75.75 0 0 1 1 1.75ZM6 15.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm7.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.993 6.993 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
    </svg>
  );
}

export function HealthIcon({ title = 'Salud', ...props }: IconProps) {
  const p = mergeProps({ title, ...props }, '0 0 20 20');
  return (
    <svg {...p}>
      {title ? <title>{title}</title> : null}
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-2.184C4.045 12.318 2 9.83 2 6.75a4.75 4.75 0 0 1 7.916-3.526.75.75 0 0 0 1.168 0A4.75 4.75 0 0 1 18 6.75c0 3.082-2.045 5.568-3.885 7.286a22.049 22.049 0 0 1-2.582 2.184 20.76 20.76 0 0 1-1.162.682l-.019.01-.005.003h-.002a.75.75 0 0 1-.69 0h-.002Z" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20', 'w-5 h-5');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 0 1-1.162-.682 22.045 22.045 0 0 1-2.582-2.184C4.045 12.318 2 9.83 2 6.75a4.75 4.75 0 0 1 7.916-3.526.75.75 0 0 0 1.168 0A4.75 4.75 0 0 1 18 6.75c0 3.082-2.045 5.568-3.885 7.286a22.049 22.049 0 0 1-2.582 2.184 20.76 20.76 0 0 1-1.162.682l-.019.01-.005.003h-.002a.75.75 0 0 1-.69 0h-.002Z" />
    </svg>
  );
}

export function HeartOutlineIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24', 'w-5 h-5');
  return (
    <svg {...p} fill="none" stroke="currentColor" strokeWidth="1.5">
      {props.title ? <title>{props.title}</title> : null}
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20', 'w-5 h-5');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

export function CheckSmallIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 12 12', 'w-3 h-3');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414 0l-2-2a1 1 0 1 1 1.414-1.414L4.586 7.586l4.293-4.293a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
    </svg>
  );
}

export function WaterDropIcon({ title = 'Agua', ...props }: IconProps) {
  const p = mergeProps({ title, ...props }, '0 0 24 24');
  return (
    <svg {...p}>
      {title ? <title>{title}</title> : null}
      <path d="M12 2.69c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
    </svg>
  );
}

export function FlameIcon({ title = 'Calorías', ...props }: IconProps) {
  const p = mergeProps({ title, ...props }, '0 0 24 24');
  return (
    <svg {...p}>
      {title ? <title>{title}</title> : null}
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.546 3.75 3.75 0 0 1 3.255 3.718Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L10.94 10 7.23 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.08-.02Z" clipRule="evenodd" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
    </svg>
  );
}

export function UtensilsIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M7 2.75a.75.75 0 0 1 .75.75V10a2.25 2.25 0 0 1-1.5 2.121V21a.75.75 0 0 1-1.5 0v-8.879A2.25 2.25 0 0 1 3.25 10V3.5a.75.75 0 0 1 1.5 0V6h.75V3.5A.75.75 0 0 1 7 2.75ZM5.5 7.5h-.75V10a.75.75 0 0 0 1.5 0V7.5h-.75Z" />
      <path d="M14.75 2.75c.414 0 .75.336.75.75V21a.75.75 0 0 1-1.5 0v-7.5h-.25A2.75 2.75 0 0 1 11 10.75v-2a6 6 0 0 1 3.75-5.56Z" />
      <path d="M17.75 3.5a.75.75 0 0 1 1.5 0V21a.75.75 0 0 1-1.5 0V3.5Z" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
      <path d="M12 1.75a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V2.5a.75.75 0 0 1 .75-.75ZM12 20.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM1.75 12a.75.75 0 0 1 .75-.75H4a.75.75 0 0 1 0 1.5H2.5a.75.75 0 0 1-.75-.75ZM20 11.25a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1 0-1.5H20Z" />
      <path d="M4.22 4.22a.75.75 0 0 1 1.06 0l1.06 1.06A.75.75 0 1 1 5.28 6.34L4.22 5.28a.75.75 0 0 1 0-1.06ZM17.66 17.66a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06ZM19.78 4.22a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM6.34 17.66a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M21 14.2a.75.75 0 0 0-1.02-.7 7.5 7.5 0 0 1-9.48-9.48.75.75 0 0 0-.7-1.02A9.75 9.75 0 1 0 21 14.2Z" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 24 24');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M15.7 7.2c-1.1 0-2 .6-2.7.6-.7 0-1.7-.6-2.8-.6-2 0-4 1.5-4 4.7 0 2.6 1 5.4 2.3 7.2.6.9 1.3 1.7 2.2 1.7.9 0 1.3-.5 2.4-.5 1.1 0 1.4.5 2.4.5.9 0 1.6-.8 2.2-1.7.7-1.1 1-1.7 1.5-3a4.2 4.2 0 0 1-2.4-3.8c0-1.7 1-3.1 2.4-3.8-1-1.5-2.5-2.3-3.5-2.3Z" />
      <path d="M14.6 2.2c-.7.1-1.5.5-2.1 1.2-.6.7-.9 1.5-.8 2.3.8.1 1.6-.4 2.2-1.1.6-.7 1-1.6.7-2.4Z" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  const p = mergeProps(props, '0 0 20 20', 'w-4 h-4');
  return (
    <svg {...p}>
      {props.title ? <title>{props.title}</title> : null}
      <path
        fillRule="evenodd"
        d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 0 0 1.004-1.114l-1.048-.943H18.25A.75.75 0 0 0 19 10Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function BrandMarkIcon({ className = 'w-5 h-5', ...props }: Omit<IconProps, 'className'> & { className?: string }) {
  return <UtensilsIcon className={className} title="Comidas" {...props} />;
}
