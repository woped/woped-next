# Feature: Konfiguration

## Übersicht

Anwendungseinstellungen, Internationalisierung und Benutzereinstellungen.

```mermaid
graph TD
    subgraph Configuration
        GENERAL[Allgemeine Settings]
        EDITOR[Editor Settings]
        LANG[Sprache/i18n]
        METRICS[Metriken Config]
        RECENT[Recent Files]
    end
    
    subgraph Storage
        LOCAL[LocalStorage]
        INDEXDB[IndexedDB]
    end
    
    Configuration --> LOCAL
    Configuration --> INDEXDB
```

## Legacy Implementation

### Betroffene Klassen

```
WoPeD-Configuration/
├── WoPeDConfiguration.java
├── WoPeDGeneralConfiguration.java
├── WoPeDMetricsConfiguration.java
└── WoPeDRecentFile.java

WoPeD-GUI/
└── panels/
    ├── ConfEditorPanel.java
    ├── ConfLanguagePanel.java
    └── ConfMetricsPanel.java
```

## Moderne Implementation

### Datenmodell

```typescript
// types/config.ts
interface AppConfig {
  general: GeneralConfig
  editor: EditorConfig
  language: LanguageConfig
  metrics: MetricsConfig
  recentFiles: RecentFile[]
}

interface GeneralConfig {
  theme: 'light' | 'dark' | 'system'
  autoSave: boolean
  autoSaveInterval: number
}

interface EditorConfig {
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  defaultZoom: number
  smartEditing: boolean
}

interface LanguageConfig {
  locale: 'en' | 'de'
}

interface RecentFile {
  path: string
  name: string
  lastOpened: Date
}
```

### Config Store

```typescript
// stores/config.ts
export const useConfigStore = defineStore('config', {
  state: (): AppConfig => ({
    general: {
      theme: 'system',
      autoSave: true,
      autoSaveInterval: 60000
    },
    editor: {
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      defaultZoom: 1,
      smartEditing: true
    },
    language: { locale: 'en' },
    metrics: { enabled: true },
    recentFiles: []
  }),
  
  actions: {
    load() {
      const saved = localStorage.getItem('woped-config')
      if (saved) Object.assign(this.$state, JSON.parse(saved))
    },
    save() {
      localStorage.setItem('woped-config', JSON.stringify(this.$state))
    }
  },
  
  persist: true
})
```

### i18n Setup

```typescript
// i18n/index.ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en, de }
})
```

## Migrationsschritte

```mermaid
flowchart TD
    S1[1. Config Store] --> S2[2. Settings UI]
    S2 --> S3[3. i18n Setup]
    S3 --> S4[4. Theme Support]
    S4 --> S5[5. Recent Files]
    S5 --> S6[6. Auto-Save]
```

## UI-Mockup

```
┌─────────────────────────────────────────┐
│ Einstellungen                    [X]    │
├─────────────────────────────────────────┤
│ [Allgemein] [Editor] [Sprache]          │
├─────────────────────────────────────────┤
│ Theme:        [System ▼]                │
│ Auto-Save:    [✓] alle [60] Sekunden   │
│                                         │
│ Grid:         [✓] Anzeigen             │
│ Snap to Grid: [✓]                      │
│ Grid-Größe:   [20] px                  │
│                                         │
│                   [Abbrechen] [Speichern]│
└─────────────────────────────────────────┘
```

## Testplan

| Test | Beschreibung |
|------|--------------|
| Unit | Config persistence |
| i18n | Alle Texte übersetzt |
| UI | Settings Dialog |
