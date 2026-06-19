# كتالوج الحقول الموحّد — ProjectConfigInput (Wizard)

> المصدر: `wizard/src/app/foundation/core/models/project-config.model.ts`
> الهدف: قائمة نهائية واحدة بكل الحقول الموجودة فعليًا، تستخدم كمدخل مباشر لكتابة
> `project-config.schema.json` في الخطوة التالية. أي حقل هنا = حقل في الـ schema.

---

## 1. Branding — مستوى أعلى مباشر (top-level)

| الحقل | النوع | مطلوب؟ | ملاحظة |
|---|---|---|---|
| `id` | string | ✅ مطلوب | معرّف المشروع |
| `projectName` | string | ✅ مطلوب | اسم المشروع |
| `websiteTitle` | string | ✅ مطلوب | عنوان التاب في المتصفح |
| `primaryColor` | string | ✅ مطلوب | hex أو rgb، مثال `#D94452` |
| `logoSvg` | string | اختياري | SVG خام، بيدعم CSS variables |
| `logoSvgDark` | string | اختياري | نسخة الـ dark mode من اللوجو |

⚠️ **ملاحظة هامة:** `ProjectConfig` (الـ runtime model، مختلف عن `ProjectConfigInput`)
فيه حقلين زيادة: `faviconSvg` و `isDefault` — غير موجودين في `ProjectConfigInput`
الحالي. **قرار مطلوب:** هل ندخلهم في الـ schema الجديد ولا يفضلوا internal بس؟

---

## 2. Colors — حقل اختياري `colors` على المستوى الأعلى

⚠️ **ملاحظة من الكود نفسه:** الكومنت في الموديل بيقول إن الأصل كان مفروض تتنقل
جوه `style.colors`، لكن ده لسه ماتنفذش، وهي فعليًا شغالة top-level. **قرار مطلوب**
في الخطوة الجاية: نثبتها top-level ولا ننقلها تحت `style`؟ (الكتالوج ده بيوثّق
الوضع الحالي زي ما هو شغال فعليًا.)

| الحقل | النوع | ملاحظة |
|---|---|---|
| `colors.primary` | string اختياري | seed hex بيقود الـ palette |
| `colors.light` | `ColorZoneTokens` اختياري | overrides لمود النور |
| `colors.dark` | `ColorZoneTokens` اختياري | overrides لمود الليل |

### `ColorZoneTokens` (17 حقل، كلهم اختياريين، كلهم string):

| المجموعة | الحقول |
|---|---|
| Topbar | `topbarBg`, `topbarColor`, `topbarBorder`, `topbarShadow` |
| Sidebar | `sidebarBg`, `sidebarActiveColor` |
| Body | `bodyBg`, `bodyColor`, `textOverride` |
| Card | `cardBg`, `cardBorder`, `cardShadow` |
| Dialog | `dialogHeaderBg`, `dialogHeaderColor`, `dialogBorder`, `dialogShadow` |
| Table | `tableHeaderBg`, `tableHoverBg` |
| عام | `accentOverride` |

---

## 3. Style — حقل اختياري `style` على المستوى الأعلى

`ProjectStyleConfig` = 7 مكونات، كل واحد اختياري:

### 3.1 `style.table` → `TableStyleConfig`
| الحقل | النوع |
|---|---|
| `style` | enum: `default \| striped \| bordered \| minimal` |
| `headerStyle` | enum: `filled \| gradient \| minimal` |
| `rowSeparator` | enum: `none \| thin \| thick \| colored` |
| `columnSeparator` | boolean |
| `rowHeight` | enum: `compact \| normal \| spacious` |
| `shape` | `ComponentShape` (مشترك، شوف 3.8) |
| `advanced` | `ComponentStyleConfig` (مشترك، شوف 3.9) |

### 3.2 `style.dialog` → `DialogStyleConfig`
| الحقل | النوع |
|---|---|
| `style` | enum: `flat \| accent-header \| gradient-header \| outlined` |
| `headerHeight` | enum: `compact \| normal \| tall` |
| `overlayOpacity` | enum: `light \| medium \| dark` |
| `animation` | enum: `fade \| slide \| zoom` |
| `shape` | `ComponentShape` |
| `advanced` | `ComponentStyleConfig` |

### 3.3 `style.card` → `CardStyleConfig`
| الحقل | النوع |
|---|---|
| `style` | enum: `elevated \| bordered \| flat \| glass` |
| `shape` | `ComponentShape` |
| `advanced` | `ComponentStyleConfig` |

### 3.4 `style.topbar` → `TopbarStyleConfig`
| الحقل | النوع |
|---|---|
| `height` | enum: `compact \| normal \| tall` |
| `border` | enum: `none \| thin \| shadow` |
| `logoStyle` | enum: `icon-text \| icon-only \| text-only \| hidden` |
| `navAlign` | enum: `left \| center \| right` |
| `navStyle` | enum: `links \| pills \| underline \| buttons` |
| `showLang` | boolean |
| `showTheme` | boolean |
| `showConfig` | boolean |
| `showSearch` | boolean |
| `showNotif` | boolean |

⚠️ **بدون `advanced`** — الكومنت في الكود بيقول إن `topbar` لسه مش ComponentKey
معترف بيه في `ui-style-designer` (بس `tables | sidebars | cards | dialogs | shapes`).
**قرار مطلوب:** نضيفه كـ component key سادس ولا نسيبه كده؟

### 3.5 `style.sidebar` → `SidebarStyleConfig`
| الحقل | النوع |
|---|---|
| `width` | enum: `narrow \| normal \| wide` |
| `iconsOnly` | boolean |
| `advanced` | `ComponentStyleConfig` |

### 3.6 `style.button` → `ButtonStyleConfig`
| الحقل | النوع |
|---|---|
| `size` | enum: `sm \| md \| lg` |
| `shadow` | enum: `none \| soft \| lifted` |
| `shape` | `ComponentShape` |

⚠️ **بدون `advanced` كمان** — نفس ملحوظة الـ topbar، الكود بيقول `button` مش
ComponentKey مستقل دلوقتي وممكن يكون نفس `shapes`. **قرار مطلوب** هنا كمان.

### 3.7 `style.login` → `LoginStyleConfig`
| الحقل | النوع |
|---|---|
| `layout` | enum: `centered \| split \| fullscreen` |
| `bg` | enum: `solid \| gradient \| image` |
| `bgColor` | string |
| `bgGradientFrom` | string |
| `bgGradientTo` | string |
| `logoPos` | enum: `top \| left \| hidden` |

### 3.8 النوع المشترك `ComponentShape` (مستخدم في table/dialog/card/button)
`enum: sharp | rounded | soft | pill`

### 3.9 النوع المشترك `ComponentStyleConfig` (الحقل `advanced` في table/dialog/card/sidebar)
| الحقل | النوع |
|---|---|
| `cornerRadius` | number |
| `elevationShadow` | boolean |
| `width` | enum: `standard \| highlighted` |
| `internalPadding` | number |
| `border` | boolean |
| `borderWidth` | number |
| `borderColor` | string |
| `externalMargin` | number |
| `fontFamily` | string (قائمة مقترحة في `FONT_FAMILIES`، شوف القسم 5) |
| `fontWeight` | enum: `Regular \| Medium \| Bold` |
| `subElements` | object: مفاتيحه من `SubElementKey`، قيمته `SubElementStyle` |

### 3.10 `SubElementKey` (enum)
`title | body | footer | header | row | content`

### 3.11 `SubElementStyle` (شكل كل قيمة جوه `subElements`)
| الحقل | النوع |
|---|---|
| `fontFamily` | string |
| `fontSize` | number |
| `fontWeight` | enum: `Regular \| Medium \| Bold` |
| `fontColor` | string |
| `textAlign` | enum: `left \| center \| right \| justify` |

---

## 4. Structure — حقل مطلوب `domains` على المستوى الأعلى

`domains: ConfigInputDomain[]` (مطلوب، مصفوفة)

### 4.1 `ConfigInputDomain`
| الحقل | النوع | مطلوب؟ |
|---|---|---|
| `id` | string | ✅ |
| `label` | string | ✅ |
| `enabled` | boolean | اختياري (default: true) |
| `modules` | `ConfigInputModule[]` | ✅ |

### 4.2 `ConfigInputModule`
| الحقل | النوع | مطلوب؟ |
|---|---|---|
| `id` | string | ✅ |
| `label` | string | ✅ |
| `icon` | string | اختياري |
| `apiUrl` | string | ✅ |
| `fallbackJsonAr` | string | اختياري |
| `fallbackJsonEn` | string | اختياري |
| `idField` | string | اختياري (default: `"id"`) |
| `actions.create` | boolean | اختياري (default: true) |
| `actions.edit` | boolean | اختياري (default: true) |
| `actions.view` | boolean | اختياري (default: true) |
| `actions.delete` | boolean | اختياري (default: true) |
| `enabled` | boolean | اختياري (default: true) |
| `subModules` | `ConfigInputSubModule[]` | اختياري |

### 4.3 `ConfigInputSubModule`
| الحقل | النوع | مطلوب؟ |
|---|---|---|
| `id` | string | ✅ |
| `label` | string | ✅ |
| `icon` | string | اختياري |
| `path` | string | ✅ |
| `enabled` | boolean | اختياري (default: true) |

---

## 5. ثوابت مساعدة (Defaults / Enums) — مش حقول، لكن لازمة للـ schema

| الثابت | الاستخدام |
|---|---|
| `FONT_FAMILIES` | قائمة الخطوط المسموحة لـ `ComponentStyleConfig.fontFamily` و `SubElementStyle.fontFamily`: `Geometric Sans, Inter, Lato, Cairo, Roboto, Open Sans, Nunito, Source Sans 3, Georgia, JetBrains Mono` |
| `DEFAULT_SUB_ELEMENT_STYLE` | القيمة الافتراضية لو الحقل مش موجود في `subElements` |
| `DEFAULT_COMPONENT_STYLE` | القيمة الافتراضية لو `advanced` مش موجود |

---

## 6. قرارات معلّقة (لازم تتحسم قبل كتابة الـ schema في الخطوة الجاية)

1. هل `colors` تفضل top-level ولا تتنقل جوه `style.colors`؟
2. هل نضيف `faviconSvg` و `isDefault` لـ `ProjectConfigInput` (موجودين بس في الـ runtime model)؟
3. هل `topbar` و `button` ياخدوا حقل `advanced` زي باقي الخمسة، ولا يفضلوا مستثنيين؟

---

## الخلاصة بالأرقام

- **6** حقول Branding (top-level)
- **1** حقل colors (اختياري) يحتوي 17 + 17 = **34** color token
- **7** مكونات style، فيهم إجمالي **~45** حقل فريد (بما فيهم الأنواع المشتركة)
- **3** مستويات structure متداخلة (domain → module → subModule) فيهم **~16** حقل
- **3** قرارات معلّقة لازم تُحسم الأول

**الإجمالي: حوالي 100 حقل/نوع** — ده هو الأساس اللي هيتحول لـ `project-config.schema.json` في الخطوة الجاية.
