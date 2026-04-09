export async function handler(event) {
  const keyword = event.queryStringParameters.q || "社工";
  const source = event.queryStringParameters.source || "all";

  const results = [];
  let message = "";

  // NEWS
  if (source === "all" || source === "news") {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    const res = await fetch(url);
    const text = await res.text();

    const items = text.split("<item>").slice(1);

    items.slice(0, 5).forEach(item => {
      const title = item.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";

      results.push({
        title,
        url: link,
        domain: new URL(link).hostname,
        source: "新聞",
        type: "news"
      });
    });
  }

  // THREADS
  if ((source === "all" || source === "threads") && process.env.THREADS_ACCESS_TOKEN) {
    try {
      const threadsRes = await fetch(
        `https://graph.threads.net/keyword_search?q=${encodeURIComponent(keyword)}&search_type=TOP&limit=5&access_token=${process.env.THREADS_ACCESS_TOKEN}`
      );

      const json = await threadsRes.json();

      (json.data || []).forEach(post => {
        results.push({
          title: post.text?.slice(0, 80) || "Threads貼文",
          url: post.permalink,
          domain: "threads.net",
          source: "Threads",
          type: "threads"
        });
      });

      message = "包含 Threads 結果";
    } catch (e) {
      message = "Threads 載入失敗";
    }
  } else if (source === "threads") {
    message = "尚未設定 Threads API";
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: results, meta: { message } })
  };
}