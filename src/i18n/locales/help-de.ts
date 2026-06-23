export default {
  // ── UI-Strings ─────────────────────────────────────────
  title: 'Hilfe',
  search: 'Artikel durchsuchen...',
  searchNoResults: 'Keine Artikel gefunden für „{query}"',
  startTour: 'Tour starten',
  guidedTours: 'Geführte Touren',
  backToOverview: 'Alle Artikel',
  learnMore: 'Mehr erfahren',

  // Tour UI
  tourStep: 'Schritt {current} von {total}',
  tourNext: 'Weiter',
  tourPrev: 'Zurück',
  tourFinish: 'Fertig',
  tourSkip: 'Tour überspringen',
  welcomeDiscordHint: 'Tritt der WoPeD-Community auf Discord bei – für Support, Updates und Austausch mit anderen Nutzern.',

  // Tooltip
  tooltipMore: 'Mehr Infos...',

  // Inline-Tooltip-Texte
  tooltips: {
    properties: {
      title: 'Eigenschaften-Panel',
      content: 'Wähle ein Element auf der Zeichenfläche um Eigenschaften wie Name, Token, Kapazität oder Kantengewicht zu bearbeiten.',
    },
    tokenGame: {
      title: 'Token-Spiel',
      content: 'Simuliere dein Petri-Netz Schritt für Schritt. Starte das Spiel, feuere Transitionen und beobachte den Token-Fluss.',
    },
    analysis: {
      title: 'Analyse',
      content: 'Prüfe dein Petri-Netz auf strukturelle Gültigkeit und Verhaltenskorrektheit mit Workflow- und Soundness-Prüfungen.',
    },
    simulation: {
      title: 'Quantitative Simulation',
      content: 'Führe diskrete Ereignissimulationen mit Zeitmodellen und Ressourcen durch um Leistung und Durchsatz zu analysieren.',
    },
    places: {
      title: 'Stellen',
      content: 'Stellen (Kreise) halten Token und repräsentieren Bedingungen oder Zustände in deinem Petri-Netz.',
    },
    transitions: {
      title: 'Transitionen',
      content: 'Transitionen (Rechtecke) repräsentieren Aktionen. Sie feuern wenn alle Eingangsstellen genügend Token haben.',
    },
    operators: {
      title: 'Workflow-Operatoren',
      content: 'Operatoren modellieren Workflow-Muster: AND für parallele Ausführung, XOR für exklusive Auswahl.',
    },
    arcRouting: {
      title: 'Kanten-Routing',
      content: 'Wähle wie Kanten gezeichnet werden: direkt, orthogonal, gebogen (Bezier) oder mit manuellen Wegpunkten.',
    },
    conflictResolution: {
      title: 'Konfliktlösung',
      content: 'Wenn mehrere Transitionen aktiviert sind, wähle die Lösung: manuell, zufällig oder nach Priorität.',
    },
    coverabilityGraph: {
      title: 'Erreichbarkeitsgraph',
      content: 'Zeigt alle erreichbaren Zustände deines Netzes. Hilft Deadlocks und unbeschränkte Stellen zu erkennen.',
    },
    timeModel: {
      title: 'Zeitmodell',
      content: 'Weise Transitionen Bearbeitungszeit-Verteilungen zu: konstant, exponentiell, normal, gleichverteilt oder Dreiecksverteilung.',
    },
    resources: {
      title: 'Ressourcen',
      content: 'Definiere begrenzte Ressourcen (Mensch, Maschine, System) und weise sie Transitionen für realistische Simulation zu.',
    },
  },

  // ── Kategorien ─────────────────────────────────────────
  categories: {
    gettingStarted: 'Erste Schritte',
    editor: 'Editor',
    operators: 'Operatoren',
    subprocesses: 'Subprozesse',
    tokenGame: 'Token-Spiel',
    analysis: 'Analyse',
    simulation: 'Simulation',
    files: 'Dateioperationen',
    settings: 'Einstellungen',
    shortcuts: 'Tastaturkürzel',
  },

  // ── Touren ─────────────────────────────────────────────
  tours: {
    welcome: {
      title: 'Willkommen bei WoPeD Next',
      description: 'Ein kurzer Überblick über die Anwendungsoberfläche.',
      steps: {
        splash: {
          title: 'Willkommen bei WoPeD Next',
          content: 'Modelliere, analysiere und simuliere Workflow-Petri-Netze im Browser. Diese kurze Tour führt dich durch die wichtigsten Bereiche des Editors.',
        },
        toolbar: {
          title: 'Werkzeugleiste',
          content: 'Das ist die Hauptwerkzeugleiste. Hier findest du das Datei-Menü, Bearbeitungswerkzeuge für Stellen, Transitionen, Kanten und Operatoren, Rückgängig/Wiederholen-Buttons, Zoom-Steuerung und den Discord-Community-Link.',
        },
        canvas: {
          title: 'Zeichenfläche',
          content: 'Das ist dein Arbeitsbereich. Klicke auf die Fläche um Elemente zu platzieren, ziehe Elemente um sie zu verschieben, ziehe auf leeren Bereichen um mehrere auszuwählen, und halte die Leertaste oder nutze die mittlere Maustaste zum Verschieben. Rechtsklick auf ein Element öffnet Quick Connect. Mausrad zum Zoomen.',
        },
        panels: {
          title: 'Seitenpanels',
          content: 'Das rechte Panel hat vier Tabs: Eigenschaften (ausgewählte Elemente bearbeiten), Token-Spiel (Ausführung simulieren), Analyse (Netz prüfen) und Simulation (quantitative Analyse).',
        },
        viewToolbar: {
          title: 'Ansichts-Werkzeugleiste',
          content: 'Steuerung für Zoom, Rotation, Rastersichtbarkeit, Raster-Einrasten und automatische Layout-Algorithmen.',
        },
        overview: {
          title: 'Übersicht (Minimap)',
          content: 'Eine Miniaturansicht deines gesamten Petri-Netzes. Das blaue Rechteck zeigt den aktuellen Sichtbereich. Klicke zum schnellen Navigieren.',
        },
      },
    },

    editorBasics: {
      title: 'Editor-Grundlagen',
      description: 'Lerne, wie du Petri-Netz-Elemente erstellst und bearbeitest.',
      steps: {
        tools: {
          title: 'Werkzeugpalette',
          content: 'Wähle ein Werkzeug um Elemente zu erstellen. Jedes Werkzeug hat ein Tastaturkürzel, das im Tooltip angezeigt wird.',
        },
        place: {
          title: 'Stellen-Werkzeug (P)',
          content: 'Klicke diesen Button oder drücke P, dann klicke auf die Zeichenfläche um eine Stelle (Kreis) zu erstellen. Stellen halten Token und repräsentieren Zustände oder Bedingungen.',
        },
        transition: {
          title: 'Transitions-Werkzeug (T)',
          content: 'Klicke hier oder drücke T, dann klicke auf die Zeichenfläche. Transitionen (Rechtecke) repräsentieren Aktionen oder Ereignisse, die Token konsumieren und erzeugen.',
        },
        arc: {
          title: 'Kanten-Werkzeug (A)',
          content: 'Drücke A, dann klicke auf ein Quellelement und danach auf ein Ziel um eine gerichtete Kante zu erstellen. Kanten verbinden Stellen mit Transitionen und umgekehrt.',
        },
        operator: {
          title: 'Operator-Werkzeug (O)',
          content: 'Operatoren sind spezielle Transitionen für Workflow-Muster: AND-Split, AND-Join, XOR-Split, XOR-Join und kombinierte Typen. Klicke den Dropdown-Pfeil zum Auswählen.',
        },
        properties: {
          title: 'Eigenschaften-Panel',
          content: 'Wähle ein Element auf der Zeichenfläche und seine Eigenschaften erscheinen hier. Du kannst Namen, Token, Kapazität, Kantengewichte, Routing-Modus und mehr bearbeiten.',
        },
      },
    },

    canvasNavigation: {
      title: 'Canvas-Navigation',
      description: 'Lerne, wie du die Zeichenfläche navigierst, zoomst und konfigurierst.',
      steps: {
        viewToolbar: {
          title: 'Ansichts-Werkzeugleiste',
          content: 'Diese schwebende Werkzeugleiste bietet schnellen Zugriff auf alle Ansichtssteuerungen: Zoom, Rotation, Rastereinstellungen und Auto-Layout.',
        },
        zoom: {
          title: 'Zoom-Steuerung',
          content: 'Nutze + und − zum Vergrößern und Verkleinern. Klicke "Einpassen" um automatisch so zu zoomen, dass alle Elemente sichtbar sind. Du kannst auch das Mausrad nutzen.',
        },
        rotation: {
          title: 'Rotation',
          content: 'Drehe die gesamte Zeichenfläche um 90° im Uhrzeigersinn (↻) oder gegen den Uhrzeigersinn (↺). Der aktuelle Rotationswinkel wird zwischen den Buttons angezeigt.',
        },
        grid: {
          title: 'Raster & Einrasten',
          content: 'Schalte das Hintergrundraster (▦) für visuelle Ausrichtung um. Aktiviere Einrasten (⊞) um Elemente beim Bewegen automatisch am Raster auszurichten.',
        },
        minimap: {
          title: 'Minimap',
          content: 'Die Übersicht zeigt dein gesamtes Petri-Netz in Miniatur. Das blaue Rechteck ist dein aktueller Sichtbereich. Klicke irgendwo auf die Minimap um schnell zu navigieren.',
        },
        panZoom: {
          title: 'Verschieben & Zoomen auf der Zeichenfläche',
          content: 'Klicke und ziehe auf leeren Bereichen um mehrere Elemente auszuwählen. Halte die Leertaste oder nutze die mittlere Maustaste zum Verschieben. Mausrad zum Zoomen. Rechtsklick auf ein Element öffnet Quick Connect.',
        },
      },
    },

    arcsRouting: {
      title: 'Kanten-Routing',
      description: 'Lerne die verschiedenen Kanten-Routing-Modi kennen.',
      steps: {
        arcTool: {
          title: 'Kanten-Werkzeug (A)',
          content: 'Wähle das Kanten-Werkzeug aus der Werkzeugleiste oder drücke A. Klicke dann auf ein Quellelement und ein Zielelement um eine gerichtete Kante zu erstellen.',
        },
        createArc: {
          title: 'Kanten erstellen',
          content: 'Klicke auf eine Stelle um zu beginnen, dann klicke auf eine Transition um sie zu verbinden (oder umgekehrt). Eine Vorschaulinie folgt deinem Cursor während der Erstellung.',
        },
        routingModes: {
          title: 'Routing-Modi',
          content: 'Wähle eine Kante und öffne das Eigenschaften-Panel. Wähle zwischen Direkt (gerade Linie), Orthogonal (rechte Winkel), Gebogen (Bezier) oder Manuell (eigene Wegpunkte durch Doppelklick auf die Kante).',
        },
      },
    },

    undoRedo: {
      title: 'Rückgängig & Wiederholen',
      description: 'Lerne, wie du Änderungen rückgängig machst und wiederholst.',
      steps: {
        undo: {
          title: 'Rückgängig (Strg+Z)',
          content: 'Klicke diesen Button oder drücke Strg+Z um die letzte Aktion rückgängig zu machen. Alle Elementerstellung, -löschung, -verschiebung und Eigenschaftsänderungen werden verfolgt.',
        },
        redo: {
          title: 'Wiederholen (Strg+Y)',
          content: 'Klicke diesen Button oder drücke Strg+Y (oder Strg+Umschalt+Z) um eine zuvor rückgängig gemachte Aktion wiederherzustellen. Buttons sind ausgegraut wenn nicht verfügbar.',
        },
      },
    },

    layout: {
      title: 'Auto-Layout',
      description: 'Ordne Elemente in deinem Petri-Netz automatisch an.',
      steps: {
        button: {
          title: 'Layout-Menü',
          content: 'Klicke "Auto-Layout" um die Layout-Einstellungen zu öffnen. Wähle zwischen Hierarchisch, Kräftebasiert oder Raster-Algorithmen. Konfiguriere Richtung, Knotenabstand und Ebenenabstand.',
        },
        result: {
          title: 'Layout-Ergebnis',
          content: 'Nach dem Anwenden werden die Elemente auf der Zeichenfläche neu angeordnet. Die Ansicht passt sich automatisch an um alle Elemente zu zeigen. Probiere verschiedene Algorithmen für die beste Anordnung.',
        },
      },
    },

    operators: {
      title: 'Workflow-Operatoren',
      description: 'Lerne, wie du AND/XOR-Split- und Join-Operatoren verwendest.',
      steps: {
        dropdown: {
          title: 'Operatortyp-Auswahl',
          content: 'Klicke den Dropdown-Pfeil um alle Operatortypen zu sehen: AND-Split, AND-Join, XOR-Split, XOR-Join und vier kombinierte Typen. Wähle einen, dann klicke auf die Zeichenfläche.',
        },
        canvas: {
          title: 'Operatoren auf der Zeichenfläche',
          content: 'Operatoren erscheinen als Rauten (◇). Grün für AND-Operatoren, orange für XOR-Operatoren, violett für kombinierte Typen. Verbinde sie mit Kanten wie normale Transitionen.',
        },
        properties: {
          title: 'Operator-Eigenschaften',
          content: 'Wähle einen Operator um seine Eigenschaften hier zu sehen. Du kannst den Operatortyp nach der Platzierung über das Dropdown im Eigenschaften-Panel ändern.',
        },
      },
    },

    subprocesses: {
      title: 'Subprozesse',
      description: 'Erstelle und navigiere hierarchische Petri-Netze.',
      steps: {
        tool: {
          title: 'Subprozess-Werkzeug (S)',
          content: 'Wähle das Subprozess-Werkzeug oder drücke S, dann klicke auf die Zeichenfläche. Ein Subprozess erscheint als abgerundetes Rechteck mit doppeltem Rahmen.',
        },
        create: {
          title: 'Mit Subprozessen arbeiten',
          content: 'Doppelklicke einen Subprozess um sein inneres Petri-Netz zu öffnen. Darin kannst du ein vollständiges Petri-Netz mit eigenen Stellen, Transitionen und Kanten aufbauen.',
        },
        breadcrumb: {
          title: 'Breadcrumb-Navigation',
          content: 'Die Breadcrumb-Leiste zeigt deine Position in der Hierarchie. Klicke auf ein übergeordnetes Element um zurückzunavigieren. Beim Token-Spiel kannst du in Subprozesse ein- und austreten.',
        },
      },
    },

    tokenGame: {
      title: 'Token-Spiel',
      description: 'Lerne, wie du die Petri-Netz-Ausführung Schritt für Schritt simulierst.',
      steps: {
        tab: {
          title: 'Token-Spiel Tab',
          content: 'Klicke diesen Tab um die Token-Spiel-Steuerung zu öffnen. Du kannst das Token-Spiel auch direkt starten — der Tab wird automatisch aktiviert.',
        },
        controls: {
          title: 'Token-Spiel Steuerung',
          content: 'Nutze Start zum Beginnen, Schritt zum Feuern einer Transition, Abspielen für automatische Ausführung und Stopp zum Beenden. Du kannst die Geschwindigkeit und Konfliktlösungsstrategie anpassen.',
        },
        animation: {
          title: 'Animierte Ausführung',
          content: 'Beobachte wie Token entlang der Kanten wandern wenn Transitionen feuern. Aktivierte Transitionen werden grün hervorgehoben. Wenn keine Transition feuern kann, wird ein Deadlock erkannt.',
        },
      },
    },

    tokenGameConflicts: {
      title: 'Konflikte & Deadlocks',
      description: 'Verstehe Konfliktlösung und Deadlock-Erkennung.',
      steps: {
        tab: {
          title: 'Token-Spiel Tab',
          content: 'Öffne den Token-Spiel Tab. Starte zuerst das Token-Spiel, dann erkunde die Konfliktlösungsoptionen unter den Wiedergabe-Steuerungen.',
        },
        conflictOptions: {
          title: 'Konfliktlösung',
          content: 'Wenn mehrere Transitionen um Token konkurrieren, wähle deine Strategie: Manuell (du wählst), Zufällig (automatische Auswahl) oder Priorität (geordnet). Die Einstellung befindet sich unter dem Geschwindigkeitsregler.',
        },
        deadlock: {
          title: 'Deadlock-Erkennung',
          content: 'Wenn keine Transition feuern kann, erkennt das Token-Spiel einen Deadlock und zeigt eine Warnung. Das bedeutet dein Netz hat ein strukturelles Problem — führe die Analyse durch um es zu untersuchen.',
        },
      },
    },

    analysis: {
      title: 'Analyse',
      description: 'Erfahre, wie du dein Petri-Netz auf Korrektheit prüfst.',
      steps: {
        tab: {
          title: 'Analyse-Tab',
          content: 'Klicke diesen Tab um alle Analysefunktionen zu erreichen: Workflow-Netz-Eigenschaften, Soundness-Verifikation, Erreichbarkeitsgraphen und Prozessmetriken.',
        },
        panel: {
          title: 'Analyse-Panel',
          content: 'Führe einzelne Analysen aus oder nutze "Alle ausführen" für eine vollständige Prüfung. Ergebnisse zeigen strukturelle Eigenschaften (Stellen, Transitionen, Kanten) und Verhaltenseigenschaften (beschränkt, sicher, lebendig, deadlockfrei).',
        },
      },
    },

    analysisCoverability: {
      title: 'Zustandsraumanalyse',
      description: 'Erkunde alle erreichbaren Zustände mit dem Erreichbarkeits- oder Überdeckungsgraphen.',
      steps: {
        tab: {
          title: 'Analyse-Tab',
          content: 'Öffne den Analyse-Tab und scrolle nach unten zum Bereich "Zustandsraumanalyse".',
        },
        section: {
          title: 'Graphtyp wählen',
          content: 'Wechsle zwischen Erreichbarkeitsgraph (exakte Markierungen, nur beschränkte Netze) und Überdeckungsgraph (nutzt ω für unbeschränkte Netze). Klicke dann "Graph erstellen".',
        },
        graph: {
          title: 'Ergebnisse interpretieren',
          content: 'Knoten repräsentieren Markierungen (Zustände), Kanten repräsentieren Transitionsfeuern. Rote Knoten sind Deadlocks, blaue Knoten sind Endzustände. Statistiken werden über dem Graphen angezeigt.',
        },
      },
    },

    analysisMetrics: {
      title: 'Prozessmetriken',
      description: 'Miss die Komplexität und Qualität deines Petri-Netzes.',
      steps: {
        tab: {
          title: 'Analyse-Tab',
          content: 'Öffne den Analyse-Tab. Der Metriken-Bereich liefert quantitative Maße für die Struktur deines Netzes.',
        },
        metrics: {
          title: 'Metriken berechnen',
          content: 'Klicke den ▶-Button um alle Metriken zu berechnen. Ergebnisse sind in Größe, Komplexität, Dichte und Qualität gruppiert. Nutze "Report exportieren" um die Ergebnisse herunterzuladen.',
        },
      },
    },

    simulationOverview: {
      title: 'Simulation-Überblick',
      description: 'Führe diskrete Ereignissimulationen für Leistungsanalyse durch.',
      steps: {
        tab: {
          title: 'Simulation-Tab',
          content: 'Klicke diesen Tab um das Simulations-Panel zu öffnen. Hier konfigurierst und startest du quantitative Simulationen deines Petri-Netzes.',
        },
        config: {
          title: 'Konfiguration',
          content: 'Setze Ankunftsrate, Simulationszeit, Aufwärmzeit und Anzahl der Wiederholungen. Der "Konfiguration"-Tab bietet alle Parameter die du für eine Simulation brauchst.',
        },
        results: {
          title: 'Ergebnisse & Visualisierung',
          content: 'Nach dem Ausführen wechsle zum Ergebnisse-Tab um Durchsatz, Zykluszeit, Abschlussrate, Aktivitätsstatistiken und Ereigniszeitstrahl zu sehen. Exportiere Ergebnisse als CSV für weitere Analyse.',
        },
      },
    },

    simulationTimeModels: {
      title: 'Zeitmodelle',
      description: 'Konfiguriere Bearbeitungszeit-Verteilungen für Transitionen.',
      steps: {
        tab: {
          title: 'Simulation-Tab',
          content: 'Öffne den Simulation-Tab und wechsle zum "Zeitmodell"-Sub-Tab um Bearbeitungszeiten zu konfigurieren.',
        },
        defaultTime: {
          title: 'Standard-Bearbeitungszeit',
          content: 'Setze eine Standard-Zeitverteilung, die für alle Transitionen ohne individuelle Konfiguration gilt. Wähle den Verteilungstyp und setze seine Parameter.',
        },
        distributions: {
          title: 'Verteilungstypen',
          content: 'Wähle aus Konstant (fest), Exponentiell (gedächtnislos), Normal (Glockenkurve), Gleichverteilt (gleicher Bereich) oder Dreiecksverteilung (Min/Modus/Max). Jede Transition kann ihre eigene Verteilung haben.',
        },
      },
    },

    simulationResources: {
      title: 'Ressourcen',
      description: 'Definiere Ressourcen und finde Engpässe in deinem Prozess.',
      steps: {
        tab: {
          title: 'Simulation-Tab',
          content: 'Öffne den Simulation-Tab und wechsle zum "Ressourcen"-Sub-Tab um Ressourcen zu definieren und zu verwalten.',
        },
        define: {
          title: 'Ressourcen definieren',
          content: 'Füge Ressourcen mit Name, Typ (Mensch, Maschine, System) und Kapazität hinzu. Ressourcen repräsentieren begrenzte Kapazitäten, um die Transitionen konkurrieren.',
        },
        assign: {
          title: 'Ressourcen-Zuweisungen',
          content: 'Weise Ressourcen Transitionen zu und gib an, wie viele Einheiten jede Transition benötigt. Nach der Simulation prüfe die Engpass-Analyse um überlastete Ressourcen zu identifizieren.',
        },
      },
    },

    fileOperations: {
      title: 'Dateioperationen',
      description: 'Lerne, wie du Petri-Netze öffnest, speicherst und exportierst.',
      steps: {
        menu: {
          title: 'Datei-Menü',
          content: 'Klicke das Datei-Menü um auf Neu, Öffnen, Speichern, Speichern unter und Export-Optionen zuzugreifen. Unterstützte Formate sind PNML (Standard) und JSON. Exportiere Bilder als SVG oder PNG.',
        },
        dragDrop: {
          title: 'Drag & Drop',
          content: 'Du kannst auch .pnml- oder .json-Dateien direkt auf die Zeichenfläche ziehen um sie zu öffnen. Die Datei wird geladen und das Netz sofort angezeigt.',
        },
      },
    },

    fileTemplates: {
      title: 'Vorlagen',
      description: 'Starte mit vordefinierten Petri-Netz-Mustern.',
      steps: {
        menu: {
          title: 'Vorlagen-Menü',
          content: 'Öffne das Datei-Menü und fahre über "Vorlagen" um vordefinierte Muster zu sehen: Grundmuster (Sequenz, Auswahl, Parallelität, Schleife), Synchronisationsmuster und Workflow-Beispiele.',
        },
        preview: {
          title: 'Vorlagen laden',
          content: 'Klicke eine Vorlage um sie auf die Zeichenfläche zu laden. Vorlagen ersetzen das aktuelle Netz — speichere deine Arbeit vorher falls nötig. Sie sind tolle Startpunkte zum Lernen und Modellieren.',
        },
      },
    },

    settings: {
      title: 'Einstellungen',
      description: 'Konfiguriere die Anwendung nach deinen Vorstellungen.',
      steps: {
        button: {
          title: 'Einstellungen-Button',
          content: 'Klicke das Zahnrad-Symbol (⚙) um den Einstellungen-Dialog zu öffnen. Du kannst Erscheinungsbild, Editor-Verhalten, Token-Spiel und Analyse-Einstellungen konfigurieren.',
        },
        themes: {
          title: 'Design & Sprache',
          content: 'Im Allgemein-Tab wechsle zwischen Hell, Dunkel und System-Design. Ändere die Sprache zwischen English und Deutsch. Aktiviere Auto-Speichern um deine Arbeit automatisch zu sichern.',
        },
      },
    },
  },

  // ── Artikel ────────────────────────────────────────────
  articles: {
    welcome: {
      title: 'Willkommen bei WoPeD Next',
      content: `WoPeD Next ist ein webbasierter Petri-Netz-Editor zum Modellieren, Analysieren und Simulieren von Workflow-Prozessen.

**Was du tun kannst:**
- **Modelliere** Petri-Netze mit Stellen, Transitionen, Kanten, Operatoren und Subprozessen
- **Führe** dein Modell Schritt für Schritt mit dem Token-Spiel aus
- **Analysiere** strukturelle und Verhaltenseigenschaften, erstelle Erreichbarkeitsgraphen
- **Simuliere** quantitative Leistung mit Zeitmodellen und Ressourcen
- **Importiere/Exportiere** in PNML- und JSON-Formaten, exportiere als SVG oder PNG

**Schnellstart:** Wähle das Stellen-Werkzeug (P), klicke auf die Zeichenfläche um eine Stelle zu erstellen, wechsle zu Transition (T) und erstelle eine Transition, dann nutze Kante (A) um sie zu verbinden.

Tipp: Drücke jederzeit F1 um diesen Hilfe-Dialog zu öffnen.`,
    },

    petriNetBasics: {
      title: 'Petri-Netz Grundlagen',
      content: `Ein **Petri-Netz** ist ein mathematisches Modell zur Beschreibung verteilter Systeme und Workflows.

**Kernelemente:**

**Stellen** (Kreise ○) repräsentieren Bedingungen, Zustände oder Puffer. Sie können **Token** (schwarze Punkte) halten, die Ressourcen oder Kontrollfluss-Marker darstellen.

**Transitionen** (Rechtecke □) repräsentieren Aktionen, Ereignisse oder Aufgaben. Eine Transition ist **aktiviert**, wenn alle Eingangsstellen genügend Token haben.

**Kanten** (Pfeile →) verbinden Stellen mit Transitionen und Transitionen mit Stellen. Sie definieren die Flussrelation. Jede Kante hat ein **Gewicht** (Standard: 1), das angibt, wie viele Token konsumiert oder erzeugt werden.

**Schaltregel:** Wenn eine Transition feuert, entfernt sie Token aus ihren Eingangsstellen (gemäß Kantengewichten) und fügt Token zu ihren Ausgangsstellen hinzu.

**Workflow-Netze** sind eine spezielle Klasse von Petri-Netzen mit genau einer Startstelle und einer Endstelle, wobei jedes Element auf einem Pfad von Start zu Ende liegt.`,
    },

    editorTools: {
      title: 'Editor-Werkzeuge',
      content: `Die Werkzeugleiste bietet folgende Werkzeuge:

**Auswählen (V)** — Klicke um Elemente auszuwählen, ziehe um sie zu verschieben. Ziehe auf leerer Fläche um mehrere Elemente auszuwählen (Umschalt hält die Auswahl). Rechtsklick auf ein Element öffnet Quick Connect. Escape hebt die Auswahl auf.

**Stelle (P)** — Klicke auf die Zeichenfläche um eine neue Stelle zu erstellen. Stellen werden als Kreise dargestellt und halten Token.

**Transition (T)** — Klicke auf die Zeichenfläche um eine Transition zu erstellen. Transitionen werden als Rechtecke dargestellt.

**Operator (O)** — Klicke den Dropdown-Pfeil um einen Operatortyp zu wählen, dann klicke auf die Zeichenfläche. Operatoren modellieren Workflow-Muster (AND/XOR-Split/Join).

**Subprozess (S)** — Klicke auf die Zeichenfläche um ein Subprozess-Element zu erstellen. Doppelklicke es um das verschachtelte Petri-Netz zu öffnen.

**Kante (A)** — Klicke auf ein Quellelement, dann auf ein Ziel um eine Kante zu erstellen. Kanten können nur Stellen mit Transitionen oder Transitionen mit Stellen verbinden.

**Löschen (D)** — Klicke auf ein Element um es zu löschen. Du kannst auch Elemente auswählen und Entf/Rücktaste drücken.

Nutze **Rückgängig (Strg+Z)** und **Wiederholen (Strg+Y / Strg+Umschalt+Z)** um Änderungen rückgängig zu machen.`,
    },

    canvasNavigation: {
      title: 'Canvas-Navigation',
      content: `**Zoom:** Nutze das Mausrad oder die Zoom-Buttons (+/−) in der Ansichts-Werkzeugleiste. Klicke "Einpassen" um alle Elemente sichtbar zu machen.

**Verschieben:** Halte die Leertaste oder die mittlere Maustaste gedrückt und ziehe um die Ansicht zu verschieben.

**Rahmenauswahl:** Ziehe auf leerer Fläche um mehrere Elemente auszuwählen. Halte Umschalt um zur bestehenden Auswahl hinzuzufügen.

**Quick Connect:** Rechtsklick auf Stelle, Transition, Operator oder Subprozess öffnet das Nachfolger-Menü und verbindet das neue Element automatisch.

**Rotation:** Nutze die Rotations-Buttons (↺ ↻) in der Ansichts-Werkzeugleiste um die Ansicht um 90° zu drehen.

**Raster:** Schalte das Hintergrundraster mit dem Raster-Button (▦) um. Aktiviere "Einrasten" (⊞) um Elemente automatisch am Raster auszurichten.

**Minimap:** Das Übersichts-Panel unten links zeigt eine Miniatur deines gesamten Netzes. Das blaue Rechteck repräsentiert deinen aktuellen Sichtbereich. Klicke auf die Minimap um schnell zu navigieren.

**Drag & Drop:** Du kannst .pnml- oder .json-Dateien direkt auf die Zeichenfläche ziehen um sie zu öffnen.`,
    },

    arcsRouting: {
      title: 'Kanten-Routing',
      content: `Kanten unterstützen verschiedene Routing-Modi, konfigurierbar im Eigenschaften-Panel:

**Direkt** — Eine gerade Linie von Quelle zu Ziel. Einfachster Modus.

**Orthogonal** — Die Kante nutzt nur horizontale und vertikale Segmente. Gut für saubere, diagrammartige Layouts.

**Gebogen (Bezier)** — Glatte Kurven, die Überlappungen mit anderen Elementen vermeiden. Bietet ein natürliches Erscheinungsbild.

**Manuelle Wegpunkte** — Du steuerst den exakten Pfad:
- Doppelklicke auf eine Kante um einen Wegpunkt hinzuzufügen
- Ziehe Wegpunkte um den Pfad anzupassen
- Doppelklicke auf einen Wegpunkt-Handle um ihn zu entfernen

Um den Routing-Modus zu ändern, wähle eine Kante und nutze das "Routing"-Dropdown im Eigenschaften-Panel.

**Kantengewicht:** Jede Kante hat ein Gewicht (Standard: 1). Höhere Gewichte bedeuten mehr Token werden konsumiert/produziert wenn die verbundene Transition feuert. Bearbeite Gewichte im Eigenschaften-Panel.`,
    },

    undoRedo: {
      title: 'Rückgängig & Wiederholen',
      content: `WoPeD Next verfolgt alle Bearbeitungsaktionen und ermöglicht es, sie rückgängig zu machen und wiederherzustellen.

**Rückgängig:** Drücke **Strg+Z** (oder Cmd+Z auf Mac) oder klicke den ↩ Button. Macht die letzte Aktion rückgängig.

**Wiederholen:** Drücke **Strg+Y** oder **Strg+Umschalt+Z** (oder Cmd+Umschalt+Z auf Mac) oder klicke den ↪ Button. Stellt eine zuvor rückgängig gemachte Aktion wieder her.

Folgende Operationen werden verfolgt:
- Erstellen und Löschen von Elementen (Stellen, Transitionen, Kanten, Operatoren, Subprozesse)
- Verschieben von Elementen
- Ändern von Eigenschaften (Name, Token, Kapazität, Gewicht, etc.)
- Layout-Änderungen

Die Rückgängig/Wiederholen-Buttons sind ausgegraut wenn keine Aktionen verfügbar sind.`,
    },

    layout: {
      title: 'Auto-Layout',
      content: `Nutze die Auto-Layout-Funktion um Elemente in deinem Petri-Netz automatisch anzuordnen.

**Algorithmen:**

**Hierarchisch** (Standard) — Ordnet Elemente in Schichten von links nach rechts (oder oben nach unten) an. Am besten für workflow-artige Netze mit klarer Richtung.

**Kräftebasiert** — Nutzt eine Physik-Simulation, bei der Elemente sich abstoßen und Kanten als Federn wirken. Gut um natürliche Strukturen in komplexen Netzen zu entdecken.

**Raster** — Ordnet Elemente in einem regelmäßigen Rastermuster an. Nützlich um unordentliche Layouts schnell zu organisieren.

**Optionen:**
- **Richtung:** Links→Rechts, Oben→Unten, Rechts→Links oder Unten→Oben
- **Knotenabstand:** Abstand zwischen Elementen in derselben Schicht
- **Ebenenabstand:** Abstand zwischen Schichten

Öffne das Layout-Menü in der Ansichts-Werkzeugleiste (⬡ Auto-Layout), konfiguriere deine Einstellungen und klicke "Layout anwenden".`,
    },

    operatorsOverview: {
      title: 'Workflow-Operatoren',
      content: `Operatoren sind spezielle Transitionen, die gängige Workflow-Routing-Muster modellieren. Sie werden als Rautenformen (◇) auf der Zeichenfläche dargestellt.

**Warum Operatoren?** In klassischen Petri-Netzen benötigt man mehrere Stellen und Transitionen um parallele Ausführung oder exklusive Auswahlen zu modellieren. Operatoren bieten eine kompakte Notation.

**Arten von Operatoren:**
- **Split**-Operatoren haben einen Eingang und mehrere Ausgänge
- **Join**-Operatoren haben mehrere Eingänge und einen Ausgang
- **Kombinierte** Operatoren haben sowohl Split- als auch Join-Verhalten

**AND-Operatoren** (◇, grün) benötigen/erzeugen Token auf **allen** verbundenen Kanten — modellieren parallele Ausführung.

**XOR-Operatoren** (⊗, orange) benötigen/erzeugen einen Token auf genau **einer** Kante — modellieren exklusive Auswahl.

Um einen Operator zu erstellen: Wähle das Operator-Werkzeug (O), klicke den Dropdown um den Typ zu wählen, dann klicke auf die Zeichenfläche.`,
    },

    operatorsTypes: {
      title: 'Operatortypen im Detail',
      content: `**AND-Split** (◇→) — Nimmt einen Token von der Eingangsstelle und erzeugt einen Token auf jeder Ausgangskante. Modelliert parallele Verzweigung.

**AND-Join** (→◇) — Wartet auf einen Token an jeder Eingangskante, erzeugt dann einen Token am Ausgang. Modelliert Synchronisation.

**XOR-Split** (⊗→) — Nimmt einen Token vom Eingang und legt ihn auf genau eine Ausgangskante (nicht-deterministische Wahl). Modelliert exklusive Entscheidung.

**XOR-Join** (→⊗) — Nimmt einen Token von einer beliebigen Eingangskante und erzeugt einen Token am Ausgang. Modelliert Zusammenführung alternativer Pfade.

**AND-Split-Join** (◇◇) — Kombiniert AND-Split- und AND-Join-Verhalten in einem Element.

**XOR-Split-Join** (⊗⊗) — Kombiniert XOR-Split- und XOR-Join-Verhalten.

**AND-Join/XOR-Split** (◇⊗) — AND-Verhalten auf der Eingangsseite, XOR auf der Ausgangsseite.

**XOR-Join/AND-Split** (⊗◇) — XOR-Verhalten auf der Eingangsseite, AND auf der Ausgangsseite.`,
    },

    subprocesses: {
      title: 'Subprozesse',
      content: `Subprozesse ermöglichen es, hierarchische Petri-Netze mit verschachtelten Ebenen zu erstellen.

**Subprozess erstellen:** Wähle das Subprozess-Werkzeug (S) und klicke auf die Zeichenfläche. Ein Subprozess erscheint als abgerundetes Rechteck mit doppeltem Rahmen.

**Subprozess öffnen:** Doppelklicke das Subprozess-Element um das innere Netz zu öffnen. Die Breadcrumb-Navigation oben zeigt deine aktuelle Position in der Hierarchie.

**Zurück navigieren:** Klicke auf ein übergeordnetes Netz in der Breadcrumb-Leiste oder nutze den "Zurück"-Button.

**Token-Spiel mit Subprozessen:** Während des Token-Spiels kannst du in einen Subprozess einsteigen wenn ein Token dort ankommt. Das Token-Spiel setzt sich im Subprozess fort. Wenn das innere Netz beendet ist (Token erreicht die Endstelle), kannst du wieder heraustreten.

**Prozesshierarchie:** Das Prozessstruktur-Panel zeigt den vollständigen Baum aus Hauptprozess und Subprozessen.`,
    },

    tokenGameBasics: {
      title: 'Token-Spiel Grundlagen',
      content: `Das Token-Spiel ermöglicht dir, die Ausführung deines Petri-Netzes Schritt für Schritt zu simulieren.

**Starten:** Klicke "Start" im Token-Spiel-Panel (oder wechsle zum Token-Spiel-Tab — er öffnet sich automatisch).

**Schritt-Modus:** Klicke "Schritt" um eine aktivierte Transition zu feuern. Wenn mehrere Transitionen aktiviert sind, erscheint ein Konflikt-Dialog (abhängig von deiner Konfliktlösungs-Einstellung).

**Abspielen-Modus:** Klicke "Abspielen" für automatische Ausführung. Transitionen feuern nacheinander mit der konfigurierten Geschwindigkeit. Klicke "Pause" zum Anhalten.

**Verlauf:** Das Verlaufs-Panel zeigt alle vorherigen Markierungen (Zustände). Klicke auf einen Schritt um zurückzuspringen. Nutze "Schritt zurück" um das letzte Feuern rückgängig zu machen.

**Statistiken:** Verfolge wie viele Schritte gemacht wurden, welche Transitionen am häufigsten gefeuert haben, wie viele Konflikte und Deadlocks aufgetreten sind, und die verstrichene Zeit.

**Beenden:** Klicke "Stopp" um das Token-Spiel zu beenden und zum Bearbeitungsmodus zurückzukehren. Die ursprüngliche Markierung wird wiederhergestellt.`,
    },

    tokenGameConflicts: {
      title: 'Konflikte & Deadlocks',
      content: `**Konflikte** treten auf, wenn mehrere Transitionen aktiviert sind, aber das Feuern einer die andere deaktiviert (sie konkurrieren um dieselben Token).

**Lösungsstrategien:**
- **Manuell** — Ein Dialog erscheint, der dich fragt welche Transition feuern soll
- **Zufällig** — Das System wählt eine zufällige aktivierte Transition
- **Priorität** — Transitionen werden nach Prioritätsreihenfolge gefeuert

Du kannst die Standardstrategie in Einstellungen → Simulation → Konfliktlösung setzen.

**Deadlocks** treten auf wenn keine Transition aktiviert ist und das Netz keinen ordnungsgemäßen Endzustand erreicht hat. Das Token-Spiel erkennt dies und zeigt eine Warnung an.

**Probleme erkennen:** Wenn dein Netz häufig in Deadlocks gerät, führe die Analyse (Soundness-Prüfung) durch um strukturelle Probleme zu finden.`,
    },

    analysisOverview: {
      title: 'Analyse-Überblick',
      content: `Das Analyse-Panel bietet Werkzeuge um die Korrektheit deines Petri-Netzes zu überprüfen.

**Workflow-Netz-Eigenschaft** — Überprüft ob dein Netz ein gültiges Workflow-Netz ist:
- Genau eine Startstelle (keine eingehenden Kanten)
- Genau eine Endstelle (keine ausgehenden Kanten)
- Jedes Element liegt auf einem Pfad von Start zu Ende
- Das Netz ist zusammenhängend

**Soundness-Prüfung** — Überprüft die Verhaltenskorrektheit:
- **Beschränkt:** Die Anzahl der Token in jeder Stelle ist begrenzt
- **Sicher:** Keine Stelle hält jemals mehr als einen Token
- **Lebendig:** Jede Transition kann irgendwann wieder feuern
- **Deadlock-frei:** Das Netz kann immer Fortschritt machen
- **Reversibel:** Die Anfangsmarkierung kann immer wieder erreicht werden

**Ausführen:** Klicke "Alle ausführen" für eine vollständige Analyse, oder führe einzelne Prüfungen mit den ▶-Buttons aus.

**Probleme:** Probleme werden mit Schweregrad (Fehler, Warnung, Info) und Beschreibungen aufgelistet.`,
    },

    analysisCoverability: {
      title: 'Zustandsraumanalyse',
      content: `Der Bereich **Zustandsraumanalyse** bietet zwei komplementäre Ansichten des Verhaltens deines Petri-Netzes:

**Erreichbarkeitsgraph** — zählt alle *exakt* erreichbaren Markierungen auf. Jeder Knoten enthält konkrete Token-Zahlen, was präzise Erreichbarkeitsabfragen ("Kann Markierung M erreicht werden?") und vollständige Lebendigkeitsanalyse ermöglicht. Funktioniert nur für **beschränkte** Netze (endlicher Zustandsraum). Bei unbeschränkten Netzen wird automatisch auf den Überdeckungsgraphen zurückgefallen.

**Überdeckungsgraph** — funktioniert für *alle* Netze, auch unbeschränkte. Nutzt **ω (Omega)** um Stellen darzustellen, an denen Token unbegrenzt wachsen können, und garantiert so die Terminierung. Nützlich zur Erkennung von Unbeschränktheit, Deadlocks und toten Transitionen, verliert aber exakte Token-Zahlen.

**Was der Graph zeigt:**
- Jeder **Knoten** repräsentiert eine Markierung (Zustand) — die Anzahl der Token in jeder Stelle
- Jede **Kante** repräsentiert ein Feuern einer Transition
- **Deadlock-Zustände** (rot) haben keine ausgehenden Kanten
- **Endzustände** (blau) sind ordnungsgemäße Terminierungspunkte

**Ergebnisse interpretieren:**
- **Zustände:** Gesamtzahl erreichbarer Markierungen
- **Deadlocks:** Zustände, in denen keine Transition aktiviert ist
- **Beschränkt/Unbeschränkt:** Ob der Zustandsraum endlich ist
- **Endzustände:** Zustände, die ordnungsgemäße Terminierungspunkte sind

**Hinweis:** Die maximale Anzahl an Zuständen ist begrenzt, um übermäßige Berechnung zu vermeiden.`,
    },

    analysisMetrics: {
      title: 'Prozessmetriken',
      content: `Prozessmetriken liefern quantitative Maße für Struktur und Qualität deines Petri-Netzes.

**Größenmetriken:**
- Stellen, Transitionen, Kanten, Operatoren, Subprozesse, Gesamtknoten

**Komplexitätsmetriken:**
- **Zyklomatische Komplexität** — Anzahl unabhängiger Pfade: Kanten − Knoten + 2
- **Kontrollfluss-Komplexität** — Basierend auf Split/Join-Operatoren
- **Strukturiertheit** — Anteil strukturierter Muster (höher = besser)
- **Maximale Tiefe** — Tiefste Verschachtelungsebene von Subprozessen

**Dichtemetriken:**
- **Kantendichte** — Verhältnis von Kanten zu maximal möglichen Kanten
- **Konnektivitätskoeffizient** — Kanten pro Knoten
- **Konnektoren-Mismatch** — Ungleichgewicht zwischen Splits und Joins
- **Durchschnittlicher Konnektorgrad** — Durchschnittliche Verbindungen pro Operator

**Qualitätsmetriken:**
- **Separierbarkeit** — Wie gut sich das Netz in unabhängige Teile zerlegen lässt
- **Sequentialität** — Anteil sequenziellen Verhaltens
- **Token-Komplexität** — Anzahl tokenabhängiger Verhaltensweisen

Klicke ▶ um alle Metriken zu berechnen. Nutze "Report exportieren" um Ergebnisse herunterzuladen.`,
    },

    simulationOverview: {
      title: 'Quantitative Simulation',
      content: `Die Simulationsfunktion führt eine diskrete Ereignissimulation durch um die Leistung deines Petri-Netzes zu analysieren.

**Konfiguration:**
- **Ankunftsrate:** Wie oft neue Fälle in das System eintreten
- **Simulationszeit:** Gesamtdauer des Simulationslaufs
- **Aufwärmzeit:** Anfangsphase, die von Statistiken ausgeschlossen wird (um den Gleichgewichtszustand zu erreichen)
- **Wiederholungen:** Anzahl unabhängiger Simulationsläufe für statistische Sicherheit
- **Zufallsseed:** Für reproduzierbare Ergebnisse (oder "Auto" für zufällig)

**Ergebnisse:**
- **Durchsatz:** Abgeschlossene Fälle pro Zeiteinheit
- **Ø Zykluszeit:** Durchschnittliche Zeit von Start bis Ende
- **Abschlussrate:** Prozentsatz der beendeten Fälle
- **Aktivitätsstatistik:** Ausführungszahl, durchschnittliche Zeit und Auslastung pro Transition

**Visualisierungen:**
- Zeitstrahl mit Ereignissen über die Zeit
- Durchsatz-Liniendiagramm
- Ressourcenauslastungs-Kreisdiagramme

Klicke "Simulation starten" zum Beginnen. Nutze "CSV exportieren" um detaillierte Ergebnisse herunterzuladen.`,
    },

    simulationTimeModels: {
      title: 'Zeitmodelle',
      content: `Jede Transition kann ihre eigene Bearbeitungszeit-Verteilung haben.

**Verteilungen:**

**Konstant** — Dauert immer genau den angegebenen Wert. Für Aufgaben mit fester Dauer.

**Exponentiell** — Zufällige Zeiten mit gegebenem Mittelwert. Gedächtnislose Eigenschaft. Gut für Ankunftsprozesse und Bedienzeiten.

**Normal** — Glockenförmige Verteilung mit Mittelwert und Standardabweichung. Für Aufgaben mit bekanntem Durchschnitt und Variabilität.

**Gleichverteilt** — Gleiche Wahrscheinlichkeit zwischen Min und Max. Wenn nur der Bereich bekannt ist.

**Dreiecksverteilung** — Definiert durch Min, Modus (wahrscheinlichster Wert) und Max. Für Expertenschätzungen mit optimistischen, wahrscheinlichen und pessimistischen Werten.

**Konfiguration:** Öffne das Simulations-Panel → Zeitmodell-Tab. Setze eine Standard-Bearbeitungszeit für alle Transitionen, dann überschreibe einzelne Transitionen nach Bedarf.

**Tipp:** Starte mit konstanten Zeiten um dein Modell zu überprüfen, dann füge Variabilität mit statistischen Verteilungen hinzu.`,
    },

    simulationResources: {
      title: 'Ressourcen & Engpässe',
      content: `Ressourcen modellieren begrenzte Kapazitäten, um die Transitionen konkurrieren.

**Ressourcen definieren:**
- Öffne Ressourcen im Simulations-Panel
- Füge Ressourcen mit Name, Typ (Mensch/Maschine/System) und Kapazität hinzu
- Weise Ressourcen Transitionen mit der benötigten Einheitenanzahl zu

**Ressourcentypen:**
- **Mensch** — Mitarbeiter, Bediener
- **Maschine** — Ausstattung, Server
- **System** — Software-Lizenzen, Datenbankverbindungen

**Zuweisungen:** Ordne Ressourcen Transitionen zu. Wenn eine Transition feuert, belegt sie die benötigten Ressourcen und gibt sie nach Abschluss frei.

**Engpass-Analyse:** Nach der Simulation zeigt die Engpass-Analyse:
- Welche Ressourcen überlastet sind
- Durchschnittliche Wartezeiten durch Ressourcenkonflikte
- Empfohlene Kapazitätserhöhungen
- Anzahl betroffener Fälle

**Tipp:** Starte ohne Ressourcen um eine Baseline-Leistung zu ermitteln, dann füge Ressourcenbeschränkungen hinzu um Engpässe zu identifizieren.`,
    },

    fileOperations: {
      title: 'Dateioperationen',
      content: `**Neu:** Erstellt ein neues leeres Petri-Netz und ersetzt das aktuelle.

**Öffnen:** Lade ein Petri-Netz aus einer Datei. Unterstützte Formate:
- **.pnml** — Petri Net Markup Language (XML-basierter Standard)
- **.json** — WoPeDs JSON-Format

Du kannst auch .pnml- oder .json-Dateien per **Drag & Drop** auf die Zeichenfläche ziehen.

**Speichern / Speichern unter:** Lade das aktuelle Netz als Datei herunter. Wähle zwischen PNML- und JSON-Format. Die Option "Layout einbeziehen" speichert die Elementpositionen.

**Export:**
- **SVG** — Skalierbare Vektorgrafik, ideal für Dokumentation und Druck
- **PNG** — Rasterbild für Präsentationen und schnelles Teilen

**Zuletzt geöffnet:** Das Datei-Menü zeigt kürzlich geöffnete Dateien für schnellen Zugriff.`,
    },

    fileTemplates: {
      title: 'Vorlagen',
      content: `WoPeD Next enthält vordefinierte Vorlagen um dir den Einstieg zu erleichtern.

**Grundmuster:**
- **Sequenz** — Einfacher linearer Ablauf von Start bis Ende
- **Auswahl (Konflikt)** — Nicht-deterministische Auswahl zwischen Pfaden
- **Parallelität (AND)** — Nebenläufige Ausführung mit Verzweigung und Synchronisation
- **Schleife (Iteration)** — Zyklisches Verhalten mit Wiederholung

**Synchronisationsmuster:**
- **Gegenseitiger Ausschluss** — Gemeinsame Ressource mit kritischem Abschnitt
- **Erzeuger-Verbraucher** — Klassisches Muster mit begrenztem Puffer
- **Semaphor (k=2)** — Zählender Semaphor für Ressourcenpools
- **Speisende Philosophen** — Klassisches Nebenläufigkeitsproblem

**Workflow-Muster:**
- **Workflow (Operatoren)** — Geschäftsprozess mit AND/XOR-Operatoren
- **Ampel** — Einfaches Zustandsautomat-Beispiel

Öffne Vorlagen über das Datei-Menü → Vorlagen.`,
    },

    settings: {
      title: 'Einstellungen',
      content: `Öffne Einstellungen über den ⚙-Button in der Werkzeugleiste oder über das Datei-Menü.

**Allgemein:**
- **Design** — Hell, Dunkel oder System (folgt OS-Einstellung)
- **Sprache** — English oder Deutsch
- **Automatisch speichern** — Speichert deine Arbeit automatisch im Browser-Speicher in einem konfigurierbaren Intervall

**Editor:**
- **Raster** — Hintergrundraster anzeigen/verbergen, Raster-Einrasten aktivieren, Rastergröße setzen
- **Beschriftungen** — Element-Beschriftungen und Token-Zahlen anzeigen/verbergen
- **Zoom** — Standard-Zoomstufe setzen
- **Animation** — Animationsdauer konfigurieren

**Simulation (Token-Spiel):**
- **Geschwindigkeit** — Standard-Geschwindigkeit des Token-Spiels (ms zwischen Schritten)
- **Animationen** — Token-Bewegungsanimationen aktivieren/deaktivieren
- **Hervorhebung** — Aktivierte Transitionen hervorheben
- **Konfliktlösung** — Standardstrategie: Manuell, Zufällig oder Priorität

**Analyse:**
- **Max. Zustände** — Maximale Zustände für Erreichbarkeitsgraph-Berechnung
- **Auto-Analyse** — Automatisch analysieren bei Netzänderungen
- **Info-Meldungen** — Informationsmeldungen anzeigen/verbergen`,
    },

    shortcuts: {
      title: 'Tastaturkürzel',
      content: `**Werkzeuge:**
| Taste | Aktion |
|-------|--------|
| V | Auswahl-Werkzeug |
| P | Stellen-Werkzeug |
| T | Transitions-Werkzeug |
| O | Operator-Werkzeug (öffnet Typauswahl) |
| S | Subprozess-Werkzeug |
| A | Kanten-Werkzeug |
| D | Lösch-Werkzeug |

**Bearbeiten:**
| Taste | Aktion |
|-------|--------|
| Entf / Rücktaste | Ausgewählte Elemente löschen |
| Strg+Z | Rückgängig |
| Strg+Y / Strg+Umschalt+Z | Wiederholen |
| Escape | Aktuelle Aktion abbrechen / Alles abwählen |

**Navigation:**
| Taste | Aktion |
|-------|--------|
| Mausrad | Vergrößern/Verkleinern |
| Klick + Ziehen (leerer Bereich) | Zeichenfläche verschieben |

**Sonstiges:**
| Taste | Aktion |
|-------|--------|
| F1 | Hilfe öffnen |`,
    },
  },
}
