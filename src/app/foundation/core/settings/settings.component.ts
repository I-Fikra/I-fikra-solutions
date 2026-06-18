import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import { SettingsService } from './settings.service';
import {
  UserPreferences,
  DEFAULT_PREFERENCES,
  FontSize,
  LayoutDensity,
  MenuMode,
  ThemePreset,
  SupportedLang,
} from './settings.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectButtonModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private readonly settingsService = inject(SettingsService);

  // ── Expose current prefs as a local copy for two-way binding ─────────────
  prefs = signal<UserPreferences>({ ...this.settingsService.getUserPreferences() });

  // ── Pending-save indicator ────────────────────────────────────────────────
  isSaving = signal(false);
  saveSuccess = signal(false);

  // ── Select-button option lists ────────────────────────────────────────────
  readonly languageOptions: { label: string; value: SupportedLang }[] = [
    { label: 'English', value: 'en' },
    { label: 'العربية', value: 'ar' },
  ];

  readonly themeOptions: { label: string; value: ThemePreset }[] = [
    { label: 'Aura', value: 'Aura' },
    { label: 'Lara', value: 'Lara' },
    { label: 'Nora', value: 'Nora' },
  ];

  readonly fontSizeOptions: { label: string; value: FontSize }[] = [
    { label: 'S', value: 'sm' },
    { label: 'M', value: 'md' },
    { label: 'L', value: 'lg' },
  ];

  readonly menuModeOptions: { label: string; value: MenuMode }[] = [
    { label: 'Static', value: 'static' },
    { label: 'Overlay', value: 'overlay' },
  ];

  readonly densityOptions: { label: string; value: LayoutDensity }[] = [
    { label: 'Compact', value: 'compact' },
    { label: 'Comfortable', value: 'comfortable' },
    { label: 'Spacious', value: 'spacious' },
  ];

  readonly primaryColors = [
    { name: 'emerald',  hex: '#10b981' },
    { name: 'sky',      hex: '#0ea5e9' },
    { name: 'violet',   hex: '#8b5cf6' },
    { name: 'rose',     hex: '#f43f5e' },
    { name: 'amber',    hex: '#f59e0b' },
    { name: 'cyan',     hex: '#06b6d4' },
    { name: 'pink',     hex: '#ec4899' },
    { name: 'indigo',   hex: '#6366f1' },
    { name: 'orange',   hex: '#f97316' },
    { name: 'teal',     hex: '#14b8a6' },
    { name: 'green',    hex: '#22c55e' },
    { name: 'blue',     hex: '#3b82f6' },
  ];

  // ── Computed API payload preview ──────────────────────────────────────────
  payloadPreview = computed(() =>
    JSON.stringify(this.settingsService.buildApiPayload(), null, 2)
  );

  showPayload = signal(false);

  ngOnInit(): void {
    // Sync local signal with service on mount
    this.prefs.set({ ...this.settingsService.getUserPreferences() });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  onPreferenceChange<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    // Update local state
    this.prefs.update((p) => ({ ...p, [key]: value }));
    // Immediately propagate to service (triggers localStorage + DOM)
    this.settingsService.updatePreference(key, value);

    // Apply PrimeNG theme changes to the DOM immediately
    // (updatePreference saves the value; these calls update the live CSS tokens)
    if (key === 'theme') {
      this.settingsService.applyThemePreset(value as ThemePreset);
    } else if (key === 'primaryColor') {
      this.settingsService.applyPrimaryColor(value as string);
    } else if (key === 'surface') {
      this.settingsService.applySurface(value as string);
    }
  }

  onSave(): void {
    this.isSaving.set(true);
    this.saveSuccess.set(false);

    // Simulate POST to backend
    this.settingsService.putPreferencesToApi().subscribe({
      next: () => {
        this.isSaving.set(false);
        this.saveSuccess.set(true);
        setTimeout(() => this.saveSuccess.set(false), 2500);
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('[SettingsComponent] Save failed', err);
      },
    });
  }

  onReset(): void {
    this.settingsService.resetPreferences();
    this.prefs.set({ ...DEFAULT_PREFERENCES });
  }

  togglePayload(): void {
    this.showPayload.update((v) => !v);
  }
}
