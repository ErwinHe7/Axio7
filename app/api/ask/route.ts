import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chat } from '@/lib/llm';
import { listListings, listPosts } from '@/lib/store';
import { formatCents } from '@/lib/format';
import { detectEventIntent, searchEvents } from '@/lib/events/search';
import type { Event } from '@/lib/events/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  query: z.string().min(1).max(500),
});

const HOUSING_KW = ['sublet', 'rent', 'room', 'apartment', 'sublease', 'housing', 'roommate', 'lease', '转租', '找房', '租房', '房间', '室友', '公寓'];
const FURNITURE_KW = ['furniture', 'desk', 'chair', 'couch', 'sofa', 'ikea', 'bed', 'table', '家具', '桌子', '椅子', '床', '沙发'];
const TRADE_KW = ['trade', 'buy', 'sell', 'selling', 'used', 'stuff', 'ticket', 'tickets', 'listing', '买', '卖', '闲置', '二手', '出售', '票'];
const EVENT_KW = ['event', 'events', 'party', 'parties', 'activity', 'activities', '活动', '派对', '聚会'];
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'near', 'this', 'that', 'what', 'where', 'when', 'who', 'any']);

function matchesAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function tokens(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function relevanceScore(queryTokens: string[], text: string) {
  const haystack = text.toLowerCase();
  return queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { query } = parsed.data;
  const contextParts: string[] = [];
  let eventResults: Event[] = [];
  let listingResults: Awaited<ReturnType<typeof listListings>> = [];
  let postResults: Awaited<ReturnType<typeof listPosts>> = [];

  try {
    const isHousing = matchesAny(query, HOUSING_KW);
    const isFurniture = matchesAny(query, FURNITURE_KW);
    const isTrade = isHousing || isFurniture || matchesAny(query, TRADE_KW);
    const isEvent = detectEventIntent(query) || matchesAny(query, EVENT_KW);
    const queryTokens = tokens(query);

    const [listings, posts, events] = await Promise.all([
      listListings({ category: isHousing ? 'sublet' : isFurniture ? 'furniture' : undefined }),
      listPosts(40),
      isEvent ? searchEvents(query, { limit: 5 }).catch(() => []) : Promise.resolve([]),
    ]);

    if (events.length > 0) {
      eventResults = events;
      const lines = events.map((ev, i) => {
        const when = ev.start_time
          ? new Date(ev.start_time).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : 'Date TBD';
        const price = ev.price_text ? ` - ${ev.price_text}` : ev.is_free ? ' - Free' : '';
        return `${i + 1}. "${ev.title}" - ${when} - ${ev.location ?? 'NYC'}${price} (/events/${ev.id})`;
      });
      contextParts.push(`Upcoming events on AXIO7:\n${lines.join('\n')}`);
    }

    const openListings = listings
      .filter((listing) => listing.status === 'open')
      .map((listing) => ({
        listing,
        score: relevanceScore(
          queryTokens,
          `${listing.category} ${listing.title} ${listing.description} ${listing.location ?? ''}`
        ),
      }))
      .filter(({ score }) => isTrade || score > 0)
      .sort((a, b) => b.score - a.score || b.listing.created_at.localeCompare(a.listing.created_at))
      .slice(0, 5)
      .map(({ listing }) => listing);

    if (openListings.length > 0) {
      listingResults = openListings;
      const lines = openListings.map((listing) => {
        const price = listing.asking_price_cents > 0
          ? formatCents(listing.asking_price_cents, listing.currency)
          : 'price TBD';
        const loc = listing.location ? ` - ${listing.location}` : '';
        return `- "${listing.title}" - ${price}${loc} (/trade/${listing.id})`;
      });
      contextParts.push(`Current listings on AXIO7 Trade:\n${lines.join('\n')}`);
    }

    const relevantPosts = posts
      .map((post) => ({
        post,
        score: relevanceScore(queryTokens, `${post.author_name} ${post.content}`),
      }))
      .filter(({ post, score }) => {
        const lower = post.content.toLowerCase();
        return (
          score > 0 ||
          (isHousing && HOUSING_KW.some((k) => lower.includes(k))) ||
          (isEvent && detectEventIntent(post.content)) ||
          (isFurniture && FURNITURE_KW.some((k) => lower.includes(k)))
        );
      })
      .sort((a, b) => b.score - a.score || b.post.created_at.localeCompare(a.post.created_at))
      .slice(0, 4)
      .map(({ post }) => post);

    if (relevantPosts.length > 0) {
      postResults = relevantPosts;
      const lines = relevantPosts.map(
        (post) => `- "${post.content.slice(0, 100)}" - posted by ${post.author_name} (/post/${post.id})`
      );
      contextParts.push(`Recent community posts:\n${lines.join('\n')}`);
    }
  } catch (err) {
    console.error('[/api/ask] live context failed:', err);
  }

  const contextBlock = contextParts.length > 0
    ? `\n\n[AXIO7 Live Data]\n${contextParts.join('\n\n')}`
    : '';

  const systemPrompt = `You are AXIO7, an AI local intelligence assistant for Columbia University and NYC students. Use the live data first, then give a concise next step. When referencing listings, events, or posts, include their /trade/, /events/, or /post/ links. If no perfect match exists, say what AXIO7 has and what the user should post or ask next. Always reply in English. Under 180 words.`;

  try {
    const answer = await chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${query}${contextBlock}` },
      ],
      { model: process.env.OPENAI_MODEL || 'openai/gpt-4o-mini', temperature: 0.7, max_tokens: 350 }
    );

    return NextResponse.json({
      answer,
      listings: listingResults.map((listing) => ({
        id: listing.id,
        category: listing.category,
        title: listing.title,
        description: listing.description,
        asking_price_cents: listing.asking_price_cents,
        currency: listing.currency,
        location: listing.location,
        images: listing.images,
        status: listing.status,
        created_at: listing.created_at,
      })),
      posts: postResults.map((post) => ({
        id: post.id,
        author_name: post.author_name,
        author_avatar: post.author_avatar,
        content: post.content,
        images: post.images,
        created_at: post.created_at,
        reply_count: post.reply_count,
        like_count: post.like_count,
        author_kind: post.author_kind,
        is_autonomous: post.is_autonomous,
      })),
      events: eventResults.map((ev) => ({
        id: ev.id,
        title: ev.title,
        start_time: ev.start_time,
        location: ev.location,
        poster_url: ev.poster_url,
        is_free: ev.is_free,
        price_text: ev.price_text,
        category: ev.category,
        tags: ev.tags,
        description: ev.description,
        borough: ev.borough,
        url: ev.url,
        end_time: ev.end_time,
        lat: ev.lat,
        lng: ev.lng,
        source_id: ev.source_id,
        external_id: ev.external_id,
        submitted_by_author_id: ev.submitted_by_author_id,
        status: ev.status,
        freshness_score: ev.freshness_score,
        created_at: ev.created_at,
        updated_at: ev.updated_at,
      })),
    });
  } catch (err) {
    console.error('[/api/ask]', err);
    return NextResponse.json({ error: 'Agent unavailable. Try again.' }, { status: 503 });
  }
}
