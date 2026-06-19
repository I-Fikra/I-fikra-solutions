import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import { type SidebarWidth, type TopbarHeight, type TopbarBorder } from '../../../theme-configuration.model';

const SIDEBAR_WIDTH_MAP: Record<SidebarWidth, string> = {
  narrow: '36px',
  normal: '44px',
  wide:   '52px',
};

const TOPBAR_HEIGHT_MAP: Record<TopbarHeight, string> = {
  compact: '36px',
  normal:  '48px',
  tall:    '60px',
};

const TOPBAR_BORDER_MAP: Record<TopbarBorder, string> = {
  none:   'none',
  thin:   '1px solid rgba(0,0,0,0.1)',
  shadow: '0 2px 6px rgba(0,0,0,0.08)',
};

@Component({
  selector: 'app-sidebar-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './sidebar-preview.component.html',
  styleUrls:   ['./sidebar-preview.component.scss'],
})
export class SidebarPreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  readonly sidebarStyle = computed(() => {
    const sb = this.store.sidebar();
    return {
      width:      sb.iconsOnly ? '28px' : SIDEBAR_WIDTH_MAP[sb.width],
      background: sb.bgColor || (sb.dark ? 'var(--surface-900, #18181b)' : 'var(--surface-card)'),
    };
  });

  readonly topbarStyle = computed(() => {
    const tb = this.store.topbar();
    return {
      height:       TOPBAR_HEIGHT_MAP[tb.height],
      borderBottom: tb.borderStyle !== 'shadow' ? TOPBAR_BORDER_MAP[tb.borderStyle] : 'none',
      boxShadow:    tb.borderStyle === 'shadow'  ? TOPBAR_BORDER_MAP['shadow']          : 'none',
      background:   tb.bgColor || (tb.accented ? 'var(--primary-color)' : 'var(--surface-card)'),
    };
  });
}
