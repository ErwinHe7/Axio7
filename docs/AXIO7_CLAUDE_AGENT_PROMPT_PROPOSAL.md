# AXIO7 Columbia/NYC Agent Proposal

## Prompt For Claude Agent

You are a senior product-engineering Claude agent working in the AXIO7 codebase. Turn AXIO7 from a broad agentic social feed into a focused Columbia/NYC information and connection product.

Important context:

- AXIO7 already has a social feed where users post and seven AI agents reply.
- AXIO7 already has Trade listings, bids/offers, and a "want to buy" flow that connects buyer and seller by email.
- Guest users should be treated as stable public handles like `Axio0x29FC3A0a504C6`, not anonymous "Guest" blobs.
- Product direction should be: "Ask one agent anything about Columbia/NYC life, and it finds timely, actionable info."
- User-provided inspiration includes Series/Yale/SMS-style campus assistant products and ai6666-style agent reply feeds. Treat those as unverified references; verify before using them in public copy.

Your mission:

1. Simplify the product narrative.
   Make the first-use experience explain one clear reason to come back: find Columbia/NYC events, sublets, items, and people through an agentic community layer.

2. Build an "Ask AXIO7" entry point.
   Add a prominent chat/search input on the home/feed or a new `/ask` route:
   - Example queries: "Any Columbia parties tonight?", "Find a May-August sublet near Columbia", "Who is selling furniture near Morningside?", "What events are happening in NYC this weekend?"
   - The answer should pull from internal posts/listings first, then optionally from configured knowledge sources.
   - Answers should cite/source internal posts/listings and link to the relevant post/listing.

3. Reframe Trade as "agent-assisted matching."
   Keep users responsible for payment/logistics. AXIO7 only connects both sides.
   The agent should be able to recommend relevant listings from a natural-language query.

4. Keep social feed, but make it serve discovery.
   Position posts as campus/NYC signals: events, sublets, buy/sell, questions, anonymous thoughts.
   Remove or de-emphasize unused sections like Subagents if they dilute the product.

5. Prepare for SMS/iMessage-style UX without overcommitting.
   Implement the web chat first. Design interfaces and APIs so a Twilio SMS or iMessage-like channel can call the same backend later.

Constraints:

- Do not create fake users or fake activity.
- Do not send mass email blasts or spam. If growth tooling is proposed, use compliant invite/referral flows.
- Do not promise logistics, escrow, payments, or safety guarantees. The marketplace connects people and information only.
- Keep the MVP small and shippable.

Deliverables:

- A short product spec in `docs/`.
- A concrete implementation plan.
- Code changes for the first useful slice: an Ask AXIO7 route/component/API that can answer from existing posts and listings.
- Verification steps and any setup required.

## Product Proposal

### One-Line Positioning

AXIO7 is an agentic Columbia/NYC community layer: post, ask, find events, find sublets, buy/sell, and get connected without digging through scattered group chats.

### Core Problem

Campus and NYC life information is fragmented across WeChat groups, WhatsApp, iMessage, Instagram, email lists, friend circles, flyers, and private chats. Students and young professionals miss useful events, sublets, secondhand items, and social connections because discovery is manual and scattered.

### Product Thesis

People do not need "another generic feed." They need an agent that understands local context and turns messy community signals into answers and connections.

The feed creates supply:

- People post events, questions, sublets, items, thoughts, and requests.
- AI replies make posting feel alive even before the network is dense.
- Trade listings create high-intent inventory.

The Ask interface creates demand:

- Users ask what they want in natural language.
- The agent finds relevant posts/listings/events.
- If there is a transaction match, AXIO7 connects both sides by email.

### MVP Scope

Build three surfaces:

1. Social Signal Feed
   Users post whatever is happening around Columbia/NYC. AI agents reply quickly. Anonymous or semi-anonymous posting uses stable `Axio0x...` handles so users can be distinguished without forcing login.

2. Ask AXIO7
   A single input where users ask questions like:
   - "Any parties near Columbia tonight?"
   - "Find me a summer sublet near campus."
   - "Who is selling a desk?"
   - "What should I do in NYC this weekend?"

3. Trade/Sublet Matching
   Users list items or sublets. Buyers make offers or click "I want to buy." AXIO7 emails both sides and lets them coordinate directly.

### What Not To Build Yet

- No logistics.
- No payments/escrow.
- No fake profiles.
- No full native app until the web loop proves retention.
- No broad "all-purpose social network" positioning.

### Differentiation

Traditional marketplaces require users to search manually. AXIO7 lets users ask an agent and receive a curated answer from community data.

Traditional social feeds require an existing social graph. AXIO7 uses agent replies and local utility to give early users a reason to post before the graph is dense.

Campus group chats are fragmented and hard to search. AXIO7 makes the information searchable, linkable, and reusable.

### Growth Hypothesis

Start with one dense geography: Columbia plus nearby NYC neighborhoods.

Seed real value through:

- Sublet and furniture listings during move-out season.
- Event discovery around weekends.
- Anonymous campus questions.
- Small creator/TikTok demos that show the agent answering useful local questions.
- Opt-in referral/invite links instead of unsolicited mass email.

### Success Metrics

- Weekly active askers.
- Questions answered with at least one relevant internal source.
- Listings contacted through "I want to buy."
- Post-to-reply engagement.
- Repeat usage within seven days.
- Number of real listings/events added by users.

### First Engineering Slice

1. Add `/ask`.
2. Add `app/api/ask/route.ts`.
3. Query internal posts and listings by keyword/category.
4. Return a grounded answer with links to relevant posts/listings.
5. Add a homepage CTA: "Ask AXIO7 about Columbia/NYC."
6. Track query, clicked result, and repeated usage.

### Longer-Term Channel Plan

After the web Ask loop works, expose the same API through SMS. iMessage-style interaction is a strong direction, but the backend should prove useful before platform-specific work.
