# SpendTrack — Screen Design Reference

> Personal finance tracker for Rwandan users. Built with React Native (Expo) + FastAPI.

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2F8C7A` (teal) | Buttons, active states, highlights |
| Background Light | `#FFFFFF` | Screen backgrounds (light mode) |
| Background Dark | `#020E1E` | Screen backgrounds (dark mode) |
| Card Light | `#E8FAF1` | Card surfaces |
| Card Dark | `#103456` | Card surfaces |
| Text Light | `#111827` | Body text |
| Text Dark | `#F8FAFC` | Body text |
| Danger | `#EF4444` | Over-budget, errors |
| Warning | `#F59E0B` | 80% budget warnings |
| Success | `#10B981` | Positive savings, goals met |
| Mint | `#C8EDE6` | Auth screen backgrounds |
| Border Radius | 12–24px | Cards, inputs, buttons |
| Font Weights | 600 / 700 / 800 / 900 | Regular / Semi / Bold / Black |

---

## Screen Inventory

| # | Screen | File | Tab |
|---|--------|------|-----|
| 1 | Login | `app/login.tsx` | — |
| 2 | Register | `app/register.tsx` | — |
| 3 | Dashboard (Home) | `app/(tabs)/index.tsx` | 🏠 |
| 4 | Categories | `app/(tabs)/two.tsx` | ➕ |
| 5 | Saving Targets | `app/(tabs)/targets.tsx` | 🎯 |
| 6 | Wallet (Income) | `app/(tabs)/wallet.tsx` | 💳 |
| 7 | Settings | `app/(tabs)/settings.tsx` | ⚙️ |
| 8 | Profile | `app/profile.tsx` | — |
| 9 | Notifications | `app/notifications.tsx` | — |
| 10 | AI Financial Advisor | `app/ai-insights.tsx` | — |
| 11 | AI Chat | `app/ai-chat.tsx` | — |
| 12 | Meal Plan | `app/meal-plan.tsx` | — |
| 13 | Transport Plan | `app/transport-plan.tsx` | — |

---

## 1. Login Screen

**File:** `app/login.tsx`

### Layout
```
┌─────────────────────────────┐
│  [Mint background #C8EDE6]  │
│                             │
│  ○ Blob top-left            │
│  ○ Blob top-right           │
│                             │
│     [Walking Figure]        │
│    (CSS-drawn silhouette)   │
│                             │
├─────────────────────────────┤
│  [White form area]          │
│                             │
│  Hello Again !              │
│  Welcome back, we missed you│
│                             │
│  ┌─────────────────────┐    │
│  │  Enter your Email   │    │
│  └─────────────────────┘    │
│                             │
│  ┌──────────────────── 👁 ┐  │
│  │  Enter your password   │  │
│  └────────────────────────┘  │
│                             │
│  ┌─────────────────────┐    │
│  │       Login         │    │  ← Teal button #2F8C7A
│  └─────────────────────┘    │
│                             │
│  Don't have an account?     │
│  Register  ← teal link      │
└─────────────────────────────┘
```

### Components
- Mint background with two decorative blob shapes
- CSS-drawn walking figure (head, body, arms, legs)
- Pill-shaped inputs with mint tint background (`#F0FDF9`)
- Password field with FontAwesome `eye` / `eye-slash` toggle
- Teal rounded login button with shadow
- Keyboard dismisses on outside tap

### Interactions
- Tap outside inputs → keyboard dismisses
- Login → navigates to `/(tabs)` on success
- Register link → navigates to `/register`

---

## 2. Register Screen

**File:** `app/register.tsx`

### Layout
```
┌─────────────────────────────┐
│  [Mint background]          │
│  ○ Blob top-left            │
│  ○ Blob top-right           │
│                             │
│     [Walking Figure]        │
│                             │
│  Let us get you Started !   │
│  Join others to track...    │
│                             │
│  ┌─────────────────────┐    │
│  │  Enter your full name│   │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  Enter your Email   │    │
│  └─────────────────────┘    │
│  ┌──┬──────────────────┐    │
│  │🇷🇼│  Enter your phone │   │  ← Country code picker
│  └──┴──────────────────┘    │
│  ┌──────────────────── 👁 ┐  │
│  │  Enter your password   │  │
│  └────────────────────────┘  │
│  ┌──────────────────── 👁 ┐  │
│  │  Repeat your password  │  │
│  └────────────────────────┘  │
│                             │
│  ┌─────────────────────┐    │
│  │      Register       │    │
│  └─────────────────────┘    │
│                             │
│  Already have an account?   │
│  Login  ← teal link         │
└─────────────────────────────┘
```

### Components
- Same mint/blob/figure design as Login
- Country code picker (defaults to +250 Rwanda)
- Dropdown shows: +250, +1, +44, +33, +49, +254, +255
- Two password fields with independent show/hide toggles
- Scrollable form (keyboard-aware)

---

## 3. Dashboard (Home)

**File:** `app/(tabs)/index.tsx`

### Layout
```
┌─────────────────────────────┐
│ [TopBar]                    │
│ 👤 Edson    🔍  🔔(badge)   │
├─────────────────────────────┤
│ [Balance Card] — teal bg    │
│  Total Balance              │
│  RWF 45,000                 │
│  ↓ Income    |    ↑ Expenses│
├─────────────────────────────┤
│ [Saving Goal Card]          │
│  This Month's Saving Goal   │
│  ████████░░  68%            │
├─────────────────────────────┤
│ [AI Insights Preview]       │
│  💡 AI Insights  >          │
│  ┌──────────────────────┐   │
│  │ ⚠️ Budget Warning...  │   │
│  └──────────────────────┘   │
├─────────────────────────────┤
│ [Line Chart]                │
│  Income vs Expenses (6mo)   │
│  ─── Income  ─── Expenses   │
├─────────────────────────────┤
│ [Pie Chart]                 │
│  This Month's Spending      │
├─────────────────────────────┤
│ Spending Categories         │
│ ┌──────────────────────┐    │
│ │ 🍽️ Food & Dining  >  │    │  ← Tappable → expense modal
│ │ ████████░░  72%      │    │
│ └──────────────────────┘    │
│ ┌──────────────────────┐    │
│ │ 🚌 Transport      >  │    │
│ └──────────────────────┘    │
│  ... more categories        │
└─────────────────────────────┘
                    [⭐ FAB]   ← Opens AI Chat
```

### Expense Modal (bottom sheet)
```
┌─────────────────────────────┐
│ [Category icon + name]      │
│                             │
│ Budget used    72%          │
│ ████████░░                  │
│ RWF 280 remaining of RWF 1000│
│                             │
│ Amount                      │
│ ┌─────────────────────┐     │
│ │  0.00               │     │
│ └─────────────────────┘     │
│ Description (optional)      │
│ ┌─────────────────────┐     │
│ │                     │     │
│ └─────────────────────┘     │
│                             │
│ [Cancel]    [Pay & Add]     │  ← Flutterwave
└─────────────────────────────┘
```

### Key Features
- Balance card updates in real-time after every transaction
- Category progress bars: green < 80%, amber 80–99%, red 100%
- Budget exhausted → blocks payment, shows alert
- 80% warning → fires push notification after payment
- Floating ⭐ button → AI Chat

---

## 4. Categories Screen

**File:** `app/(tabs)/two.tsx`

### Layout
```
┌─────────────────────────────┐
│ [TopBar]                    │
│ Categories        [+ btn]   │
│ Tap to set monthly limit    │
├─────────────────────────────┤
│ ┌──────────────────────┐    │
│ │ 🍽️  Food & Dining    │    │
│ │ Monthly limit: 1,000 │ ✏️ │
│ └──────────────────────┘    │
│ ┌──────────────────────┐    │
│ │ 🚌  Transport        │    │
│ │ No spending limit set│ ✏️ │
│ └──────────────────────┘    │
│  ... 10 default categories  │
└─────────────────────────────┘
```

### Edit Budget Sheet
```
┌─────────────────────────────┐
│ Edit Category               │
│                             │
│ Name                        │
│ ┌─────────────────────┐     │
│ │ Food & Dining       │     │
│ └─────────────────────┘     │
│ Monthly Spending Limit      │
│ ┌─────────────────────┐     │
│ │ 1000                │     │
│ └─────────────────────┘     │
│ ⚠️ Warned at 80%, blocked at 100%│
│                             │
│ [Cancel]    [Save]          │
└─────────────────────────────┘
```

### Default Categories (auto-seeded)
Food & Dining · Transport · Housing & Bills · Health · Shopping · Entertainment · Education · Personal Care · Savings · Other

---

## 5. Saving Targets

**File:** `app/(tabs)/targets.tsx`

### Layout
```
┌─────────────────────────────┐
│ Saving Target               │
│ April 2026                  │
├─────────────────────────────┤
│         68%                 │
│    of goal reached          │
│                             │
│ ████████████░░░░░░░░        │
│                             │
│ Saved    │  Goal   │ Needed │
│ 34,000   │ 50,000  │ 16,000 │
├─────────────────────────────┤
│ ⭐ Halfway to your goal!    │
│ Keep it up!                 │
├─────────────────────────────┤
│ [✏️ Update goal amount]     │
└─────────────────────────────┘
```

### Status Colors
- 0–49% → primary color + "Keep saving"
- 50–79% → blue + "Halfway there"
- 80–99% → blue + "Almost there"
- 100% → green + "Goal achieved!"

---

## 6. Wallet (Income)

**File:** `app/(tabs)/wallet.tsx`

### Layout
```
┌─────────────────────────────┐
│ Wallet                      │
│ April 2026                  │
├─────────────────────────────┤
│ [Balance Card] — teal       │
│  Total Balance  │ Goal  │ Spendable│
├─────────────────────────────┤
│ [+ Add Income]  ← outlined  │
├─────────────────────────────┤
│ This Month's Income  50,000 │
├─────────────────────────────┤
│ ┌──────────────────────┐    │
│ │ 💼 Salary            │    │
│ │ Monthly salary       │    │
│ │ Apr 20, 2026  50,000 │    │
│ └──────────────────────┘    │
└─────────────────────────────┘
```

### Add Income Modal
```
┌─────────────────────────────┐
│ Add Income                  │
│                             │
│ [Manual] [Receive via FLW]  │  ← Mode toggle
│                             │
│ Source                      │
│ [Salary][Freelance][Bonus]  │
│                             │
│ Amount  ┌───────────────┐   │
│         │ 0.00          │   │
│         └───────────────┘   │
│ Description (optional)      │
│                             │
│ ℹ️ FLW mode: generates a    │
│    payment link for payer   │
│                             │
│ [Cancel]  [Record / Generate]│
└─────────────────────────────┘
```

---

## 7. Profile

**File:** `app/profile.tsx`

### Layout
```
┌─────────────────────────────┐
│ ← Profile              ✏️   │
├─────────────────────────────┤
│         [ED]                │  ← Initials avatar
│       Edson Mugisha          │
│    edson@example.com        │
├─────────────────────────────┤
│ [Income] | [Spent] | [Bal]  │  ← Stats row
├─────────────────────────────┤
│ PERSONAL INFO               │
│ 👤 Full Name   Edson Mugisha│
│ ✉️  Email      edson@...    │
│ 📞 Phone       +250788...   │
│ 📍 Address     Kigali       │
│ 💰 Currency    RWF          │
├─────────────────────────────┤
│ ACCOUNT                     │
│ ⚙️  Settings            >   │
│ 🔔 Notifications        >   │
│ 🚪 Log Out              >   │  ← Red
└─────────────────────────────┘
```

### Edit Profile Sheet
- Full Name, Phone, Address, Currency (chip selector: USD/EUR/GBP/RWF/etc.)

---

## 8. Notifications

**File:** `app/notifications.tsx`

### Layout
```
┌─────────────────────────────┐
│ ← Notifications  3 unread   │
│ Mark all read    Clear      │
├─────────────────────────────┤
│ ┌──────────────────────┐    │
│ │ 🚨 Budget Exhausted  │ ●  │  ← Unread dot
│ │ You've used 100% of  │    │
│ │ Food & Dining budget │    │
│ │ 2h ago              │    │
│ └──────────────────────┘    │
│ ┌──────────────────────┐    │
│ │ ⚠️ Budget Warning    │ ●  │
│ │ You're at 85% of...  │    │
│ └──────────────────────┘    │
│ ┌──────────────────────┐    │
│ │ 💰 Income Recorded   │    │
│ │ RWF 50,000 from...   │    │
│ └──────────────────────┘    │
└─────────────────────────────┘
```

### Notification Types & Colors
| Type | Icon | Color |
|------|------|-------|
| income | dollar | `#10B981` green |
| budget_warning | exclamation-triangle | `#F59E0B` amber |
| budget_exhausted | ban | `#EF4444` red |
| saving_risk | line-chart | `#3B82F6` blue |
| saving_achieved | trophy | `#8B5CF6` purple |

---

## 9. AI Financial Advisor

**File:** `app/ai-insights.tsx`

### Tabs
```
┌─────────────────────────────┐
│ ← AI Financial Advisor      │
│ April 2026                  │
├─────────────────────────────┤
│ [Insights][Plan][Optimize][Lifestyle]│
├─────────────────────────────┤
│  TAB CONTENT (see below)    │
└─────────────────────────────┘
```

### Tab 1 — Insights
Real-time analysis cards with color-coded left border:
- 🏆 Great savings rate (green)
- ⚠️ Budget at 85% (amber)
- 🚨 Budget exhausted (red)
- 📊 Top expense category (purple)
- 🎯 Saving goal progress (blue)

### Tab 2 — Plan
6-month historical spending plan:
- Banner: Projected Income | Avg Savings Rate
- Sections: Income Forecast · Savings Plan · Category Plan · Emergency Fund · Historical Performance

### Tab 3 — Optimize
Necessity scoring per category:
```
┌──────────────────────────────┐
│ Potential Monthly Saving     │
│ RWF 15,000  |  Annual 180,000│
├──────────────────────────────┤
│ 🔴 Essential — protect       │
│ 🟡 Important — trim 20%      │
│ 🟢 Discretionary — cut 50%   │
├──────────────────────────────┤
│ 🟢 Entertainment             │
│ Necessity score: 25/100      │
│ ████░░░░░░░░░░░░░░░░         │
│ Save up to RWF 5,000/month   │
└──────────────────────────────┘
```

### Tab 4 — Lifestyle
Income-based budget allocation:
```
┌──────────────────────────────┐
│ Income | Saving Goal | Spendable│
├──────────────────────────────┤
│ ⭐ AI Personalised Tips      │
│ (Gemini-powered when key set)│
├──────────────────────────────┤
│ 🍽️ Food & Dining  12,500/mo  │  ← Tappable → Meal Plan
│ Daily allowance: RWF 417     │
│                              │
│ 🚌 Transport       6,000/mo  │  ← Tappable → Transport Plan
│ Daily allowance: RWF 200     │
└──────────────────────────────┘
```

---

## 10. Meal Plan

**File:** `app/meal-plan.tsx`

### Layout
```
┌─────────────────────────────┐
│ ← 🍽️ Meal Plan  April 2026  │
├─────────────────────────────┤
│ Budget | Daily Allow | Left │
├─────────────────────────────┤
│ ⭐ AI Personalised Plan     │
│ (Gemini text when available)│
├─────────────────────────────┤
│ WEEKLY RWANDAN MEAL PLAN    │
│ ┌──────────────────────┐    │
│ │ Monday    ~RWF 3,500 │    │
│ │ ☀️ Breakfast: Porridge│    │
│ │ 🍴 Lunch: Isombe+ugali│   │
│ │ 🌙 Dinner: Tilapia   │    │
│ └──────────────────────┘    │
│  ... 7 days                 │
├─────────────────────────────┤
│ MONEY-SAVING TIPS           │
│ 💡 Buy at Kimironko market  │
│ 💡 Cook in bulk on weekends │
└─────────────────────────────┘
```

### Rwandan Meals Featured
Isombe · Ibihaza · Matoke · Ugali · Ibitoke · Ikivuguto · Tilapia · Brochettes · Nyama choma · Beans & rice

---

## 11. Transport Plan

**File:** `app/transport-plan.tsx`

### Layout
```
┌─────────────────────────────┐
│ ← 🚌 Transport Plan         │
├─────────────────────────────┤
│ Budget | Daily Allow | Left │  ← Blue banner
├─────────────────────────────┤
│ Recommended Strategy        │
│ Use tap-tap as primary...   │
│ [tap-tap] [moto-taxi]       │
├─────────────────────────────┤
│ ⭐ AI Personalised Advice   │
├─────────────────────────────┤
│ KIGALI TRANSPORT OPTIONS    │
│ ┌──────────────────────┐    │
│ │ 🚌 Tap-tap / Bus     │    │
│ │ ~RWF 500/day         │    │
│ │ 💡 Use monthly pass  │    │
│ └──────────────────────┘    │
│ ┌──────────────────────┐    │
│ │ 🛵 Moto-taxi         │    │
│ │ ~RWF 1,500/day       │    │
│ └──────────────────────┘    │
└─────────────────────────────┘
```

---

## 12. AI Chat

**File:** `app/ai-chat.tsx`

### Layout
```
┌─────────────────────────────┐
│ ← ⭐ AI Financial Advisor   │
│ Powered by Gemini           │
├─────────────────────────────┤
│                             │
│ ⭐ Hi! I'm your AI advisor. │
│    I know your finances...  │
│                             │
│ [How are my finances?]      │  ← Quick prompt chips
│ [Where am I overspending?]  │
│ [How can I save more?]      │
│                             │
│              You: How am I? │
│                             │
│ ⭐ Based on your data,      │
│    you're saving 18%...     │
│                             │
├─────────────────────────────┤
│ ┌──────────────────── [→] ┐ │
│ │ Ask about your finances  │ │
│ └──────────────────────────┘ │
└─────────────────────────────┘
```

### Features
- Multi-turn conversation with history
- User's financial snapshot injected as context
- Quick prompt chips on first open
- Falls back to rule-based responses if no Gemini key

---

## Navigation Structure

```
app/
├── index.tsx          → redirects based on auth
├── landing.tsx        → onboarding
├── login.tsx          → auth
├── register.tsx       → auth
├── profile.tsx        → modal-style
├── notifications.tsx  → modal-style
├── ai-chat.tsx        → modal-style
├── ai-insights.tsx    → modal-style
├── meal-plan.tsx      → modal-style
├── transport-plan.tsx → modal-style
└── (tabs)/
    ├── _layout.tsx    → tab bar config
    ├── index.tsx      → Dashboard 🏠
    ├── two.tsx        → Categories ➕
    ├── targets.tsx    → Saving Goals 🎯
    ├── wallet.tsx     → Income 💳
    └── settings.tsx   → Settings ⚙️
```

## Auth Flow

```
App opens
    │
    ▼
index.tsx checks isAuthenticated
    │
    ├── YES → /(tabs)/index (Dashboard)
    │
    └── NO  → /landing → /login or /register
                              │
                              ▼
                         /(tabs)/index
```

## Flutterwave Payment Flow

```
User taps "Pay & Add"
    │
    ▼
Flutterwave modal opens (card / mobile money / USSD)
    │
    ▼
User completes payment
    │
    ▼
onRedirect({ status: 'successful', transaction_id, tx_ref })
    │
    ▼
POST /payments/verify
    │
    ├── Backend verifies with Flutterwave API
    ├── Checks tx_ref matches
    └── Writes Transaction record (source='flutterwave')
    │
    ▼
refreshTransactions() → UI updates instantly
```
