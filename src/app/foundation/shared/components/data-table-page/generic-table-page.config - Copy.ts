import { MenuItem } from 'primeng/api';

// ── Actions config ─────────────────────────────────────────────────────────────
export interface DataTableActions {
  create?: boolean;
  edit?: boolean;
  view?: boolean;
  delete?: boolean;
}

// ── Extra row action (روابط زي viewMessages, viewVisits) ──────────────────────
export interface ExtraRowAction {
  labelKey?: string; // مفتاح الترجمة (اختياري لو separator: true)
  icon?: string;
  routerLink?: any[];
  command?: (item: any) => void;
  separator?: boolean; // لو true → يضيف فاصل بدل action
}

// ── Main config ────────────────────────────────────────────────────────────────
export interface DataTablePageConfig {
  /** API endpoint الرئيسي */
  apiUrl: string;

  /** JSON fallback لو الـ API مش شغال */
  fallbackJsonAr?: string;
  fallbackJsonEn?: string;

  /** الـ field اللي بيتعرف بيه الـ record (id) */
  idField: string;

  /** اسم الـ entity للـ toast messages — هيتترجم من الـ API page title */
  entityName?: string;

  /** إيه اللي يظهر من CRUD actions */
  actions?: DataTableActions;

  /** Actions إضافية في الـ row menu */
  extraRowActions?: ExtraRowAction[];

  /** Keys تتخفى من الجدول والـ form */
  excludedKeys?: string[];

  /** Override type لـ column معين */
  columnTypeMap?: Record<string, 'text' | 'numeric' | 'date' | 'status'>;

  /** Hover sub-text لـ column — بيظهر تحت القيمة لما المستخدم يـ hover على الـ row.
   * مثال: { sender: 'senderConnector', receiver: 'receiverConnector' }
   */
  subFieldMap?: Record<string, string>;

  /** TableBuilderService config paths — defaults لو مش موجودة */
  itemsPath?: string;
  metaPath?: string;
  titlePath?: string;

  /** Reload لما تتغير اللغة */
  reloadOnLangChange?: boolean;

  /**
   * "See More / View Full Details" button in the view dialog.
   *
   * يمكن تمريره كـ:
   *  - string ثابت:       `'/services/permissions'`
   *  - array:             `['/modules', 'permissions']`
   *  - function تأخذ الـ item وترجع routerLink:
   *                       `(item) => ['/modules', item.id]`
   *
   * لو مش موجود (undefined) — الزرار مش بيظهر خالص.
   */
  seeMoreLink?: string | any[] | ((item: any) => string | any[]);
}

// ── Default values ─────────────────────────────────────────────────────────────
export const DEFAULT_CONFIG: Partial<DataTablePageConfig> = {
  idField: 'id',
  actions: { create: true, edit: true, view: true, delete: true },
  excludedKeys: [],
  columnTypeMap: {},
  subFieldMap: {},
  itemsPath: 'result.items',
  metaPath: 'result.meta_data',
  titlePath: 'result.paging.page_title',
  reloadOnLangChange: true
};
