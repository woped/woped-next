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
├── views/           # Seiten-Komponenten
├── router/          # Vue Router Konfiguration
├── stores/          # Pinia Stores (State Management)
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
| nginx | alpine | Webserver (Produktion) |
