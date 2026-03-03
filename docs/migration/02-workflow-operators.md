# Feature: Workflow Operators

## Overview

Special transitions for workflow nets: AND/XOR split and join operators.

```mermaid
graph LR
    subgraph Split Operators
        AS[AND-Split]
        XS[XOR-Split]
    end
    
    subgraph Join Operators
        AJ[AND-Join]
        XJ[XOR-Join]
    end
    
    subgraph Combined
        ASJ[AND-Split-Join]
        XSJ[XOR-Split-Join]
        AJXS[AND-Join-XOR-Split]
        XJAS[XOR-Join-AND-Split]
    end
```

## Operator Types

```mermaid
graph TD
    subgraph AND-Split
        P1((●)) --> AS1[AND]
        AS1 --> P2((○))
        AS1 --> P3((○))
    end
    
    subgraph AND-Join
        P4((●)) --> AJ1[AND]
        P5((●)) --> AJ1
        AJ1 --> P6((○))
    end
    
    subgraph XOR-Split
        P7((●)) --> XS1[XOR]
        XS1 -.-> P8((○))
        XS1 -.-> P9((○))
    end
    
    subgraph XOR-Join
        P10((●)) -.-> XJ1[XOR]
        P11((●)) -.-> XJ1
        XJ1 --> P12((○))
    end
```

## Legacy Implementation

### Affected Classes

```
WoPeD-Core/
└── models/
    └── OperatorTransitionModel.java

WoPeD-Editor/
└── view/
    ├── TransAndSplitView.java
    ├── TransAndJoinView.java
    ├── TransXOrSplitView.java
    ├── TransXOrJoinView.java
    ├── TransAndSplitJoinView.java
    ├── TransXOrSplitJoinView.java
    ├── TransAndJoinXOrSplitView.java
    └── TransXOrJoinAndSplitView.java
```

### Operator Enum (Legacy)

```java
public enum OperatorType {
    AND_SPLIT,
    AND_JOIN,
    XOR_SPLIT,
    XOR_JOIN,
    AND_SPLIT_JOIN,
    XOR_SPLIT_JOIN,
    AND_JOIN_XOR_SPLIT,
    XOR_JOIN_AND_SPLIT
}
```

## Modern Implementation

### Data Model

```typescript
// types/operators.ts
enum OperatorType {
  AND_SPLIT = 'and-split',
  AND_JOIN = 'and-join',
  XOR_SPLIT = 'xor-split',
  XOR_JOIN = 'xor-join',
  AND_SPLIT_JOIN = 'and-split-join',
  XOR_SPLIT_JOIN = 'xor-split-join',
  AND_JOIN_XOR_SPLIT = 'and-join-xor-split',
  XOR_JOIN_AND_SPLIT = 'xor-join-and-split'
}

interface OperatorTransition extends Transition {
  operatorType: OperatorType
  innerPlaces?: Place[]  // For combined operators
}
```

### Component Architecture

```mermaid
graph TD
    subgraph Operator Components
        BASE[OperatorBase.vue]
        AND_S[AndSplitOperator.vue]
        AND_J[AndJoinOperator.vue]
        XOR_S[XorSplitOperator.vue]
        XOR_J[XorJoinOperator.vue]
        COMB[CombinedOperator.vue]
    end
    
    BASE --> AND_S
    BASE --> AND_J
    BASE --> XOR_S
    BASE --> XOR_J
    BASE --> COMB
```

### Visual Representation

```mermaid
graph LR
    subgraph Symbols
        AND["◇ AND (Diamond)"]
        XOR["⊗ XOR (Circle with X)"]
    end
```

```vue
<!-- components/operators/OperatorNode.vue -->
<template>
  <g :transform="`translate(${x}, ${y})`">
    <!-- AND: Diamond shape -->
    <polygon v-if="isAnd" 
      points="0,-20 20,0 0,20 -20,0" 
      :fill="fillColor" />
    
    <!-- XOR: Circle with X -->
    <g v-else>
      <circle r="20" :fill="fillColor" />
      <line x1="-10" y1="-10" x2="10" y2="10" />
      <line x1="10" y1="-10" x2="-10" y2="10" />
    </g>
    
    <!-- Split/Join indicators -->
    <text>{{ operatorLabel }}</text>
  </g>
</template>
```

### Token Semantics

```mermaid
stateDiagram-v2
    state "AND-Split" as AS {
        [*] --> Waiting: 1 Token
        Waiting --> Fired: All outputs activated
    }
    
    state "AND-Join" as AJ {
        [*] --> Collecting: Collect tokens
        Collecting --> Fired: All inputs have tokens
    }
    
    state "XOR-Split" as XS {
        [*] --> Waiting: 1 Token
        Waiting --> Fired: One output selected
    }
    
    state "XOR-Join" as XJ {
        [*] --> Waiting: Wait for a token
        Waiting --> Fired: First token passes through
    }
```

## Migration Steps

```mermaid
flowchart TD
    S1[1. OperatorType Enum] --> S2[2. Extend Data Model]
    S2 --> S3[3. Base Operator Component]
    S3 --> S4[4. Specific Operators]
    S4 --> S5[5. Toolbar Integration]
    S5 --> S6[6. Token Game Integration]
    S6 --> S7[7. Validation]
```

### Detailed Steps

1. **OperatorType Enum**
   ```typescript
   // Define all 8 operator types
   ```

2. **Extend Data Model**
   - OperatorTransition interface
   - Inner places for combined operators

3. **Base Operator Component**
   - Shared logic
   - Props: type, position, selected

4. **Specific Operators**
   - Different SVG shapes
   - AND = diamond, XOR = circle with X

5. **Toolbar Integration**
   - Operator selection dropdown
   - Keyboard shortcuts

6. **Token Game Integration**
   - AND: Synchronization
   - XOR: Selection

7. **Validation**
   - Check correct connections
   - Error messages

## UI Mockup - Operator Selection

```
┌─────────────────────────────────┐
│ Add Operator:                   │
├─────────────────────────────────┤
│ ◇ AND-Split                     │
│ ◇ AND-Join                      │
│ ⊗ XOR-Split                     │
│ ⊗ XOR-Join                      │
├─────────────────────────────────┤
│ Combined:                       │
│ ◇◇ AND-Split-Join               │
│ ⊗⊗ XOR-Split-Join               │
│ ◇⊗ AND-Join-XOR-Split           │
│ ⊗◇ XOR-Join-AND-Split           │
└─────────────────────────────────┘
```

## Test Plan

| Test | Description |
|------|-------------|
| Unit | Operator types, semantics |
| Visual | Correct rendering of all 8 types |
| Integration | Token flow through operators |
