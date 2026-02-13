/**
 * Mock Electron API for browser-based development testing
 * This allows testing UI without the Electron environment
 */

// Sample mock data
const mockExpeditions = [
    {
        id: 'mock-exp-1',
        title: 'Python in 100 Seconds',
        thumbnail_url: 'https://img.youtube.com/vi/x7X9w_GIm1s/maxresdefault.jpg',
        playlist_url: 'https://youtu.be/x7X9w_GIm1s',
        total_waypoints: 1,
        completed_waypoints: 0,
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-exp-2',
        title: 'JavaScript Crash Course',
        thumbnail_url: 'https://img.youtube.com/vi/hdI2bqOjy3c/maxresdefault.jpg',
        playlist_url: 'https://youtu.be/hdI2bqOjy3c',
        total_waypoints: 3,
        completed_waypoints: 1,
        created_at: new Date().toISOString()
    }
];

const mockWaypoints = {
    'mock-exp-1': [
        {
            id: 'mock-wp-1',
            expedition_id: 'mock-exp-1',
            youtube_id: 'x7X9w_GIm1s',
            title: 'Python in 100 Seconds',
            thumbnail_url: 'https://img.youtube.com/vi/x7X9w_GIm1s/maxresdefault.jpg',
            duration_seconds: 140,
            last_watched_pos: 45,
            is_charted: 0,
            order_index: 0
        }
    ],
    'mock-exp-2': [
        {
            id: 'mock-wp-2',
            expedition_id: 'mock-exp-2',
            youtube_id: 'hdI2bqOjy3c',
            title: 'JavaScript Tutorial for Beginners',
            thumbnail_url: 'https://img.youtube.com/vi/hdI2bqOjy3c/maxresdefault.jpg',
            duration_seconds: 3600,
            last_watched_pos: 1200,
            is_charted: 1,
            order_index: 0
        },
        {
            id: 'mock-wp-3',
            expedition_id: 'mock-exp-2',
            youtube_id: 'W6NZfCO5SIk',
            title: 'JavaScript ES6 Features',
            thumbnail_url: 'https://img.youtube.com/vi/W6NZfCO5SIk/maxresdefault.jpg',
            duration_seconds: 2400,
            last_watched_pos: 0,
            is_charted: 0,
            order_index: 1
        },
        {
            id: 'mock-wp-4',
            expedition_id: 'mock-exp-2',
            youtube_id: 'NCwa_xi0Uuc',
            title: 'JavaScript Async/Await',
            thumbnail_url: 'https://img.youtube.com/vi/NCwa_xi0Uuc/maxresdefault.jpg',
            duration_seconds: 1800,
            last_watched_pos: 0,
            is_charted: 0,
            order_index: 2
        }
    ]
};

const mockFieldGuide = {
    id: 'mock-fg-1',
    waypoint_id: 'mock-wp-1',
    executive_summary: 'Python is a high-level, interpreted programming language known for its simplicity and readability. It was created by Guido van Rossum and first released in 1991.',
    markdown_content: `## What is Python?

Python is a versatile programming language used for:

- **Web Development** (Django, Flask)
- **Data Science** (Pandas, NumPy)
- **Machine Learning** (TensorFlow, PyTorch)
- **Automation** (Scripts, DevOps)

### Key Features

1. **Easy to Learn** - Clean syntax that reads like English
2. **Interpreted** - No compilation needed
3. **Dynamic Typing** - Variables don't need type declarations
4. **Extensive Libraries** - Huge ecosystem of packages

### Code Example

\`\`\`python
# Hello World in Python
print("Hello, World!")

# Variables
name = "Atlas"
age = 25

# Functions
def greet(person):
    return f"Hello, {person}!"
\`\`\`

### Key Takeaways

- Python is beginner-friendly
- Used across many domains
- Large community support
`,
    quiz_data_json: JSON.stringify([
        {
            question: 'Who created Python?',
            options: ['Guido van Rossum', 'James Gosling', 'Brendan Eich', 'Dennis Ritchie'],
            correct_index: 0,
            explanation: 'Guido van Rossum created Python and first released it in 1991.'
        },
        {
            question: 'Which of the following is NOT a common use case for Python?',
            options: ['Web Development', 'Data Science', 'Operating System Kernels', 'Machine Learning'],
            correct_index: 2,
            explanation: 'Python is typically not used for operating system kernels due to performance requirements. C is more common for that purpose.'
        }
    ]),
    key_takeaways: JSON.stringify(['Python is beginner-friendly', 'Used across many domains', 'Large community support'])
};

const mockSettings = {
    gemini_api_key: '',
    youtube_api_key: '',
    theme: 'dark',
    auto_quiz: true,
    playback_speed: 1.0,
    srs_enabled: true,
    srs_intervals: [1, 3, 7, 14]
};

// Mock transcript
const mockTranscript = `Python is a high-level, general-purpose programming language. 
Its design philosophy emphasizes code readability with the use of significant indentation.
Python is dynamically typed and garbage-collected. It supports multiple programming paradigms,
including structured, object-oriented, and functional programming.
Python was conceived in the late 1980s by Guido van Rossum at Centrum Wiskunde & Informatica.`;

/**
 * Create and inject the mock atlased API
 */
export function initMockElectron() {
    if (window.atlased) {
        console.log('[MockElectron] Real Electron API detected, skipping mock');
        return;
    }

    console.log('[MockElectron] Injecting mock API for browser testing');

    window.atlased = {
        // Window controls (no-op in browser)
        window: {
            minimize: () => console.log('[Mock] minimize'),
            maximize: () => console.log('[Mock] maximize'),
            close: () => console.log('[Mock] close')
        },

        // Settings
        settings: {
            get: async (key) => mockSettings[key],
            set: async (key, value) => {
                mockSettings[key] = value;
                console.log(`[Mock] settings.set(${key}, ${value})`);
            },
            getAll: async () => ({ ...mockSettings })
        },

        // Expeditions
        expeditions: {
            create: async (data) => {
                const id = 'mock-exp-' + Date.now();
                const expedition = { id, ...data, total_waypoints: 0, completed_waypoints: 0 };
                mockExpeditions.push(expedition);
                mockWaypoints[id] = [];
                console.log('[Mock] Created expedition:', expedition);
                return expedition;
            },
            getAll: async () => [...mockExpeditions],
            get: async (id) => mockExpeditions.find(e => e.id === id),
            delete: async (id) => {
                const idx = mockExpeditions.findIndex(e => e.id === id);
                if (idx > -1) mockExpeditions.splice(idx, 1);
                return { success: true };
            },
            update: async (id, data) => {
                const exp = mockExpeditions.find(e => e.id === id);
                if (exp) Object.assign(exp, data);
                return exp;
            }
        },

        // Waypoints
        waypoints: {
            create: async (data) => {
                const id = 'mock-wp-' + Date.now();
                const waypoint = { id, ...data, last_watched_pos: 0, is_charted: 0 };
                if (!mockWaypoints[data.expedition_id]) {
                    mockWaypoints[data.expedition_id] = [];
                }
                mockWaypoints[data.expedition_id].push(waypoint);
                return waypoint;
            },
            getAll: async (expeditionId) => mockWaypoints[expeditionId] || [],
            get: async (id) => {
                for (const wps of Object.values(mockWaypoints)) {
                    const wp = wps.find(w => w.id === id);
                    if (wp) return wp;
                }
                return null;
            },
            updateProgress: async (id, position) => {
                for (const wps of Object.values(mockWaypoints)) {
                    const wp = wps.find(w => w.id === id);
                    if (wp) wp.last_watched_pos = position;
                }
                return { success: true };
            },
            markCharted: async (id) => {
                for (const wps of Object.values(mockWaypoints)) {
                    const wp = wps.find(w => w.id === id);
                    if (wp) wp.is_charted = 1;
                }
                return { success: true };
            },
            updateTranscript: async () => ({ success: true })
        },

        // Field Guides
        fieldGuides: {
            create: async (data) => ({ id: 'mock-fg-' + Date.now(), ...data }),
            get: async (waypointId) => {
                if (waypointId === 'mock-wp-1') return mockFieldGuide;
                return null;
            },
            update: async (waypointId, data) => ({ ...mockFieldGuide, ...data })
        },

        // Tags
        tags: {
            create: async (name) => ({ id: 'mock-tag-' + Date.now(), name }),
            getAll: async () => [
                { id: 'tag-1', name: 'Python' },
                { id: 'tag-2', name: 'Programming' },
                { id: 'tag-3', name: 'Beginner' }
            ],
            addToWaypoint: async () => ({ success: true }),
            getForWaypoint: async () => [
                { id: 'tag-1', name: 'Python' },
                { id: 'tag-2', name: 'Programming' }
            ]
        },

        // Quiz Attempts
        quizAttempts: {
            create: async (data) => ({ id: 'mock-qa-' + Date.now(), ...data }),
            getAll: async () => []
        },

        // AI Services
        ai: {
            fetchTranscript: async (videoId) => {
                console.log('[Mock] Fetching transcript for:', videoId);
                // Simulate delay
                await new Promise(r => setTimeout(r, 1000));
                return { success: true, transcript: mockTranscript };
            },
            generateFieldGuide: async (transcript, title) => {
                console.log('[Mock] Generating field guide for:', title);
                await new Promise(r => setTimeout(r, 2000));
                return {
                    success: true,
                    data: {
                        executive_summary: mockFieldGuide.executive_summary,
                        markdown_content: mockFieldGuide.markdown_content,
                        key_concepts: [
                            { title: 'Python Basics', explanation: 'Core language features', tags: ['python', 'basics'] }
                        ],
                        code_examples: [
                            { language: 'python', code: 'print("Hello")', explanation: 'Basic output' }
                        ],
                        key_takeaways: ['Easy to learn', 'Versatile', 'Great community'],
                        quizzes: JSON.parse(mockFieldGuide.quiz_data_json)
                    }
                };
            },
            generateQuizzes: async () => {
                await new Promise(r => setTimeout(r, 1000));
                return {
                    success: true,
                    data: { quizzes: JSON.parse(mockFieldGuide.quiz_data_json) }
                };
            },
            validateApiKey: async (key) => {
                return { valid: key && key.length > 10 };
            },
            chat: async (message) => {
                await new Promise(r => setTimeout(r, 500));
                return {
                    success: true,
                    response: `[Mock AI Response] You asked: "${message}". This is a simulated response for browser testing.`
                };
            }
        }
    };

    console.log('[MockElectron] Mock API ready. Sample data loaded.');
}
