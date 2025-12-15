import feedparser
from datetime import datetime, timezone, timedelta
from collections import defaultdict

from config.teams import TEAMS

HOURS_BACK = 24


def collect_youtube_mentions():
    since = datetime.now(timezone.utc) - timedelta(hours=HOURS_BACK)
    results = defaultdict(lambda: {"videos": 0})

    for team in TEAMS:
        query = team.replace(" ", "+")
        feed_url = f"https://www.youtube.com/feeds/videos.xml?search_query={query}"

        feed = feedparser.parse(feed_url)

        for entry in feed.entries:
            published = datetime.fromisoformat(
                entry.published.replace("Z", "+00:00")
            )

            if published < since:
                continue

            results[team]["videos"] += 1

    return results


if __name__ == "__main__":
    data = collect_youtube_mentions()

    print("Ranking YouTube (últimas 24h):")
    for team, info in sorted(
        data.items(),
        key=lambda x: x[1]["videos"],
        reverse=True
    ):
        print(f"{team}: {info['videos']} vídeos")
