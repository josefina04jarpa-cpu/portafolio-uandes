import { join } from "path";

export function resolveDataFile(fileName: string): string {
  return join(process.cwd(), "data", fileName);
}
