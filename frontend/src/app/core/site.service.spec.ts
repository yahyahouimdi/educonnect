import { applyBrandColor } from './site.service';

describe('applyBrandColor', () => {
  let root: HTMLElement;

  beforeEach(() => (root = document.createElement('div')));

  it('exposes the brand color and derived shades as CSS variables', () => {
    applyBrandColor(root, '#0f766e');

    expect(root.style.getPropertyValue('--brand')).toBe('rgb(15 118 110)');
    expect(root.style.getPropertyValue('--brand-rgb')).toBe('15 118 110');
    // Light tints move towards white, dark shades towards black.
    expect(root.style.getPropertyValue('--brand-50')).toBe('rgb(241 247 246)');
    expect(root.style.getPropertyValue('--brand-900')).toBe('rgb(7 53 49)');
  });

  it('falls back to the default color for invalid input', () => {
    applyBrandColor(root, 'not-a-color');

    expect(root.style.getPropertyValue('--brand')).toBe('rgb(29 78 216)');
  });
});
