import { useLayoutEffect, useState, type RefObject } from 'react';

type ColorPickerPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';

const POPOVER_ESTIMATE = { width: 248, height: 320 };
const VIEWPORT_MARGIN = 8;

export function pickColorPickerPlacement(
  anchorRect: DOMRect,
  popoverSize: { width: number; height: number },
  viewport?: { width: number; height: number },
): ColorPickerPlacement {
  const vp = viewport ?? {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const { width, height } = popoverSize;
  const spaceBelow = vp.height - anchorRect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = anchorRect.top - VIEWPORT_MARGIN;
  const spaceRight = vp.width - anchorRect.left - VIEWPORT_MARGIN;
  const spaceLeft = anchorRect.right - VIEWPORT_MARGIN;

  const vertical: 'top' | 'bottom' =
    spaceBelow < height && spaceAbove > spaceBelow ? 'top' : 'bottom';

  const horizontal: 'start' | 'end' =
    spaceRight < width && spaceLeft > spaceRight ? 'end' : 'start';

  return `${vertical}-${horizontal}`;
}

export function useColorPickerPlacement(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
): ColorPickerPlacement {
  const [placement, setPlacement] = useState<ColorPickerPlacement>('bottom-start');

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const anchorRect = anchor.getBoundingClientRect();
      const popover = popoverRef.current;
      const size = popover
        ? { width: popover.offsetWidth, height: popover.offsetHeight }
        : POPOVER_ESTIMATE;
      setPlacement(pickColorPickerPlacement(anchorRect, size));
    };

    update();
    const frame = requestAnimationFrame(update);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    const popover = popoverRef.current;
    const observer =
      popover && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(update)
        : null;
    if (popover && observer) observer.observe(popover);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      observer?.disconnect();
    };
  }, [open, anchorRef, popoverRef]);

  return placement;
}
