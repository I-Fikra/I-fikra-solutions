import { Injectable, signal, computed } from '@angular/core';

// ── Step 1: Theme model ───────────────────────────────────────────────────────
export interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  family: string;
  supportsDarkMode: boolean;
  colors: string[];
  previewBg: string;
  previewAccent: string;
  icon: string;
}

// ── Step 2: Fine-tune token model ─────────────────────────────────────────────
export interface ThemeTokens {
  borderRadius: number;
  fontFamily: string;
  fontSize: string;
  spacing: 'compact' | 'comfortable' | 'spacious';
  sidebarMode: 'static' | 'overlay' | 'slim';
  topbarMode: 'default' | 'transparent' | 'colored';
  containerWidth: 'full' | 'wide' | 'medium' | 'narrow';
  headingScale: 'tight' | 'normal' | 'loose';
  animations: boolean;
  shadows: boolean;
  glassEffect: boolean;
}

// ── Step 3: Personality preset model ─────────────────────────────────────────
export interface PersonalityPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  typographyPreset: 'modern' | 'classic' | 'playful' | 'technical' | 'editorial';
  elevationPreset: 'flat' | 'subtle' | 'raised' | 'floating';
  radiusPreset: 'sharp' | 'rounded' | 'soft' | 'pill';
  animationPreset: 'none' | 'subtle' | 'smooth' | 'expressive';
  accent: string;
}

// ── Step 4: Color group model ─────────────────────────────────────────────────
export interface ColorGroupColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface ColorGroup {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  colors: ColorGroupColors;
}

// ── Static data ───────────────────────────────────────────────────────────────

export const THEME_TEMPLATES: ThemeTemplate[] = [
  {
    id: 'aura-sky',
    name: 'Aura Sky',
    description: 'Clean modern design with sky blue accents. Perfect for SaaS dashboards.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#0ea5e9', '#38bdf8', '#f8fafc', '#1e293b'],
    previewBg: '#f8fafc',
    previewAccent: '#0ea5e9',
    icon: 'pi pi-cloud'
  },
  {
    id: 'aura-emerald',
    name: 'Aura Emerald',
    description: 'Fresh green palette. Great for sustainability and health platforms.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#10b981', '#34d399', '#f0fdf4', '#1e293b'],
    previewBg: '#f0fdf4',
    previewAccent: '#10b981',
    icon: 'pi pi-leaf'
  },
  {
    id: 'aura-violet',
    name: 'Aura Violet',
    description: 'Rich purple tones for creative and analytics platforms.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#7c3aed', '#8b5cf6', '#f5f3ff', '#1e293b'],
    previewBg: '#f5f3ff',
    previewAccent: '#7c3aed',
    icon: 'pi pi-star'
  },
  {
    id: 'aura-rose',
    name: 'Aura Rose',
    description: 'Warm rose accents. Welcoming and energetic.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#f43f5e', '#fb7185', '#fff1f2', '#1e293b'],
    previewBg: '#fff1f2',
    previewAccent: '#f43f5e',
    icon: 'pi pi-heart'
  },
  {
    id: 'lara-blue',
    name: 'Lara Blue',
    description: 'Classic enterprise look with trustworthy blue tones.',
    previewImage: '',
    family: 'Lara',
    supportsDarkMode: true,
    colors: ['#3b82f6', '#60a5fa', '#eff6ff', '#1f2937'],
    previewBg: '#eff6ff',
    previewAccent: '#3b82f6',
    icon: 'pi pi-building'
  },
  {
    id: 'lara-teal',
    name: 'Lara Teal',
    description: 'Refreshing teal accents. Ideal for health or finance apps.',
    previewImage: '',
    family: 'Lara',
    supportsDarkMode: true,
    colors: ['#14b8a6', '#2dd4bf', '#f0fdfa', '#1f2937'],
    previewBg: '#f0fdfa',
    previewAccent: '#14b8a6',
    icon: 'pi pi-chart-line'
  },
  {
    id: 'lara-amber',
    name: 'Lara Amber',
    description: 'Warm amber highlights. Bold and attention-grabbing.',
    previewImage: '',
    family: 'Lara',
    supportsDarkMode: false,
    colors: ['#f59e0b', '#fbbf24', '#fffbeb', '#1c1917'],
    previewBg: '#fffbeb',
    previewAccent: '#f59e0b',
    icon: 'pi pi-sun'
  },
  {
    id: 'nora-indigo',
    name: 'Nora Indigo',
    description: 'Sharp professional design with deep indigo precision.',
    previewImage: '',
    family: 'Nora',
    supportsDarkMode: true,
    colors: ['#6366f1', '#818cf8', '#eef2ff', '#18181b'],
    previewBg: '#eef2ff',
    previewAccent: '#6366f1',
    icon: 'pi pi-shield'
  },
  {
    id: 'aura-night',
    name: 'Aura Night',
    description: 'Dark mode with sky blue accents. Sleek and easy on the eyes.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#0ea5e9', '#38bdf8', '#0f172a', '#f8fafc'],
    previewBg: '#0f172a',
    previewAccent: '#0ea5e9',
    icon: 'pi pi-moon'
  },
  {
    id: 'nora-dark-teal',
    name: 'Nora Dark Teal',
    description: 'Dark Nora with teal accents. Minimal and focused.',
    previewImage: '',
    family: 'Nora',
    supportsDarkMode: true,
    colors: ['#14b8a6', '#2dd4bf', '#0c1920', '#f0fdfa'],
    previewBg: '#0c1920',
    previewAccent: '#14b8a6',
    icon: 'pi pi-code'
  },
  {
    id: 'lara-dark',
    name: 'Lara Dark',
    description: 'Dark Lara with classic blue. A familiar enterprise feel.',
    previewImage: '',
    family: 'Lara',
    supportsDarkMode: true,
    colors: ['#3b82f6', '#60a5fa', '#111827', '#f9fafb'],
    previewBg: '#111827',
    previewAccent: '#3b82f6',
    icon: 'pi pi-desktop'
  },
  {
    id: 'aura-violet-dark',
    name: 'Aura Dark Violet',
    description: 'Dark Aura with vivid violet. Immersive and modern.',
    previewImage: '',
    family: 'Aura',
    supportsDarkMode: true,
    colors: ['#7c3aed', '#8b5cf6', '#1a1a2e', '#f5f3ff'],
    previewBg: '#1a1a2e',
    previewAccent: '#7c3aed',
    icon: 'pi pi-eye'
  }
];

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean, structured layout with precise typography and subtle elevation.',
    icon: 'pi pi-briefcase',
    typographyPreset: 'classic',
    elevationPreset: 'subtle',
    radiusPreset: 'rounded',
    animationPreset: 'subtle',
    accent: '#3b82f6'
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Authoritative enterprise style with sharp edges and formal spacing.',
    icon: 'pi pi-building',
    typographyPreset: 'technical',
    elevationPreset: 'flat',
    radiusPreset: 'sharp',
    animationPreset: 'none',
    accent: '#1d4ed8'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with smooth transitions and dynamic components.',
    icon: 'pi pi-bolt',
    typographyPreset: 'modern',
    elevationPreset: 'raised',
    radiusPreset: 'soft',
    animationPreset: 'smooth',
    accent: '#0ea5e9'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold colors, expressive animations, and distinctive visual flair.',
    icon: 'pi pi-palette',
    typographyPreset: 'playful',
    elevationPreset: 'floating',
    radiusPreset: 'pill',
    animationPreset: 'expressive',
    accent: '#7c3aed'
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Energetic and approachable. Fast, lean, and focused on action.',
    icon: 'pi pi-send',
    typographyPreset: 'modern',
    elevationPreset: 'raised',
    radiusPreset: 'rounded',
    animationPreset: 'smooth',
    accent: '#f43f5e'
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium feel with editorial typography and refined floating surfaces.',
    icon: 'pi pi-star',
    typographyPreset: 'editorial',
    elevationPreset: 'floating',
    radiusPreset: 'soft',
    animationPreset: 'smooth',
    accent: '#f59e0b'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, welcoming design with rounded shapes and playful touches.',
    icon: 'pi pi-face-smile',
    typographyPreset: 'playful',
    elevationPreset: 'subtle',
    radiusPreset: 'pill',
    animationPreset: 'expressive',
    accent: '#10b981'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Stripped back, maximum whitespace, content-first philosophy.',
    icon: 'pi pi-minus-circle',
    typographyPreset: 'modern',
    elevationPreset: 'flat',
    radiusPreset: 'sharp',
    animationPreset: 'none',
    accent: '#6b7280'
  }
];

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  borderRadius: 8,
  fontFamily: "'Lato', sans-serif",
  fontSize: '14px',
  spacing: 'comfortable',
  sidebarMode: 'static',
  topbarMode: 'default',
  containerWidth: 'wide',
  headingScale: 'normal',
  animations: true,
  shadows: true,
  glassEffect: false
};

export const DEFAULT_COLOR_GROUP: ColorGroup = {
  id: 'cg-default',
  name: 'Brand Colors',
  description: 'Primary brand color palette',
  isDefault: true,
  colors: {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    accent: '#10b981',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b'
  }
};

// ── Injectable store ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ThemeAppearanceStore {
  // Step 1
  readonly selectedThemeId = signal<string>('aura-sky');

  // Step 2
  readonly themeTokens = signal<ThemeTokens>({ ...DEFAULT_THEME_TOKENS });

  // Step 3
  readonly selectedPersonalityId = signal<string>('professional');

  // Step 4
  readonly colorGroups = signal<ColorGroup[]>([{ ...DEFAULT_COLOR_GROUP }]);

  // Computed
  readonly selectedTheme = computed(() =>
    THEME_TEMPLATES.find(t => t.id === this.selectedThemeId()) ?? THEME_TEMPLATES[0]
  );

  readonly selectedPersonality = computed(() =>
    PERSONALITY_PRESETS.find(p => p.id === this.selectedPersonalityId()) ?? PERSONALITY_PRESETS[0]
  );

  readonly defaultColorGroup = computed(() =>
    this.colorGroups().find(g => g.isDefault) ?? this.colorGroups()[0]
  );

  // Step 1 save
  saveTheme(themeId: string): void {
    this.selectedThemeId.set(themeId);
  }

  // Step 2 save
  saveTokens(tokens: ThemeTokens): void {
    this.themeTokens.set({ ...tokens });
  }

  // Step 3 save
  savePersonality(personalityId: string): void {
    this.selectedPersonalityId.set(personalityId);
  }

  // Step 4 methods
  addColorGroup(group: ColorGroup): void {
    this.colorGroups.update(gs => {
      const updated = gs.map(g => group.isDefault ? { ...g, isDefault: false } : g);
      return [...updated, group];
    });
  }

  updateColorGroup(id: string, patch: Partial<ColorGroup>): void {
    this.colorGroups.update(gs => {
      let updated = gs.map(g => g.id === id ? { ...g, ...patch } : g);
      if (patch.isDefault) {
        updated = updated.map(g => g.id !== id ? { ...g, isDefault: false } : g);
      }
      return updated;
    });
  }

  deleteColorGroup(id: string): void {
    this.colorGroups.update(gs => {
      const filtered = gs.filter(g => g.id !== id);
      const hasDefault = filtered.some(g => g.isDefault);
      if (!hasDefault && filtered.length > 0) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }
      return filtered;
    });
  }

  reorderColorGroups(from: number, to: number): void {
    this.colorGroups.update(gs => {
      const copy = [...gs];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  setDefaultColorGroup(id: string): void {
    this.colorGroups.update(gs =>
      gs.map(g => ({ ...g, isDefault: g.id === id }))
    );
  }
}
