# Testing & Verification
For all UI testing, visual verification, and end-to-end testing, use the `agent-browser` tool.

## Common Commands:
- `agent-browser open http://localhost:3000` (Open the app)
- `agent-browser snapshot` (See the page structure - very token efficient!)
- `agent-browser screenshot` (See the actual visuals)
- `agent-browser click @e1` (Click elements based on tags)
# UI Verification Rules
When I ask you to verify a design, use the `agent-browser` CLI.
1. Run `agent-browser open http://localhost:3000` to start.
2. Use `agent-browser snapshot` to inspect the UI efficiently.