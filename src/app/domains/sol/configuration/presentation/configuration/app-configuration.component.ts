import { Component, signal } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Domains } from '@/app/domains/sol/configuration/presentation/domains/domains';
import { Branding } from '@/app/domains/sol/configuration/presentation/branding/branding';
import { Customize } from '@/app/domains/sol/configuration/presentation/customize/customize';
import { ThemeAppearanceComponent } from '@/app/domains/sol/configuration/presentation/theme-appearance/theme-appearance.component';

// ── Section types ─────────────────────────────────────────────────────────────
type SectionKey = 'branding' | 'theme-appearance' | 'customize' | 'setup';

interface NavSection {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [ToastModule, Domains, Branding, Customize, ThemeAppearanceComponent],
  templateUrl: './app-configuration.component.html',
  styleUrls: ['./app-configuration.component.scss'],
  providers: [MessageService]
})
export class AppConfigurationComponent {
  // ── Navigation (4 sections) ─────────────────────────────────────────────────
  readonly navSections: NavSection[] = [
    {
      key: 'branding',
      label: 'Branding',
      icon: 'pi pi-image',
      description: 'Logo, name, metadata & social'
    },
    {
      key: 'theme-appearance',
      label: 'Theme & Appearance',
      icon: 'pi pi-palette',
      description: 'Themes, fine-tune, personality & colors'
    },
    {
      key: 'customize',
      label: 'Customize',
      icon: 'pi pi-sliders-h',
      description: 'Fine-tune colors & personality'
    },
    {
      key: 'setup',
      label: 'Project Setup',
      icon: 'pi pi-box',
      description: 'Domain & configuration'
    }
  ];

  activeSection = signal<SectionKey>('branding');

  // ── Section done tracking ────────────────────────────────────────────────────
  doneSections = signal<Set<SectionKey>>(new Set());

  // ── Branding ─────────────────────────────────────────────────────────────────
  onBrandingSaved(): void {
    this.doneSections.update((s) => new Set([...s, 'branding']));
  }

  // ── Theme & Appearance ───────────────────────────────────────────────────────
  onThemeAppearanceDone(): void {
    this.doneSections.update((s) => new Set([...s, 'theme-appearance']));
  }

  // ── Customize ────────────────────────────────────────────────────────────────
  onCustomizeDone(): void {
    this.doneSections.update((s) => new Set([...s, 'customize']));
  }

  // ── Section navigation ──────────────────────────────────────────────────────
  setSection(key: SectionKey): void {
    this.activeSection.set(key);
  }

  isSectionDone(key: SectionKey): boolean {
    return this.doneSections().has(key);
  }
}
