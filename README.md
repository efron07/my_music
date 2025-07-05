# Brain Music BM

A minimal, modern YouTube music playlist app built with Next.js 14, TypeScript, and TailwindCSS.

## Features
- Search for music artists, albums, or songs (channels are filtered for music content)
- Confirm/select the intended YouTube channel before loading videos
- Fetch up to 100 recent music videos from the selected channel (no Shorts)
- Auto-playing playlist with YouTube iFrame Player API
- Next/Previous controls, current video title display
- Fallback to keyword-based music video search if no channel found
- Channel subscriber count shown in selection
- Mobile responsive, dark theme, minimal UI
- No ads, no comments, no clutter

## Setup
1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd <your-repo-folder>
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up YouTube Data API Key:**
   - Create a `.env.local` file in the root directory.
   - Add your API key:
     ```env
     NEXT_PUBLIC_YT_API_KEY=your_youtube_api_key_here
     ```
   - [Get a YouTube Data API v3 key](https://console.developers.google.com/apis/library/youtube.googleapis.com)
4. **Run the app:**
   ```bash
   npm run dev
   ```

## How It Works
- **Step 1:** Enter an artist, album, or song name. The app searches for music-related YouTube channels (by appending "music" to your keyword).
- **Step 2:** Select the intended channel from the list (shows name, avatar, description, and subscriber count).
- **Step 3:** The app fetches up to 100 recent music videos from that channel (filters out Shorts, only videos >= 60s).
- If no channel is found, the app falls back to a keyword-based music video search (using `videoCategoryId: 10`).
- The playlist auto-plays, and you can use Next/Prev controls.

## YouTube Data API Usage
- **Channel Search:**
  - Uses `type=channel` and appends "music" to the keyword for music-focused results.
  - Fetches channel statistics (subscriber count) via the `channels.list` endpoint.
- **Channel Videos:**
  - Uses `type=video`, `order=date`, and `channelId` to fetch recent uploads.
  - Fetches video details to filter out Shorts (duration < 60s).
- **Fallback Video Search:**
  - Uses `type=video`, `videoCategoryId=10` (Music), and the keyword for general music video search.
- **Playback:**
  - Uses the YouTube iFrame Player API for seamless, auto-playing playlists.

## Utility Functions
- `utils/fetchChannels.ts`: Search for music-related channels by keyword, returns id, title, description, avatar, and subscriber count.
- `utils/fetchChannelVideos.ts`: Fetch up to 100 recent music videos from a channel, filters out Shorts.
- `utils/fetchSongs.ts`: Fallback, fetches up to 100 music videos by keyword (videoCategoryId=10).

## Development
- Built with Next.js 14 (App Router), TypeScript, TailwindCSS
- All API logic is in `/src/utils/`
- Responsive and mobile-friendly

---

**Enjoy a focused, ad-free YouTube music experience!**
