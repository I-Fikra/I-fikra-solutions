export interface Role {
    id?: number;
    name_code?: string;
    category?: string;
    community?: string;
    status?: string;
    description?: string;
    noOfUsers?: number;
    noOfPermissions?: number;
}

/** Blank role used to reset create / edit forms. */
export function emptyRoleForm() {
    return { name_en: '', name_ar: '', description: '', status: '', category: '', community: '' };
}

/** Blank edit form bound to an existing role. */
export function roleToEditForm(role: Role) {
    return {
        id:          role.id ?? null,
        name:        role.name_code   ?? '',
        description: role.description ?? '',
        status:      role.status      ?? '',
        category:    role.category    ?? '',
        community:   role.community   ?? ''
    };
}