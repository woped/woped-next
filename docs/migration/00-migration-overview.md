# WoPeD Migration Overview

## Project Overview

Migration of WoPeD (Workflow Petri Net Designer) from a Java Swing desktop application to a modern Vue.js web application.

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

## Feature Categories

```mermaid
mindmap
  root((WoPeD))
    Editor
      Petri Net Editor
      Workflow Operators
      Subprocesses
    Simulation
      Token Game
      Quantitative Simulation
    Analysis
      Qualitative Analysis
      Process Metrics
    Integration
      File Import/Export
      NLP Integration
      Apromore
    UI/UX
      Visualization
      Configuration
```

## Migration Strategy

```mermaid
gantt
    title Migration Roadmap
    dateFormat YYYY-MM-DD
    section Phase 1 - Core
        Petri Net Editor      :p1, 2024-01-01, 60d
        Workflow Operators    :p2, after p1, 30d
        Visualization         :p3, after p1, 30d
    section Phase 2 - Simulation
        Token Game            :p4, after p2, 45d
        Subprocesses          :p5, after p4, 30d
    section Phase 3 - Analysis
        Qualitative Analysis  :p6, after p5, 45d
        Process Metrics       :p7, after p6, 30d
        Quantitative Sim      :p8, after p7, 45d
    section Phase 4 - Integration
        File Operations       :p9, after p3, 30d
        Triggers/Resources    :p11, after p8, 20d
    section Phase 5 - NLP (Deferred)
        NLP Integration (neues Konzept) :p10, after p11, 60d
```

## Feature Documents

| # | Feature | Complexity | Priority |
|---|---------|------------|----------|
| [01](01-petri-net-editor.md) | Petri Net Editor | High | P1 |
| [02](02-workflow-operators.md) | Workflow Operators | Medium | P1 |
| [03](03-subprocess-support.md) | Subprocesses | High | P2 |
| [04](04-token-game.md) | Token Game | High | P2 |
| [05](05-visualization-layout.md) | Visualization & Layout | Medium | P1 |
| [06](06-qualitative-analysis.md) | Qualitative Analysis | High | P3 |
| [07](07-quantitative-simulation.md) | Quantitative Simulation | High | P3 |
| [08](08-process-metrics.md) | Process Metrics | Medium | P3 |
| [09](09-file-operations.md) | File Operations | Medium | P1 |
| [10](10-nlp-integration.md) | NLP Integration | Medium | P5 (Deferred — wird als letztes komplett neu konzipiert) |
| [11](11-triggers-resources.md) | Triggers & Resources | Medium | P3 |
| [12](12-configuration.md) | Configuration | Low | P2 |

## Technology Mapping

| Legacy | Modern | Notes |
|--------|--------|-------|
| Java Swing | Vue.js 3 | UI Framework |
| JGraph | Canvas/SVG + D3.js | Graph Rendering |
| JAXB | Native JSON | Data Serialization |
| Maven | npm/Vite | Build System |
| Properties Files | i18n (vue-i18n) | Internationalization |
| Swing Dialogs | Vue Components | Modal Dialogs |
| Desktop Storage | IndexedDB/LocalStorage | Persistence |

## Architecture Comparison

```mermaid
graph TB
    subgraph Legacy["Legacy Architecture"]
        LM[Model] --> LV[View]
        LV --> LC[Controller]
        LC --> LM
        LM --> LFILE[File System]
    end
    
    subgraph Modern["Modern Architecture"]
        STORE[Pinia Store] --> COMP[Vue Components]
        COMP --> STORE
        STORE --> API[REST API / IndexedDB]
        COMP --> CANVAS[Canvas Renderer]
    end
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex Algorithms | High | Incremental porting, unit tests |
| Canvas Performance | Medium | WebGL for large nets |
| Browser Compatibility | Low | Target modern browsers |
| Offline Capability | Medium | Service Worker + IndexedDB |
