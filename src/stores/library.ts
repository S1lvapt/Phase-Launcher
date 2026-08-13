import { create } from "zustand";
import { Build } from "../vite-env";

type BuildEntry = Build;
type BuildCollection = Map<string, BuildEntry>;

interface InternalStore {
  entries: BuildCollection;
}

interface StoreMethods {
  add: (key: string, value: BuildEntry) => void;
  patch: (key: string, partial: Partial<BuildEntry>) => void;
  delete: (key: string) => void;
  wipe: () => void;
  hasBuilds: () => Promise<boolean>;
}

type CompleteStore = InternalStore & StoreMethods;

export const LIBRARY_KEY = "storage:library";

const StorageUtils = {
  read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  write<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  drop(key: string) {
    localStorage.removeItem(key);
  },
};

const encodeMap = (map: BuildCollection): [string, BuildEntry][] =>
  Array.from(map.entries());

const decodeMap = (arr: [string, BuildEntry][]): BuildCollection =>
  new Map(arr);

const loadInitial = (): BuildCollection => {
  const raw = StorageUtils.read<[string, BuildEntry][]>(LIBRARY_KEY, []);
  return decodeMap(raw);
};

export const useLibraryStore = create<CompleteStore>((set, get) => ({
  entries: loadInitial(),

  add: (key, build) => {
    const current = new Map(get().entries);
    current.set(key, build);
    StorageUtils.write(LIBRARY_KEY, encodeMap(current));
    set({ entries: current });
  },

  patch: (key, update) => {
    const current = new Map(get().entries);
    const target = current.get(key);
    if (!target) return;

    current.set(key, { ...target, ...update });
    StorageUtils.write(LIBRARY_KEY, encodeMap(current));
    set({ entries: current });
  },

  delete: (key) => {
    const current = new Map(get().entries);
    if (!current.has(key)) return;

    current.delete(key);
    StorageUtils.write(LIBRARY_KEY, encodeMap(current));
    set({ entries: current });
  },

  wipe: () => {
    StorageUtils.drop(LIBRARY_KEY);
    set({ entries: new Map() });
  },

  hasBuilds: async () => {
    return get().entries.size > 0;
  },
}));
