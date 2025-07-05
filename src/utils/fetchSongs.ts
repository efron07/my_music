import axios from 'axios';

const YT_API_KEY = process.env.NEXT_PUBLIC_YT_API_KEY;
const YT_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
}

export interface FetchSongsResult {
    videos: YouTubeVideo[];
    error?: string;
}

export async function fetchSongs(keyword: string): Promise<FetchSongsResult> {
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
                q: keyword,
                part: 'snippet',
                type: 'video',
                maxResults: 50,
                pageToken: nextPageToken || undefined,
            };
            const res = await axios.get(YT_API_URL, { params });
            const items = res.data.items || [];
            videos = videos.concat(
                items.map((item: any) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                }))
            );
            nextPageToken = res.data.nextPageToken;
            if (!nextPageToken) break;
        }
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