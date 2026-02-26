import { getDatabase } from './init.js';
import { v4 as uuidv4 } from 'uuid';

// ============ Expeditions ============

export function createExpedition({ title, thumbnail_url, playlist_url }) {
    const db = getDatabase();
    const id = uuidv4();
    const stmt = db.prepare(`
    INSERT INTO expeditions (id, title, thumbnail_url, playlist_url)
    VALUES (?, ?, ?, ?)
  `);
    stmt.run(id, title, thumbnail_url || null, playlist_url || null);
    return { id, title, thumbnail_url, playlist_url };
}

export function getExpeditions() {
    const db = getDatabase();
    return db.prepare(`
    SELECT e.*, 
           COUNT(w.id) as total_waypoints,
           SUM(CASE WHEN w.is_charted = 1 THEN 1 ELSE 0 END) as completed_waypoints
    FROM expeditions e
    LEFT JOIN waypoints w ON e.id = w.expedition_id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `).all();
}

export function getExpedition(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM expeditions WHERE id = ?').get(id);
}

export function updateExpedition(id, { title, thumbnail_url }) {
    const db = getDatabase();
    const stmt = db.prepare(`
    UPDATE expeditions 
    SET title = COALESCE(?, title), 
        thumbnail_url = COALESCE(?, thumbnail_url),
        updated_at = datetime('now')
    WHERE id = ?
  `);
    stmt.run(title, thumbnail_url, id);
    return getExpedition(id);
}

export function deleteExpedition(id) {
    const db = getDatabase();
    db.prepare('DELETE FROM expeditions WHERE id = ?').run(id);
    return { success: true };
}

// ============ Waypoints ============

export function createWaypoint({ expedition_id, youtube_id, title, thumbnail_url, duration_seconds, order_index }) {
    const db = getDatabase();
    const id = uuidv4();
    const stmt = db.prepare(`
    INSERT INTO waypoints (id, expedition_id, youtube_id, title, thumbnail_url, duration_seconds, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, expedition_id, youtube_id, title, thumbnail_url || null, duration_seconds || 0, order_index || 0);
    return { id, expedition_id, youtube_id, title, thumbnail_url, duration_seconds, order_index };
}

export function getWaypoints(expeditionId) {
    const db = getDatabase();
    return db.prepare(`
    SELECT * FROM waypoints 
    WHERE expedition_id = ? 
    ORDER BY order_index ASC
  `).all(expeditionId);
}

export function getWaypoint(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM waypoints WHERE id = ?').get(id);
}

export function updateWaypointProgress(id, position) {
    const db = getDatabase();
    db.prepare('UPDATE waypoints SET last_watched_pos = ? WHERE id = ?').run(position, id);
    return { success: true };
}

export function markWaypointCharted(id) {
    const db = getDatabase();
    db.prepare('UPDATE waypoints SET is_charted = 1 WHERE id = ?').run(id);
    return { success: true };
}

export function updateWaypointTranscript(id, transcript) {
    const db = getDatabase();
    db.prepare('UPDATE waypoints SET transcript_text = ? WHERE id = ?').run(transcript, id);
    return { success: true };
}

// ============ Field Guides ============

export function createFieldGuide({ waypoint_id, markdown_content, quiz_data_json, executive_summary, key_takeaways }) {
    const db = getDatabase();
    const id = uuidv4();
    const stmt = db.prepare(`
    INSERT INTO field_guides (id, waypoint_id, markdown_content, quiz_data_json, executive_summary, key_takeaways)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    stmt.run(id, waypoint_id, markdown_content || null, quiz_data_json || null, executive_summary || null, key_takeaways || null);
    return { id, waypoint_id };
}

export function getFieldGuide(waypointId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM field_guides WHERE waypoint_id = ?').get(waypointId);
}

export function updateFieldGuide(waypointId, { markdown_content, quiz_data_json, executive_summary, key_takeaways }) {
    const db = getDatabase();
    const stmt = db.prepare(`
    UPDATE field_guides 
    SET markdown_content = COALESCE(?, markdown_content),
        quiz_data_json = COALESCE(?, quiz_data_json),
        executive_summary = COALESCE(?, executive_summary),
        key_takeaways = COALESCE(?, key_takeaways),
        updated_at = datetime('now')
    WHERE waypoint_id = ?
  `);
    stmt.run(markdown_content, quiz_data_json, executive_summary, key_takeaways, waypointId);
    return getFieldGuide(waypointId);
}

// ============ Tags ============

export function createTag(name) {
    const db = getDatabase();
    const id = uuidv4();
    try {
        db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
        return { id, name };
    } catch (error) {
        // Only ignore unique constraint violations (tag already exists)
        if (error.message?.includes('UNIQUE constraint failed')) {
            return db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
        }
        // Log and re-throw unexpected errors
        console.error('Database error in createTag:', error);
        throw error;
    }
}

export function getTags() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
}

export function addWaypointTag(waypointId, tagId) {
    const db = getDatabase();
    try {
        db.prepare('INSERT INTO waypoint_tags (waypoint_id, tag_id) VALUES (?, ?)').run(waypointId, tagId);
        return { success: true };
    } catch (error) {
        // Only ignore unique constraint violations (relationship already exists)
        if (error.message?.includes('UNIQUE constraint failed')) {
            return { success: true, existing: true };
        }
        // Log and re-throw unexpected errors
        console.error('Database error in addWaypointTag:', error);
        throw error;
    }
}

export function getWaypointTags(waypointId) {
    const db = getDatabase();
    return db.prepare(`
    SELECT t.* FROM tags t
    JOIN waypoint_tags wt ON t.id = wt.tag_id
    WHERE wt.waypoint_id = ?
  `).all(waypointId);
}

// ============ Quiz Attempts ============

export function createQuizAttempt({ waypoint_id, question_index, is_correct }) {
    const db = getDatabase();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO quiz_attempts (id, waypoint_id, question_index, is_correct)
    VALUES (?, ?, ?, ?)
  `).run(id, waypoint_id, question_index, is_correct ? 1 : 0);
    return { id, waypoint_id, question_index, is_correct };
}

export function getQuizAttempts(waypointId) {
    const db = getDatabase();
    return db.prepare(`
    SELECT * FROM quiz_attempts 
    WHERE waypoint_id = ? 
    ORDER BY attempted_at DESC
  `).all(waypointId);
}

/**
 * Get all memory checkpoints — waypoints with quiz attempts + SRS scheduling.
 * Uses a simplified SM-2 spaced repetition algorithm:
 *   - Base intervals: 1d → 3d → 7d → 14d → 30d → 60d
 *   - Accuracy ≥ 80% → advance interval, < 50% → reset, else → hold
 *   - Retention decays over time since last review
 */
export function getMemoryCheckpoints() {
    const db = getDatabase();

    // Get per-waypoint quiz stats
    const waypointStats = db.prepare(`
        SELECT 
            qa.waypoint_id,
            w.title as waypoint_title,
            e.title as expedition_title,
            e.id as expedition_id,
            COUNT(*) as total_attempts,
            SUM(qa.is_correct) as correct_count,
            MAX(qa.attempted_at) as last_attempted_at,
            MIN(qa.attempted_at) as first_attempted_at
        FROM quiz_attempts qa
        JOIN waypoints w ON w.id = qa.waypoint_id
        JOIN expeditions e ON e.id = w.expedition_id
        GROUP BY qa.waypoint_id
        ORDER BY MAX(qa.attempted_at) DESC
    `).all();

    if (waypointStats.length === 0) return [];

    // SRS interval ladder (in days)
    const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

    const now = new Date();

    // Prefetch ALL sessions in a single query (fixes N+1 pattern)
    const waypointIds = waypointStats.map(s => s.waypoint_id);
    const placeholders = waypointIds.map(() => '?').join(',');
    const allSessions = db.prepare(`
        SELECT waypoint_id, DATE(attempted_at) as session_date,
               COUNT(*) as questions, SUM(is_correct) as correct
        FROM quiz_attempts
        WHERE waypoint_id IN (${placeholders})
        GROUP BY waypoint_id, DATE(attempted_at)
        ORDER BY session_date ASC
    `).all(...waypointIds);

    // Group sessions by waypoint_id in memory
    const sessionsByWaypoint = {};
    for (const s of allSessions) {
        if (!sessionsByWaypoint[s.waypoint_id]) sessionsByWaypoint[s.waypoint_id] = [];
        sessionsByWaypoint[s.waypoint_id].push(s);
    }

    return waypointStats.map(stat => {
        const accuracy = stat.total_attempts > 0
            ? stat.correct_count / stat.total_attempts
            : 0;

        // Look up sessions from prefetched data (no extra query)
        const sessions = sessionsByWaypoint[stat.waypoint_id] || [];

        let intervalIndex = 0;

        // Walk through sessions to determine current interval level
        for (const session of sessions) {
            const sessionAccuracy = session.questions > 0
                ? session.correct / session.questions
                : 0;

            if (sessionAccuracy >= 0.8) {
                // Good performance → advance
                intervalIndex = Math.min(intervalIndex + 1, INTERVALS.length - 1);
            } else if (sessionAccuracy < 0.5) {
                // Poor performance → reset
                intervalIndex = 0;
            }
            // 50-80% → hold current interval
        }

        const currentIntervalDays = INTERVALS[intervalIndex];
        const nextIntervalDays = INTERVALS[Math.min(intervalIndex + 1, INTERVALS.length - 1)];

        // Calculate next review date
        const lastReview = new Date(stat.last_attempted_at);
        const nextReview = new Date(lastReview.getTime() + currentIntervalDays * 24 * 60 * 60 * 1000);
        const isDue = nextReview <= now;

        // Calculate retention strength (decays over time since last review)
        const daysSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
        // Exponential decay: starts at accuracy*100, halves every (currentInterval * 2) days
        const halfLife = currentIntervalDays * 2;
        const retention = Math.round(
            Math.max(0, Math.min(100,
                accuracy * 100 * Math.pow(0.5, daysSinceReview / halfLife)
            ))
        );

        // Determine difficulty from accuracy
        let difficulty = 'medium';
        if (accuracy >= 0.8) difficulty = 'easy';
        else if (accuracy < 0.5) difficulty = 'hard';

        // Format intervals for display
        const formatInterval = (days) => {
            if (days === 1) return '1 day';
            if (days < 7) return `${days} days`;
            if (days === 7) return '1 week';
            if (days === 14) return '2 weeks';
            if (days === 30) return '1 month';
            if (days === 60) return '2 months';
            if (days === 120) return '4 months';
            return `${days} days`;
        };

        // Format "time ago" for last reviewed
        const formatTimeAgo = (date) => {
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins} min ago`;
            if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            if (diffDays === 1) return 'yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 14) return '1 week ago';
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
        };

        // Format due date
        const formatDueDate = (date) => {
            const diffMs = date.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'overdue';
            if (diffDays === 0) return 'today';
            if (diffDays === 1) return 'tomorrow';
            if (diffDays < 7) return `in ${diffDays} days`;
            return `in ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
        };

        return {
            id: stat.waypoint_id,
            title: stat.waypoint_title,
            expeditionTitle: stat.expedition_title,
            expeditionId: stat.expedition_id,
            difficulty,
            lastReviewed: formatTimeAgo(lastReview),
            lastReviewedAt: stat.last_attempted_at,
            currentInterval: formatInterval(currentIntervalDays),
            nextInterval: formatInterval(nextIntervalDays),
            retentionStrength: retention,
            dueDate: isDue ? 'overdue' : formatDueDate(nextReview),
            nextReviewAt: nextReview.toISOString(),
            isDue,
            totalAttempts: stat.total_attempts,
            correctCount: stat.correct_count,
            accuracy: Math.round(accuracy * 100),
            sessionCount: sessions.length,
        };
    });
}

// ============ Notes ============

export function getNote(waypointId) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM notes WHERE waypoint_id = ?').get(waypointId);
}

export function upsertNote(waypointId, content) {
    const db = getDatabase();
    const existing = getNote(waypointId);
    if (existing) {
        db.prepare('UPDATE notes SET content = ?, updated_at = datetime(\'now\') WHERE waypoint_id = ?')
            .run(content, waypointId);
    } else {
        const id = uuidv4();
        db.prepare('INSERT INTO notes (id, waypoint_id, content) VALUES (?, ?, ?)')
            .run(id, waypointId, content);
    }
    return getNote(waypointId);
}

// ============ Knowledge Graph Data ============

/**
 * Backfill tags for waypoints that have field guides but no tag associations.
 * This handles field guides generated before the tag-persistence fix was added.
 * Safe to call repeatedly — duplicate tags/associations are handled gracefully.
 */
function backfillMissingTags() {
    const db = getDatabase();
    try {
        // Find waypoints that have field guides with key_takeaways but NO tags
        const waypointsWithoutTags = db.prepare(`
            SELECT fg.waypoint_id, fg.key_takeaways
            FROM field_guides fg
            WHERE fg.key_takeaways IS NOT NULL
              AND fg.waypoint_id NOT IN (
                SELECT DISTINCT waypoint_id FROM waypoint_tags
              )
        `).all();

        if (waypointsWithoutTags.length === 0) return;

        console.log(`[KnowledgeGraph] Backfilling tags for ${waypointsWithoutTags.length} waypoint(s)...`);

        for (const row of waypointsWithoutTags) {
            try {
                const keyConcepts = JSON.parse(row.key_takeaways);
                if (!Array.isArray(keyConcepts)) continue;

                for (const concept of keyConcepts) {
                    const tags = concept.tags || [];
                    for (const rawTag of tags) {
                        const tagName = String(rawTag).toLowerCase().trim();
                        if (!tagName) continue;

                        // createTag handles duplicates via UNIQUE constraint
                        const tag = createTag(tagName);
                        if (tag?.id) {
                            addWaypointTag(row.waypoint_id, tag.id);
                        }
                    }
                }
            } catch (parseErr) {
                // Skip waypoints with unparseable key_takeaways
                console.warn(`[KnowledgeGraph] Could not parse key_takeaways for waypoint ${row.waypoint_id}:`, parseErr.message);
            }
        }

        console.log('[KnowledgeGraph] Tag backfill complete.');
    } catch (error) {
        console.error('[KnowledgeGraph] Tag backfill failed:', error);
    }
}

export function getKnowledgeGraphData() {
    const db = getDatabase();

    // Backfill tags for any field guides that predate the tag-persistence fix
    backfillMissingTags();

    // Get all waypoints that have field guides (i.e., have been processed)
    const waypoints = db.prepare(`
        SELECT w.id, w.title, w.expedition_id, w.is_charted,
        fg.key_takeaways, fg.executive_summary
        FROM waypoints w
        JOIN field_guides fg ON fg.waypoint_id = w.id
        WHERE fg.executive_summary IS NOT NULL
        `).all();

    // Get all tags with their waypoint associations
    const waypointTags = db.prepare(`
        SELECT wt.waypoint_id, t.id as tag_id, t.name as tag_name
        FROM waypoint_tags wt
        JOIN tags t ON t.id = wt.tag_id
        `).all();

    return { waypoints, waypointTags };
}

// ============ Bookmarks ============

export function createBookmark({ waypoint_id, timestamp_seconds, label, color }) {
    const db = getDatabase();
    const id = uuidv4();
    db.prepare(`
        INSERT INTO bookmarks (id, waypoint_id, timestamp_seconds, label, color)
        VALUES (?, ?, ?, ?, ?)
    `).run(id, waypoint_id, timestamp_seconds, label || '', color || 'gold');
    return db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
}

export function getBookmarks(waypointId) {
    const db = getDatabase();
    return db.prepare(
        'SELECT * FROM bookmarks WHERE waypoint_id = ? ORDER BY timestamp_seconds ASC'
    ).all(waypointId);
}

export function updateBookmark(id, { label, color }) {
    const db = getDatabase();
    const sets = [];
    const params = [];
    if (label !== undefined) { sets.push('label = ?'); params.push(label); }
    if (color !== undefined) { sets.push('color = ?'); params.push(color); }
    if (sets.length === 0) return;
    params.push(id);
    db.prepare(`UPDATE bookmarks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
}

export function deleteBookmark(id) {
    const db = getDatabase();
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
}

// ============ Global Search ============

export function globalSearch(query) {
    const db = getDatabase();
    const term = `%${query}%`;

    // Search expeditions
    const expeditions = db.prepare(`
        SELECT id, title, thumbnail_url, 'expedition' as type
        FROM expeditions
        WHERE title LIKE ?
        ORDER BY updated_at DESC
        LIMIT 5
    `).all(term);

    // Search waypoints (title + transcript)
    const waypoints = db.prepare(`
        SELECT w.id, w.title, w.expedition_id, w.youtube_id, w.order_index, w.is_charted,
               e.title as expedition_title, 'waypoint' as type
        FROM waypoints w
        JOIN expeditions e ON e.id = w.expedition_id
        WHERE w.title LIKE ?
        ORDER BY w.created_at DESC
        LIMIT 8
    `).all(term);

    // Search notes content
    const notes = db.prepare(`
        SELECT n.id, n.waypoint_id, n.content, w.title as waypoint_title,
               w.expedition_id, e.title as expedition_title, 'note' as type
        FROM notes n
        JOIN waypoints w ON w.id = n.waypoint_id
        JOIN expeditions e ON e.id = w.expedition_id
        WHERE n.content LIKE ?
        ORDER BY n.updated_at DESC
        LIMIT 5
    `).all(term);

    // Search bookmarks by label
    const bookmarks = db.prepare(`
        SELECT b.id, b.label, b.timestamp_seconds, b.waypoint_id, b.color,
               w.title as waypoint_title, w.expedition_id, 'bookmark' as type
        FROM bookmarks b
        JOIN waypoints w ON w.id = b.waypoint_id
        WHERE b.label LIKE ? AND b.label != ''
        ORDER BY b.created_at DESC
        LIMIT 5
    `).all(term);

    return { expeditions, waypoints, notes, bookmarks };
}
