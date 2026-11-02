import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DOWNLOADS } from "../downloads";
import { OPPORTUNITIES, SOURCES } from "../sources";
import { evaluate, getDefaults } from "@/engine";

describe("source records and originals", () => {
  it("imports all 18 source records and 16 coverage companies", () => {
    expect(SOURCES.map((s) => s.id)).toEqual(Array.from({ length: 18 }, (_, i) => `S${String(i + 1).padStart(2, "0")}`));
    expect(OPPORTUNITIES).toHaveLength(16);
    SOURCES.forEach((s) => expect(s.url).toMatch(/^https:\/\//));
  });
  it("engine runs do not mutate source records", () => {
    const before = JSON.stringify(SOURCES);
    evaluate(getDefaults());
    expect(JSON.stringify(SOURCES)).toBe(before);
  });
  it("shipped downloads are byte-identical to the original documents", () => {
    for (const d of DOWNLOADS) {
      for (const dir of ["public/downloads", "source-documents"]) {
        const b = readFileSync(`${dir}/${d.file}`);
        expect(b.length).toBe(d.bytes);
        expect(createHash("sha256").update(b).digest("hex")).toBe(d.sha256);
      }
    }
  });
});
