import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';

/**
 * Type for a YouTube video returned by fetchChannelVideos
 */
export type YouTubeVideo = {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
};

function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetches up to 100 recent music videos from a channel, filtering out Shorts (<60s).
 * @param channelId The YouTube channel ID
 * @returns Array of YouTubeVideo objects
 */
export async function fetchChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
    if (!YT_API_KEY) return [];
    // Fetch up to 100 recent videos from the channel
    const res = await axios.get(YT_SEARCH_URL, {
        params: {
            key: YT_API_KEY,
            channelId,
            part: 'snippet',
            type: 'video',
            order: 'date',
            maxResults: 50,
        },
    });
    // Get video IDs
    const videoIds = res.data.items.map((item: any) => item.id.videoId).join(',');
    if (!videoIds) return [];
    // Fetch video details (to get duration)
    const detailsRes = await axios.get(YT_VIDEOS_URL, {
        params: {
            key: YT_API_KEY,
            id: videoIds,
            part: 'snippet,contentDetails',
        },
    });
    // Filter out Shorts (duration < 60s)
    return detailsRes.data.items
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
} 