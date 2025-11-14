# Groq Usage Monitoring System - Complete Documentation

## 🎯 Overview

The Groq Usage Monitoring System provides GitHub Copilot-style real-time tracking of API usage with automatic rate limiting, cooldown management, and an intuitive sidebar UI.

## 📋 Features

### ✅ Real-Time Usage Tracking

- **Minute-Level Monitoring**: Tracks tokens and requests per minute
- **Daily Monitoring**: Tracks cumulative daily usage
- **Automatic Resets**: Auto-resets counters every minute and at midnight
- **Multi-Model Support**: Different limits for each Groq model

### ✅ Rate Limit Enforcement

- **Automatic Detection**: Detects when limits are reached
- **Smart Cooldown**: Waits until counters reset before retrying
- **Non-Blocking**: Extension remains responsive during waits
- **Visual Feedback**: Clear banners and countdown timers

### ✅ Modern UI

- **Animated Progress Bars**: Smooth fill animations with color gradients
- **Warning Colors**: Yellow at 70%, red at 90%
- **Real-Time Updates**: Refreshes every 2 seconds
- **Theme-Aware**: Adapts to VS Code light/dark themes

### ✅ Integrated API Key Management

- **In-Sidebar Configuration**: Change API keys without leaving the view
- **Validation**: Tests keys before saving
- **Masked Display**: Shows only partial key for security

## 📁 File Structure

```
src/
├── limits.ts                    # Model limits and rate limit logic
├── groqUsageManager.ts          # Usage tracking and enforcement
├── groqUsageViewProvider.ts     # Sidebar UI webview provider
└── extension.ts                 # Integration into main extension
```

## 🔧 Implementation Details

### 1. `limits.ts`

Defines rate limits for all Groq models:

```typescript
export const MODEL_LIMITS = {
  "llama-3.3-70b-versatile": {
    rpm: 30, // Requests per minute
    rpd: 14400, // Requests per day
    tpm: 6000, // Tokens per minute
    tpd: 500000 // Tokens per day
  }
  // ... other models
};
```

**Key Functions:**

- `getLimitsForModel(model)` - Retrieves limits for a specific model
- `isRateLimited(usage, limits)` - Checks if any limit is exceeded
- `getSecondsUntilReset(minuteReset, dayReset)` - Calculates wait time

### 2. `groqUsageManager.ts`

Core usage tracking with global state persistence:

**State Structure:**

```typescript
interface GroqUsageState {
  model: string;
  tokensUsedThisMinute: number;
  tokensUsedToday: number;
  requestsUsedThisMinute: number;
  requestsUsedToday: number;
  minuteResetAt: number; // Unix timestamp
  dayResetAt: number; // Unix timestamp (midnight)
}
```

**Key Methods:**

- `recordUsage(promptTokens, completionTokens, totalTokens)` - Records API call
- `enforceLimitsAndWaitIfNeeded()` - Blocks if rate limited, waits for reset
- `isCurrentlyRateLimited()` - Checks current status
- `getSecondsUntilNextReset()` - Returns countdown time

**Auto-Reset Logic:**

- Checks every 5 seconds if counters need resetting
- Minute counters reset exactly 60 seconds after last reset
- Daily counters reset at midnight (00:00:00)

### 3. `groqUsageViewProvider.ts`

WebviewView provider for the sidebar UI:

**Features:**

- Auto-refresh every 2 seconds
- Animated progress bars with color coding
- API key change interface
- Rate limit warning banner with countdown

**Message Handlers:**

- `changeApiKey` - Show input field
- `saveApiKey` - Validate and save new key
- `cancelApiKeyChange` - Hide input field

**UI Components:**

```html
<!-- Cooldown Banner (shown when rate limited) -->
<div class="banner">
  ⚠️ You're temporarily rate-limited Retrying in 22 seconds...
</div>

<!-- Usage Metrics -->
<div class="metric">
  <div class="metric-label">Tokens (Minute)</div>
  <div class="bar-container">
    <div class="bar-fill" style="width: 68%"></div>
  </div>
  <div class="metric-value">8,200 / 12,000 (68%)</div>
</div>
```

### 4. Integration in `extension.ts`

The analyze command now includes rate limiting:

```typescript
// Before API call
await groqUsageManager.enforceLimitsAndWaitIfNeeded();

// After API call
await groqUsageManager.recordUsage(promptTokens, completionTokens, totalTokens);
```

## 🎨 UI Design

### Progress Bar Colors

- **0-69%**: Blue gradient (normal)
- **70-89%**: Orange gradient (warning)
- **90-100%**: Red gradient (danger)

### Layout Sections

1. **Cooldown Banner** (conditional)
2. **Model Badge** (current model)
3. **Minute Usage** (2 metrics)
4. **Divider**
5. **Daily Usage** (2 metrics)
6. **API Key Section**

## 🔄 Usage Flow

### Normal Analysis Flow

```
1. User clicks "Analyze" button
2. Check API key exists
3. Check rate limits
   ├─ If OK → Continue
   └─ If limited → Wait and show countdown
4. Collect Git diffs
5. Call Groq API
6. Record usage (tokens + request count)
7. Update sidebar UI
8. Display report
```

### Rate Limit Hit Flow

```
1. API call attempted
2. isRateLimited() returns true
3. Calculate wait time (seconds until reset)
4. Show notification: "Rate limit reached. Waiting X seconds..."
5. Wait for timeout
6. Reset counters
7. Retry operation
```

## 📊 Usage Tracking Example

**Scenario:** User analyzes a diff

**Before:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "tokensUsedThisMinute": 0,
  "tokensUsedToday": 45000,
  "requestsUsedThisMinute": 0,
  "requestsUsedToday": 15,
  "minuteResetAt": 1700000000000,
  "dayResetAt": 1700006400000
}
```

**API Response:**

- `prompt_tokens`: 2100
- `completion_tokens`: 3400
- `total_tokens`: 5500

**After:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "tokensUsedThisMinute": 5500,
  "tokensUsedToday": 50500,
  "requestsUsedThisMinute": 1,
  "requestsUsedToday": 16,
  "minuteResetAt": 1700000000000,
  "dayResetAt": 1700006400000
}
```

**UI Display:**

```
Tokens (Minute): 5,500 / 6,000 (92%) ⚠️ RED BAR
Requests (Minute): 1 / 30 (3%) 🟦 BLUE BAR
Tokens (Day): 50,500 / 500,000 (10%) 🟦 BLUE BAR
Requests (Day): 16 / 14,400 (0%) 🟦 BLUE BAR
```

## 🚀 Testing

### Test Scenario 1: First Use

1. Open extension
2. View "Groq Usage Monitor" sidebar
3. Verify all counters are at 0%
4. Verify model badge shows default model

### Test Scenario 2: Normal Analysis

1. Click "Analyze" button
2. Wait for completion
3. Verify usage bars update
4. Verify counters increment correctly

### Test Scenario 3: Rate Limit Hit

1. Make multiple rapid API calls
2. When limit reached:
   - ⚠️ Banner appears
   - Countdown timer shows
   - "Analyze" button disabled (if implemented)
3. Wait for countdown
4. Verify counters reset
5. Verify can analyze again

### Test Scenario 4: API Key Change

1. Click "Change API Key" button
2. Enter new key
3. Click "Save"
4. Verify validation request is sent
5. Verify success message
6. Verify masked key updates

### Test Scenario 5: Minute Reset

1. Note current minute counters
2. Wait 60 seconds
3. Verify minute counters reset to 0
4. Verify daily counters unchanged

### Test Scenario 6: Daily Reset

1. Set system time to 23:59
2. Wait for midnight
3. Verify all daily counters reset to 0
4. Verify minute counters unaffected

## 🔐 Security

### API Key Storage

- Keys stored in VS Code Secret Storage (not globalState)
- Never exposed in logs or error messages
- Masked in UI display

### Rate Limit Data

- Stored in `context.globalState` (local only)
- No external transmission
- Resets on extension reload

## 📈 Performance

### Memory Usage

- Minimal: ~5KB for usage state
- No large data structures

### CPU Usage

- Timer checks every 5 seconds (negligible)
- UI refresh every 2 seconds (only when visible)

### Network Usage

- No additional API calls for monitoring
- Only validation request when changing key

## 🐛 Troubleshooting

### Issue: Usage not updating

**Fix:** Check that Groq API returns `usage` object in response

### Issue: Counters not resetting

**Fix:** Verify timer is running (check console logs)

### Issue: Incorrect limits shown

**Fix:** Verify model name matches exactly in `MODEL_LIMITS`

### Issue: Rate limit triggered incorrectly

**Fix:** Check system clock is accurate (affects midnight reset)

## 🎯 Future Enhancements

Potential improvements:

- [ ] Historical usage charts
- [ ] Export usage data to CSV
- [ ] Custom limit warnings (e.g., alert at 80%)
- [ ] Multi-account support
- [ ] Usage forecasting based on patterns
- [ ] Per-project usage tracking

## 📝 Configuration

No additional configuration required. The system uses:

- Default model: `llama-3.3-70b-versatile`
- Limits defined in `limits.ts`
- Storage: `context.globalState`

## ✅ Success Criteria

System is working correctly when:

- ✅ Usage bars display and animate
- ✅ Percentages calculate correctly
- ✅ Colors change at thresholds (70%, 90%)
- ✅ Counters reset on schedule
- ✅ Rate limiting prevents over-usage
- ✅ API key changes work
- ✅ UI updates in real-time

---

**Implementation Status: ✅ COMPLETE**

All components implemented, tested, and integrated into the extension.
