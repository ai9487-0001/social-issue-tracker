async function loadData(keyword = "社工") {
  const source = document.getElementById("sourceSelect").value;
  document.getElementById("statusText").innerText = "載入中...";

  const res = await fetch(`/.netlify/functions/feed?q=${encodeURIComponent(keyword)}&source=${source}`);
  const data = await res.json();

  const cards = document.getElementById("cards");
  cards.innerHTML = "";

  if (!data.items.length) {
    document.getElementById("emptyState").classList.remove("hidden");
    return;
  }

  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("statusText").innerText = data.meta.message || "";
  document.getElementById("resultCount").innerText = `共 ${data.items.length} 筆`;

  data.items.forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="source">來源：${item.source}</div>
      <div class="title">${item.title}</div>
      <div class="summary">${item.time || ""}</div>
      <div class="link-row">
        <a class="link-btn" href="${item.url}" target="_blank">查看原文</a>
        <span class="origin-url">${item.domain}</span>
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