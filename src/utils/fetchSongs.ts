import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt?: string;
}

export interface FetchSongsResult {
    videos: YouTubeVideo[];
    error?: string;
}

function parseISO8601Duration(duration: string): number {
    // Returns duration in seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchSongs(artistName: string): Promise<FetchSongsResult> {
    if (!YT_API_KEY) {
        return { videos: [], error: 'YouTube API key is missing.' };
    }

    let videos: YouTubeVideo[] = [];
    let nextPageToken = '';
    let error = '';

    try {
        for (let i = 0; i < 2; i++) {
            const params = {
                key: YT_API_KEY,
                q: artistName,
                part: 'snippet',
                type: 'video',
                videoCategoryId: 10, // music only
                maxResults: 50,
                pageToken: nextPageToken || undefined,
                order: 'date',
            };
            const res = await axios.get(YT_API_URL, { params });
            const items = res.data.items || [];
            videos = videos.concat(
                items.map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    publishedAt: item.snippet.publishedAt,
                }))
            );
            nextPageToken = res.data.nextPageToken;
            if (!nextPageToken) break;
        }
        // Sort by publishedAt descending (newest first)
        videos.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    } catch (e: any) {
        if (e.response && e.response.data && e.response.data.error) {
            error = e.response.data.error.message;
        } else {
            error = 'Failed to fetch videos.';
        }
        return { videos: [], error };
    }

    return { videos: videos.slice(0, 100), error: error || undefined };
} 