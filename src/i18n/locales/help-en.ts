export default {
  // ── UI strings ─────────────────────────────────────────
  title: 'Help',
  search: 'Search articles...',
  searchNoResults: 'No articles found for "{query}"',
  startTour: 'Start Tour',
  guidedTours: 'Guided Tours',
  backToOverview: 'All Articles',
  learnMore: 'Learn more',

  // Tour UI
  tourStep: 'Step {current} of {total}',
  tourNext: 'Next',
  tourPrev: 'Back',
  tourFinish: 'Finish',
  tourSkip: 'Skip Tour',

  // Tooltip
  tooltipMore: 'More info...',

  // Inline tooltip texts
  tooltips: {
    properties: {
      title: 'Properties Panel',
      content: 'Select an element on the canvas to view and edit its properties like name, tokens, capacity, or arc weight.',
    },
    tokenGame: {
      title: 'Token Game',
      content: 'Simulate your Petri net step by step. Start the game, fire transitions, and observe token flow.',
    },
    analysis: {
      title: 'Analysis',
      content: 'Check your Petri net for structural validity and behavioral correctness with workflow and soundness checks.',
    },
    simulation: {
      title: 'Quantitative Simulation',
      content: 'Run discrete-event simulations with time models and resources to analyze performance and throughput.',
    },
    places: {
      title: 'Places',
      content: 'Places (circles) hold tokens and represent conditions or states in your Petri net.',
    },
    transitions: {
      title: 'Transitions',
      content: 'Transitions (rectangles) represent actions. They fire when all input places have enough tokens.',
    },
    operators: {
      title: 'Workflow Operators',
      content: 'Operators model workflow patterns: AND for parallel execution, XOR for exclusive choice.',
    },
    arcRouting: {
      title: 'Arc Routing',
      content: 'Choose how arcs are drawn: direct, orthogonal, curved (Bezier), or with manual waypoints.',
    },
    conflictResolution: {
      title: 'Conflict Resolution',
      content: 'When multiple transitions are enabled, choose how to resolve: manually, randomly, or by priority.',
    },
    coverabilityGraph: {
      title: 'Coverability Graph',
      content: 'Shows all reachable states of your net. Helps detect deadlocks and unbounded places.',
    },
    timeModel: {
      title: 'Time Model',
      content: 'Assign processing time distributions to transitions: constant, exponential, normal, uniform, or triangular.',
    },
    resources: {
      title: 'Resources',
      content: 'Define limited resources (human, machine, system) and assign them to transitions for realistic simulation.',
    },
  },

  // ── Categories ─────────────────────────────────────────
  categories: {
    gettingStarted: 'Getting Started',
    editor: 'Editor',
    operators: 'Operators',
    subprocesses: 'Subprocesses',
    tokenGame: 'Token Game',
    analysis: 'Analysis',
    simulation: 'Simulation',
    files: 'File Operations',
    settings: 'Settings',
    shortcuts: 'Keyboard Shortcuts',
  },

  // ── Tours ──────────────────────────────────────────────
  tours: {
    welcome: {
      title: 'Welcome to WoPeD Next',
      description: 'A quick overview of the application interface.',
      steps: {
        toolbar: {
          title: 'Toolbar',
          content: 'This is the main toolbar. Here you find the file menu, editing tools for places, transitions, arcs and operators, undo/redo buttons, and zoom controls.',
        },
        canvas: {
          title: 'Canvas',
          content: 'This is your workspace. Click on the canvas to place elements, drag to move them, and use the mouse wheel to zoom. Right-click for the context menu.',
        },
        panels: {
          title: 'Side Panels',
          content: 'The right panel has four tabs: Properties (edit selected elements), Token Game (simulate execution), Analysis (check your net), and Simulation (quantitative analysis).',
        },
        viewToolbar: {
          title: 'View Toolbar',
          content: 'Controls for zoom, rotation, grid visibility, snap-to-grid, and automatic layout algorithms.',
        },
        overview: {
          title: 'Overview (Minimap)',
          content: 'A miniature view of your entire Petri net. The blue rectangle shows the current viewport. Click to navigate quickly.',
        },
      },
    },

    editorBasics: {
      title: 'Editor Basics',
      description: 'Learn how to create and edit Petri net elements.',
      steps: {
        tools: {
          title: 'Tool Palette',
          content: 'Select a tool to start creating elements. Each tool has a keyboard shortcut shown in its tooltip.',
        },
        place: {
          title: 'Place Tool (P)',
          content: 'Click this button or press P, then click on the canvas to create a place (circle). Places hold tokens and represent conditions or states.',
        },
        transition: {
          title: 'Transition Tool (T)',
          content: 'Click this or press T, then click on the canvas. Transitions (rectangles) represent actions or events that consume and produce tokens.',
        },
        arc: {
          title: 'Arc Tool (A)',
          content: 'Press A, then click a source element and then a target to create a directed arc. Arcs connect places to transitions and vice versa.',
        },
        operator: {
          title: 'Operator Tool (O)',
          content: 'Operators are special transitions for workflow patterns: AND-Split, AND-Join, XOR-Split, XOR-Join, and combined types. Click the dropdown arrow to choose.',
        },
        properties: {
          title: 'Properties Panel',
          content: 'Select any element on the canvas and its properties appear here. You can edit names, tokens, capacity, arc weights, routing mode, and more.',
        },
      },
    },

    canvasNavigation: {
      title: 'Canvas Navigation',
      description: 'Learn how to navigate, zoom, and configure the canvas.',
      steps: {
        viewToolbar: {
          title: 'View Toolbar',
          content: 'This floating toolbar gives you quick access to all view controls: zoom, rotation, grid settings, and auto layout.',
        },
        zoom: {
          title: 'Zoom Controls',
          content: 'Use + and − to zoom in and out. Click "Fit" to auto-zoom so all elements fit in the viewport. You can also use the mouse wheel.',
        },
        rotation: {
          title: 'Rotation',
          content: 'Rotate the entire canvas by 90° clockwise (↻) or counter-clockwise (↺). The current rotation angle is shown between the buttons.',
        },
        grid: {
          title: 'Grid & Snap',
          content: 'Toggle the background grid (▦) for visual alignment. Enable Snap (⊞) to automatically align elements to grid positions when moving.',
        },
        minimap: {
          title: 'Minimap',
          content: 'The overview shows your entire Petri net in miniature. The blue rectangle is your current viewport. Click anywhere on the minimap to quickly navigate.',
        },
        panZoom: {
          title: 'Pan & Zoom on Canvas',
          content: 'Click and drag on empty areas to pan. Use the mouse wheel to zoom. Right-click for the context menu with quick actions.',
        },
      },
    },

    arcsRouting: {
      title: 'Arc Routing',
      description: 'Learn about the different arc routing modes.',
      steps: {
        arcTool: {
          title: 'Arc Tool (A)',
          content: 'Select the Arc tool from the toolbar or press A. Then click a source element and a target element to create a directed arc.',
        },
        createArc: {
          title: 'Creating Arcs',
          content: 'Click on a place to start, then click on a transition to connect them (or vice versa). A preview line follows your cursor while creating.',
        },
        routingModes: {
          title: 'Routing Modes',
          content: 'Select an arc and open the Properties panel. Choose between Direct (straight line), Orthogonal (right angles), Curved (Bezier), or Manual (custom waypoints by double-clicking the arc).',
        },
      },
    },

    undoRedo: {
      title: 'Undo & Redo',
      description: 'Learn how to undo and redo your changes.',
      steps: {
        undo: {
          title: 'Undo (Ctrl+Z)',
          content: 'Click this button or press Ctrl+Z to undo the last action. All element creation, deletion, movement, and property changes are tracked.',
        },
        redo: {
          title: 'Redo (Ctrl+Y)',
          content: 'Click this button or press Ctrl+Y (or Ctrl+Shift+Z) to redo a previously undone action. Buttons are grayed out when unavailable.',
        },
      },
    },

    layout: {
      title: 'Auto Layout',
      description: 'Automatically arrange elements in your Petri net.',
      steps: {
        button: {
          title: 'Layout Menu',
          content: 'Click "Auto Layout" to open the layout settings. Choose between Hierarchical, Force-Directed, or Grid algorithms. Configure direction, node spacing, and rank spacing.',
        },
        result: {
          title: 'Layout Result',
          content: 'After applying the layout, elements are rearranged on the canvas. The view automatically fits to show all elements. Try different algorithms to find the best arrangement.',
        },
      },
    },

    operators: {
      title: 'Workflow Operators',
      description: 'Learn how to use AND/XOR split and join operators.',
      steps: {
        dropdown: {
          title: 'Operator Type Selection',
          content: 'Click the dropdown arrow to see all operator types: AND-Split, AND-Join, XOR-Split, XOR-Join, and four combined types. Select one, then click the canvas to place it.',
        },
        canvas: {
          title: 'Operators on Canvas',
          content: 'Operators appear as diamonds (◇). Green for AND operators, orange for XOR operators, purple for combined types. Connect them with arcs like regular transitions.',
        },
        properties: {
          title: 'Operator Properties',
          content: 'Select an operator and see its properties here. You can change the operator type after placement using the dropdown in the properties panel.',
        },
      },
    },

    subprocesses: {
      title: 'Subprocesses',
      description: 'Create and navigate hierarchical Petri nets.',
      steps: {
        tool: {
          title: 'Subprocess Tool (S)',
          content: 'Select the Subprocess tool or press S, then click on the canvas. A subprocess appears as a rounded rectangle with double border.',
        },
        create: {
          title: 'Working with Subprocesses',
          content: 'Double-click a subprocess to open its inner Petri net. Inside, you can build a complete Petri net with its own places, transitions, and arcs.',
        },
        breadcrumb: {
          title: 'Breadcrumb Navigation',
          content: 'The breadcrumb bar shows your position in the hierarchy. Click on any parent to navigate back. During the token game, you can step in and out of subprocesses.',
        },
      },
    },

    tokenGame: {
      title: 'Token Game',
      description: 'Learn how to simulate Petri net execution step by step.',
      steps: {
        tab: {
          title: 'Token Game Tab',
          content: 'Click this tab to open the token game controls. You can also start the token game directly — the tab will activate automatically.',
        },
        controls: {
          title: 'Token Game Controls',
          content: 'Use Start to begin, Step to fire one transition, Play for automatic execution, and Stop to end. You can adjust the speed and conflict resolution strategy.',
        },
        animation: {
          title: 'Animated Execution',
          content: 'Watch tokens move along arcs as transitions fire. Enabled transitions are highlighted in green. If no transition can fire, a deadlock is detected.',
        },
      },
    },

    tokenGameConflicts: {
      title: 'Conflicts & Deadlocks',
      description: 'Understand conflict resolution and deadlock detection.',
      steps: {
        tab: {
          title: 'Token Game Tab',
          content: 'Open the Token Game tab. Start the token game first, then explore the conflict resolution options below the playback controls.',
        },
        conflictOptions: {
          title: 'Conflict Resolution',
          content: 'When multiple transitions compete for tokens, choose your strategy: Manual (you pick), Random (auto-select), or Priority (ordered). The setting is below the speed slider.',
        },
        deadlock: {
          title: 'Deadlock Detection',
          content: 'If no transition can fire, the token game detects a deadlock and shows a warning. This means your net has a structural issue — run the Analysis to investigate.',
        },
      },
    },

    analysis: {
      title: 'Analysis',
      description: 'Discover how to analyze your Petri net for correctness.',
      steps: {
        tab: {
          title: 'Analysis Tab',
          content: 'Click this tab to access all analysis features: workflow checks, soundness verification, coverability graphs, and process metrics.',
        },
        panel: {
          title: 'Analysis Panel',
          content: 'Run individual analyses or use "Run All" for a complete check. Results show structural properties (places, transitions, arcs) and behavioral properties (bounded, safe, live, deadlock-free).',
        },
      },
    },

    analysisCoverability: {
      title: 'Coverability Graph',
      description: 'Explore all reachable states of your Petri net.',
      steps: {
        tab: {
          title: 'Analysis Tab',
          content: 'Open the Analysis tab to access the coverability graph feature. Scroll down to find the "Coverability Graph" section.',
        },
        section: {
          title: 'Build the Graph',
          content: 'Expand the Coverability Graph section and click "Build Graph". The system computes all reachable markings (states) and transitions between them.',
        },
        graph: {
          title: 'Interpreting Results',
          content: 'The graph shows states as nodes and transition firings as edges. Look for deadlock states (no outgoing edges) and ω symbols (unbounded places). Statistics are displayed above the graph.',
        },
      },
    },

    analysisMetrics: {
      title: 'Process Metrics',
      description: 'Measure the complexity and quality of your Petri net.',
      steps: {
        tab: {
          title: 'Analysis Tab',
          content: 'Open the Analysis tab. The Metrics section provides quantitative measures of your net\'s structure.',
        },
        metrics: {
          title: 'Calculating Metrics',
          content: 'Click the ▶ button to calculate all metrics. Results are grouped into Size, Complexity, Density, and Quality categories. Use "Export Report" to download the results.',
        },
      },
    },

    simulationOverview: {
      title: 'Simulation Overview',
      description: 'Run discrete-event simulations for performance analysis.',
      steps: {
        tab: {
          title: 'Simulation Tab',
          content: 'Click this tab to open the simulation panel. Here you configure and run quantitative simulations of your Petri net.',
        },
        config: {
          title: 'Configuration',
          content: 'Set the arrival rate, simulation time, warmup period, and number of replications. The "Config" tab provides all parameters needed to run a simulation.',
        },
        results: {
          title: 'Results & Visualization',
          content: 'After running, switch to the Results tab to see throughput, cycle time, completion rate, activity statistics, and event timelines. Export results as CSV for further analysis.',
        },
      },
    },

    simulationTimeModels: {
      title: 'Time Models',
      description: 'Configure processing time distributions for transitions.',
      steps: {
        tab: {
          title: 'Simulation Tab',
          content: 'Open the Simulation tab and switch to the "Time Model" sub-tab to configure processing times.',
        },
        defaultTime: {
          title: 'Default Processing Time',
          content: 'Set a default time distribution that applies to all transitions without individual configuration. Choose the distribution type and set its parameters.',
        },
        distributions: {
          title: 'Distribution Types',
          content: 'Choose from Constant (fixed), Exponential (memoryless), Normal (bell curve), Uniform (equal range), or Triangular (min/mode/max). Each transition can have its own distribution.',
        },
      },
    },

    simulationResources: {
      title: 'Resources',
      description: 'Define resources and find bottlenecks in your process.',
      steps: {
        tab: {
          title: 'Simulation Tab',
          content: 'Open the Simulation tab and switch to the "Resources" sub-tab to define and manage resources.',
        },
        define: {
          title: 'Defining Resources',
          content: 'Add resources with a name, type (Human, Machine, System), and capacity. Resources represent limited capacities that transitions compete for.',
        },
        assign: {
          title: 'Resource Assignments',
          content: 'Assign resources to transitions specifying how many units each transition needs. After simulation, check the bottleneck analysis to identify overloaded resources.',
        },
      },
    },

    fileOperations: {
      title: 'File Operations',
      description: 'Learn how to open, save, and export Petri nets.',
      steps: {
        menu: {
          title: 'File Menu',
          content: 'Click the File menu to access New, Open, Save, Save As, and Export options. Supported formats are PNML (standard) and JSON. Export images as SVG or PNG.',
        },
        dragDrop: {
          title: 'Drag & Drop',
          content: 'You can also drag .pnml or .json files directly onto the canvas to open them. The file will be loaded and the net displayed immediately.',
        },
      },
    },

    fileTemplates: {
      title: 'Templates',
      description: 'Start with predefined Petri net patterns.',
      steps: {
        menu: {
          title: 'Templates Menu',
          content: 'Open the File menu and hover over "Templates" to see predefined patterns: basic patterns (Sequence, Choice, Parallelism, Loop), synchronization patterns, and workflow examples.',
        },
        preview: {
          title: 'Loading Templates',
          content: 'Click any template to load it onto the canvas. Templates replace the current net — save your work first if needed. They are great starting points for learning and modeling.',
        },
      },
    },

    settings: {
      title: 'Settings',
      description: 'Configure the application to your preferences.',
      steps: {
        button: {
          title: 'Settings Button',
          content: 'Click the gear icon (⚙) to open the settings dialog. You can configure appearance, editor behavior, token game, and analysis settings.',
        },
        themes: {
          title: 'Theme & Language',
          content: 'In the General tab, switch between Light, Dark, and System themes. Change the language between English and Deutsch. Enable Auto-Save to automatically preserve your work.',
        },
      },
    },
  },

  // ── Articles ───────────────────────────────────────────
  articles: {
    welcome: {
      title: 'Welcome to WoPeD Next',
      content: `WoPeD Next is a web-based Petri net editor for modeling, analyzing, and simulating workflow processes.

**What you can do:**
- **Model** Petri nets with places, transitions, arcs, operators, and subprocesses
- **Execute** your model step-by-step with the Token Game
- **Analyze** structural and behavioral properties, build coverability graphs
- **Simulate** quantitative performance with time models and resources
- **Import/Export** in PNML and JSON formats, export as SVG or PNG

**Quick start:** Select the Place tool (P), click on the canvas to create a place, switch to Transition (T) and create a transition, then use Arc (A) to connect them.

Tip: Press F1 at any time to open this help dialog.`,
    },

    petriNetBasics: {
      title: 'Petri Net Basics',
      content: `A **Petri net** is a mathematical model for describing distributed systems and workflows.

**Core elements:**

**Places** (circles ○) represent conditions, states, or buffers. They can hold **tokens** (black dots) that represent resources or control flow markers.

**Transitions** (rectangles □) represent actions, events, or tasks. A transition is **enabled** when all its input places have enough tokens.

**Arcs** (arrows →) connect places to transitions and transitions to places. They define the flow relation. Each arc has a **weight** (default: 1) that specifies how many tokens are consumed or produced.

**Firing rule:** When a transition fires, it removes tokens from its input places (according to arc weights) and adds tokens to its output places.

**Workflow nets** are a special class of Petri nets with exactly one start place and one end place, where every element is on a path from start to end.`,
    },

    editorTools: {
      title: 'Editor Tools',
      content: `The toolbar provides the following tools:

**Select (V)** — Click to select elements, drag to move. Hold Shift to select multiple elements. Press Escape to deselect all.

**Place (P)** — Click on the canvas to create a new place. Places are shown as circles and hold tokens.

**Transition (T)** — Click on the canvas to create a transition. Transitions are shown as rectangles.

**Operator (O)** — Click the dropdown arrow to choose an operator type, then click on the canvas. Operators model workflow patterns (AND/XOR split/join).

**Subprocess (S)** — Click on the canvas to create a subprocess element. Double-click it to open the nested Petri net.

**Arc (A)** — Click a source element, then click a target to create an arc. Arcs can only connect places to transitions or transitions to places.

**Delete (D)** — Click on an element to delete it. You can also select elements and press Delete/Backspace.

Use **Undo (Ctrl+Z)** and **Redo (Ctrl+Y / Ctrl+Shift+Z)** to reverse changes.`,
    },

    canvasNavigation: {
      title: 'Canvas Navigation',
      content: `**Zoom:** Use the mouse wheel or the zoom buttons (+/−) in the view toolbar. Click "Fit" to zoom so all elements are visible.

**Pan:** Click and drag on an empty area of the canvas to pan the view.

**Rotation:** Use the rotation buttons (↺ ↻) in the view toolbar to rotate the view by 90°.

**Grid:** Toggle the background grid with the grid button (▦). Enable "Snap" (⊞) to align elements to grid positions automatically.

**Minimap:** The overview panel in the bottom-left shows a miniature of the entire net. The blue rectangle represents your current viewport. Click on the minimap to navigate quickly.

**Drag & Drop:** You can drag .pnml or .json files directly onto the canvas to open them.`,
    },

    arcsRouting: {
      title: 'Arc Routing',
      content: `Arcs support multiple routing modes, configurable in the Properties panel:

**Direct** — A straight line from source to target. Simplest mode.

**Orthogonal** — The arc uses only horizontal and vertical segments. Good for clean, diagram-like layouts.

**Curved (Bezier)** — Smooth curves that avoid overlapping with other elements. Provides a natural appearance.

**Manual Waypoints** — You control the exact path:
- Double-click on an arc to add a waypoint
- Drag waypoints to adjust the path
- Double-click on a waypoint handle to remove it

To change the routing mode, select an arc and use the "Routing" dropdown in the Properties panel.

**Arc weight:** Each arc has a weight (default: 1). Higher weights mean more tokens are consumed/produced when the connected transition fires. Edit weights in the Properties panel.`,
    },

    undoRedo: {
      title: 'Undo & Redo',
      content: `WoPeD Next tracks all editing actions and allows you to undo and redo them.

**Undo:** Press **Ctrl+Z** (or Cmd+Z on Mac) or click the ↩ button. Reverts the last action.

**Redo:** Press **Ctrl+Y** or **Ctrl+Shift+Z** (or Cmd+Shift+Z on Mac) or click the ↪ button. Re-applies a previously undone action.

The following operations are tracked:
- Creating and deleting elements (places, transitions, arcs, operators, subprocesses)
- Moving elements
- Changing properties (name, tokens, capacity, weight, etc.)
- Layout changes

The undo/redo buttons are grayed out when no actions are available.`,
    },

    layout: {
      title: 'Auto Layout',
      content: `Use the auto layout feature to automatically arrange elements in your Petri net.

**Algorithms:**

**Hierarchical** (default) — Arranges elements in layers from left to right (or top to bottom). Best for workflow-like nets with a clear direction.

**Force-Directed** — Uses a physics simulation where elements repel each other and arcs act as springs. Good for discovering natural structure in complex nets.

**Grid** — Arranges elements in a regular grid pattern. Useful for quickly organizing messy layouts.

**Options:**
- **Direction:** Left→Right, Top→Bottom, Right→Left, or Bottom→Top
- **Node Spacing:** Distance between elements in the same layer
- **Rank Spacing:** Distance between layers

Open the layout menu from the view toolbar (⬡ Auto Layout), configure your preferences, and click "Apply Layout".`,
    },

    operatorsOverview: {
      title: 'Workflow Operators',
      content: `Operators are special transitions that model common workflow routing patterns. They are shown as diamond shapes (◇) on the canvas.

**Why operators?** In classic Petri nets, you need multiple places and transitions to model parallel execution or exclusive choices. Operators provide a compact notation.

**Types of operators:**
- **Split** operators have one input and multiple outputs
- **Join** operators have multiple inputs and one output
- **Combined** operators have both split and join behavior

**AND operators** (◇, green) require/produce tokens on **all** connected arcs — modeling parallel execution.

**XOR operators** (⊗, orange) require/produce a token on exactly **one** arc — modeling exclusive choice.

To create an operator: Select the Operator tool (O), click the dropdown to choose the type, then click on the canvas.`,
    },

    operatorsTypes: {
      title: 'Operator Types in Detail',
      content: `**AND-Split** (◇→) — Takes one token from the input place and produces a token on each output arc. Models parallel fork.

**AND-Join** (→◇) — Waits for a token on every input arc, then produces one token on the output. Models synchronization.

**XOR-Split** (⊗→) — Takes one token from the input and places it on exactly one output arc (non-deterministic choice). Models exclusive decision.

**XOR-Join** (→⊗) — Takes a token from any one input arc and produces a token on the output. Models merging of alternative paths.

**AND-Split-Join** (◇◇) — Combines AND-Split and AND-Join behavior in a single element.

**XOR-Split-Join** (⊗⊗) — Combines XOR-Split and XOR-Join behavior.

**AND-Join/XOR-Split** (◇⊗) — AND behavior on input side, XOR on output side.

**XOR-Join/AND-Split** (⊗◇) — XOR behavior on input side, AND on output side.`,
    },

    subprocesses: {
      title: 'Subprocesses',
      content: `Subprocesses allow you to build hierarchical Petri nets with nested levels.

**Creating a subprocess:** Select the Subprocess tool (S) and click on the canvas. A subprocess appears as a rounded rectangle with a double border.

**Opening a subprocess:** Double-click the subprocess element to open its inner net. The breadcrumb navigation at the top shows your current position in the hierarchy.

**Navigating back:** Click on a parent net in the breadcrumb bar, or use the "Go Back" button.

**Token Game with subprocesses:** During the token game, when a token arrives at a subprocess, you can step into it. The token game continues inside the subprocess. When the inner net finishes (token reaches the end place), you can step back out.

**Process hierarchy:** The Process Structure panel shows the complete tree of main process and subprocesses.`,
    },

    tokenGameBasics: {
      title: 'Token Game Basics',
      content: `The Token Game lets you simulate the execution of your Petri net step by step.

**Starting:** Click "Start" in the Token Game panel (or switch to the Token Game tab — it opens automatically).

**Step mode:** Click "Step" to fire one enabled transition. If multiple transitions are enabled, a conflict dialog appears (depending on your conflict resolution setting).

**Play mode:** Click "Play" for automatic execution. Transitions fire one after another at the configured speed. Click "Pause" to stop.

**History:** The history panel shows all previous markings (states). Click any step to jump back. Use "Step Back" to undo the last firing.

**Statistics:** Track how many steps were taken, which transitions fired most often, how many conflicts and deadlocks occurred, and elapsed time.

**Stopping:** Click "Stop" to end the token game and return to editing mode. The original marking is restored.`,
    },

    tokenGameConflicts: {
      title: 'Conflicts & Deadlocks',
      content: `**Conflicts** occur when multiple transitions are enabled but firing one disables another (they compete for the same tokens).

**Resolution strategies:**
- **Manual** — A dialog appears asking you to choose which transition to fire
- **Random** — The system picks a random enabled transition
- **Priority** — Transitions are fired in order of priority

You can set the default strategy in Settings → Simulation → Conflict Resolution.

**Deadlocks** occur when no transition is enabled and the net has not reached a proper final state. The token game detects this and shows a warning.

**Detecting issues:** If your net frequently deadlocks, consider running the Analysis (soundness check) to find structural problems.`,
    },

    analysisOverview: {
      title: 'Analysis Overview',
      content: `The Analysis panel offers tools to verify your Petri net's correctness.

**Workflow Check** — Verifies that your net is a valid workflow net:
- Exactly one start place (no incoming arcs)
- Exactly one end place (no outgoing arcs)
- Every element is on a path from start to end
- The net is connected

**Soundness Check** — Verifies behavioral correctness:
- **Bounded:** The number of tokens in any place is bounded
- **Safe:** No place ever holds more than one token
- **Live:** Every transition can eventually fire again
- **Deadlock-free:** The net can always make progress
- **Reversible:** The initial marking can always be reached again

**How to run:** Click "Run All" for a complete analysis, or run individual checks with the ▶ buttons.

**Issues:** Problems are listed with severity (error, warning, info) and descriptions.`,
    },

    analysisCoverability: {
      title: 'Coverability Graph',
      content: `The **coverability graph** (also called reachability graph for bounded nets) shows all possible states of your Petri net.

**What it shows:**
- Each **node** represents a marking (state) — the number of tokens in each place
- Each **edge** represents a transition firing that leads from one state to another
- **Deadlock states** have no outgoing edges
- **ω (omega)** symbols indicate unbounded places

**Building the graph:** Click "Build Graph" in the Analysis panel's Coverability Graph section.

**Interpreting results:**
- **States:** Total number of reachable markings
- **Deadlocks:** States where no transition is enabled
- **Final States:** States that are proper termination points
- **Unbounded:** If ω appears, the net is unbounded (tokens can grow infinitely)

**Note:** The maximum number of states is limited (configurable in Settings) to prevent excessive computation.`,
    },

    analysisMetrics: {
      title: 'Process Metrics',
      content: `Process metrics provide quantitative measures of your Petri net's structure and quality.

**Size Metrics:**
- Places, Transitions, Arcs, Operators, Subprocesses, Total Nodes

**Complexity Metrics:**
- **Cyclomatic Complexity** — Number of independent paths: Arcs − Nodes + 2
- **Control Flow Complexity** — Based on split/join operators
- **Structuredness** — Ratio of structured patterns (higher = better)
- **Maximum Depth** — Deepest nesting level of subprocesses

**Density Metrics:**
- **Arc Density** — Ratio of arcs to maximum possible arcs
- **Coefficient of Connectivity** — Arcs per node
- **Connector Mismatch** — Imbalance between splits and joins
- **Average Connector Degree** — Average number of connections per operator

**Quality Metrics:**
- **Separability** — How well the net decomposes into independent parts
- **Sequentiality** — Ratio of sequential behavior
- **Token Complexity** — Number of token-dependent behaviors

Click ▶ to calculate all metrics. Use "Export Report" to download results.`,
    },

    simulationOverview: {
      title: 'Quantitative Simulation',
      content: `The simulation feature performs discrete-event simulation to analyze your Petri net's performance.

**Configuration:**
- **Arrival Rate:** How often new cases enter the system
- **Simulation Time:** Total duration of the simulation run
- **Warmup Time:** Initial period excluded from statistics (to reach steady state)
- **Replications:** Number of independent simulation runs for statistical confidence
- **Random Seed:** For reproducible results (or "Auto" for random)

**Results:**
- **Throughput:** Cases completed per time unit
- **Avg Cycle Time:** Average time from start to finish
- **Completion Rate:** Percentage of cases that finished
- **Activity Statistics:** Per-transition execution count, average time, and utilization

**Visualizations:**
- Timeline showing events over time
- Throughput line chart
- Resource utilization pie charts

Click "Run Simulation" to start. Use "Export CSV" to download detailed results.`,
    },

    simulationTimeModels: {
      title: 'Time Models',
      content: `Each transition can have its own processing time distribution.

**Distributions:**

**Constant** — Always takes exactly the specified value. Use for fixed-duration tasks.

**Exponential** — Random times with a given mean. Memoryless property. Good for arrival processes and service times.

**Normal** — Bell-shaped distribution with mean and standard deviation. Use for tasks with known average and variability.

**Uniform** — Equal probability between min and max. Use when you only know the range.

**Triangular** — Defined by min, mode (most likely), and max. Use for expert estimates with optimistic, likely, and pessimistic values.

**Configuration:** Open the Simulation panel → Time Model tab. Set a default processing time for all transitions, then override specific transitions as needed.

**Tip:** Start with constant times to verify your model, then add variability with statistical distributions.`,
    },

    simulationResources: {
      title: 'Resources & Bottlenecks',
      content: `Resources model limited capacities that transitions compete for.

**Defining resources:**
- Open Resources in the Simulation panel
- Add resources with a name, type (Human/Machine/System), and capacity
- Assign resources to transitions with the required number of units

**Resource types:**
- **Human** — Employees, operators
- **Machine** — Equipment, servers
- **System** — Software licenses, database connections

**Assignments:** Map resources to transitions. When a transition fires, it acquires the required resources and releases them when complete.

**Bottleneck Analysis:** After simulation, the bottleneck analysis shows:
- Which resources are overloaded
- Average wait times caused by resource contention
- Suggested capacity increases
- Number of affected cases

**Tip:** Start without resources to establish baseline performance, then add resource constraints to identify bottlenecks.`,
    },

    fileOperations: {
      title: 'File Operations',
      content: `**New:** Creates a new empty Petri net, replacing the current one.

**Open:** Load a Petri net from a file. Supported formats:
- **.pnml** — Petri Net Markup Language (XML-based standard)
- **.json** — WoPeD's JSON format

You can also **drag & drop** .pnml or .json files onto the canvas.

**Save / Save As:** Download the current net as a file. Choose between PNML and JSON formats. The "Include Layout" option preserves element positions.

**Export:**
- **SVG** — Scalable vector graphic, ideal for documentation and printing
- **PNG** — Raster image for presentations and quick sharing

**Recent Files:** The file menu shows your recently opened files for quick access.`,
    },

    fileTemplates: {
      title: 'Templates',
      content: `WoPeD Next includes predefined templates to help you get started.

**Basic Patterns:**
- **Sequence** — Simple linear flow from start to end
- **Choice (Conflict)** — Non-deterministic choice between paths
- **Parallelism (AND)** — Concurrent execution with fork and join
- **Loop (Iteration)** — Cyclic behavior with repetition

**Synchronization Patterns:**
- **Mutual Exclusion** — Shared resource with critical section
- **Producer-Consumer** — Classic bounded buffer pattern
- **Semaphore (k=2)** — Counting semaphore for resource pools
- **Dining Philosophers** — Classic concurrency problem

**Workflow Patterns:**
- **Workflow (Operators)** — Business process using AND/XOR operators
- **Traffic Light** — Simple state machine example

Open templates from the File menu → Templates.`,
    },

    settings: {
      title: 'Settings',
      content: `Open settings via the ⚙ button in the toolbar or from the File menu.

**General:**
- **Theme** — Light, Dark, or System (follows OS preference)
- **Language** — English or Deutsch
- **Auto-Save** — Automatically save your work to browser storage at a configurable interval

**Editor:**
- **Grid** — Show/hide the background grid, enable snap-to-grid, set grid size
- **Labels** — Show/hide element labels and token numbers
- **Zoom** — Set default zoom level
- **Animation** — Configure animation duration

**Simulation (Token Game):**
- **Speed** — Default token game speed (ms between steps)
- **Animations** — Enable/disable token movement animations
- **Highlight** — Highlight enabled transitions
- **Conflict Resolution** — Default strategy: Manual, Random, or Priority

**Analysis:**
- **Max States** — Maximum states for coverability graph computation
- **Auto-Analyze** — Automatically run analysis when the net changes
- **Info Messages** — Show/hide informational messages`,
    },

    shortcuts: {
      title: 'Keyboard Shortcuts',
      content: `**Tools:**
| Key | Action |
|-----|--------|
| V | Select tool |
| P | Place tool |
| T | Transition tool |
| O | Operator tool (opens type selector) |
| S | Subprocess tool |
| A | Arc tool |
| D | Delete tool |

**Editing:**
| Key | Action |
|-----|--------|
| Delete / Backspace | Delete selected elements |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Escape | Cancel current action / Deselect all |

**Navigation:**
| Key | Action |
|-----|--------|
| Mouse wheel | Zoom in/out |
| Click + Drag (empty area) | Pan the canvas |

**Other:**
| Key | Action |
|-----|--------|
| F1 | Open help |`,
    },
  },
}
