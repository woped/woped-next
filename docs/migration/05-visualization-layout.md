# Feature: Visualization & Layout

## Overview

Features for displaying and automatically arranging Petri nets.

```mermaid
graph TD
    subgraph Visualization Features
        ZOOM[Zoom In/Out]
        PAN[Pan/Scroll]
        GRID[Grid Display]
        OVERVIEW[Overview Panel]
        ROTATE[View Rotation]
    end
    
    subgraph Layout Features
        AUTO[Graph Beautifier]
        MANUAL[Manual Routing]
        TREE[Tree View]
    end
```

## Legacy Implementation

### Affected Classes

```
WoPeD-Editor/
├── graphbeautifier/
│   ├── AdvancedDialog.java
│   ├── SGYGraph.java
│   └── SGYElement.java
├── gui/
│   └── OverviewPanel.java
└── orientation/
    └── ViewRotation.java
```

## Modern Implementation

### Zoom & Pan

```mermaid
stateDiagram-v2
    [*] --> Normal
    Normal --> Zooming: Scroll/Pinch
    Normal --> Panning: Drag (Space)
    Zooming --> Normal: Release
    Panning --> Normal: Release
    
    Normal --> FitView: Fit to View
    FitView --> Normal: Done
```

```typescript
// composables/useViewport.ts
interface Viewport {
  x: number
  y: number
  zoom: number
  minZoom: number
  maxZoom: number
}

export function useViewport() {
  const viewport = reactive<Viewport>({
    x: 0,
    y: 0,
    zoom: 1,
    minZoom: 0.1,
    maxZoom: 5
  })
  
  const zoomIn = () => {
    viewport.zoom = Math.min(viewport.zoom * 1.2, viewport.maxZoom)
  }
  
  const zoomOut = () => {
    viewport.zoom = Math.max(viewport.zoom / 1.2, viewport.minZoom)
  }
  
  const fitToView = (bounds: Rect) => {
    // Calculate optimal zoom and position
  }
  
  const pan = (dx: number, dy: number) => {
    viewport.x += dx / viewport.zoom
    viewport.y += dy / viewport.zoom
  }
  
  return { viewport, zoomIn, zoomOut, fitToView, pan }
}
```

### Overview Panel

```mermaid
graph LR
    subgraph Main Canvas
        MC[Full Editor View]
    end
    
    subgraph Overview
        MINI[Miniature View]
        RECT[Viewport Rectangle]
    end
    
    MC <-->|Sync| MINI
    RECT -->|Click/Drag| MC
```

```vue
<!-- components/OverviewPanel.vue -->
<template>
  <div class="overview-panel">
    <canvas 
      ref="overviewCanvas"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
    />
    <!-- Viewport indicator -->
    <div 
      class="viewport-rect"
      :style="viewportStyle"
    />
  </div>
</template>
```

### Graph Beautifier (Auto-Layout)

```mermaid
flowchart TD
    INPUT[Petri Net] --> ALGO{Layout<br/>Algorithm}
    ALGO --> HIERARCHICAL[Hierarchical<br/>Sugiyama]
    ALGO --> FORCE[Force-Directed]
    ALGO --> GRID[Grid-Based]
    
    HIERARCHICAL --> OUTPUT[Optimized Positions]
    FORCE --> OUTPUT
    GRID --> OUTPUT
```

#### Layout Algorithms

```typescript
// utils/layout/index.ts
interface LayoutOptions {
  algorithm: 'hierarchical' | 'force' | 'grid'
  direction: 'LR' | 'TB' | 'RL' | 'BT'
  nodeSpacing: number
  rankSpacing: number
}

export function autoLayout(net: PetriNet, options: LayoutOptions): PetriNet {
  switch (options.algorithm) {
    case 'hierarchical':
      return sugiyamaLayout(net, options)
    case 'force':
      return forceDirectedLayout(net, options)
    case 'grid':
      return gridLayout(net, options)
  }
}
```

#### Sugiyama Layout

```mermaid
graph TD
    subgraph Sugiyama Steps
        S1[1. Cycle Removal]
        S2[2. Layer Assignment]
        S3[3. Crossing Minimization]
        S4[4. Position Assignment]
    end
    
    S1 --> S2 --> S3 --> S4
```

```typescript
// utils/layout/sugiyama.ts
function sugiyamaLayout(net: PetriNet, options: LayoutOptions): PetriNet {
  // 1. Temporarily remove cycles
  const acyclic = removeCycles(net)
  
  // 2. Assign layers (longest path)
  const layers = assignLayers(acyclic)
  
  // 3. Minimize crossings (barycenter)
  const ordered = minimizeCrossings(layers)
  
  // 4. Calculate X/Y positions
  return assignPositions(ordered, options)
}
```

### Arc Routing

```mermaid
graph LR
    subgraph Routing Modes
        DIRECT[Direct Line]
        ORTHOGONAL[Orthogonal]
        BEZIER[Bezier Curve]
        MANUAL[Manual Waypoints]
    end
```

```typescript
// utils/routing.ts
interface ArcRouting {
  mode: 'direct' | 'orthogonal' | 'bezier' | 'manual'
  waypoints: Position[]
}

function routeArc(
  source: Position, 
  target: Position, 
  mode: ArcRouting['mode']
): Position[] {
  switch (mode) {
    case 'direct':
      return [source, target]
    case 'orthogonal':
      return orthogonalRoute(source, target)
    case 'bezier':
      return bezierRoute(source, target)
    case 'manual':
      return [] // User-defined
  }
}
```

### Grid System

```vue
<!-- components/EditorGrid.vue -->
<template>
  <defs>
    <pattern 
      id="grid" 
      :width="gridSize" 
      :height="gridSize" 
      patternUnits="userSpaceOnUse"
    >
      <path 
        :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`"
        fill="none"
        stroke="#e0e0e0"
        stroke-width="0.5"
      />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
</template>
```

## Component Overview

```mermaid
graph TD
    subgraph Viewport Components
        CANVAS[EditorCanvas.vue]
        GRID[EditorGrid.vue]
        OVERVIEW[OverviewPanel.vue]
        TOOLBAR[ViewToolbar.vue]
    end
    
    subgraph Layout Components
        BEAUTIFIER[GraphBeautifier.vue]
        SETTINGS[LayoutSettings.vue]
    end
    
    TOOLBAR --> CANVAS
    CANVAS --> GRID
    CANVAS --> OVERVIEW
    BEAUTIFIER --> SETTINGS
```

## Migration Steps

```mermaid
flowchart TD
    S1[1. Viewport Composable] --> S2[2. Zoom/Pan]
    S2 --> S3[3. Grid Rendering]
    S3 --> S4[4. Overview Panel]
    S4 --> S5[5. Layout Algorithms]
    S5 --> S6[6. Auto-Layout UI]
    S6 --> S7[7. Arc Routing]
    S7 --> S8[8. View Rotation]
```

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ [🔍+] [🔍-] [Fit] [Grid ☑] [Snap ☑] │ [Auto Layout ▼]     │
├────────────────────────────────────┬────────────────────────┤
│                                    │ ┌──────────────────┐   │
│                                    │ │    Overview      │   │
│        Main Canvas                 │ │  ┌────┐          │   │
│        (Zoomable, Pannable)        │ │  │    │ ←Viewport│   │
│                                    │ │  └────┘          │   │
│                                    │ └──────────────────┘   │
│                                    │                        │
│    ┌─grid─────────────────────┐   │ Layout Options:        │
│    │ ○ ─── □ ─── ○            │   │ [Hierarchical ▼]       │
│    │       │                   │   │ Direction: [LR ▼]     │
│    │       ○                   │   │ Spacing: [50]         │
│    └───────────────────────────┘   │ [Apply]               │
│                                    │                        │
└────────────────────────────────────┴────────────────────────┘
```

## Dependencies

```json
{
  "dependencies": {
    "dagre": "^0.8.5",
    "d3-force": "^3.0.0"
  }
}
```

## Test Plan

| Test | Description |
|------|-------------|
| Unit | Viewport calculations, layout algorithms |
| Visual | Grid rendering, zoom levels |
| Integration | Overview sync, auto-layout |
| Performance | Large nets (1000+ elements) |
