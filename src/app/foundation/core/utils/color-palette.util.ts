/** Converts any CSS color string (hex / rgb / rgba) to [h, s, l] in degrees/percent. */
function toHsl(color: string): [number, number, number] {
  let r: number, g: number, b: number;

  const hex = color.trim();
  if (hex.startsWith('#')) {
    const full = hex.length === 4
      ? '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
      : hex;
    r = parseInt(full.slice(1, 3), 16) / 255;
    g = parseInt(full.slice(3, 5), 16) / 255;
    b = parseInt(full.slice(5, 7), 16) / 255;
  } else {
    const m = hex.match(/[\d.]+/g) ?? ['0', '0', '0'];
    r = parseInt(m[0]) / 255;
    g = parseInt(m[1]) / 255;
    b = parseInt(m[2]) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + toHex(hue2rgb(h + 1 / 3)) + toHex(hue2rgb(h)) + toHex(hue2rgb(h - 1 / 3));
}

const SHADE_LIGHTNESS: Record<number, number> = {
  50: 96, 100: 91, 200: 82, 300: 72, 400: 62,
  500: 50, 600: 42, 700: 34, 800: 26, 900: 18, 950: 12,
};

/**
 * Generates a full 50–950 shade palette from any CSS color string.
 * Compatible with PrimeNG's updatePreset() semantic.primary shape.
 */
export function generatePalette(color: string): Record<string, string> {
  const [h, s] = toHsl(color);
  const palette: Record<string, string> = {};
  for (const [shade, l] of Object.entries(SHADE_LIGHTNESS)) {
    palette[shade] = hslToHex(h, s, l);
  }
  return palette;
}
