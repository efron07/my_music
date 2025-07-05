import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

/**
 * Type for a YouTube channel returned by fetchChannels
 */
export type YouTubeChannel = {
    id: string;
    title: string;
    description: string;
    avatar: string;
    subscriberCount?: number;
};

/**
 * Fetches a list of YouTube channels matching the keyword, appending 'music' for music focus.
 * Also fetches subscriber count for each channel.
 * @param keyword The search keyword (artist, album, etc.)
 * @returns Array of YouTubeChannel objects
 */
export async function fetchChannels(keyword: string): Promise<YouTubeChannel[]> {
    if (!YT_API_KEY) return [];
    // Compose the search query, appending 'music' for better results
    const musicKeyword = keyword.trim() + ' music';
    // Fetch channels from YouTube Data API
    const res = await axios.get(YT_API_URL, {
        params: {
            key: YT_API_KEY,
            q: musicKeyword,
            type: 'channel',
            part: 'snippet',
            maxResults: 10,
        },
    });
    const items = res.data.items || [];
    const channelIds = items.map((item: any) => item.id.channelId).join(",");
    if (!channelIds) return [];
    // Fetch channel details (including subscriber count)
    const statsRes = await axios.get(YT_CHANNELS_URL, {
        params: {
            key: YT_API_KEY,
            id: channelIds,
            part: 'statistics',
        },
    });
    // Map API response to YouTubeChannel objects
    return items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        avatar: item.snippet.thumbnails.default.url || item.snippet.thumbnails.medium.url,
        subscriberCount: statsRes.data.items.find((i: any) => i.id === item.id.channelId)?.statistics.subscriberCount || undefined,
    }));
} 