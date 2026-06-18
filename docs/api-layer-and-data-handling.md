API Layer & Data Handling

> هذا الـ Part بيشرح إزاي الـ HTTP requests بتتعمل، وإزاي الداتا بتتحول من الـ server للـ component.

---

### 5.1 شكل الـ API Response (الـ Envelope)

**كل** response من الـ API بييجي في نفس الشكل الـ standard ده:

```json
{
  "success": 1,
  "message": { "type": "string", "texts": ["..."] },
  "result": [ ...array of items... ]
}
```

| حقل | النوع | المعنى |
|---|---|---|
| `success` | `number` | `1` = نجح / `0` = فشل / `> 1` = نجح مع تحذيرات |
| `message` | `{ type, texts[] }` | رسالة من الـ server (للـ errors أو الـ warnings) |
| `result` | `T[] أو T أو { key: T[] }` | الداتا الفعلية — شكلها بيختلف حسب الـ endpoint |

#### الـ `result` بييجي في 3 أشكال:

```typescript
// شكل 1 — flat array (الأكثر شيوعاً)
// { ..., result: Message[] }
// مثال: messages.json

// شكل 2 — nested object
// { ..., result: { VW_VSL_VESSEL: Ship[] } }
// مثال: vessels.json — لازم تـ override getItems()

// شكل 3 — single item
// { ..., result: Message }
// مثال: GET /api/messages/5
```

---

### 5.2 `ApiStatus` و Helper Functions

```typescript
// base-api.service.ts

export enum ApiStatus {
    Success = 1,   // كل حاجة تمام
    Warning = 2,   // اتعمل مع warnings (success > 1)
    Failed  = 0    // فشل (success < 1)
}

// استخدمهم للتحقق من الـ response:
isSuccess(res)  // success === 1
isWarning(res)  // success > 1
isFailed(res)   // success < 1
```

---

### 5.3 `BaseApiService<T>` — الـ Base الـ Abstract

**File:** `src/app/shared/services/base-api.service.ts`

كل service في المشروع **لازم** تـ extend من `BaseApiService`. هي بتتكلف بـ:
- فك الـ envelope تلقائياً
- رمي error لو `success < 1`
- تحويل كل item من raw → typed model

#### اللي لازم تعمله في كل service:

```typescript
@Injectable({ providedIn: 'root' })
export class MyService extends BaseApiService<MyEntity> {

    // ① URL الـ endpoint
    protected url = '/api/my-entities.json';

    // ② دالة تحويل كل raw object → typed model
    protected mapItem(raw: any): MyEntity {
        return {
            id:        raw.id,
            name:      raw.name,
            createdAt: raw.createdAt ? new Date(raw.createdAt) : null,
            // ... باقي الحقول
        };
    }

    // ③ اختياري: لو result مش array مباشرة
    // protected override getItems = (result: any) => result.MY_KEY;
}
```

#### الـ Methods اللي بتورثها تلقائياً:

| Method | الـ HTTP | الـ Return | الوصف |
|---|---|---|---|
| `getAll()` | GET `url` | `Observable<T[]>` | جيب كل العناصر |
| `getById(id)` | GET `url/:id` | `Observable<T>` | جيب عنصر واحد بالـ id |

---

### 5.4 الـ 3 حالات لـ `result` وإزاي تتعامل معاها

#### الحالة 1 — `result` هو الـ array مباشرة (الـ default)

```json
{ "success": 1, "message": {...}, "result": [ {...}, {...} ] }
```

```typescript
// مش محتاج تـ override أي حاجة
@Injectable({ providedIn: 'root' })
export class MessagesService extends BaseApiService<Message> {
    protected url = '/api/messages.json';

    protected mapItem(raw: any): Message {
        return {
            ...raw,
            sentAt:      raw.sentAt      ? new Date(raw.sentAt)      : null,
            processedAt: raw.processedAt ? new Date(raw.processedAt) : null,
            receivedAt:  raw.receivedAt  ? new Date(raw.receivedAt)  : null,
        };
    }
}
```

#### الحالة 2 — `result` هو object فيه nested array

```json
{ "success": 1, "message": {...}, "result": { "VW_VSL_VESSEL": [ {...} ] } }
```

```typescript
@Injectable({ providedIn: 'root' })
export class VesselsService extends BaseApiService<Ship> {
    protected url = '/api/vessels.json';

    // ← Override عشان تقوله فين الـ array جوه الـ result
    protected override getItems = (result: any) => result.VW_VSL_VESSEL;

    protected mapItem(raw: any): Ship {
        return { id: raw.ID, name: raw.NAME, flag: raw.FLAG };
    }
}
```

#### الحالة 3 — `getById` (single item)

```typescript
// تلقائي في BaseApiService — مش محتاج تكتب أي حاجة إضافية
this.svc.getById(5).subscribe(item => this.selectedItem = item);
```

---

### 5.5 Mock Service — التطوير بدون Backend

لو الـ backend مش جاهز، استخدم mock JSON file.

#### 1. حط الـ JSON file في `public/api/`

```
public/
└── api/
    └── messages.json   ← نفس شكل الـ envelope الحقيقية
```

الـ JSON لازم يبقى بنفس الشكل:
```json
{
  "success": 1,
  "message": { "type": "string", "texts": ["OK"] },
  "result": [
    { "id": 1, "refMsgId": "...", "status": "Error", ... }
  ]
}
```

#### 2. اعمل Mock Service بيـ extend من `BaseApiService`

```typescript
// services/messages-mock.service.ts
@Injectable({ providedIn: 'root' })
export class MessagesMockService extends BaseApiService<Message> {
    protected url = '/api/messages.json';  // ← بيجيب الـ JSON من public/

    protected mapItem(raw: any): Message {
        return {
            ...raw,
            sentAt:      raw.sentAt      ? new Date(raw.sentAt)      : null,
            processedAt: raw.processedAt ? new Date(raw.processedAt) : null,
            receivedAt:  raw.receivedAt  ? new Date(raw.receivedAt)  : null,
        };
    }

    // اختياري: alias بـ اسم أوضح للـ component
    getMessages(): Observable<Message[]> {
        return this.getAll();
    }
}
```

#### 3. استخدمه في الـ Component بنفس الطريقة

```typescript
private svc = inject(MessagesMockService);

// نفس الكود — الـ component مش بيعرف الفرق
this.svc.getAll().pipe(takeUntil(this.destroy$)).subscribe({
    next: data => { this.messages = data; },
    error: ()   => { this.messages = []; }
});
```

> ✅ لما الـ backend يتجهز، بدّل الـ `url` من الـ JSON path للـ API endpoint، أو اعمل `RealMessagesService` واستبدل الـ injection. الـ component مش بيتغير خالص.

---

### 5.6 إزاي الـ Component بيتعامل مع الداتا — Pattern الصح

الـ `messages.ts` هو الـ canonical example. اتبع الخطوات دي بالترتيب:

```typescript
private loadMessages(): void {
    this.loading = true;

    this.svc.getAll()
        .pipe(takeUntil(this.destroy$))   // ← cleanup تلقائي عند destroy
        .subscribe({
            next: (data) => {
                // ① خزّن الداتا الخام
                this.messages = data;

                // ② اعمل أي post-processing (stamp labels, translate, enrich)
                this.stampMsgTypeLabels();

                // ③ ابني الـ filter options من الداتا الفعلية
                this.buildDynamicFilterOptions();

                // ④ ابني الـ table columns (بعد الـ options عشان تحط filterOptions)
                this.initTableColumns();

                // ⑤ ابني الـ toolbar filters
                this.rebuildToolbarFilters();

                this.loading = false;
            },
            error: () => {
                // دايماً handle الـ error — reset الـ state وخلّي الـ UI يشتغل
                this.messages = [];
                this.initTableColumns();
                this.rebuildToolbarFilters();
                this.loading = false;
            }
        });
}
```

**الترتيب مهم:**
```
getAll()
  → stampLabels()        ← enrich الداتا أول
  → buildDynamicOptions()← استخرج الـ options من الداتا المُعدَّلة
  → initTableColumns()   ← ابني الـ columns بعدها (بتستخدم الـ options)
  → rebuildToolbarFilters()
```

---

### 5.7 Post-Processing الداتا بعد الـ API

#### `stampMsgTypeLabels()` — إضافة حقول مشتقة

لما الـ server بيبعت codes وأنت محتاج تعرضها كـ labels مترجمة، اعمل stamp بعد الـ load:

```typescript
private stampMsgTypeLabels(): void {
    this.messages = this.messages.map(m => ({
        ...m,
        msgTypeLabel: this.getMsgTypeLabel(m.msgType ?? ''),  // ← label مترجمة
        msgTypeCode:  m.msgType ?? ''                          // ← الـ code الأصلي
    }));
}

getMsgTypeLabel(code: string): string {
    const key = `msgTypes.${code}`;
    const translated = this.t.translate<string>(key);
    // لو مفيش ترجمة، ارجع الـ code نفسه
    return (translated && translated !== key) ? translated : code;
}
```

> بعد الـ stamp، بتستخدم `msgTypeLabel` في الـ table كـ display value و`msgTypeCode` للـ filtering.

#### `buildDynamicFilterOptions()` — Filter Options من الداتا

بدل ما تحط الـ options hardcoded، استخرجها من الداتا نفسها:

```typescript
private buildDynamicFilterOptions(): void {
    const uniqueValues = (field: keyof Message) => {
        const values = this.messages
            .map(m => m[field] != null ? String(m[field]) : '')
            .filter(v => v !== '')
            .sort();
        return [...new Set(values)].map(v => ({ label: v, value: v }));
    };

    this.filterOptions['sender']   = uniqueValues('sender');
    this.filterOptions['receiver'] = uniqueValues('receiver');
    this.filterOptions['port']     = uniqueValues('port');
}
```

> المزية: الـ filter options بتتحدث تلقائياً مع كل load — مفيش hardcoding.

#### `initFilterOptions()` — Options ثابتة (Static)

بعض الـ options بتكون fixed زي الـ statuses. حطها في `initFilterOptions()` وادعيها في `ngOnInit` **وفي كل lang change**:

```typescript
private initFilterOptions(): void {
    this.filterOptions['status'] = [
        { label: this.t.translate('status.error'),     value: 'خطأ'         },
        { label: this.t.translate('status.delivered'), value: 'تم التسليم'  },
        { label: this.t.translate('status.pending'),   value: 'قيد الانتظار'},
    ];
    this.statusOptions = this.filterOptions['status'];
}

ngOnInit(): void {
    this.initFilterOptions();   // ← قبل الـ load
    this.loadMessages();

    // ← إعادة بناء الـ options لما اللغة تتغير
    this.t.langChanges$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.initFilterOptions();
        this.loadMessages();      // ← reload عشان الـ stamps تتترجم من جديد
    });
}
```

---

### 5.8 ربط الـ filterOptions بالـ Table Columns

الـ `filterOptions` على الـ column بيوصّل الداتا لـ column header popover multiselect تلقائياً:

```typescript
private initTableColumns(): void {
    this.tableColumns = [
        {
            field: 'statusLabel',
            header: this.t.translate('message.status'),
            type: 'status',
            sortable: true,
            filterable: true,
            filterOptions: this.filterOptions['status'] ?? []   // ← هنا
        },
        {
            field: 'msgTypeCode',
            header: this.t.translate('message.type'),
            type: 'text',
            filterable: true,
            filterOptions: this.filterOptions['msgType'] ?? [],  // ← هنا
            subField: 'msgTypeLabel'  // ← secondary text أسفل الـ main value
        },
        {
            field: 'sender',
            header: this.t.translate('message.sender'),
            type: 'text',
            filterable: true,
            filterOptions: this.filterOptions['sender'] ?? []    // ← dynamic
        },
        {
            field: 'sentAt',
            header: this.t.translate('message.sent'),
            type: 'date',
            sortable: true,
            filterable: false  // ← الـ date مش فيها filter في الـ popover
        }
    ];
}
```

> **قاعدة:** ابني الـ columns **بعد** `buildDynamicFilterOptions()` عشان الـ `filterOptions` يبقى جاهز.

---

### 5.9 الـ `subField` — عرض حقلين في خلية واحدة

لما عندك حقل رئيسي وحقل ثانوي (مثلاً: الـ code فوق والـ label تحت):

```typescript
{
    field: 'msgTypeCode',      // ← السطر الأول (primary)
    subField: 'msgTypeLabel',  // ← السطر التاني (secondary, أصغر)
    ...
}
```

الـ `table.html` بيعرضهم بشكل:
```
PRC_PROCESS_MSG00603PS     ← field  (primary)
وصول السفينة الفعلي        ← subField (secondary, مـ-muted)
```

---

### 5.10 الـ Toolbar Filters vs. Column Filters

في المشروع في نوعين filter:

| النوع | المكان | الـ Config |
|---|---|---|
| **Toolbar filter** | فوق الـ table، زرار dropdown | `toolbarFilters[]` على الـ component |
| **Column header filter** | popup لما تضغط `⋮` على الـ column | `filterOptions[]` على كل `TableColumn` |

كلاهما بيشتغل على نفس الداتا بس من واجهتين مختلفتين. الـ `field` لازم يطابق نفس الحقل على الـ Message model.

```typescript
// Toolbar filters — بتظهر كـ chips فوق الـ table
private rebuildToolbarFilters(): void {
    this.toolbarFilters = [
        {
            field: 'statusLabel',              // ← نفس الـ field في الـ column
            label: this.t.translate('message.status'),
            options: this.filterOptions['status'] ?? [],
            matchMode: 'in'
        },
        {
            field: 'sender',
            label: this.t.translate('message.sender'),
            options: this.filterOptions['sender'] ?? [],
            matchMode: 'in'
        }
    ];
}
```

---

### 5.11 عمل Service جديد — Checklist

```
① هل الـ result array مباشرة؟
   → ✅ extend BaseApiService بدون override
   → ❌ override getItems = (result) => result.YOUR_KEY

② هل فيه date fields؟
   → حولهم في mapItem: raw.date ? new Date(raw.date) : null

③ هل فيه حقول محتاج تترجمها أو تشتقها؟
   → stamp بعد الـ load في stampXxxLabels()

④ هل الـ backend جاهز؟
   → نعم: حط الـ real URL في protected url
   → لا: اعمل mock JSON في public/api/ وـ Mock Service

⑤ هل الـ filter options ثابتة أو ديناميكية؟
   → ثابتة: initFilterOptions() + ادعيها في ngOnInit و langChanges$
   → ديناميكية: buildDynamicFilterOptions() بعد الـ load
```

---

### 5.12 Quick Reference — API Layer

| السيناريو | الحل |
|---|---|
| API response فيها `success: 0` | `BaseApiService` بيرمي Error تلقائياً — handle في `error:` callback |
| result هو array مباشرة | `extends BaseApiService<T>` بدون override |
| result هو `{ KEY: T[] }` | `protected override getItems = r => r.KEY` |
| Date string من الـ server | `raw.date ? new Date(raw.date) : null` في `mapItem` |
| عايز تعمل mock قبل الـ backend | JSON file في `public/api/` + Mock Service |
| filter options ثابتة | `initFilterOptions()` + `langChanges$` |
| filter options من الداتا | `buildDynamicFilterOptions()` بعد كل load |
| حقل مشتق (label من code) | `stampXxxLabels()` بعد الـ load |
| `subField` في الـ table | حقل ثانوي أسفل الـ primary في نفس الخلية |