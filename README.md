# 📧 Lead Automation App — Setup Guide

Ye app kya karta hai:
1. **Upload tab** — email + website ki list paste karo, app khud usko **5-5 ke batches** me baant deta hai.
2. **Batches tab** — har batch ke aage **Send** button, dabate hi us batch ke 5 leads ke liye:
   - website ka **basic SEO audit** hota hai (title, meta description, H1, 404, structured data/AEO-GEO signals)
   - **AI (Claude)** us audit ke data se ek fixed template ke andar **personalized email** likhता hai
   - Gmail API se email **automatically bhej diya jata hai** — open-tracking pixel aur click-tracking link ke saath
3. **Dashboard tab** — kitne sent hue, kitne open hue, kitne report-link click hue — sab live dikhta hai.

Poora automated hai — ek baar setup ho gaya to sirf paste + send button dabana hai.

---

## Step 1 — Supabase setup (Database)

1. https://supabase.com par free account banao, naya project create karo.
2. Project ke andar **SQL Editor** kholo, `supabase/schema.sql` file ka pura content paste karke **Run** karo. Ye `leads` aur `batches` table bana dega.
3. **Project Settings → API** me jaake ye 2 cheeze copy kar lo:
   - `Project URL` → isko `SUPABASE_URL` banega
   - `service_role` secret key → isko `SUPABASE_SERVICE_ROLE_KEY` banega (ye secret hai, kabhi frontend/public code me mat daalna)

---

## Step 2 — Anthropic API key (AI email likhne ke liye)

1. https://console.anthropic.com par account banao, **API Keys** section se ek key generate karo.
2. Isko `ANTHROPIC_API_KEY` me daalna hai.

---

## Step 3 — Gmail API setup (emails bhejne ke liye)

Gmail se automatically mail bhejne ke liye Google OAuth2 chahiye (App Password wali purani method Google ne band kar di hai kai accounts ke liye, isliye OAuth safe route hai):

1. https://console.cloud.google.com par jaao, naya project banao.
2. **APIs & Services → Library** me `Gmail API` search karke **Enable** karo.
3. **APIs & Services → Credentials → Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - Authorized redirect URI me ye add karo: `https://developers.google.com/oauthplayground`
   - Isse `Client ID` aur `Client Secret` milega → ye `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` hain.
4. Ab https://developers.google.com/oauthplayground par jaao:
   - Top-right gear icon (⚙️) pe click karo → **"Use your own OAuth credentials"** check karo → apna Client ID/Secret daal do.
   - Left side scope box me daalo: `https://www.googleapis.com/auth/gmail.send`
   - **Authorize APIs** dabao, apne Gmail account se login/allow karo.
   - **Exchange authorization code for tokens** dabao → yahan se **Refresh Token** milega → ye `GMAIL_REFRESH_TOKEN` hai.
5. `GMAIL_SENDER_EMAIL` = jis Gmail se mail bhejni hai (jisse authorize kiya tha).

---

## Step 4 — Netlify par deploy karo

1. Is poore folder ko GitHub repo me push karo (ya GitHub Desktop se).
2. https://netlify.com par login karo → **Add new site → Import an existing project** → apna GitHub repo select karo.
3. Build settings automatically `netlify.toml` se le lega:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions: `netlify/functions`
4. Deploy hone se pehle **Site settings → Environment variables** me ye sab daalo (Step 1-3 se mile values):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_SENDER_EMAIL`
   - `PUBLIC_SITE_URL` → aapka final Netlify URL, jaise `https://yourapp.netlify.app` (deploy hone ke baad milega, ek baar deploy karke fir isko update kar dena aur re-deploy karna)
5. **Deploy site** dabao. 2-3 min me live ho jayega.

---

## Step 5 — Use karna

1. App kholo → **Data Upload** tab → apni list paste karo (format: `email, website` — ek line ek lead)
2. **Batches & Send** tab me jaao → har batch (5 leads) ke aage **Send** button dikhega
3. Send dabate hi us batch ka audit + AI email + Gmail send sab automatic ho jayega
4. **Tracking Dashboard** tab me live open/click stats dikhenge

---

## Important notes

- Gmail API ki free limit ~500 emails/day per account hoti hai — isse zyada bhejna ho to Google Workspace account use karo.
- SEO audit "basic" hai jaisa aapne bataya: meta title, meta description, H1 alignment, 404 check, aur basic AEO/GEO signals (structured data + FAQ schema + robots.txt/sitemap). Deep audit (backlinks, core web vitals, keyword ranking) iske andar nahi hai — chahiye to bata dena, add kar sakte hain.
- Email personalization: fixed HTML template hai (branding/layout control aapke haath me), aur uske andar subject + opening line + findings summary + closing line AI (Claude) generate karta hai audit data dekh kar — jo aapne "Dono" bola tha wahi flow hai.
- Data upload abhi sirf **manual paste** se hai jaisa bataya — CSV upload ya website-scraping wale features baad me add ho sakte hain.
- Har lead ka apna unique `tracking_id` hai jisse open/click track hota hai — kisi third-party email tool ki zaroorat nahi.
