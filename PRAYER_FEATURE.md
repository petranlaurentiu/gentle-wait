# Prayer Feature - GentleWait

## Overview

The Prayer feature adds a spiritual dimension to GentleWait, allowing users to take a moment for prayer when they pause before opening a protected app. This feature offers traditional Christian and Catholic prayers that are ecumenical (used across denominations).

## Why Prayer?

- **Universal Practice**: Prayer is practiced by billions worldwide, especially in Christian and Catholic traditions
- **Mindful Pause**: Prayer provides a structured, meaningful way to pause and reflect
- **Spiritual Connection**: Offers users a chance to connect with their faith during digital distractions
- **Diverse Options**: Includes short prayers (10s), traditional prayers (20-30s), and longer meditative prayers (40-45s)

## Features

### Prayer Library

The app includes **21 curated prayers** across 4 categories:

#### 1. Traditional Prayers (9 prayers)
- **The Lord's Prayer** - The prayer Jesus taught (Matthew 6:9-13)
- **Hail Mary** - Traditional Marian prayer
- **Glory Be** - Traditional doxology
- **Angel of God** - Guardian angel prayer
- **Act of Faith** - Profession of faith
- **Act of Hope** - Prayer of hope and trust
- **Act of Love** - Prayer of love for God and neighbor
- **Memorare** - Traditional Marian intercession
- **St. Michael Prayer** - Prayer for protection

#### 2. Short Prayers (4 prayers)
- **The Jesus Prayer** - Ancient Eastern Orthodox prayer
- **Breath Prayer** - Meditative breathing prayer
- **Kyrie Eleison** - "Lord, have mercy"
- **Thanks Be to God** - Brief gratitude

#### 3. Peace & Guidance (5 prayers)
- **Serenity Prayer** - For acceptance and courage
- **Prayer of St. Francis** - For peace and service
- **Psalm 23** - "The Lord is my shepherd"
- **Prayer for Peace** - For calm and rest
- **Prayer for Guidance** - For wise use of time

#### 4. Gratitude Prayers (3 prayers)
- **Prayer of Thanks** - Simple gratitude in the moment
- **Morning Offering** - Offering the day to God
- **Prayer of Presence** - Awareness of God's presence

### Smart Duration Matching

The prayer feature automatically selects prayers that fit within the user's pause duration setting:

- **10 seconds**: Short aspirations (Kyrie, Thanks Be to God)
- **15 seconds**: Breath prayers, simple prayers
- **20 seconds**: Traditional prayers (Glory Be, Hail Mary)
- **30 seconds**: Longer traditional prayers (Lord's Prayer, St. Michael)

### User Experience

1. **From Pause Screen**: Users see "🙏 Take a Moment to Pray" as the primary option
2. **Prayer Display**: 
   - Beautiful liquid glass design with golden glow
   - Prayer text displayed clearly and centered
   - Attribution/source shown (e.g., "Matthew 6:9-13")
   - Category badge (traditional, short, peace, gratitude)
   - Countdown timer
3. **Completion**: 
   - Peaceful completion screen with "Peace Be With You"
   - "Amen" button to complete
   - Option to go back

### Analytics Integration

The prayer feature is fully integrated with the app's statistics:

- **Action Type**: `alternative_prayer`
- **Tracked Metrics**:
  - Number of prayers prayed
  - Time spent in prayer
  - Prayer sessions count
- **Stats Display**: Prayer counts included in:
  - Home screen weekly stats
  - Insights page
  - AI assistant context

## Implementation Details

### Files Created/Modified

#### New Files:
1. **`src/data/prayers.ts`**
   - Prayer data structure and library
   - 21 curated prayers with metadata
   - Helper functions for selecting prayers
   - Duration-based filtering

2. **`app/prayer.tsx`**
   - Prayer screen component
   - Beautiful UI with animated glow
   - Timer and prayer text display
   - Completion flow

#### Modified Files:
1. **`app/pause.tsx`** - Added prayer button as primary option
2. **`src/domain/models/index.ts`** - Added `alternative_prayer` action type and `alternativePrayed` to WeeklyStats
3. **`src/services/stats/index.ts`** - Added prayer stats tracking
4. **`app/home.tsx`** - Include prayer count in calm choices
5. **`app/insights.tsx`** - Include prayer count in stats
6. **`app/assistant.tsx`** - Include prayer count in AI context

### Technical Architecture

```typescript
// Prayer data structure
interface Prayer {
  id: string;
  name: string;
  text: string;
  category: "traditional" | "short" | "gratitude" | "peace";
  durationSec: number;
  icon: string;
  attribution?: string;
}

// Prayer selection logic
getPrayerForDuration(durationSec: number): Prayer
getPrayersByCategory(category: Prayer["category"]): Prayer[]
getPrayerByCategoryForDuration(category, durationSec): Prayer
```

### UI Design

The prayer screen uses the app's liquid glass design system with:
- **Golden glow animation**: Gentle pulsing (3s cycle)
- **Glass card**: For prayer text with blur effect
- **Cross symbol (✝️)**: Central icon with glow
- **Serene color palette**: Gold and white tones for spiritual feel
- **Typography**: Light fonts for readability and reverence

## Religious Considerations

### Ecumenical Approach

The prayers included are:
- ✅ **Traditional**: Used across Christian denominations
- ✅ **Scripture-based**: Grounded in Biblical text
- ✅ **Catholic-friendly**: Includes traditional Catholic prayers
- ✅ **Protestant-compatible**: Includes prayers common to all Christians
- ✅ **Respectful**: Reverent and appropriate
- ✅ **Non-divisive**: Avoids controversial theological positions

### Denominations Covered

- **Catholic**: All traditional Catholic prayers included
- **Protestant**: Lord's Prayer, Psalm 23, Serenity Prayer, etc.
- **Orthodox**: Jesus Prayer, Kyrie Eleison
- **Non-denominational**: Peace prayers, gratitude prayers

### Privacy & Respect

- **No data collection**: Prayers are not logged beyond action tracking
- **Optional feature**: Users can choose other alternatives
- **No religious requirement**: App doesn't require religious belief
- **Cultural sensitivity**: Prayers are presented respectfully

## Future Enhancements

### Possible Additions

1. **More Prayers**
   - Prayers from different Christian traditions
   - Seasonal prayers (Advent, Lent, Easter)
   - Prayers for specific situations (stress, work, family)

2. **Customization**
   - Allow users to add their own prayers
   - Favorite prayers
   - Prayer categories filter

3. **Prayer History**
   - Track which prayers were most helpful
   - Prayer journal integration
   - "Pray again" feature

4. **Audio Prayers**
   - Guided audio prayers
   - Background music/chants
   - Multiple languages

5. **Other Faith Traditions** (if desired)
   - Jewish prayers
   - Muslim prayers (Dua)
   - Buddhist mantras
   - Interfaith prayers

## Usage Statistics

Track the following to understand engagement:

- **Adoption Rate**: % of users who try prayer feature
- **Frequency**: How often users choose prayer vs other alternatives
- **Completion Rate**: % who complete vs skip prayers
- **Time of Day**: When users pray most
- **Preferred Categories**: Which prayer types are most popular

## User Feedback

Potential feedback to collect:

- "Which prayers are most meaningful to you?"
- "Would you like more prayers added?"
- "Should we add prayers from other faith traditions?"
- "How does the prayer feature impact your digital wellbeing?"

## Conclusion

The Prayer feature adds a spiritual dimension to GentleWait that:
- ✅ Respects Christian/Catholic traditions
- ✅ Provides meaningful pause alternatives
- ✅ Integrates seamlessly with existing features
- ✅ Enhances the mindfulness aspect of the app
- ✅ Offers diverse prayer options for different needs

By combining digital wellbeing with spiritual practice, GentleWait becomes more than just a screen time app—it becomes a tool for holistic wellbeing.

---

**Created**: January 19, 2026  
**Version**: 1.0  
**Status**: Ready for Testing ✅
