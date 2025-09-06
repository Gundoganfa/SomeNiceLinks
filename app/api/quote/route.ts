import { NextResponse } from "next/server";

export const revalidate = 60; // 60 sn cache (isteğe göre ayarla)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "SNGYO.IS";
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;

  try {
    const r = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache"
      },
      next: { revalidate: 60 },
    });

    if (!r.ok) {
      return NextResponse.json({ error: `Yahoo ${r.status}` }, { status: r.status });
    }
    const data = await r.json();
    const item = data?.quoteResponse?.result?.[0];

    if (!item) {
      return NextResponse.json({ error: "symbol_not_found" }, { status: 404 });
    }

    // Frontend'e temiz bir payload dön
    return NextResponse.json({
      symbol: item.symbol,
      shortName: item.shortName,
      currency: item.currency,
      regularMarketPrice: item.regularMarketPrice,
      regularMarketChange: item.regularMarketChange,
      regularMarketChangePercent: item.regularMarketChangePercent,
      regularMarketTime: item.regularMarketTime, // epoch (saniye)
      exchange: item.fullExchangeName,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fetch_failed" }, { status: 500 });
  }
}
