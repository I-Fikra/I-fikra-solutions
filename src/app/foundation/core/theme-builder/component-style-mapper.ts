/**
 * ── Component Style Mapper ────────────────────────────────────────────────────
 * بتحوّل قيم شاشة UI Style Designer (px numbers + booleans من ComponentStyleConfig)
 * لـ Partial<PersonalityTokens> (CSS shorthand strings) عشان dialog-shell / table /
 * card / sidebar يقدروا يطبّقوها مباشرة عن طريق نفس آلية designConfig الموجودة.
 *
 * الـ fields اللي مالهاش مكان في PersonalityTokens (margin / width / table-border
 * / sidebar-*) بترجع في `extraVars` عشان تتطبق بـ element.style.setProperty يدوي.
 *
 * سيبنا subElements من غير mapping دلوقتي — محتاجة scoped classes مش CSS variable.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { ComponentStyleConfig } from '@/app/foundation/core/models/project-config.model';
import { ComponentKey } from '@/app/foundation/core/ui-style-designer/ui-style-designer.model';
import { PersonalityTokens } from './theme-personality.service';

export interface MappedComponentStyle {
  /** الـ fields اللي ليها مكان مباشر في PersonalityTokens */
  tokens: Partial<PersonalityTokens>;
  /** الـ fields اللي مفيش ليها token — تتطبق بـ setProperty على الـ element */
  extraVars: Record<string, string>;
}

// ── Shadow value ──────────────────────────────────────────────────────────────

const ELEVATION_SHADOW = '0 4px 16px rgba(0,0,0,0.18)';

// ── Font weight converter ─────────────────────────────────────────────────────

function toFontWeight(w: 'Regular' | 'Medium' | 'Bold'): string {
  return w === 'Bold' ? '700' : w === 'Medium' ? '500' : '400';
}

// ── Border string builder ─────────────────────────────────────────────────────

function toBorderString(cfg: ComponentStyleConfig): string {
  if (!cfg.border) return 'none';
  return `${cfg.borderWidth}px solid ${cfg.borderColor}`;
}

// ── Main mapper ───────────────────────────────────────────────────────────────

export function mapComponentStyleToPersonalityTokens(
  key: ComponentKey,
  cfg: ComponentStyleConfig,
): MappedComponentStyle {
  const tokens: Partial<PersonalityTokens> = {};
  const extraVars: Record<string, string> = {};

  // ── cornerRadius ────────────────────────────────────────────────────────────
  const radiusValue = `${cfg.cornerRadius}px`;
  switch (key) {
    case 'dialogs':  tokens.radiusDialog = radiusValue; break;
    case 'cards':    tokens.radiusCard   = radiusValue; break;
    case 'tables':   tokens.radiusTable  = radiusValue; break;
    default:
      extraVars[`--app-${key}-radius`] = radiusValue;
  }

  // ── elevationShadow ─────────────────────────────────────────────────────────
  const shadowValue = cfg.elevationShadow ? ELEVATION_SHADOW : 'none';
  switch (key) {
    case 'dialogs': tokens.dialogShadow = shadowValue; break;
    case 'cards':   tokens.cardShadow   = shadowValue; break;
    default:
      extraVars[`--app-${key}-shadow`] = shadowValue;
  }

  // ── internalPadding ─────────────────────────────────────────────────────────
  // فقط cards ليها cardPadding token في PersonalityTokens.
  // باقي الكومبوننتس بيتحكموا في الـ padding بطريقة تانية (PrimeNG internal).
  if (key === 'cards') {
    tokens.cardPadding = `${cfg.internalPadding}px`;
  } else {
    extraVars[`--app-${key}-padding`] = `${cfg.internalPadding}px`;
  }

  // ── border / borderWidth / borderColor ──────────────────────────────────────
  const borderValue = toBorderString(cfg);
  switch (key) {
    case 'dialogs': tokens.dialogBorder = borderValue; break;
    case 'cards':   tokens.cardBorder   = borderValue; break;
    default:
      // tables, sidebars, shapes → extraVars
      extraVars[`--app-${key}-border`]       = borderValue;
      extraVars[`--app-${key}-border-width`] = cfg.border ? `${cfg.borderWidth}px` : '0px';
      extraVars[`--app-${key}-border-color`] = cfg.borderColor;
  }

  // ── fontFamily ──────────────────────────────────────────────────────────────
  // token واحد مشترك — بيأثر على كل الـ personality مش component بس،
  // لكن ده الـ mapping الأقرب الموجود في PersonalityTokens دلوقتي.
  tokens.fontFamily = cfg.fontFamily;

  // ── fontWeight ──────────────────────────────────────────────────────────────
  tokens.headingWeight = toFontWeight(cfg.fontWeight);

  // ── externalMargin ──────────────────────────────────────────────────────────
  // مفيش token ليها في PersonalityTokens → extraVars دايماً
  extraVars[`--app-${key}-margin`] = `${cfg.externalMargin}px`;

  // ── width (standard | highlighted) ─────────────────────────────────────────
  // مفيش token ليها → extraVars
  extraVars[`--app-${key}-width`] = cfg.width === 'highlighted' ? '110%' : '100%';

  return { tokens, extraVars };
}