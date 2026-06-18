# ⚡ Performance Guide

> تحسين الـ performance في المشروع — كل التقنيات مبنية على architecture المشروع الحالي.

---

## 1. Change Detection — `OnPush` على كل component

أكبر وأسهل تحسين ممكن تعمله.

```typescript
@Component({
  selector: 'app-roles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // ← أضف السطر ده
  ...
})
export class RolesPage { }
```

**ليه مهم؟** Angular بـ Default بيعمل check على كل component في كل event. بـ `OnPush` بيعمل check بس لما:
- الـ `@Input` يتغير (بالـ reference)
- signal داخل الـ component يتغير
- الـ component نفسه يشغّل event

**قاعدة:** لأن المشروع بيستخدم `signal()` — الـ `OnPush` بيشتغل تلقائياً صح معاهم.

---

## 2. Signals بدل Variables العادية — للـ UI State

```typescript
// ❌ Variable عادية — Angular مش بيعرف امتى تتغير بدقة
roles: Role[] = [];
loading = false;

// ✅ Signal — Angular يعرف بالظبط امتى يعمل re-render
roles   = signal<Role[]>([]);
loading = signal(false);
```

وفي الـ template:
```html
<!-- ✅ Signal تلقائياً tracked مع OnPush -->
[data]="roles()"
[loading]="loading()"
```

---

## 3. `trackBy` في الـ `@for` loops

```html
<!-- ❌ بدون track — Angular بيعمل destroy/recreate لكل DOM node -->
@for (item of items; track $index) { ... }

<!-- ✅ بالـ id الحقيقي — Angular بيعمل update بس على اللي اتغير -->
@for (item of roles(); track item.id) {
  <div>{{ item.name_code }}</div>
}
```

> `<app-table>` عنده trackBy مدمج — الـ optimization ده بيهمك في الـ custom templates زي `#cardTemplate`.

---

## 4. Mock Data بدل Dummy Data — استخدم شكل الـ Envelope الصح

بدل ما تحط array عادية كـ dummy data، حط الـ JSON في `public/api/` بنفس شكل الـ envelope:

```
public/
└── api/
    └── ships.json
    └── messages.json
    └── your-feature.json
```

```json
{
  "success": 1,
  "message": { "type": "string", "texts": ["OK"] },
  "result": [
    {
      "id": 1,
      "name": "Al-Salam",
      "type": "Container",
      "flag": "SA",
      "status": "Active",
      "port": "Jeddah",
      "eta": "2025-06-01T08:00:00",
      "tonnage": 45000
    },
    {
      "id": 2,
      "name": "Gulf Star",
      "type": "Tanker",
      "flag": "AE",
      "status": "Pending",
      "port": "Dammam",
      "eta": "2025-06-03T14:30:00",
      "tonnage": 72000
    }
  ]
}
```

**ليه كده أحسن من dummy data في الـ component؟**
- بتشتغل `BaseApiService` بالكامل (mapItem, error handling, envelope parsing)
- لما الـ backend يجهز، بس بتغير الـ `url` في الـ service — الـ component مش بيتغير خالص
- الـ loading state بيشتغل صح

---

## 5. اعمل `BaseApiService` للـ Mock — مش HTTP مباشر

```typescript
// ❌ مش كده
private http = inject(HttpClient);
ngOnInit() {
  this.http.get<any[]>('/api/ships.json').subscribe(data => this.ships = data);
}

// ✅ كده — نفس الـ pattern الـ real service
@Injectable({ providedIn: 'root' })
export class ShipMockService extends BaseApiService<Ship> {
  protected url = '/api/ships.json';

  protected mapItem(raw: any): Ship {
    return {
      id:       raw.id,
      name:     raw.name,
      type:     raw.type,
      flag:     raw.flag,
      status:   raw.status,
      port:     raw.port,
      eta:      raw.eta ? new Date(raw.eta) : null,
      tonnage:  raw.tonnage
    };
  }
}
```

---

## 6. `takeUntilDestroyed` بدل Manual Destroy

```typescript
// ❌ الطريقة القديمة — محتاج ngOnDestroy يدوي
private destroy$ = new Subject<void>();

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// ✅ الطريقة الجديدة — Angular 16+
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.svc.getAll()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => this.items.set(data));
}
```

لو مش عارف تستخدم `takeUntilDestroyed` (لو مش في injection context)، استخدم `destroy$` العادي زي ما هو موجود في الـ codebase.

---

## 7. Lazy Loading — كل feature في chunk منفصل

المشروع عنده lazy loading بالفعل. تأكد إن كل feature جديدة بتستخدم `loadComponent`:

```typescript
// auth.routes.ts
export const AUTH_ROUTES: Routes = [
  {
    path: 'roles',
    loadComponent: () =>
      import('./roles/pages/roles/roles').then(m => m.RolesPage)
    //  ↑ Angular بيحمّل الـ chunk ده بس لما المستخدم يدخل الـ route
  }
];
```

**لا تعمل كده:**
```typescript
// ❌ static import — بيكسر الـ lazy loading
import { RolesPage } from './roles/pages/roles/roles';
```

---

## 8. `computed()` للحسابات المشتقة

```typescript
// ❌ بيحسب في كل render
get activeRolesCount() {
  return this.roles().filter(r => r.status === 'Active').length;
}

// ✅ بيحسب بس لما roles() تتغير
activeRolesCount = computed(() =>
  this.roles().filter(r => r.status === 'Active').length
);
```

---

## 9. `async` Pipe بدل `subscribe` في الـ Template

لو عندك Observable بتعرضه في الـ template:

```typescript
// في الـ component
roles$ = this.svc.getAll();
```

```html
<!-- ✅ async pipe بيعمل unsubscribe تلقائي + بيتعمل مع OnPush صح -->
@if (roles$ | async; as roles) {
  <app-table [data]="roles" ... />
}
```

---

## 10. Card Template — تجنب Function Calls في الـ Template

```html
<!-- ❌ بيتستدعى في كل change detection cycle -->
<p-tag [severity]="getSeverity(item.status)" />

<!-- ✅ استخدم الـ pipe الموجود في المشروع -->
<p-tag [severity]="item.status | severity" />
```

---

## Quick Reference — Performance Checklist

| الموضوع | الحل |
|---|---|
| كل component | أضف `changeDetection: ChangeDetectionStrategy.OnPush` |
| Local UI state | `signal()` بدل variables عادية |
| Loops | `track item.id` في `@for` |
| Mock data | JSON في `public/api/` + `BaseApiService` |
| HTTP subscriptions | `takeUntilDestroyed(destroyRef)` |
| Features جديدة | `loadComponent` دايماً (مش static import) |
| Derived state | `computed()` بدل getters |
| Status tags | `| severity` pipe بدل function calls في template |

---

## بخصوص الـ Figma

الـ Figma مش بيسمح بقراءة الداتا برمجياً بدون Figma API token. علشان تاخد الداتا منه:

1. **شكل الـ Cards** — شوف في الـ Figma شكل الـ card وحدد:
   - الحقول اللي بتظهر (اسم، status، أرقام، إلخ)
   - ترتيبها واللون بتاع الـ status

2. **حط الداتا كـ Mock JSON** في `public/api/your-feature.json` بنفس الحقول اللي في الـ Figma

3. **اعمل Mock Service** يـ extends من `BaseApiService` وحدد الـ `mapItem` بنفس الحقول

كده بتحاكي شكل الـ API الحقيقي من أول يوم.
