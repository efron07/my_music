import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt?: string;
}

function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
    if (!YT_API_KEY) return [];
    let videoIds: string[] = [];
    let nextPageToken = '';
    for (let i = 0; i < 2; i++) {
        const params = {
            key: YT_API_KEY,
            channelId,
            part: 'snippet',
            type: 'video',
            maxResults: 50,
            pageToken: nextPageToken || undefined,
            order: 'date',
        };
        const res = await axios.get(YT_SEARCH_URL, { params });
        const items = res.data.items || [];
        videoIds = videoIds.concat(items.map((item: any) => item.id.videoId));
        nextPageToken = res.data.nextPageToken;
        if (!nextPageToken) break;
    }
    // Fetch video details to filter out shorts
    let videos: YouTubeVideo[] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
        const batchIds = videoIds.slice(i, i + 50);
        const detailsRes = await axios.get(YT_VIDEOS_URL, {
            params: {
                key: YT_API_KEY,
                id: batchIds.join(','),
                part: 'snippet,contentDetails',
                maxResults: 50,
            },
        });
        const items = detailsRes.data.items || [];
        videos = videos.concat(
            items
                .filter((item: any) => parseISO8601Duration(item.contentDetails.duration) >= 60)
                .map((item: any) => ({
                    id: item.id,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    publishedAt: item.snippet.publishedAt,
                }))
        );
    }
    videos.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    return videos.slice(0, 100);
} 