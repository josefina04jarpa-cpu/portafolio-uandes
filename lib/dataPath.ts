import { existsSync } from "fs";
import { join } from "path";

export function resolveDataFile(fileName: string): string {
  const candidates = [
    join(process.cwd(), "data", fileName),
    join(process.cwd(), "portafolio-uandes", "data", fileName),
    join(process.cwd(), "..", "portafolio-uandes", "data", fileName),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0];
}
