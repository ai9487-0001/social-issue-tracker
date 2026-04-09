export async function handler(event) {
  const keyword = event.queryStringParameters.q || "社工";
  const source = event.queryStringParameters.source || "all";

  const trackedUsernames = (process.env.THREADS_USERNAMES || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const results = [];

  const debug = {
    version: "v1.2",
    updatedAt: "2026-04-09",
    keyword,
    source,
    trackedUsernames,
    hasToken: Boolean(process.env.THREADS_ACCESS_TOKEN),
    threadsError: null
  };

  // 新聞
  if (source === "all" || source === "news") {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    const res = await fetch(url);
    const text = await res.text();

    const items = text.split("<item>").slice(1);

    items.slice(0, 5).forEach(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";

      if (!link) return;

      results.push({
        title,
        url: link,
        domain: new URL(link).hostname,
        source: "新聞",
        type: "news"
      });
    });
  }

  // Threads（目前只顯示狀態）
  if (source === "all" || source === "threads") {
    if (!process.env.THREADS_ACCESS_TOKEN) {
      debug.threadsError = "THREADS_ACCESS_TOKEN 未設定";
    } else if (!trackedUsernames.length) {
      debug.threadsError = "THREADS_USERNAMES 未設定";
    } else {
      debug.threadsError = "目前 Threads API 權限不足（正常現象）";
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: results, debug })
  };
}
