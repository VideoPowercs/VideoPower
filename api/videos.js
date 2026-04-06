const CHANNEL_ID = "UCVQXiCVDW0rF2a9pCv1pR-g";
const MAX_RESULTS = 4;

function formatDuration(duration) {
  const match = String(duration || "PT0S").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const h = Number.parseInt(match?.[1] || "0", 10);
  const m = Number.parseInt(match?.[2] || "0", 10);
  const s = Number.parseInt(match?.[3] || "0", 10);

  let result = "";
  if (h > 0) result += `${h} H `;
  if (m > 0) result += `${m} Min `;
  if (h === 0 && m === 0) result += `${s} Sec`;
  else if (s > 0) result += `${s} Sec`;
  return result.trim();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = String(process.env.YOUTUBE_API_KEY || "").trim();
  if (!apiKey) {
    return response.status(500).json({ error: "Missing YOUTUBE_API_KEY." });
  }

  try {
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.search = new URLSearchParams({
      key: apiKey,
      channelId: CHANNEL_ID,
      part: "snippet,id",
      order: "date",
      maxResults: String(MAX_RESULTS),
      type: "video"
    }).toString();

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search request failed with ${searchResponse.status}.`);
    }

    const searchData = await searchResponse.json();
    const videoIds = (searchData.items || []).map((item) => item.id?.videoId).filter(Boolean);

    if (!videoIds.length) {
      return response.status(200).json([]);
    }

    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.search = new URLSearchParams({
      key: apiKey,
      id: videoIds.join(","),
      part: "contentDetails"
    }).toString();

    const detailsResponse = await fetch(detailsUrl.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!detailsResponse.ok) {
      throw new Error(`Details request failed with ${detailsResponse.status}.`);
    }

    const detailsData = await detailsResponse.json();
    const durations = new Map(
      (detailsData.items || []).map((item) => [item.id, item.contentDetails?.duration || "PT0S"])
    );

    const videos = (searchData.items || [])
      .filter((item) => item.id?.videoId)
      .map((item) => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        image:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        date: formatDate(item.snippet.publishedAt),
        length: formatDuration(durations.get(item.id.videoId) || "PT0S")
      }));

    response.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    return response.status(200).json(videos);
  } catch (error) {
    return response.status(500).json({
      error: "Unable to fetch YouTube videos."
    });
  }
}
