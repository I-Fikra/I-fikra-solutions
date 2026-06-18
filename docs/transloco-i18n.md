## نظام الترجمة (Transloco i18n)
> كل نص مرئي للمستخدم **لازم** يمر بالـ Transloco. ممنوع hardcode أي string مباشرة في الـ HTML أو الـ TypeScript.

---

### كيف يشتغل الـ Loader

**File:** `src/app/core/transloco-loader.ts`

الـ `TranslocoHttpLoader` بيحمّل ملفات الترجمة من مجلد `/i18n/{lang}/` عند تغيير اللغة. كل feature عندها ملف JSON منفصل، والـ loader بيدمجهم كلهم في object واحد عن طريق `forkJoin` ثم `deepMerge`.

```
الطلبات عند تغيير اللغة لـ 'ar':
  GET /i18n/ar/layout.json
  GET /i18n/ar/shared.json
  GET /i18n/ar/permissions.json
  GET /i18n/ar/roles.json
  GET /i18n/ar/messages.json
  ... (كل الملفات بالـ forkJoin)
        ↓
  deepMerge() ← دمج كل الـ objects في object واحد
        ↓
  Transloco يحفظه ويحدث الـ UI تلقائياً
```

**قاعدة مهمة:** كل top-level key في كل ملف **لازم تكون unique** عبر كل الملفات — لأن الـ deepMerge بيكتب فوق الـ keys المتكررة.

```typescript
// transloco-loader.ts — الفكرة المختصرة
getTranslation(lang: string) {
    return forkJoin({
        layout:      this.load(lang, 'layout'),
        shared:      this.load(lang, 'shared'),
        permissions: this.load(lang, 'permissions'),
        roles:       this.load(lang, 'roles'),
        // ... باقي الملفات
    }).pipe(
        map(res => {
            const merged: any = {};
            // كل ملف بيتدمج في merged —
            // مفيش wrapping إضافي، كل key بتبقى في مكانها
            Object.values(res).forEach(fileContent =>
                this.deepMerge(merged, fileContent)
            );
            return merged;
        })
    );
}
```

---

### بنية مجلد الترجمة

```
public/
└── i18n/
    ├── en/
    │   ├── layout.json
    │   ├── shared.json
    │   ├── permissions.json    ← ملف لكل feature
    │   ├── roles.json
    │   ├── messages.json
    │   └── ...
    └── ar/
        ├── layout.json
        ├── shared.json
        ├── permissions.json    ← نفس الـ keys، قيم عربية
        ├── roles.json
        ├── messages.json
        └── ...
```

**لما تضيف feature جديدة:**
1. اعمل `feature-name.json` في كلا المجلدين (`en/` و `ar/`)
2. أضف اسم الملف في الـ `forkJoin` داخل `transloco-loader.ts`
3. تأكد إن الـ top-level keys مش متكررة في ملف تاني

---

### بنية ملف الترجمة — مثال `permissions.json`

الملف بيتقسم لأقسام منطقية، كل قسم بـ namespace prefix مختلف:

```json
{
  "permissions": {
    "title": "إدارة الصلاحيات",
    "search": "ابحث في الصلاحيات...",
    "entityName": "اسم الكيان",
    "category": "التصنيف",
    "status": "الحالة",
    "permissionName": "اسم الصلاحية",
    "actionType": "نوع الإجراء",
    "assignedRoles": "الأدوار المعينة",
    "rolesCount": "{{count}} أدوار",
    "editRoles": "تعديل الأدوار: ",
    "manage": "إدارة: ",
    "bulkEdit": "تعديل جماعي للأدوار",
    "assignRolesToPermission": "تعيين أدوار لهذه الصلاحية:",
    "assignRolesToEntity": "تعيين أدوار لجميع الصلاحيات الفرعية:",
    "partialNote": "جزئي يعني أن الدور معين لبعض — وليس كل — الصلاحيات المحددة.",
    "entityNote": "تحديد دور يعينه لجميع الصلاحيات الفرعية؛ إلغاء التحديد يزيله من الجميع.",
    "filters": {
      "module": "الوحدة",
      "entityStatus": "حالة الكيان",
      "permissionStatus": "حالة الصلاحية",
      "permission": "الصلاحية"
    },
    "cardsView": "عرض البطاقات",
    "tableView": "عرض الجدول"
  },

  "permissionStatus": {
    "Active": "نشط",
    "Inactive": "غير نشط",
    "Pending": "قيد الانتظار"
  },

  "permActions": {
    "View": "عرض",
    "Create": "إنشاء",
    "Update": "تحديث",
    "Delete": "حذف",
    "Export": "تصدير"
  },

  "modules": {
    "usersModule": "وحدة المستخدمين",
    "systemModule": "وحدة النظام"
  },

  "entities": {
    "userManagement": "إدارة المستخدمين",
    "roleManagement": "إدارة الأدوار"
  },

  "perms": {
    "viewUsers": "عرض المستخدمين",
    "createUser": "إنشاء مستخدم",
    "editUser": "تعديل مستخدم"
  },

  "permissionMessages": {
    "saved": "تم الحفظ",
    "done": "تم",
    "rolesUpdatedCount": "تم تحديث الأدوار لـ {{count}} صلاحية.",
    "noSelection": "لا يوجد تحديد",
    "selectFirst": "حدد الصلاحيات أولاً.",
    "exported": "تم التصدير",
    "rowsExported": "تم تصدير {{count}} صف."
  }
}
```

---

### كيف تُستخدم الـ Keys في الكود

#### في الـ HTML — pipe مباشر

```html
<!-- Key بسيط -->
<h1>{{ 'permissions.title' | transloco }}</h1>

<!-- Key بداخل namespace متداخل -->
<label>{{ 'permissions.filters.module' | transloco }}</label>

<!-- Key مع interpolation (متغيرات) -->
<span>{{ 'permissions.rolesCount' | transloco: { count: roleCount } }}</span>

<!-- في الـ inputs مباشرة -->
<app-shared-toolbar
  [title]="'permissions.title' | transloco"
  [searchPlaceholder]="'permissions.search' | transloco"
/>
```

#### في الـ TypeScript — عبر `TranslocoService`

```typescript
private readonly t = inject(TranslocoService);

// ترجمة مباشرة
const label = this.t.translate('permissions.title');

// ترجمة مع interpolation
const msg = this.t.translate('permissionMessages.rolesUpdatedCount', { count: 5 });
// → "تم تحديث الأدوار لـ 5 صلاحية."

// Fallback لو الترجمة مش موجودة
const header = this.t.translate('permissions.entityName') || 'Entity Name';
```

#### Pattern خاص — ترجمة الـ Enum Values

لما عندك قيم enum زي `Active | Inactive | Pending` أو `View | Create | Update`:

```typescript
// في الـ JSON — الـ key هو القيمة الإنجليزية نفسها
"permissionStatus": {
  "Active":  "نشط",
  "Inactive": "غير نشط",
  "Pending":  "قيد الانتظار"
}

"permActions": {
  "View":   "عرض",
  "Create": "إنشاء",
  "Delete": "حذف"
}

// في الـ TypeScript — ابني الـ options بالـ translate
export function buildStatusOptions(t: TranslocoService): FilterOption[] {
  return (['Active', 'Inactive', 'Pending'] as const).map(s => ({
    label: t.translate(`permissionStatus.${s}`) || s,  // ← dynamic key
    value: s,   // ← القيمة الأصلية للفلتر (مش المترجمة)
  }));
}

// في الـ column — translatePrefix بيخلي الـ tree-table يترجم تلقائياً
{
  field:           'status',
  cellType:        'tag',
  translatePrefix: 'permissionStatus',  // ← بيعمل translate(`permissionStatus.${value}`)
  severityMap:     { Active: 'success', Pending: 'warn', Inactive: 'secondary' },
}
```

#### Pattern خاص — ترجمة الـ i18n keys القادمة من الـ API

لما الـ API بيبعت i18n keys بدل قيم مباشرة (زي `"modules.usersModule"` بدل `"وحدة المستخدمين"`):

```typescript
// في الـ service — بنترجم عند البناء
private buildEntity(e: RawEntity): PermissionNode {
  return {
    key:  e.key,
    data: {
      name:     this.tr(e.name),      // e.name = "entities.userManagement"
      category: this.tr(e.category),  // e.category = "categories.security"
      status:   e.status,             // status مش key، بيتترجم بالـ translatePrefix
    },
  };
}

private tr(key: string): string {
  return this.t.translate(key);
  // translate("entities.userManagement") → "إدارة المستخدمين"
}
```

---

### إعادة البناء عند تغيير اللغة

**مهم:** أي بيانات بنيتها بالترجمة (columns, filter options, processed data) لازم تُعاد بناؤها لما اللغة تتغير:

```typescript
ngOnInit(): void {
  // ① الـ getData$ بيستخدم langChanges$ داخلياً — بيرجع ترجمات جديدة تلقائياً
  this.dataService.getData$()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(({ modules, roles }) => {
      this.rawModules.set(modules);
      this.availableRoles.set(roles);
      this.buildColumnDefs(); // ← بيُعاد مع كل lang change
    });

  // ② لو عندك columns أو options مبنية محلياً (مش من الـ service)
  this.t.langChanges$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.buildColumnDefs(); // ← إعادة بناء الـ columns بالترجمة الجديدة
    });
}
```

> **لماذا؟** الـ `t.translate()` بيرجع الترجمة الحالية لحظة الاستدعاء — لو بنيت الـ columns مرة واحدة في `ngOnInit` ثم غيّر المستخدم اللغة، الـ headers بتفضل بالقديمة. `langChanges$` هو الـ trigger الصح.

---

### Checklist — إضافة ترجمات لـ feature جديدة

```
① اعمل الملف:
   public/i18n/en/feature-name.json
   public/i18n/ar/feature-name.json

② أضفه للـ loader:
   transloco-loader.ts → forkJoin → feature: this.load(lang, 'feature-name')

③ تأكد من uniqueness:
   كل top-level key في الملف الجديد مختلف عن باقي الملفات

④ بنية الـ keys:
   "feature.pageLabel"          ← عناوين الصفحة والـ toolbar
   "feature.filters.xxx"        ← فلاتر الـ toolbar
   "featureStatus.Active"       ← enum values (الـ key هو القيمة الإنجليزية)
   "featureActions.View"        ← action types
   "featureMessages.saved"      ← toast messages
   "entities.entityName"        ← i18n keys للداتا القادمة من الـ API
   "perms.permissionName"       ← i18n keys للـ permissions

⑤ في الـ TypeScript:
   → inject TranslocoService كـ private readonly t
   → ابن الـ options بـ buildXxxOptions(t) functions منفصلة
   → subscribe على langChanges$ وأعد بناء الـ columns والـ options

⑥ في الـ HTML:
   → كل string مرئي | transloco
   → interpolation: | transloco: { count: n }
   → مفيش hardcoded strings — صفر استثناءات
```
