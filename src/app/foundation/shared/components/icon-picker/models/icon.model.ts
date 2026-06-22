export interface Icon {
  id: string;
  name: string; // e.g. "arrow-right"
  tags: string[]; // e.g. ["arrow", "right"]
  svg?: string; // inline SVG markup, if loaded that way
  url?: string; // asset URL, if loaded that way
  category: string; // e.g. "arrows", "ui", "social" — '' when unknown
}
