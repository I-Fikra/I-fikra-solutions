export interface Icon {
  id: string;
  name: string; // e.g. "arrow-right"
  tags: string[]; // e.g. ["arrow", "right"]
  url: string; // asset URL, e.g. "icons/svg/arrow-right.svg"
  category: string; // e.g. "arrows", "ui", "social" — '' when unknown
}
