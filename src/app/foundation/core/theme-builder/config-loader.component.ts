import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProjectConfigService } from '@/app/foundation/core/services/project-config.service';
import { ProjectConfigInput } from '@/app/foundation/core/models/project-config.model';

type ParseState = 'idle' | 'success' | 'error';

@Component({
  selector: 'app-config-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="config-loader-page">
      <div class="config-loader-card">

        <!-- Header -->
        <div class="config-loader-header">
          <i class="pi pi-upload config-loader-icon"></i>
          <h1 class="config-loader-title">Load Project Config</h1>
          <p class="config-loader-subtitle">
            Drop a <code>.yaml</code>, <code>.yml</code>, or <code>.json</code> file
            to build the project dynamically.
          </p>
        </div>

        <!-- Drop zone -->
        <label
          class="config-loader-dropzone"
          [class.dragover]="isDragging()"
          [class.has-success]="parseState() === 'success'"
          [class.has-error]="parseState() === 'error'"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave()"
          (drop)="onDrop($event)"
        >
          <input
            type="file"
            accept=".yaml,.yml,.json"
            class="config-loader-file-input"
            (change)="onFileChange($event)"
          />
          <i class="pi pi-file config-loader-dropzone-icon"></i>
          <span class="config-loader-dropzone-text">
            @if (fileName()) {
              {{ fileName() }}
            } @else {
              Click or drag &amp; drop your config file here
            }
          </span>
        </label>

        <!-- Feedback -->
        @if (parseState() === 'error') {
          <div class="config-loader-alert config-loader-alert--error">
            <i class="pi pi-times-circle"></i>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        @if (parseState() === 'success') {
          <div class="config-loader-alert config-loader-alert--success">
            <i class="pi pi-check-circle"></i>
            <span>Config loaded — redirecting…</span>
          </div>
        }

        <!-- Apply button -->
        <button
          class="config-loader-btn"
          [disabled]="!pendingConfig() || parseState() === 'success'"
          (click)="applyConfig()"
        >
          <i class="pi pi-play"></i>
          Apply &amp; Launch
        </button>

        <!-- Schema hint -->
        <details class="config-loader-schema">
          <summary>Expected schema</summary>
          <pre class="config-loader-schema-pre">{{ schemaHint }}</pre>
        </details>

      </div>
    </div>
  `,
  styles: [`
    .config-loader-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--surface-ground);
    }

    .config-loader-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 560px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }

    .config-loader-header { text-align: center; }
    .config-loader-icon { font-size: 2.5rem; color: var(--primary-color); }
    .config-loader-title { margin: 0.5rem 0 0.25rem; font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .config-loader-subtitle { margin: 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .config-loader-subtitle code { background: var(--surface-100); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; }

    .config-loader-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 2rem;
      border: 2px dashed var(--surface-border);
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--surface-50);
    }
    .config-loader-dropzone:hover,
    .config-loader-dropzone.dragover { border-color: var(--primary-color); background: var(--primary-50, #f0f4ff); }
    .config-loader-dropzone.has-success { border-color: var(--green-500); background: var(--green-50, #f0fff4); }
    .config-loader-dropzone.has-error   { border-color: var(--red-400); }

    .config-loader-file-input { display: none; }
    .config-loader-dropzone-icon { font-size: 2rem; color: var(--text-color-secondary); }
    .config-loader-dropzone-text { font-size: 0.875rem; color: var(--text-color-secondary); text-align: center; word-break: break-all; }

    .config-loader-alert {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.875rem;
    }
    .config-loader-alert--error   { background: var(--red-50, #fff0f0);   color: var(--red-700,   #b91c1c); border: 1px solid var(--red-200);   }
    .config-loader-alert--success { background: var(--green-50, #f0fff4); color: var(--green-700, #15803d); border: 1px solid var(--green-200); }

    .config-loader-btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: var(--primary-color);
      color: var(--primary-color-text, #fff);
      border: none; border-radius: 8px;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: opacity 0.2s;
    }
    .config-loader-btn:disabled { opacity: 0.45; cursor: not-allowed; }
    .config-loader-btn:not(:disabled):hover { opacity: 0.88; }

    .config-loader-schema { margin-top: 0.25rem; }
    .config-loader-schema summary { cursor: pointer; font-size: 0.8rem; color: var(--text-color-secondary); }
    .config-loader-schema-pre {
      margin-top: 0.5rem;
      padding: 1rem;
      background: var(--surface-100);
      border-radius: 6px;
      font-size: 0.75rem;
      line-height: 1.6;
      overflow-x: auto;
      white-space: pre;
      color: var(--text-color);
    }
  `]
})
export class ConfigLoaderComponent implements OnInit {
  private readonly configSvc = inject(ProjectConfigService);
  private readonly router = inject(Router);

  readonly isDragging = signal(false);
  readonly fileName = signal('');
  readonly parseState = signal<ParseState>('idle');
  readonly errorMessage = signal('');
  readonly pendingConfig = signal<ProjectConfigInput | null>(null);

  // ── Auto-load from localStorage (injected by DemoLauncherService) ──────────
  ngOnInit(): void {
    try {
      const raw = localStorage.getItem('demo_project_config');
      if (raw) {
        const cfg = JSON.parse(raw) as ProjectConfigInput;
        this.validate(cfg);
        localStorage.removeItem('demo_project_config'); // استهلكناه
        this.configSvc.applyInputConfig(cfg);
        this.router.navigate(['/dashboard']);
      }
    } catch {
      // لو الـ config فيه مشكلة نسيبه يفتح صفحة الـ loader عادي
    }
  }

  readonly schemaHint = `id: my-project
projectName: My Project
websiteTitle: My Project — Dashboard
primaryColor: "#3B82F6"
logoSvg: "<svg>…</svg>"   # optional
logoSvgDark: "<svg>…</svg>" # optional

domains:
  - id: org
    label: Organization
    modules:
      - id: communities
        label: Communities
        icon: pi pi-users
        apiUrl: https://api.example.com/org/communities
        idField: id
        actions:
          create: true
          edit: true
          view: true
          delete: true
`;

  // ── Drag & drop ────────────────────────────────────────────────────────────
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  private processFile(file: File): void {
    this.fileName.set(file.name);
    this.parseState.set('idle');
    this.errorMessage.set('');
    this.pendingConfig.set(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['yaml', 'yml', 'json'].includes(ext ?? '')) {
      this.parseState.set('error');
      this.errorMessage.set(`Unsupported file type ".${ext}". Use .yaml, .yml, or .json`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = ext === 'json'
          ? JSON.parse(text)
          : this.parseYaml(text);

        this.validate(parsed);
        this.pendingConfig.set(parsed as ProjectConfigInput);
        this.parseState.set('idle');
      } catch (err: any) {
        this.parseState.set('error');
        this.errorMessage.set(err?.message ?? 'Failed to parse file');
      }
    };
    reader.readAsText(file);
  }

  // ── Apply ──────────────────────────────────────────────────────────────────
  applyConfig(): void {
    const cfg = this.pendingConfig();
    if (!cfg) return;
    this.parseState.set('success');
    this.configSvc.applyInputConfig(cfg);
    setTimeout(() => this.router.navigate(['/dashboard']), 600);
  }

  // ── Minimal YAML parser (subset: mappings, sequences, scalars) ────────────
  private parseYaml(text: string): unknown {
    const lines = text.split('\n');
    return this.parseBlock(lines, 0, 0).value;
  }

  private parseBlock(
    lines: string[],
    startIndex: number,
    baseIndent: number
  ): { value: unknown; nextIndex: number } {
    const result: Record<string, unknown> = {};
    let i = startIndex;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trimEnd();

      // Skip blank lines and comments
      if (trimmed.trim() === '' || trimmed.trim().startsWith('#')) { i++; continue; }

      const indent = raw.length - raw.trimStart().length;

      // Dedent → return to parent
      if (indent < baseIndent) break;

      // Mapping entry: "key: value" or "key:"
      const mappingMatch = trimmed.match(/^(\s*)([\w-]+)\s*:\s*(.*)/);
      if (!mappingMatch) { i++; continue; }

      const key = mappingMatch[2];
      const rest = mappingMatch[3].trim();

      if (rest === '' || rest.startsWith('#')) {
        // Look ahead
        const nextI = i + 1;
        if (nextI < lines.length) {
          const nextLine = lines[nextI];
          const nextTrimmed = nextLine.trimStart();
          const nextIndent = nextLine.length - nextTrimmed.length;

          if (nextIndent > indent && nextTrimmed.startsWith('- ')) {
            // Sequence
            const { value, nextIndex } = this.parseSequence(lines, nextI, nextIndent);
            result[key] = value;
            i = nextIndex;
            continue;
          } else if (nextIndent > indent) {
            // Nested mapping
            const { value, nextIndex } = this.parseBlock(lines, nextI, nextIndent);
            result[key] = value;
            i = nextIndex;
            continue;
          }
        }
        result[key] = null;
        i++;
      } else {
        result[key] = this.parseScalar(rest);
        i++;
      }
    }

    return { value: result, nextIndex: i };
  }

  private parseSequence(
    lines: string[],
    startIndex: number,
    baseIndent: number
  ): { value: unknown[]; nextIndex: number } {
    const items: unknown[] = [];
    let i = startIndex;

    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trimEnd();
      if (trimmed.trim() === '' || trimmed.trim().startsWith('#')) { i++; continue; }

      const indent = raw.length - raw.trimStart().length;
      if (indent < baseIndent) break;

      const seqMatch = trimmed.match(/^(\s*)-\s*(.*)/);
      if (!seqMatch) break;

      const rest = seqMatch[2].trim();

      if (rest === '' || rest.startsWith('#')) {
        // Inline object follows on next lines
        const { value, nextIndex } = this.parseBlock(lines, i + 1, indent + 2);
        items.push(value);
        i = nextIndex;
      } else if (rest.includes(':')) {
        // Inline key: value on the same line as "-"
        const inlineKey = rest.match(/^([\w-]+)\s*:\s*(.*)/);
        if (inlineKey) {
          const obj: Record<string, unknown> = {};
          obj[inlineKey[1]] = this.parseScalar(inlineKey[2].trim());
          // Continue reading sibling keys at indent+2
          const { value: more, nextIndex } = this.parseBlock(lines, i + 1, indent + 2);
          items.push({ ...obj, ...(more as object) });
          i = nextIndex;
        } else {
          items.push(rest);
          i++;
        }
      } else {
        items.push(this.parseScalar(rest));
        i++;
      }
    }

    return { value: items, nextIndex: i };
  }

  private parseScalar(raw: string): unknown {
    const s = raw.trim();

    // Strip inline comment
    const noComment = s.replace(/\s+#.*$/, '');

    // Quoted string
    if ((noComment.startsWith('"') && noComment.endsWith('"')) ||
        (noComment.startsWith("'") && noComment.endsWith("'"))) {
      return noComment.slice(1, -1);
    }

    // Boolean
    if (noComment === 'true')  return true;
    if (noComment === 'false') return false;
    if (noComment === 'null' || noComment === '~') return null;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(noComment)) return Number(noComment);

    return noComment;
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  private validate(data: unknown): void {
    if (typeof data !== 'object' || data === null) throw new Error('Config must be a YAML/JSON object');
    const d = data as Record<string, unknown>;
    for (const field of ['id', 'projectName', 'websiteTitle', 'primaryColor']) {
      if (!d[field]) throw new Error(`Missing required field: "${field}"`);
    }
    if (!Array.isArray(d['domains'])) throw new Error('Config must have a "domains" array');
  }
}
