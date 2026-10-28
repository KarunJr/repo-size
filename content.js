const button = document.getElementById("refresh");
const nameElement = document.getElementById("repo-name");
const sizeElement = document.getElementById("repo-size");
const statusElement = document.getElementById("status");

function formatSize(sizeInKb) {
  const sizeInBytes = sizeInKb * 1024;
  if (sizeInBytes < 1_000_000) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(sizeInBytes)} B`;
  }
  const sizeInMb = sizeInBytes / 1_000_000;
  if (sizeInMb < 1000) {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(sizeInMb)} MB`;
  }
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(sizeInMb / 1000)} GB`;
}

async function loadRepoSize() {
  button.disabled = true;
  button.textContent = "Checking…";
  statusElement.classList.remove("error");
  statusElement.textContent = "Looking up repository size…";

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab?.url) throw new Error("I couldn't read the active tab. Try reopening the popup.");

    const pageUrl = new URL(tab.url);
    const segments = pageUrl.pathname.split("/").filter(Boolean);
    if (pageUrl.hostname !== "github.com" || segments.length < 2) {
      throw new Error("Open a GitHub repository page to see its size.");
    }

    const [owner, repo] = segments;
    const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    if (response.status === 404) throw new Error("Repository not found or not publicly accessible.");
    if (response.status === 403 || response.status === 429) {
      throw new Error("GitHub API rate limit reached. Please try again shortly.");
    }
    if (!response.ok) throw new Error(`GitHub returned an error (${response.status}). Please try again.`);

    const data = await response.json();
    nameElement.textContent = data.full_name;
    sizeElement.textContent = formatSize(data.size);
    statusElement.textContent = "Approximate size reported by GitHub.";
  } catch (error) {
    nameElement.textContent = "—";
    sizeElement.textContent = "—";
    statusElement.textContent = error instanceof Error ? error.message : "Couldn't load repository size.";
    statusElement.classList.add("error");
  } finally {
    button.disabled = false;
    button.textContent = "Check again";
  }
}

button.addEventListener("click", loadRepoSize);
loadRepoSize();
