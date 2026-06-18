import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import {
  THEME_TEMPLATES,
  ThemeAppearanceStore,
  ThemeTemplate
} from '../theme-appearance.store';

@Component({
  selector: 'app-ta-themes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.scss'
})
export class TaThemesComponent {
  private readonly store = inject(ThemeAppearanceStore);

  readonly saved = output<void>();
  readonly customSelected = output<void>();

  readonly themes = THEME_TEMPLATES;

  // local draft — committed on save
  selectedId = signal<string>(this.store.selectedThemeId());

  get selectedTheme(): ThemeTemplate | undefined {
    return this.themes.find(t => t.id === this.selectedId());
  }

  select(id: string): void {
    this.selectedId.set(id);
  }

  selectCustom(): void {
    this.customSelected.emit();
  }

  save(): void {
    this.store.saveTheme(this.selectedId());
    this.saved.emit();
  }

  isDark(theme: ThemeTemplate): boolean {
    return theme.previewBg.length > 6 && this.luma(theme.previewBg) < 80;
  }

  private luma(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
}
