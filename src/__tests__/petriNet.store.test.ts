import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePetriNetStore } from "@/stores/petriNet";

const PETRI_NET_STORAGE_KEY = "woped-petrinet";

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
  };
}

describe("PetriNet Store", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      writable: true,
    });
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Places", () => {
    it("should add a place", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");

      expect(place).toBeDefined();
      expect(place.name).toBe("P1");
      expect(place.position.x).toBe(100);
      expect(place.position.y).toBe(200);
      expect(store.net.places).toHaveLength(1);
    });

    it("should update a place", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");

      store.updatePlace(place.id, { tokens: 5, name: "Updated" });

      expect(store.net.places[0].tokens).toBe(5);
      expect(store.net.places[0].name).toBe("Updated");
    });

    it("should delete a place", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");

      store.deleteElement(place.id);

      expect(store.net.places).toHaveLength(0);
    });
  });

  describe("Transitions", () => {
    it("should add a transition", () => {
      const store = usePetriNetStore();
      const transition = store.addTransition({ x: 150, y: 250 }, "T1");

      expect(transition).toBeDefined();
      expect(transition.name).toBe("T1");
      expect(store.net.transitions).toHaveLength(1);
    });

    it("should update a transition", () => {
      const store = usePetriNetStore();
      const transition = store.addTransition({ x: 150, y: 250 }, "T1");

      store.updateTransition(transition.id, { name: "Updated" });

      expect(store.net.transitions[0].name).toBe("Updated");
    });
  });

  describe("Arcs", () => {
    it("should add an arc from place to transition", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");
      const transition = store.addTransition({ x: 200, y: 200 }, "T1");

      const arc = store.addArc(place.id, transition.id);

      expect(arc).not.toBeNull();
      expect(arc!.sourceId).toBe(place.id);
      expect(arc!.targetId).toBe(transition.id);
      expect(store.net.arcs).toHaveLength(1);
    });

    it("should add an arc from transition to place", () => {
      const store = usePetriNetStore();
      const transition = store.addTransition({ x: 100, y: 200 }, "T1");
      const place = store.addPlace({ x: 200, y: 200 }, "P1");

      const arc = store.addArc(transition.id, place.id);

      expect(arc).not.toBeNull();
      expect(arc!.sourceId).toBe(transition.id);
      expect(arc!.targetId).toBe(place.id);
    });

    it("should not add an arc from place to place", () => {
      const store = usePetriNetStore();
      const p1 = store.addPlace({ x: 100, y: 200 }, "P1");
      const p2 = store.addPlace({ x: 200, y: 200 }, "P2");

      const arc = store.addArc(p1.id, p2.id);

      expect(arc).toBeNull();
      expect(store.net.arcs).toHaveLength(0);
    });

    it("should not add an arc from transition to transition", () => {
      const store = usePetriNetStore();
      const t1 = store.addTransition({ x: 100, y: 200 }, "T1");
      const t2 = store.addTransition({ x: 200, y: 200 }, "T2");

      const arc = store.addArc(t1.id, t2.id);

      expect(arc).toBeNull();
      expect(store.net.arcs).toHaveLength(0);
    });

    it("should delete arcs when deleting connected element", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");
      const transition = store.addTransition({ x: 200, y: 200 }, "T1");
      store.addArc(place.id, transition.id);

      expect(store.net.arcs).toHaveLength(1);

      store.deleteElement(place.id);

      expect(store.net.arcs).toHaveLength(0);
    });
  });

  describe("Undo/Redo", () => {
    it("should track history when adding elements", () => {
      const store = usePetriNetStore();

      // Add first place
      store.addPlace({ x: 100, y: 200 }, "P1");
      // Add second place
      store.addPlace({ x: 200, y: 200 }, "P2");

      expect(store.net.places).toHaveLength(2);
      // History should have entries
      expect(store.history.length).toBeGreaterThan(0);
    });

    it("should have undo available after multiple actions", () => {
      const store = usePetriNetStore();
      store.addPlace({ x: 100, y: 200 }, "P1");
      store.addPlace({ x: 200, y: 200 }, "P2");
      store.addPlace({ x: 300, y: 200 }, "P3");

      expect(store.canUndo).toBe(true);
      expect(store.history.length).toBeGreaterThan(1);
    });
  });

  describe("Selection", () => {
    it("should select an element", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");

      store.select(place.id, false);

      expect(store.selectedIds).toContain(place.id);
    });

    it("should multi-select with shift", () => {
      const store = usePetriNetStore();
      const p1 = store.addPlace({ x: 100, y: 200 }, "P1");
      const p2 = store.addPlace({ x: 200, y: 200 }, "P2");

      store.select(p1.id, false);
      store.select(p2.id, true); // shift = true

      expect(store.selectedIds).toContain(p1.id);
      expect(store.selectedIds).toContain(p2.id);
    });

    it("should clear selection", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");
      store.select(place.id, false);

      store.clearSelection();

      expect(store.selectedIds).toHaveLength(0);
    });
  });

  describe("Persistence", () => {
    it("saves net state to localStorage", () => {
      const store = usePetriNetStore();
      store.addPlace({ x: 100, y: 200 }, "P1");

      store.saveToLocalStorage();

      const saved = localStorage.getItem(PETRI_NET_STORAGE_KEY);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.nets).toEqual(store.nets);
      expect(parsed.activeNetId).toBe(store.activeNetId);
    });

    it("loads saved net state", () => {
      const store = usePetriNetStore();
      const place = store.addPlace({ x: 100, y: 200 }, "P1");
      store.saveToLocalStorage();

      setActivePinia(createPinia());
      const restoredStore = usePetriNetStore();
      const loaded = restoredStore.load();

      expect(loaded).toBe(true);
      expect(restoredStore.net.places).toHaveLength(1);
      expect(restoredStore.net.places[0].id).toBe(place.id);
    });

    it("returns false when no saved state exists", () => {
      const store = usePetriNetStore();
      const loaded = store.load();
      expect(loaded).toBe(false);
    });

    it("returns false and keeps empty net when saved data is corrupt", () => {
      localStorage.setItem(PETRI_NET_STORAGE_KEY, "not-json");
      const store = usePetriNetStore();
      const loaded = store.load();

      expect(loaded).toBe(false);
      expect(store.net).toBeDefined();
    });

    it("returns false when activeNetId is missing from saved nets", () => {
      const store = usePetriNetStore();
      localStorage.setItem(
        PETRI_NET_STORAGE_KEY,
        JSON.stringify({ nets: store.nets, activeNetId: "unknown-id" }),
      );
      const loaded = store.load();
      expect(loaded).toBe(false);
    });

    it("clears saved state and resets to a new net", () => {
      const store = usePetriNetStore();
      const originalId = store.activeNetId;
      store.addPlace({ x: 100, y: 200 }, "P1");
      store.saveToLocalStorage();

      store.clearSaved();

      expect(localStorage.getItem(PETRI_NET_STORAGE_KEY)).toBeNull();
      expect(store.activeNetId).not.toBe(originalId);
      expect(store.net.places).toHaveLength(0);
    });

    it("debounces saves after mutations", () => {
      vi.useFakeTimers();
      const store = usePetriNetStore();

      store.addPlace({ x: 100, y: 200 }, "P1");
      expect(localStorage.getItem(PETRI_NET_STORAGE_KEY)).toBeNull();

      vi.advanceTimersByTime(1000);

      const saved = localStorage.getItem(PETRI_NET_STORAGE_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!).nets[store.activeNetId].places).toHaveLength(1);
    });
  });
});
