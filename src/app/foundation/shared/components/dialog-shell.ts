import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  ViewChild,
  TemplateRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  inject,
  PLATFORM_ID,
  computed,
  effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { ThemePersonalityService } from '@/app/foundation/core/theme-builder/theme-personality.service';
import type { PersonalityTokens } from '@/app/foundation/core/theme-builder/theme-personality.service';
import { LANG_CSS_VAR } from '@/app/foundation/core/theme-builder/theme-personality.service';
import { UIStyleDesignerService } from '@/app/foundation/core/ui-style-designer/ui-style-designer.service';
import { mapComponentStyleToPersonalityTokens } from '@/app/foundation/core/theme-builder/component-style-mapper';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 'preview'   → بيطبق الـ tokens على الـ dialog element بس (معزول تماماً عن الصفحة)
 *               وبيحدّث في real-time لما designConfig يتغير
 * 'permanent' → بيطبق على document.documentElement (global) ويفضل دايم
 * 'none'      → الـ default — ما بيعملش أي تغيير
 */
export type DialogDesignMode = 'preview' | 'permanent' | 'none';

// كل الـ CSS vars اللي applyPersonality بتشتغل عليهم
const ALL_THEME_CSS_VARS = [
  '--border-radius',
  '--p-border-radius-sm',
  '--app-card-radius',
  '--app-dialog-radius',
  '--app-table-radius',
  '--app-font-family',
  '--app-font-arabic',
  '--app-font-latin',
  '--app-font-chinese',
  '--app-font-japanese',
  '--app-font-korean',
  '--app-font-greek',
  '--app-font-cyrillic',
  '--app-font-custom',
  '--app-font-size-base',
  '--app-heading-weight',
  '--app-line-height',
  '--app-letter-spacing',
  '--app-type-scale-ratio',
  '--app-responsive-min-width',
  '--app-responsive-font-size',
  '--app-responsive-scale',
  '--app-body-weight',
  '--app-body-color',
  '--app-body-background',
  '--app-body-bg',
  '--app-card-shadow',
  '--app-card-border',
  '--app-card-padding',
  '--app-card-bg',
  '--app-dialog-shadow',
  '--app-dialog-border',
  '--app-dialog-header-bg',
  '--app-dialog-header-color',
  '--app-dialog-header-height',
  '--app-dialog-overlay-opacity',
  '--app-dialog-animation',
  '--app-table-header-bg',
  '--app-table-header-style-bg',
  '--app-table-row-height',
  '--app-table-striped',
  '--app-table-row-separator',
  '--app-table-col-separator',
  '--app-table-hover-bg',
  '--app-topbar-bg',
  '--app-topbar-color',
  '--app-topbar-height',
  '--app-topbar-border',
  '--app-topbar-shadow',
  '--app-sidebar-bg',
  '--app-sidebar-active-color',
  '--app-sidebar-width',
  '--app-sidebar-icons-only',
  '--app-btn-radius',
  '--app-btn-padding',
  '--app-btn-transform',
  '--app-btn-weight',
  '--app-btn-box-shadow',
  '--app-accent-override',
  '--app-text-override',
  '--app-login-layout',
  // dialog advanced extra vars
  '--app-dialogs-margin',
  '--app-dialogs-width'
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dialog-shell',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TranslocoModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      (visibleChange)="visibleChange.emit($event)"
      [header]="header"
      [modal]="true"
      [dismissableMask]="dismissableMask"
      [draggable]="draggable"
      [resizable]="resizable"
      [blockScroll]="blockScroll"
      [showHeader]="showHeader"
      [closable]="closable"
      [appendTo]="appendTo"
      [baseZIndex]="baseZIndex"
      [style]="style"
      [styleClass]="'app-dialog-md p-fluid ' + styleClass"
      [breakpoints]="breakpoints"
      (onHide)="onHide.emit()"
    >
      <ng-container
        *ngIf="contentTemplate"
        [ngTemplateOutlet]="contentTemplate"
      />
      <ng-content *ngIf="!contentTemplate" />

      @if (!hideFooter) {
        <ng-template pTemplate="footer">
          <ng-container
            *ngIf="footerTemplate; else defaultFooter"
            [ngTemplateOutlet]="footerTemplate"
          />
          <ng-template #defaultFooter>
            <div class="flex justify-end gap-2">
              <p-button
                [label]="'shared.common.cancel' | transloco"
                severity="secondary"
                (onClick)="cancel()"
              />
              <p-button
                [label]="'shared.common.save' | transloco"
                icon="pi pi-check"
                [disabled]="saveDisabled"
                (onClick)="save.emit()"
              />
            </div>
          </ng-template>
        </ng-template>
      }
    </p-dialog>
  `
})
export class DialogShellComponent implements OnChanges, OnDestroy {
  // ── الـ inputs الأصليين ────────────────────────────────────────────────
  @Input() breakpoints: Record<string, string> = {
    '960px': '75vw',
    '641px': '90vw'
  };
  @Input() dismissableMask = true;
  @Input() visible = false;
  @Input() header = '';
  @Input() saveDisabled = false;
  @Input() styleClass = '';
  @Input() style: Record<string, string> = { width: '450px' };
  @Input() showHeader = true;
  @Input() closable = true;
  @Input() draggable = false;
  @Input() resizable = false;
  @Input() blockScroll = false;
  @Input() appendTo: string = 'body';
  @Input() baseZIndex = 0;
  @Input() hideFooter = false;

  /**
   * لما تبقى true — بيضيف class 'app-dialog-popup' على الـ p-dialog
   * عشان يطبق الـ gradient border + big radius style الخاص بالمشروع.
   */
  @Input() popupStyle = false;

  // ── الـ inputs للـ design config (للـ personality builder / preview) ──

  /**
   * الـ personality tokens المطلوب تطبيقها.
   * - preview   → بتتطبق على الـ dialog element بس (معزولة)، real-time مع كل تغيير
   * - permanent → بتتطبق globally على document.documentElement
   *
   * الأولوية: designConfig (من برا) > advancedTokens (من UIStyleDesignerService).
   * لو designConfig موجود، هو اللي بيكسب — عشان الـ personality preview
   * ما يتأثرش بقيم الـ UI Style Designer في نفس الوقت.
   */
  @Input() designConfig: Partial<PersonalityTokens> | null = null;

  /**
   * 'preview'   → scoped على الـ dialog el بس، real-time
   * 'permanent' → global apply
   * 'none'      → الـ default
   */
  @Input() designMode: DialogDesignMode = 'none';

  // ── outputs ────────────────────────────────────────────────────────────
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() onHide = new EventEmitter<void>();

  @ContentChild('dialogContent') contentTemplate?: TemplateRef<unknown>;
  @ContentChild('dialogFooter') footerTemplate?: TemplateRef<unknown>;

  @ViewChild('pDialog') private pDialog?: Dialog;

  // ── services ───────────────────────────────────────────────────────────
  private readonly personalitySvc = inject(ThemePersonalityService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly uiStyleSvc = inject(UIStyleDesignerService);

  /**
   * computed signal: بيحوّل ComponentStyleConfig بتاعة dialogs
   * لـ { tokens, extraVars } جاهزة للتطبيق.
   * بيتحسب تلقائياً لما UIStyleDesignerService.config يتغير.
   */
  private readonly _advancedMapped = computed(() => {
    const cfg = this.uiStyleSvc.config()['dialogs'];
    return mapComponentStyleToPersonalityTokens('dialogs', cfg);
  });

  /**
   * effect: لما _advancedMapped يتغير (يعني اليوزر دوس Save في الـ designer)
   * وما فيش designConfig خارجي شغال (مش في preview mode)، طبّق على الـ dialog.
   *
   * لو الـ dialog مفتوح وقت التغيير → طبّق فوراً على الـ element.
   * لو مقفول → هيتطبق تلقائياً في _onDialogShow() الجاية.
   */
  private readonly _advancedEffect = effect(() => {
    const mapped = this._advancedMapped(); // اشترك في الـ signal
    if (!isPlatformBrowser(this.platformId)) return;

    // لو في designConfig خارجي شغال → سيبه يكسب، ما تتدخلش
    if (this.designConfig && this.designMode !== 'none') return;

    if (this.visible) {
      requestAnimationFrame(() => this._applyAdvancedToElement(mapped));
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['designConfig'] || this.designMode === 'none') return;

    if (this.designMode === 'preview' && this.visible) {
      this._applyToDialogElement();
    }

    if (this.designMode === 'permanent' && this.visible) {
      this._applyGlobally();
    }
  }

  ngOnDestroy(): void {
    // effect بيتنظّف تلقائياً مع الـ component — مش محتاجين unsubscribe يدوي
  }

  // ─────────────────────────────────────────────────────────────────────
  // p-dialog event handlers
  // ─────────────────────────────────────────────────────────────────────

  _onDialogShow(): void {
    // أولوية 1: designConfig خارجي (personality preview / permanent)
    if (this.designConfig && this.designMode !== 'none') {
      if (this.designMode === 'preview') {
        requestAnimationFrame(() => this._applyToDialogElement());
      } else {
        this._applyGlobally();
      }
      return;
    }

    // أولوية 2: advanced config من UIStyleDesignerService (بعد Apply)
    requestAnimationFrame(() => {
      this._applyAdvancedToElement(this._advancedMapped());
    });
  }

  _onDialogHide(): void {
    if (this.designMode === 'preview') {
      this._clearDialogElementVars();
    }
    this.onHide.emit();
  }

  cancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancelled.emit();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────

  /**
   * ADVANCED MODE — بيطبق tokens + extraVars من UIStyleDesignerService
   * على الـ dialog element مباشرة (scoped، مش global).
   */
  private _applyAdvancedToElement(
    mapped: ReturnType<typeof mapComponentStyleToPersonalityTokens>
  ): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dialogEl = this._getDialogElement();
    if (!dialogEl) return;

    this._applyTokensToElement(mapped.tokens, dialogEl);

    // extraVars (margin / width) — setProperty مباشر على الـ element
    for (const [varName, value] of Object.entries(mapped.extraVars)) {
      dialogEl.style.setProperty(varName, value);
    }
  }

  /**
   * PREVIEW MODE — designConfig خارجي على الـ element (معزول)
   */
  private _applyToDialogElement(): void {
    if (!this.designConfig || !isPlatformBrowser(this.platformId)) return;

    const dialogEl = this._getDialogElement();
    if (!dialogEl) {
      console.warn(
        '[DialogShell] Could not find dialog DOM element for preview scoping.'
      );
      return;
    }

    this._applyTokensToElement(this.designConfig, dialogEl);
  }

  /**
   * PERMANENT MODE — global على document.documentElement
   */
  private _applyGlobally(): void {
    if (!this.designConfig || !isPlatformBrowser(this.platformId)) return;
    this.personalitySvc.applyPersonality(this.designConfig);
  }

  private _clearDialogElementVars(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dialogEl = this._getDialogElement();
    if (!dialogEl) return;

    for (const varName of ALL_THEME_CSS_VARS) {
      dialogEl.style.removeProperty(varName);
    }
    dialogEl.style.removeProperty('font-family');
  }

  private _getDialogElement(): HTMLElement | null {
    if (!this.pDialog) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dlg = this.pDialog as any;

    if (dlg.container instanceof HTMLElement) {
      return dlg.container;
    }

    if (dlg.el?.nativeElement instanceof HTMLElement) {
      const host = dlg.el.nativeElement as HTMLElement;
      const byClass = document.body.querySelector<HTMLElement>(
        '.p-dialog:last-of-type'
      );
      return byClass ?? host.querySelector<HTMLElement>('.p-dialog') ?? host;
    }

    return null;
  }

  private _applyTokensToElement(
    tokens: Partial<PersonalityTokens>,
    el: HTMLElement
  ): void {
    const s = (varName: string, value: string | undefined) => {
      if (value) el.style.setProperty(varName, value);
    };

    s('--border-radius', tokens.radiusBase);
    s('--p-border-radius-sm', tokens.radiusBase);
    s('--app-card-radius', tokens.radiusCard);
    s('--app-dialog-radius', tokens.radiusDialog);
    s('--app-table-radius', tokens.radiusTable);

    if (tokens.fontFamily) {
      s('--app-font-family', tokens.fontFamily);
      el.style.setProperty('font-family', tokens.fontFamily);
    }
    if (tokens.arabicFontFamily) {
      s('--app-font-arabic', tokens.arabicFontFamily);
    }
    if (tokens.fontEntries) {
      tokens.fontEntries.forEach((entry, i) => {
        const cssVar = LANG_CSS_VAR[entry.lang] ?? `--app-font-custom-${i}`;
        el.style.setProperty(cssVar, entry.font);
        if (i === 0) {
          s('--app-font-family', entry.font);
          el.style.setProperty('font-family', entry.font);
        }
      });
    }

    s('--app-font-size-base', tokens.fontSizeBase);
    s('--app-heading-weight', tokens.headingWeight);
    s('--app-line-height', tokens.bodyLineHeight);
    s('--app-letter-spacing', tokens.letterSpacing);
    s('--app-type-scale-ratio', tokens.scaleRatio);
    s('--app-responsive-min-width', tokens.responsiveMinWidth);
    s('--app-responsive-font-size', tokens.responsiveFontSize);
    s('--app-responsive-scale', tokens.responsiveScale);
    s('--app-body-weight', tokens.bodyWeight);
    s('--app-body-color', tokens.bodyColor);
    s('--app-body-background', tokens.bodyBackground);

    s('--app-card-shadow', tokens.cardShadow);
    s('--app-card-border', tokens.cardBorder);
    s('--app-card-padding', tokens.cardPadding);

    s('--app-dialog-shadow', tokens.dialogShadow);
    s('--app-dialog-border', tokens.dialogBorder);
    s('--app-dialog-header-bg', tokens.dialogHeaderBg);
    s('--app-dialog-header-color', tokens.dialogHeaderColor);

    s('--app-table-header-bg', tokens.tableHeaderBg);
    s('--app-table-row-height', tokens.tableRowHeight);
    el.style.setProperty(
      '--app-table-striped',
      tokens.tableStriped ? '1' : '0'
    );

    s('--app-topbar-bg', tokens.topbarBg);
    s('--app-topbar-color', tokens.topbarColor);
    s('--app-sidebar-bg', tokens.sidebarBg);
    s('--app-sidebar-active-color', tokens.sidebarActiveColor);

    s('--app-btn-radius', tokens.buttonRadius);
    s('--app-btn-padding', tokens.buttonPadding);
    s('--app-btn-transform', tokens.buttonTextTransform);
    s('--app-btn-weight', tokens.buttonFontWeight);
  }
}
