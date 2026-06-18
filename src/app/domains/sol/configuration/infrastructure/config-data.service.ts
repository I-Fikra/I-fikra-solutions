/**
 * ── Config Source of Truth (Phase 3) ──────────────────────────────────────────
 * THIS SERVICE is the static catalog of DDD domains/modules/features the
 * platform-generator wizard ("builder/generator" route, `domains.ts`
 * component) lets a user pick from to scaffold a brand-new backend/project.
 * It is mock/seed data for the wizard's checklist UI — entirely unrelated to
 * this admin app's own sidebar (`DOMAINS` in `domain.config.ts`) or its own
 * branding (`ProjectConfigService`). No overlap, nothing to consolidate.
 */
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfigSubOption {
  key: string;
  label: string;
  icon: string;
}

export interface ConfigFeature {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
  required?: boolean;         // Cannot be toggled off
  subOptions?: ConfigSubOption[];
  selectedSubOptions?: string[];
}

export interface ConfigModule {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  domain: string;             // DDD domain (e.g. 'iam')
  selected: boolean;
  features: ConfigFeature[];
}

export interface ConfigTranslations {
  pageTitle: string;
  searchPlaceholder: string;
  confirm: string;
  loading: string;
}

export interface ConfigData {
  translations: ConfigTranslations;
  modules: ConfigModule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ConfigDataService {

  getData$(): Observable<ConfigData> {
    return of(this.buildData()).pipe(delay(300));
  }

  // ───────────────────────────────────────────────────────────────────────────
  private buildData(): ConfigData {
    return {
      translations: {
        pageTitle: 'Project Configuration',
        searchPlaceholder: 'Search modules…',
        confirm: 'Generate Project',
        loading: 'Loading configuration…',
      },
      modules: [
        this.iamIdentityModule(),
        this.iamAuthModule(),
        this.iamRolesModule(),
        this.organizationsModule(),
        this.notificationsModule(),
        this.paymentsModule(),
        this.auditModule(),
        this.localizationModule(),
        this.storageModule(),
        this.analyticsModule(),
      ]
    };
  }

  // ── IAM › Identity ──────────────────────────────────────────────────────────
  private iamIdentityModule(): ConfigModule {
    return {
      key: 'iam-identity',
      label: 'Users & Identity',
      description: 'Core user entity, profiles, and account lifecycle',
      icon: 'pi pi-users',
      color: '#6366f1',
      domain: 'iam',
      selected: true,
      features: [

        // ── Identity & Contact ──────────────────────────────────────────────
        {
          key: 'identity-core',
          label: 'Core Identity',
          description: 'id · username · state (aggregate root)',
          enabled: true,
          required: true,
        },
        {
          key: 'contact-email',
          label: 'Email Address',
          description: 'Primary email with verification flag (isValueObject)',
          enabled: true,
          subOptions: [
            { key: 'emailVerified',     label: 'Verified flag',   icon: 'pi pi-check-circle' },
          ],
          selectedSubOptions: ['emailVerified'],
        },
        {
          key: 'contact-phone',
          label: 'Phone Number',
          description: 'E.164 phone number with verification flag',
          enabled: true,
          subOptions: [
            { key: 'phoneNumberVerified', label: 'Verified flag', icon: 'pi pi-check-circle' },
          ],
          selectedSubOptions: ['phoneNumberVerified'],
        },

        // ── Identity Documents ──────────────────────────────────────────────
        {
          key: 'identity-documents',
          label: 'Identity Documents',
          description: 'KYC / government-issued document numbers',
          enabled: false,
          subOptions: [
            { key: 'nationalId',      label: 'National ID',      icon: 'pi pi-id-card' },
            { key: 'passportNumber',  label: 'Passport Number',  icon: 'pi pi-send'    },
          ],
          selectedSubOptions: [],
        },

        // ── Profile ─────────────────────────────────────────────────────────
        {
          key: 'profile-names',
          label: 'Multilingual Names',
          description: 'firstName / lastName / fullName per language',
          enabled: true,
          subOptions: [
            { key: 'en', label: 'English', icon: 'pi pi-flag' },
            { key: 'ar', label: 'Arabic',  icon: 'pi pi-flag' },
            { key: 'fr', label: 'French',  icon: 'pi pi-flag' },
            { key: 'tr', label: 'Turkish', icon: 'pi pi-flag' },
            { key: 'de', label: 'German',  icon: 'pi pi-flag' },
            { key: 'es', label: 'Spanish', icon: 'pi pi-flag' },
          ],
          selectedSubOptions: ['en', 'ar'],
        },
        {
          key: 'profile-media',
          label: 'Profile Media',
          description: 'avatarUrl · thumbnailUrl · coverImageUrl',
          enabled: true,
          subOptions: [
            { key: 'avatarUrl',      label: 'Avatar',       icon: 'pi pi-image' },
            { key: 'thumbnailUrl',   label: 'Thumbnail',    icon: 'pi pi-image' },
            { key: 'coverImageUrl',  label: 'Cover Image',  icon: 'pi pi-image' },
          ],
          selectedSubOptions: ['avatarUrl', 'thumbnailUrl'],
        },

        // ── Location ────────────────────────────────────────────────────────
        {
          key: 'location',
          label: 'Location',
          description: 'locationId · countryCode · nationality · city · postalCode · address',
          enabled: false,
          subOptions: [
            { key: 'countryCode',  label: 'Country Code',  icon: 'pi pi-globe'  },
            { key: 'nationality',  label: 'Nationality',   icon: 'pi pi-globe'  },
            { key: 'city',         label: 'City',          icon: 'pi pi-building'},
            { key: 'postalCode',   label: 'Postal Code',   icon: 'pi pi-inbox'  },
            { key: 'address',      label: 'Full Address',  icon: 'pi pi-map'    },
          ],
          selectedSubOptions: [],
        },

        // ── Preferences ─────────────────────────────────────────────────────
        {
          key: 'preferences',
          label: 'User Preferences',
          description: 'preferredLanguage · preferredTheme · timezone',
          enabled: true,
          subOptions: [
            { key: 'preferredLanguage', label: 'Language', icon: 'pi pi-language'   },
            { key: 'preferredTheme',    label: 'Theme',    icon: 'pi pi-palette'    },
            { key: 'timezone',          label: 'Timezone', icon: 'pi pi-clock'      },
          ],
          selectedSubOptions: ['preferredLanguage', 'preferredTheme', 'timezone'],
        },

        // ── Multi-Tenancy ────────────────────────────────────────────────────
        {
          key: 'multi-tenancy',
          label: 'Multi-Tenancy',
          description: 'tenantId foreign-key — null for super-admin users',
          enabled: true,
        },

        // ── Soft-Delete / Audit ──────────────────────────────────────────────
        {
          key: 'soft-delete',
          label: 'Soft Delete',
          description: 'deletedAt · deletedBy (isSoftDelete = true)',
          enabled: true,
          required: true,
        },
        {
          key: 'audit-fields',
          label: 'Audit Fields',
          description: 'createdBy · createdAt · updatedBy · updatedAt (isAuditable = true)',
          enabled: true,
          required: true,
        },
      ]
    };
  }

  // ── IAM › Authentication ────────────────────────────────────────────────────
  private iamAuthModule(): ConfigModule {
    return {
      key: 'iam-auth',
      label: 'Authentication',
      description: 'All auth strategies: password, OTP, tokens, MFA, social, biometric',
      icon: 'pi pi-lock',
      color: '#f59e0b',
      domain: 'iam',
      selected: true,
      features: [

        // ── Password ────────────────────────────────────────────────────────
        {
          key: 'auth-password',
          label: 'Password Authentication',
          description: 'passwordHash (argon2id) · passwordChangedAt',
          enabled: true,
          subOptions: [
            { key: 'passwordResetToken', label: 'Password Reset Flow', icon: 'pi pi-key' },
          ],
          selectedSubOptions: ['passwordResetToken'],
        },

        // ── OTP ─────────────────────────────────────────────────────────────
        {
          key: 'auth-otp',
          label: 'OTP (One-Time Password)',
          description: 'otpCode · otpMethod · otpExpiresAt · otpAttempts · otpLastSentAt',
          enabled: true,
          subOptions: [
            { key: 'sms',   label: 'SMS',   icon: 'pi pi-mobile'   },
            { key: 'email', label: 'Email', icon: 'pi pi-envelope' },
            { key: 'voice', label: 'Voice', icon: 'pi pi-phone'    },
          ],
          selectedSubOptions: ['sms', 'email'],
        },

        // ── Token-Based ─────────────────────────────────────────────────────
        {
          key: 'auth-tokens',
          label: 'Access & Refresh Tokens',
          description: 'accessToken · accessTokenExpiresAt · refreshToken · rotation tracking',
          enabled: true,
          subOptions: [
            { key: 'refreshTokenRotation', label: 'Token Rotation',    icon: 'pi pi-sync'  },
            { key: 'apiKey',               label: 'API Key (M2M)',      icon: 'pi pi-key'   },
            { key: 'personalAccessTokens', label: 'Personal PATs',     icon: 'pi pi-key'   },
          ],
          selectedSubOptions: ['refreshTokenRotation'],
        },

        // ── Magic Link ──────────────────────────────────────────────────────
        {
          key: 'auth-magic-link',
          label: 'Magic Link (Passwordless)',
          description: 'magicLinkToken · magicLinkTokenExpiresAt · magicLinkSentAt',
          enabled: false,
        },

        // ── MFA ─────────────────────────────────────────────────────────────
        {
          key: 'auth-mfa',
          label: 'Multi-Factor Authentication',
          description: 'mfaEnabled · mfaMethod · mfaSecret (encrypted) · backupCodes · recoveryEmail',
          enabled: true,
          subOptions: [
            { key: 'totp',         label: 'TOTP (Authenticator)', icon: 'pi pi-shield' },
            { key: 'sms',          label: 'SMS',                  icon: 'pi pi-mobile' },
            { key: 'email',        label: 'Email',                icon: 'pi pi-envelope'},
            { key: 'backup-codes', label: 'Backup Codes',         icon: 'pi pi-copy'   },
            { key: 'push',         label: 'Push Notification',    icon: 'pi pi-bell'   },
          ],
          selectedSubOptions: ['totp', 'backup-codes'],
        },

        // ── Social / OAuth ───────────────────────────────────────────────────
        {
          key: 'auth-social',
          label: 'Social / OAuth Providers',
          description: 'socialProviders JSON array — encrypted access & refresh tokens per provider',
          enabled: false,
          subOptions: [
            { key: 'google',    label: 'Google',    icon: 'pi pi-google'   },
            { key: 'github',    label: 'GitHub',    icon: 'pi pi-github'   },
            { key: 'facebook',  label: 'Facebook',  icon: 'pi pi-facebook' },
            { key: 'apple',     label: 'Apple',     icon: 'pi pi-apple'    },
            { key: 'microsoft', label: 'Microsoft', icon: 'pi pi-microsoft'},
            { key: 'linkedin',  label: 'LinkedIn',  icon: 'pi pi-linkedin' },
            { key: 'twitter-x', label: 'X / Twitter', icon: 'pi pi-twitter'},
            { key: 'slack',     label: 'Slack',     icon: 'pi pi-slack'    },
            { key: 'discord',   label: 'Discord',   icon: 'pi pi-discord'  },
          ],
          selectedSubOptions: [],
        },

        // ── Biometric / WebAuthn ────────────────────────────────────────────
        {
          key: 'auth-biometric',
          label: 'Biometric / WebAuthn (FIDO2)',
          description: 'biometricEnabled · biometricCredentials (public key only) · biometricLastUsedAt',
          enabled: false,
        },

        // ── Security ─────────────────────────────────────────────────────────
        {
          key: 'auth-brute-force',
          label: 'Brute-Force Protection',
          description: 'failedLoginAttempts · lockedUntil — auto-lock on threshold breach',
          enabled: true,
        },
        {
          key: 'auth-session-audit',
          label: 'Session Audit',
          description: 'lastLoginAt · lastLoginIp · lastLoginMethod · suspensionReason',
          enabled: true,
          subOptions: [
            { key: 'lastLoginIp',     label: 'Login IP',     icon: 'pi pi-server'  },
            { key: 'lastLoginMethod', label: 'Auth Method',  icon: 'pi pi-key'     },
            { key: 'suspensionReason',label: 'Suspension Reason', icon: 'pi pi-ban'},
          ],
          selectedSubOptions: ['lastLoginIp', 'lastLoginMethod'],
        },
      ]
    };
  }

  // ── IAM › Roles & Permissions ───────────────────────────────────────────────
  private iamRolesModule(): ConfigModule {
    return {
      key: 'iam-roles',
      label: 'Roles & Permissions',
      description: 'RBAC / ABAC role assignments and permission grants',
      icon: 'pi pi-shield',
      color: '#10b981',
      domain: 'iam',
      selected: true,
      features: [
        {
          key: 'roles-rbac',
          label: 'Role-Based Access Control (RBAC)',
          description: 'User → Role → Permission mapping',
          enabled: true,
        },
        {
          key: 'roles-abac',
          label: 'Attribute-Based Access Control (ABAC)',
          description: 'Policy-driven access using entity attributes',
          enabled: false,
        },
        {
          key: 'roles-tenant-scoped',
          label: 'Tenant-Scoped Roles',
          description: 'Roles isolated per tenant in multi-tenant setup',
          enabled: true,
        },
        {
          key: 'roles-super-admin',
          label: 'Super Admin Role',
          description: 'Global cross-tenant administrative role (tenantId = null)',
          enabled: true,
        },
        {
          key: 'roles-permission-groups',
          label: 'Permission Groups',
          description: 'Bundle permissions into reusable groups',
          enabled: false,
        },
      ]
    };
  }

  // ── Organizations ───────────────────────────────────────────────────────────
  private organizationsModule(): ConfigModule {
    return {
      key: 'organizations',
      label: 'Organizations',
      description: 'Tenant / organization hierarchy and membership management',
      icon: 'pi pi-building',
      color: '#3b82f6',
      domain: 'organization',
      selected: false,
      features: [
        {
          key: 'org-tenants',
          label: 'Tenants',
          description: 'Top-level tenant entity referenced by user.tenantId',
          enabled: true,
        },
        {
          key: 'org-departments',
          label: 'Departments',
          description: 'Sub-units within a tenant',
          enabled: false,
        },
        {
          key: 'org-membership',
          label: 'Membership & Invitations',
          description: 'Invite flows and member lifecycle management',
          enabled: true,
        },
        {
          key: 'org-hierarchy',
          label: 'Hierarchical Units',
          description: 'Parent/child org-unit tree',
          enabled: false,
        },
        {
          key: 'org-branding',
          label: 'Tenant Branding',
          description: 'Logo, colors, and custom domain per tenant',
          enabled: false,
        },
      ]
    };
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  private notificationsModule(): ConfigModule {
    return {
      key: 'notifications',
      label: 'Notifications',
      description: 'Multi-channel notification delivery and preference management',
      icon: 'pi pi-bell',
      color: '#f97316',
      domain: 'notification',
      selected: false,
      features: [
        {
          key: 'notif-email',
          label: 'Email Notifications',
          description: 'Transactional and marketing email delivery',
          enabled: true,
        },
        {
          key: 'notif-sms',
          label: 'SMS Notifications',
          description: 'SMS delivery via gateway providers',
          enabled: false,
        },
        {
          key: 'notif-push',
          label: 'Push Notifications',
          description: 'Web and mobile push via FCM / APNs',
          enabled: false,
        },
        {
          key: 'notif-in-app',
          label: 'In-App Notifications',
          description: 'Real-time notification feed inside the app',
          enabled: true,
        },
        {
          key: 'notif-preferences',
          label: 'User Notification Preferences',
          description: 'Per-channel opt-in/out preferences',
          enabled: true,
        },
        {
          key: 'notif-templates',
          label: 'Notification Templates',
          description: 'Multilingual template management (en · ar · fr · tr · de · es)',
          enabled: false,
        },
      ]
    };
  }

  // ── Payments ────────────────────────────────────────────────────────────────
  private paymentsModule(): ConfigModule {
    return {
      key: 'payments',
      label: 'Payments',
      description: 'Billing, subscriptions, and payment method management',
      icon: 'pi pi-credit-card',
      color: '#8b5cf6',
      domain: 'payment',
      selected: false,
      features: [
        {
          key: 'pay-subscriptions',
          label: 'Subscriptions',
          description: 'Plan-based recurring billing',
          enabled: true,
        },
        {
          key: 'pay-invoices',
          label: 'Invoices',
          description: 'Invoice generation and history',
          enabled: true,
        },
        {
          key: 'pay-methods',
          label: 'Payment Methods',
          description: 'Stored cards, wallets, and bank accounts',
          enabled: false,
        },
        {
          key: 'pay-wallets',
          label: 'Wallets & Credits',
          description: 'Internal credit balance per user/tenant',
          enabled: false,
        },
        {
          key: 'pay-webhooks',
          label: 'Payment Webhooks',
          description: 'Gateway event ingestion (Stripe, HyperPay, etc.)',
          enabled: false,
        },
      ]
    };
  }

  // ── Audit Log ───────────────────────────────────────────────────────────────
  private auditModule(): ConfigModule {
    return {
      key: 'audit',
      label: 'Audit Log',
      description: 'Immutable event log for security and compliance',
      icon: 'pi pi-history',
      color: '#64748b',
      domain: 'audit',
      selected: false,
      features: [
        {
          key: 'audit-entity-events',
          label: 'Entity Change Events',
          description: 'Before/after snapshots for all aggregate mutations',
          enabled: true,
        },
        {
          key: 'audit-auth-events',
          label: 'Auth Events',
          description: 'Login · logout · MFA · password-reset · token-rotation',
          enabled: true,
        },
        {
          key: 'audit-admin-events',
          label: 'Admin Events',
          description: 'Suspension · deletion · role changes by admins',
          enabled: true,
        },
        {
          key: 'audit-export',
          label: 'Audit Export',
          description: 'CSV / JSON export for compliance reports',
          enabled: false,
        },
        {
          key: 'audit-retention',
          label: 'Retention Policy',
          description: 'Configurable TTL and archiving strategy',
          enabled: false,
        },
      ]
    };
  }

  // ── Localization ─────────────────────────────────────────────────────────────
  private localizationModule(): ConfigModule {
    return {
      key: 'localization',
      label: 'Localization',
      description: 'i18n infrastructure aligned with Transloco (en · ar · fr · tr · de · es)',
      icon: 'pi pi-language',
      color: '#06b6d4',
      domain: 'localization',
      selected: false,
      features: [
        {
          key: 'l10n-transloco',
          label: 'Transloco Integration',
          description: 'Angular Transloco loader and scope configuration',
          enabled: true,
        },
        {
          key: 'l10n-rtl',
          label: 'RTL Support',
          description: 'Bidirectional layout switching for Arabic and similar locales',
          enabled: true,
        },
        {
          key: 'l10n-locale-detection',
          label: 'Locale Auto-Detection',
          description: 'Detect from browser · user preference · Accept-Language header',
          enabled: true,
        },
        {
          key: 'l10n-date-number',
          label: 'Date & Number Formatting',
          description: 'Locale-aware pipes for dates, currencies, and numbers',
          enabled: true,
        },
      ]
    };
  }

  // ── Storage ──────────────────────────────────────────────────────────────────
  private storageModule(): ConfigModule {
    return {
      key: 'storage',
      label: 'File Storage',
      description: 'User uploads, media management, and CDN integration',
      icon: 'pi pi-folder',
      color: '#84cc16',
      domain: 'storage',
      selected: false,
      features: [
        {
          key: 'storage-avatars',
          label: 'Avatar / Profile Images',
          description: 'Handles avatarUrl · thumbnailUrl · coverImageUrl from the user entity',
          enabled: true,
        },
        {
          key: 'storage-documents',
          label: 'Document Uploads',
          description: 'KYC documents tied to nationalId · passportNumber',
          enabled: false,
        },
        {
          key: 'storage-cdn',
          label: 'CDN Integration',
          description: 'Signed URL generation and cache invalidation',
          enabled: false,
        },
        {
          key: 'storage-resize',
          label: 'Image Resizing',
          description: 'Auto-generate thumbnails on upload',
          enabled: false,
        },
      ]
    };
  }

  // ── Analytics ────────────────────────────────────────────────────────────────
  private analyticsModule(): ConfigModule {
    return {
      key: 'analytics',
      label: 'Analytics',
      description: 'Usage tracking, session insights, and reporting dashboards',
      icon: 'pi pi-chart-bar',
      color: '#ec4899',
      domain: 'analytics',
      selected: false,
      features: [
        {
          key: 'analytics-user-activity',
          label: 'User Activity Tracking',
          description: 'Correlates lastLoginAt · lastLoginIp · lastLoginMethod from user entity',
          enabled: true,
        },
        {
          key: 'analytics-auth-events',
          label: 'Auth Funnel Analytics',
          description: 'Registration, activation, and drop-off rates',
          enabled: true,
        },
        {
          key: 'analytics-dashboards',
          label: 'Admin Dashboards',
          description: 'Pre-built widgets for user counts, state distribution, MFA adoption',
          enabled: false,
        },
        {
          key: 'analytics-export',
          label: 'Report Export',
          description: 'CSV / PDF reporting',
          enabled: false,
        },
      ]
    };
  }
}