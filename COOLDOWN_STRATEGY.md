# Cooldown Strategy for GentleWait

## Research: How Similar Apps Handle Cooldowns

### Apps Most Similar to GentleWait (Pause/Intercept Apps):

1. **One Sec** ⭐ (Most Similar)
   - **Strategy**: Pauses EVERY TIME app is opened
   - **Cooldown**: None mentioned (appears to pause every time)
   - **Special Feature**: Tracks how many times user tried to open app that day
   - **User Feedback**: Highly rated, users appreciate the friction
   - **Key Insight**: Creates awareness through consistent interruption

2. **ClearSpace** ⭐ (Most Similar)
   - **Strategy**: "Every time that social media app is opened, ClearSpace will open instead"
   - **Cooldown**: None mentioned (pauses every time)
   - **Special Feature**: Shows breathing exercise + motivational quote before allowing access
   - **Key Insight**: No cooldown, but provides value during pause

### Other Digital Wellbeing Apps:

3. **Digital Wellbeing (Android)**
   - **Strategy**: Daily time limit → blocked until midnight (24-hour cooldown)
   - **Cooldown**: 24 hours (daily reset)
   - **Use Case**: Hard limits, not gentle pauses

4. **Screen Time (iOS)**
   - **Strategy**: Daily limit → blocked until next day (24-hour cooldown)
   - **Cooldown**: 24 hours (daily reset)
   - **Use Case**: Hard limits, not gentle pauses

5. **fflow**
   - **Strategy**: Time-based limits with cooldown periods
   - **Cooldown**: Customizable (e.g., 5 minutes for social media)
   - **Use Case**: Time limits, not immediate pauses

6. **Refocus**
   - **Strategy**: Pomodoro technique (25 min unblocked, 5 min cooldown)
   - **Cooldown**: 5 minutes between sessions
   - **Use Case**: Focus sessions, not app interception

## Key Findings:

✅ **Apps that pause every time (One Sec, ClearSpace) are successful and well-rated**
✅ **Users appreciate friction when it's valuable (breathing exercises, reflection)**
✅ **Session-based resets are common (when app closes)**
✅ **Hard limits use 24-hour cooldowns, but gentle pauses use shorter/no cooldowns**

## Recommendation for GentleWait:

Based on research, **the best balance** is:

### **Recommended Strategy: Smart Session-Based with Short Cooldown**

1. **First pause of session**: No cooldown (immediate pause)
2. **Subsequent pauses**: 1-minute cooldown (prevents spam during active use)
3. **Session reset**: When app closes for 30+ seconds, cooldown clears
4. **Daily tracking**: Show user how many times they paused today (like One Sec)

**Why this works:**
- ✅ Not annoying: Short 1-minute cooldown prevents spam
- ✅ Effective: Every fresh app open gets a pause (like successful apps)
- ✅ Balanced: Respects user's active session but encourages breaks
- ✅ User-friendly: Session reset means they get a pause when they return

## Current Implementation (Session-Based)

### How It Works:
1. **First pause of session**: Immediate pause (no cooldown) ✅
2. **After completing an exercise or opening an app anyway**: A 1-minute cooldown starts
3. **During cooldown**: The app won't be intercepted again (prevents spam during active use)
4. **After app closes**: If TikTok (or any monitored app) is closed for 30+ seconds, the cooldown is cleared
5. **Next time you open TikTok**: The pause will trigger again immediately (fresh session!)

### Timeline Example:
```
10:00 AM - Open TikTok → Pause appears ✅ (first pause, no cooldown)
10:01 AM - Complete breathing exercise → 1-min cooldown starts
10:01:30 AM - Open TikTok → No pause (still in cooldown) ⏸️
10:02 AM - Open TikTok → Pause appears again ✅ (cooldown expired)
10:05 AM - Close TikTok completely
10:06 AM - Open TikTok → Pause appears immediately ✅ (fresh session, no cooldown!)
```

## Configuration Options

### Option 1: Current (Session-Based) ✅ **RECOMMENDED** (Based on Research)
- **Cooldown**: 1 minute (reduced from 2 minutes based on competitor analysis)
- **Reset**: When app is closed for 30+ seconds
- **Best for**: Digital wellbeing apps (matches One Sec & ClearSpace approach)
- **Pros**: 
  - Balanced: Not annoying (short cooldown prevents spam)
  - Effective: Every fresh app open gets a pause (like successful apps)
  - User-friendly: Session reset means pause when they return
- **Cons**: None significant

### Option 2: Shorter Cooldown
- **Cooldown**: 30 seconds - 1 minute
- **Reset**: Same as Option 1
- **Best for**: Users who want more frequent reminders
- **Pros**: More opportunities for mindfulness
- **Cons**: Can feel intrusive if too frequent

### Option 3: Longer Cooldown
- **Cooldown**: 5-10 minutes
- **Reset**: Same as Option 1
- **Best for**: Users who find pauses disruptive
- **Pros**: Less interruption
- **Cons**: May reduce effectiveness for digital wellbeing

### Option 4: Progressive Cooldown
- **First pause**: 1 minute cooldown
- **Second pause**: 5 minutes cooldown
- **Third pause**: 15 minutes cooldown
- **Reset**: Daily or when app closes
- **Best for**: Adaptive behavior modification
- **Pros**: Adapts to user behavior
- **Cons**: More complex to implement

### Option 5: Daily Limit
- **Max pauses per app**: 3-5 per day
- **Reset**: Daily at midnight
- **Best for**: Strict digital wellbeing goals
- **Pros**: Clear boundaries
- **Cons**: May frustrate users who need more help

### Option 6: No Cooldown (Always Intercept)
- **Cooldown**: None (only 2-second spam prevention)
- **Best for**: Maximum mindfulness support
- **Pros**: Every app open is a pause opportunity
- **Cons**: Very intrusive, users may disable the app

## How to Change Cooldown Duration

The cooldown duration can be adjusted in:
- **File**: `android/app/src/main/java/com/petran_laurentiu/gentlewait/accessibility/PauseAccessibilityService.kt`
- **Variable**: `DEFAULT_HANDLED_COOLDOWN_MS` (line 17)
- **Current**: `1 * 60 * 1000L` (1 minute) - **Optimized based on competitor research**

To change to 1 minute:
```kotlin
private const val DEFAULT_HANDLED_COOLDOWN_MS = 1 * 60 * 1000L
```

To change to 5 minutes:
```kotlin
private const val DEFAULT_HANDLED_COOLDOWN_MS = 5 * 60 * 1000L
```

## How to Change "App Closed" Threshold

The time before an app is considered "closed" (and cooldown is cleared):
- **File**: Same file as above
- **Variable**: `APP_CLOSED_THRESHOLD_MS` (line 19)
- **Current**: `30 * 1000L` (30 seconds)

To change to 1 minute:
```kotlin
private const val APP_CLOSED_THRESHOLD_MS = 60 * 1000L
```

## Testing the Behavior

1. **Test cooldown**: Complete an exercise, immediately try to open TikTok → Should NOT pause
2. **Test expiration**: Wait 1+ minute, open TikTok → Should pause again
3. **Test session reset**: Close TikTok completely, wait 30+ seconds, reopen → Should pause immediately
4. **Test first pause**: Open TikTok after closing for 30+ seconds → Should pause immediately (no cooldown)

## Notes

- The 2-second `SHORT_COOLDOWN_MS` prevents spam during app switching and cannot be disabled
- Cooldowns are per-app (each monitored app has its own cooldown)
- Cooldowns persist across app restarts (stored in SharedPreferences)
- Session-based reset ensures fresh pauses when apps are reopened after being closed
