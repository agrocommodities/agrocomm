"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sharedCattleCalculations } from "@/db/calculator-schema";

export type SharedCalculatorField = {
  label: string;
  value: string;
  type: "input" | "select";
};

export type SharedCalculatorData = {
  fields: SharedCalculatorField[];
};

function isValidData(data: SharedCalculatorData): boolean {
  if (
    !Array.isArray(data.fields) ||
    data.fields.length === 0 ||
    data.fields.length > 100
  ) {
    return false;
  }

  return data.fields.every(
    (field) =>
      typeof field.label === "string" &&
      field.label.length > 0 &&
      field.label.length <= 120 &&
      typeof field.value === "string" &&
      field.value.length <= 200 &&
      (field.type === "input" || field.type === "select"),
  );
}

export async function createSharedCalculation(
  data: SharedCalculatorData,
): Promise<{ uuid: string }> {
  if (!isValidData(data)) {
    throw new Error("Dados da calculadora inválidos.");
  }

  const serialized = JSON.stringify(data);
  if (serialized.length > 20_000) {
    throw new Error("Os dados da calculadora excedem o tamanho permitido.");
  }

  const uuid = randomUUID();
  await db.insert(sharedCattleCalculations).values({
    uuid,
    data: serialized,
  });

  return { uuid };
}

export async function getSharedCalculation(
  uuid: string,
): Promise<SharedCalculatorData | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      uuid,
    )
  ) {
    return null;
  }

  const [row] = await db
    .select({ data: sharedCattleCalculations.data })
    .from(sharedCattleCalculations)
    .where(eq(sharedCattleCalculations.uuid, uuid))
    .limit(1);

  if (!row) return null;

  try {
    const parsed = JSON.parse(row.data) as SharedCalculatorData;
    return isValidData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
