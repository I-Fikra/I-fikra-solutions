import { Component, signal, computed } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import { Domains } from '@/app/services/sol/configuration/presentation/domains/domains';
import { Branding } from '@/app/services/sol/configuration/presentation/branding/branding';
import { UIStyleDesignerComponent } from '@/app/foundation/core/ui-style-designer/ui-style-designer.component';

// ── Section types ─────────────────────────────────────────────────────────────
type SectionKey = 'branding' | 'setup' | 'ui-style';

interface NavSection {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [ToastModule, ButtonModule, Domains, Branding, UIStyleDesignerComponent],
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
      key: 'setup',
      label: 'Project Setup',
      icon: 'pi pi-box',
      description: 'Domain & configuration'
    },
    {
      key: 'ui-style',
      label: 'UI Style',
      icon: 'pi pi-objects-column',
      description: 'Components style designer'
    }
  ];

  activeSection = signal<SectionKey>('branding');

  // ── Section done tracking ────────────────────────────────────────────────────
  doneSections = signal<Set<SectionKey>>(new Set());

  // ── Step index helpers ───────────────────────────────────────────────────────
  readonly activeIndex = computed(() =>
    this.navSections.findIndex(s => s.key === this.activeSection())
  );

  readonly canGoNext = computed(() => this.activeIndex() < this.navSections.length - 1);
  readonly canGoPrev = computed(() => this.activeIndex() > 0);

  goNext(): void {
    const next = this.navSections[this.activeIndex() + 1];
    if (next) this.activeSection.set(next.key);
  }

  goPrev(): void {
    const prev = this.navSections[this.activeIndex() - 1];
    if (prev) this.activeSection.set(prev.key);
  }

  // ── Section callbacks ────────────────────────────────────────────────────────
  onBrandingSaved(): void {
    this.doneSections.update(s => new Set([...s, 'branding']));
    this.goNext();
  }

  onUiStyleDone(): void {
    this.doneSections.update(s => new Set([...s, 'ui-style']));
  }

  // ── Section navigation ──────────────────────────────────────────────────────
  setSection(key: SectionKey): void {
    this.activeSection.set(key);
  }

  isSectionDone(key: SectionKey): boolean {
    return this.doneSections().has(key);
  }
}