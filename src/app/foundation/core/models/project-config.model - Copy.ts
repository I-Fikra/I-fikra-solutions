export interface ProjectConfig {
  id: string;
  projectName: string;
  websiteTitle: string;
  /** Hex color string e.g. "#D94452" or "rgb(154,98,210)" */
  primaryColor: string;
  /** Raw SVG string rendered inline (supports CSS variables) */
  logoSvg: string;
  /** Optional dark-mode SVG variant; falls back to logoSvg if null */
  logoSvgDark: string | null;
  /** Optional square SVG used as browser favicon (data URI); falls back to logoSvg if null */
  faviconSvg: string | null;
  /** The project loaded by default on startup */
  isDefault?: boolean;
}