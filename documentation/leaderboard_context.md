# Leaderboard & Backend Context

Research summary: how to implement leaderboards, player authentication, and backend storage for PETS GO Lite across target platforms (Poki, CrazyGames).

---

## 1. Save System (Current State)

Both target platforms handle save sync automatically. Our `SaveSystem.ts` with `localStorage` + `try/catch` is sufficient.

| Platform | Mechanism | Developer Action |
|----------|-----------|-----------------|
| Poki | localStorage auto-synced for logged-in users | Nothing needed |
| CrazyGames | APS (Automatic Progress Save) backs up localStorage | Nothing needed |

---

## 2. Platform Policies on External Requests

### Poki

- **Blocks all external requests by default** via CSP (Content Security Policy)
- To use Supabase/Firebase: send exact URLs + explanation to Developer Support, they whitelist the domain
- **Must add in-game Privacy Policy UI** + provide hosted policy URL
- **Forbidden:** email login, Google/Facebook auth, personal data collection
- **Allowed (with approval):** leaderboard backends, analytics (GameAnalytics, ByteBrew), multiplayer servers, username/password (no email)
- Docs: https://sdk.poki.com/external-resources.html

### CrazyGames

- **No strict CSP blocking** external requests
- Requirement: time to gameplay with external loads <= 20 seconds
- SDK must be integrated for revenue
- Built-in `getUserToken()` returns JWT with userId, username, profilePictureUrl
- Docs: https://docs.crazygames.com/requirements/technical/

---

## 3. Leaderboard Options

### CrazyGames Built-in (MVP)

CrazyGames provides a Leaderboards MVP with encrypted score submission:

```javascript
const encrypted = await encryptScore(score, encryptionKey); // AES-GCM
CrazyGames.SDK.user.submitScore({ encryptedScore: encrypted });
```

- Anti-cheat: AES-GCM encryption (32-byte base64 key), API always returns true
- Config: metric type (XP/POINTS/KDA/MINUTES), sort order, min/max thresholds, cooldown
- Limitation: one leaderboard per game (MVP phase)
- Docs: https://docs.crazygames.com/sdk/leaderboards-mvp/

### Custom Backend (Supabase) — recommended for cross-platform

Single Supabase project serves all platforms. Free tier: 500MB DB, 50K requests/month, 500K Edge Function invocations.

---

## 4. Player Identity & Nicknames

### CrazyGames — use platform accounts

35M+ accounts. SDK gives username + avatar for free:

```typescript
const user = CrazyGames.SDK.user.getUser();
// { userId: "abc123", username: "CoolPlayer", profilePictureUrl: "..." }

const token = await CrazyGames.SDK.user.getUserToken(); // JWT, 1hr lifetime
// Verify on backend to get userId
```

- Never force login, allow guest play
- Don't trigger auth prompts automatically
- Docs: https://docs.crazygames.com/requirements/account-integration/

### Poki — in-game nickname input

Poki forbids email/Google/Facebook login in games. Allowed: simple nickname prompt.

```
Player opens game → prompted for nickname (3-16 chars)
→ stored in localStorage alongside generated UUID
→ sent with score submissions
```

- **Profanity filter required** (Poki policy). Use `leo-profanity` (~5KB) or similar
- No password, no email, no registration flow
- UUID persists in localStorage (Poki syncs localStorage for account holders)

### Supabase Anonymous Auth

```typescript
const { data, error } = await supabase.auth.signInAnonymously();
// Creates authenticated user without PII
// JWT contains is_anonymous claim
// User loses access if they clear browser data
```

- Can be converted to permanent account later (email/OAuth)
- Enable CAPTCHA to prevent abuse
- Docs: https://supabase.com/docs/guides/auth/auth-anonymous

---

## 5. Supabase Architecture

### Database Schema

```sql
create table leaderboard (
  id uuid default gen_random_uuid() primary key,
  player_id uuid not null unique,    -- anonymous UUID from client
  nickname text not null,
  score int not null,
  platform text default 'unknown',   -- 'poki' | 'crazygames' | 'web'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table leaderboard enable row level security;

-- Public read access
create policy "Anyone can read leaderboard"
  on leaderboard for select using (true);

-- Writes only through Edge Functions (service_role key)
```

### Edge Function: Submit Score (anti-cheat)

```typescript
// supabase/functions/submit-score/index.ts
Deno.serve(async (req) => {
  const { player_id, nickname, score, platform } = await req.json();

  // Validate nickname: 3-16 chars, alphanumeric + spaces, no profanity
  if (!isValidNickname(nickname)) return error(400, "Invalid nickname");

  // Validate score: within possible range for game mechanics
  if (score < 0 || score > MAX_POSSIBLE_SCORE) return error(400, "Invalid score");

  // Rate limit: 1 submission per player per N seconds
  // ...

  // Upsert: update only if new score is higher
  const { error: dbError } = await supabase
    .from('leaderboard')
    .upsert(
      { player_id, nickname, score, platform, updated_at: new Date().toISOString() },
      { onConflict: 'player_id' }
    );

  if (dbError) return error(500, "DB error");
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

### Client: Read Leaderboard

```typescript
const { data } = await supabase
  .from('leaderboard')
  .select('nickname, score, platform')
  .order('score', { ascending: false })
  .limit(50);
```

### Client: Submit Score

```typescript
// Via Edge Function (never write directly from client)
await fetch(`${SUPABASE_URL}/functions/v1/submit-score`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({
    player_id: savedPlayerId,
    nickname: playerNickname,
    score: currentLevel,
    platform: detectedPlatform
  })
});
```

---

## 6. Analytics

### Built-in (free, no extra code)

| Platform | What's Tracked | Source |
|----------|---------------|--------|
| Poki | DAU, engagement time, earnings, errors, player feedback | SDK events we already fire |
| CrazyGames | Gameplay sessions, loading times, ad metrics | SDK events |

### Advanced (optional, extra integration)

| Service | Cost | Size | Features |
|---------|------|------|----------|
| GameAnalytics | Free tier | 53KB min | Progression, design events, error tracking, A/B tests. Has Phaser tutorial |
| ByteBrew | Free | — | CrazyGames partner. Drop-off analysis, user journeys, live ops |

- GameAnalytics: `npm install gameanalytics` — TypeScript, Phaser tutorial at phaser.io
- ByteBrew: recommended by CrazyGames, free for their developers

---

## 7. Bundle Impact

| Dependency | Size (gzip) | Purpose |
|------------|-------------|---------|
| `@supabase/supabase-js` | ~50KB | DB client + auth |
| `leo-profanity` | ~5KB | Nickname filter |
| `gameanalytics` (optional) | ~53KB | Advanced analytics |
| **Total** | **~55-108KB** | Well within 5MB limit |

---

## 8. Identity Flow Summary

```
Game Start
    ├─ CrazyGames detected?
    │   ├─ getUser() → has account → use platform username
    │   └─ getUser() → null → prompt nickname, generate UUID
    │
    ├─ Poki detected?
    │   ├─ localStorage has nickname+UUID → use them
    │   └─ no saved identity → prompt nickname, generate UUID, save
    │
    └─ Standalone (dev/own site)
        └─ same as Poki flow

Submit Score
    └─ POST to Supabase Edge Function
        ├─ Validate nickname (length, profanity)
        ├─ Validate score (range, rate limit)
        └─ Upsert into leaderboard table

Read Leaderboard
    └─ Direct Supabase query (public read, RLS)
        └─ SELECT nickname, score ORDER BY score DESC LIMIT 50
```

---

## 9. Implementation Checklist

- [ ] Create Supabase project (free tier)
- [ ] Create `leaderboard` table with RLS
- [ ] Deploy `submit-score` Edge Function
- [ ] Add `@supabase/supabase-js` to project
- [ ] Add `leo-profanity` for nickname validation
- [ ] Create `LeaderboardSystem.ts` (pure TS, no Phaser)
- [ ] Create nickname input UI component
- [ ] Create leaderboard display scene/panel
- [ ] Platform detection: CrazyGames SDK user vs manual nickname
- [ ] Request Supabase domain approval from Poki Developer Support
- [ ] Add in-game Privacy Policy button (required for Poki)
- [ ] Test on both platforms
