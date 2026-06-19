// permissions-data.service.ts
/**
 * Rewritten to match the actual JSON structure:
 *   result.modules[]         — module → entities[]
 *   result.roles[]           — { id, name, type }
 *   result.roleAssignments[] — { permissionKey, roleIds[] }
 *   result.translations      — all UI strings from the API
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslocoService } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import {
  TreeModule as Module,
  TreeNode as PermissionNode,
  Role
} from '@/app/foundation/shared/components/tree-table/tree-table';

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface ApiFieldPermission {
  key: string;
  code: string;
  name: string;
  status: string;
  assignedRolesCount: number;
  statusLabel: string;
}

interface ApiPermission {
  key: string;
  code: string;
  name: string;
  category: string;
  action: string;
  status: string;
  assignedRolesCount: number;
  statusLabel: string;
  fieldPermissions?: ApiFieldPermission[];
}

interface ApiEntity {
  key: string;
  code: string;
  name: string;
  category: string;
  status: string;
  assignedRolesCount: number;
  statusLabel: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  permissions: ApiPermission[];
}

interface ApiModule {
  name: string;
  entities: ApiEntity[];
}

interface ApiRoleAssignment {
  permissionKey: string;
  roleIds: string[];
}

interface ApiTranslations {
  pageTitle: string;
  search: string;
  filterModule: string;
  filterEntityStatus: string;
  filterPermStatus: string;
  filterPermission: string;
  tableView: string;
  cardsView: string;
  entityName: string;
  permissionName: string;
  fieldName: string;
  category: string;
  status: string;
  actionType: string;
  assignedRoles: string;
  bulkEdit: string;
  fieldPermissions: string;
  noPermissions: string;
  editRoles: string;
  manage: string;
  assignRolesToPermission: string;
  assignRolesToEntity: string;
  entityNote: string;
  assignedRolesLabel: string;
  partialNote: string;
  selectAll: string;
  permissionsCount: string;
  statusLabels: Record<string, string>;
  messages: Record<string, string>;
}

interface ApiResult {
  modules: ApiModule[];
  roles: Role[];
  roleAssignments: ApiRoleAssignment[];
  translations: ApiTranslations;
}

interface ApiResponse {
  success: number;
  messages: null | string;
  result: ApiResult;
}

export type PermissionsTranslations = ApiTranslations;

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PermissionsDataService {
  private readonly http = inject(HttpClient);
  private readonly t = inject(TranslocoService);

  private apiUrl(): string {
    return this.t.getActiveLang() === 'ar'
      ? 'api/permissions-ar.json'
      : 'api/permissions-en.json';
  }

  private load(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.apiUrl());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getData$(): Observable<{
    modules: Module[];
    roles: Role[];
    roleAssignments: [string, string[]][];
    translations: PermissionsTranslations;
  }> {
    return this.load().pipe(
      map((api) => ({
        modules: this.buildModules(api.result.modules),
        roles: api.result.roles,
        roleAssignments: (api.result.roleAssignments ?? []).map(
          (ra) => [ra.permissionKey, ra.roleIds] as [string, string[]]
        ),
        translations: api.result.translations
      })),
      catchError((err) => {
        console.error('[PermissionsDataService] getData$() failed:', err);
        return of({
          modules: [] as Module[],
          roles: [] as Role[],
          roleAssignments: [] as [string, string[]][],
          translations: {} as PermissionsTranslations
        });
      })
    );
  }

  getRoleAssignments$(): Observable<[string, string[]][]> {
    return of([]);
  }

  // ── Tree builders ─────────────────────────────────────────────────────────

  private buildModules(modules: ApiModule[]): Module[] {
    return modules.map((mod) => ({
      name: mod.name,
      entities: mod.entities.map((e) => this.buildEntity(e))
    }));
  }

  private buildEntity(entity: ApiEntity): PermissionNode {
    return {
      key: `entity-${entity.key}`,
      data: {
        code: entity.code,
        name: entity.name,
        assignedRolesCount: entity.assignedRolesCount,
        status: entity.status,
        statusLabel: entity.statusLabel,
        category: entity.category,
        action: '',
        createdBy: entity.createdBy,
        createdAt: entity.createdAt,
        updatedBy: entity.updatedBy,
        updatedAt: entity.updatedAt
      },
      children: entity.permissions.map((p) => this.buildPermission(p))
    };
  }

  private buildPermission(perm: ApiPermission): PermissionNode {
    const fieldChildren = (perm.fieldPermissions ?? []).map((f) =>
      this.buildFieldPermission(f, perm)
    );
    return {
      key: perm.key,
      data: {
        code: perm.code,
        name: perm.name,
        assignedRolesCount: perm.assignedRolesCount,
        status: perm.status,
        statusLabel: perm.statusLabel,
        category: perm.category,
        action: perm.action,
        hasFieldPermissions: fieldChildren.length > 0
      },
      ...(fieldChildren.length ? { children: fieldChildren } : {})
    };
  }

  private buildFieldPermission(
    field: ApiFieldPermission,
    perm: ApiPermission
  ): PermissionNode {
    return {
      key: field.key,
      data: {
        code: field.code,
        name: field.name,
        assignedRolesCount: field.assignedRolesCount,
        status: field.status,
        statusLabel: field.statusLabel,
        category: perm.category,
        action: perm.action,
        isFieldPermission: true as const
      }
    };
  }
}
