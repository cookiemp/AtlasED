import { describe, it, expect } from "vitest";
import type { SrsCheckpoint } from "@/types/electron";

/**
 * Tests for the SRS (Spaced Repetition System) algorithm.
 *
 * The actual SRS logic lives in electron/database/queries.js (getMemoryCheckpoints),
 * which runs in Node.js with better-sqlite3. These tests validate the algorithm's
 * *logic* in isolation — the same rules extracted into pure functions for testability.
 */

// ─── SRS Algorithm (extracted from queries.js) ───

const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

function computeIntervalIndex(sessions: Array<{ accuracy: number }>): number {
    let intervalIndex = 0;
    for (const session of sessions) {
        if (session.accuracy >= 0.8) {
            intervalIndex = Math.min(intervalIndex + 1, INTERVALS.length - 1);
        } else if (session.accuracy < 0.5) {
            intervalIndex = 0;
        }
        // 50-80%: hold
    }
    return intervalIndex;
}

function computeRetention(
    accuracy: number,
    daysSinceReview: number,
    currentIntervalDays: number
): number {
    const halfLife = currentIntervalDays * 2;
    return Math.round(
        Math.max(
            0,
            Math.min(100, accuracy * 100 * Math.pow(0.5, daysSinceReview / halfLife))
        )
    );
}

function computeDifficulty(accuracy: number): "easy" | "medium" | "hard" {
    if (accuracy >= 0.8) return "easy";
    if (accuracy < 0.5) return "hard";
    return "medium";
}

function isDue(
    lastReviewDate: Date,
    currentIntervalDays: number,
    now: Date
): boolean {
    const nextReview = new Date(
        lastReviewDate.getTime() + currentIntervalDays * 24 * 60 * 60 * 1000
    );
    return nextReview <= now;
}

// ─── Tests ───

describe("SRS Interval Advancement", () => {
    it("should start at interval index 0 (1 day) with no sessions", () => {
        expect(computeIntervalIndex([])).toBe(0);
    });

    it("should advance interval on ≥80% accuracy", () => {
        const sessions = [{ accuracy: 0.8 }];
        expect(computeIntervalIndex(sessions)).toBe(1); // → 3 days
    });

    it("should advance through multiple good sessions", () => {
        const sessions = [
            { accuracy: 1.0 },
            { accuracy: 0.9 },
            { accuracy: 0.85 },
        ];
        expect(computeIntervalIndex(sessions)).toBe(3); // → 14 days
    });

    it("should cap at maximum interval", () => {
        const sessions = Array(20).fill({ accuracy: 1.0 });
        expect(computeIntervalIndex(sessions)).toBe(INTERVALS.length - 1); // 120 days
    });

    it("should reset to 0 on <50% accuracy", () => {
        const sessions = [
            { accuracy: 1.0 },
            { accuracy: 1.0 },
            { accuracy: 0.3 }, // reset!
        ];
        expect(computeIntervalIndex(sessions)).toBe(0); // back to 1 day
    });

    it("should hold interval for 50-80% accuracy", () => {
        const sessions = [
            { accuracy: 1.0 }, // → index 1
            { accuracy: 0.6 }, // hold at 1
            { accuracy: 0.7 }, // hold at 1
        ];
        expect(computeIntervalIndex(sessions)).toBe(1); // still 3 days
    });

    it("should recover after a reset", () => {
        const sessions = [
            { accuracy: 1.0 }, // → 1
            { accuracy: 1.0 }, // → 2
            { accuracy: 0.2 }, // reset → 0
            { accuracy: 0.9 }, // → 1 again
        ];
        expect(computeIntervalIndex(sessions)).toBe(1); // → 3 days
    });

    it("should handle edge case of exactly 50% (hold)", () => {
        const sessions = [
            { accuracy: 0.5 }, // neither advance nor reset
        ];
        expect(computeIntervalIndex(sessions)).toBe(0);
    });

    it("should handle edge case of exactly 80% (advance)", () => {
        const sessions = [
            { accuracy: 0.8 }, // exactly at threshold → advance
        ];
        expect(computeIntervalIndex(sessions)).toBe(1);
    });
});

describe("Retention Strength Calculation", () => {
    it("should return full retention immediately after perfect review", () => {
        expect(computeRetention(1.0, 0, 7)).toBe(100);
    });

    it("should decay over time", () => {
        const retention = computeRetention(1.0, 14, 7); // half-life = 14, so 14 days = 50%
        expect(retention).toBe(50);
    });

    it("should scale with accuracy", () => {
        // 50% accuracy, 0 days since review → retention = 50
        expect(computeRetention(0.5, 0, 7)).toBe(50);
    });

    it("should not exceed 100", () => {
        expect(computeRetention(1.0, 0, 1)).toBeLessThanOrEqual(100);
    });

    it("should not go below 0", () => {
        expect(computeRetention(0.1, 365, 1)).toBeGreaterThanOrEqual(0);
    });

    it("should approach 0 for very old reviews", () => {
        const retention = computeRetention(1.0, 365, 1); // 1-day interval, 365 days ago
        expect(retention).toBe(0);
    });

    it("should decay slower for longer intervals", () => {
        const shortInterval = computeRetention(1.0, 7, 3); // half-life = 6 days
        const longInterval = computeRetention(1.0, 7, 30); // half-life = 60 days
        expect(longInterval).toBeGreaterThan(shortInterval);
    });
});

describe("Difficulty Classification", () => {
    it("should classify ≥80% as easy", () => {
        expect(computeDifficulty(0.8)).toBe("easy");
        expect(computeDifficulty(1.0)).toBe("easy");
        expect(computeDifficulty(0.95)).toBe("easy");
    });

    it("should classify <50% as hard", () => {
        expect(computeDifficulty(0.0)).toBe("hard");
        expect(computeDifficulty(0.3)).toBe("hard");
        expect(computeDifficulty(0.49)).toBe("hard");
    });

    it("should classify 50-79% as medium", () => {
        expect(computeDifficulty(0.5)).toBe("medium");
        expect(computeDifficulty(0.6)).toBe("medium");
        expect(computeDifficulty(0.79)).toBe("medium");
    });
});

describe("Due Date Calculation", () => {
    it("should be due when interval has passed", () => {
        const lastReview = new Date("2026-01-01");
        const now = new Date("2026-01-05");
        expect(isDue(lastReview, 3, now)).toBe(true); // 3 days passed, 3-day interval
    });

    it("should not be due within interval", () => {
        const lastReview = new Date("2026-01-01");
        const now = new Date("2026-01-02");
        expect(isDue(lastReview, 3, now)).toBe(false);
    });

    it("should be due exactly at interval boundary", () => {
        const lastReview = new Date("2026-01-01T00:00:00Z");
        const now = new Date("2026-01-04T00:00:00Z"); // exactly 3 days
        expect(isDue(lastReview, 3, now)).toBe(true);
    });

    it("should handle long intervals", () => {
        const lastReview = new Date("2026-01-01");
        const now = new Date("2026-03-01");
        expect(isDue(lastReview, 120, now)).toBe(false); // 59 days < 120
    });
});

describe("SrsCheckpoint Type Shape", () => {
    it("should have all required fields", () => {
        const checkpoint: SrsCheckpoint = {
            id: "test-id",
            title: "Test Waypoint",
            expeditionTitle: "Test Expedition",
            expeditionId: "exp-1",
            difficulty: "medium",
            lastReviewed: "3 days ago",
            lastReviewedAt: "2026-01-10T00:00:00Z",
            currentInterval: "7 days",
            nextInterval: "14 days",
            retentionStrength: 75,
            dueDate: "in 4 days",
            nextReviewAt: "2026-01-17T00:00:00Z",
            isDue: false,
            totalAttempts: 10,
            correctCount: 8,
            accuracy: 80,
            sessionCount: 3,
        };

        expect(checkpoint.id).toBe("test-id");
        expect(checkpoint.difficulty).toBe("medium");
        expect(checkpoint.retentionStrength).toBeGreaterThanOrEqual(0);
        expect(checkpoint.retentionStrength).toBeLessThanOrEqual(100);
        expect(checkpoint.accuracy).toBeGreaterThanOrEqual(0);
        expect(checkpoint.accuracy).toBeLessThanOrEqual(100);
        expect(["easy", "medium", "hard"]).toContain(checkpoint.difficulty);
    });
});
