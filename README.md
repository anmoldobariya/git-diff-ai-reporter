# AI Git Reporter

A VS Code extension that analyzes your Git changes using AI and generates human-readable work summaries. Get a practical, conversational report of what you changed and why—without code review critique.

## Features

### 🤖 Human-Focused AI Analysis

- **Conversational Tone**: Reports read like a developer's status update, not an AI code review
- **What & Why**: Explains what changed and the reasoning behind it
- **Customizable Templates**: Edit the template to match your team's communication style
- **Per-File Breakdown**: Clear summary of changes organized by file

### 📊 Token Usage Monitoring

- **Monthly Quota Tracking**: Monitor your Groq API token usage similar to GitHub Copilot
- **Visual Usage Bar**: See your consumption at a glance with percentage and progress bar
- **Automatic Monthly Reset**: Usage automatically resets each month
- **Configurable Limits**: Set your own monthly quota (default: 300,000 tokens)

### 🔐 Secure API Key Management

- **Secret Storage**: API keys stored securely using VS Code's secret storage API
- **In-Sidebar Management**: Add, update, or remove your Groq API key directly from the sidebar
- **Masked Display**: Keys shown partially masked for security
- **No Plain-Text Config**: Keys never stored in settings.json

### 📜 History & Organization

- **Report History**: All analyses automatically saved to `~/.vscode-ai-git-reporter/history/`
- **Quick Access**: Browse and load past reports from the sidebar
- **Searchable**: Find previous analyses by date and file count
- **One-Click Delete**: Clean up history entries you no longer need

### 💬 Modern Chat Interface

- **Sidebar View**: Persistent chat-style interface in VS Code sidebar
- **Message Bubbles**: Clean, animated message display
- **Copy to Clipboard**: One-click copy for sharing reports
- **Markdown Rendering**: Formatted code blocks, headers, and emphasis

## Getting Started

### 1. Install the Extension

Search for "AI Git Reporter" in the VS Code Extensions marketplace and install it.

### 2. Get a Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Generate a new API key
4. Copy the key

### 3. Configure the Extension

1. Open the AI Git Reporter sidebar (click the Git commit icon in the Activity Bar)
2. Paste your API key in the "API Key Settings" section
3. Click **Save API Key**

### 4. Analyze Your Changes

1. Make changes to your code and stage them with Git
2. Click the **Analyze** button (🔍) in the sidebar title bar
3. Wait for the AI to analyze your diff
4. View the report in the chat interface

## Usage

### Commands

- **AI Git Reporter: Analyze Current Diff** - Analyze staged/uncommitted changes
- **AI Git Reporter: Edit Template** - Customize the report format
- **AI Git Reporter: View History** - Browse past analyses
- **Refresh History** - Reload the history list
- **Delete History Item** - Remove a saved report

### Sidebar Sections

#### Token Usage

```
Used: 41% ██████████░░░░░░░░░
122,394 / 300,000 tokens
Prompt: 45,231 | Completion: 77,163
Resets: Dec 1, 2024
```

Monitor your monthly Groq API usage with real-time updates.

#### API Key Settings

Securely manage your Groq API key:

- Add or update your key
- View masked key (e.g., `gsk_abc1...xyz9`)
- Delete key from secure storage

#### Recent Reports

Quick access to your last 5 analyses:

- Click **Open** to view a report
- Click **Delete** to remove an entry

## Configuration

### Settings

**`aiGitReporter.quotaLimit`**

- Type: `number`
- Default: `300000`
- Description: Monthly token usage limit

### Template Customization

Edit your report template:

1. Run command: `AI Git Reporter: Edit Template`
2. Modify `~/.vscode-ai-git-reporter/template.md`
3. Save changes—the next analysis will use your template

**Example Template:**

```markdown
### What I Changed

{changes}

### Why

{reasoning}

### Files Modified

{files}
```

The AI will follow your template's tone and structure exactly.

## How It Works

1. **Collect Diffs**: Extension reads your staged/uncommitted Git changes
2. **Apply Template**: Your custom template (or default) is loaded
3. **AI Analysis**: Groq's `llama-3.3-70b-versatile` model analyzes the diff
4. **Track Usage**: Token consumption is recorded and displayed
5. **Save Report**: Analysis is saved to history for future reference
6. **Display Results**: Report appears in the chat interface

## Privacy & Security

- **API Keys**: Stored in VS Code's secure Secret Storage, never in plain text
- **Local History**: Reports saved locally to `~/.vscode-ai-git-reporter/`
- **No Telemetry**: Extension does not collect or transmit user data
- **Open Source**: Full source code available for review

## Requirements

- **VS Code**: Version 1.106.0 or higher
- **Git**: Git repository with changes
- **Groq API Key**: Free tier available at [console.groq.com](https://console.groq.com)

## Known Limitations

- Only analyzes staged/uncommitted changes (not committed history)
- Requires internet connection for AI analysis
- Token usage depends on diff size (large diffs = more tokens)
- Monthly quota resets are local (not synced with Groq's billing)

## Development

### Setup

```bash
npm install
npm run compile
```

### Run Extension

Press `F5` to launch Extension Development Host

### Watch Mode

```bash
npm run watch
```

### File Structure

```
src/
├── extension.ts           # Main activation point
├── sidebarView.ts         # Sidebar webview UI
├── diffCollector.ts       # Git diff collection
├── llm.ts                 # Groq API client
├── templateManager.ts     # Template loading/saving
├── historyManager.ts      # Report history storage
├── usageManager.ts        # Token usage tracking
├── apiKeyManager.ts       # Secure API key storage
└── types.ts              # TypeScript interfaces
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description

## License

MIT License - see LICENSE file for details

## Credits

- Powered by [Groq](https://groq.com) and the `llama-3.3-70b-versatile` model
- Built with the [VS Code Extension API](https://code.visualstudio.com/api)

## Support

- **Issues**: [GitHub Issues](https://github.com/your-username/git-diff-ai-reporter/issues)
- **Documentation**: This README and inline code comments
- **Groq API**: [Groq Documentation](https://console.groq.com/docs)

---

**Made with ❤️ for developers who want practical AI assistance, not critique.**
