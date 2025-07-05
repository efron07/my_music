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

export async function fetchSongs(channelName: string): Promise<FetchSongsResult> {
    if (!YT_API_KEY) {
        return { videos: [], error: 'YouTube API key is missing.' };
    }

    let videos: YouTubeVideo[] = [];
    let error = '';

    try {
        // Step 1: Find channelId by channel name
        const channelRes = await axios.get(YT_SEARCH_URL, {
            params: {
                key: YT_API_KEY,
                q: channelName,
                type: 'channel',
                part: 'snippet',
                maxResults: 1,
            },
        });
        const channelId = channelRes.data.items?.[0]?.id?.channelId;
        if (!channelId) {
            return { videos: [], error: 'Channel not found.' };
        }

        // Step 2: Fetch videos from the channel
        let nextPageToken = '';
        let videoIds: string[] = [];
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
        // Step 3: Fetch video details to filter out shorts
        let filteredVideos: YouTubeVideo[] = [];
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
            filteredVideos = filteredVideos.concat(
                items
                    .filter((item: any) => {
                        const duration = parseISO8601Duration(item.contentDetails.duration);
                        return duration >= 60; // Only videos >= 60s (not shorts)
                    })
                    .map((item: any) => ({
                        id: item.id,
                        title: item.snippet.title,
                        thumbnail: item.snippet.thumbnails.medium.url,
                        publishedAt: item.snippet.publishedAt,
                    }))
            );
        }
        // Sort by publishedAt descending (newest first)
        filteredVideos.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
        videos = filteredVideos;
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