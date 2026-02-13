import { describe, it, expect } from "vitest";

/**
 * Tests for Knowledge Graph data processing logic.
 *
 * The graph rendering is D3-based (hard to unit test), but the data
 * transformation logic — building nodes, links, and category inference —
 * can be tested in isolation.
 */

// ─── Category Inference (extracted from KnowledgeGraph.tsx) ───

type Category = "fundamentals" | "advanced" | "practical" | "theory";

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
    fundamentals: [
        "basic", "introduction", "getting started", "beginner",
        "setup", "install", "overview", "what is", "foundation",
    ],
    advanced: [
        "advanced", "optimization", "performance", "architecture",
        "design pattern", "scaling", "complex", "deep dive",
    ],
    practical: [
        "project", "build", "implement", "tutorial", "hands-on",
        "example", "practice", "exercise", "demo", "workshop",
    ],
    theory: [
        "theory", "concept", "algorithm", "data structure",
        "principle", "paradigm", "mathematics", "computation",
    ],
};

function inferCategory(keyConcepts: string): Category {
    const text = keyConcepts.toLowerCase();
    let bestCategory: Category = "fundamentals";
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
        const score = keywords.filter((kw) => text.includes(kw)).length;
        if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
        }
    }

    return bestCategory;
}

// ─── Link Building (extracted from KnowledgeGraph.tsx) ───

interface WaypointTag {
    waypoint_id: string;
    tag_id: string;
    tag_name: string;
}

interface GraphLink {
    source: string;
    target: string;
    weight: number;
    type: "prerequisite" | "related";
    sharedTags: string[];
}

function buildLinks(waypointTags: WaypointTag[]): GraphLink[] {
    const tagToWaypoints = new Map<string, string[]>();

    for (const wt of waypointTags) {
        if (!tagToWaypoints.has(wt.tag_id)) {
            tagToWaypoints.set(wt.tag_id, []);
        }
        tagToWaypoints.get(wt.tag_id)!.push(wt.waypoint_id);
    }

    const linkMap = new Map<string, { weight: number; sharedTags: string[] }>();

    for (const [tagId, waypoints] of tagToWaypoints) {
        const tagName = waypointTags.find((wt) => wt.tag_id === tagId)?.tag_name || tagId;
        for (let i = 0; i < waypoints.length; i++) {
            for (let j = i + 1; j < waypoints.length; j++) {
                const key = [waypoints[i], waypoints[j]].sort().join("__");
                if (!linkMap.has(key)) {
                    linkMap.set(key, { weight: 0, sharedTags: [] });
                }
                const link = linkMap.get(key)!;
                link.weight++;
                link.sharedTags.push(tagName);
            }
        }
    }

    return Array.from(linkMap.entries()).map(([key, data]) => {
        const [source, target] = key.split("__");
        return {
            source,
            target,
            weight: data.weight,
            type: data.weight >= 2 ? "prerequisite" : "related",
            sharedTags: data.sharedTags,
        };
    });
}

// ─── Tests ───

describe("Category Inference", () => {
    it("should detect fundamentals keywords", () => {
        expect(inferCategory("Introduction to React basics and getting started")).toBe("fundamentals");
    });

    it("should detect advanced keywords", () => {
        expect(inferCategory("Advanced performance optimization and architecture patterns")).toBe("advanced");
    });

    it("should detect practical keywords", () => {
        expect(inferCategory("Build a project hands-on tutorial with examples")).toBe("practical");
    });

    it("should detect theory keywords", () => {
        expect(inferCategory("Algorithm and data structure theory concepts")).toBe("theory");
    });

    it("should default to fundamentals with no matching keywords", () => {
        expect(inferCategory("some random unrelated text")).toBe("fundamentals");
    });

    it("should pick the category with most keyword matches", () => {
        // 2 advanced keywords vs 1 practical keyword
        expect(inferCategory("Advanced optimization to build something")).toBe("advanced");
    });

    it("should be case-insensitive", () => {
        expect(inferCategory("INTRODUCTION BASIC OVERVIEW")).toBe("fundamentals");
    });
});

describe("Knowledge Graph Link Building", () => {
    it("should create no links with no tags", () => {
        expect(buildLinks([])).toEqual([]);
    });

    it("should create no links with single waypoint per tag", () => {
        const tags: WaypointTag[] = [
            { waypoint_id: "w1", tag_id: "t1", tag_name: "react" },
            { waypoint_id: "w2", tag_id: "t2", tag_name: "vue" },
        ];
        expect(buildLinks(tags)).toEqual([]);
    });

    it("should create a link between two waypoints sharing a tag", () => {
        const tags: WaypointTag[] = [
            { waypoint_id: "w1", tag_id: "t1", tag_name: "javascript" },
            { waypoint_id: "w2", tag_id: "t1", tag_name: "javascript" },
        ];
        const links = buildLinks(tags);
        expect(links).toHaveLength(1);
        expect(links[0].weight).toBe(1);
        expect(links[0].type).toBe("related");
        expect(links[0].sharedTags).toEqual(["javascript"]);
    });

    it("should increase weight for multiple shared tags", () => {
        const tags: WaypointTag[] = [
            { waypoint_id: "w1", tag_id: "t1", tag_name: "javascript" },
            { waypoint_id: "w2", tag_id: "t1", tag_name: "javascript" },
            { waypoint_id: "w1", tag_id: "t2", tag_name: "frontend" },
            { waypoint_id: "w2", tag_id: "t2", tag_name: "frontend" },
        ];
        const links = buildLinks(tags);
        expect(links).toHaveLength(1);
        expect(links[0].weight).toBe(2);
        expect(links[0].type).toBe("prerequisite"); // weight >= 2
        expect(links[0].sharedTags).toContain("javascript");
        expect(links[0].sharedTags).toContain("frontend");
    });

    it("should handle three waypoints sharing a tag (triangle)", () => {
        const tags: WaypointTag[] = [
            { waypoint_id: "w1", tag_id: "t1", tag_name: "backend" },
            { waypoint_id: "w2", tag_id: "t1", tag_name: "backend" },
            { waypoint_id: "w3", tag_id: "t1", tag_name: "backend" },
        ];
        const links = buildLinks(tags);
        expect(links).toHaveLength(3); // w1-w2, w1-w3, w2-w3
    });

    it("should handle waypoints with different tag sets", () => {
        const tags: WaypointTag[] = [
            { waypoint_id: "w1", tag_id: "t1", tag_name: "react" },
            { waypoint_id: "w2", tag_id: "t1", tag_name: "react" },
            { waypoint_id: "w2", tag_id: "t2", tag_name: "node" },
            { waypoint_id: "w3", tag_id: "t2", tag_name: "node" },
        ];
        const links = buildLinks(tags);
        expect(links).toHaveLength(2); // w1-w2 (react), w2-w3 (node)
    });
});
