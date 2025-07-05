import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Type for a YouTube video returned by fetchSongs
 */
export type YouTubeVideo = {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
};

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

/**
 * Fallback: Fetches up to 100 music videos by keyword (videoCategoryId=10 for music).
 * @param keyword The search keyword
 * @returns Object with videos array and error string (if any)
 */
export async function fetchSongs(keyword: string): Promise<{ videos: YouTubeVideo[]; error?: string }> {
    try {
        // Fetch up to 50 music videos by keyword
        const res = await axios.get(YT_API_URL, {
            params: {
                part: 'snippet',
                type: 'video',
                videoCategoryId: 10, // Music
                q: keyword,
                maxResults: 50,
                order: 'date',
                key: YT_API_KEY,
            },
        });
        // Get video IDs
        const ids = res.data.items.map((item: any) => item.id.videoId).join(',');
        if (!ids) return { videos: [] };
        // Fetch video details (to get duration)
        const detailsRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,contentDetails',
                id: ids,
                key: YT_API_KEY,
            },
        });
        // Filter out Shorts (duration < 60s)
        const videos = detailsRes.data.items
            .filter((item: any) => {
                // Parse ISO 8601 duration to seconds
                const match = item.contentDetails.duration.match(/PT(\d+M)?(\d+S)?/);
                const min = match && match[1] ? parseInt(match[1]) : 0;
                const sec = match && match[2] ? parseInt(match[2]) : 0;
                return min > 0 || sec >= 60;
            })
            .map((item: any) => ({
                id: item.id,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url,
                duration: item.contentDetails.duration,
            }));
        return { videos };
    } catch (e) {
        return { videos: [], error: 'Failed to fetch music videos.' };
    }
} 