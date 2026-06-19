import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeConfigurationStore } from '../../../theme-configuration.store';
import { BTN_RADIUS_MAP } from '../../../theme-configuration.model';

const BTN_SHADOW_MAP: Record<string, string> = {
  none:   'none',
  soft:   '0 2px 8px rgba(0,0,0,0.12)',
  lifted: '0 4px 16px rgba(0,0,0,0.2)',
};

@Component({
  selector: 'app-button-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './button-preview.component.html',
  styleUrls: ['./button-preview.component.scss'],
})
export class ButtonPreviewComponent {
  private readonly store = inject(ThemeConfigurationStore);

  readonly btnRadius = computed(() => BTN_RADIUS_MAP[this.store.button().shape]);
  readonly btnShadow = computed(() => BTN_SHADOW_MAP[this.store.button().shadow] ?? 'none');
}
