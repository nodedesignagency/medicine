# Cabinet

Scan the medicine you have at home, find out what it's actually for, and ask
whether you should take it right now.

A concept build, running natively in Expo Go — not a web app.

---

## Run it

```bash
npm install
npx expo start
```

Scan the QR with **Expo Go** (iOS or Android). Nothing else to configure —
the app ships with a database of common Indian household medicines, so
scanning and the symptom checker work the moment it opens.

If the phone and laptop aren't on the same Wi-Fi, use `npx expo start --tunnel`.

## The idea

You get a small thing — gas, a bit of a cough — and you take whatever is in the
drawer. Cabinet answers the two questions you actually have:

1. **What is this?** Point the camera at the strip or box.
2. **Should I take it for *this*?** Say what's wrong; it checks the medicine
   against your symptom and against you.

The second one is the interesting half. Ask it about paracetamol for gas and it
tells you no — *"Dolo 650 is for fever, headache, body ache and toothache — it
will not do anything for gas / bloating."* Tell it you're asthmatic and ask
about Combiflam and it refuses: *"Anti-inflammatory painkillers can set off an
asthma attack in some people. Paracetamol is the safer swap."*

## Screens

| Screen | What it does |
|---|---|
| **Cabinet** (`app/index.tsx`) | Your medicines standing on tinted acrylic shelves, grouped by category, with expiry tracking |
| **Scan** (`app/scan.tsx`) | Camera with a scanning frame; identifies the box and opens it |
| **Medicine** (`app/medicine/[id].tsx`) | What it's for, dosing, cautions, and the "Can I take this right now?" check |
| **Ask** (`app/ask.tsx`) | Pick symptoms → ranked answer from what you already own |
| **Settings** (`app/settings.tsx`) | Optional AI key, your health details, reset |

## Two scan modes

**Demo mode (default, no setup).** The camera frames the shot and you pick what
you're holding from the built-in list. Every other feature is fully live.

**AI recognition (optional).** Paste an Anthropic API key in Settings and the
camera reads the box itself — including medicines that aren't in the bundled
list, which it writes a full card for. Uses Claude vision with structured
outputs (`src/logic/ai.ts`).

> The key is stored on the phone and sent straight to Anthropic. Fine for a
> prototype you're showing around; a shipped app would put a small server in
> between so the key never leaves it. The official Node SDK doesn't support
> React Native, so this calls the Messages API over `fetch` directly.

## What's inside

```
app/                 screens (expo-router, file-based)
src/data/            46 medicines, 25 symptoms, categories
src/logic/advisor.ts the "should I take this?" rules engine
src/logic/ai.ts      Claude vision recognition
src/store/           cabinet + settings, persisted to the device
src/components/      the shelf, the medicine box, shared UI
src/theme/           colours, type scale, shelf tints
```

The medicine data is hand-written: brand, salt, plain-English description,
what it treats, adult dosing, and machine-readable contraindication flags
(`liver`, `asthma`, `pregnancy`, `ulcer`, `kids`…). Those flags are what let the
advisor answer *for you* rather than in general.

It also catches the trap nobody thinks about — that Dolo, Crocin and Sinarest
all contain paracetamol, and stacking them is an overdose.

## Design

Built from the shelf references: oversized editorial headline, category rows
that scroll horizontally, and each medicine rendered like a book spine standing
behind a tinted acrylic lip with screw heads at both ends. The lip is layered
translucency rather than a real blur, so iOS and Android render identically.

Type is the platform's own (SF Pro / Roboto) at heavy weights with tight
negative tracking — no webfonts to download before first paint.

## Not medical advice

General information about common medicines. Not a diagnosis, and no substitute
for a doctor or pharmacist. Dosing is the standard adult label dose. The app
says this on every screen where it gives an answer, and escalates outright for
things that need a person — a fever past three days, blood in stool, a rash with
swelling.
