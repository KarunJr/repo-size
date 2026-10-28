const button = document.getElementById("clickMe");
console.log("Script loaded!");

if (button) {
  button.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    if (!tab?.url) {
      console.log("No active tab found");
      return;
    }
    const url = new URL(tab.url);
    const segments = url.pathname.split("/").filter(Boolean);
    console.log("URL:", tab.url);
    console.log("Segments:", segments);

    if (url.hostname !== "github.com" || segments.length < 2) {
      console.log("Please open a GitHub repository");
      return;
    }

    const [owner, repo] = segments;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

    if (response.status === 404) {
      console.log("Repository not found or inaccessible");
      return;
    }

    if (!response.ok) {
      console.log("API error:", response.status);
      return;
    }

    const data = await response.json();
    console.log("Repository:", data.full_name);
    console.log("Size:", data.size, "KB");

    document.getElementById("repo-size").innerHTML = `<h2>Repo Size:${data.size / 1000} Mb</h2>`;
  });
}
