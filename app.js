async function loadData(keyword = "社工") {
  const source = document.getElementById("sourceSelect").value;

  const res = await fetch(`/.netlify/functions/feed?q=${encodeURIComponent(keyword)}&source=${source}`);
  const data = await res.json();

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  if (!data.items.length) {
    const debug = data.debug || {};
    cards.innerHTML = `
      <div class="card">
        <div class="title">目前沒有資料（查看 debug）</div>
        <pre style="white-space:pre-wrap;font-size:12px;color:#666;">
${JSON.stringify(debug, null, 2)}
        </pre>
      </div>
    `;
    return;
  }

  data.items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="meta">
        <span class="source">${item.source}</span>
        <span class="domain">${item.domain}</span>
      </div>
      <div class="title">${item.title}</div>
      <div class="link-row">
        <a class="link-btn" href="${item.url}" target="_blank">查看原文</a>
      </div>
    `;

    cards.appendChild(div);
  });
}

document.getElementById("searchBtn").onclick = () => {
  const val = document.getElementById("keywordInput").value;
  loadData(val || "社工");
};

loadData();
