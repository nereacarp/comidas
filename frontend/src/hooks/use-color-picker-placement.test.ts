import { describe, expect, it } from 'vitest';
import { pickColorPickerPlacement } from './use-color-picker-placement';

function rect(
  top: number,
  left: number,
  width: number,
  height: number,
): DOMRect {
  return {
    top,
    left,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('pickColorPickerPlacement', () => {
  const popover = { width: 248, height: 320 };
  const viewport = { width: 390, height: 844 };

  it('opens upward when there is little space below', () => {
    const anchor = rect(700, 300, 44, 44);
    expect(pickColorPickerPlacement(anchor, popover, viewport)).toBe('top-end');
  });

  it('opens downward with start align when space is ample', () => {
    const anchor = rect(100, 40, 44, 44);
    expect(pickColorPickerPlacement(anchor, popover, viewport)).toBe('bottom-start');
  });

  it('aligns to end when the popover would overflow on the right', () => {
    const anchor = rect(100, 320, 44, 44);
    expect(pickColorPickerPlacement(anchor, popover, viewport)).toBe('bottom-end');
  });
});
