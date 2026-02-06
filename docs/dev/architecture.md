# Architektur

## Systemübersicht

```mermaid
graph TB
    subgraph Frontend[WoPeD Next Frontend]
        VUE[Vue.js 3]
        VITE[Vite]
        COMP[Components]
    end
    
    subgraph Build[Build Process]
        NPM[npm build]
        DIST[/dist/]
    end
    
    subgraph Production[Production]
        NGINX[nginx]
        DOCKER[Docker Container]
    end
    
    VUE --> VITE
    VITE --> COMP
    COMP --> NPM
    NPM --> DIST
    DIST --> NGINX
    NGINX --> DOCKER
```

## Komponentenstruktur

```mermaid
graph TD
    APP[App.vue] --> LAYOUT[Layout Components]
    APP --> PAGES[Page Components]
    PAGES --> FEATURES[Feature Components]
    FEATURES --> UI[UI Components]
    
    style APP fill:#42b883
    style LAYOUT fill:#35495e,color:#fff
    style PAGES fill:#35495e,color:#fff
    style FEATURES fill:#35495e,color:#fff
    style UI fill:#35495e,color:#fff
```

## Verzeichnisstruktur

```
src/
├── assets/          # Statische Assets (Bilder, Fonts)
├── components/      # Wiederverwendbare Komponenten
├── composables/     # Vue Composition Functions
├── i18n/            # Internationalisierung (vue-i18n)
│   ├── index.ts     # i18n Konfiguration
│   └── locales/     # Sprachdateien
│       ├── en.ts    # Englisch
│       └── de.ts    # Deutsch
├── services/        # Business Logic Services
├── stores/          # Pinia Stores (State Management)
├── types/           # TypeScript Typen
├── utils/           # Hilfsfunktionen
├── App.vue          # Root-Komponente
└── main.js          # Einstiegspunkt
```

## Entwicklungsumgebung

### Voraussetzungen
- Node.js 22+
- npm 10+

### Setup

```bash
npm install
npm run dev
```

## Tech Stack

| Technologie | Version | Zweck |
|-------------|---------|-------|
| Vue.js | 3.x | Frontend Framework |
| Vite | 6.x | Build Tool |
| Pinia | 3.x | State Management |
| vue-i18n | 11.x | Internationalisierung |
| vue-konva | 3.x | Canvas-Rendering (Petri-Netz) |
| nginx | alpine | Webserver (Produktion) |

## State Management (Pinia)

### Reaktivitätsmuster für verschachtelte Objekte

Bei verschachtelten State-Objekten (z.B. `config.editor.showGrid`) können Reaktivitätsprobleme auftreten. Empfohlene Lösungen:

```typescript
// Store: Getters für verschachtelte Properties
getters: {
  showGrid(): boolean {
    return this.editor.showGrid
  }
}

// Store: Explizite Toggle-Actions
actions: {
  toggleShowGrid() {
    this.editor.showGrid = !this.editor.showGrid
    this.save()
  }
}
```

```typescript
// Component: $state explizit referenzieren
const showGrid = computed(() => configStore.$state.editor.showGrid)
```

### Vue-Konva Integration

Bei vue-konva `v-if` auf Layern vermeiden - stattdessen Konva's native `visible` Property:

```vue
<v-layer :config="gridLayerConfig">

<script setup>
const gridLayerConfig = computed(() => ({
  visible: showGrid.value
}))
</script>
```

## Internationalisierung (i18n)

Die Anwendung unterstützt mehrere Sprachen über `vue-i18n`:

- **Konfiguration**: `src/i18n/index.ts`
- **Sprachdateien**: `src/i18n/locales/`
- **Unterstützte Sprachen**: Englisch (en), Deutsch (de)

### Verwendung in Komponenten

```vue
<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <span>{{ $t('key.path') }}</span>
</template>
```

### Neue Übersetzungen hinzufügen

1. Key in `src/i18n/locales/en.ts` hinzufügen
2. Übersetzung in `src/i18n/locales/de.ts` hinzufügen
3. In Komponente mit `$t('key.path')` verwenden
