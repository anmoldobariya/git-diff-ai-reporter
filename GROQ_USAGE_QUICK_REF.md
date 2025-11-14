# Quick Reference: Groq Usage Monitoring

## 🚀 How to Use

### View Usage Monitor

1. Open VS Code
2. Click "AI Git Reporter" icon in Activity Bar
3. Find "Groq Usage Monitor" section at top

### What You'll See

```
┌──────────────────────────────────┐
│ Groq Usage Monitor               │
│ llama-3.3-70b-versatile          │
├──────────────────────────────────┤
│ Tokens (Minute)                  │
│ ██████████░░░░░░░░░░ 68%        │
│ 8,200 / 12,000                   │
├──────────────────────────────────┤
│ Requests (Minute)                │
│ ██░░░░░░░░░░░░░░░░░░ 10%        │
│ 3 / 30                           │
├──────────────────────────────────┤
│ Tokens (Day)                     │
│ ████████░░░░░░░░░░░░ 40%        │
│ 40,200 / 100,000                 │
├──────────────────────────────────┤
│ Requests (Day)                   │
│ ░░░░░░░░░░░░░░░░░░░░ 1%         │
│ 12 / 1,000                       │
├──────────────────────────────────┤
│ API Key: gsk_abc1...xyz9         │
│ [Change API Key]                 │
└──────────────────────────────────┘
```

## 📊 Understanding the Metrics

### Tokens (Minute)

- **What**: Token usage in the last 60 seconds
- **Limit**: Varies by model (6,000-20,000)
- **Resets**: Every 60 seconds
- **Warning**: Yellow at 70%, Red at 90%

### Requests (Minute)

- **What**: Number of API calls in last 60 seconds
- **Limit**: 30 for most models
- **Resets**: Every 60 seconds
- **Warning**: Yellow at 70%, Red at 90%

### Tokens (Day)

- **What**: Total tokens used since midnight
- **Limit**: Varies by model (500,000-1,000,000)
- **Resets**: At midnight (00:00:00)
- **Warning**: Yellow at 70%, Red at 90%

### Requests (Day)

- **What**: Total API calls since midnight
- **Limit**: 14,400 for most models
- **Resets**: At midnight (00:00:00)
- **Warning**: Yellow at 70%, Red at 90%

## ⚠️ What Happens When You Hit a Limit?

### Visual Indicator

```
┌─────────────────────────────────┐
│ ⚠️ You're temporarily rate-     │
│    limited                       │
│ Retrying in 22 seconds...        │
└─────────────────────────────────┘
```

### Behavior

1. **Banner Appears**: Shows countdown timer
2. **Analysis Paused**: System waits for reset
3. **Notification**: Shows wait time in status bar
4. **Auto-Retry**: Continues after countdown
5. **No Data Loss**: Your request is queued

### What To Do

- ✅ **Wait**: System handles it automatically
- ✅ **Check Time**: Note when counters reset
- ✅ **Continue Working**: Extension stays responsive
- ❌ **Don't Retry**: Clicking again won't help

## 🎨 Color Coding

| Color     | Percentage | Meaning           |
| --------- | ---------- | ----------------- |
| 🟦 Blue   | 0-69%      | Normal usage      |
| 🟡 Yellow | 70-89%     | Approaching limit |
| 🔴 Red    | 90-100%    | Near/at limit     |

## 🔑 Changing Your API Key

### Steps

1. Click **"Change API Key"** button
2. Enter your new Groq API key
3. Click **"Save"**
4. System validates key automatically
5. See success message

### Validation

- Tests key with `/models` endpoint
- Shows error if invalid
- Won't save until validated

### Security

- Stored in VS Code Secret Storage
- Never visible in settings.json
- Displayed masked: `gsk_abc1...xyz9`

## 📅 Reset Schedule

| Counter Type | Reset Frequency  | Next Reset     |
| ------------ | ---------------- | -------------- |
| Minute       | Every 60 seconds | 60s after last |
| Daily        | At midnight      | Next 00:00:00  |

### Example Timeline

```
00:00:00 → Daily counters reset to 0
12:34:00 → API call (minute counter starts)
12:35:00 → Minute counter resets
23:59:59 → Last API call of day
00:00:00 → All counters reset to 0
```

## 🔢 Model Limits Reference

| Model                   | TPM    | RPM | TPD     | RPD    |
| ----------------------- | ------ | --- | ------- | ------ |
| llama-3.3-70b-versatile | 6,000  | 30  | 500,000 | 14,400 |
| llama-3.1-8b-instant    | 20,000 | 30  | 1M      | 14,400 |
| llama3-70b-8192         | 6,000  | 30  | 500,000 | 14,400 |
| llama3-8b-8192          | 20,000 | 30  | 1M      | 14,400 |
| mixtral-8x7b-32768      | 5,000  | 30  | 500,000 | 14,400 |
| gemma-7b-it             | 15,000 | 30  | 500,000 | 14,400 |
| gemma2-9b-it            | 15,000 | 30  | 500,000 | 14,400 |

_TPM = Tokens Per Minute, RPM = Requests Per Minute_  
_TPD = Tokens Per Day, RPD = Requests Per Day_

## 💡 Tips & Best Practices

### Optimize Token Usage

- ✅ Use smaller models when possible (8b vs 70b)
- ✅ Keep diffs focused (commit frequently)
- ✅ Edit templates to be concise
- ✅ Monitor daily usage trends

### Avoid Rate Limits

- ✅ Space out analyses (wait 2+ seconds between)
- ✅ Check usage before large diffs
- ✅ Use faster models for quick checks
- ✅ Save complex analyses for off-peak hours

### Monitor Effectively

- ✅ Glance at sidebar before analyzing
- ✅ Watch for yellow/red bars
- ✅ Note patterns in your usage
- ✅ Plan around daily limits

## 🐛 Troubleshooting

### Issue: Bars not updating

- **Cause**: Webview not refreshing
- **Fix**: Close and reopen sidebar

### Issue: Wrong percentage shown

- **Cause**: Model changed but limits not updated
- **Fix**: Reload VS Code window

### Issue: Rate limited immediately

- **Cause**: Previous usage carried over
- **Fix**: Wait for next minute/day reset

### Issue: API key won't save

- **Cause**: Invalid key or network issue
- **Fix**: Verify key at console.groq.com

### Issue: Countdown stuck

- **Cause**: Timer not running
- **Fix**: Reload extension (Ctrl+Shift+P → "Reload Window")

## 🎯 Quick Actions

| Action             | Command                       |
| ------------------ | ----------------------------- |
| Open Usage Monitor | Click Activity Bar icon       |
| Change API Key     | Click "Change API Key" button |
| Force Refresh      | Close/reopen sidebar          |
| Check Limits       | Hover over model badge        |
| Reset Usage        | Wait for scheduled reset      |

## 📞 Support

If issues persist:

1. Check console: Help → Toggle Developer Tools
2. Look for errors in "Console" tab
3. Verify API key at console.groq.com
4. Ensure internet connection active
5. Try reloading VS Code window

---

**Last Updated**: November 14, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
