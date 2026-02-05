# Feature: Workflow Operatoren

## Übersicht

Spezielle Transitionen für Workflow-Netze: AND/XOR Split und Join Operatoren.

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

## Operator-Typen

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

### Betroffene Klassen

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

### Operator-Enum (Legacy)

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

## Moderne Implementation

### Datenmodell

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
  innerPlaces?: Place[]  // Für combined operators
}
```

### Komponenten-Architektur

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

### Visuelle Darstellung

```mermaid
graph LR
    subgraph Symbole
        AND["◇ AND (Raute)"]
        XOR["⊗ XOR (Kreis mit X)"]
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

### Token-Semantik

```mermaid
stateDiagram-v2
    state "AND-Split" as AS {
        [*] --> Waiting: 1 Token
        Waiting --> Fired: Alle Ausgänge aktiviert
    }
    
    state "AND-Join" as AJ {
        [*] --> Collecting: Tokens sammeln
        Collecting --> Fired: Alle Eingänge haben Token
    }
    
    state "XOR-Split" as XS {
        [*] --> Waiting: 1 Token
        Waiting --> Fired: Ein Ausgang gewählt
    }
    
    state "XOR-Join" as XJ {
        [*] --> Waiting: Auf ein Token warten
        Waiting --> Fired: Erstes Token durchleiten
    }
```

## Migrationsschritte

```mermaid
flowchart TD
    S1[1. OperatorType Enum] --> S2[2. Datenmodell erweitern]
    S2 --> S3[3. Base Operator Component]
    S3 --> S4[4. Spezifische Operatoren]
    S4 --> S5[5. Toolbar Integration]
    S5 --> S6[6. Token Game Integration]
    S6 --> S7[7. Validierung]
```

### Detaillierte Schritte

1. **OperatorType Enum**
   ```typescript
   // Alle 8 Operator-Typen definieren
   ```

2. **Datenmodell erweitern**
   - OperatorTransition Interface
   - Inner Places für Combined Operators

3. **Base Operator Component**
   - Gemeinsame Logik
   - Props: type, position, selected

4. **Spezifische Operatoren**
   - Unterschiedliche SVG-Shapes
   - AND = Raute, XOR = Kreis mit X

5. **Toolbar Integration**
   - Operator-Auswahl Dropdown
   - Schnelltasten

6. **Token Game Integration**
   - AND: Synchronisation
   - XOR: Auswahl

7. **Validierung**
   - Korrekte Verbindungen prüfen
   - Fehlermeldungen

## UI-Mockup Operator-Auswahl

```
┌─────────────────────────────────┐
│ Operator einfügen:              │
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

## Testplan

| Test | Beschreibung |
|------|--------------|
| Unit | Operator-Typen, Semantik |
| Visual | Korrekte Darstellung aller 8 Typen |
| Integration | Token-Fluss durch Operatoren |
