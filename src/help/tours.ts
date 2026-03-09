import type { GuidedTour } from '@/types/help'

export const guidedTours: GuidedTour[] = [
  // ── Welcome ────────────────────────────────────────────
  {
    id: 'welcome',
    titleKey: 'help.tours.welcome.title',
    descriptionKey: 'help.tours.welcome.description',
    steps: [
      {
        targetSelector: '.editor-toolbar',
        titleKey: 'help.tours.welcome.steps.toolbar.title',
        contentKey: 'help.tours.welcome.steps.toolbar.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.welcome.steps.canvas.title',
        contentKey: 'help.tours.welcome.steps.canvas.content',
        placement: 'right',
        highlightPadding: 0,
      },
      {
        targetSelector: '.right-panel-tabs',
        titleKey: 'help.tours.welcome.steps.panels.title',
        contentKey: 'help.tours.welcome.steps.panels.content',
        placement: 'left',
      },
      {
        targetSelector: '.view-toolbar-container',
        titleKey: 'help.tours.welcome.steps.viewToolbar.title',
        contentKey: 'help.tours.welcome.steps.viewToolbar.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.overview-container',
        titleKey: 'help.tours.welcome.steps.overview.title',
        contentKey: 'help.tours.welcome.steps.overview.content',
        placement: 'top',
      },
    ],
  },

  // ── Editor Basics ──────────────────────────────────────
  {
    id: 'editor-basics',
    titleKey: 'help.tours.editorBasics.title',
    descriptionKey: 'help.tours.editorBasics.description',
    steps: [
      {
        targetSelector: '.toolbar-group',
        titleKey: 'help.tours.editorBasics.steps.tools.title',
        contentKey: 'help.tours.editorBasics.steps.tools.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.tool-btn[title*="Place"], .tool-btn[title*="Stelle"]',
        titleKey: 'help.tours.editorBasics.steps.place.title',
        contentKey: 'help.tours.editorBasics.steps.place.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.tool-btn[title*="Transition"]',
        titleKey: 'help.tours.editorBasics.steps.transition.title',
        contentKey: 'help.tours.editorBasics.steps.transition.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.tool-btn[title*="Arc"], .tool-btn[title*="Kante"]',
        titleKey: 'help.tours.editorBasics.steps.arc.title',
        contentKey: 'help.tours.editorBasics.steps.arc.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.operator-dropdown',
        titleKey: 'help.tours.editorBasics.steps.operator.title',
        contentKey: 'help.tours.editorBasics.steps.operator.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.editorBasics.steps.properties.title',
        contentKey: 'help.tours.editorBasics.steps.properties.content',
        placement: 'left',
      },
    ],
  },

  // ── Canvas Navigation ──────────────────────────────────
  {
    id: 'canvas-navigation',
    titleKey: 'help.tours.canvasNavigation.title',
    descriptionKey: 'help.tours.canvasNavigation.description',
    steps: [
      {
        targetSelector: '.view-toolbar',
        titleKey: 'help.tours.canvasNavigation.steps.viewToolbar.title',
        contentKey: 'help.tours.canvasNavigation.steps.viewToolbar.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.view-toolbar .toolbar-group:first-child',
        titleKey: 'help.tours.canvasNavigation.steps.zoom.title',
        contentKey: 'help.tours.canvasNavigation.steps.zoom.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.view-toolbar .toolbar-group:nth-child(3)',
        titleKey: 'help.tours.canvasNavigation.steps.rotation.title',
        contentKey: 'help.tours.canvasNavigation.steps.rotation.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.view-toolbar .toolbar-group:nth-child(5)',
        titleKey: 'help.tours.canvasNavigation.steps.grid.title',
        contentKey: 'help.tours.canvasNavigation.steps.grid.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.overview-panel',
        titleKey: 'help.tours.canvasNavigation.steps.minimap.title',
        contentKey: 'help.tours.canvasNavigation.steps.minimap.content',
        placement: 'top',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.canvasNavigation.steps.panZoom.title',
        contentKey: 'help.tours.canvasNavigation.steps.panZoom.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Arc Routing ────────────────────────────────────────
  {
    id: 'arcs-routing',
    titleKey: 'help.tours.arcsRouting.title',
    descriptionKey: 'help.tours.arcsRouting.description',
    steps: [
      {
        targetSelector: '.tool-btn[title*="Arc"], .tool-btn[title*="Kante"]',
        titleKey: 'help.tours.arcsRouting.steps.arcTool.title',
        contentKey: 'help.tours.arcsRouting.steps.arcTool.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.arcsRouting.steps.createArc.title',
        contentKey: 'help.tours.arcsRouting.steps.createArc.content',
        placement: 'right',
        highlightPadding: 0,
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.arcsRouting.steps.routingModes.title',
        contentKey: 'help.tours.arcsRouting.steps.routingModes.content',
        placement: 'left',
      },
    ],
  },

  // ── Undo & Redo ────────────────────────────────────────
  {
    id: 'undo-redo',
    titleKey: 'help.tours.undoRedo.title',
    descriptionKey: 'help.tours.undoRedo.description',
    steps: [
      {
        targetSelector: '.tool-btn[title*="Undo"], .tool-btn[title*="ckgängig"]',
        titleKey: 'help.tours.undoRedo.steps.undo.title',
        contentKey: 'help.tours.undoRedo.steps.undo.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.tool-btn[title*="Redo"], .tool-btn[title*="Wiederholen"]',
        titleKey: 'help.tours.undoRedo.steps.redo.title',
        contentKey: 'help.tours.undoRedo.steps.redo.content',
        placement: 'bottom',
      },
    ],
  },

  // ── Auto Layout ────────────────────────────────────────
  {
    id: 'layout',
    titleKey: 'help.tours.layout.title',
    descriptionKey: 'help.tours.layout.description',
    steps: [
      {
        targetSelector: '.layout-dropdown',
        titleKey: 'help.tours.layout.steps.button.title',
        contentKey: 'help.tours.layout.steps.button.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.layout.steps.result.title',
        contentKey: 'help.tours.layout.steps.result.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Operators ──────────────────────────────────────────
  {
    id: 'operators',
    titleKey: 'help.tours.operators.title',
    descriptionKey: 'help.tours.operators.description',
    steps: [
      {
        targetSelector: '.operator-dropdown',
        titleKey: 'help.tours.operators.steps.dropdown.title',
        contentKey: 'help.tours.operators.steps.dropdown.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.operators.steps.canvas.title',
        contentKey: 'help.tours.operators.steps.canvas.content',
        placement: 'right',
        highlightPadding: 0,
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.operators.steps.properties.title',
        contentKey: 'help.tours.operators.steps.properties.content',
        placement: 'left',
      },
    ],
  },

  // ── Subprocesses ───────────────────────────────────────
  {
    id: 'subprocesses',
    titleKey: 'help.tours.subprocesses.title',
    descriptionKey: 'help.tours.subprocesses.description',
    steps: [
      {
        targetSelector: '.tool-btn[title*="Subprocess"], .tool-btn[title*="Subprozess"]',
        titleKey: 'help.tours.subprocesses.steps.tool.title',
        contentKey: 'help.tours.subprocesses.steps.tool.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.subprocesses.steps.create.title',
        contentKey: 'help.tours.subprocesses.steps.create.content',
        placement: 'right',
        highlightPadding: 0,
      },
      {
        targetSelector: '.breadcrumb-nav',
        titleKey: 'help.tours.subprocesses.steps.breadcrumb.title',
        contentKey: 'help.tours.subprocesses.steps.breadcrumb.content',
        placement: 'bottom',
      },
    ],
  },

  // ── Token Game ─────────────────────────────────────────
  {
    id: 'token-game',
    titleKey: 'help.tours.tokenGame.title',
    descriptionKey: 'help.tours.tokenGame.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Token"]',
        titleKey: 'help.tours.tokenGame.steps.tab.title',
        contentKey: 'help.tours.tokenGame.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.token-game-panel, .right-panel-content',
        titleKey: 'help.tours.tokenGame.steps.controls.title',
        contentKey: 'help.tours.tokenGame.steps.controls.content',
        placement: 'left',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.tokenGame.steps.animation.title',
        contentKey: 'help.tours.tokenGame.steps.animation.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Token Game: Conflicts ──────────────────────────────
  {
    id: 'token-game-conflicts',
    titleKey: 'help.tours.tokenGameConflicts.title',
    descriptionKey: 'help.tours.tokenGameConflicts.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Token"]',
        titleKey: 'help.tours.tokenGameConflicts.steps.tab.title',
        contentKey: 'help.tours.tokenGameConflicts.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.token-game-panel, .right-panel-content',
        titleKey: 'help.tours.tokenGameConflicts.steps.conflictOptions.title',
        contentKey: 'help.tours.tokenGameConflicts.steps.conflictOptions.content',
        placement: 'left',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.tokenGameConflicts.steps.deadlock.title',
        contentKey: 'help.tours.tokenGameConflicts.steps.deadlock.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Analysis ───────────────────────────────────────────
  {
    id: 'analysis',
    titleKey: 'help.tours.analysis.title',
    descriptionKey: 'help.tours.analysis.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Analy"]',
        titleKey: 'help.tours.analysis.steps.tab.title',
        contentKey: 'help.tours.analysis.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.analysis.steps.panel.title',
        contentKey: 'help.tours.analysis.steps.panel.content',
        placement: 'left',
      },
    ],
  },

  // ── Coverability Graph ─────────────────────────────────
  {
    id: 'analysis-coverability',
    titleKey: 'help.tours.analysisCoverability.title',
    descriptionKey: 'help.tours.analysisCoverability.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Analy"]',
        titleKey: 'help.tours.analysisCoverability.steps.tab.title',
        contentKey: 'help.tours.analysisCoverability.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.analysisCoverability.steps.section.title',
        contentKey: 'help.tours.analysisCoverability.steps.section.content',
        placement: 'left',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.analysisCoverability.steps.graph.title',
        contentKey: 'help.tours.analysisCoverability.steps.graph.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Process Metrics ────────────────────────────────────
  {
    id: 'analysis-metrics',
    titleKey: 'help.tours.analysisMetrics.title',
    descriptionKey: 'help.tours.analysisMetrics.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Analy"]',
        titleKey: 'help.tours.analysisMetrics.steps.tab.title',
        contentKey: 'help.tours.analysisMetrics.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.analysisMetrics.steps.metrics.title',
        contentKey: 'help.tours.analysisMetrics.steps.metrics.content',
        placement: 'left',
      },
    ],
  },

  // ── Simulation Overview ────────────────────────────────
  {
    id: 'simulation-overview',
    titleKey: 'help.tours.simulationOverview.title',
    descriptionKey: 'help.tours.simulationOverview.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Simul"]',
        titleKey: 'help.tours.simulationOverview.steps.tab.title',
        contentKey: 'help.tours.simulationOverview.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationOverview.steps.config.title',
        contentKey: 'help.tours.simulationOverview.steps.config.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationOverview.steps.results.title',
        contentKey: 'help.tours.simulationOverview.steps.results.content',
        placement: 'left',
      },
    ],
  },

  // ── Simulation: Time Models ────────────────────────────
  {
    id: 'simulation-time-models',
    titleKey: 'help.tours.simulationTimeModels.title',
    descriptionKey: 'help.tours.simulationTimeModels.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Simul"]',
        titleKey: 'help.tours.simulationTimeModels.steps.tab.title',
        contentKey: 'help.tours.simulationTimeModels.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationTimeModels.steps.defaultTime.title',
        contentKey: 'help.tours.simulationTimeModels.steps.defaultTime.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationTimeModels.steps.distributions.title',
        contentKey: 'help.tours.simulationTimeModels.steps.distributions.content',
        placement: 'left',
      },
    ],
  },

  // ── Simulation: Resources ──────────────────────────────
  {
    id: 'simulation-resources',
    titleKey: 'help.tours.simulationResources.title',
    descriptionKey: 'help.tours.simulationResources.description',
    steps: [
      {
        targetSelector: '.tab-btn[title*="Simul"]',
        titleKey: 'help.tours.simulationResources.steps.tab.title',
        contentKey: 'help.tours.simulationResources.steps.tab.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationResources.steps.define.title',
        contentKey: 'help.tours.simulationResources.steps.define.content',
        placement: 'left',
      },
      {
        targetSelector: '.right-panel-content',
        titleKey: 'help.tours.simulationResources.steps.assign.title',
        contentKey: 'help.tours.simulationResources.steps.assign.content',
        placement: 'left',
      },
    ],
  },

  // ── File Operations ────────────────────────────────────
  {
    id: 'file-operations',
    titleKey: 'help.tours.fileOperations.title',
    descriptionKey: 'help.tours.fileOperations.description',
    steps: [
      {
        targetSelector: '.file-menu',
        titleKey: 'help.tours.fileOperations.steps.menu.title',
        contentKey: 'help.tours.fileOperations.steps.menu.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.fileOperations.steps.dragDrop.title',
        contentKey: 'help.tours.fileOperations.steps.dragDrop.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── File Templates ─────────────────────────────────────
  {
    id: 'file-templates',
    titleKey: 'help.tours.fileTemplates.title',
    descriptionKey: 'help.tours.fileTemplates.description',
    steps: [
      {
        targetSelector: '.file-menu',
        titleKey: 'help.tours.fileTemplates.steps.menu.title',
        contentKey: 'help.tours.fileTemplates.steps.menu.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.canvas-container',
        titleKey: 'help.tours.fileTemplates.steps.preview.title',
        contentKey: 'help.tours.fileTemplates.steps.preview.content',
        placement: 'right',
        highlightPadding: 0,
      },
    ],
  },

  // ── Settings ───────────────────────────────────────────
  {
    id: 'settings',
    titleKey: 'help.tours.settings.title',
    descriptionKey: 'help.tours.settings.description',
    steps: [
      {
        targetSelector: '.settings-btn',
        titleKey: 'help.tours.settings.steps.button.title',
        contentKey: 'help.tours.settings.steps.button.content',
        placement: 'bottom',
      },
      {
        targetSelector: '.editor-toolbar',
        titleKey: 'help.tours.settings.steps.themes.title',
        contentKey: 'help.tours.settings.steps.themes.content',
        placement: 'bottom',
      },
    ],
  },
]
