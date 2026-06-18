import { TableColumn } from '@/app/foundation/shared/models/table.models';

/** Flat attribute row — replaces the former tree-table TreeNode shape. */
export interface UserAttributeRow {
  key: string;
  module: string;
  name: string;
  code: string;
  type: string;
  required: string;
  nullable: string;
}

export const USER_ATTRIBUTE_COLUMNS: TableColumn[] = [
  { field: 'module',   header: 'Module',   sortable: true, filterable: true, minWidth: '12rem' },
  { field: 'name',     header: 'Attribute', sortable: true, filterable: true, minWidth: '16rem' },
  { field: 'code',     header: 'Code',      sortable: true, filterable: true, minWidth: '12rem' },
  { field: 'type',     header: 'Type',      sortable: true, filterable: true, minWidth: '8rem',
    filterOptions: [
      { label: 'string', value: 'string' }, { label: 'number', value: 'number' },
      { label: 'boolean', value: 'boolean' }, { label: 'datetime', value: 'datetime' },
      { label: 'date', value: 'date' }, { label: 'text', value: 'text' }, { label: 'json', value: 'json' }
    ]
  },
  { field: 'required', header: 'Required',  sortable: true, filterable: true, minWidth: '8rem',
    filterOptions: [{ label: 'Required', value: 'Required' }, { label: 'Optional', value: 'Optional' }]
  },
  { field: 'nullable', header: 'Nullable',  sortable: true, filterable: true, minWidth: '8rem',
    filterOptions: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]
  },
];

// Flat — each row carries its own `module` field instead of being nested under a module's `entities` array.
export const USER_ATTRIBUTE_ROWS: UserAttributeRow[] = [
  { key: 'user.id', module: 'System Identifiers', name: 'ID', code: 'id', type: 'number', required: 'Required', nullable: 'No' },
  { key: 'user.code', module: 'System Identifiers', name: 'Code', code: 'code', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.username', module: 'Identity', name: 'Username', code: 'username', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.nationalIdNumber', module: 'Identity', name: 'National ID', code: 'nationalIdNumber', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.residencePermitNumber', module: 'Identity', name: 'National ID', code: 'residencePermitNumber', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.passportNumber', module: 'Identity', name: 'Passport Number', code: 'passportNumber', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.email', module: 'Contact Info', name: 'Email', code: 'email', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.phone', module: 'Contact Info', name: 'Phone', code: 'phone', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.contactId', module: 'Contact Info', name: 'Contact ID', code: 'contactId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.emailVerified', module: 'Contact Info', name: 'Email Verified', code: 'emailVerified', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.secondaryEmail', module: 'Contact Info', name: 'Secondary Email', code: 'secondaryEmail', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.secondaryEmailVerified', module: 'Contact Info', name: 'Secondary Email Verified', code: 'secondaryEmailVerified', type: 'boolean', required: 'Optional', nullable: 'No' },
  { key: 'user.isEmailPublic', module: 'Contact Info', name: 'Is Email Public', code: 'isEmailPublic', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.phoneVerified', module: 'Contact Info', name: 'Phone Verified', code: 'phoneVerified', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.secondaryPhone', module: 'Contact Info', name: 'Secondary Phone', code: 'secondaryPhone', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.secondaryPhoneVerified', module: 'Contact Info', name: 'Secondary Phone Verified', code: 'secondaryPhoneVerified', type: 'boolean', required: 'Optional', nullable: 'No' },
  { key: 'user.isPhonePublic', module: 'Contact Info', name: 'Is Phone Public', code: 'isPhonePublic', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.whatsapp', module: 'Contact Info', name: 'WhatsApp', code: 'whatsapp', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.whatsappVerified', module: 'Contact Info', name: 'WhatsApp Verified', code: 'whatsappVerified', type: 'boolean', required: 'Optional', nullable: 'No' },
  { key: 'user.telegram', module: 'Contact Info', name: 'Telegram', code: 'telegram', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.telegramVerified', module: 'Contact Info', name: 'Telegram Verified', code: 'telegramVerified', type: 'boolean', required: 'Optional', nullable: 'No' },
  { key: 'user.linkedIn', module: 'Contact Info', name: 'LinkedIn', code: 'linkedIn', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.landline', module: 'Contact Info', name: 'Landline', code: 'landline', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.fax', module: 'Contact Info', name: 'Fax', code: 'fax', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.website', module: 'Contact Info', name: 'Website', code: 'website', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.passwordHash', module: 'Security & Authentication', name: 'Password Hash', code: 'passwordHash', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.passwordChangedAt', module: 'Security & Authentication', name: 'Password Changed At', code: 'passwordChangedAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.passwordResetToken', module: 'Security & Authentication', name: 'Password Reset Token', code: 'passwordResetToken', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.passwordResetTokenExpiresAt', module: 'Security & Authentication', name: 'Password Reset Token Expires At', code: 'passwordResetTokenExpiresAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.socialMediaEnabled', module: 'Security & Authentication', name: 'MFA Enabled', code: 'socialMediaEnabled', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.socialProviders', module: 'Security & Authentication', name: 'Social Providers', code: 'socialProviders', type: 'json', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaEnabled', module: 'Security & Authentication', name: 'MFA Enabled', code: 'mfaEnabled', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.mfaMethod', module: 'Security & Authentication', name: 'MFA Method', code: 'mfaMethod', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaSecret', module: 'Security & Authentication', name: 'MFA Secret', code: 'mfaSecret', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaSecretVerified', module: 'Security & Authentication', name: 'MFA Secret Verified', code: 'mfaSecretVerified', type: 'boolean', required: 'Optional', nullable: 'No' },
  { key: 'user.mfaBackupCodes', module: 'Security & Authentication', name: 'MFA Backup Codes', code: 'mfaBackupCodes', type: 'json', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaRecoveryEmail', module: 'Security & Authentication', name: 'MFA Recovery Email', code: 'mfaRecoveryEmail', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaEnrolledAt', module: 'Security & Authentication', name: 'MFA Enrolled At', code: 'mfaEnrolledAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mfaLastUsedAt', module: 'Security & Authentication', name: 'MFA Last Used At', code: 'mfaLastUsedAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.biometricEnabled', module: 'Security & Authentication', name: 'Biometric Enabled', code: 'biometricEnabled', type: 'boolean', required: 'Required', nullable: 'No' },
  { key: 'user.biometricCredentials', module: 'Security & Authentication', name: 'Biometric Credentials', code: 'biometricCredentials', type: 'json', required: 'Optional', nullable: 'Yes' },
  { key: 'user.biometricLastUsedAt', module: 'Security & Authentication', name: 'Biometric Last Used At', code: 'biometricLastUsedAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.failedLoginAttempts', module: 'Security & Authentication', name: 'Failed Login Attempts', code: 'failedLoginAttempts', type: 'number', required: 'Required', nullable: 'No' },
  { key: 'user.lastLoginAt', module: 'Security & Authentication', name: 'Last Login At', code: 'lastLoginAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.lastLoginIp', module: 'Security & Authentication', name: 'Last Login IP', code: 'lastLoginIp', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.lastLoginMethod', module: 'Security & Authentication', name: 'Last Login Method', code: 'lastLoginMethod', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.lockedUntil', module: 'Security & Authentication', name: 'Locked Until', code: 'lockedUntil', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.suspensionReason', module: 'Security & Authentication', name: 'Suspension Reason', code: 'suspensionReason', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.statusId', module: 'Life Cycle', name: 'Status ID', code: 'statusId', type: 'number', required: 'Required', nullable: 'No' },
  { key: 'user.state', module: 'Life Cycle', name: 'State', code: 'state', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.firstName', module: 'Personal Info', name: 'First Name', code: 'firstName', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.lastName', module: 'Personal Info', name: 'Last Name', code: 'lastName', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.fullName', module: 'Personal Info', name: 'Full Name', code: 'fullName', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.jobTitle', module: 'Personal Info', name: 'Job Title', code: 'jobTitle', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.description', module: 'Personal Info', name: 'Description', code: 'description', type: 'text', required: 'Optional', nullable: 'Yes' },
  { key: 'user.gender', module: 'Personal Info', name: 'Gender', code: 'gender', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.dateOfBirth', module: 'Personal Info', name: 'Date of Birth', code: 'dateOfBirth', type: 'date', required: 'Optional', nullable: 'Yes' },
  { key: 'user.age', module: 'Personal Info', name: 'Age', code: 'age', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.nationality', module: 'Personal Info', name: 'Nationality', code: 'nationality', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.maritalStatus', module: 'Personal Info', name: 'Marital Status', code: 'maritalStatus', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.spouseName', module: 'Personal Info', name: 'Spouse Name', code: 'spouseName', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.numberOfChildren', module: 'Personal Info', name: 'Number of Children', code: 'numberOfChildren', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.mediaId', module: 'Media', name: 'Media ID', code: 'mediaId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.avatarUrl', module: 'Media', name: 'Avatar URL', code: 'avatarUrl', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.thumbnailUrl', module: 'Media', name: 'Thumbnail URL', code: 'thumbnailUrl', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.fullImageUrl', module: 'Media', name: 'Full Image URL', code: 'fullImageUrl', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.coverImageUrl', module: 'Media', name: 'Cover Image URL', code: 'coverImageUrl', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.settingsId', module: 'Settings & Preferences', name: 'Settings ID', code: 'settingsId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.preferredLanguage', module: 'Settings & Preferences', name: 'Preferred Language', code: 'preferredLanguage', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.preferredTheme', module: 'Settings & Preferences', name: 'Preferred Theme', code: 'preferredTheme', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.timezone', module: 'Settings & Preferences', name: 'Timezone', code: 'timezone', type: 'string', required: 'Optional', nullable: 'Yes' },
  { key: 'user.categoryId', module: 'Classification', name: 'Category ID', code: 'categoryId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.userType', module: 'Classification', name: 'User Type', code: 'userType', type: 'string', required: 'Required', nullable: 'No' },
  { key: 'user.tenantId', module: 'Multitenancy', name: 'Tenant ID', code: 'tenantId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.organizationId', module: 'Multitenancy', name: 'Organization ID', code: 'organizationId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.departmentId', module: 'Multitenancy', name: 'Department ID', code: 'departmentId', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.createdBy', module: 'Audit', name: 'Created By', code: 'createdBy', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.createdAt', module: 'Audit', name: 'Created At', code: 'createdAt', type: 'datetime', required: 'Required', nullable: 'No' },
  { key: 'user.updatedBy', module: 'Audit', name: 'Updated By', code: 'updatedBy', type: 'number', required: 'Optional', nullable: 'Yes' },
  { key: 'user.updatedAt', module: 'Audit', name: 'Updated At', code: 'updatedAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.deletedAt', module: 'Audit', name: 'Deleted At', code: 'deletedAt', type: 'datetime', required: 'Optional', nullable: 'Yes' },
  { key: 'user.deletedBy', module: 'Audit', name: 'Deleted By', code: 'deletedBy', type: 'number', required: 'Optional', nullable: 'Yes' },
];
