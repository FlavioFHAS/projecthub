import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Get client IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Fetch the URL with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ProjectHub/1.0)",
        },
      });
      clearTimeout(timeout);

      const html = await response.text();

      // Extract title
      const titleMatch =
        html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
        html.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"/) ||
        html.match(/<title[^>]*>([^<]*)<\/title>/);

      // Extract description
      const descriptionMatch =
        html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
        html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) ||
        html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"/);

      // Extract favicon
      const faviconMatch =
        html.match(/<link[^>]*rel="icon"[^>]*href="([^"]*)"/) ||
        html.match(/<link[^>]*rel="shortcut icon"[^>]*href="([^"]*)"/) ||
        html.match(/<link[^>]*rel="apple-touch-icon"[^>]*href="([^"]*)"/);

      const title = titleMatch?.[1]?.trim() || null;
      const description = descriptionMatch?.[1]?.trim() || null;
      let favicon = faviconMatch?.[1] || null;

      // Resolve relative favicon URL
      if (favicon && !favicon.startsWith("http")) {
        const baseUrl = new URL(url);
        favicon = new URL(favicon, baseUrl.origin).toString();
      }

      return NextResponse.json({
        title,
        description,
        favicon,
        url,
      });
    } catch (fetchError) {
      clearTimeout(timeout);
      // Return partial data on fetch error
      return NextResponse.json({
        title: null,
        description: null,
        favicon: null,
        url,
      });
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
