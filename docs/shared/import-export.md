# Export / Import / Template — Implementation Guide

A step-by-step recipe for adding CSV export, PDF export, Excel template download, and CSV/Excel import to any module, based on the Users module pattern.

---

## Overview — what gets built

```
YourModule/
├── services/
│   └── your-excel.service.ts   ← all file logic lives here
├── your.component.ts           ← wires events, calls the service
└── your.component.html         ← hidden file input + table event bindings
```

The `app-table` component surfaces four toolbar buttons via outputs:
- `(onExport)` → CSV export
- `(onExportPdf)` → PDF export
- `(onImport)` → opens the hidden file input
- `(onDownloadTemplate)` → Excel template with dropdown validations

---

## Step 1 — define your columns

At the top of your Excel service, declare a `COLUMNS` constant that maps each field to its EN and AR header labels. This single source of truth is reused by export, import, and the template.

```typescript
// your-excel.service.ts

const COLUMNS = [
  { field: 'name',     en: 'Name',     ar: 'الاسم' },
  { field: 'status',   en: 'Status',   ar: 'الحالة' },
  { field: 'category', en: 'Category', ar: 'الفئة' },
  // add every field you want to include in export/import
] as const;
```

If a column has a fixed set of valid values (like status or role), also declare a `Set` for validation at import time:

```typescript
const VALID_STATUSES = new Set(['Active', 'Inactive']);
const VALID_CATEGORIES = new Set(['BULK', 'LIQUID', 'GENERAL']);
```

---

## Step 2 — create the Excel service

Create `your-excel.service.ts` and implement four public methods. Copy the Users implementation and swap `COLUMNS`, your model type, and the `mapRowToItem` logic.

```typescript
@Injectable({ providedIn: 'root' })
export class YourExcelService {
  private readonly t = inject(TranslocoService);

  exportItems(items: YourModel[]): void { ... }        // Step 3
  async downloadTemplate(): Promise<void> { ... }      // Step 4
  exportPdf(items: YourModel[]): void { ... }          // Step 5
  importFromFile(file: File): Promise<...> { ... }     // Step 6
  async importFromExcel(file: File): Promise<...> { ... } // Step 6
}
```

Keep the two private helpers from the Users service — they are fully generic and need no changes:

```typescript
private parseCsv(text: string): string[][]          // CSV parser, handles quoted commas
private triggerCsvDownload(rows, fileName): void     // builds Blob and fires <a> download
private isArabic(): boolean                          // lang === 'ar'
private dateStamp(): string                          // YYYY-MM-DD for filenames
```

---

## Step 3 — CSV export

Map your data array to rows in the same order as `COLUMNS`, then call `triggerCsvDownload`.

```typescript
exportItems(items: YourModel[]): void {
  const isAr    = this.isArabic();
  const headers = COLUMNS.map(c => isAr ? c.ar : c.en);
  const rows    = items.map(item => [
    item.name     ?? '',
    item.status   ?? '',
    item.category ?? '',
    // match COLUMNS order exactly
  ]);
  this.triggerCsvDownload([headers, ...rows], `items_export_${this.dateStamp()}.csv`);
}
```

---

## Step 4 — Excel template with dropdown validations

This generates a real `.xlsx` file (not CSV) with in-cell dropdown lists so users pick from valid values instead of typing freehand.

```typescript
async downloadTemplate(): Promise<void> {
  const XLSX   = await import('xlsx');   // dynamic import — only loaded when needed
  const isAr   = this.isArabic();
  const headers = COLUMNS.map(c => isAr ? c.ar : c.en);

  const exampleRow = [
    isAr ? 'مثال: اسم' : 'e.g. Name',
    '',   // status  — user picks from dropdown
    '',   // category — user picks from dropdown
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

  // column widths (optional but recommended)
  ws['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 16 }];

  // data validations — one entry per column that has fixed values
  // sqref = the cell range to apply to (skip row 1 which is the header)
  (ws as any)['!dataValidations'] = [
    {
      sqref:    'B2:B1000',                          // column B = status
      type:     'list',
      formula1: '"Active,Inactive"',                  // comma-separated, no spaces
      showDropDown: false,                            // false = show the arrow (counter-intuitive spec)
      showErrorMessage: true,
      errorTitle: isAr ? 'قيمة غير صحيحة' : 'Invalid value',
      error:     isAr ? 'اختر من القائمة' : 'Choose from the list',
    },
    {
      sqref:    'C2:C1000',                          // column C = category
      type:     'list',
      formula1: '"BULK,LIQUID,GENERAL"',
      showDropDown: false,
      showErrorMessage: true,
      errorTitle: isAr ? 'قيمة غير صحيحة' : 'Invalid value',
      error:     isAr ? 'اختر من القائمة' : 'Choose from the list',
    },
  ];

  XLSX.utils.book_append_sheet(wb, ws, isAr ? 'البيانات' : 'Data');

  // write and trigger download
  const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), {
    href: url, download: 'items_template.xlsx', style: 'display:none',
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

> **Note:** `showDropDown: false` is the correct value to *show* the dropdown arrow. The naming is inverted in the OOXML spec — `false` means "don't hide it".

---

## Step 5 — PDF export

Builds an HTML document with a styled table, injects it into a hidden `<iframe>`, and calls `iframe.contentWindow.print()`. This avoids popup blockers that fire when `window.open()` is called from a `p-menu` command (which is not a direct user gesture).

```typescript
exportPdf(items: YourModel[]): void {
  const isAr    = this.isArabic();
  const dir     = isAr ? 'rtl' : 'ltr';
  const title   = isAr ? 'قائمة العناصر' : 'Items List';
  const headers = COLUMNS.map(c => isAr ? c.ar : c.en);
  const rows    = items.map(item => [
    item.name     ?? '',
    item.status   ?? '',
    item.category ?? '',
  ]);

  // build header <th> and body <tr> HTML strings
  const theadCells = headers.map(h =>
    `<th style="background:#1e40af;color:#fff;padding:8px 12px;">${h}</th>`
  ).join('');

  const tbodyRows = rows.map((row, i) => {
    const bg    = i % 2 === 0 ? '#f8fafc' : '#fff';
    const cells = row.map(cell =>
      `<td style="padding:7px 12px;border-bottom:1px solid #e2e8f0;">${cell}</td>`
    ).join('');
    return `<tr style="background:${bg};">${cells}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html dir="${dir}"><head><meta charset="UTF-8"/>
<style>
  body { font-family: sans-serif; padding: 32px; direction: ${dir}; }
  table { width: 100%; border-collapse: collapse; }
  @media print { @page { size: A4 landscape; margin: 1.5cm; } }
</style></head>
<body>
  <h1 style="color:#1e40af">${title}</h1>
  <table><thead><tr>${theadCells}</tr></thead><tbody>${tbodyRows}</tbody></table>
  <script>window.onload=function(){window.print();}<\/script>
</body></html>`;

  const blob    = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  const iframe  = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
  iframe.src = blobUrl;
  iframe.onload = () => {
    try { iframe.contentWindow?.print(); }
    finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    }
  };
  document.body.appendChild(iframe);
}
```

---

## Step 6 — Import (CSV and Excel)

Both importers share the same `mapRowToItem` → `parseCsv` pipeline. The Excel importer converts the sheet to CSV first, then feeds it through the same parser.

```typescript
// ── CSV import ──────────────────────────────────────────────────────────────
importFromFile(file: File): Promise<ImportResult | ImportFailure> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const rows = this.parseCsv(e.target!.result as string);
        if (rows.length < 2) { resolve({ error: 'emptyFile' }); return; }
        const [header, ...data] = rows;
        const items = data.map(r => this.mapRowToItem(header, r)).filter(Boolean);
        if (!items.length) { resolve({ error: 'noValidRows' }); return; }
        resolve({ items });
      } catch { resolve({ error: 'parseError' }); }
    };
    reader.onerror = () => resolve({ error: 'readError' });
    reader.readAsText(file, 'UTF-8');
  });
}

// ── Excel import ─────────────────────────────────────────────────────────────
async importFromExcel(file: File): Promise<ImportResult | ImportFailure> {
  try {
    const XLSX     = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const ws       = workbook.Sheets[workbook.SheetNames[0]];
    if (!ws) return { error: 'emptyFile' };
    const csv  = XLSX.utils.sheet_to_csv(ws, { FS: ',', blankrows: false });
    const rows = this.parseCsv(csv);
    if (rows.length < 2) return { error: 'emptyFile' };
    const [header, ...data] = rows;
    const items = data.map(r => this.mapRowToItem(header, r)).filter(Boolean);
    if (!items.length) return { error: 'noValidRows' };
    return { items };
  } catch { return { error: 'parseError' }; }
}

// ── Row mapper — the only part you customise per module ──────────────────────
private mapRowToItem(headers: string[], values: string[]): Partial<YourModel> | null {
  // finds a column by its EN or AR header name
  const get = (en: string, ar: string): string => {
    const idx = headers.findIndex(h => h.trim() === en || h.trim() === ar);
    return idx !== -1 ? (values[idx] ?? '').trim() : '';
  };

  const name     = get('Name',     'الاسم');
  const status   = get('Status',   'الحالة');
  const category = get('Category', 'الفئة');

  if (!name) return null;   // required field guard

  return {
    name,
    status:   VALID_STATUSES.has(status)     ? status   : 'Active',
    category: VALID_CATEGORIES.has(category) ? category : 'GENERAL',
  };
}
```

---

## Step 7 — wire the component template

Add a hidden `<input type="file">` anywhere in the template (the Users module puts it just after `<p-toast />`):

```html
<input
  #importInput
  type="file"
  accept=".csv,.xlsx,.xls"
  style="display: none"
  (change)="onImportFileSelected($event)"
/>

<app-table
  ...
  (onExport)="onExport()"
  (onExportPdf)="onExportPdf()"
  (onImport)="onImport()"
  (onDownloadTemplate)="onDownloadTemplate()"
/>
```

---

## Step 8 — wire the component class

```typescript
@ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

// inject your service
private readonly excelService = inject(YourExcelService);

// ── toolbar button handlers ──────────────────────────────────────────────────
onExport():           void { this.excelService.exportItems(this.rawItems()); }
onExportPdf():        void { this.excelService.exportPdf(this.rawItems()); }
onDownloadTemplate(): void { this.excelService.downloadTemplate(); }

onImport(): void {
  // setTimeout pushes past the p-menu close animation —
  // without it the click lands on the menu overlay and gets swallowed
  setTimeout(() => {
    const input = this.importInput?.nativeElement;
    if (!input) return;
    input.value = '';   // reset so the same file can be re-selected
    input.click();
  }, 0);
}

async onImportFileSelected(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  (event.target as HTMLInputElement).value = '';  // reset immediately

  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  const isCsv   = /\.csv$/i.test(file.name);
  if (!isExcel && !isCsv) { this.toast('error', 'invalidFileType'); return; }

  this.importing.set(true);
  const result = isExcel
    ? await this.excelService.importFromExcel(file)
    : await this.excelService.importFromFile(file);
  this.importing.set(false);

  if (result.error) { this.toast('error', result.error); return; }

  // merge imported rows into your signal
  this.rawItems.update(list => [...list, ...result.items]);
  this.rebuildToolbarFilters(this.tableColumns());
  this.toast('success', `Imported ${result.items.length} rows`);
}
```

---

## Checklist

- [ ] `COLUMNS` constant defined — same field order in export, template, and `mapRowToItem`
- [ ] Validation Sets declared for every column with fixed values
- [ ] `mapRowToItem` returns `null` for rows missing required fields
- [ ] `importInput.value = ''` reset both in `onImport()` and at the top of `onImportFileSelected()` — otherwise the same file can't be re-imported
- [ ] `onImport()` wrapped in `setTimeout` to escape the `p-menu` click event
- [ ] `iframe.contentWindow.print()` used for PDF — not `window.open()` (blocked by popup blocker when called from a menu command)
- [ ] `xlsx` imported dynamically (`await import('xlsx')`) in `downloadTemplate` and `importFromExcel` so it doesn't inflate the initial bundle