# 📐 توحيد الـ Style في المشروع

الملف ده هدفه توضيح مجموعة من القواعد (Guidelines) علشان نحافظ على شكل موحّد (Consistent UI) في كل أجزاء المشروع.

---


## 🔘 أولًا: الأزرار الدائرية (Rounded Buttons)

أي زر دائري لازم يلتزم بالآتي:

### ✅ القواعد
- لازم يكون فيه `aria-label` لتحسين الـ accessibility
- لازم يكون فيه `tooltip` يوضح وظيفة الزر
- اللون يكون **رمادي (secondary)**
- يكون `outlined`
- يكون `rounded`

### 💡 مثال

```html
<p-button
    icon="pi pi-pencil"
    class="me-2"
    severity="secondary"
    [rounded]="true"
    [outlined]="true"
    (click)="editRole(item)"
    pTooltip="Edit Role"
    ariaLabel="Edit Role"
    tooltipPosition="top"
/>
```

## 🪟 ثانيًا: الـ Pop-ups (Dialogs)

أي Dialog أو Popup في المشروع لازم يستخدم نفس الإعدادات علشان نحافظ على تجربة موحدة.

### ✅ القواعد
يكون modal
يقفل عند الضغط خارجه (dismissableMask)
يستخدم نفس الـ styleClass
يكون Responsive باستخدام breakpoints
تحديد عرض ثابت مناسب
### 💡 مثال
```html
<p-dialog
    header="Filter Roles"
    [(visible)]="filterDialogVisible"
    [modal]="true"
    [dismissableMask]="true"
    [style]="{ width: '450px' }"
    styleClass="app-dialog-md p-fluid"
    [breakpoints]="{ '960px': '75vw', '641px': '90vw' }"
>
    <div class="flex flex-col gap-4"></div>

    <ng-template #footer>
        <p-button
            label="Clear"
            icon="pi pi-filter-slash"
            severity="secondary"
            (click)="clearFilters()"
        />
        <p-button
            label="Done"
            icon="pi pi-check"
            (click)="filterDialogVisible = false"
        />
    </ng-template>
</p-dialog>

```