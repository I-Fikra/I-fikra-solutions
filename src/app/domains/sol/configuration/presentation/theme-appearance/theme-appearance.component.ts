import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';

import { TaThemesComponent } from './themes/themes.component';
import { TaCustomThemeComponent } from './custom-theme/custom-theme.component';
import { ThemeAppearanceStore } from './theme-appearance.store';

type StepKey = 'themes' | 'custom-theme' | 'fine-tune' | 'personality' | 'color-groups';

interface WizardStep {
  key: StepKey;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-theme-appearance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    StepsModule,
    ButtonModule,
    ToastModule,
    TaThemesComponent,
    TaCustomThemeComponent
  ],
  providers: [MessageService],
  templateUrl: './theme-appearance.component.html',
  styleUrl: './theme-appearance.component.scss'
})
export class ThemeAppearanceComponent {
  private readonly store = inject(ThemeAppearanceStore);
  private readonly messageService = inject(MessageService);

  readonly done = output<void>();

  readonly steps: WizardStep[] = [
    { key: 'themes',        label: 'Themes',       icon: 'pi pi-images'   },
    { key: 'fine-tune',     label: 'Fine-tune',    icon: 'pi pi-sliders-h' },
    { key: 'personality',   label: 'Personality',  icon: 'pi pi-sparkles' },
    { key: 'color-groups',  label: 'Color Groups', icon: 'pi pi-th-large' }
  ];

  activeStepKey = signal<StepKey>('themes');

  // For the steps indicator, custom-theme maps to index 1 (fine-tune slot)
  readonly activeIndex = computed(() => {
    const key = this.activeStepKey();
    if (key === 'custom-theme') return 1;
    return this.steps.findIndex(s => s.key === key);
  });

  readonly isFirst = computed(() => this.activeStepKey() === 'themes');
  readonly isLast  = computed(() => this.activeIndex() === this.steps.length - 1);

  readonly stepItems = computed<MenuItem[]>(() => {
    const current = this.activeIndex();
    return this.steps.map((s, i) => ({
      label: s.label,
      disabled: i > current,
      command: () => { if (i <= current) this.activeStepKey.set(s.key); }
    }));
  });

  goBack(): void {
    if (this.activeStepKey() === 'custom-theme') {
      this.activeStepKey.set('themes');
      return;
    }
    const i = this.activeIndex();
    if (i > 0) this.activeStepKey.set(this.steps[i - 1].key);
  }

  goToFineTune(): void {
    this.activeStepKey.set('custom-theme');
  }

  onStepSaved(): void {
    const key = this.activeStepKey();

    // custom-theme is a special step that skips fine-tune → go to personality
    if (key === 'custom-theme') {
      this.messageService.add({ severity: 'success', summary: 'Custom Theme saved', detail: 'Moving to next step…', life: 2000 });
      this.activeStepKey.set('personality');
      return;
    }

    const i = this.activeIndex();
    const step = this.steps[i];

    this.messageService.add({
      severity: 'success',
      summary: `${step.label} saved`,
      detail: 'Moving to next step…',
      life: 2000
    });

    if (i < this.steps.length - 1) {
      this.activeStepKey.set(this.steps[i + 1].key);
    } else {
      this.onFinish();
    }
  }

  private onFinish(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Theme & Appearance saved',
      detail: 'All steps completed successfully.',
      life: 3000
    });
    this.done.emit();
  }
}
