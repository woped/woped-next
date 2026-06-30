/**
 * Theme options
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * Language/locale options
 */
export type Locale = 'en' | 'de'

/**
 * General application settings
 */
export interface GeneralConfig {
  theme: ThemeMode
  autoSave: boolean
  autoSaveInterval: number // in milliseconds
  showWelcome: boolean
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
  showGrid: boolean
  snapToGrid: boolean
  gridSize: number
  defaultZoom: number
  animationDuration: number
  showLabels: boolean
  showTokenNumbers: boolean
  smartEditing: boolean
  operatorNotation: OperatorNotation
}

/**
 * Token game settings
 */
export interface TokenGameConfig {
  defaultSpeed: number
  showAnimations: boolean
  highlightEnabled: boolean
  conflictResolution: 'manual' | 'random' | 'priority'
}

/**
 * Analysis settings
 */
export interface AnalysisConfig {
  maxStates: number
  autoAnalyze: boolean
  showInfoMessages: boolean
}

/**
 * Language settings
 */
export interface LanguageConfig {
  locale: Locale
}

/**
 * External conversion service settings (T2P / P2T).
 * When a service is disabled, the chat tools fall back to the LLM (if an API
 * key is configured) instead of calling the HTTP endpoint.
 */
export interface ServicesConfig {
  t2pEndpoint: string
  t2pEnabled: boolean
  /** Optional port override applied to the T2P endpoint URL (null = use URL's port). */
  t2pPort?: number | null
  p2tEndpoint: string
  p2tEnabled: boolean
  /** Optional port override applied to the P2T endpoint URL (null = use URL's port). */
  p2tPort?: number | null
}

/**
 * Recent file entry
 */
export interface RecentFile {
  name: string
  path?: string
  lastOpened: number // timestamp
  format: 'pnml' | 'json'
}

/**
 * Complete application configuration
 */
export interface AppConfig {
  general: GeneralConfig
  editor: EditorConfig
  tokenGame: TokenGameConfig
  analysis: AnalysisConfig
  language: LanguageConfig
  services: ServicesConfig
  recentFiles: RecentFile[]
}

/**
 * Public WoPeD conversion endpoints, used as defaults when no build-time
 * environment override (VITE_T2P_ENDPOINT / VITE_P2T_ENDPOINT) is provided.
 */
export const DEFAULT_T2P_ENDPOINT = 'https://woped.dhbw-karlsruhe.de/t2p-2.0/generate_pnml'
export const DEFAULT_P2T_ENDPOINT = 'https://woped.dhbw-karlsruhe.de/p2t/generateText'

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
    conflictResolution: 'manual',
  },
  analysis: {
    maxStates: 1000,
    autoAnalyze: false,
    showInfoMessages: true,
  },
  language: {
    locale: 'en',
  },
  services: {
    // Prefer a build-time endpoint override, otherwise fall back to the public
    // WoPeD services so conversions work out of the box.
    t2pEndpoint: import.meta.env.VITE_T2P_ENDPOINT || DEFAULT_T2P_ENDPOINT,
    t2pEnabled: false,
    t2pPort: null,
    p2tEndpoint: import.meta.env.VITE_P2T_ENDPOINT || DEFAULT_P2T_ENDPOINT,
    p2tEnabled: false,
    p2tPort: null,
  },
  recentFiles: [],
}

/**
 * Maximum number of recent files to store
 */
export const MAX_RECENT_FILES = 10

/**
 * LocalStorage key for config
 */
export const CONFIG_STORAGE_KEY = 'woped-config'
