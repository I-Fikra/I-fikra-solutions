/**
 * ── Config Source of Truth (Phase 3) ──────────────────────────────────────────
 * THIS SERVICE backs the platform-generator wizard's branding form
 * ("builder/metadata" route, `branding.ts` component) — every field here
 * (`appName`, `logo`, `themeColor`, social links, etc.) describes the
 * GENERATED CLIENT APP being scaffolded, persisted to `localStorage` as wizard
 * draft state. Despite similarly-named fields, this is NOT this admin shell's
 * own branding (see `ProjectConfigService`, loaded from `/api/projects.json`)
 * and NOT the sidebar config (`domain.config.ts`). No overlap with either —
 * two different products' branding, not a duplicate.
 */
import {
  Injectable,
  signal,
  computed,
  PLATFORM_ID,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** A language the *generated app* (not the admin UI) can ship its content in. */
export interface AppLanguage {
  code: string;
  label: string;
  rtl: boolean;
}

/**
 * Catalog of languages the platform builder can generate apps in. The "App Languages"
 * selector on the Identity tab lets the client pick any subset of these — the wizard
 * isn't hard-wired to exactly two. Add a language by appending an entry here; every
 * `LocalizedText` field, the selector UI, and the backend payload pick it up automatically.
 */
export const SUPPORTED_APP_LANGUAGES: readonly AppLanguage[] = [
  { code: 'en', label: 'English', rtl: false },
  { code: 'ar', label: 'العربية', rtl: true },
  { code: 'fr', label: 'Français', rtl: false },
  { code: 'es', label: 'Español', rtl: false },
  { code: 'de', label: 'Deutsch', rtl: false }
];

/** A product/surface the platform builder can generate as part of the client's platform. */
export interface PlatformComponentType {
  key: string;
  label: string;
  icon: string;
  description: string;
}

/**
 * Catalog of products the platform builder can generate. The "Platform Components" step
 * lets the client pick any combination — and how many of each — they want generated
 * (e.g. "2 mobile applications" + "1 dashboard"). Add a product by appending an entry here.
 */
export const PLATFORM_COMPONENT_TYPES: readonly PlatformComponentType[] = [
  {
    key: 'mobile-app',
    label: 'Mobile Application',
    icon: 'pi-mobile',
    description: 'A native/cross-platform app for end users on iOS and Android.'
  },
  {
    key: 'landing-page',
    label: 'Landing Page',
    icon: 'pi-globe',
    description:
      'A public marketing page that introduces your product to visitors.'
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'pi-th-large',
    description: 'An admin/management web console for your internal team.'
  }
];

/**
 * How many of each `PlatformComponentType` (keyed by `PlatformComponentType.key`) the
 * generated platform should ship with. A missing key or a value of `0` means "not included".
 */
export type PlatformComponentSelection = Record<string, number>;

/** A social network the generated app can link out to (footer, about screen, …). */
export interface SocialPlatform {
  key: string;
  label: string;
  icon: string;
  placeholder: string;
}

/**
 * Catalog of social networks the client can link to from their generated app. Add a
 * platform by appending an entry here — the link list on the Social tab and the backend
 * payload pick it up automatically, no other file needs to change.
 */
export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    key: 'facebook',
    label: 'Facebook',
    icon: 'pi-facebook',
    placeholder: 'https://facebook.com/yourpage'
  },
  {
    key: 'instagram',
    label: 'Instagram',
    icon: 'pi-instagram',
    placeholder: 'https://instagram.com/yourhandle'
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    icon: 'pi-twitter',
    placeholder: 'https://x.com/yourhandle'
  },
  {
    key: 'youtube',
    label: 'YouTube',
    icon: 'pi-youtube',
    placeholder: 'https://youtube.com/@yourchannel'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: 'pi-linkedin',
    placeholder: 'https://linkedin.com/company/yourcompany'
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    icon: 'pi-tiktok',
    placeholder: 'https://tiktok.com/@yourhandle'
  }
];

/**
 * One URL per social network (keyed by `SocialPlatform.key`). A missing/empty value means
 * "not linked" — the generated app simply omits that platform's icon/link.
 */
export type SocialLinks = Record<string, string>;

const emptySocialLinks = (): SocialLinks => ({});

/**
 * Display text the generated app needs, one entry per language code (see
 * `SUPPORTED_APP_LANGUAGES`). Every field that ends up rendered to the app's end users
 * (name, titles, descriptions, social copy, …) is collected this way so the platform
 * builder can produce an app fully translated into whichever languages the client picked.
 * A missing/absent code means "not translated yet" (e.g. a language just toggled on has
 * no entry until the user types something) — always read with `text[code] ?? ''`.
 */
export type LocalizedText = Record<string, string | undefined>;

const emptyLocalized = (): LocalizedText => ({});

/**
 * An uploaded document (HTML, TXT, or DOCX), one entry per language code (see
 * `SUPPORTED_APP_LANGUAGES`) — for legal documents the generated app must show per locale
 * (privacy policy, terms of service, …). Stored as a base64 data URL, mirroring `logo`/
 * `favicon`/`ogImage`. A missing/`null` entry means "not uploaded yet" for that language.
 */
export type LocalizedDocument = Record<string, string | null>;

const emptyLocalizedDocument = (): LocalizedDocument => ({});

export interface BrandingConfig {
  // ── Platform Components ───────────────────────────────────────────────────
  /** How many of each product (key from `PLATFORM_COMPONENT_TYPES`) to generate. */
  platformComponents: PlatformComponentSelection;

  // ── Identity ──────────────────────────────────────────────────────────────
  /** Language codes (from `SUPPORTED_APP_LANGUAGES`) the generated app ships with. */
  languages: string[];
  appName: LocalizedText;
  logo: string | null;
  favicon: string | null;
  showAppName: boolean;

  // ── Metadata ──────────────────────────────────────────────────────────────
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  metaVersion: string;
  metaKeywords: LocalizedText;
  metaAuthor: LocalizedText;
  /** Optional link for the author/company name — when set, the footer copyright turns it into a clickable link. */
  authorUrl: string;
  copyrightText: LocalizedText;
  supportEmail: string;
  supportUrl: string;
  /** Privacy policy document (HTML, TXT, or DOCX), optional, one upload per language the app ships with. */
  privacyPolicyDocument: LocalizedDocument;
  /** Terms of service document (HTML, TXT, or DOCX), optional, one upload per language the app ships with. */
  termsDocument: LocalizedDocument;

  // ── Social / OG ───────────────────────────────────────────────────────────
  siteUrl: string;
  ogTitle: LocalizedText;
  ogDescription: LocalizedText;
  ogImage: string | null;
  /** One URL per social network (key from `SOCIAL_PLATFORMS`); empty/absent = not linked. */
  socialLinks: SocialLinks;

  // ── PWA / Install ─────────────────────────────────────────────────────────
  shortName: LocalizedText;
  themeColor: string;
  backgroundColor: string;
}

/**
 * Shape `LocalizedText` takes in the backend payload: it always carries one entry per
 * language in `SUPPORTED_APP_LANGUAGES` (a stable shape the backend can rely on), but a
 * language the app doesn't ship with (per `BrandingConfig.languages`) is sent as `null`
 * rather than an empty string, so the backend can tell "not applicable" apart from
 * "translated but left blank".
 */
export type LocalizedTextPayload = Record<string, string | null>;

/**
 * Shape `LocalizedDocument` takes in the backend payload — structurally the same, but (like
 * `LocalizedTextPayload`) it is normalized to always carry one entry per
 * `SUPPORTED_APP_LANGUAGES` code, with a language the app doesn't ship with sent as `null`.
 */
export type LocalizedDocumentPayload = Record<string, string | null>;

/**
 * Backend payload shape for `BrandingConfig`: identical to the form shape, except every
 * `LocalizedText`/`LocalizedDocument` field is normalized to one entry per catalog language
 * (see `BrandingService.buildApiPayload`).
 */
export type BrandingPayload = {
  [K in keyof BrandingConfig]: BrandingConfig[K] extends LocalizedText
    ? LocalizedTextPayload
    : BrandingConfig[K] extends LocalizedDocument
      ? LocalizedDocumentPayload
      : BrandingConfig[K];
};

const STORAGE_KEY = 'app_branding_v3';

const DEFAULTS: BrandingConfig = {
  platformComponents: {},

  languages: ['en', 'ar'],
  appName: emptyLocalized(),
  logo: null,
  favicon: null,
  showAppName: true,

  metaTitle: emptyLocalized(),
  metaDescription: emptyLocalized(),
  metaVersion: '1.0.0',
  metaKeywords: emptyLocalized(),
  metaAuthor: emptyLocalized(),
  authorUrl: '',
  copyrightText: emptyLocalized(),
  supportEmail: '',
  supportUrl: '',
  privacyPolicyDocument: emptyLocalizedDocument(),
  termsDocument: emptyLocalizedDocument(),

  siteUrl: '',
  ogTitle: emptyLocalized(),
  ogDescription: emptyLocalized(),
  ogImage: null,
  socialLinks: emptySocialLinks(),

  shortName: emptyLocalized(),
  themeColor: '#0ea5e9',
  backgroundColor: '#ffffff'
};

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _config = signal<BrandingConfig>(this._load());

  readonly appName = computed<LocalizedText>(() =>
    this._mergeLocalized(this._config().appName, DEFAULTS.appName)
  );
  readonly logo = computed(() => this._config().logo);
  readonly favicon = computed(() => this._config().favicon);
  readonly hasLogo = computed(() => !!this._config().logo);
  readonly showAppName = computed(() => this._config().showAppName ?? true);
  readonly metaTitle = computed<LocalizedText>(() =>
    this._mergeLocalized(this._config().metaTitle, this.appName())
  );
  readonly themeColor = computed(
    () => this._config().themeColor || DEFAULTS.themeColor
  );
  readonly shortName = computed<LocalizedText>(() =>
    this._mergeLocalized(this._config().shortName, this.appName())
  );

  /** Full snapshot for forms */
  readonly config = computed(() => this._config());

  save(config: BrandingConfig): void {
    this._config.set({ ...config });
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }

  update(partial: Partial<BrandingConfig>): void {
    this.save({ ...this._config(), ...partial });
  }

  /**
   * Builds the payload to send to the backend: every `LocalizedText` field is expanded to
   * one entry per `SUPPORTED_APP_LANGUAGES` code, with the language(s) the app doesn't ship
   * with (per `config.languages`) set to `null` instead of an empty string.
   */
  buildApiPayload(config: BrandingConfig = this._config()): BrandingPayload {
    const localize = (value: LocalizedText) =>
      this._toLocalizedPayload(value, config.languages);
    const localizeDocument = (value: LocalizedDocument) =>
      this._toLocalizedDocumentPayload(value, config.languages);
    return {
      ...config,
      appName: localize(config.appName),
      metaTitle: localize(config.metaTitle),
      metaDescription: localize(config.metaDescription),
      metaKeywords: localize(config.metaKeywords),
      metaAuthor: localize(config.metaAuthor),
      copyrightText: localize(config.copyrightText),
      ogTitle: localize(config.ogTitle),
      ogDescription: localize(config.ogDescription),
      shortName: localize(config.shortName),
      privacyPolicyDocument: localizeDocument(config.privacyPolicyDocument),
      termsDocument: localizeDocument(config.termsDocument)
    };
  }

  /** Falls back per-language: an empty value for a code is filled in from `fallback`. */
  private _mergeLocalized(
    value: LocalizedText,
    fallback: LocalizedText
  ): LocalizedText {
    const merged: LocalizedText = {};
    for (const code of new Set([
      ...Object.keys(fallback),
      ...Object.keys(value)
    ])) {
      merged[code] = value[code] || fallback[code] || '';
    }
    return merged;
  }

  /** A language not in `languages` is sent as `null` rather than an empty string. */
  private _toLocalizedPayload(
    value: LocalizedText,
    languages: string[]
  ): LocalizedTextPayload {
    const payload: LocalizedTextPayload = {};
    for (const lang of SUPPORTED_APP_LANGUAGES) {
      payload[lang.code] = languages.includes(lang.code)
        ? (value[lang.code] ?? '')
        : null;
    }
    return payload;
  }

  /** A language not in `languages` (or one with nothing uploaded) is sent as `null`. */
  private _toLocalizedDocumentPayload(
    value: LocalizedDocument,
    languages: string[]
  ): LocalizedDocumentPayload {
    const payload: LocalizedDocumentPayload = {};
    for (const lang of SUPPORTED_APP_LANGUAGES) {
      payload[lang.code] = languages.includes(lang.code)
        ? (value[lang.code] ?? null)
        : null;
    }
    return payload;
  }

  private _load(): BrandingConfig {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return { ...DEFAULTS };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      const parsed = JSON.parse(raw) as Partial<BrandingConfig>;
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }
}
