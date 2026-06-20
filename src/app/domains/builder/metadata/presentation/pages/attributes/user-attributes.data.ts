// Auto-generated from user-attribute.yaml — "user" entity attributes
export interface UserAttribute {
  code: string;
  name: string;
  feature: string;
  type: string;
  isNullable: boolean;
  isUnique: boolean;
  isPublic: boolean;
  icon: string;
  summary: string | null;
  length: string | null;
  value: string | null;
  reference: string | null;
  tags: string[];
}

export const USER_ATTRIBUTES: UserAttribute[] = [
  // order 1
  { code: 'id', name: 'ID', feature: 'system', type: 'number', isNullable: false, isUnique: true, isPublic: false, icon: 'pi pi-hashtag', summary: 'Unique identifier of the user.', length: '—:19', value: '1:9999999999999999999', reference: null, tags: ['user', 'system', 'number', 'identifier', 'required', 'unique', 'indexed', 'select', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 2
  { code: 'code', name: 'Code', feature: 'system', type: 'string', isNullable: false, isUnique: true, isPublic: false, icon: 'pi pi-barcode', summary: 'Unique short code representing the user.', length: '2:30', value: null, reference: null, tags: ['user', 'system', 'string', 'required', 'unique', 'indexed', 'details', 'admin', 'doc'] },
  // order 3
  { code: 'username', name: 'Username', feature: 'identity', type: 'string', isNullable: false, isUnique: true, isPublic: true, icon: 'pi pi-at', summary: 'Unique username used for login.', length: '3:50', value: null, reference: null, tags: ['user', 'identity', 'string', 'required', 'unique', 'indexed', 'public', 'select', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 4
  { code: 'nationalIdNumber', name: 'National ID', feature: 'identity', type: 'string', isNullable: true, isUnique: true, isPublic: false, icon: 'pi pi-id-card', summary: 'Government-issued national identification number.', length: '5:20', value: null, reference: null, tags: ['user', 'identity', 'string', 'nullable', 'unique', 'indexed', 'details', 'admin', 'doc'] },
  { code: 'residencePermitNumber', name: 'Residence Permit Number', feature: 'identity', type: 'string', isNullable: true, isUnique: true, isPublic: false, icon: 'pi pi-id-card', summary: 'Government-issued residence permit number.', length: '5:20', value: null, reference: null, tags: ['user', 'identity', 'string', 'nullable', 'unique', 'indexed', 'details', 'admin', 'doc'] },
  // order 5
  { code: 'passportNumber', name: 'Passport Number', feature: 'identity', type: 'string', isNullable: true, isUnique: true, isPublic: false, icon: 'pi pi-book', summary: 'Government-issued passport number.', length: '5:20', value: null, reference: null, tags: ['user', 'identity', 'string', 'nullable', 'unique', 'indexed', 'details', 'admin', 'doc'] },
  // order 10
  { code: 'contactId', name: 'Contact ID', feature: 'contact', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-link', summary: 'Reference to the contact value object.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'contact', 'number', 'nullable', 'indexed', 'value-object', 'admin', 'doc', 'lookup'] },
  // order 11
  { code: 'email', name: 'Email', feature: 'contact', type: 'string', isNullable: false, isUnique: true, isPublic: false, icon: 'pi pi-envelope', summary: 'Primary email address of the user.', length: '5:255', value: null, reference: null, tags: ['user', 'contact', 'string', 'required', 'unique', 'indexed', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 12
  { code: 'emailVerified', name: 'Email Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the primary email has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'required', 'details', 'admin', 'doc', 'enum'] },
  // order 13
  { code: 'secondaryEmail', name: 'Secondary Email', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-envelope', summary: 'Secondary email address of the user.', length: '5:255', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin', 'doc'] },
  // order 14
  { code: 'secondaryEmailVerified', name: 'Secondary Email Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the secondary email has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'details', 'admin', 'doc', 'enum'] },
  // order 15
  { code: 'isEmailPublic', name: 'Is Email Public', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-eye', summary: 'Whether the email is publicly visible.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'required', 'details', 'admin', 'config', 'enum'] },
  // order 16
  { code: 'phone', name: 'Phone', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-phone', summary: 'Primary phone number of the user.', length: '7:20', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'indexed', 'value-object', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 17
  { code: 'phoneVerified', name: 'Phone Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the primary phone number has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'required', 'details', 'admin', 'doc', 'enum'] },
  // order 18
  { code: 'secondaryPhone', name: 'Secondary Phone', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-phone', summary: 'Secondary phone number of the user.', length: '7:20', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin', 'doc'] },
  // order 19
  { code: 'secondaryPhoneVerified', name: 'Secondary Phone Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the secondary phone number has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'details', 'admin', 'doc', 'enum'] },
  // order 20
  { code: 'isPhonePublic', name: 'Is Phone Public', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-eye', summary: 'Whether the phone number is publicly visible.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'required', 'details', 'admin', 'config', 'enum'] },
  // order 21
  { code: 'whatsapp', name: 'WhatsApp', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-comments', summary: 'WhatsApp number of the user.', length: '7:20', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin'] },
  // order 22
  { code: 'whatsappVerified', name: 'WhatsApp Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the WhatsApp number has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'details', 'admin', 'enum'] },
  // order 23
  { code: 'telegram', name: 'Telegram', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-send', summary: 'Telegram handle or number of the user.', length: '3:50', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin'] },
  // order 24
  { code: 'telegramVerified', name: 'Telegram Verified', feature: 'contact', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the Telegram account has been verified.', length: null, value: null, reference: 'enum', tags: ['user', 'contact', 'boolean', 'details', 'admin', 'enum'] },
  { code: 'linkedIn', name: 'LinkedIn', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-linkedin', summary: 'LinkedIn profile URL of the user.', length: '5:500', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin'] },
  // order 25
  { code: 'landline', name: 'Landline', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-phone', summary: 'Landline telephone number.', length: '7:20', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin'] },
  // order 26
  { code: 'fax', name: 'Fax', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-print', summary: 'Fax number.', length: '7:20', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'details', 'admin'] },
  // order 27
  { code: 'website', name: 'Website', feature: 'contact', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-globe', summary: 'Personal or professional website URL.', length: '5:500', value: null, reference: null, tags: ['user', 'contact', 'string', 'nullable', 'public', 'view', 'details', 'admin'] },
  // order 30
  { code: 'passwordHash', name: 'Password Hash', feature: 'security', type: 'string', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-lock', summary: 'Hashed representation of the user password.', length: '60:255', value: null, reference: null, tags: ['user', 'security', 'string', 'required', 'doc'] },
  // order 31
  { code: 'passwordChangedAt', name: 'Password Changed At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-clock', summary: 'Date and time when the password was last changed.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'details', 'admin', 'doc'] },
  // order 32
  { code: 'passwordResetToken', name: 'Password Reset Token', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-key', summary: 'Token used to reset the user password.', length: '10:255', value: null, reference: null, tags: ['user', 'security', 'string', 'nullable', 'doc'] },
  // order 33
  { code: 'passwordResetTokenExpiresAt', name: 'Password Reset Token Expires At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-clock', summary: 'Expiration date and time of the password reset token.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'doc'] },
  // order 34
  { code: 'socialMediaEnabled', name: 'Social Media Enabled', feature: 'security', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-shield', summary: 'Whether social media authentication is enabled.', length: null, value: null, reference: 'enum', tags: ['user', 'security', 'boolean', 'required', 'details', 'admin', 'config', 'doc', 'enum'] },
  { code: 'mfaEnabled', name: 'MFA Enabled', feature: 'security', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-shield', summary: 'Whether multi-factor authentication is enabled.', length: null, value: null, reference: 'enum', tags: ['user', 'security', 'boolean', 'required', 'details', 'admin', 'config', 'doc', 'enum'] },
  // order 35
  { code: 'mfaMethod', name: 'MFA Method', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-mobile', summary: 'Method used for multi-factor authentication.', length: '2:20', value: null, reference: 'enum', tags: ['user', 'security', 'string', 'nullable', 'details', 'admin', 'config', 'doc', 'enum'] },
  // order 36
  { code: 'mfaSecret', name: 'MFA Secret', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-key', summary: 'Secret key used for TOTP-based MFA.', length: '16:255', value: null, reference: null, tags: ['user', 'security', 'string', 'nullable', 'doc'] },
  // order 37
  { code: 'mfaSecretVerified', name: 'MFA Secret Verified', feature: 'security', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-check-circle', summary: 'Whether the MFA secret has been verified by the user.', length: null, value: null, reference: 'enum', tags: ['user', 'security', 'boolean', 'admin', 'doc', 'enum'] },
  // order 38
  { code: 'mfaBackupCodes', name: 'MFA Backup Codes', feature: 'security', type: 'json', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-inbox', summary: 'Backup codes for account recovery when MFA device is…', length: null, value: null, reference: null, tags: ['user', 'security', 'json', 'nullable', 'doc'] },
  // order 39
  { code: 'mfaRecoveryEmail', name: 'MFA Recovery Email', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-envelope', summary: 'Email address used for MFA recovery.', length: '5:255', value: null, reference: null, tags: ['user', 'security', 'string', 'nullable', 'details', 'admin', 'doc'] },
  // order 40
  { code: 'mfaEnrolledAt', name: 'MFA Enrolled At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-calendar', summary: 'Date and time when MFA was enrolled.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'admin', 'doc'] },
  // order 41
  { code: 'mfaLastUsedAt', name: 'MFA Last Used At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-clock', summary: 'Date and time when MFA was last used.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'admin', 'doc'] },
  // order 42
  { code: 'socialProviders', name: 'Social Providers', feature: 'security', type: 'json', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-share-alt', summary: 'List of linked social authentication providers.', length: null, value: null, reference: null, tags: ['user', 'security', 'json', 'nullable', 'details', 'admin', 'doc'] },
  // order 43
  { code: 'biometricEnabled', name: 'Biometric Enabled', feature: 'security', type: 'boolean', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-verified', summary: 'Whether biometric authentication is enabled.', length: null, value: null, reference: 'enum', tags: ['user', 'security', 'boolean', 'required', 'details', 'admin', 'config', 'doc', 'enum'] },
  // order 44
  { code: 'biometricCredentials', name: 'Biometric Credentials', feature: 'security', type: 'json', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-verified', summary: 'Stored biometric credential data.', length: null, value: null, reference: null, tags: ['user', 'security', 'json', 'nullable', 'doc'] },
  // order 45
  { code: 'biometricLastUsedAt', name: 'Biometric Last Used At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-clock', summary: 'Date and time when biometric authentication was last used.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'admin', 'doc'] },
  // order 47
  { code: 'firstName', name: 'First Name', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-user', summary: 'First name of the user.', length: '1:100', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'public', 'select', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 48
  { code: 'lastName', name: 'Last Name', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-user', summary: 'Last name of the user.', length: '1:100', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'public', 'select', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 49
  { code: 'fullName', name: 'Full Name', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-user', summary: 'Full display name of the user.', length: '1:200', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'indexed', 'public', 'select', 'list', 'view', 'details', 'admin', 'doc'] },
  // order 50
  { code: 'jobTitle', name: 'Job Title', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-briefcase', summary: 'Professional job title of the user.', length: '1:150', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'public', 'view', 'details', 'admin'] },
  { code: 'gender', name: 'Gender', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-user', summary: null, length: null, value: null, reference: 'enum', tags: ['user', 'profile', 'string', 'nullable', 'public', 'view', 'details', 'admin', 'doc', 'enum'] },
  // order 51
  { code: 'description', name: 'Description', feature: 'profile', type: 'text', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-file', summary: 'Short bio or description of the user.', length: '0:2000', value: null, reference: null, tags: ['user', 'profile', 'text', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  { code: 'dateOfBirth', name: 'Date of Birth', feature: 'profile', type: 'date', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-calendar', summary: "User's date of birth.", length: null, value: null, reference: null, tags: ['user', 'profile', 'date', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  // order 52
  { code: 'age', name: 'Age', feature: 'profile', type: 'number', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-calendar', summary: "User's age calculated from date of birth.", length: null, value: null, reference: null, tags: ['user', 'profile', 'number', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  { code: 'mediaId', name: 'Media ID', feature: 'media', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-link', summary: 'Reference to the media value object.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'media', 'number', 'nullable', 'indexed', 'value-object', 'admin', 'doc', 'lookup'] },
  // order 53
  { code: 'avatarUrl', name: 'Avatar URL', feature: 'media', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-image', summary: "URL of the user's avatar image.", length: '5:500', value: null, reference: null, tags: ['user', 'media', 'string', 'nullable', 'public', 'select', 'list', 'view', 'details', 'admin'] },
  { code: 'nationality', name: 'Nationality', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-flag', summary: "User's nationality.", length: '2:—', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  { code: 'maritalStatus', name: 'Marital Status', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-users', summary: "User's marital status.", length: null, value: null, reference: 'enum', tags: ['user', 'profile', 'string', 'nullable', 'public', 'view', 'details', 'admin', 'doc', 'enum'] },
  { code: 'spouseName', name: 'Spouse Name', feature: 'profile', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-users', summary: "Name of the user's spouse.", length: '—:200', value: null, reference: null, tags: ['user', 'profile', 'string', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  { code: 'numberOfChildren', name: 'Number of Children', feature: 'profile', type: 'number', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-user', summary: 'Number of children the user has.', length: null, value: null, reference: null, tags: ['user', 'profile', 'number', 'nullable', 'public', 'view', 'details', 'admin', 'doc'] },
  // order 54
  { code: 'thumbnailUrl', name: 'Thumbnail URL', feature: 'media', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-image', summary: "URL of the user's thumbnail image.", length: '5:500', value: null, reference: null, tags: ['user', 'media', 'string', 'nullable', 'public', 'select', 'list'] },
  // order 55
  { code: 'fullImageUrl', name: 'Full Image URL', feature: 'media', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-image', summary: 'URL of the full-size profile image.', length: '5:500', value: null, reference: null, tags: ['user', 'media', 'string', 'nullable', 'public', 'view', 'details'] },
  // order 56
  { code: 'coverImageUrl', name: 'Cover Image URL', feature: 'media', type: 'string', isNullable: true, isUnique: false, isPublic: true, icon: 'pi pi-image', summary: "URL of the user's cover/banner image.", length: '5:500', value: null, reference: null, tags: ['user', 'media', 'string', 'nullable', 'public', 'view', 'details'] },
  // order 57
  { code: 'settingsId', name: 'Settings ID', feature: 'settings', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-link', summary: 'Reference to the settings value object.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'settings', 'number', 'nullable', 'indexed', 'value-object', 'admin', 'doc', 'lookup'] },
  // order 58
  { code: 'preferredLanguage', name: 'Preferred Language', feature: 'settings', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-globe', summary: "User's preferred interface language.", length: '2:10', value: null, reference: 'enum', tags: ['user', 'settings', 'string', 'nullable', 'details', 'admin', 'config', 'enum'] },
  // order 59
  { code: 'preferredTheme', name: 'Preferred Theme', feature: 'settings', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-sun', summary: "User's preferred UI theme.", length: '2:20', value: null, reference: 'enum', tags: ['user', 'settings', 'string', 'nullable', 'details', 'admin', 'config', 'enum'] },
  // order 60
  { code: 'timezone', name: 'Timezone', feature: 'settings', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-clock', summary: "User's preferred timezone.", length: '3:50', value: null, reference: null, tags: ['user', 'settings', 'string', 'nullable', 'details', 'admin', 'config'] },
  // order 61
  { code: 'statusId', name: 'Status ID', feature: 'status', type: 'number', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-chart-line', summary: 'Reference to the user status.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'status', 'number', 'required', 'indexed', 'value-object', 'list', 'view', 'details', 'admin', 'doc', 'lookup'] },
  // order 62
  { code: 'state', name: 'State', feature: 'status', type: 'string', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-sliders-h', summary: 'Current lifecycle state of the user.', length: '2:30', value: null, reference: 'enum', tags: ['user', 'status', 'string', 'required', 'indexed', 'list', 'view', 'details', 'admin', 'doc', 'enum'] },
  // order 63
  { code: 'categoryId', name: 'Category ID', feature: 'classification', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-folder', summary: 'Reference to the user category.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'classification', 'number', 'nullable', 'indexed', 'list', 'details', 'admin', 'doc', 'lookup'] },
  // order 64
  { code: 'userType', name: 'User Type', feature: 'classification', type: 'string', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-users', summary: 'Type classification of the user.', length: '2:30', value: null, reference: 'enum', tags: ['user', 'classification', 'string', 'required', 'indexed', 'list', 'view', 'details', 'admin', 'doc', 'enum'] },
  // order 65
  { code: 'tenantId', name: 'Tenant ID', feature: 'multitenancy', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-building', summary: 'Identifier of the tenant this user belongs to.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'multitenancy', 'number', 'nullable', 'indexed', 'partitioned', 'admin', 'doc', 'lookup'] },
  // order 66
  { code: 'organizationId', name: 'Organization ID', feature: 'multitenancy', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-building', summary: 'Identifier of the organization this user belongs to.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'multitenancy', 'number', 'nullable', 'indexed', 'list', 'details', 'admin', 'doc', 'lookup'] },
  // order 67
  { code: 'departmentId', name: 'Department ID', feature: 'multitenancy', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-sitemap', summary: 'Identifier of the department this user belongs to.', length: '—:19', value: '1:9999999999999999999', reference: 'lookup', tags: ['user', 'multitenancy', 'number', 'nullable', 'indexed', 'list', 'details', 'admin', 'doc', 'lookup'] },
  // order 70
  { code: 'failedLoginAttempts', name: 'Failed Login Attempts', feature: 'security', type: 'number', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-exclamation-triangle', summary: 'Number of consecutive failed login attempts.', length: '—:5', value: '0:99999', reference: null, tags: ['user', 'security', 'number', 'required', 'admin', 'doc'] },
  // order 71
  { code: 'lockedUntil', name: 'Locked Until', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-lock', summary: 'Date and time until which the account is locked.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'admin', 'doc'] },
  // order 72
  { code: 'suspensionReason', name: 'Suspension Reason', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-exclamation-circle', summary: 'Reason for account suspension.', length: '1:500', value: null, reference: null, tags: ['user', 'security', 'string', 'nullable', 'admin', 'doc'] },
  // order 73
  { code: 'lastLoginAt', name: 'Last Login At', feature: 'security', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-sign-in', summary: 'Date and time of the last successful login.', length: null, value: null, reference: null, tags: ['user', 'security', 'datetime', 'nullable', 'indexed', 'details', 'admin', 'doc'] },
  // order 74
  { code: 'lastLoginIp', name: 'Last Login IP', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-wifi', summary: 'IP address of the last successful login.', length: '7:45', value: null, reference: null, tags: ['user', 'security', 'string', 'nullable', 'admin', 'doc'] },
  // order 75
  { code: 'lastLoginMethod', name: 'Last Login Method', feature: 'security', type: 'string', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-sign-in', summary: 'Authentication method used in the last login.', length: '2:30', value: null, reference: 'enum', tags: ['user', 'security', 'string', 'nullable', 'admin', 'doc', 'enum'] },
  // order 80
  { code: 'createdBy', name: 'Created By', feature: 'audit', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-user-plus', summary: 'Identifier of the user who created this account.', length: '—:19', value: '—:9999999999999999999', reference: 'lookup', tags: ['user', 'audit', 'number', 'nullable', 'details', 'admin', 'doc', 'lookup'] },
  // order 81
  { code: 'createdAt', name: 'Created At', feature: 'audit', type: 'datetime', isNullable: false, isUnique: false, isPublic: false, icon: 'pi pi-calendar-plus', summary: 'Date and time when the user record was created.', length: null, value: null, reference: null, tags: ['user', 'audit', 'datetime', 'required', 'indexed', 'details', 'admin', 'doc'] },
  // order 82
  { code: 'updatedBy', name: 'Updated By', feature: 'audit', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-user-edit', summary: 'Identifier of the user who last updated this account.', length: '—:19', value: '—:9999999999999999999', reference: 'lookup', tags: ['user', 'audit', 'number', 'nullable', 'details', 'admin', 'doc', 'lookup'] },
  // order 83
  { code: 'updatedAt', name: 'Updated At', feature: 'audit', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-calendar', summary: 'Date and time of the last update.', length: null, value: null, reference: null, tags: ['user', 'audit', 'datetime', 'nullable', 'indexed', 'details', 'admin', 'doc'] },
  // order 84
  { code: 'deletedAt', name: 'Deleted At', feature: 'audit', type: 'datetime', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-trash', summary: 'Date and time of soft deletion.', length: null, value: null, reference: null, tags: ['user', 'audit', 'datetime', 'nullable', 'indexed', 'admin', 'doc'] },
  // order 85
  { code: 'deletedBy', name: 'Deleted By', feature: 'audit', type: 'number', isNullable: true, isUnique: false, isPublic: false, icon: 'pi pi-user-minus', summary: 'Identifier of the user who deleted this account.', length: '—:19', value: '—:9999999999999999999', reference: 'lookup', tags: ['user', 'audit', 'number', 'nullable', 'admin', 'doc', 'lookup'] },
];
