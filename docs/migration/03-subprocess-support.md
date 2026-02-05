# Feature: Subprozesse

## Übersicht

Hierarchische Modellierung durch eingebettete Subprozesse (Subprocess/Subnets).

```mermaid
graph TD
    subgraph Main Process
        P1((Start)) --> T1[Task 1]
        T1 --> SUB[["Subprocess"]]
        SUB --> T2[Task 2]
        T2 --> P2((End))
    end
    
    subgraph Subprocess Content
        SP1((●)) --> ST1[Sub Task]
        ST1 --> SP2((○))
    end
    
    SUB -.->|contains| Subprocess Content
```

## Legacy Implementation

### Betroffene Klassen

```
WoPeD-Core/
└── models/
    └── SubProcessModel.java

WoPeD-Editor/
├── view/
│   └── SubProcessView.java
└── controller/
    └── TokenGameController.java (subprocess navigation)
```

### Datenstruktur (Legacy)

```java
public class SubProcessModel extends TransitionModel {
    private PetriNetModelProcessor subNet;
    private String subNetId;
    
    public void openSubNet() { ... }
    public void closeSubNet() { ... }
}
```

## Moderne Implementation

### Datenmodell

```typescript
// types/subprocess.ts
interface SubProcess extends Transition {
  type: 'subprocess'
  subNetId: string
  collapsed: boolean
}

interface PetriNet {
  id: string
  name: string
  parentId?: string  // Für Hierarchie
  places: Place[]
  transitions: (Transition | SubProcess)[]
  arcs: Arc[]
}

// Store für mehrere Netze
interface PetriNetStore {
  nets: Map<string, PetriNet>
  activeNetId: string
  breadcrumb: string[]  // Navigation History
}
```

### Komponenten-Architektur

```mermaid
graph TD
    subgraph Navigation
        BREAD[BreadcrumbNav.vue]
        TREE[ProcessTree.vue]
    end
    
    subgraph Editor
        MAIN[MainEditor.vue]
        SUBVIEW[SubProcessView.vue]
    end
    
    subgraph Components
        SUBNODE[SubProcessNode.vue]
        PREVIEW[SubProcessPreview.vue]
    end
    
    BREAD --> MAIN
    TREE --> MAIN
    MAIN --> SUBVIEW
    MAIN --> SUBNODE
    SUBNODE --> PREVIEW
```

### Interaktionsfluss

```mermaid
sequenceDiagram
    participant U as User
    participant E as Editor
    participant S as Store
    participant C as Canvas
    
    U->>E: Doppelklick auf Subprocess
    E->>S: setActiveNet(subNetId)
    S->>S: breadcrumb.push(parentId)
    S->>C: Render SubNet
    C->>U: Zeige Subprocess-Inhalt
    
    U->>E: Breadcrumb "Back"
    E->>S: setActiveNet(breadcrumb.pop())
    S->>C: Render Parent Net
```

### State Management

```typescript
// stores/petriNet.ts
export const usePetriNetStore = defineStore('petriNet', {
  state: () => ({
    nets: new Map<string, PetriNet>(),
    activeNetId: 'main',
    breadcrumb: ['main']
  }),
  
  getters: {
    activeNet: (state) => state.nets.get(state.activeNetId),
    canGoBack: (state) => state.breadcrumb.length > 1,
    currentPath: (state) => state.breadcrumb.map(id => 
      state.nets.get(id)?.name
    )
  },
  
  actions: {
    openSubProcess(subProcessId: string) {
      const subprocess = this.findSubProcess(subProcessId)
      if (subprocess) {
        this.breadcrumb.push(this.activeNetId)
        this.activeNetId = subprocess.subNetId
      }
    },
    
    goBack() {
      if (this.breadcrumb.length > 1) {
        this.activeNetId = this.breadcrumb.pop()!
      }
    },
    
    createSubProcess(position: Position): SubProcess {
      const subNet: PetriNet = {
        id: generateId(),
        name: 'New Subprocess',
        parentId: this.activeNetId,
        places: [],
        transitions: [],
        arcs: []
      }
      this.nets.set(subNet.id, subNet)
      
      return {
        id: generateId(),
        type: 'subprocess',
        name: 'Subprocess',
        position,
        subNetId: subNet.id,
        collapsed: true
      }
    }
  }
})
```

### Visuelle Darstellung

```mermaid
graph LR
    subgraph Collapsed
        C_SUB[["⊞ Subprocess"]]
    end
    
    subgraph Expanded Preview
        E_SUB[["Subprocess<br/>───────<br/>Mini-Preview"]]
    end
```

```vue
<!-- components/SubProcessNode.vue -->
<template>
  <g :transform="`translate(${x}, ${y})`">
    <!-- Äußerer Rahmen mit doppelter Linie -->
    <rect 
      :width="width" :height="height"
      rx="5" ry="5"
      class="subprocess-outer" />
    <rect 
      :width="width - 6" :height="height - 6"
      x="3" y="3"
      rx="3" ry="3"
      class="subprocess-inner" />
    
    <!-- Label -->
    <text :y="20" text-anchor="middle">
      {{ subprocess.name }}
    </text>
    
    <!-- Preview (wenn expanded) -->
    <foreignObject v-if="showPreview" :y="30">
      <SubProcessPreview :netId="subprocess.subNetId" />
    </foreignObject>
    
    <!-- Expand Icon -->
    <text 
      :x="width - 15" :y="15" 
      class="expand-icon"
      @click="openSubProcess">
      ⊞
    </text>
  </g>
</template>
```

## Migrationsschritte

```mermaid
flowchart TD
    S1[1. Multi-Net Store] --> S2[2. SubProcess Model]
    S2 --> S3[3. Navigation System]
    S3 --> S4[4. Breadcrumb Component]
    S4 --> S5[5. SubProcess Node]
    S5 --> S6[6. Preview Rendering]
    S6 --> S7[7. Token Game Integration]
    S7 --> S8[8. Import/Export]
```

### Detaillierte Schritte

1. **Multi-Net Store**
   - Map für mehrere PetriNets
   - Parent-Child Beziehungen

2. **SubProcess Model**
   - Erweitert Transition
   - Referenz auf SubNet

3. **Navigation System**
   - Breadcrumb State
   - History Management

4. **Breadcrumb Component**
   - Klickbare Pfadanzeige
   - Zurück-Navigation

5. **SubProcess Node**
   - Doppelte Umrandung
   - Doppelklick zum Öffnen

6. **Preview Rendering**
   - Miniatur-Ansicht
   - Optional aktivierbar

7. **Token Game Integration**
   - Step Into / Step Out
   - Token-Weitergabe

8. **Import/Export**
   - Verschachtelte PNML-Struktur
   - Referenz-Integrität

## UI-Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ 📍 Main Process > Order Processing > Payment               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────────┐                                 │
│    │ ╔═════════════════╗ │                                 │
│    │ ║   Subprocess    ║ │  ← Doppelklick zum Öffnen      │
│    │ ║   ─────────     ║ │                                 │
│    │ ║   [Preview]     ║ │                                 │
│    │ ╚═════════════════╝ │                                 │
│    └─────────────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Testplan

| Test | Beschreibung |
|------|--------------|
| Unit | Store Navigation, Hierarchie |
| Component | Breadcrumb, SubProcess Node |
| Integration | Öffnen/Schließen, Token-Fluss |
| E2E | Komplette Hierarchie erstellen & navigieren |
