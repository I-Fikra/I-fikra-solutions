import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { Toast } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButton } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TableComponent, TableColumn } from '@/app/foundation/shared/components/table/table';
import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';
import { DeleteButtonComponent } from '@/app/foundation/shared/components/delete-button/delete-button.component';
import { USER_ATTRIBUTES } from './user-attributes.data';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = ['string', 'number', 'boolean', 'datetime', 'date', 'text', 'json'].map(v => ({ label: v, value: v }));
const REFERENCE_FILTER_OPTIONS = [
  { label: 'Enum',   value: 'enum'   },
  { label: 'Lookup', value: 'lookup' },
];

export const DATA_TYPES = [
  { label: 'String',           value: 'string'   },
  { label: 'Number (Integer)', value: 'number'   },
  { label: 'Float',            value: 'float'    },
  { label: 'Boolean',          value: 'boolean'  },
  { label: 'Date',             value: 'date'     },
  { label: 'Date & Time',      value: 'datetime' },
  { label: 'Time',             value: 'time'     },
  { label: 'Text (Long)',      value: 'text'     },
  { label: 'JSON',             value: 'json'     },
  { label: 'Binary',           value: 'binary'   },
];

const UNIQUE_TYPE_OPTIONS    = [{ label: 'Primary Key', value: 'primary key' }, { label: 'Unique Key', value: 'unique key' }];
const REFERENCE_TYPE_OPTIONS = [{ label: 'Enum', value: 'enum' }, { label: 'Lookup', value: 'lookup' }, { label: 'Foreign Key', value: 'foreign key' }];
const ENTITY_TYPES = ['Users','Roles','Permission','Organization','Communities','Contacts','Vessels','Visits','Topics','Schemas','Messages','Processes','Conversations','Servers'].map(e => ({ label: e, value: e.toLowerCase() }));

const PI_ICONS: { label: string; value: string }[] = [
  { label: 'Address Book',         value: 'pi pi-address-book' },
  { label: 'At',                   value: 'pi pi-at' },
  { label: 'Barcode',              value: 'pi pi-barcode' },
  { label: 'Bell',                 value: 'pi pi-bell' },
  { label: 'Book',                 value: 'pi pi-book' },
  { label: 'Bookmark',             value: 'pi pi-bookmark' },
  { label: 'Briefcase',            value: 'pi pi-briefcase' },
  { label: 'Building',             value: 'pi pi-building' },
  { label: 'Building Columns',     value: 'pi pi-building-columns' },
  { label: 'Calendar',             value: 'pi pi-calendar' },
  { label: 'Calendar Clock',       value: 'pi pi-calendar-clock' },
  { label: 'Calendar Minus',       value: 'pi pi-calendar-minus' },
  { label: 'Calendar Plus',        value: 'pi pi-calendar-plus' },
  { label: 'Camera',               value: 'pi pi-camera' },
  { label: 'Chart Bar',            value: 'pi pi-chart-bar' },
  { label: 'Chart Line',           value: 'pi pi-chart-line' },
  { label: 'Chart Pie',            value: 'pi pi-chart-pie' },
  { label: 'Check Circle',         value: 'pi pi-check-circle' },
  { label: 'Clock',                value: 'pi pi-clock' },
  { label: 'Cloud',                value: 'pi pi-cloud' },
  { label: 'Code',                 value: 'pi pi-code' },
  { label: 'Cog',                  value: 'pi pi-cog' },
  { label: 'Comment',              value: 'pi pi-comment' },
  { label: 'Comments',             value: 'pi pi-comments' },
  { label: 'Crown',                value: 'pi pi-crown' },
  { label: 'Database',             value: 'pi pi-database' },
  { label: 'Desktop',              value: 'pi pi-desktop' },
  { label: 'Dollar',               value: 'pi pi-dollar' },
  { label: 'Envelope',             value: 'pi pi-envelope' },
  { label: 'Exclamation Circle',   value: 'pi pi-exclamation-circle' },
  { label: 'Exclamation Triangle', value: 'pi pi-exclamation-triangle' },
  { label: 'Eye',                  value: 'pi pi-eye' },
  { label: 'Eye Slash',            value: 'pi pi-eye-slash' },
  { label: 'File',                 value: 'pi pi-file' },
  { label: 'File Excel',           value: 'pi pi-file-excel' },
  { label: 'File PDF',             value: 'pi pi-file-pdf' },
  { label: 'File Word',            value: 'pi pi-file-word' },
  { label: 'Flag',                 value: 'pi pi-flag' },
  { label: 'Folder',               value: 'pi pi-folder' },
  { label: 'Folder Open',          value: 'pi pi-folder-open' },
  { label: 'Gauge',                value: 'pi pi-gauge' },
  { label: 'Globe',                value: 'pi pi-globe' },
  { label: 'Hammer',               value: 'pi pi-hammer' },
  { label: 'Hashtag',              value: 'pi pi-hashtag' },
  { label: 'Heart',                value: 'pi pi-heart' },
  { label: 'History',              value: 'pi pi-history' },
  { label: 'Home',                 value: 'pi pi-home' },
  { label: 'ID Card',              value: 'pi pi-id-card' },
  { label: 'Image',                value: 'pi pi-image' },
  { label: 'Images',               value: 'pi pi-images' },
  { label: 'Inbox',                value: 'pi pi-inbox' },
  { label: 'Info Circle',          value: 'pi pi-info-circle' },
  { label: 'Key',                  value: 'pi pi-key' },
  { label: 'Language',             value: 'pi pi-language' },
  { label: 'Lightbulb',            value: 'pi pi-lightbulb' },
  { label: 'Link',                 value: 'pi pi-link' },
  { label: 'LinkedIn',             value: 'pi pi-linkedin' },
  { label: 'List',                 value: 'pi pi-list' },
  { label: 'Lock',                 value: 'pi pi-lock' },
  { label: 'Lock Open',            value: 'pi pi-lock-open' },
  { label: 'Map Marker',           value: 'pi pi-map-marker' },
  { label: 'Microchip',            value: 'pi pi-microchip' },
  { label: 'Mobile',               value: 'pi pi-mobile' },
  { label: 'Moon',                 value: 'pi pi-moon' },
  { label: 'Palette',              value: 'pi pi-palette' },
  { label: 'Phone',                value: 'pi pi-phone' },
  { label: 'Print',                value: 'pi pi-print' },
  { label: 'QR Code',              value: 'pi pi-qrcode' },
  { label: 'Receipt',              value: 'pi pi-receipt' },
  { label: 'Search',               value: 'pi pi-search' },
  { label: 'Send',                 value: 'pi pi-send' },
  { label: 'Server',               value: 'pi pi-server' },
  { label: 'Share Alt',            value: 'pi pi-share-alt' },
  { label: 'Shield',               value: 'pi pi-shield' },
  { label: 'Sign In',              value: 'pi pi-sign-in' },
  { label: 'Sign Out',             value: 'pi pi-sign-out' },
  { label: 'Sitemap',              value: 'pi pi-sitemap' },
  { label: 'Sliders H',            value: 'pi pi-sliders-h' },
  { label: 'Sliders V',            value: 'pi pi-sliders-v' },
  { label: 'Star',                 value: 'pi pi-star' },
  { label: 'Sun',                  value: 'pi pi-sun' },
  { label: 'Table',                value: 'pi pi-table' },
  { label: 'Tag',                  value: 'pi pi-tag' },
  { label: 'Tags',                 value: 'pi pi-tags' },
  { label: 'Telegram',             value: 'pi pi-telegram' },
  { label: 'Ticket',               value: 'pi pi-ticket' },
  { label: 'Times Circle',         value: 'pi pi-times-circle' },
  { label: 'Trash',                value: 'pi pi-trash' },
  { label: 'Trophy',               value: 'pi pi-trophy' },
  { label: 'User',                 value: 'pi pi-user' },
  { label: 'User Edit',            value: 'pi pi-user-edit' },
  { label: 'User Minus',           value: 'pi pi-user-minus' },
  { label: 'User Plus',            value: 'pi pi-user-plus' },
  { label: 'Users',                value: 'pi pi-users' },
  { label: 'Verified',             value: 'pi pi-verified' },
  { label: 'Video',                value: 'pi pi-video' },
  { label: 'Wallet',               value: 'pi pi-wallet' },
  { label: 'Wave Pulse',           value: 'pi pi-wave-pulse' },
  { label: 'WhatsApp',             value: 'pi pi-whatsapp' },
  { label: 'WiFi',                 value: 'pi pi-wifi' },
  { label: 'Wrench',               value: 'pi pi-wrench' },
];

const RTL_LANGS = new Set(['ar', 'he', 'fa', 'ur']);
const LANG_LABELS: Record<string, string> = { en: 'English', ar: 'Arabic', fr: 'French', es: 'Spanish', de: 'German', tr: 'Turkish' };

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface EnumEntry {
  code: string;
  options: Record<string, string>;
}

interface AttributeFormModel {
  attrName: string;
  nameSingular: Record<string, string>;
  namePlural:   Record<string, string>;
  type: string;
  lengthMin: number | null;
  lengthMax: number | null;
  valueMin:  number | null;
  valueMax:  number | null;
  repeatMin: number | null;
  repeatMax: number | null;
  precisionBefore: number | null;
  precisionAfter:  number | null;
  occurrence: string;
  defaultValue: Record<string, string>;
  description:  Record<string, string>;
  icon: string;
  tags: string[];
  isPublic: boolean;
  isUnique: boolean;
  uniqueType: string;
  reference: string;
  enumEntries: EnumEntry[];
  refEntityType:    string;
  refAttributeName: string;
  refCondition:     string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function langRecord(langs: string[]): Record<string, string> {
  return Object.fromEntries(langs.map(l => [l, '']));
}

function validateSqlCondition(expr: string): string | null {
  const s = expr.trim();
  if (!s) return null;

  if (/\b(SELECT|FROM|WHERE|JOIN|UNION|INTERSECT|EXCEPT|HAVING|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET)\b/i.test(s))
    return 'Enter a WHERE condition only, not a full SQL statement (no SELECT, FROM, WHERE, JOIN, etc.).';

  if (/\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE|EXEC(?:UTE)?|GRANT|REVOKE)\b/i.test(s))
    return 'Dangerous SQL keyword detected (DROP, DELETE, INSERT, etc.).';

  if (s.includes(';'))
    return 'Semicolons are not allowed in a condition.';

  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth < 0) break; }
  }
  if (depth < 0) return 'Unmatched closing parenthesis.';
  if (depth > 0) return 'Unmatched opening parenthesis.';

  if (!/[=<>!]|\b(LIKE|IN|BETWEEN|IS|NOT|AND|OR)\b/i.test(s))
    return "Must contain a comparison operator (=, <>, !=, LIKE, IN, BETWEEN, IS NULL, …).";

  return null;
}

function parseRangeNum(str: string | null, part: 0 | 1): number | null {
  if (!str) return null;
  const seg = str.split(':')[part];
  if (!seg || seg === '—') return null;
  const n = Number(seg);
  return isNaN(n) ? null : n;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-attributes',
  imports: [
    CommonModule, FormsModule,
    TableComponent, DialogShellComponent, DeleteButtonComponent,
    SelectModule, InputTextModule, InputNumberModule,
    RadioButton, CheckboxModule, TextareaModule,
    DividerModule, ButtonModule, Chip, Toast, TagModule,
  ],
  templateUrl: './attributes.html',
  styleUrl: './attributes.scss',
  providers: [MessageService],
})
export class Attributes {
  private readonly messageService  = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  @ViewChild('deleteBtn') private deleteBtn!: DeleteButtonComponent;
  pendingDeleteItem: any = null;

  // ── Language helpers (exposed to template) ─────────────────────────────────

  get langs(): string[]    { return this.translocoService.getAvailableLangs() as string[]; }
  get primaryLang(): string { return this.langs[0] ?? 'en'; }

  langLabel(code: string): string { return LANG_LABELS[code] ?? code.toUpperCase(); }
  isRtl(code: string):    boolean { return RTL_LANGS.has(code); }

  // ── Table ──────────────────────────────────────────────────────────────────

  readonly columns: TableColumn[] = [
    { field: 'code',        header: 'Code',      type: 'text',    sortable: true, filterable: true, isPrimary: true, minWidth: '130px' },
    { field: 'name',        header: 'Name',      type: 'text',    sortable: true, filterable: true, minWidth: '160px' },
    { field: 'feature',     header: 'Feature',   type: 'text',    sortable: true, filterable: true, minWidth: '120px' },
    { field: 'type',        header: 'Type',      type: 'text',    sortable: true, filterable: true, filterOptions: TYPE_FILTER_OPTIONS, minWidth: '110px' },
    { field: 'isNullable',  header: 'Nullable',  type: 'boolean', sortable: true, filterable: true, minWidth: '100px' },
    { field: 'isUnique',    header: 'Unique',    type: 'boolean', sortable: true, filterable: true, minWidth: '90px'  },
    { field: 'isPublic',    header: 'Public',    type: 'boolean', sortable: true, filterable: true, minWidth: '90px'  },
    { field: 'icon',        header: 'Icon',      type: 'icon',    minWidth: '80px'  },
    { field: 'summary',     header: 'Summary',   type: 'text',    minWidth: '240px' },
    { field: 'length',      header: 'Length',    type: 'text',    minWidth: '90px'  },
    { field: 'value',       header: 'Value',     type: 'text',    minWidth: '90px'  },
    { field: 'repeat',      header: 'Repeat',    type: 'text',    minWidth: '90px'  },
    { field: 'reference',   header: 'Reference', type: 'text',    sortable: true, filterable: true, filterOptions: REFERENCE_FILTER_OPTIONS, minWidth: '110px' },
    { field: 'tagsDisplay', header: 'Tags',      type: 'text',    minWidth: '220px' },
  ];

  data = USER_ATTRIBUTES.map(attr => ({ ...attr, tagsDisplay: attr.tags.join(', ') }));

  readonly rowActions = (item: any): MenuItem[] => [
    { label: 'View Details', icon: 'pi pi-eye',    command: () => this.openView(item)      },
    { label: 'Edit',         icon: 'pi pi-pencil', command: () => this.openEdit(item)      },
    { label: 'Delete',       icon: 'pi pi-trash',  command: () => this.confirmDelete(item) },
  ];

  // ── Icon picker ────────────────────────────────────────────────────────────

  readonly piIcons = PI_ICONS;

  // ── Dialog constants ───────────────────────────────────────────────────────

  readonly dataTypes      = DATA_TYPES;
  readonly uniqueTypes    = UNIQUE_TYPE_OPTIONS;
  readonly referenceTypes = REFERENCE_TYPE_OPTIONS;
  readonly entityTypes    = ENTITY_TYPES;

  // ── View dialog ────────────────────────────────────────────────────────────

  viewDialogVisible = false;
  viewingItem: any  = null;

  openView(item: any): void {
    this.viewingItem       = item;
    this.viewDialogVisible = true;
  }

  // ── Create / Edit dialog ───────────────────────────────────────────────────

  dialogVisible             = false;
  dialogMode: 'create'|'edit' = 'create';
  editingIndex              = -1;
  submitted                 = false;
  newTag                    = '';
  newEnumCode               = '';
  newEnumOptions: Record<string, string> = {};

  form: AttributeFormModel = this.emptyForm();

  get dialogHeader(): string { return this.dialogMode === 'create' ? 'New Attribute' : 'Edit Attribute'; }
  get isFloat():       boolean { return this.form.type === 'float'; }
  get isEnum():        boolean { return this.form.reference === 'enum'; }
  get isLookupOrFk(): boolean { return this.form.reference === 'lookup' || this.form.reference === 'foreign key'; }

  get refConditionError(): string | null { return validateSqlCondition(this.form.refCondition); }

  get refAttributeOptions(): { label: string; value: string }[] {
    if (this.form.refEntityType === 'users') return USER_ATTRIBUTES.map(a => ({ label: a.name, value: a.code }));
    return ['id', 'code', 'name', 'createdAt', 'updatedAt'].map(v => ({ label: v, value: v }));
  }

  get attrNameError(): string | null {
    const v = this.form.attrName;
    if (!this.submitted && !v) return null;
    if (!v.trim()) return 'Attribute name is required.';
    if (/\s/.test(v))  return 'No spaces allowed — use camelCase or snake_case.';
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v)) return 'Only letters, numbers and underscores are allowed.';
    return null;
  }

  get isFormValid(): boolean {
    const v = this.form.attrName;
    return !!(
      v.trim() && !/\s/.test(v) && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(v) &&
      this.form.nameSingular[this.primaryLang]?.trim() &&
      this.form.type && this.form.occurrence &&
      !this.refConditionError
    );
  }

  openNew(): void {
    this.dialogMode   = 'create';
    this.editingIndex = -1;
    this.resetDialog();
    this.dialogVisible = true;
  }

  openEdit(item: any): void {
    this.dialogMode   = 'edit';
    this.editingIndex = this.data.indexOf(item);
    this.resetDialog();

    const langs = this.langs;
    const primary = this.primaryLang;

    const nameSingular  = langRecord(langs); nameSingular[primary]  = item.name    ?? '';
    const namePlural    = langRecord(langs);
    const defaultValue  = langRecord(langs);
    const description   = langRecord(langs); description[primary]   = item.summary ?? '';

    this.form = {
      attrName:        item.code        ?? '',
      nameSingular, namePlural,
      type:            item.type        ?? '',
      lengthMin:       parseRangeNum(item.length, 0),
      lengthMax:       parseRangeNum(item.length, 1),
      valueMin:        parseRangeNum(item.value,  0),
      valueMax:        parseRangeNum(item.value,  1),
      repeatMin:       parseRangeNum(item.repeat, 0),
      repeatMax:       parseRangeNum(item.repeat, 1),
      precisionBefore: null, precisionAfter: null,
      occurrence:      item.isNullable ? 'optional' : 'mandatory',
      defaultValue, description,
      icon:            item.icon        ?? '',
      tags:            [...(item.tags   ?? [])],
      isPublic:        item.isPublic    ?? false,
      isUnique:        item.isUnique    ?? false,
      uniqueType:      '',
      reference:       item.reference   ?? '',
      enumEntries: [], refEntityType: '', refAttributeName: '', refCondition: '',
    };
    this.dialogVisible = true;
  }

  saveAttribute(): void {
    this.submitted = true;
    if (!this.isFormValid) return;

    const f       = this.form;
    const primary = this.primaryLang;
    const feature = this.dialogMode === 'edit' ? (this.data[this.editingIndex]?.feature ?? '') : '';

    const row = {
      code:        f.attrName,
      name:        f.nameSingular[primary] ?? '',
      feature,
      type:        f.type,
      isNullable:  f.occurrence !== 'mandatory',
      isUnique:    f.isUnique,
      isPublic:    f.isPublic,
      icon:        f.icon,
      summary:     f.description[primary] ? f.description[primary].slice(0, 70) : null,
      length:      f.lengthMin  != null || f.lengthMax  != null ? `${f.lengthMin  ?? '—'}:${f.lengthMax  ?? '—'}` : null,
      value:       f.valueMin   != null || f.valueMax   != null ? `${f.valueMin   ?? '—'}:${f.valueMax   ?? '—'}` : null,
      repeat:      f.repeatMin  != null || f.repeatMax  != null ? `${f.repeatMin  ?? '—'}:${f.repeatMax  ?? '—'}` : null,
      reference:   f.reference || null,
      tags:        [...f.tags],
      tagsDisplay: f.tags.join(', '),
    };

    if (this.dialogMode === 'create') {
      this.data = [row, ...this.data];
      this.messageService.add({ severity: 'success', summary: 'Attribute Added',   detail: `"${f.attrName}" has been added successfully.`,   life: 4000 });
    } else {
      const updated = [...this.data];
      updated[this.editingIndex] = row;
      this.data = updated;
      this.messageService.add({ severity: 'success', summary: 'Attribute Updated', detail: `"${f.attrName}" has been updated successfully.`, life: 4000 });
    }
    this.dialogVisible = false;
  }

  cancelDialog(): void { this.dialogVisible = false; }

  // ── Delete ─────────────────────────────────────────────────────────────────

  confirmDelete(item: any): void {
    this.pendingDeleteItem = item;
    this.deleteBtn.open();
  }

  onDeleteConfirmed(): void {
    const item = this.pendingDeleteItem;
    if (!item) return;
    this.data = this.data.filter(d => d.code !== item.code);
    this.messageService.add({ severity: 'success', summary: 'Attribute Deleted', detail: `"${item.code}" has been removed.`, life: 4000 });
    this.pendingDeleteItem = null;
  }

  // ── Tag helpers ────────────────────────────────────────────────────────────

  addTag(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ',') return;
    event.preventDefault();
    this.pushTag(this.newTag.replace(/,/g, ''));
  }

  addTagClick(): void { this.pushTag(this.newTag); }

  removeTag(tag: string): void { this.form.tags = this.form.tags.filter(t => t !== tag); }

  private pushTag(raw: string): void {
    const tag = raw.trim().toLowerCase();
    if (tag && !this.form.tags.includes(tag)) this.form.tags = [...this.form.tags, tag];
    this.newTag = '';
  }

  // ── Enum helpers ───────────────────────────────────────────────────────────

  addEnumEntry(): void {
    const code = this.newEnumCode.trim().toUpperCase();
    if (!code) return;
    this.form.enumEntries = [...this.form.enumEntries, { code, options: { ...this.newEnumOptions } }];
    this.newEnumCode    = '';
    this.newEnumOptions = langRecord(this.langs);
  }

  removeEnumEntry(index: number): void {
    this.form.enumEntries = this.form.enumEntries.filter((_, i) => i !== index);
  }

  // ── Change handlers ────────────────────────────────────────────────────────

  onTypeChange(): void {
    if (!this.isFloat) { this.form.precisionBefore = null; this.form.precisionAfter = null; }
  }

  onUniqueChange(): void { if (!this.form.isUnique) this.form.uniqueType = ''; }

  onReferenceChange(): void {
    this.form.enumEntries = []; this.form.refEntityType = ''; this.form.refAttributeName = ''; this.form.refCondition = '';
    this.newEnumCode    = '';
    this.newEnumOptions = langRecord(this.langs);
  }

  onRefEntityChange(): void { this.form.refAttributeName = ''; }

  // ── Private ────────────────────────────────────────────────────────────────

  private resetDialog(): void {
    this.form           = this.emptyForm();
    this.submitted      = false;
    this.newTag         = '';
    this.newEnumCode    = '';
    this.newEnumOptions = langRecord(this.langs);
  }

  private emptyForm(): AttributeFormModel {
    const langs = this.langs;
    return {
      attrName: '',
      nameSingular:  langRecord(langs),
      namePlural:    langRecord(langs),
      type: '', lengthMin: null, lengthMax: null,
      valueMin: null, valueMax: null, repeatMin: null, repeatMax: null,
      precisionBefore: null, precisionAfter: null,
      occurrence: 'mandatory',
      defaultValue: langRecord(langs),
      description:  langRecord(langs),
      icon: '', tags: [],
      isPublic: false, isUnique: false, uniqueType: '',
      reference: '', enumEntries: [],
      refEntityType: '', refAttributeName: '', refCondition: '',
    };
  }
}
