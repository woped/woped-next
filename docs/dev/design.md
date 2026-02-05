# Design

## UI-Konzept

```mermaid
graph LR
    subgraph Design System
        COLORS[Farbpalette]
        TYPO[Typografie]
        SPACE[Spacing]
        ICONS[Icons]
    end
    
    subgraph Components
        BTN[Buttons]
        FORM[Formulare]
        CARD[Cards]
        NAV[Navigation]
    end
    
    Design System --> Components
```

## Farbpalette

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#42b883'}}}%%
pie showData
    title Primärfarben
    "Primary #42b883" : 40
    "Secondary #35495e" : 30
    "Accent #3eaf7c" : 20
    "Background #f8f8f8" : 10
```

| Farbe | Hex | Verwendung |
|-------|-----|------------|
| Primary | `#42b883` | Vue Green - Hauptaktionen |
| Secondary | `#35495e` | Dark Blue - Text, Headers |
| Accent | `#3eaf7c` | Highlights, Links |
| Background | `#f8f8f8` | Hintergrund |
| Error | `#e74c3c` | Fehlermeldungen |
| Success | `#27ae60` | Erfolgsmeldungen |

## Typografie

| Element | Font | Größe | Gewicht |
|---------|------|-------|---------|
| H1 | System | 2.5rem | 700 |
| H2 | System | 2rem | 600 |
| H3 | System | 1.5rem | 600 |
| Body | System | 1rem | 400 |
| Small | System | 0.875rem | 400 |

## Spacing System

```
4px  - xs
8px  - sm
16px - md
24px - lg
32px - xl
48px - 2xl
```

## Komponenten-States

```mermaid
stateDiagram-v2
    [*] --> Default
    Default --> Hover: Mouse Enter
    Hover --> Default: Mouse Leave
    Default --> Focus: Tab/Click
    Focus --> Default: Blur
    Default --> Disabled: disabled=true
    Default --> Loading: loading=true
    Loading --> Default: Complete
```

## Responsive Breakpoints

| Breakpoint | Breite | Zielgeräte |
|------------|--------|------------|
| sm | 640px | Mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large Desktop |
