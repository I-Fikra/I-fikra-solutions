import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import { type TopbarHeight, type TopbarBorder } from '../../../theme-configuration.model';

const HEIGHT_MAP: Record<TopbarHeight, string> = {
  compact: '36px',
  normal:  '48px',
  tall:    '60px',
};

const BORDER_MAP: Record<TopbarBorder, string> = {
  none:   'none',
  thin:   '1px solid rgba(0,0,0,0.1)',
  shadow: '0 2px 6px rgba(0,0,0,0.08)',
};

@Component({
  selector: 'app-topbar-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './topbar-preview.component.html',
  styleUrls:   ['./topbar-preview.component.scss'],
})
export class TopbarPreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  readonly topbarStyle = computed(() => {
    const tb = this.store.topbar();
    return {
      height:       HEIGHT_MAP[tb.height],
      borderBottom: tb.borderStyle !== 'shadow' ? BORDER_MAP[tb.borderStyle] : 'none',
      boxShadow:    tb.borderStyle === 'shadow'  ? BORDER_MAP['shadow']          : 'none',
      background:   tb.bgColor || (tb.accented ? 'var(--primary-color)' : 'var(--surface-card)'),
    };
  });
}
