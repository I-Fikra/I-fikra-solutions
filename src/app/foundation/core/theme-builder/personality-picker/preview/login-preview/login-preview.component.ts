import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import { CARD_RADIUS_MAP, BTN_RADIUS_MAP, type ComponentShape } from '../../../theme-configuration.model';

const SHAPE_RADIUS_MAP: Record<ComponentShape, string> = {
  sharp:   '3px',
  rounded: '8px',
  soft:    '16px',
  pill:    '24px',
};

@Component({
  selector: 'app-login-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './login-preview.component.html',
  styleUrls:   ['./login-preview.component.scss'],
})
export class LoginPreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  readonly loginStyle = computed(() => {
    const lg    = this.store.login();
    const shape = this.store.shape().globalShape;
    let bg = '';
    if      (lg.bg === 'solid')    bg = lg.bgColor;
    else if (lg.bg === 'gradient') bg = `linear-gradient(135deg, ${lg.bgGradientFrom}, ${lg.bgGradientTo})`;
    else                           bg = 'var(--surface-ground)';

    return {
      background:   bg,
      layout:       lg.layout,
      logoPos:      lg.logoPos,
      cardRadius:   CARD_RADIUS_MAP[shape],
      inputRadius:  SHAPE_RADIUS_MAP[shape],
      btnRadius:    BTN_RADIUS_MAP[shape],
    };
  });
}
