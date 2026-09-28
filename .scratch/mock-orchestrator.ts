/**
 * ORQUESTADOR DE PRUEBA — Lee de JSON estático en lugar de Supabase
 *
 * Activo solo cuando MOCK_MODE=true en .env.local (temporal)
 *
 * Para revertir: borrar este archivo, restaurar generaldata.service.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { GeneralData } from "../src/components/schemas";
import type { ContactSectionMetadata, NavbarItem } from "../src/components/schemas";

// Cargar mock una sola vez (module-level cache)
const MOCK_PATH = join(process.cwd(), ".scratch", "mock-data.json");

function loadMock(): GeneralData {
  const raw = readFileSync(MOCK_PATH, "utf-8");
  const data = JSON.parse(raw);

  // Convertir a tipos correctos (Zod no se ejecuta aquí, confiamos en el shape)
  return data as GeneralData;
}

export const getGeneralData = async (
  lang: string = "es"
): Promise<GeneralData> => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[MOCK] getGeneralData(${lang}) — leyendo de ${MOCK_PATH}`);
  }
  return loadMock();
};
