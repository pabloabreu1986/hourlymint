// ─────────────────────────────────────────────────────────────
// Capa de persistencia (MOCK). Hoy: localStorage del navegador.
// Toda la app pasa por services/*, que a su vez usan esta capa.
// Para migrar a una BD real basta con reimplementar services/*
// (p.ej. contra una API REST) sin tocar la UI.
// ─────────────────────────────────────────────────────────────
import type { DBSchema } from "./types";
import { seedDB } from "./seed";

const STORAGE_KEY = "forgevia.db";
/** Subir esta versión fuerza un re-seed limpio al cargar. */
const DB_VERSION = 2;
const VERSION_KEY = "forgevia.db.version";

let cache: DBSchema | null = null;

function readRaw(): DBSchema | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DBSchema) : null;
  } catch {
    return null;
  }
}

function ensureSeed(): DBSchema {
  const storedVersion = Number(localStorage.getItem(VERSION_KEY) || "0");
  let db = readRaw();
  if (!db || storedVersion !== DB_VERSION) {
    db = seedDB();
    persist(db);
    localStorage.setItem(VERSION_KEY, String(DB_VERSION));
  }
  return db;
}

function persist(db: DBSchema) {
  cache = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    // Cuota superada (típico al guardar muchas fotos). Avisamos en consola.
    console.error("No se pudo guardar en localStorage (¿cuota llena?)", err);
    throw new Error(
      "Almacenamiento local lleno. Elimina fotos antiguas o reinicia los datos."
    );
  }
}

/** Devuelve la BD completa (seed la primera vez). */
export function loadDB(): DBSchema {
  if (cache) return cache;
  cache = ensureSeed();
  return cache;
}

/** Lee, muta con `mutator` y guarda de forma atómica. Devuelve la BD. */
export function updateDB(mutator: (db: DBSchema) => void): DBSchema {
  const db = loadDB();
  mutator(db);
  persist(db);
  return db;
}

/** Restablece todos los datos a la semilla. */
export function resetDB(): DBSchema {
  const db = seedDB();
  persist(db);
  localStorage.setItem(VERSION_KEY, String(DB_VERSION));
  return db;
}

/** Genera un id único legible. */
export function uid(prefix = "id"): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

/** Simula latencia de red para que los servicios sean async como una API real. */
export function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
