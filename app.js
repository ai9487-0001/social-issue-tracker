async function loadData(keyword = "社工") {
  const res = await fetch(`/.netlify/functions/feed?q=${encodeURIComponent(keyword)}`);
  const xml = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const items = Array.from(doc.querySelectorAll("item"));

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  items.slice(0,10).forEach(item => {
    const title = item.querySelector("title")?.textContent;
    const link = item.querySelector("link")?.textContent;
    const pubDate = item.querySelector("pubDate")?.textContent;

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="title">${title}</div>
      <div class="summary">${pubDate}</div>
      <a class="link-btn" href="${link}" target="_blank">查看原文</a>
    `;
    cards.appendChild(div);
  });
}

document.getElementById("searchBtn").onclick = () => {
  const val = document.getElementById("keywordInput").value;
  loadData(val || "社工");
};

loadData();