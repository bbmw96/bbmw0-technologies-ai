# BBMW0 Technologies AI — Voiceover Script

**Total runtime:** 30:00
**Voice tone:** Conversational, confident, slightly warm. Speak like a developer showing off something they're proud of, not a corporate narrator.
**Pace:** ~120 words/minute — leave breathing room so viewers can read on-screen text.
**Recommended voice on voicebooking.com:** A clear, mid-pitch English voice — try "Mike" or "Sarah" or any "Voice Over Artist" labeled Standard or Conversational.

---

## How to use this

1. Go to https://www.voicebooking.com/en/free-voice-over-generator
2. Pick a voice you like (the same one for every chapter — keep it consistent)
3. Paste **Chapter 1** into the text box → generate → download → save as `public/voiceover-ch1.mp3` in your project folder
4. Repeat for each chapter (9 files total)
5. Tell me you've got them and I'll wire them all into the LongForm composition

> If voicebooking limits per generation, paste one paragraph at a time and concatenate the audio in Audacity (free) — or just save each paragraph as its own file.

---

## CHAPTER 1 — Intro (1:00, ~120 words)

> **Save as:** `public/voiceover-ch1.mp3`

This is BBMW0 Technologies AI. A mobile-first, Shorts-native video editor — built on Remotion, powered by five large language models, and free for anyone to use.

Over the next thirty minutes, I'll walk you through what it is, why it exists, and how every piece works.

You'll see the editor in action. You'll see the same prompt go to Claude, GPT, Gemini, Perplexity, and Llama — all at once. You'll see how to deploy your own copy in ninety seconds.

If you build for the phone, make videos for the phone, or just want a clean little side project to learn from — this one's for you. Let's get into it.

---

## CHAPTER 2 — Why mobile-first (3:00, ~360 words)

> **Save as:** `public/voiceover-ch2.mp3`

Here's a question. The average person spends over five hours a day on their phone. Five hours. That's not the second screen anymore — that's the primary one.

So why is every serious video editor still built for a desktop?

Premiere, Final Cut, DaVinci, even most web-based tools — they all start from the same place. A wide canvas. Multi-panel layouts. Tiny click targets. Hover states. And then, eventually, somebody squeezes them onto a phone, and the result is — well. Not great.

BBMW0 starts from the phone. Vertical preview by default. The editor is one swipe away from the preview. Every button is big enough for your thumb. Every interaction is touch-first.

This isn't a desktop tool with a mobile mode. This is a mobile tool that happens to also work on desktop.

Why does this matter? Because the audience for short-form video is on a phone. The creators are on a phone. The viewers are on a phone. If everyone in the chain is mobile, the editor should be too.

There's also a second reason. Phones have surprisingly good cameras, plenty of compute, and they're with you all day. The bottleneck for making more video isn't the camera — it's the friction of editing. Remove that friction, and creators ship more.

So that's the philosophy. Start where the user is. That's the whole brief.

Now — let's tour the editor.

---

## CHAPTER 3 — Tour of the editor (5:00, ~600 words)

> **Save as:** `public/voiceover-ch3.mp3`

Five scene types. Each is a fully customizable React component. You pick one, fill in the props, and you have a polished animation.

First — the Hook scene. This is your stop-the-scroll opener. A bouncing emoji, a giant headline, a glowing background. The animation uses a spring curve so it feels alive — not robotic. Default duration: five seconds.

Second — the Title scene. Brand mark, main title, animated underline that grows in, subtitle that fades up. Best for product reveals or when you want a confident open.

Third — the Bullets scene. A heading and three list items. Each bullet slides in left to right with a number badge. Use it for "three reasons", "five tips", "what changed" — anything that's a list.

Fourth — the Quote scene. A big serif quote mark, the quote itself in a clean sans, an attribution underneath with a colored bar. Best for testimonials, claims, or punchy statements you want to hang in the air.

Fifth — the CTA scene. Big bold title, a pulsing arrow, a glowing URL or call-to-action box. This is always your last scene. It tells the viewer where to go next.

Around all of this is the editor itself. The preview shows your scene live, looped, in the exact aspect ratio it'll be exported to. Below the preview is a horizontal carousel of scene types — one swipe to switch. Below that is the prop editor — text inputs, color swatches, bullet list editors. Everything you need, nothing you don't.

There's also an AI bar. You type a prompt — like "5 morning habits that changed my life" — and the AI fills every field for you. We'll get to how that works in the next chapter.

When you're happy, you tap Export. The app gives you a single command to render the video locally on your machine — or, in a future version, the render happens server-side and you just download the MP4.

That's the whole tool. Five scenes, one editor, no menus. By design.

---

## CHAPTER 4 — Five AIs working as one (5:00, ~600 words)

> **Save as:** `public/voiceover-ch4.mp3`

Now — the part that makes BBMW0 different. The AI bar isn't using one model. It can use five.

Claude — Anthropic's model — is great at copywriting. Subtle, natural, has taste.

GPT — OpenAI's gpt-4o-mini — is reliable. Solid structured output. Fast for what it costs.

Gemini — Google's flash model — is multimodal and has a generous free tier.

Perplexity's sonar model is grounded in web search, which is useful when you want current facts.

And Llama three — running on Groq's hardware — is the fastest of the bunch. Often under five hundred milliseconds. Also free.

So here's the trick. Instead of picking one, BBMW0 has a consensus mode. You hit Fill, and the request fans out to every model you have a key for. They all answer in parallel. Then the results get merged — most-common value wins per field.

Why? Because no single model is best at everything. Claude writes prettier copy, GPT formats more reliably, Llama is faster, Gemini handles longer context. Asking all of them and taking the majority gives you a better answer than any one alone.

The whole thing lives in a single Vercel edge function — about four hundred lines of TypeScript. Each provider has an adapter that calls its API and normalizes the response. The router decides whether to call one, all, or auto-select.

If you don't set any API keys, the app still works. It falls back to a heuristic that runs entirely in your browser — pattern-matches the prompt and fills in sensible defaults.

So whether you're broke and offline, or paying for every premium model — the editor works. The cheapest real-AI setup is just adding a free Groq key. That alone gives you Llama three, sub-second response times, generous free tier. That's it. Done.

This is the architecture I want to see more of. Models as commodities, your code as the orchestration layer. No lock-in. No "you need GPT-4 for this". Just — pick what you have, get a good answer, ship the video.

---

## CHAPTER 5 — Live demo: three videos (5:00, ~600 words)

> **Save as:** `public/voiceover-ch5.mp3`

Let me show you three different videos, end to end. Three different topics, three different scenes, three different AI providers. Same editor.

Demo one. Topic: morning habits. I tap the Hook scene. I type the prompt — "five habits that changed my mornings". I pick Gemini in the model selector. I hit Fill. Two seconds later, every field is populated. A clean headline, a coffee emoji, a warm color palette. I tap Export. Done.

Demo two. Topic: a product launch. This time I want a Title scene. I type "introducing the new BBMW0 v two". I pick Claude — because Claude is great at copy. The Fill button gives me a polished tagline and a subtitle that actually sounds like a real product. I customize the gradient color to match my brand. Export.

Demo three. Topic: a book recap. Bullets scene. I type "Atomic Habits — three ideas". I switch the picker to consensus mode — meaning ask everyone. The router fans out to all five models. Twenty seconds later, I get the three best takes from across the providers, merged. Honestly, the bullets are sharper than what any one model gave me alone. I add a Quote scene next. Same flow. Done.

Three videos. Three topics. Three AI providers. All in five minutes. On a phone.

This is the whole point. The editor disappears. The AI takes the friction out of the writing. You're left with — pick a topic, hit a button, ship a video.

---

## CHAPTER 6 — How it's built (4:00, ~480 words)

> **Save as:** `public/voiceover-ch6.mp3`

Quick tour of the stack. Nothing exotic. Boring tools doing real work.

Remotion is the video framework. The pitch is straightforward — videos as React components. Every frame is a render of your component at that frame number. You animate by reading "current frame" in a hook and computing CSS values. Need physics? Spring functions are built in. Need easing? Interpolate. Need a timeline? The Series component chains scenes together.

Same components work in two places. The CLI renders them to MP4 using a headless Chrome. The @remotion/player package renders them in the browser as a live preview. So you write the scene once, you see it live in the editor, you ship it as MP4. Zero duplication.

The editor itself is React eighteen plus TypeScript five. Vite for the dev server and the production bundle — under four hundred kilobytes gzipped, fast on any phone. There's a service worker for offline support, so once a user opens the app, it works without a network.

For internationalization, no library — just a typed string map with ten languages. Auto-detects the user's locale, persists their override in local storage. Right-to-left works too — the layout flips correctly for Arabic.

Hosting is Vercel. The static site goes to their CDN. The API route — slash api slash ai — runs as an edge function. Environment variables hold the API keys. Push to GitHub, Vercel redeploys automatically. The whole loop is fast.

The repo is small. Around five thousand lines of TypeScript total. Small enough to read in an afternoon, big enough to do real work. Every file is under five hundred lines. Every component is its own file.

The whole thing is MIT licensed. Open source. Forever.

---

## CHAPTER 7 — Deploy your own (3:00, ~360 words)

> **Save as:** `public/voiceover-ch7.mp3`

Here's how to ship your own copy. Total time — under two minutes.

Step one. Open the repo on GitHub and click the "Deploy with Vercel" button at the top of the README. It's purple. You can't miss it.

Step two. Sign in with your GitHub account. If you don't have one, they're free — sign up takes thirty seconds. Vercel forks the repo into your account and starts a deployment.

Step three. This one's optional but I recommend it. Add an API key for any of the five AI providers. The cheapest path is Groq — get a free key from console dot groq dot com slash keys, paste it as an environment variable named GROQ underscore API underscore KEY. That alone gives you Llama three at sub-second response times. Free. Forever.

If you don't add any keys, the editor still works. It just falls back to the heuristic.

Step four. Click Deploy. Wait ninety seconds. You get a URL — yourname dot vercel dot app. That's your public site. Share it with anyone. Anyone can use it. They can install it as an app on their phone via "add to home screen". They can use it offline. They can use it in any of ten languages.

Free hosting, free SSL, free bandwidth. Your AI keys are the only thing that might cost money — and most of the providers have generous free tiers.

That's it. Welcome to shipping software in twenty twenty-six.

---

## CHAPTER 8 — Roadmap & contributing (3:00, ~360 words)

> **Save as:** `public/voiceover-ch8.mp3`

What's done — what's next — and how you can help.

Done. The editor itself. The five scene types. The AI bar with five providers and consensus mode. PWA install on iPhone and Android with offline support. Ten-language UI with full right-to-left for Arabic. Plus six pre-built compositions for marketing — short reels, tutorials, AI battles, speed runs, feature drops, and a thirty-minute long form, which you're watching now.

Coming soon. In-browser MP4 export via WebCodecs — so users can render without leaving the page. Server-side render via at-Remotion slash lambda — for fast cloud renders, around a tenth of a cent each. Audio uploads with auto-ducking. Caption auto-sync using Whisper. App Store and Play Store wrappers via Capacitor — so you can publish a real native app. And more languages — Indonesian, Turkish, Vietnamese, Korean, Italian, Dutch, Polish, Thai.

How to help. Star the repo on GitHub — that's the simplest signal that this is worth working on. Open an issue if you find a bug or have an idea. Send a pull request — even a single language translation is a real contribution. And if you make videos with BBMW0, share them with the hashtag bbmw0 — I'll repost the best ones.

This is open source. Forever. MIT licensed. The goal is to make video editing work better for everyone, on the device they actually use. If that resonates with you, come help build it.

---

## CHAPTER 9 — Outro & thanks (1:00, ~120 words)

> **Save as:** `public/voiceover-ch9.mp3`

That's the full tour. Thanks for watching all the way through.

If you take one thing away — it's that the phone is the primary screen now, and the tools haven't caught up yet. There's room for more mobile-first software. There's room for more AI-orchestration patterns like the consensus router we built. And there's room for more open-source projects that just work, on any device, in any country.

Star the repo. Try the demo. Build your own version. Or fork it and make it weirder. Whatever you do — make something.

This is BBMW0 Technologies AI. Built mobile-first. Shipped open source. Thanks for watching.
