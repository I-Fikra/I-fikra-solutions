import { Component } from '@angular/core';
import { DataTablePageComponent } from '@/app/foundation/shared/components/data-table-page/generic-table-page.component';
import { DataTablePageConfig } from '@/app/foundation/shared/components/data-table-page/generic-table-page.config';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [DataTablePageComponent],
  template: `<app-data-table-page [config]="config" />`
})
export class RolesPage {
  config: DataTablePageConfig = {
    apiUrl: 'http://192.168.1.39:5000/api/system/Roles',
    fallbackJsonAr: 'api/roles-list-ar.json',
    fallbackJsonEn: 'api/roles-list-en.json',
    idField: 'id',
    actions: { create: true, edit: true, view: true, delete: true },
    seeMoreLink: (item) => ['/iam/roles', item.role_id]
  };
}
