import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ApiMetaColumn }    from './base-tree-api.service';
import { TreeTableItem }    from './tree-table-builder.service';

export type ImportError = 'emptyFile' | 'noValidRows' | 'parseError' | 'readError';
export interface ImportSuccess { items: Record<string, unknown>[]; error?: never; }
export interface ImportFailure { items?: never; error: ImportError; }

// ── Flat row shape used during export ─────────────────────────────────────────
interface FlatRow {
    _level:  number;
    _label:  string;
    _module: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class GenericTreeExcelService {

    private readonly t = inject(TranslocoService);

    // ── Export CSV ─────────────────────────────────────────────────────────────
    exportCsv(items: TreeTableItem[], metaData: ApiMetaColumn[]): void {
        const cols  = this.visibleCols(metaData);
        const flat  = this.flatten(items);

        const headers = ['Level', 'Label', 'Module', ...cols.map(c => c.name)];
        const rows = flat.map(row => [
            String(row._level),
            row._label,
            row._module,
            ...cols.map(c => this.cell(row[c.secondary_code])),
        ]);

        this.downloadCsv([headers, ...rows], `tree-export_${this.stamp()}.csv`);
    }

    // ── Export PDF ─────────────────────────────────────────────────────────────
    exportPdf(items: TreeTableItem[], metaData: ApiMetaColumn[], title: string): void {
        const isAr = this.isAr();
        const dir  = isAr ? 'rtl' : 'ltr';
        const cols = this.visibleCols(metaData);
        const flat = this.flatten(items);

        const levelLabel  = isAr ? 'المستوى' : 'Level';
        const labelLabel  = isAr ? 'الاسم'   : 'Label';
        const moduleLabel = isAr ? 'الوحدة'  : 'Module';

        const heads = [levelLabel, labelLabel, moduleLabel, ...cols.map(c => c.name)];
        const rows  = flat.map(row => [
            String(row._level),
            row._label,
            row._module,
            ...cols.map(c => this.cell(row[c.secondary_code])),
        ]);

        const th = heads.map(h =>
            `<th style="background:#1e40af;color:#fff;padding:8px 12px;text-align:${isAr ? 'right' : 'left'};font-weight:600;font-size:13px;">${h}</th>`
        ).join('');

        const tb = rows.map((row, i) => {
            const bg    = i % 2 === 0 ? '#f8fafc' : '#fff';
            // Indent entity/child rows visually
            const cells = row.map((c, ci) => {
                const indent = ci === 1
                    ? `padding-inline-start:${(Number(row[0]) - 1) * 16 + 12}px;`
                    : '';
                return `<td style="${indent}padding:7px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${c}</td>`;
            }).join('');
            return `<tr style="background:${bg}">${cells}</tr>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html dir="${dir}"><head><meta charset="UTF-8"/><title>${title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;padding:32px;color:#1e293b;direction:${dir}}
h1{font-size:22px;font-weight:700;margin-bottom:4px;color:#1e40af}
p.sub{font-size:12px;color:#64748b;margin-bottom:24px}
table{width:100%;border-collapse:collapse}
@media print{body{padding:16px}@page{margin:1.5cm;size:A4 landscape}}
</style></head><body>
<h1>${title}</h1>
<p class="sub">${isAr ? 'تاريخ التصدير' : 'Exported on'}: ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</p>
<table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;

        const blob   = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const url    = URL.createObjectURL(blob);
        const iframe = Object.assign(document.createElement('iframe'), {
            src:   url,
            style: 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none',
        });
        iframe.onload = () => {
            try { iframe.contentWindow?.print(); }
            finally { setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000); }
        };
        document.body.appendChild(iframe);
    }

    // ── Download import template ───────────────────────────────────────────────
    async downloadTemplate(metaData: ApiMetaColumn[], visibleFields?: string[]): Promise<void> {
        const XLSX    = await import('xlsx');
        const isAr    = this.isAr();
        const allCols = this.visibleCols(metaData);
        const cols    = visibleFields?.length
            ? allCols.filter(c => visibleFields.includes(c.secondary_code))
            : allCols;

        const fixedHeaders  = isAr
            ? ['المستوى', 'الاسم', 'الوحدة']
            : ['Level',   'Label', 'Module'];
        const fixedExamples = ['1', isAr ? 'مثال: اسم' : 'e.g. Label', isAr ? 'مثال: وحدة' : 'e.g. Module'];

        const headers = [...fixedHeaders, ...cols.map(c => c.name)];
        const example = [
            ...fixedExamples,
            ...cols.map(c => {
                if (c.enum) return '';
                if (c.type === 'DATE')   return isAr ? 'مثال: 2026-01-01' : 'e.g. 2026-01-01';
                if (c.type === 'NUMBER') return isAr ? 'مثال: 123' : 'e.g. 123';
                return isAr ? `مثال: ${c.name}` : `e.g. ${c.name}`;
            }),
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, example]);
        ws['!cols'] = headers.map(h => ({ wch: Math.max(18, h.length + 4) }));

        // Enum validations for data columns (skip fixed columns)
        const validations: unknown[] = [];
        cols.forEach((c, i) => {
            if (!c.enum?.length) return;
            const col = this.colLetter(i + 3); // offset by 3 fixed cols
            validations.push({
                sqref: `${col}2:${col}1000`, type: 'list',
                formula1: `"${(c.enum as unknown[]).join(',')}"`, showDropDown: false,
                showErrorMessage: true,
                errorTitle: isAr ? 'قيمة غير صحيحة' : 'Invalid value',
                error: isAr ? `اختر من: ${(c.enum as unknown[]).join(', ')}` : `Choose from: ${(c.enum as unknown[]).join(', ')}`,
            });
        });
        if (validations.length) (ws as Record<string, unknown>)['!dataValidations'] = validations;

        XLSX.utils.book_append_sheet(wb, ws, isAr ? 'البيانات' : 'Data');
        const buf  = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        this.downloadBlob(blob, 'tree-template.xlsx');
    }

    // ── Import CSV (flat rows → tree items) ───────────────────────────────────
    importFromCsv(file: File, metaData: ApiMetaColumn[]): Promise<ImportSuccess | ImportFailure> {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload  = e => {
                try { resolve(this.rowsToItems(this.parseCsv(e.target!.result as string), metaData)); }
                catch { resolve({ error: 'parseError' }); }
            };
            reader.onerror = () => resolve({ error: 'readError' });
            reader.readAsText(file, 'UTF-8');
        });
    }

    // ── Import Excel ───────────────────────────────────────────────────────────
    async importFromExcel(file: File, metaData: ApiMetaColumn[]): Promise<ImportSuccess | ImportFailure> {
        try {
            const XLSX = await import('xlsx');
            const wb   = XLSX.read(await file.arrayBuffer(), { type: 'array' });
            const ws   = wb.Sheets[wb.SheetNames[0]];
            if (!ws) return { error: 'emptyFile' };
            const csv = XLSX.utils.sheet_to_csv(ws, { FS: ',', blankrows: false });
            if (!csv.trim()) return { error: 'emptyFile' };
            return this.rowsToItems(this.parseCsv(csv), metaData);
        } catch {
            return { error: 'parseError' };
        }
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Flatten a TreeTableItem[] tree into a 1-D array of rows.
     * Each row includes _level, _label, _module + all data fields.
     * Children are inserted immediately after their parent row (DFS).
     */
    private flatten(items: TreeTableItem[], rows: FlatRow[] = []): FlatRow[] {
        for (const item of items) {
            rows.push({
                _level:  item.level,
                _label:  item.label,
                _module: item.module ?? '',
                ...item.data,
            });
            if (item.children?.data.length) {
                this.flatten(item.children.data, rows);
            }
        }
        return rows;
    }

    private visibleCols(metaData: ApiMetaColumn[]): ApiMetaColumn[] {
        return metaData
            .filter(m => m.is_public > 0)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    private rowsToItems(
        rows:     string[][],
        metaData: ApiMetaColumn[],
    ): ImportSuccess | ImportFailure {
        if (rows.length < 2) return { error: 'emptyFile' };

        const [headerRow, ...dataRows] = rows;
        const cols = this.visibleCols(metaData);

        // Map header label → secondary_code
        const labelToCode = new Map<string, string>();
        cols.forEach(c => {
            labelToCode.set(c.name.trim(),            c.secondary_code);
            labelToCode.set(c.secondary_code.trim(),  c.secondary_code);
        });

        const enumSets = new Map<string, Set<string>>();
        cols.forEach(c => {
            if (c.enum?.length) enumSets.set(c.secondary_code, new Set((c.enum as unknown[]).map(String)));
        });

        const items = dataRows.map(values => {
            const item: Record<string, unknown> = {};
            let hasValue = false;

            headerRow.forEach((h, i) => {
                const trimmed = h.trim();
                // Pass through the fixed structural columns as-is
                if (['Level', 'Label', 'Module', 'المستوى', 'الاسم', 'الوحدة'].includes(trimmed)) {
                    item[trimmed] = (values[i] ?? '').trim();
                    return;
                }
                const code = labelToCode.get(trimmed);
                if (!code) return;
                const raw     = (values[i] ?? '').trim();
                const enumSet = enumSets.get(code);
                item[code]    = enumSet ? (enumSet.has(raw) ? raw : [...enumSet][0] ?? raw) : raw;
                if (raw) hasValue = true;
            });

            return hasValue ? item : null;
        }).filter((i): i is Record<string, unknown> => i !== null);

        return items.length ? { items } : { error: 'noValidRows' };
    }

    private parseCsv(text: string): string[][] {
        return text.split(/\r?\n/).filter(l => l.trim()).map(line => {
            const cols: string[] = [];
            let cur = '', inQ = false;
            for (const ch of line) {
                if (ch === '"') inQ = !inQ;
                else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
                else cur += ch;
            }
            cols.push(cur.trim());
            return cols;
        });
    }

    private downloadCsv(rows: string[][], name: string): void {
        const BOM = '\uFEFF';
        const csv = BOM + rows.map(row =>
            row.map(c => {
                const s = String(c ?? '');
                return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
            }).join(',')
        ).join('\r\n');
        this.downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), name);
    }

    private downloadBlob(blob: Blob, name: string): void {
        const url = URL.createObjectURL(blob);
        const a   = Object.assign(document.createElement('a'), { href: url, download: name, style: 'display:none' });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    private colLetter(i: number): string {
        let l = '', n = i;
        while (n >= 0) { l = String.fromCharCode((n % 26) + 65) + l; n = Math.floor(n / 26) - 1; }
        return l;
    }

    private cell(v: unknown): string { return v == null ? '' : String(v); }
    private isAr(): boolean  { return this.t.getActiveLang() === 'ar'; }
    private stamp(): string  { return new Date().toISOString().slice(0, 10); }
}