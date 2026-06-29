import { defineStore } from "pinia";
import type {
  AppConfig,
  GeneralConfig,
  EditorConfig,
  TokenGameConfig,
  AnalysisConfig,
  LanguageConfig,
  ServicesConfig,
  RecentFile,
  ThemeMode,
  Locale,
  OperatorNotation,
} from "@/types/config";
import {
  DEFAULT_CONFIG,
  MAX_RECENT_FILES,
  CONFIG_STORAGE_KEY,
} from "@/types/config";

export const useConfigStore = defineStore("config", {
  state: (): AppConfig => JSON.parse(JSON.stringify(DEFAULT_CONFIG)),

  getters: {
    /**
     * Get the effective theme (resolves 'system' to actual preference)
     */
    effectiveTheme(): ThemeMode {
      if (this.general.theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return this.general.theme;
    },

    /**
     * Check if dark mode is active
     */
    isDarkMode(): boolean {
      return this.effectiveTheme === "dark";
    },

    /**
     * Get recent files sorted by last opened
     */
    sortedRecentFiles(): RecentFile[] {
      return [...this.recentFiles].sort((a, b) => b.lastOpened - a.lastOpened);
    },

    /**
     * Grid visibility state
     * Note: Getter ensures proper reactivity for nested state access.
     * Use with storeToRefs() in components for reactive binding.
     */
    showGrid(): boolean {
      return this.editor.showGrid;
    },

    /**
     * Snap to grid state
     * Note: Getter ensures proper reactivity for nested state access.
     */
    snapToGrid(): boolean {
      return this.editor.snapToGrid;
    },

    /**
     * Grid size in pixels
     */
    gridSize(): number {
      return this.editor.gridSize;
    },

    /**
     * Active operator notation style
     */
    operatorNotation(): OperatorNotation {
      return this.editor.operatorNotation;
    },
  },

  actions: {
    /**
     * Load configuration from localStorage
     */
    load() {
      try {
        const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Deep merge with defaults to handle new config options
          this.$patch(
            this.deepMerge(
              DEFAULT_CONFIG as unknown as Record<string, unknown>,
              parsed as unknown as Record<string, unknown>,
            ) as unknown as typeof DEFAULT_CONFIG,
          );
        }
      } catch (e) {
        console.warn("Failed to load configuration:", e);
      }

      // Apply theme and locale on load
      this.applyTheme();
      this.applyLocale();

      // Listen for system theme changes
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (this.general.theme === "system") {
            this.applyTheme();
          }
        });
    },

    /**
     * Save configuration to localStorage
     */
    save() {
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.$state));
      } catch (e) {
        console.warn("Failed to save configuration:", e);
      }
    },

    /**
     * Reset configuration to defaults
     */
    reset() {
      this.$reset();
      this.save();
      this.applyTheme();
    },

    /**
     * Update general settings
     */
    updateGeneral(config: Partial<GeneralConfig>) {
      this.general = { ...this.general, ...config };
      this.save();

      if (config.theme !== undefined) {
        this.applyTheme();
      }
    },

    /**
     * Update editor settings
     */
    updateEditor(config: Partial<EditorConfig>) {
      // Directly assign each property for proper reactivity
      for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
          (this.editor as Record<string, unknown>)[key] = (
            config as Record<string, unknown>
          )[key];
        }
      }
      this.save();
    },

    /**
     * Toggle grid visibility
     * Direct mutation ensures proper Pinia reactivity for nested state.
     * Automatically persists change to localStorage.
     */
    toggleShowGrid() {
      this.editor.showGrid = !this.editor.showGrid;
      this.save();
    },

    /**
     * Toggle snap to grid
     * Direct mutation ensures proper Pinia reactivity for nested state.
     * Automatically persists change to localStorage.
     */
    toggleSnapToGrid() {
      this.editor.snapToGrid = !this.editor.snapToGrid;
      this.save();
    },

    /**
     * Set the operator notation style
     */
    setOperatorNotation(notation: OperatorNotation) {
      this.editor.operatorNotation = notation;
      this.save();
    },

    /**
     * Update token game settings
     */
    updateTokenGame(config: Partial<TokenGameConfig>) {
      this.tokenGame = { ...this.tokenGame, ...config };
      this.save();
    },

    /**
     * Update analysis settings
     */
    updateAnalysis(config: Partial<AnalysisConfig>) {
      this.analysis = { ...this.analysis, ...config };
      this.save();
    },

    /**
     * Update external service settings
     */
    updateServices(config: Partial<ServicesConfig>) {
      this.services = { ...this.services, ...config };
      this.save();
    },

    /**
     * Update language settings
     */
    updateLanguage(config: Partial<LanguageConfig>) {
      this.language = { ...this.language, ...config };
      this.save();

      if (config.locale !== undefined) {
        this.applyLocale();
      }
    },

    /**
     * Set theme
     */
    setTheme(theme: ThemeMode) {
      this.general.theme = theme;
      this.save();
      this.applyTheme();
    },

    /**
     * Set locale
     */
    setLocale(locale: Locale) {
      this.language.locale = locale;
      this.save();
      this.applyLocale();
    },

    /**
     * Apply locale to document and i18n
     */
    applyLocale() {
      document.documentElement.setAttribute("lang", this.language.locale);
      // Update i18n locale (dynamic import to avoid circular dependency)
      import("@/i18n").then(({ setLocale }) => {
        setLocale(this.language.locale);
      });
    },

    /**
     * Apply theme to document
     */
    applyTheme() {
      const theme = this.effectiveTheme;
      document.documentElement.setAttribute("data-theme", theme);

      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },

    /**
     * Add a recent file
     */
    addRecentFile(file: Omit<RecentFile, "lastOpened">) {
      // Remove existing entry with same name
      this.recentFiles = this.recentFiles.filter((f) => f.name !== file.name);

      // Add new entry at the beginning
      this.recentFiles.unshift({
        ...file,
        lastOpened: Date.now(),
      });

      // Limit to max recent files
      if (this.recentFiles.length > MAX_RECENT_FILES) {
        this.recentFiles = this.recentFiles.slice(0, MAX_RECENT_FILES);
      }

      this.save();
    },

    /**
     * Remove a recent file
     */
    removeRecentFile(name: string) {
      this.recentFiles = this.recentFiles.filter((f) => f.name !== name);
      this.save();
    },

    /**
     * Clear all recent files
     */
    clearRecentFiles() {
      this.recentFiles = [];
      this.save();
    },

    /**
     * Deep merge two objects
     */
    deepMerge<T extends Record<string, unknown>>(
      target: T,
      source: Partial<T>,
    ): T {
      const result = { ...target };

      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          const sourceVal = source[key];
          const targetVal = result[key];

          if (
            sourceVal !== null &&
            typeof sourceVal === "object" &&
            !Array.isArray(sourceVal) &&
            targetVal !== null &&
            typeof targetVal === "object" &&
            !Array.isArray(targetVal)
          ) {
            result[key] = this.deepMerge(
              targetVal as Record<string, unknown>,
              sourceVal as Record<string, unknown>,
            ) as T[Extract<keyof T, string>];
          } else if (sourceVal !== undefined) {
            result[key] = sourceVal as T[Extract<keyof T, string>];
          }
        }
      }

      return result;
    },
  },
});
