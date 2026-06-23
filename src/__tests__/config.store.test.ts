import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConfigStore } from "@/stores/config";
import { DEFAULT_CONFIG } from "@/types/config";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock matchMedia
Object.defineProperty(globalThis, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("Config Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorageMock.clear();
  });

  describe("Default Values", () => {
    it("should have default config values", () => {
      const store = useConfigStore();

      expect(store.general.theme).toBe("system");
      expect(store.editor.showGrid).toBe(true);
      expect(store.editor.snapToGrid).toBe(true);
    });
  });

  describe("Update Settings", () => {
    it("should update general settings", () => {
      const store = useConfigStore();

      store.updateGeneral({ theme: "dark" });

      expect(store.general.theme).toBe("dark");
    });

    it("should update editor settings", () => {
      const store = useConfigStore();

      store.updateEditor({ gridSize: 30, showGrid: false });

      expect(store.editor.gridSize).toBe(30);
      expect(store.editor.showGrid).toBe(false);
    });

    it("should update token game settings", () => {
      const store = useConfigStore();

      store.updateTokenGame({ defaultSpeed: 2000 });

      expect(store.tokenGame.defaultSpeed).toBe(2000);
    });

    it("should update analysis settings", () => {
      const store = useConfigStore();

      store.updateAnalysis({ maxStates: 5000 });

      expect(store.analysis.maxStates).toBe(5000);
    });

    it("should update service settings", () => {
      const store = useConfigStore();

      store.updateServices({
        t2pEnabled: false,
        p2tEndpoint: "http://custom-p2t/",
      });

      expect(store.services.t2pEnabled).toBe(false);
      expect(store.services.p2tEndpoint).toBe("http://custom-p2t/");
      expect(store.services.t2pEndpoint).toBe(
        DEFAULT_CONFIG.services.t2pEndpoint,
      );
    });
  });

  describe("Theme", () => {
    it("should set theme directly", () => {
      const store = useConfigStore();

      store.setTheme("dark");

      expect(store.general.theme).toBe("dark");
    });

    it("should compute effective theme for light", () => {
      const store = useConfigStore();
      store.setTheme("light");

      expect(store.effectiveTheme).toBe("light");
      expect(store.isDarkMode).toBe(false);
    });

    it("should compute effective theme for dark", () => {
      const store = useConfigStore();
      store.setTheme("dark");

      expect(store.effectiveTheme).toBe("dark");
      expect(store.isDarkMode).toBe(true);
    });
  });

  describe("Locale", () => {
    it("should set locale", () => {
      const store = useConfigStore();

      store.setLocale("de");

      expect(store.language.locale).toBe("de");
    });
  });

  describe("Recent Files", () => {
    it("should add a recent file", () => {
      const store = useConfigStore();

      store.addRecentFile({ name: "test.pnml", format: "pnml" });

      expect(store.recentFiles).toHaveLength(1);
      expect(store.recentFiles[0].name).toBe("test.pnml");
    });

    it("should update lastOpened for existing file", () => {
      const store = useConfigStore();

      store.addRecentFile({ name: "test.pnml", format: "pnml" });

      // Add again - should still have only 1 entry
      store.addRecentFile({ name: "test.pnml", format: "pnml" });

      expect(store.recentFiles).toHaveLength(1);
    });

    it("should limit recent files to max", () => {
      const store = useConfigStore();

      // Add more than max files
      for (let i = 0; i < 15; i++) {
        store.addRecentFile({ name: `test${i}.pnml`, format: "pnml" });
      }

      expect(store.recentFiles.length).toBeLessThanOrEqual(10);
    });

    it("should remove a recent file", () => {
      const store = useConfigStore();
      store.addRecentFile({ name: "test.pnml", format: "pnml" });

      store.removeRecentFile("test.pnml");

      expect(store.recentFiles).toHaveLength(0);
    });

    it("should clear all recent files", () => {
      const store = useConfigStore();
      store.addRecentFile({ name: "test1.pnml", format: "pnml" });
      store.addRecentFile({ name: "test2.pnml", format: "pnml" });

      store.clearRecentFiles();

      expect(store.recentFiles).toHaveLength(0);
    });

    it("should sort recent files by lastOpened", () => {
      const store = useConfigStore();

      store.addRecentFile({ name: "old.pnml", format: "pnml" });
      store.recentFiles[0].lastOpened = 1000;

      store.addRecentFile({ name: "new.pnml", format: "pnml" });
      store.recentFiles[0].lastOpened = 2000;

      const sorted = store.sortedRecentFiles;

      expect(sorted[0].name).toBe("new.pnml");
    });
  });

  describe("Persistence", () => {
    it("should save to localStorage", () => {
      const store = useConfigStore();
      store.updateGeneral({ theme: "dark" });

      const saved = localStorage.getItem("woped-config");
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.general.theme).toBe("dark");
    });

    it("should load from localStorage", () => {
      // Pre-populate localStorage
      localStorage.setItem(
        "woped-config",
        JSON.stringify({
          ...DEFAULT_CONFIG,
          general: { ...DEFAULT_CONFIG.general, theme: "dark" },
        }),
      );

      const store = useConfigStore();
      store.load();

      expect(store.general.theme).toBe("dark");
    });

    it("should reset to defaults", () => {
      const store = useConfigStore();
      store.updateEditor({ gridSize: 50 });

      store.reset();

      // Grid size should be reset
      expect(store.editor.gridSize).toBe(20);
      expect(store.editor.showGrid).toBe(true);
    });
  });
});
