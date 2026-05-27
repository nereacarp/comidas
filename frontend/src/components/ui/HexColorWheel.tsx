import { useCallback, useEffect, useRef, useState } from 'react';
import { hexToHsv, hsvToHex } from '../../lib/hex-color';
import { normalizeHexColor } from '../../lib/normalize-hex-color';

interface HexColorWheelProps {
  color: string;
  onChange: (hex: string) => void;
  className?: string;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function HexColorWheel({ color, onChange, className }: Readonly<HexColorWheelProps>) {
  const hex = normalizeHexColor(color);
  const [hsv, setHsv] = useState(() => hexToHsv(hex));
  const satRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHsv(hexToHsv(normalizeHexColor(color)));
  }, [color]);

  const emit = useCallback(
    (next: { h: number; s: number; v: number }) => {
      setHsv(next);
      onChange(hsvToHex(next.h, next.s, next.v));
    },
    [onChange],
  );

  const pickSaturation = useCallback(
    (clientX: number, clientY: number) => {
      const rect = satRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);
      emit({ h: hsv.h, s: x * 100, v: (1 - y) * 100 });
    },
    [emit, hsv.h],
  );

  const pickHue = useCallback(
    (clientX: number) => {
      const rect = hueRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp01((clientX - rect.left) / rect.width);
      emit({ h: x * 360, s: hsv.s, v: hsv.v });
    },
    [emit, hsv.s, hsv.v],
  );

  const bindDrag = (
    onPick: (x: number, y: number) => void,
    axis: 'xy' | 'x',
  ) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      onPick(e.clientX, e.clientY);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      onPick(e.clientX, axis === 'x' ? 0 : e.clientY);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
    },
  });

  const satX = hsv.s / 100;
  const satY = 1 - hsv.v / 100;
  const hueX = hsv.h / 360;

  return (
    <div className={['hex-color-wheel', className].filter(Boolean).join(' ')}>
      <div
        ref={satRef}
        className="hex-color-wheel__saturation"
        {...bindDrag(pickSaturation, 'xy')}
      >
        <div
          className="hex-color-wheel__saturation-bg"
          style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
        />
        <div className="hex-color-wheel__saturation-white" aria-hidden />
        <div className="hex-color-wheel__saturation-black" aria-hidden />
        <span
          className="hex-color-wheel__pointer"
          style={{ left: `${satX * 100}%`, top: `${satY * 100}%`, backgroundColor: hex }}
          aria-hidden
        />
      </div>
      <div
        ref={hueRef}
        className="hex-color-wheel__hue"
        {...bindDrag((x) => pickHue(x), 'x')}
      >
        <span
          className="hex-color-wheel__hue-pointer"
          style={{ left: `${hueX * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
