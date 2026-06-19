import { Component, signal, computed, inject, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgStyle, UpperCasePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

import { UIStyleDesignerService } from './ui-style-designer.service';
import {
  ComponentKey,
  ComponentStyleConfig,
  SubElementKey,
  SubElementStyle,
  COMPONENT_KEYS,
  COMPONENT_META,
  COMPONENT_SUB_ELEMENTS,
  FONT_FAMILIES,
  DEFAULT_SUB_ELEMENT_STYLE,
} from './ui-style-designer.model';

// ── Static preview data ───────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'pi-objects-column', active: true  },
  { label: 'Users',     icon: 'pi-users',          active: false },
  { label: 'Settings',  icon: 'pi-cog',            active: false },
  { label: 'Reports',   icon: 'pi-file',           active: false },
];

const TABLE_ROWS = [
  { id: 1, name: 'Janen Smith', status: 'Running', severity: 'success' },
  { id: 2, name: 'John Borith', status: 'Support', severity: 'warning' },
  { id: 3, name: 'Kath Lines',  status: 'Support', severity: 'warning' },
];

const FONT_WEIGHTS: ('Regular' | 'Medium' | 'Bold')[] = ['Regular', 'Medium', 'Bold'];
const TEXT_ALIGNS: { value: SubElementStyle['textAlign']; icon: string }[] = [
  { value: 'left',    icon: 'pi-align-left'    },
  { value: 'center',  icon: 'pi-align-center'  },
  { value: 'right',   icon: 'pi-align-right'   },
  { value: 'justify', icon: 'pi-align-justify' },
];

@Component({
  selector: 'app-ui-style-designer',
  standalone: true,
  imports: [
    FormsModule, NgStyle, UpperCasePipe,
    ButtonModule, SliderModule, ToggleSwitchModule,
    ToastModule, TooltipModule, SelectModule,
  ],
  templateUrl: './ui-style-designer.component.html',
  styleUrls: ['./ui-style-designer.component.scss'],
  providers: [MessageService],
  encapsulation: ViewEncapsulation.None,
})
export class UIStyleDesignerComponent {
  private svc            = inject(UIStyleDesignerService);
  private messageService = inject(MessageService);

  // ── Active component tab ──────────────────────────────────────────────────
  activeKey = signal<ComponentKey>('tables');

  // ── Sub-element popover ───────────────────────────────────────────────────
  activeSubElement = signal<SubElementKey | null>(null);
  popoverAnchor    = signal<{ top: number; left: number } | null>(null);

  // ── Public constants ──────────────────────────────────────────────────────
  readonly componentKeys      = COMPONENT_KEYS;
  readonly componentMeta      = COMPONENT_META;
  readonly sidebarItems       = SIDEBAR_ITEMS;
  readonly tableRows          = TABLE_ROWS;
  readonly fontFamilies       = FONT_FAMILIES;
  readonly fontWeights        = FONT_WEIGHTS;
  readonly textAligns         = TEXT_ALIGNS;

  // ── Config access ─────────────────────────────────────────────────────────
  readonly config      = computed(() => this.svc.config());
  activeConfig         = computed<ComponentStyleConfig>(() => this.config()[this.activeKey()]);

  // ── Sub-elements for active component ─────────────────────────────────────
  activeSubElements = computed(() => COMPONENT_SUB_ELEMENTS[this.activeKey()]);

  activeSubElementStyle = computed<SubElementStyle>(() => {
    const sub = this.activeSubElement();
    if (!sub) return { ...DEFAULT_SUB_ELEMENT_STYLE };
    return {
      ...DEFAULT_SUB_ELEMENT_STYLE,
      ...(this.activeConfig().subElements?.[sub] ?? {}),
    };
  });

  activeSubElementLabel = computed(() => {
    const sub = this.activeSubElement();
    if (!sub) return '';
    return this.activeSubElements().find(s => s.key === sub)?.label ?? '';
  });

  // ── Label helpers ─────────────────────────────────────────────────────────
  shapeLabel = computed(() => `COMPONENT SHAPE & DEPTH`);
  strokeLabel = computed(() => `COMPONENT STROKE & COLOR`);

  saveLabel = computed(() =>
    `SAVE ${COMPONENT_META[this.activeKey()].label.toUpperCase().slice(0, -1)} STYLES`
  );

  // ── Tab switching ─────────────────────────────────────────────────────────

  setActiveKey(key: ComponentKey): void {
    this.activeKey.set(key);
    this.closePopover();
  }

  // ── Config patching ───────────────────────────────────────────────────────

  patch(partial: Partial<ComponentStyleConfig>): void {
    this.svc.patchComponent(this.activeKey(), partial);
  }

  patchSubEl(partial: Partial<SubElementStyle>): void {
    const sub = this.activeSubElement();
    if (!sub) return;
    this.svc.patchSubElement(this.activeKey(), sub, partial);
  }

  // ── Input handlers ────────────────────────────────────────────────────────

  onNumericInput(field: keyof ComponentStyleConfig, min: number, max: number) {
    return (event: Event) => {
      const v = +(event.target as HTMLInputElement).value;
      if (!isNaN(v)) this.patch({ [field]: Math.min(max, Math.max(min, v)) } as any);
    };
  }

  onBorderColorInput(event: Event): void {
    this.patch({ borderColor: (event.target as HTMLInputElement).value });
  }

  onSubElColorInput(event: Event): void {
    this.patchSubEl({ fontColor: (event.target as HTMLInputElement).value });
  }

  // ── Sub-element popover ───────────────────────────────────────────────────

  openSubElementPopover(subKey: SubElementKey, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeSubElement() === subKey) {
      this.closePopover();
      return;
    }
    this.activeSubElement.set(subKey);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const wrapRect = target.closest('.usd-preview-area')?.getBoundingClientRect();
    this.popoverAnchor.set({
      top:  rect.bottom - (wrapRect?.top ?? 0) + 8,
      left: rect.left   - (wrapRect?.left ?? 0),
    });
  }

  closePopover(): void {
    this.activeSubElement.set(null);
    this.popoverAnchor.set(null);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  saveStyles(): void {
    this.svc.save();
    const label = COMPONENT_META[this.activeKey()].label.slice(0, -1);
    this.messageService.add({ severity: 'success', summary: 'Styles Saved', detail: `${label} styles saved.` });
  }

  applyGlobal(): void {
    this.svc.applyGlobal();
    this.messageService.add({ severity: 'success', summary: 'Applied', detail: 'All styles applied to system.' });
  }

  resetCurrent(): void {
    this.svc.reset(this.activeKey());
  }

  // ── Preview style helpers ─────────────────────────────────────────────────

  previewStyles(key: ComponentKey): Record<string, string> {
    const cfg = this.config()[key];
    return {
      borderRadius: `${cfg.cornerRadius}px`,
      ...(cfg.elevationShadow ? { boxShadow: '0 4px 16px rgba(0,0,0,0.18)' } : {}),
      ...(cfg.border ? { border: `${cfg.borderWidth}px solid ${cfg.borderColor}` } : {}),
    };
  }

  isActiveComponent(key: ComponentKey): boolean {
    return this.activeKey() === key;
  }

  // Sub-element style helpers
  subElStyle(subKey: SubElementKey): Record<string, string> {
    const s = {
      ...DEFAULT_SUB_ELEMENT_STYLE,
      ...(this.activeConfig().subElements?.[subKey] ?? {}),
    } as SubElementStyle;
    return {
      fontFamily:    s.fontFamily,
      fontSize:      `${s.fontSize}px`,
      fontWeight:    s.fontWeight === 'Bold' ? '700' : s.fontWeight === 'Medium' ? '500' : '400',
      color:         s.fontColor,
      textAlign:     s.textAlign,
    };
  }
}