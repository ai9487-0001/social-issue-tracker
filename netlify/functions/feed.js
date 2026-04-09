export async function handler(event) {
  const keyword = event.queryStringParameters.q || "社工";
  const source = event.queryStringParameters.source || "all";

  const threadsEnabled = process.env.THREADS_ENABLED === "true";
  const threadsMode = process.env.THREADS_MODE || "off";
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
    threadsEnabled,
    threadsMode,
    trackedUsernames,
    hasToken: Boolean(process.env.THREADS_ACCESS_TOKEN),
    threadsError: null,
    threadsStatus: null,
    threadsProfileLookups: [],
    threadsRawPreview: null
  };

  // 新聞
  if (source === "all" || source === "news") {
    try {
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
    } catch (e) {
      debug.newsError = e instanceof Error ? e.message : String(e);
    }
  }

  // Threads
  if (source === "all" || source === "threads") {
    if (!threadsEnabled) {
      debug.threadsError = "Threads 功能關閉（THREADS_ENABLED=false）";
    } else if (!process.env.THREADS_ACCESS_TOKEN) {
      debug.threadsError = "THREADS_ACCESS_TOKEN 未設定";
    } else if (threadsMode === "accounts") {
      if (!trackedUsernames.length) {
        debug.threadsError = "THREADS_USERNAMES 未設定或為空";
      } else {
        try {
          for (const username of trackedUsernames) {
            const lookupUrl =
              `https://graph.threads.net/profile_lookup?username=${encodeURIComponent(username)}&access_token=${process.env.THREADS_ACCESS_TOKEN}`;

            const lookupRes = await fetch(lookupUrl);
            debug.threadsStatus = lookupRes.status;

            const lookupText = await lookupRes.text();
            debug.threadsRawPreview = lookupText.slice(0, 300);

            let lookupJson = {};
            try {
              lookupJson = JSON.parse(lookupText);
            } catch {
              lookupJson = { raw: lookupText };
            }

            debug.threadsProfileLookups.push({
              username,
              status: lookupRes.status,
              keys: Object.keys(lookupJson || {}),
              preview: lookupText.slice(0, 200)
            });

            if (!lookupRes.ok || !lookupJson?.id) {
              continue;
            }

            const userId = lookupJson.id;
            const threadsUrl =
              `https://graph.threads.net/${userId}/threads?fields=id,text,timestamp,permalink,username&limit=5&access_token=${process.env.THREADS_ACCESS_TOKEN}`;

            const threadsRes = await fetch(threadsUrl);
            debug.threadsStatus = threadsRes.status;

            const threadsText = await threadsRes.text();
            debug.threadsRawPreview = threadsText.slice(0, 400);

            let threadsJson = {};
            try {
              threadsJson = JSON.parse(threadsText);
            } catch {
              threadsJson = { raw: threadsText };
            }

            if (threadsJson.error) {
              debug.threadsError =
                typeof threadsJson.error === "string"
                  ? threadsJson.error
                  : threadsJson.error.message || JSON.stringify(threadsJson.error);
              continue;
            }

            if (Array.isArray(threadsJson.data)) {
              threadsJson.data.forEach(post => {
                const text = post.text || "Threads貼文";
                const permalink = post.permalink;
                if (!permalink) return;

                if (keyword && !text.includes(keyword) && !username.includes(keyword.replace(/^@/, ""))) {
                  return;
                }

                results.push({
                  title: text.slice(0, 80),
                  url: permalink,
                  domain: "threads.net",
                  source: `Threads @${username}`,
                  type: "threads"
                });
              });
            }
          }

          if (!results.some(r => r.type === "threads") && !debug.threadsError) {
            debug.threadsError = "指定帳號模式已啟用，但目前沒有抓到符合條件的 Threads 資料";
          }
        } catch (e) {
          debug.threadsError = e instanceof Error ? e.message : String(e);
        }
      }
    } else if (threadsMode === "off") {
      debug.threadsError = "Threads 模式關閉（THREADS_MODE=off）";
    } else {
      debug.threadsError = `未知的 THREADS_MODE: ${threadsMode}`;
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: results, debug })
  };
}
