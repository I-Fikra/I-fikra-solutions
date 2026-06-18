import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    EventEmitter,
    forwardRef,
    HostListener,
    inject,
    Input,
    OnChanges,
    Output,
    signal,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { JiraFilterOption, JiraFilterOperator, JiraFilterOperatorOption } from '../../models/filter.models';

export type { JiraFilterOption, JiraFilterOperator };

@Component({
    selector: 'app-filter',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, TranslocoModule],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => FilterComponent),
        multi: true
    }],
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements ControlValueAccessor, OnChanges {

    // ── Inputs ────────────────────────────────────────────────────────────────

    @Input() label = '';
    @Input() options: JiraFilterOption[] = [];

    @Input() selected: string[] = [];
    @Output() selectedChange = new EventEmitter<string[]>();

    @Input() showOperator = false;
    @Input() operator: JiraFilterOperator = 'equals';
    @Output() operatorChange = new EventEmitter<JiraFilterOperator>();

    @Input() maxLabels = 1;
    @Input() showClear = true;
    @Input() disabled  = false;

    // ── ViewChild ─────────────────────────────────────────────────────────────

    @ViewChild('panelRef') panelRef?: ElementRef<HTMLElement>;

    // ── State ─────────────────────────────────────────────────────────────────

    isOpen     = signal(false);
    searchText = signal('');

    private _selected = signal<string[]>([]);

    readonly selectedCount  = computed(() => this._selected().length);
    readonly hasSelection   = computed(() => this._selected().length > 0);

    readonly filteredOptions = computed(() => {
        const q = this.searchText().toLowerCase().trim();
        return q ? this.options.filter(o => o.label.toLowerCase().includes(q)) : this.options;
    });

    readonly buttonText = computed(() => {
        const labels = this._selected().map(v => this.options.find(o => o.value === v)?.label ?? v);
        if (!labels.length) return null;
        return labels.length <= this.maxLabels ? labels.join(', ') : `${labels[0]} +${labels.length - 1}`;
    });

    readonly operatorOptions: JiraFilterOperatorOption[] = [
        { label: '= (equals)',     value: 'equals' },
        { label: '≠ (not equals)', value: 'not_equals' },
        { label: '~ (contains)',   value: 'contains' }
    ];

    readonly operatorLabel = computed(() => {
        return this.operatorOptions.find(o => o.value === this.operator)?.label.split(' ')[0] ?? '=';
    });

    // ── ControlValueAccessor ──────────────────────────────────────────────────

    private onChange: (v: string[]) => void = () => {};
    private onTouched: () => void = () => {};

    private readonly elRef = inject<ElementRef<HTMLElement>>(ElementRef);

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['selected']) this._selected.set(this.selected ?? []);
    }

    writeValue(value: string[]): void                     { this._selected.set(value ?? []); }
    registerOnChange(fn: (v: string[]) => void): void     { this.onChange = fn; }
    registerOnTouched(fn: () => void): void               { this.onTouched = fn; }
    setDisabledState(d: boolean): void                    { this.disabled = d; }

    // ── Public API ────────────────────────────────────────────────────────────

    toggleOpen(): void {
        if (this.disabled) return;
        this.isOpen.update(v => !v);
        if (this.isOpen()) {
            this.searchText.set('');
            setTimeout(() => this.positionPanel(), 0);
        }
        this.onTouched();
    }

    close(): void { this.isOpen.set(false); }

    isSelected(value: string): boolean { return this._selected().includes(value); }

    toggleOption(value: string): void {
        const current = this._selected();
        const next = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        this.emit(next);
    }

    clearAll(event: Event): void {
        event.stopPropagation();
        this.emit([]);
        this.close();
    }

    selectOperator(op: JiraFilterOperator): void {
        this.operator = op;
        this.operatorChange.emit(op);
    }

    // ── Panel positioning ─────────────────────────────────────────────────────

    private positionPanel(): void {
        const panel = this.panelRef?.nativeElement;
        if (!panel) return;

        const trigger = this.elRef.nativeElement.querySelector('.jf-trigger') as HTMLElement;
        const r   = trigger.getBoundingClientRect();
        const pW  = panel.offsetWidth;
        const pH  = panel.offsetHeight;
        const vw  = window.innerWidth;
        const vh  = window.innerHeight;
        const GAP = 12;

        // Horizontal: align to trigger left, flip if right edge clips, clamp left edge
        let left = r.left;
        if (left + pW > vw - GAP) left = r.right - pW;
        left = Math.max(GAP, left);

        // Vertical: prefer below, flip above if bottom clips
        let top = r.bottom + 6;
        if (top + pH > vh - GAP) top = Math.max(GAP, r.top - pH - 6);

        panel.style.left = `${left}px`;
        panel.style.top  = `${top}px`;
    }

    // ── Host listeners ────────────────────────────────────────────────────────

    @HostListener('document:keydown.escape')
    onEscape(): void { this.close(); }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (event.target instanceof Node && !this.elRef.nativeElement.contains(event.target)) {
            this.close();
        }
    }

    trackByValue(_: number, opt: JiraFilterOption): string { return opt.value; }

    private emit(values: string[]): void {
        this._selected.set(values);
        this.onChange(values);
        this.selectedChange.emit(values);
        this.selected = values;
    }
}