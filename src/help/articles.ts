import type { HelpArticle } from '@/types/help'

export const helpArticles: HelpArticle[] = [
  // ── Getting Started ──────────────────────────────────
  {
    id: 'welcome',
    category: 'getting-started',
    titleKey: 'help.articles.welcome.title',
    contentKey: 'help.articles.welcome.content',
    icon: '👋',
    keywords: ['welcome', 'overview', 'introduction', 'start', 'willkommen', 'einführung'],
    tourId: 'welcome',
  },
  {
    id: 'petri-net-basics',
    category: 'getting-started',
    titleKey: 'help.articles.petriNetBasics.title',
    contentKey: 'help.articles.petriNetBasics.content',
    icon: '📖',
    keywords: ['petri net', 'basics', 'place', 'transition', 'arc', 'token', 'grundlagen', 'stelle', 'kante'],
  },

  // ── Editor ───────────────────────────────────────────
  {
    id: 'editor-tools',
    category: 'editor',
    titleKey: 'help.articles.editorTools.title',
    contentKey: 'help.articles.editorTools.content',
    icon: '🛠',
    keywords: ['tools', 'select', 'place', 'transition', 'arc', 'delete', 'werkzeuge', 'auswählen', 'stelle'],
    tourId: 'editor-basics',
  },
  {
    id: 'canvas-navigation',
    category: 'editor',
    titleKey: 'help.articles.canvasNavigation.title',
    contentKey: 'help.articles.canvasNavigation.content',
    icon: '🔎',
    keywords: ['zoom', 'pan', 'navigate', 'grid', 'fit', 'viewport', 'navigation', 'raster'],
    tourId: 'canvas-navigation',
  },
  {
    id: 'arcs-routing',
    category: 'editor',
    titleKey: 'help.articles.arcsRouting.title',
    contentKey: 'help.articles.arcsRouting.content',
    icon: '↗',
    keywords: ['arc', 'routing', 'direct', 'orthogonal', 'bezier', 'waypoint', 'kante', 'wegpunkt'],
    tourId: 'arcs-routing',
  },
  {
    id: 'undo-redo',
    category: 'editor',
    titleKey: 'help.articles.undoRedo.title',
    contentKey: 'help.articles.undoRedo.content',
    icon: '↩',
    keywords: ['undo', 'redo', 'history', 'rückgängig', 'wiederholen'],
    tourId: 'undo-redo',
  },
  {
    id: 'layout',
    category: 'editor',
    titleKey: 'help.articles.layout.title',
    contentKey: 'help.articles.layout.content',
    icon: '⬡',
    keywords: ['layout', 'auto', 'hierarchical', 'force', 'grid', 'beautify', 'anordnung'],
    tourId: 'layout',
  },

  // ── Operators ────────────────────────────────────────
  {
    id: 'operators-overview',
    category: 'operators',
    titleKey: 'help.articles.operatorsOverview.title',
    contentKey: 'help.articles.operatorsOverview.content',
    icon: '◇',
    keywords: ['operator', 'AND', 'XOR', 'split', 'join', 'workflow', 'pattern'],
    tourId: 'operators',
  },
  {
    id: 'operators-types',
    category: 'operators',
    titleKey: 'help.articles.operatorsTypes.title',
    contentKey: 'help.articles.operatorsTypes.content',
    icon: '⊗',
    keywords: ['AND-Split', 'AND-Join', 'XOR-Split', 'XOR-Join', 'combined', 'kombiniert'],
  },

  // ── Subprocesses ─────────────────────────────────────
  {
    id: 'subprocesses',
    category: 'subprocesses',
    titleKey: 'help.articles.subprocesses.title',
    contentKey: 'help.articles.subprocesses.content',
    icon: '⊞',
    keywords: ['subprocess', 'hierarchy', 'nested', 'breadcrumb', 'subprozess', 'verschachtelt'],
    tourId: 'subprocesses',
  },

  // ── Token Game ───────────────────────────────────────
  {
    id: 'token-game-basics',
    category: 'token-game',
    titleKey: 'help.articles.tokenGameBasics.title',
    contentKey: 'help.articles.tokenGameBasics.content',
    icon: '▶',
    keywords: ['token', 'game', 'fire', 'step', 'play', 'simulation', 'spiel', 'schalten'],
    tourId: 'token-game',
  },
  {
    id: 'token-game-conflicts',
    category: 'token-game',
    titleKey: 'help.articles.tokenGameConflicts.title',
    contentKey: 'help.articles.tokenGameConflicts.content',
    icon: '⚡',
    keywords: ['conflict', 'resolution', 'manual', 'random', 'priority', 'deadlock', 'konflikt'],
    tourId: 'token-game-conflicts',
  },

  // ── Analysis ─────────────────────────────────────────
  {
    id: 'analysis-overview',
    category: 'analysis',
    titleKey: 'help.articles.analysisOverview.title',
    contentKey: 'help.articles.analysisOverview.content',
    icon: '🔍',
    keywords: ['analysis', 'workflow', 'soundness', 'check', 'analyse', 'prüfung'],
    tourId: 'analysis',
  },
  {
    id: 'analysis-coverability',
    category: 'analysis',
    titleKey: 'help.articles.analysisCoverability.title',
    contentKey: 'help.articles.analysisCoverability.content',
    icon: '🌐',
    keywords: ['coverability', 'graph', 'state', 'space', 'erreichbarkeit', 'zustandsraum'],
    tourId: 'analysis-coverability',
  },
  {
    id: 'analysis-metrics',
    category: 'analysis',
    titleKey: 'help.articles.analysisMetrics.title',
    contentKey: 'help.articles.analysisMetrics.content',
    icon: '📐',
    keywords: ['metrics', 'complexity', 'density', 'quality', 'metriken', 'komplexität'],
    tourId: 'analysis-metrics',
  },

  // ── Simulation ───────────────────────────────────────
  {
    id: 'simulation-overview',
    category: 'simulation',
    titleKey: 'help.articles.simulationOverview.title',
    contentKey: 'help.articles.simulationOverview.content',
    icon: '📊',
    keywords: ['simulation', 'quantitative', 'time', 'throughput', 'cycle', 'durchsatz'],
    tourId: 'simulation-overview',
  },
  {
    id: 'simulation-time-models',
    category: 'simulation',
    titleKey: 'help.articles.simulationTimeModels.title',
    contentKey: 'help.articles.simulationTimeModels.content',
    icon: '⏱',
    keywords: ['time', 'model', 'distribution', 'constant', 'exponential', 'normal', 'zeitmodell', 'verteilung'],
    tourId: 'simulation-time-models',
  },
  {
    id: 'simulation-resources',
    category: 'simulation',
    titleKey: 'help.articles.simulationResources.title',
    contentKey: 'help.articles.simulationResources.content',
    icon: '👥',
    keywords: ['resource', 'capacity', 'bottleneck', 'allocation', 'ressource', 'kapazität', 'engpass'],
    tourId: 'simulation-resources',
  },

  // ── Files ────────────────────────────────────────────
  {
    id: 'file-operations',
    category: 'files',
    titleKey: 'help.articles.fileOperations.title',
    contentKey: 'help.articles.fileOperations.content',
    icon: '📁',
    keywords: ['file', 'save', 'open', 'import', 'export', 'pnml', 'json', 'datei', 'speichern', 'öffnen'],
    tourId: 'file-operations',
  },
  {
    id: 'file-templates',
    category: 'files',
    titleKey: 'help.articles.fileTemplates.title',
    contentKey: 'help.articles.fileTemplates.content',
    icon: '📋',
    keywords: ['template', 'example', 'pattern', 'sequence', 'vorlage', 'beispiel', 'muster'],
    tourId: 'file-templates',
  },

  // ── Settings ─────────────────────────────────────────
  {
    id: 'settings',
    category: 'settings',
    titleKey: 'help.articles.settings.title',
    contentKey: 'help.articles.settings.content',
    icon: '⚙',
    keywords: ['settings', 'theme', 'language', 'grid', 'auto-save', 'einstellungen', 'design', 'sprache'],
    tourId: 'settings',
  },

  // ── Keyboard Shortcuts ───────────────────────────────
  {
    id: 'shortcuts',
    category: 'shortcuts',
    titleKey: 'help.articles.shortcuts.title',
    contentKey: 'help.articles.shortcuts.content',
    icon: '⌨',
    keywords: ['shortcut', 'keyboard', 'hotkey', 'key', 'tastatur', 'kürzel'],
  },
]
