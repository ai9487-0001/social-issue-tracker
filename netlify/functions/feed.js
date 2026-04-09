export async function handler(event) {
  const keyword = event.queryStringParameters.q || "社工";
  const source = event.queryStringParameters.source || "all";

  const results = [];
  const debug = {
    keyword,
    source,
    hasToken: Boolean(process.env.THREADS_ACCESS_TOKEN),
    threadsStatus: null,
    threadsError: null,
    threadsCount: 0,
    threadsRawKeys: [],
    threadsRawPreview: null
  };

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

  if (source === "all" || source === "threads") {
    if (!process.env.THREADS_ACCESS_TOKEN) {
      debug.threadsError = "THREADS_ACCESS_TOKEN 未設定";
    } else {
      try {
        const apiUrl = `https://graph.threads.net/keyword_search?q=${encodeURIComponent(keyword)}&search_type=TOP&limit=5&access_token=${process.env.THREADS_ACCESS_TOKEN}`;
        const threadsRes = await fetch(apiUrl);
        debug.threadsStatus = threadsRes.status;

        const rawText = await threadsRes.text();
        debug.threadsRawPreview = rawText.slice(0, 500);

        let json = {};
        try {
          json = JSON.parse(rawText);
        } catch {
          debug.threadsError = "Threads 回傳不是 JSON";
        }

        debug.threadsRawKeys = Object.keys(json || {});

        if (json.error) {
          debug.threadsError = typeof json.error === "string"
            ? json.error
            : json.error.message || JSON.stringify(json.error);
        }

        if (Array.isArray(json.data)) {
          debug.threadsCount = json.data.length;
          json.data.forEach(post => {
            const permalink = post.permalink || post.url || post.link;
            if (!permalink) return;
            results.push({
              title: (post.text || post.caption || "Threads貼文").slice(0, 80),
              url: permalink,
              domain: "threads.net",
              source: "Threads",
              type: "threads"
            });
          });
        } else if (!debug.threadsError) {
          debug.threadsError = "Threads 回傳中沒有 data 陣列";
        }
      } catch (e) {
        debug.threadsError = e instanceof Error ? e.message : String(e);
      }
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: results, debug })
  };
}
