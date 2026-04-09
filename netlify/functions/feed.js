export async function handler(event) {
  const keyword = event.queryStringParameters.q || "社工";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;

  const res = await fetch(url);
  const text = await res.text();

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/xml" },
    body: text
  };
}