# 🚀 GentleWait - Product Roadmap & TODO

**Last Updated**: January 2026  
**Status**: MVP Complete (Android) | iOS & Monetization Pending

---

## 📋 Table of Contents

1. [Core Features](#core-features)
2. [iOS Implementation](#ios-implementation)
3. [Exercise Content & Media](#exercise-content--media)
4. [Authentication & User Accounts](#authentication--user-accounts)
5. [Database & Backend](#database--backend)
6. [Payment & Subscription](#payment--subscription)
7. [Free vs Premium Features](#free-vs-premium-features)
8. [Pricing Strategy](#pricing-strategy)
9. [Additional Features](#additional-features)
10. [Technical Improvements](#technical-improvements)
11. [Marketing & Growth](#marketing--growth)

---

## 🎯 Core Features

### High Priority

- [ ] **Real App Detection** (Android)

  - Replace mock apps with actual PackageManager query
  - Filter system apps
  - Cache installed apps list
  - Handle app uninstall/install events

- [ ] **Deep Linking & Native Integration**

  - Configure deep linking for pause screen (`gentlewait://pause`)
  - Handle pending interceptions on app startup
  - Route to `/pause` when accessibility service detects app launch
  - Handle app state transitions (background/foreground)

- [ ] **Enhanced Statistics**

  - Weekly/monthly/yearly reports
  - Export stats as CSV/PDF
  - Share progress screenshots
  - Comparison with previous periods
  - Streak tracking (consecutive days with pauses)

- [ ] **Customization**

  - Custom pause durations (user-defined seconds)
  - Custom breathing patterns (4-7-8, box breathing, etc.)
  - Custom background colors/themes
  - Custom app icons
  - Multiple pause profiles (work mode, evening mode, etc.)

- [ ] **Notifications & Reminders**

  - Daily check-in reminders
  - Weekly progress summary
  - Streak reminders
  - Motivational quotes/push notifications
  - Smart reminders based on usage patterns

- [ ] **Exercise Content & Media** (High Priority)
  - Replace emoji placeholders with real images/animations
  - Integrate exercise API for images and instructions
  - Add animated demonstrations for exercises
  - Support for user-generated content (optional)
  - Optimize media delivery (caching, compression)

### Medium Priority

- [ ] **Journaling & Reflection**

  - Daily reflection prompts
  - Mood tracking
  - Gratitude journal
  - Export journal entries
  - Search/filter journal entries

- [ ] **Social Features** (Optional)

  - Share achievements (anonymized)
  - Community challenges
  - Friend comparisons (privacy-first)
  - Support groups

- [ ] **Advanced Analytics**

  - Time-of-day patterns
  - Day-of-week patterns
  - App-specific insights
  - Trigger analysis (emotions, situations)
  - Predictive insights

- [ ] **Accessibility**
  - Screen reader support
  - High contrast mode
  - Larger text options
  - Reduce motion option
  - Voice commands

### Low Priority

- [ ] **Widgets** (Android/iOS)

  - Today's pause count widget
  - Weekly stats widget
  - Quick pause button widget

- [ ] **Watch App** (Apple Watch/Wear OS)

  - Quick pause from watch
  - Stats on watch face
  - Haptic reminders

- [ ] **Desktop App** (Electron/Web)
  - Browser extension
  - Desktop app for Windows/Mac
  - Website blocker integration

---

## 📱 iOS Implementation

### iOS-Specific Challenges

iOS has stricter app interception limitations compared to Android. Here are the approaches:

### Option 1: Screen Time API + Focus Mode (Recommended)

**Pros:**

- ✅ Native iOS integration
- ✅ Works with Focus modes
- ✅ Family-friendly (can be used for kids)
- ✅ No accessibility permissions needed

**Cons:**

- ❌ Requires iOS 15+ (DeviceActivity framework)
- ❌ More complex setup
- ❌ Limited customization

**Implementation:**

- [ ] Use `FamilyControls` framework
- [ ] Implement `DeviceActivity` monitoring
- [ ] Create `DeviceActivitySchedule` for app blocking
- [ ] Show pause screen when app is blocked
- [ ] Integrate with Focus modes

**Resources:**

- [Apple DeviceActivity Documentation](https://developer.apple.com/documentation/deviceactivity)
- [FamilyControls Framework](https://developer.apple.com/documentation/familycontrols)

### Option 2: Shortcuts App Integration

**Pros:**

- ✅ Works on all iOS versions
- ✅ User-controlled
- ✅ Can trigger custom actions

**Cons:**

- ❌ Requires user setup
- ❌ Not automatic
- ❌ Limited to specific apps

**Implementation:**

- [ ] Create Shortcuts actions
- [ ] Guide users through setup
- [ ] Provide pre-made shortcuts

### Option 3: Safari Content Blockers (Web Only)

**Pros:**

- ✅ Works for web browsing
- ✅ No app needed

**Cons:**

- ❌ Only works in Safari
- ❌ Limited to websites

### iOS Implementation Checklist

- [ ] Research and choose approach (recommend Option 1)
- [ ] Set up iOS project structure
- [ ] Implement DeviceActivity framework
- [ ] Create pause screen for iOS
- [ ] Handle iOS-specific permissions
- [ ] Test on physical iOS devices
- [ ] Submit to App Store
- [ ] Handle iOS-specific UI/UX differences

**Estimated Timeline**: 4-6 weeks

---

## 🏃 Exercise Content & Media

### Current State

- ✅ Exercise library with 4 categories (desk-stretch, standing, energy, eye-posture)
- ✅ Text-based instructions
- ✅ Emoji placeholders for images
- ❌ No visual demonstrations
- ❌ No animations

### Why Add Visual Content?

- **Better User Experience**: Users can see proper form and positioning
- **Reduced Injury Risk**: Visual guides prevent incorrect form
- **Higher Engagement**: Visual content is more engaging than text
- **Accessibility**: Visual learners benefit from demonstrations
- **Professional Feel**: Makes the app more polished and trustworthy

### Media Type Options

### Option 1: Static Images (Recommended for MVP)

**Pros:**

- ✅ Small file size (~50-200KB per image)
- ✅ Fast loading
- ✅ Low bandwidth usage
- ✅ Easy to implement
- ✅ Works offline (can bundle with app)
- ✅ No playback controls needed

**Cons:**

- ❌ Less dynamic than videos
- ❌ Can't show movement flow
- ❌ May need multiple images for complex exercises

**Implementation:**

- Use high-quality photos or illustrations
- Show key positions (start, middle, end)
- Multiple images for complex exercises
- Can bundle with app or load from CDN

**Storage Options:**

- **Bundled**: Include in app (~5-10MB total)
- **CDN**: Load on-demand (Cloudinary, Imgix, Supabase Storage)
- **Hybrid**: Bundle common exercises, CDN for premium

**Cost**:

- Bundled: Free (increases app size)
- CDN: $0-10/month (Cloudinary free tier: 25GB storage, 25GB bandwidth)

### Option 2: Animated GIFs/Lottie Animations

**Pros:**

- ✅ Shows movement flow
- ✅ Small file size (Lottie: ~20-100KB, GIF: ~200-500KB)
- ✅ No audio needed
- ✅ Loops automatically
- ✅ Better than static images

**Cons:**

- ❌ Larger than static images
- ❌ Limited quality (GIFs)
- ❌ May need optimization

**Implementation:**

- **Lottie** (Recommended): Vector-based, scalable, small files
- **GIF**: Universal support, larger files
- Use for exercises that benefit from showing movement

**Storage**: Similar to images (CDN or bundled)

**Cost**: Similar to images

### Option 3: Short Videos (15-30 seconds)

**Pros:**

- ✅ Best demonstration quality
- ✅ Can show full movement
- ✅ Can include audio cues
- ✅ Most engaging

**Cons:**

- ❌ Large file size (5-15MB per video)
- ❌ High bandwidth usage
- ❌ Requires video player
- ❌ Longer load times
- ❌ Storage costs

**Storage Considerations:**

- **Bundled**: Not recommended (would bloat app to 100MB+)
- **CDN/Streaming**: Required (YouTube, Vimeo, Cloudinary, Supabase Storage)
- **Compression**: Use H.264/H.265, optimize for mobile
- **Progressive Loading**: Stream, don't download full video

**Network Impact:**

- **5MB video** on 4G: ~2-5 seconds to start
- **5MB video** on WiFi: ~1-2 seconds to start
- **Data Usage**: Significant for users on limited plans

**Cost**:

- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth)
- **Supabase Storage**: Free tier (1GB storage, 2GB bandwidth)
- **YouTube**: Free (but requires YouTube app/embed)
- **Vimeo**: Free tier (500MB/week)

**Recommendation**: Use videos sparingly (premium feature, WiFi-only option)

### Option 4: User-Generated Content (Your Own Videos)

**Pros:**

- ✅ Authentic and personal
- ✅ No licensing costs
- ✅ Unique content
- ✅ Builds trust (real person demonstrating)
- ✅ Can be tailored to your app's style

**Cons:**

- ❌ Time-consuming to create
- ❌ Need good lighting/equipment
- ❌ Editing required
- ❌ Storage/bandwidth still needed
- ❌ May need to update if app changes

**Considerations:**

- **Filming**: Use smartphone (iPhone/Android) - quality is sufficient
- **Lighting**: Natural light or ring light
- **Background**: Clean, uncluttered
- **Editing**: Use free tools (iMovie, DaVinci Resolve, CapCut)
- **Length**: Keep videos short (15-30 seconds)
- **Compression**: Compress before uploading

**Storage Strategy:**

- Upload to CDN (Cloudinary/Supabase)
- Don't bundle in app
- Stream on-demand
- Cache after first view

**Network-Friendly Approach:**

- Offer "Download for offline" (premium feature)
- Show thumbnail first, load video on tap
- WiFi-only option in settings
- Low-quality preview, high-quality on demand

### Exercise API Options

### Option 1: ExerciseDB API (Free)

**API**: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb

**Pros:**

- ✅ Free tier available
- ✅ Large exercise database
- ✅ Includes images
- ✅ Includes instructions
- ✅ Includes muscle groups

**Cons:**

- ❌ May not have all exercises we need
- ❌ Generic images (not app-specific)
- ❌ Rate limits on free tier

**Cost**: Free tier: 500 requests/month

### Option 2: Wger Workout Manager API (Free)

**API**: https://wger.de/en/software/api

**Pros:**

- ✅ Completely free
- ✅ Open source
- ✅ Large database
- ✅ Includes images
- ✅ Good for fitness exercises

**Cons:**

- ❌ May not have desk stretches
- ❌ Generic content

**Cost**: Free

### Option 3: Custom Content + API

**Pros:**

- ✅ Full control
- ✅ App-specific content
- ✅ Can include your own videos/images
- ✅ Consistent style

**Cons:**

- ❌ Need to create all content
- ❌ More time-consuming
- ❌ Need storage solution

**Implementation:**

- Create custom images/animations/videos
- Store in Supabase Storage or Cloudinary
- Build simple API endpoint (or use Supabase directly)
- Cache responses

**Cost**: Storage costs only

### Option 4: Hybrid Approach (Recommended)

**Strategy:**

1. **Core Exercises**: Custom content (your videos/images)

   - Most common exercises
   - App-specific style
   - High quality

2. **Extended Library**: Exercise API

   - Less common exercises
   - Fill gaps in library
   - Fallback option

3. **Premium Exercises**: Custom premium content
   - Advanced exercises
   - Premium-only features
   - Your own demonstrations

### Recommended Implementation Plan

#### Phase 1: Static Images (MVP)

- [ ] Replace emoji placeholders with static images
- [ ] Use high-quality illustrations or photos
- [ ] Bundle common exercises with app (~5MB)
- [ ] Use CDN for extended library
- [ ] Implement image caching
- **Timeline**: 2-3 weeks

#### Phase 2: Lottie Animations

- [ ] Add Lottie animations for key exercises
- [ ] Focus on exercises that benefit from movement (squats, stretches)
- [ ] Keep file sizes small (<100KB each)
- [ ] Bundle with app or CDN
- **Timeline**: 3-4 weeks

#### Phase 3: Short Videos (Premium)

- [ ] Film yourself doing exercises (15-30 sec each)
- [ ] Edit and compress videos
- [ ] Upload to CDN (Cloudinary/Supabase)
- [ ] Implement video player
- [ ] Add "Download for offline" (premium)
- [ ] Add WiFi-only option
- [ ] Show thumbnail first, load on tap
- **Timeline**: 4-6 weeks

#### Phase 4: User-Generated Content (Future)

- [ ] Allow users to upload their own exercise videos
- [ ] Moderation system
- [ ] Community library
- [ ] Premium feature

### Media Storage & Delivery Strategy

### Recommended: Supabase Storage + Cloudinary

**Supabase Storage** (Primary):

- Store custom images/videos
- Free tier: 1GB storage, 2GB bandwidth
- Integrated with auth
- Easy to use

**Cloudinary** (CDN/Optimization):

- Image optimization
- Video transcoding
- Automatic format conversion (WebP, AVIF)
- Responsive images
- Free tier: 25GB storage, 25GB bandwidth

**Implementation:**

```typescript
// Example: Load exercise image
const imageUrl = isPremium
  ? `https://your-cdn.com/exercises/${exerciseId}.jpg`
  : `https://your-cdn.com/exercises/${exerciseId}-thumb.jpg`;

// With Cloudinary optimization
const optimizedUrl = `https://res.cloudinary.com/your-cloud/image/upload/
  q_auto,f_auto,w_400/${exerciseId}.jpg`;
```

### Caching Strategy

- **App Bundle**: Core exercises (10-15 most common)
- **CDN Cache**: All images cached on CDN
- **Local Cache**: Cache viewed images locally (React Native Image Cache)
- **Progressive Loading**: Thumbnail → Full image → Video (if premium)

### Network Optimization

- **Image Formats**: Use WebP (smaller than JPEG/PNG)
- **Compression**: Optimize all images (TinyPNG, ImageOptim)
- **Lazy Loading**: Load images as user scrolls
- **WiFi Detection**: Offer "WiFi only" mode for videos
- **Offline Mode**: Download exercises for offline (premium)

### File Size Targets

- **Static Image**: 50-200KB (optimized)
- **Lottie Animation**: 20-100KB
- **Video (15-30s)**: 2-5MB (compressed, H.264)
- **Video Thumbnail**: 10-30KB

### Exercise Content Checklist

- [ ] **Phase 1: Images**

  - [ ] Create/find images for all exercises
  - [ ] Optimize images (WebP, compression)
  - [ ] Set up CDN (Cloudinary/Supabase)
  - [ ] Implement image loading component
  - [ ] Add image caching
  - [ ] Replace emoji placeholders

- [ ] **Phase 2: Animations**

  - [ ] Create Lottie animations for key exercises
  - [ ] Test on different devices
  - [ ] Optimize file sizes
  - [ ] Add animation controls (play/pause)

- [ ] **Phase 3: Videos**

  - [ ] Film exercise demonstrations
  - [ ] Edit videos (15-30 seconds each)
  - [ ] Compress videos (H.264, mobile-optimized)
  - [ ] Upload to CDN
  - [ ] Implement video player
  - [ ] Add download for offline option
  - [ ] Add WiFi-only setting

- [ ] **Phase 4: API Integration**

  - [ ] Research exercise APIs
  - [ ] Choose API (ExerciseDB/Wger)
  - [ ] Implement API client
  - [ ] Cache API responses
  - [ ] Handle rate limits
  - [ ] Fallback to local content

- [ ] **Phase 5: Premium Features**
  - [ ] Premium exercise library
  - [ ] HD videos
  - [ ] Download for offline
  - [ ] Advanced exercises
  - [ ] Personal trainer tips

### Cost Estimates

**Free Tier (Images Only):**

- Cloudinary: Free (25GB storage)
- Supabase Storage: Free (1GB storage)
- **Total**: $0/month

**With Videos (100 exercises, 5MB each = 500MB):**

- Cloudinary: Free tier sufficient
- Supabase Storage: Free tier sufficient
- Bandwidth: ~$0-5/month (depending on usage)
- **Total**: $0-5/month

**At Scale (10K users, 100MB/month each):**

- Storage: $10-20/month
- Bandwidth: $50-100/month
- **Total**: $60-120/month

### Recommendations

1. **Start with Static Images**: Fastest to implement, good UX improvement
2. **Add Lottie Animations**: For exercises that benefit from movement
3. **Videos as Premium**: Keep videos as premium feature, WiFi-only option
4. **Your Own Content**: Film yourself - more authentic and unique
5. **Hybrid Storage**: Bundle core exercises, CDN for extended library
6. **Optimize Everything**: Compress images/videos, use modern formats

---

## 🔐 Authentication & User Accounts

### Why Authentication?

- Sync data across devices
- Premium subscription management
- Cloud backup of stats/journal
- Multi-device support
- Account recovery

### Authentication Options

### Option 1: Supabase Auth (Recommended)

**Pros:**

- ✅ Free tier: 50,000 MAU
- ✅ Built-in email/password, OAuth (Google, Apple, GitHub)
- ✅ Row-level security
- ✅ Real-time subscriptions
- ✅ Easy integration with React Native
- ✅ Magic links (passwordless)

**Cons:**

- ❌ Requires backend setup
- ❌ Vendor lock-in

**Implementation:**

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
```

**Features:**

- Email/password signup
- Social login (Google, Apple)
- Magic link authentication
- Password reset
- Email verification

**Cost**: Free up to 50K MAU, then $25/month

### Option 2: Firebase Authentication

**Pros:**

- ✅ Free tier: Unlimited users
- ✅ Google, Apple, Facebook, Twitter, GitHub, etc.
- ✅ Phone number authentication
- ✅ Well-documented
- ✅ Part of Firebase ecosystem

**Cons:**

- ❌ Requires Firebase project
- ❌ More complex setup
- ❌ Vendor lock-in

**Cost**: Free (generous free tier)

### Option 3: Clerk

**Pros:**

- ✅ Modern, developer-friendly
- ✅ Pre-built UI components
- ✅ Social logins
- ✅ Great documentation

**Cons:**

- ❌ Paid service (limited free tier)
- ❌ More expensive than alternatives

**Cost**: Free up to 10K MAU, then $25/month

### Option 4: Custom Backend (Node.js + JWT)

**Pros:**

- ✅ Full control
- ✅ No vendor lock-in
- ✅ Customizable

**Cons:**

- ❌ More development time
- ❌ Need to handle security
- ❌ Server maintenance

**Cost**: Server hosting ($5-20/month)

### Recommended: Supabase Auth

**Implementation Checklist:**

- [ ] Set up Supabase project
- [ ] Install Supabase client
- [ ] Create auth service wrapper
- [ ] Implement sign up flow
- [ ] Implement sign in flow
- [ ] Add social login (Google, Apple)
- [ ] Add password reset
- [ ] Add email verification
- [ ] Handle auth state persistence
- [ ] Add logout functionality
- [ ] Add account deletion
- [ ] Test auth flows

---

## 💾 Database & Backend

### Current State

- ✅ Local SQLite for events
- ✅ MMKV for settings
- ✅ No cloud sync

### Why Cloud Database?

- Multi-device sync
- Backup and restore
- Premium features
- Analytics (privacy-first)
- Real-time features

### Database Options

### Option 1: Supabase (PostgreSQL) - Recommended

**Pros:**

- ✅ Free tier: 500MB database, 2GB bandwidth
- ✅ Real-time subscriptions
- ✅ Row-level security
- ✅ Built-in auth
- ✅ REST API + GraphQL
- ✅ File storage included
- ✅ Great React Native support

**Cons:**

- ❌ PostgreSQL learning curve
- ❌ Vendor lock-in

**Use Cases:**

- User accounts
- Event sync
- Settings sync
- Journal entries
- Premium subscription status

**Cost**:

- Free: 500MB database, 2GB bandwidth
- Pro: $25/month (8GB database, 50GB bandwidth)

**Schema Example:**

```sql
-- Users table (handled by Supabase Auth)
-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  app_package TEXT,
  app_name TEXT,
  reason TEXT,
  action TEXT, -- 'paused', 'opened_anyway', 'chose_alternative'
  timestamp TIMESTAMPTZ,
  pause_duration INTEGER
);

-- Settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  selected_apps JSONB,
  pause_duration INTEGER,
  theme TEXT,
  notifications_enabled BOOLEAN,
  updated_at TIMESTAMPTZ
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  content TEXT,
  mood TEXT,
  created_at TIMESTAMPTZ
);
```

### Option 2: Firebase Firestore

**Pros:**

- ✅ Free tier: 1GB storage, 10GB/month transfer
- ✅ Real-time sync
- ✅ Offline support
- ✅ Easy to use
- ✅ Part of Firebase ecosystem

**Cons:**

- ❌ NoSQL (less structured)
- ❌ Query limitations
- ❌ Vendor lock-in
- ❌ Can get expensive at scale

**Cost**:

- Free: 1GB storage, 10GB/month
- Blaze: Pay-as-you-go ($0.06/GB storage, $0.12/GB transfer)

### Option 3: MongoDB Atlas

**Pros:**

- ✅ Free tier: 512MB storage
- ✅ Flexible schema
- ✅ Good for unstructured data

**Cons:**

- ❌ More complex setup
- ❌ Less real-time features

**Cost**: Free tier available, then $9/month+

### Option 4: Self-Hosted (PostgreSQL/MySQL)

**Pros:**

- ✅ Full control
- ✅ No vendor lock-in
- ✅ Customizable

**Cons:**

- ❌ Server maintenance
- ❌ Security responsibility
- ❌ Scaling challenges

**Cost**: $5-50/month (VPS hosting)

### Recommended: Supabase

**Implementation Checklist:**

- [ ] Set up Supabase project
- [ ] Design database schema
- [ ] Create tables and relationships
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create migration scripts
- [ ] Implement sync service
- [ ] Handle offline/online sync
- [ ] Add conflict resolution
- [ ] Test multi-device sync
- [ ] Add backup/restore functionality

---

## 💳 Payment & Subscription

### Why Subscriptions?

- Recurring revenue
- Better user retention
- Predictable income
- Can offer free tier

### Payment Options

### Option 1: RevenueCat (Recommended)

**Pros:**

- ✅ Unified API for iOS + Android
- ✅ Handles App Store + Play Store
- ✅ Free tier: Up to $10K MRR
- ✅ Analytics dashboard
- ✅ A/B testing
- ✅ Promotional offers
- ✅ Webhooks for backend sync
- ✅ Great React Native support

**Cons:**

- ❌ Takes 1% after $10K MRR
- ❌ Additional service layer

**Cost**:

- Free: Up to $10K MRR
- Growth: 1% of revenue after $10K

**Implementation:**

```bash
npm install react-native-purchases
```

### Option 2: Native In-App Purchases

**Pros:**

- ✅ No middleman
- ✅ Full control
- ✅ No fees

**Cons:**

- ❌ Need separate implementation for iOS + Android
- ❌ More complex
- ❌ Handle receipts yourself
- ❌ No unified analytics

**iOS**: StoreKit 2  
**Android**: Google Play Billing Library

### Option 3: Stripe (Web/External)

**Pros:**

- ✅ Works for web
- ✅ Can handle subscriptions outside app stores
- ✅ More payment methods

**Cons:**

- ❌ Can't use for in-app purchases (App Store/Play Store rules)
- ❌ Need web interface

**Use Case**: Web subscriptions, enterprise plans

### Recommended: RevenueCat

**Implementation Checklist:**

- [ ] Set up RevenueCat account
- [ ] Configure products in App Store Connect
- [ ] Configure products in Google Play Console
- [ ] Install RevenueCat SDK
- [ ] Implement purchase flow
- [ ] Handle subscription status
- [ ] Add restore purchases
- [ ] Handle subscription lifecycle
- [ ] Add webhooks for backend sync
- [ ] Test purchases (sandbox)
- [ ] Handle subscription expiration
- [ ] Add promotional offers

### Subscription Products

**iOS Products** (App Store Connect):

- `gentlewait_monthly` - $4.99/month
- `gentlewait_yearly` - $39.99/year (save 33%)
- `gentlewait_lifetime` - $99.99 one-time

**Android Products** (Google Play Console):

- `gentlewait_monthly` - $4.99/month
- `gentlewait_yearly` - $39.99/year
- `gentlewait_lifetime` - $99.99 one-time

**Trial Period**: 7-day free trial for monthly/yearly

---

## 🆓 Free vs Premium Features

### Free Tier (Forever Free)

**Core Features:**

- ✅ Basic pause functionality (up to 3 apps)
- ✅ Standard pause durations (10s, 15s, 20s, 30s)
- ✅ Basic breathing animation
- ✅ Today's stats
- ✅ Weekly stats (last 7 days)
- ✅ Basic insights
- ✅ Local data storage
- ✅ Dark/light theme
- ✅ Basic journaling (5 entries/month)

**Limitations:**

- ❌ Max 3 protected apps
- ❌ No custom pause durations
- ❌ No advanced analytics
- ❌ No cloud sync
- ❌ No multi-device support
- ❌ Limited journal entries
- ❌ No export features
- ❌ Basic AI assistant (limited requests)

### Premium Tier ($4.99/month or $39.99/year)

**All Free Features +:**

**Unlimited:**

- ✅ Unlimited protected apps
- ✅ Unlimited journal entries
- ✅ Unlimited AI assistant requests
- ✅ Unlimited export

**Advanced Features:**

- ✅ Custom pause durations
- ✅ Custom breathing patterns
- ✅ Advanced analytics (monthly/yearly reports)
- ✅ Cloud sync (multi-device)
- ✅ Export stats (CSV, PDF)
- ✅ Export journal entries
- ✅ Share progress screenshots
- ✅ Streak tracking
- ✅ Custom themes
- ✅ Multiple pause profiles
- ✅ Advanced AI coaching
- ✅ Personalized insights
- ✅ Priority support
- ✅ Early access to new features

**Premium-Only Features:**

- ✅ Advanced journaling (mood tracking, tags, search)
- ✅ Custom reflection prompts
- ✅ Advanced breathing exercises
- ✅ Guided meditations (future)
- ✅ Habit tracking integration
- ✅ Calendar integration
- ✅ Widgets
- ✅ Watch app access

### Lifetime Purchase ($99.99)

**Includes:**

- ✅ All Premium features
- ✅ Forever access
- ✅ No recurring payments
- ✅ Future features included

---

## 💰 Pricing Strategy

### Pricing Tiers

| Plan         | Price  | Billing           | Best For                 |
| ------------ | ------ | ----------------- | ------------------------ |
| **Free**     | $0     | -                 | Casual users, trying out |
| **Monthly**  | $4.99  | Monthly           | Short-term commitment    |
| **Yearly**   | $39.99 | Yearly (save $20) | Long-term users          |
| **Lifetime** | $99.99 | One-time          | Power users, supporters  |

### Pricing Rationale

**Free Tier:**

- Low barrier to entry
- Builds user base
- Word-of-mouth marketing
- Can convert to paid

**Monthly ($4.99):**

- Competitive with similar apps ($3-7/month range)
- Low commitment
- Easy to cancel

**Yearly ($39.99):**

- 33% discount vs monthly
- Better retention
- Predictable revenue
- $3.33/month effective price

**Lifetime ($99.99):**

- ~2 years of yearly subscription
- Appeals to power users
- One-time revenue boost
- Good for early adopters

### Promotional Pricing

**Launch Promo** (First 3 months):

- 50% off yearly ($19.99/year)
- Lifetime at $79.99

**Student Discount:**

- 50% off all plans
- Verify with student email (.edu)

**Family Plan** (Future):

- $9.99/month for up to 5 users
- Share with family members

### Revenue Projections

**Conservative Estimates** (Year 1):

- 10,000 free users
- 2% conversion rate = 200 paid users
- 50% monthly, 40% yearly, 10% lifetime
- Monthly: 100 × $4.99 = $499/month
- Yearly: 80 × $39.99 = $3,199/year = $267/month
- Lifetime: 20 × $99.99 = $1,999 one-time
- **Total MRR**: ~$766/month
- **Annual Revenue**: ~$9,200 + one-time purchases

**Optimistic Estimates** (Year 1):

- 50,000 free users
- 5% conversion rate = 2,500 paid users
- **Total MRR**: ~$9,500/month
- **Annual Revenue**: ~$114,000

---

## 🎨 Additional Features

### Short Term (3-6 months)

- [ ] **Onboarding Improvements**

  - Video tutorials
  - Interactive walkthrough
  - Better permission explanations
  - Skip option for returning users

- [ ] **UI/UX Polish**

  - Smooth animations
  - Loading states
  - Error boundaries
  - Empty states
  - Skeleton screens
  - Pull-to-refresh
  - Swipe gestures

- [ ] **Performance**

  - Optimize bundle size
  - Lazy loading
  - Image optimization
  - Code splitting
  - Memory optimization

- [ ] **Localization**
  - English (default)
  - Spanish
  - French
  - German
  - Japanese

### Medium Term (6-12 months)

- [ ] **Guided Meditations**

  - Audio meditations
  - Different lengths (5min, 10min, 15min)
  - Various themes (sleep, focus, anxiety)
  - Background sounds

- [ ] **Habit Tracking**

  - Daily habits
  - Streak tracking
  - Habit reminders
  - Progress visualization

- [ ] **Community Features**

  - Anonymous sharing
  - Community challenges
  - Support groups
  - Success stories

- [ ] **Integrations**
  - Apple Health
  - Google Fit
  - Strava
  - Calendar apps
  - Todoist/Notion

### Long Term (12+ months)

- [ ] **AI Coaching**

  - Personalized recommendations
  - Behavioral analysis
  - Predictive insights
  - Custom coaching plans

- [ ] **Gamification**

  - Achievements/badges
  - Levels
  - Leaderboards (optional)
  - Rewards

- [ ] **Enterprise/Team Plans**

  - Team dashboards
  - Admin controls
  - Bulk subscriptions
  - Custom branding

- [ ] **API Access**
  - Developer API
  - Webhooks
  - Third-party integrations

---

## 🔧 Technical Improvements

### Code Quality

- [ ] **Testing**

  - Unit tests (Jest)
  - Integration tests
  - E2E tests (Detox/Maestro)
  - Test coverage > 80%

- [ ] **Documentation**

  - API documentation
  - Component documentation
  - Architecture docs
  - Contributing guide

- [ ] **CI/CD**

  - GitHub Actions
  - Automated testing
  - Automated builds
  - App Store/Play Store deployment

- [ ] **Monitoring**
  - Crash reporting (Sentry)
  - Performance monitoring
  - Analytics (privacy-first)
  - Error tracking

### Performance

- [ ] **Optimization**

  - Bundle size reduction
  - Image optimization
  - Code splitting
  - Lazy loading
  - Memory leak fixes

- [ ] **Caching**
  - API response caching
  - Image caching
  - Offline support
  - Smart sync

### Security

- [ ] **Security Audit**

  - Code review
  - Dependency audit
  - Penetration testing
  - Security headers

- [ ] **Privacy**
  - Privacy policy
  - Terms of service
  - GDPR compliance
  - Data encryption
  - Data deletion

---

## 📈 Marketing & Growth

### Launch Strategy

- [ ] **Pre-Launch**

  - Landing page
  - Waitlist
  - Beta testing program
  - Social media presence

- [ ] **Launch**

  - Product Hunt launch
  - App Store optimization (ASO)
  - Press kit
  - Influencer outreach

- [ ] **Post-Launch**
  - User feedback collection
  - Feature requests
  - Bug fixes
  - Iterative improvements

### Marketing Channels

- [ ] **Content Marketing**

  - Blog posts
  - Case studies
  - How-to guides
  - Video tutorials

- [ ] **Social Media**

  - Twitter/X
  - Instagram
  - TikTok
  - Reddit (r/digitalminimalism, r/nosurf)

- [ ] **Paid Advertising**

  - Google Ads
  - Facebook/Instagram Ads
  - Apple Search Ads
  - Google Play Ads

- [ ] **Partnerships**
  - Productivity influencers
  - Mental health advocates
  - App review sites
  - Podcast sponsorships

### Growth Metrics

- **Key Metrics:**

  - DAU/MAU ratio
  - Retention (D1, D7, D30)
  - Conversion rate (free → paid)
  - Churn rate
  - LTV (Lifetime Value)
  - CAC (Customer Acquisition Cost)

- **Targets (Year 1):**
  - 10,000+ downloads
  - 2-5% conversion rate
  - 40%+ D7 retention
  - 20%+ D30 retention
  - $50+ LTV

---

## 📝 Notes & Considerations

### Privacy-First Approach

- ✅ All data stored locally by default
- ✅ Cloud sync is opt-in
- ✅ No tracking without consent
- ✅ GDPR compliant
- ✅ Data encryption
- ✅ User can delete all data

### Accessibility

- ✅ Screen reader support
- ✅ High contrast mode
- ✅ Large text options
- ✅ Reduce motion
- ✅ Keyboard navigation

### Sustainability

- ✅ Minimal server resources
- ✅ Efficient data storage
- ✅ Offline-first architecture
- ✅ Battery-efficient

### Open Source Considerations

- [ ] Consider open-sourcing core features
- [ ] Community contributions
- [ ] Transparency
- [ ] Trust building

---

## 🎯 Priority Matrix

### Must Have (MVP+)

1. iOS implementation
2. Authentication (Supabase)
3. Cloud sync (Supabase)
4. Payment integration (RevenueCat)
5. Premium features implementation

### Should Have (3-6 months)

1. Advanced analytics
2. Export features
3. Customization options
4. Notifications
5. Performance optimization

### Nice to Have (6-12 months)

1. Guided meditations
2. Habit tracking
3. Community features
4. Integrations
5. Localization

### Future Considerations (12+ months)

1. AI coaching
2. Gamification
3. Enterprise plans
4. API access
5. Desktop apps

---

## 📅 Estimated Timeline

### Q1 2026

- iOS implementation
- Authentication setup
- Cloud database setup
- Payment integration

### Q2 2026

- Premium features
- Advanced analytics
- Export features
- Performance optimization

### Q3 2026

- Guided meditations
- Habit tracking
- Localization
- Marketing push

### Q4 2026

- Community features
- Integrations
- AI improvements
- Scale infrastructure

---

**Last Updated**: January 2026  
**Next Review**: Quarterly

---

## 🤝 Contributing

Want to contribute? Check out:

- [ ] Feature requests → GitHub Issues
- [ ] Bug reports → GitHub Issues
- [ ] Code contributions → Pull Requests
- [ ] Documentation → Wiki

---

**Remember**: This is a living document. Update as priorities change and features are completed! 🚀
