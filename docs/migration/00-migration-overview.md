# WoPeD Migration Overview

## Projektüberblick

Migration von WoPeD (Workflow Petri Net Designer) von einer Java Swing Desktop-Anwendung zu einer modernen Vue.js Web-Anwendung.

```mermaid
graph LR
    subgraph Legacy["Legacy (Java Swing)"]
        JAVA[Java 8+]
        SWING[Swing/AWT]
        JGRAPH[JGraph]
        MAVEN[Maven Build]
    end
    
    subgraph Modern["Modern (Vue.js)"]
        VUE[Vue.js 3]
        CANVAS[Canvas/SVG]
        VITE[Vite Build]
        DOCKER[Docker]
    end
    
    Legacy -->|Migration| Modern
```

## Feature-Kategorien

```mermaid
mindmap
  root((WoPeD))
    Editor
      Petri-Netz Editor
      Workflow Operatoren
      Subprozesse
    Simulation
      Token Game
      Quantitative Simulation
    Analyse
      Qualitative Analyse
      Process Metrics
    Integration
      File Import/Export
      NLP Integration
      Apromore
    UI/UX
      Visualisierung
      Konfiguration
```

## Migrationsstrategie

```mermaid
gantt
    title Migration Roadmap
    dateFormat YYYY-MM-DD
    section Phase 1 - Core
        Petri-Netz Editor     :p1, 2024-01-01, 60d
        Workflow Operatoren   :p2, after p1, 30d
        Visualisierung        :p3, after p1, 30d
    section Phase 2 - Simulation
        Token Game            :p4, after p2, 45d
        Subprozesse           :p5, after p4, 30d
    section Phase 3 - Analyse
        Qualitative Analyse   :p6, after p5, 45d
        Process Metrics       :p7, after p6, 30d
        Quantitative Sim      :p8, after p7, 45d
    section Phase 4 - Integration
        File Operations       :p9, after p3, 30d
        NLP Integration       :p10, after p8, 30d
        Triggers/Resources    :p11, after p10, 20d
```

## Feature-Dokumente

| # | Feature | Komplexität | Priorität |
|---|---------|-------------|-----------|
| [01](01-petri-net-editor.md) | Petri-Netz Editor | Hoch | P1 |
| [02](02-workflow-operators.md) | Workflow Operatoren | Mittel | P1 |
| [03](03-subprocess-support.md) | Subprozesse | Hoch | P2 |
| [04](04-token-game.md) | Token Game | Hoch | P2 |
| [05](05-visualization-layout.md) | Visualisierung & Layout | Mittel | P1 |
| [06](06-qualitative-analysis.md) | Qualitative Analyse | Hoch | P3 |
| [07](07-quantitative-simulation.md) | Quantitative Simulation | Hoch | P3 |
| [08](08-process-metrics.md) | Process Metrics | Mittel | P3 |
| [09](09-file-operations.md) | File Operations | Mittel | P1 |
| [10](10-nlp-integration.md) | NLP Integration | Mittel | P4 |
| [11](11-triggers-resources.md) | Triggers & Resources | Mittel | P3 |
| [12](12-configuration.md) | Konfiguration | Niedrig | P2 |

## Technologie-Mapping

| Legacy | Modern | Anmerkung |
|--------|--------|-----------|
| Java Swing | Vue.js 3 | UI Framework |
| JGraph | Canvas/SVG + D3.js | Graph-Rendering |
| JAXB | Native JSON | Datenserialisierung |
| Maven | npm/Vite | Build System |
| Properties Files | i18n (vue-i18n) | Internationalisierung |
| Swing Dialogs | Vue Components | Modale Dialoge |
| Desktop Storage | IndexedDB/LocalStorage | Persistenz |

## Architektur-Vergleich

```mermaid
graph TB
    subgraph Legacy["Legacy Architektur"]
        LM[Model] --> LV[View]
        LV --> LC[Controller]
        LC --> LM
        LM --> LFILE[File System]
    end
    
    subgraph Modern["Moderne Architektur"]
        STORE[Pinia Store] --> COMP[Vue Components]
        COMP --> STORE
        STORE --> API[REST API / IndexedDB]
        COMP --> CANVAS[Canvas Renderer]
    end
```

## Risiken & Mitigationen

| Risiko | Impact | Mitigation |
|--------|--------|------------|
| Komplexe Algorithmen | Hoch | Schrittweise portieren, Unit Tests |
| Performance Canvas | Mittel | WebGL für große Netze |
| Browser-Kompatibilität | Niedrig | Moderne Browser targeten |
| Offline-Fähigkeit | Mittel | Service Worker + IndexedDB |
