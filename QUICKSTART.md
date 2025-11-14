# Quick Start Guide - AI Git Reporter

## 🚀 Test the Extension Locally

### 1. Open in VS Code

```bash
cd d:\git-diff-ai-reporter
code .
```

### 2. Press F5

- This launches the Extension Development Host
- A new VS Code window will open with the extension loaded

### 3. Open a Git Repository

- In the Extension Development Host, open any folder with Git changes
- Make some changes to files (or have unstaged/staged changes)

### 4. Open the Sidebar

- Click the Git commit icon (📝) in the Activity Bar on the left
- This opens the "AI Git Reporter" sidebar

### 5. Add Your API Key

In the sidebar, you'll see the "API KEY SETTINGS" section:

```
API Key Settings
────────────────
⚪ Not Configured

[Enter your Groq API key here...]
[Save API Key]

Get a free API key at console.groq.com
```

- Visit https://console.groq.com
- Sign up and create an API key
- Paste it in the input field
- Click "Save API Key"

### 6. Analyze Your Changes

- Click the 🔍 **Analyze** button in the sidebar title bar
- Wait for the analysis (usually 5-10 seconds)
- View the report in the chat interface

### 7. Check Token Usage

After analysis, you'll see:

```
TOKEN USAGE ──────────────
Used: 2% ██░░░░░░░░░░░░░░░░░░
5,234 / 300,000 tokens
Prompt: 2,100 | Completion: 3,134
Resets: Jan 1, 2025
```

## 📋 Test Scenarios

### Scenario 1: First Analysis

1. Make changes to a file
2. Click Analyze
3. Verify:
   - ✓ Chat message appears
   - ✓ Report is generated
   - ✓ Usage bar updates
   - ✓ History entry created

### Scenario 2: View History

1. Click on a history entry in "RECENT REPORTS"
2. Click "Open"
3. Verify report loads in chat

### Scenario 3: Copy Report

1. After analysis, find the copy button (📋 Copy)
2. Click it
3. Paste somewhere to verify content

### Scenario 4: Custom Template

1. Run command: `AI Git Reporter: Edit Template`
2. Modify `~/.vscode-ai-git-reporter/template.md`
3. Save changes
4. Run another analysis
5. Verify new format is used

### Scenario 5: Delete History

1. In "RECENT REPORTS", click a report's Delete button
2. Confirm deletion
3. Verify it's removed from list

### Scenario 6: API Key Management

1. Click "Delete API Key" in API Key Settings
2. Confirm deletion
3. Try to analyze (should show error)
4. Re-add the key
5. Analyze again (should work)

## 🔧 Troubleshooting

### Extension Not Loading?

- Check Debug Console (View > Debug Console)
- Look for activation errors

### No Git Changes Detected?

- Make sure you have unstaged or staged changes
- Run `git status` in terminal to verify

### API Key Not Working?

- Verify key is valid at console.groq.com
- Check it's at least 20 characters
- Try deleting and re-adding

### Usage Bar Not Updating?

- Check `~/.vscode-ai-git-reporter/usage.json` exists
- Verify Groq API returned usage data

### Compilation Errors?

```bash
npm run compile
```

Should complete with no errors.

## 📂 Data Locations

### Template:

```
~/.vscode-ai-git-reporter/template.md
```

### History:

```
~/.vscode-ai-git-reporter/history/
├── report-1234567890.json
├── report-1234567891.json
└── ...
```

### Usage Tracking:

```
~/.vscode-ai-git-reporter/usage.json
```

### API Key:

Stored in VS Code Secret Storage (not a file)

## 🎯 Expected Behavior

### Analysis Report Example:

```markdown
# Work Summary - December 18, 2024

## What Changed

Today I worked on the AI Git Reporter extension:

- Added token usage monitoring
- Implemented secure API key storage
- Created a unified sidebar view

## Files Modified

### src/usageManager.ts

Created a new manager to track monthly token usage...

### src/apiKeyManager.ts

Implemented secure API key storage using VS Code secrets...

## Commit Message

feat: add token usage tracking and secure API key management

- Track Groq API token usage with monthly reset
- Store API keys securely in VS Code Secret Storage
- Display usage bar in sidebar
- Add API key management UI
```

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Sidebar loads with all three sections
- ✅ API key can be saved and retrieved
- ✅ Analysis generates a report
- ✅ Usage bar shows percentage
- ✅ History entries appear after analysis
- ✅ Copy button works
- ✅ No compilation errors

## 📞 Need Help?

Check the Debug Console for errors:

1. View > Debug Console
2. Look for red error messages
3. Check extension activation logs

---

**Happy Testing! 🚀**
