import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MenuItem, TreeNode } from 'primeng/api';
import { TreeTableModule } from 'primeng/treetable';
import { TableComponent } from '@/app/foundation/shared/components/table/table';
import { DeleteButtonComponent } from '@/app/foundation/shared/components/delete-button/delete-button.component';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationService } from 'primeng/api';
import { Toolbar } from 'primeng/toolbar';
import { CapitalizePipe } from '@/app/foundation/shared/pipes/capitalize.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { Chip } from 'primeng/chip';
import { DialogShellComponent } from '@/app/foundation/shared/components/dialog-shell';

// ── استيراد الـ Service الناقصة ─────────────────────────────────────────────
//import { RoleService } from '../../roles/services/role.service';

@Component({
  selector: 'app-role-details',
  standalone: true,
  imports: [
    CapitalizePipe,
    TooltipModule,
    TreeTableModule,
    TableComponent,
    ButtonModule,
    ToastModule,
    CommonModule,
    FormsModule,
    SelectModule,
    TagModule,
    InputTextModule,
    ConfirmDialogModule,
    DialogModule,
    TextareaModule,
    DeleteButtonComponent,
    Toolbar,
    Chip,
    DialogShellComponent
  ],
  templateUrl: './role-details.html',
  styleUrl: './role-details.scss',
  providers: [MessageService, ConfirmationService]
})
export class RoleDetailsComponent implements OnInit {
  treeTableValue = signal<TreeNode[]>([]);
  selectedTreeTableValue: any = {};
  cols: any[] = [];

  roleData = {
    name: 'Role Name',
    code: 'ADMIN_ROLE',
    nameCode: 'ADMIN',
    description: 'Role description lorem ipsum',
    status: 'ACTIVE',
    categoryName: 'System',
    communityName: 'Main Community',
    createdByName: 'Nora Ali',
    createdAt: new Date('2026-05-01T10:30:00'),
    updatedByName: 'Ahmed Hassan',
    updatedAt: new Date('2026-05-01T14:15:00')
  };

  // ── Dialog visibility ────────────────────────────────────────────────────
  editDialogVisible = false;
  userDetailsVisible = false;
  selectedUser: any = null;

  // ── Dropdown options ─────────────────────────────────────────────────────
  statusOptions = [
    { label: 'ACTIVE', value: 'ACTIVE' },
    { label: 'INACTIVE', value: 'INACTIVE' }
  ];

  categoriesOptions = [
    { label: 'category 1', value: 'category 1' },
    { label: 'category 2', value: 'category 2' },
    { label: 'category 3', value: 'category 3' },
    { label: 'category 4', value: 'category 4' },
    { label: 'category 5', value: 'category 5' }
  ];

  communitiesOptions = [
    { label: 'community 1', value: 'community 1' },
    { label: 'community 2', value: 'community 2' },
    { label: 'community 3', value: 'community 3' },
    { label: 'community 4', value: 'community 4' },
    { label: 'community 5', value: 'community 5' },
    { label: 'community 6', value: 'community 6' }
  ];

  // ── Edit form ────────────────────────────────────────────────────────────
  form: any = {
    name: '',
    description: '',
    status: '',
    category: '',
    community: ''
  };

  // ── Constructor / lifecycle ──────────────────────────────────────────────
  // تنظيف علامات الـ Conflict وحقن الـ Services بشكل صحيح ومباشر هنا
  // ── Constructor / lifecycle ──────────────────────────────────────────────
  // تنظيف علامات الـ Conflict وحقن الـ Services بشكل صحيح ومباشر هنا
  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    const roleId = this.route.snapshot.paramMap.get('id');
    console.log('Role ID:', roleId);
    // TODO: استخدم roleId لجلب البيانات من الـ API
    // this.roleService.getById(roleId).subscribe(...)

    this.initColumns();
    this.loadPermissionsTree();
    this.loadRolePermissions();
  }

  initColumns(): void {
    this.cols = [
      { field: 'name', header: 'Name' },
      { field: 'description', header: 'Description' }
    ];
  }

  // ── Edit role ────────────────────────────────────────────────────────────
  editRole(role: any): void {
    this.form = {
      name: role.name ?? '',
      description: role.description ?? '',
      status: role.status ?? '',
      category: role.categoryName ?? '',
      community: role.communityName ?? ''
    };
    this.editDialogVisible = true;
  }

  saveEdit(): void {
    const isValidStatus = this.statusOptions.some(
      (o) => o.value === this.form.status
    );
    const isValidCategory = this.categoriesOptions.some(
      (o) => o.value === this.form.category
    );
    const isValidCommunity = this.communitiesOptions.some(
      (o) => o.value === this.form.community
    );

    if (!isValidStatus || !isValidCategory || !isValidCommunity) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Invalid data selection.'
      });
      return;
    }

    this.roleData = {
      ...this.roleData,
      name: this.form.name,
      description: this.form.description,
      status: this.form.status,
      categoryName: this.form.category,
      communityName: this.form.community
    };

    this.editDialogVisible = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Updated',
      detail: 'Role updated successfully'
    });
  }

  // ── Delete role ───────────────────────────────────────────────────────────
  deleteRole(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Deleted',
      detail: 'Role deleted successfully'
    });
  }

  // ── Severity helper ───────────────────────────────────────────────────────
  getSeverity(text: string): 'success' | 'danger' | 'info' {
    switch (text) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'danger';
      default:
        return 'info';
    }
  }

  // ── Permissions tree ──────────────────────────────────────────────────────
  loadPermissionsTree(): void {
    const data: TreeNode[] = [
      {
        key: 'users',
        data: { name: 'Users', description: 'User management module' },
        children: [
          {
            key: 'users.view',
            data: { name: 'View Users', description: 'Can view users list' }
          },
          {
            key: 'users.create',
            data: { name: 'Create User', description: 'Can create new user' }
          }
        ]
      },
      {
        key: 'roles',
        data: { name: 'Roles', description: 'Role management module' },
        children: [
          {
            key: 'roles.view',
            data: { name: 'View Roles', description: 'Can view roles' }
          },
          {
            key: 'roles.edit',
            data: { name: 'Edit Roles', description: 'Can edit roles' }
          }
        ]
      }
    ];
    this.treeTableValue.set(data);
  }

  loadRolePermissions(): void {
    this.selectedTreeTableValue = {
      'users.view': { checked: true },
      'roles.view': { checked: true },
      'roles.edit': { checked: false }
    };
  }

  save(): void {
    const selected = Object.keys(this.selectedTreeTableValue).filter(
      (k) => this.selectedTreeTableValue[k]?.checked
    );
    console.log('Selected Permissions:', selected);
  }

  // ── Users table ───────────────────────────────────────────────────────────
  users = [
    {
      id: 1,
      name: 'Nora Ali',
      email: 'nora@test.com',
      role: 'Admin',
      organization: 'Tech Corp',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      email: 'ahmed@test.com',
      role: 'Doctor',
      organization: 'Health Care Inc',
      status: 'Inactive'
    },
    {
      id: 3,
      name: 'Sara Mohamed',
      email: 'sara@test.com',
      role: 'Nurse',
      organization: 'City Hospital',
      status: 'Active'
    }
  ];

  columns: any[] = [
    { field: 'name', header: 'Name', type: 'text', width: '20%' },
    { field: 'status', header: 'Status', type: 'status', width: '15%' },
    {
      field: 'organization',
      header: 'Organization',
      type: 'text',
      width: '20%'
    }
  ];

  onBulkDelete(users: any[]): void {
    this.users = this.users.filter((u) => !users.includes(u));
  }

  readonly getRowActions = (user: any): MenuItem[] => [
    { label: 'View', icon: 'pi pi-eye', command: () => this.viewUser(user) },
    {
      label: 'Unassign',
      icon: 'pi pi-user-minus',
      styleClass: 'text-red-500',
      command: () => this.onUnassign(user)
    }
  ];

  onUnassign(user: any): void {
    this.users = this.users.filter((u) => u.id !== user.id);
    this.messageService.add({
      severity: 'success',
      summary: 'Unassigned',
      detail: 'User has been unassigned from this role'
    });
  }

  // ── View user ─────────────────────────────────────────────────────────────
  viewUser(user: any): void {
    this.selectedUser = {
      name: user.name,
      username: user.email,
      status: user.status,
      email: user.email
    };
    this.userDetailsVisible = true;
  }
}
