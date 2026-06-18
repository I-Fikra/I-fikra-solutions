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
    inject,
    PLATFORM_ID,
    AfterViewInit,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Dialog, DialogModule } from 'primeng/dialog';
import { TranslocoModule } from '@jsverse/transloco';
import { ThemePersonalityService } from '@/app/foundation/core/theme-builder/theme-personality.service';
import type { PersonalityTokens } from '@/app/foundation/core/theme-builder/theme-personality.service';
import { LANG_CSS_VAR } from '@/app/foundation/core/theme-builder/theme-personality.service';

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
            #pDialog
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
            [styleClass]="(popupStyle ? 'app-dialog-popup' : 'app-dialog-md') + ' p-fluid ' + styleClass"
            [breakpoints]="breakpoints"
            (onShow)="_onDialogShow()"
            (onHide)="_onDialogHide()"
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
    `,
})
export class DialogShellComponent implements OnChanges {

    // ── الـ inputs الأصليين ────────────────────────────────────────────────
    @Input() breakpoints: Record<string, string> = { '960px': '75vw', '641px': '90vw' };
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
     * شغّله لما dialogStyle = 'popup' في الـ personality builder.
     */
    @Input() popupStyle = false;

    // ── الـ inputs الجديدة للـ design config ──────────────────────────────

    /**
     * الـ personality tokens المطلوب تطبيقها.
     * - preview   → بتتطبق على الـ dialog element بس (معزولة)، real-time مع كل تغيير
     * - permanent → بتتطبق globally على document.documentElement
     */
    @Input() designConfig: Partial<PersonalityTokens> | null = null;

    /**
     * 'preview'   → scoped على الـ dialog el بس، real-time، بدون أي أثر على الصفحة
     * 'permanent' → global apply (زي السلوك القديم)
     * 'none'      → ما بيعملش حاجة (الـ default)
     */
    @Input() designMode: DialogDesignMode = 'none';

    // ── outputs ────────────────────────────────────────────────────────────
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() save         = new EventEmitter<void>();
    @Output() cancelled    = new EventEmitter<void>();
    @Output() onHide       = new EventEmitter<void>();

    @ContentChild('dialogContent') contentTemplate?: TemplateRef<unknown>;
    @ContentChild('dialogFooter')  footerTemplate?:  TemplateRef<unknown>;

    // نحتاج ref على الـ p-dialog عشان نوصل للـ DOM el بتاعه
    @ViewChild('pDialog') private pDialog?: Dialog;

    // ── private ────────────────────────────────────────────────────────────
    private readonly personalitySvc = inject(ThemePersonalityService);
    private readonly platformId     = inject(PLATFORM_ID);

    // ─────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['designConfig'] || this.designMode === 'none') return;

        if (this.designMode === 'preview' && this.visible) {
            // real-time update — الـ dialog مفتوح، طبّق التغيير فوراً على الـ dialog el
            this._applyToDialogElement();
        }

        if (this.designMode === 'permanent' && this.visible) {
            // real-time update — طبّق globally
            this._applyGlobally();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // p-dialog event handlers
    // ─────────────────────────────────────────────────────────────────────

    _onDialogShow(): void {
        if (!this.designConfig || this.designMode === 'none') return;

        if (this.designMode === 'preview') {
            // نستنى frame واحد عشان p-dialog يكمل الـ render ويظهر الـ DOM el
            requestAnimationFrame(() => this._applyToDialogElement());
        } else {
            this._applyGlobally();
        }
    }

    _onDialogHide(): void {
        // preview — امسح الـ inline vars من الـ dialog el عشان ما يأثرش على حاجة
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
     * PREVIEW MODE
     * بيطبق الـ tokens على الـ .p-dialog DOM element بس (مش على الـ root).
     * CSS vars بتـ cascade لأولاده — يعني كل حاجة جوا الـ dialog هتتأثر،
     * وبره الـ dialog ما هيتغيرش حاجة.
     */
    private _applyToDialogElement(): void {
        if (!this.designConfig || !isPlatformBrowser(this.platformId)) return;

        const dialogEl = this._getDialogElement();
        if (!dialogEl) {
            // fallback لو ما لقيناش الـ element — طبّق globally مؤقت (نادر)
            console.warn('[DialogShell] Could not find dialog DOM element for preview scoping.');
            return;
        }

        this._applyTokensToElement(this.designConfig, dialogEl);
    }

    /**
     * PERMANENT MODE
     * بيطبق الـ tokens على document.documentElement (global) عن طريق الـ service.
     */
    private _applyGlobally(): void {
        if (!this.designConfig || !isPlatformBrowser(this.platformId)) return;
        this.personalitySvc.applyPersonality(this.designConfig);
    }

    /**
     * بيمسح كل الـ inline CSS vars من الـ dialog element لما يتقفل.
     */
    private _clearDialogElementVars(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        const dialogEl = this._getDialogElement();
        if (!dialogEl) return;

        for (const varName of ALL_THEME_CSS_VARS) {
            dialogEl.style.removeProperty(varName);
        }
        // امسح الـ font-family اللي ممكن اتحط على الـ dialog el
        dialogEl.style.removeProperty('font-family');
    }

    /**
     * بيجيب الـ .p-dialog DOM element الفعلي.
     * p-dialog بيعمل appendTo="body" فالـ element مش جوا الـ component tree —
     * بنوصله عن طريق pDialog.el.nativeElement.querySelector أو
     * pDialog.container (exposed في PrimeNG v17+).
     */
    private _getDialogElement(): HTMLElement | null {
        if (!this.pDialog) return null;

        // PrimeNG v17+ بيعرض container$ أو container
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dlg = this.pDialog as any;

        // الـ container هو الـ .p-dialog div الفعلي
        if (dlg.container instanceof HTMLElement) {
            return dlg.container;
        }

        // fallback: el.nativeElement هو الـ host element، والـ dialog div بيكون أول child
        if (dlg.el?.nativeElement instanceof HTMLElement) {
            const host = dlg.el.nativeElement as HTMLElement;
            // لو appendTo=body — الـ dialog بيتنقل لـ body، نحتاج ندور عليه
            const byClass = document.body.querySelector<HTMLElement>('.p-dialog:last-of-type');
            return byClass ?? host.querySelector<HTMLElement>('.p-dialog') ?? host;
        }

        return null;
    }

    /**
     * بيطبق الـ PersonalityTokens على عنصر معين (مش بالضرورة الـ root).
     * نفس منطق ThemePersonalityService.applyPersonality بالظبط —
     * بس بنبعت الـ element كـ parameter عشان نعمل scoping.
     */
    private _applyTokensToElement(tokens: Partial<PersonalityTokens>, el: HTMLElement): void {
        const s = (varName: string, value: string | undefined) => {
            if (value) el.style.setProperty(varName, value);
        };

        s('--border-radius',              tokens.radiusBase);
        s('--p-border-radius-sm',         tokens.radiusBase);
        s('--app-card-radius',            tokens.radiusCard);
        s('--app-dialog-radius',          tokens.radiusDialog);
        s('--app-table-radius',           tokens.radiusTable);

        if (tokens.fontFamily) {
            s('--app-font-family', tokens.fontFamily);
            el.style.setProperty('font-family', tokens.fontFamily); // cascade للـ text جوا الـ dialog
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

        s('--app-font-size-base',         tokens.fontSizeBase);
        s('--app-heading-weight',         tokens.headingWeight);
        s('--app-line-height',            tokens.bodyLineHeight);
        s('--app-letter-spacing',         tokens.letterSpacing);
        s('--app-type-scale-ratio',       tokens.scaleRatio);
        s('--app-responsive-min-width',   tokens.responsiveMinWidth);
        s('--app-responsive-font-size',   tokens.responsiveFontSize);
        s('--app-responsive-scale',       tokens.responsiveScale);
        s('--app-body-weight',            tokens.bodyWeight);
        s('--app-body-color',             tokens.bodyColor);
        s('--app-body-background',        tokens.bodyBackground);

        s('--app-card-shadow',            tokens.cardShadow);
        s('--app-card-border',            tokens.cardBorder);
        s('--app-card-padding',           tokens.cardPadding);

        s('--app-dialog-shadow',          tokens.dialogShadow);
        s('--app-dialog-border',          tokens.dialogBorder);
        s('--app-dialog-header-bg',       tokens.dialogHeaderBg);
        s('--app-dialog-header-color',    tokens.dialogHeaderColor);

        s('--app-table-header-bg',        tokens.tableHeaderBg);
        s('--app-table-row-height',       tokens.tableRowHeight);
        el.style.setProperty('--app-table-striped', tokens.tableStriped ? '1' : '0');

        s('--app-topbar-bg',              tokens.topbarBg);
        s('--app-topbar-color',           tokens.topbarColor);
        s('--app-sidebar-bg',             tokens.sidebarBg);
        s('--app-sidebar-active-color',   tokens.sidebarActiveColor);

        s('--app-btn-radius',             tokens.buttonRadius);
        s('--app-btn-padding',            tokens.buttonPadding);
        s('--app-btn-transform',          tokens.buttonTextTransform);
        s('--app-btn-weight',             tokens.buttonFontWeight);
    }
}