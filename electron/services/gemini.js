/**
 * Gemini AI Service
 * Handles communication with Google Gemini API for Field Guide generation
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const PRIMARY_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODEL = 'gemini-2.5-flash';
const REQUEST_TIMEOUT_MS = 90000; // 90 seconds

function getModelUrl(model) {
    return `${GEMINI_BASE_URL}/${model}:generateContent`;
}

/**
 * Sanitize user-supplied text before inserting into AI prompts.
 * Strips markdown/code-block chars that could alter prompt structure and limits length.
 */
function sanitizeForPrompt(text) {
    if (!text) return '';
    return text
        .replace(/[\`\*\#\[\]\(\)\{\}\>\|\\]/g, '')
        .substring(0, 200)
        .trim();
}

/**
 * Fetch with timeout support
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs}ms`);
        }
        throw error;
    }
}

/**
 * Fetch with automatic model fallback.
 * Tries the primary model first with a SHORT timeout. If it returns 429/503
 * or times out quickly, automatically retries with the fallback model
 * which gets the full timeout window.
 */
const PRIMARY_TIMEOUT_MS = 20000; // 20 seconds — short leash for preview model

async function fetchWithFallback(apiKey, body, timeoutMs = REQUEST_TIMEOUT_MS) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
    };

    // Try primary model with short timeout
    try {
        const primaryResponse = await fetchWithTimeout(getModelUrl(PRIMARY_MODEL), options, PRIMARY_TIMEOUT_MS);

        if (primaryResponse.ok) {
            return primaryResponse;
        }

        // If overloaded/rate-limited, try fallback with full timeout
        if (primaryResponse.status === 429 || primaryResponse.status === 503) {
            console.log(`[Gemini] ${PRIMARY_MODEL} returned ${primaryResponse.status}, falling back to ${FALLBACK_MODEL}`);
            return await fetchWithTimeout(getModelUrl(FALLBACK_MODEL), options, timeoutMs);
        }

        // Other HTTP errors — return as-is
        return primaryResponse;
    } catch (primaryError) {
        // Timeout or network error — try fallback with full timeout
        console.log(`[Gemini] ${PRIMARY_MODEL} failed (${primaryError.message}), falling back to ${FALLBACK_MODEL}`);
        return await fetchWithTimeout(getModelUrl(FALLBACK_MODEL), options, timeoutMs);
    }
}

/**
 * Attempts to parse JSON, with repair for truncated responses.
 * Gemini sometimes returns incomplete JSON (e.g., when response is cut off).
 * This tries to close any open brackets/braces/strings to salvage the data.
 */
function tryParseJSON(text) {
    // First try direct parse
    try {
        return JSON.parse(text);
    } catch {
        // Attempt to repair truncated JSON
    }

    // Try removing trailing incomplete values and closing brackets
    let repaired = text;

    // Remove trailing comma + whitespace
    repaired = repaired.replace(/,\s*$/, '');

    // Count open brackets/braces and close them
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
    }

    // If we're inside a string, close it
    if (inString) {
        repaired += '"';
    }

    // Remove trailing comma after closing the string
    repaired = repaired.replace(/,\s*$/, '');

    // Close open brackets then braces
    while (openBrackets > 0) { repaired += ']'; openBrackets--; }
    while (openBraces > 0) { repaired += '}'; openBraces--; }

    try {
        return JSON.parse(repaired);
    } catch {
        // Last resort: try to find the last valid JSON object
        throw new SyntaxError('Could not parse or repair AI response JSON');
    }
}

/**
 * Generates a Field Guide from a video transcript using Gemini AI
 * @param {string} apiKey - User's Gemini API key
 * @param {string} transcript - The video transcript text
 * @param {string} videoTitle - The title of the video
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function generateFieldGuide(apiKey, transcript, videoTitle) {
    if (!apiKey) {
        return { success: false, error: 'No API key configured' };
    }

    if (!transcript || transcript.trim().length < 50) {
        return { success: false, error: 'Transcript too short to analyze' };
    }

    const prompt = `You are an expert educational content creator. Analyze the following video transcript and create a comprehensive Field Guide for learning.

**Video Title:** ${sanitizeForPrompt(videoTitle)}

**Transcript:**
${transcript.substring(0, 30000)} ${transcript.length > 30000 ? '... [truncated]' : ''}

**Output Format (JSON only, no markdown code blocks):**
{
  "executive_summary": "2-3 sentence overview of the video content that captures the main teaching points",
  "key_concepts": [
    {
      "title": "Concept Name",
      "explanation": "Clear explanation in 2-3 sentences",
      "tags": ["tag1", "tag2"]
    }
  ],
  "code_examples": [
    {
      "language": "python",
      "code": "example code here",
      "explanation": "What this code demonstrates"
    }
  ],
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "quizzes": [
    {
      "question": "What is the main purpose of X discussed in this video?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ],
  "markdown_content": "A well-formatted markdown summary with headers, bullet points, and key insights. Use ## for section headers."
}

Rules:
- Extract 3-5 key concepts with relevant tags for knowledge graph connections
- Include code examples ONLY if the video discusses programming
- If no code is discussed, return an empty array for code_examples
- Create 2-3 quiz questions that test comprehension of the main concepts
- Quiz options should all be plausible, with exactly one correct answer
- Focus on clarity and actionable learning
- The markdown_content should be a comprehensive study guide
- Return ONLY valid JSON, no additional text`;

    try {
        const response = await fetchWithFallback(apiKey, {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 16384,
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Log full error for debugging
            console.error('[Gemini] API Error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });

            if (response.status === 429) {
                const errorMsg = errorData.error?.message || 'API rate limit exceeded';
                return { success: false, error: `Rate limit: ${errorMsg}` };
            }
            if (response.status === 401 || response.status === 403) {
                return { success: false, error: 'Invalid API key. Please check your Gemini API key in Settings.' };
            }

            return {
                success: false,
                error: errorData.error?.message || `API error: ${response.status}`
            };
        }

        const data = await response.json();

        // Extract the generated text
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return { success: false, error: 'No response generated from AI' };
        }

        // Parse the JSON response (handle potential markdown code blocks)
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();

        const fieldGuideData = tryParseJSON(cleanedText);

        return {
            success: true,
            data: fieldGuideData
        };
    } catch (error) {
        console.error('Gemini API error:', error);

        if (error instanceof SyntaxError) {
            return { success: false, error: 'Failed to parse AI response. Please try again.' };
        }

        return {
            success: false,
            error: error.message || 'Failed to generate Field Guide'
        };
    }
}

/**
 * Generates quiz questions from a video transcript
 * @param {string} apiKey - User's Gemini API key
 * @param {string} transcript - The video transcript text
 * @param {string} videoTitle - The title of the video
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function generateQuizzes(apiKey, transcript, videoTitle) {
    if (!apiKey) {
        return { success: false, error: 'No API key configured' };
    }

    const prompt = `You are an expert educational assessor. Based on the following video transcript, create comprehension quizzes that test understanding at natural break points.

**Video Title:** ${sanitizeForPrompt(videoTitle)}

**Transcript:**
${transcript.substring(0, 30000)} ${transcript.length > 30000 ? '... [truncated]' : ''}

**Output Format (JSON only, no markdown code blocks):**
{
  "quizzes": [
    {
      "timestamp_seconds": 180,
      "question": "What is the purpose of X?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Rules:
- Create 2-3 quizzes per video
- Place quizzes at logical topic transitions (estimate timestamps based on content flow)
- Questions should test comprehension, not memorization
- All options should be plausible
- Return ONLY valid JSON, no additional text`;

    try {
        const response = await fetchWithFallback(apiKey, {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error?.message || `API error: ${response.status}`
            };
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return { success: false, error: 'No response generated from AI' };
        }

        // Parse the JSON response
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```json')) {
            cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith('```')) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();

        const quizData = tryParseJSON(cleanedText);

        return {
            success: true,
            data: quizData
        };
    } catch (error) {
        console.error('Gemini API error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate quizzes'
        };
    }
}

/**
 * Validates a Gemini API key by making a simple test request
 * @param {string} apiKey - The API key to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateApiKey(apiKey) {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: 'API key is empty' };
    }

    try {
        const response = await fetchWithFallback(apiKey, {
            contents: [{
                parts: [{ text: 'Say "OK" to confirm this API key works.' }]
            }],
            generationConfig: {
                maxOutputTokens: 10,
            }
        });

        if (response.ok) {
            return { valid: true };
        }

        if (response.status === 401 || response.status === 403) {
            return { valid: false, error: 'Invalid API key' };
        }

        return { valid: false, error: `API error: ${response.status}` };
    } catch (error) {
        return { valid: false, error: error.message || 'Failed to validate API key' };
    }
}

/**
 * Chat with AI about video content
 * @param {string} apiKey - User's Gemini API key
 * @param {string} message - User's question
 * @param {string} transcript - The video transcript for context
 * @param {string} videoTitle - The title of the video
 * @param {Array} previousMessages - Previous chat messages for context
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
export async function chatWithAI(apiKey, message, transcript, videoTitle, previousMessages = []) {
    if (!apiKey) {
        return { success: false, error: 'No API key configured' };
    }

    // Build conversation history
    const history = previousMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // System context as first message if no history
    const contextPrompt = `You are Atlas AI, an intelligent learning assistant helping a student understand video content. 

**Video Title:** ${sanitizeForPrompt(videoTitle)}

**Video Transcript (for context):**
${transcript ? transcript.substring(0, 8000) : 'No transcript available yet.'}

Instructions:
- Answer questions about the video content clearly and concisely
- If asked about something not in the video, say so
- Be encouraging and helpful
- Use examples when explaining concepts
- Keep responses focused and not too long`;

    const contents = [];

    // Always add context so AI always has transcript context
    contents.push({
        role: 'user',
        parts: [{ text: contextPrompt }]
    });
    contents.push({
        role: 'model',
        parts: [{ text: 'I\'m ready to help you understand this video content. What would you like to know?' }]
    });

    // Add previous messages
    contents.push(...history);

    // Add current user message
    contents.push({
        role: 'user',
        parts: [{ text: message }]
    });

    try {
        const response = await fetchWithFallback(apiKey, {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 429) {
                return { success: false, error: 'Rate limit reached. Please wait a moment.' };
            }

            return {
                success: false,
                error: errorData.error?.message || `API error: ${response.status}`
            };
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return { success: false, error: 'No response generated' };
        }

        return {
            success: true,
            response: generatedText
        };
    } catch (error) {
        console.error('Gemini chat error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get AI response'
        };
    }
}

/**
 * Generates a concise summary for an expedition based on its video titles.
 * @param {string} apiKey - User's Gemini API key
 * @param {string[]} videoTitles - Array of video titles in the expedition
 * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
 */
export async function generateExpeditionSummary(apiKey, videoTitles) {
    if (!apiKey) {
        return { success: false, error: 'No API key configured' };
    }

    if (!videoTitles || videoTitles.length === 0) {
        return { success: false, error: 'No video titles provided' };
    }

    const titlesList = videoTitles
        .filter(Boolean)
        .map(t => `- ${sanitizeForPrompt(t)}`)
        .join('\n');

    if (!titlesList) {
        return { success: false, error: 'Could not extract valid video titles' };
    }

    const prompt = `Write one sentence summarizing this course based on its video titles. The sentence must end with a period and be 10-20 words.

Videos:
${titlesList}

Respond with ONLY the sentence. No quotes, no extra text.`;

    try {
        const response = await fetchWithFallback(apiKey, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error?.message || `API error: ${response.status}`
            };
        }

        const data = await response.json();
        let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
            return { success: false, error: 'No response generated' };
        }

        // Clean up: strip quotes, whitespace, and markdown
        generatedText = generatedText.trim().replace(/^["'`]+|["'`]+$/g, '');

        // If the text doesn't end with proper punctuation, trim to last complete sentence
        if (!/[.!?]$/.test(generatedText)) {
            const lastPeriod = generatedText.lastIndexOf('.');
            if (lastPeriod > 10) {
                generatedText = generatedText.substring(0, lastPeriod + 1);
            } else {
                // No complete sentence found — add a period
                generatedText = generatedText.replace(/[,;:\s]+$/, '') + '.';
            }
        }

        // Take only the first sentence if multiple were generated
        const firstSentence = generatedText.match(/^[^.!?]+[.!?]/);
        if (firstSentence) {
            generatedText = firstSentence[0];
        }

        return { success: true, summary: generatedText };
    } catch (error) {
        console.error('Gemini expedition summary error:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate summary'
        };
    }
}
