# 🌍 Internationalization Setup (Transloco)

This document describes the initial setup of internationalization (i18n) in the project using Transloco.

### 📦 Overview

The project now supports multiple languages (English and Arabic) using Transloco, enabling dynamic language switching and preparing the application for localization and RTL support.

### ⚙️ Configuration Changes
1. Angular Assets Configuration

Updated **angular.json** to properly serve static files from the public folder:
```
"assets": [
  {
    "glob": "**/*",
    "input": "public",
    "output": "/"
  }
]
```

This ensures that files inside public/ are accessible from the root URL (e.g., /i18n/en.json)

2. Transloco Configuration File

Added: **transloco.config.ts**

This file contains the base configuration for Transloco and defines how translations are handled across the application.

3. Translation Files

Created translation files inside the public directory:
```
public/
└── i18n/
    ├── en.json
    └── ar.json
```

These files contain key-value pairs for application text in different languages.

4. Transloco Provider Setup

Updated **app.config.ts** to configure Transloco and required providers:
```
providePrimeNG({
  theme: {
    preset: Aura,
    options: { darkModeSelector: '.app-dark' }
  }
}),
provideHttpClient(),
provideTransloco({
  config: {
    availableLangs: ['en', 'ar'],
    defaultLang: 'en',
    reRenderOnLangChange: true,
    prodMode: !isDevMode()
  },
  loader: TranslocoHttpLoader
})
```
Key Points:
- availableLangs: Defines supported languages (English & Arabic)
- defaultLang: Sets the default language
- reRenderOnLangChange: Enables dynamic UI updates when language changes
- loader: Uses a custom loader to fetch translation files

5. Custom Transloco Loader

Added: **transloco-loader.ts**

This loader is responsible for fetching translation files dynamically.

Example:
```
getTranslation(lang: string) {
  return this.http.get(`i18n/${lang}.json`);
}
```
Loads translations from: ```/i18n/{lang}.json```

6. Language Toggle (Topbar)

A language switch button was added to the topbar to allow users to toggle between English and Arabic at runtime.

  - UI Implementation
  ```html
<!-- language toggle -->
<button type="button" class="flex gap-2 items-center" (click)="toggleLanguage()">
  <i class="pi pi-globe" style="opacity: 0.9;"></i>
  <span>{{ transloco.getActiveLang() === 'en' ? 'AR' : 'EN' }}</span>
</button>
```
- Logic Implementation 
```ts
toggleLanguage() {
  const currentLang = this.transloco.getActiveLang();
  const newLang = currentLang === 'en' ? 'ar' : 'en';

  this.transloco.setActiveLang(newLang);

  // RTL handling
  document.dir = newLang === 'ar' ? 'rtl' : 'ltr';
}
```
### 🚀 Current Capabilities

✅ Multi-language support (English / Arabic)
✅ Dynamic language switching (runtime ready)
✅ External translation files (JSON-based)
✅ Clean and scalable setup