import { Component } from '@angular/core';
import { DataTablePageComponent } from '@/app/foundation/shared/components/data-table-page/generic-table-page.component';
import { DataTablePageConfig } from '@/app/foundation/shared/components/data-table-page/generic-table-page.config';
import { UserDetailsComponent } from '../../components/user-details/user-details';
import { RawMetaColumn } from '@/app/foundation/shared/services/table-builder.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DataTablePageComponent, UserDetailsComponent],
  template: `
    <app-data-table-page
      #usersTable
      [config]="config"
      (onView)="openUserDetails($event)"
    />

    <app-user-details
      [(visible)]="detailsVisible"
      [userData]="selectedUser"
      [metaData]="metaColumns"
      (userSaved)="onUserSaved($event)"
    />
  `
})
export class UsersPage {
  detailsVisible = false;
  selectedUser: any = null;
  metaColumns: RawMetaColumn[] = [];

  config: DataTablePageConfig = {
    apiUrl: 'http://192.168.1.39:5000/api/system/Users',
    fallbackJsonAr: 'api/users-ar.json',
    fallbackJsonEn: 'api/users-en.json',
    idField: 'id',
    actions: { create: true, edit: true, view: true, delete: true }
  };

  openUserDetails(item: any): void {
    this.selectedUser = item;
    this.metaColumns = item?._meta ?? [];
    this.detailsVisible = true;
  }

  onUserSaved(updated: any): void {
    console.log('User saved:', updated);
  }
}
