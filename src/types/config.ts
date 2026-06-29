/**
 * Theme options
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Language/locale options
 */
export type Locale = "en" | "de";

/**
 * General application settings
 */
export interface GeneralConfig {
  theme: ThemeMode;
  autoSave: boolean;
  autoSaveInterval: number; // in milliseconds
  showWelcome: boolean;
}

/**
 * Operator rendering notation
 * - 'vanDerAalst': authentic WoPeD notation (transition rectangle with directional chevron)
 * - 'modern': diamond (AND) / circle-with-X (XOR) gateway-style glyphs
 */
export type OperatorNotation = 'vanDerAalst' | 'modern'

/**
 * Editor-specific settings
 */
export interface EditorConfig {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultZoom: number;
  animationDuration: number;
  showLabels: boolean;
  showTokenNumbers: boolean;
  smartEditing: boolean;
  operatorNotation: OperatorNotation;
}

/**
 * Token game settings
 */
export interface TokenGameConfig {
  defaultSpeed: number;
  showAnimations: boolean;
  highlightEnabled: boolean;
  conflictResolution: "manual" | "random" | "priority";
}

/**
 * Analysis settings
 */
export interface AnalysisConfig {
  maxStates: number;
  autoAnalyze: boolean;
  showInfoMessages: boolean;
}

/**
 * Language settings
 */
export interface LanguageConfig {
  locale: Locale;
}

/**
 * External service endpoints (T2P/P2T)
 */
export interface ServicesConfig {
  t2pEndpoint: string;
  p2tEndpoint: string;
  t2pEnabled: boolean;
  p2tEnabled: boolean;
}

/**
 * Recent file entry
 */
export interface RecentFile {
  name: string;
  path?: string;
  lastOpened: number; // timestamp
  format: "pnml" | "json";
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  general: GeneralConfig;
  editor: EditorConfig;
  tokenGame: TokenGameConfig;
  analysis: AnalysisConfig;
  language: LanguageConfig;
  services: ServicesConfig;
  recentFiles: RecentFile[];
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: AppConfig = {
  general: {
    theme: 'light',
    autoSave: false,
    autoSaveInterval: 60000,
    showWelcome: true,
  },
  editor: {
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    defaultZoom: 1,
    animationDuration: 300,
    showLabels: true,
    showTokenNumbers: true,
    smartEditing: true,
    operatorNotation: 'vanDerAalst',
  },
  tokenGame: {
    defaultSpeed: 1000,
    showAnimations: true,
    highlightEnabled: true,
    conflictResolution: "manual",
  },
  analysis: {
    maxStates: 1000,
    autoAnalyze: false,
    showInfoMessages: true,
  },
  language: {
    locale: "en",
  },
  services: {
    t2pEndpoint: "https://woped.dhbw-karlsruhe.de/t2p-2.0/generate_pnml",
    p2tEndpoint: "https://woped.dhbw-karlsruhe.de/p2t/generateText",
    t2pEnabled: true,
    p2tEnabled: true,
  },
  recentFiles: [],
};

/**
 * Maximum number of recent files to store
 */
export const MAX_RECENT_FILES = 10;

/**
 * LocalStorage key for config
 */
export const CONFIG_STORAGE_KEY = "woped-config";
