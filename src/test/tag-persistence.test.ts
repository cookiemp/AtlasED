import { describe, it, expect } from "vitest";

/**
 * Tests for tag persistence logic.
 *
 * Validates the tag extraction and deduplication logic used when
 * field guides are generated and tags are saved to the database.
 */

// ─── Tag Extraction (mirrors VideoPlayer.tsx field guide save logic) ───

interface KeyConcept {
    title: string;
    explanation: string;
    tags?: string[];
}

function extractUniqueTags(keyConcepts: KeyConcept[]): string[] {
    const allTags = new Set<string>();
    for (const concept of keyConcepts) {
        if (concept.tags) {
            concept.tags.forEach((t) => allTags.add(t.toLowerCase().trim()));
        }
    }
    // Remove empty strings
    allTags.delete("");
    return Array.from(allTags).sort();
}

// ─── Tag Backfill Detection (mirrors queries.js backfillMissingTags) ───

interface FieldGuideRow {
    waypoint_id: string;
    key_takeaways: string | null;
}

function parseTagsFromKeyTakeaways(row: FieldGuideRow): string[] {
    if (!row.key_takeaways) return [];
    try {
        const keyConcepts = JSON.parse(row.key_takeaways);
        if (!Array.isArray(keyConcepts)) return [];
        return extractUniqueTags(keyConcepts);
    } catch {
        return [];
    }
}

// ─── Tests ───

describe("Tag Extraction from Key Concepts", () => {
    it("should extract tags from key concepts", () => {
        const concepts: KeyConcept[] = [
            { title: "React Hooks", explanation: "...", tags: ["react", "hooks"] },
            { title: "State", explanation: "...", tags: ["state", "react"] },
        ];
        const tags = extractUniqueTags(concepts);
        expect(tags).toEqual(["hooks", "react", "state"]);
    });

    it("should deduplicate tags (case-insensitive)", () => {
        const concepts: KeyConcept[] = [
            { title: "A", explanation: "...", tags: ["React", "REACT", "react"] },
        ];
        expect(extractUniqueTags(concepts)).toEqual(["react"]);
    });

    it("should handle concepts without tags", () => {
        const concepts: KeyConcept[] = [
            { title: "A", explanation: "..." },
            { title: "B", explanation: "...", tags: ["tag1"] },
        ];
        expect(extractUniqueTags(concepts)).toEqual(["tag1"]);
    });

    it("should handle empty tags arrays", () => {
        const concepts: KeyConcept[] = [
            { title: "A", explanation: "...", tags: [] },
        ];
        expect(extractUniqueTags(concepts)).toEqual([]);
    });

    it("should handle empty concepts array", () => {
        expect(extractUniqueTags([])).toEqual([]);
    });

    it("should trim whitespace from tags", () => {
        const concepts: KeyConcept[] = [
            { title: "A", explanation: "...", tags: ["  react  ", " hooks "] },
        ];
        expect(extractUniqueTags(concepts)).toEqual(["hooks", "react"]);
    });

    it("should filter out empty string tags", () => {
        const concepts: KeyConcept[] = [
            { title: "A", explanation: "...", tags: ["", "react", "  ", "hooks"] },
        ];
        expect(extractUniqueTags(concepts)).toEqual(["hooks", "react"]);
    });
});

describe("Tag Parsing from Stored Field Guide Data", () => {
    it("should parse valid JSON key_takeaways", () => {
        const row: FieldGuideRow = {
            waypoint_id: "w1",
            key_takeaways: JSON.stringify([
                { title: "A", explanation: "...", tags: ["backend", "api"] },
                { title: "B", explanation: "...", tags: ["api", "rest"] },
            ]),
        };
        expect(parseTagsFromKeyTakeaways(row)).toEqual(["api", "backend", "rest"]);
    });

    it("should handle null key_takeaways", () => {
        const row: FieldGuideRow = { waypoint_id: "w1", key_takeaways: null };
        expect(parseTagsFromKeyTakeaways(row)).toEqual([]);
    });

    it("should handle invalid JSON gracefully", () => {
        const row: FieldGuideRow = {
            waypoint_id: "w1",
            key_takeaways: "not valid json",
        };
        expect(parseTagsFromKeyTakeaways(row)).toEqual([]);
    });

    it("should handle non-array JSON", () => {
        const row: FieldGuideRow = {
            waypoint_id: "w1",
            key_takeaways: JSON.stringify({ not: "an array" }),
        };
        expect(parseTagsFromKeyTakeaways(row)).toEqual([]);
    });

    it("should handle concepts with no tags field in stored JSON", () => {
        const row: FieldGuideRow = {
            waypoint_id: "w1",
            key_takeaways: JSON.stringify([
                { title: "A", explanation: "no tags field here" },
            ]),
        };
        expect(parseTagsFromKeyTakeaways(row)).toEqual([]);
    });
});
