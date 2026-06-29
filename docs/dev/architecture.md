67: │   │   ├── SimulationEngine.ts
68: │   │   └── XESExporter.ts
69: │   └── templates/       # Template service
70: │       └── petriNetTemplates.ts
71: ├── stores/              # Pinia stores
72: │   ├── petriNet.ts      # Main store for Petri net
73: │   ├── config.ts        # Configuration & settings
74: │   ├── tokenGame.ts     # Token game state
75: │   └── simulation.ts    # Simulation state
76: ├── types/               # TypeScript types
77: │   ├── petri-net.ts     # Petri net types
78: │   ├── config.ts        # Config types
79: │   ├── simulation.ts    # Simulation types
80: │   ├── metrics.ts       # Metrics types
81: │   ├── triggers.ts      # Trigger types
82: │   └── file-formats.ts  # File format types
83: ├── utils/               # Helper functions
84: │   ├── geometry.ts      # Geometry calculations
85: │   ├── routing.ts       # Arc routing
86: │   ├── layout.ts        # Auto-layout algorithms
87: │   ├── random.ts        # Random generators
88: │   ├── marqueeSelection.ts # Marquee selection logic and bounds tests
89: │   ├── operatorGlyph.ts     # Geometry and orientation helpers for operator icons
90: │   ├── operatorSemantics.ts # Semantic evaluation helpers for operator logic
91: │   ├── quickConnect.ts      # Logic for Quick Connect pad on right-click
92: │   └── wheelZoom.ts         # Smoother zoom scaling based on wheel delta
93: ├── components/
94: │   ├── analysis/
95: │   │   ├── AnalysisPanel.vue
96: │   │   └── MetricsSection.vue
97: │   ├── canvas/
98: │   │   ├── PlaceNode.vue
99: │   │   ├── TransitionNode.vue
100: │   │   ├── OperatorNode.vue
101: │   │   ├── SubProcessNode.vue
102: │   │   ├── ArcEdge.vue
103: │   │   └── TokenAnimation.vue
104: │   ├── editor/
105: │   │   ├── PetriNetEditor.vue
106: │   │   ├── EditorCanvas.vue
107: │   │   ├── EditorToolbar.vue
108: │   │   ├── ViewToolbar.vue
109: │   │   ├── PropertiesPanel.vue
110: │   │   ├── BreadcrumbNav.vue
111: │   │   ├── SubprocessPreview.vue
112: │   │   ├── OperatorAalstIcon.vue          # New operator icon component for van der Aalst notation
113: │   │   ├── QuickConnectPad.vue             # New quick connect right-click pad
114: │   ├── file/
115: │   │   └── FileMenu.vue
116: │   ├── settings/
117: │   │   └── SettingsDialog.vue
118: │   ├── simulation/
119: │   │   ├── SimulationPanel.vue
120: │   │   ├── SimulationConfig.vue
121: │   │   ├── SimulationResults.vue
122: │   │   ├── TimeModelConfig.vue
123: │   │   ├── ResourceConfig.vue
124: │   │   └── BottleneckAnalysis.vue
125: │   ├── token-game/
126: │   │   ├── TokenGameControls.vue
127: │   │   ├── TokenGameStats.vue
128: │   │   ├── ConflictDialog.vue
129: │   │   ├── BranchChoiceDialog.vue          # New branch choice dialog for token game
130: │   ├── triggers/
131: │   │   └── TriggerEditor.vue
132: ├── composables/
133: │   └── useViewport.ts                     # Viewport zoom/pan management composable
