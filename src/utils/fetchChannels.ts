import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

export interface YouTubeChannel {
    id: string;
    title: string;
    description: string;
    avatar: string;
    subscriberCount?: string;
}

export async function fetchChannels(keyword: string): Promise<YouTubeChannel[]> {
    if (!YT_API_KEY) return [];
    const musicKeyword = keyword.trim() + ' music';
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
    let statsMap: Record<string, string> = {};
    if (channelIds) {
        const statsRes = await axios.get(YT_CHANNELS_URL, {
            params: {
                key: YT_API_KEY,
                id: channelIds,
                part: 'statistics',
            },
        });
        (statsRes.data.items || []).forEach((item: any) => {
            statsMap[item.id] = item.statistics.subscriberCount;
        });
    }
    return items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        avatar: item.snippet.thumbnails.default.url || item.snippet.thumbnails.medium.url,
        subscriberCount: statsMap[item.id.channelId] || undefined,
    }));
} 