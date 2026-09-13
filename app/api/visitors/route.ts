import { NextRequest, NextResponse } from "next/server";

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL ||
  "https://hot-adder-124963.upstash.io";
const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  "gQAAAAAAAegjAAIgcDE0NzU1Y2YzMTIzMzA0ZTgzYmUwNmFhZjZhZTcxMGZmYg";
const REDIS_KEY = "rds4plus:active_visitors";
const TIMEOUT_MS = 30 * 1000; // 30 seconds inactivity window

// In-memory fallback if Redis is unavailable
const localVisitors = new Map<string, number>();

function pruneLocalVisitors(now: number) {
  for (const [id, ts] of localVisitors.entries()) {
    if (now - ts > TIMEOUT_MS) {
      localVisitors.delete(id);
    }
  }
}

async function handlePresence(visitorId: string | null, isLeaving = false): Promise<number> {
  const now = Date.now();

  if (UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      const commands: (string | number)[][] = [
        ["ZREMRANGEBYSCORE", REDIS_KEY, "0", now - TIMEOUT_MS],
      ];

      if (visitorId) {
        if (isLeaving) {
          commands.push(["ZREM", REDIS_KEY, visitorId]);
        } else {
          commands.push(["ZADD", REDIS_KEY, now, visitorId]);
        }
      }

      commands.push(["ZCARD", REDIS_KEY]);
      commands.push(["EXPIRE", REDIS_KEY, 86400]);

      const res = await fetch(`${UPSTASH_URL}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
        cache: "no-store",
      });

      if (res.ok) {
        const results = await res.json();
        // Result corresponding to ZCARD
        const zcardIdx = visitorId ? 2 : 1;
        const count = results[zcardIdx]?.result;
        if (typeof count === "number") {
          return Math.max(1, count);
        }
      }
    } catch (err) {
      console.warn("Upstash Redis presence check failed, using local fallback:", err);
    }
  }

  // Local in-memory fallback
  pruneLocalVisitors(now);
  if (visitorId) {
    if (isLeaving) {
      localVisitors.delete(visitorId);
    } else {
      localVisitors.set(visitorId, now);
    }
  }
  return Math.max(1, localVisitors.size);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const count = await handlePresence(id, false);

  return NextResponse.json(
    { count },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || null;
    const isLeaving = body.action === "leave";
    const count = await handlePresence(id, isLeaving);

    return NextResponse.json(
      { count },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch {
    const count = await handlePresence(null, false);
    return NextResponse.json({ count });
  }
}
