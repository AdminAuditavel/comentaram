import requests
from datetime import datetime, timedelta
from collections import defaultdict

from config.teams import TEAMS

SUBREDDITS = ["futebol"]
HOURS_BACK = 24
USER_AGENT = "PulsoEsportivoBot/0.1"


def normalize(text):
    return text.lower()


def fetch_posts(subreddit):
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit=100"
    headers = {"User-Agent": USER_AGENT}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    return response.json()["data"]["children"]


def collect_mentions():
    since = datetime.utcnow() - timedelta(hours=HOURS_BACK)
    mentions = defaultdict(int)

    for subreddit in SUBREDDITS:
        posts = fetch_posts(subreddit)

        for post in posts:
            data = post["data"]
            created = datetime.utcfromtimestamp(data["created_utc"])
            if created < since:
                continue

            content = normalize(
                f"{data.get('title', '')} {data.get('selftext', '')}"
            )

            for team in TEAMS:
                if normalize(team) in content:
                    mentions[team] += 1

    return mentions


if __name__ == "__main__":
    result = collect_mentions()

    print("Menções nas últimas 24h:")
    for team, count in sorted(result.items(), key=lambda x: x[1], reverse=True):
        print(f"{team}: {count}")
