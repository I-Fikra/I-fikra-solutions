import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';
import { TranslocoModule } from '@jsverse/transloco';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

import { RawMetaColumn } from '@/app/foundation/shared/services/table-builder.service';
import { UserRecord } from '../../../domain/entities/user.entity';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogShellComponent,
    TranslocoModule,
    SelectModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './user-details.html',
  styleUrls: ['./user-details.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() userSaved = new EventEmitter<UserRecord>();

  @Input() set userData(val: UserRecord | null) {
    if (val) {
      this.user.set(val);
      this.editableUser.set({ ...val });
    }
  }

  @Input() set apiUser(val: UserRecord | null) {
    if (val) {
      this.user.set(val);
      this.editableUser.set({ ...val });
    }
  }

  @Input() set metaData(val: RawMetaColumn[]) {
    if (val?.length) this._meta.set(val);
  }

  @Input() startInEditMode = false;

  readonly user = signal<UserRecord>({});
  readonly editableUser = signal<UserRecord>({});
  readonly saving = signal(false);
  readonly isEditMode = signal(false);
  readonly languageDir = signal<'rtl' | 'ltr'>('ltr');

  private readonly _meta = signal<RawMetaColumn[]>([]);
  private readonly cdr = inject(ChangeDetectorRef);
  private dirObserver?: MutationObserver;

  private readonly iconMap: Record<string, string> = {
    name: 'pi pi-user',
    email: 'pi pi-envelope',
    phone: 'pi pi-phone',
    role: 'pi pi-shield',
    status: 'pi pi-info-circle',
    username: 'pi pi-at'
  };

  readonly detailRows = computed(() => {
    const u = this.user();
    const meta = this._meta();

    if (meta.length) {
      return meta
        .filter((m) => m.is_public !== -1)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((m) => ({
          label: m.name,
          value: u[m.secondary_code] ?? '—',
          icon: m.icon ?? 'pi pi-info-circle',
          field: m.secondary_code
        }));
    }

    return Object.entries(u)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        value: value ?? '—',
        icon: this.iconMap[key] ?? 'pi pi-info-circle',
        field: key
      }));
  });

  readonly editFields = computed(() => {
    const meta = this._meta();

    if (meta.length) {
      return meta
        .filter((m) => m.is_public !== -1 && m.secondary_code !== 'id')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((m) => ({
          id: `user_${m.secondary_code}`,
          label: m.name,
          icon: m.icon ?? 'pi pi-pencil',
          key: m.secondary_code,
          type:
            m.secondary_code === 'email'
              ? 'email'
              : m.secondary_code === 'phone'
                ? 'tel'
                : 'text',
          isEnum: !!m.enum?.length,
          options: ((m.enum ?? []) as string[]).map((v: string) => ({
            label: v,
            value: v
          }))
        }));
    }

    const u = this.user();
    return Object.keys(u)
      .filter((key) => key !== 'id')
      .map((key) => ({
        id: `user_${key}`,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        icon: this.iconMap[key] ?? 'pi pi-pencil',
        key,
        type: key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text',
        isEnum: false,
        options: []
      }));
  });

  readonly statusOptions = computed(() => {
    const statusMeta = this._meta().find((m) => m.secondary_code === 'status');
    return ((statusMeta?.enum ?? []) as string[]).map((v: string) => ({
      label: v,
      value: v
    }));
  });

  readonly displayName = computed(() => {
    const u = this.user();
    const meta = this._meta();

    if (meta.length) {
      const first = meta
        .filter((m) => m.is_public !== -1 && m.secondary_code !== 'id')
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
      return first ? (u[first.secondary_code] ?? '') : '';
    }

    return u['name'] ?? u['username'] ?? Object.values(u)[0] ?? 'User Details';
  });

  ngOnInit(): void {
    this.syncDir();
    if (typeof document !== 'undefined') {
      this.dirObserver = new MutationObserver(() => this.syncDir());
      this.dirObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dir']
      });
    }
  }

  ngOnDestroy(): void {
    this.dirObserver?.disconnect();
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  onVisibleChange(v: boolean): void {
    this.visible = v;
    this.visibleChange.emit(v);
    if (!v) {
      this.isEditMode.set(false);
      this.editableUser.set({ ...this.user() });
      if (typeof document !== 'undefined') {
        document.body.classList.remove('modal-open');
      }
    }
  }

  onDialogShow(): void {
    this.isEditMode.set(this.startInEditMode);
    this.editableUser.set({ ...this.user() });
    if (typeof document !== 'undefined') {
      document.body.classList.add('modal-open');
    }
    this.cdr.detectChanges();
  }

  openEditMode(): void {
    this.editableUser.set({ ...this.user() });
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editableUser.set({ ...this.user() });
  }

  saveUser(): void {
    const updated = { ...this.editableUser() };
    this.user.set(updated);
    this.userSaved.emit(updated);
    this.isEditMode.set(false);
  }

  private syncDir(): void {
    if (typeof document === 'undefined') return;
    const dir = document.documentElement.getAttribute('dir');
    this.languageDir.set(dir === 'rtl' ? 'rtl' : 'ltr');
  }
}
