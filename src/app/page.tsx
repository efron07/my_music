"use client";
import { useState, useRef, useEffect } from "react";
import { fetchChannels, YouTubeChannel } from "@/utils/fetchChannels";
import { fetchChannelVideos, YouTubeVideo } from "@/utils/fetchChannelVideos";

const PLAYLIST_WIDTH = 370;
const ACCENT_COLOR = '#2563eb';

/**
 * YouTubePlayer component
 * Uses the YouTube iFrame Player API to play a video by ID and auto-play next on end.
 */
function YouTubePlayer({ videoId, onEnd }: { videoId: string; onEnd: () => void }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayer = useRef<any>(null);
  const playerId = useRef(`yt-player-${videoId}`);

  useEffect(() => {
    let isMounted = true;
    function createPlayer() {
      if (!playerRef.current) return;
      ytPlayer.current = new (window as any).YT.Player(playerId.current, {
        height: "100%",
        width: "100%",
        videoId,
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0 && isMounted) onEnd(); // 0 = ended
          },
        },
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
      });
    }
    // Load the YouTube iFrame API if not already loaded
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }
    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (ytPlayer.current && ytPlayer.current.destroy) {
        ytPlayer.current.destroy();
        ytPlayer.current = null;
      }
      if (playerRef.current) {
        playerRef.current.innerHTML = "";
      }
    };
  }, [videoId, onEnd]);

  return (
    <div
      ref={playerRef}
      id={playerId.current}
      className="w-full h-full"
      style={{ aspectRatio: '16/9', background: '#000', borderRadius: '18px' }}
    />
  );
}

/**
 * Main app component for Brain Music BM
 * Handles the 3-step flow: search channel, confirm channel, watch playlist
 */
export default function Home() {
  // Step state: 1 = search, 2 = confirm, 3 = playlist
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Search keyword
  const [keyword, setKeyword] = useState("");
  // List of found channels
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  // Selected/confirmed channel
  const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null);
  // Playlist of videos (from channel or fallback)
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  // Index of current video in playlist
  const [current, setCurrent] = useState(0);
  // Loading and error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Fallback mode: true if using keyword-based video search
  const [fallbackMode, setFallbackMode] = useState(false);

  // On mount: load last selected channel from localStorage
  useEffect(() => {
    const last = localStorage.getItem("bm_last_channel");
    if (last) {
      try {
        const parsed = JSON.parse(last);
        setSelectedChannel(parsed);
        setStep(3);
      } catch { }
    }
  }, []);

  // Save selected channel to localStorage
  useEffect(() => {
    if (selectedChannel) {
      localStorage.setItem("bm_last_channel", JSON.stringify(selectedChannel));
    }
  }, [selectedChannel]);

  // When a channel is selected, fetch its videos
  useEffect(() => {
    if (step === 3 && selectedChannel) {
      setLoading(true);
      setError("");
      setFallbackMode(false);
      fetchChannelVideos(selectedChannel.id)
        .then((videos) => {
          if (videos.length === 0) {
            setError("No videos found for this channel.");
          }
          setPlaylist(videos);
          setCurrent(0);
        })
        .catch(() => setError("Failed to fetch channel videos."))
        .finally(() => setLoading(false));
    }
  }, [step, selectedChannel]);

  /**
   * Fallback: If no channel found, search for music videos by keyword (videoCategoryId=10)
   */
  async function fallbackKeywordSearch() {
    setLoading(true);
    setError("");
    setFallbackMode(true);
    setSelectedChannel(null);
    setStep(3);
    const { fetchSongs } = await import("@/utils/fetchSongs");
    const { videos, error } = await fetchSongs(keyword);
    if (error) setError(error);
    setPlaylist(videos);
    setCurrent(0);
    setLoading(false);
  }

  /**
   * Step 1: Search for channels by keyword (artist, album, song)
   */
  const handleChannelSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setChannels([]);
    setSelectedChannel(null);
    setPlaylist([]);
    setCurrent(0);
    setFallbackMode(false);
    setStep(1);
    try {
      const found = await fetchChannels(keyword);
      if (found.length === 0) {
        setChannels([]);
        setStep(2);
        setTimeout(fallbackKeywordSearch, 1000); // fallback after showing empty
      } else {
        setChannels(found);
        setStep(2);
      }
    } catch {
      setError("Failed to search channels.");
    }
    setLoading(false);
  };

  /**
   * Step 2: Confirm/select channel from list
   */
  const handleSelectChannel = (ch: YouTubeChannel) => {
    setSelectedChannel(ch);
    setStep(3);
  };

  /**
   * Playlist controls: previous, next, select, and auto-next on end
   */
  const handlePrev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const handleNext = () => setCurrent((c) => (c < playlist.length - 1 ? c + 1 : c));
  const handleSelect = (idx: number) => setCurrent(idx);
  const handleEnd = () => handleNext();

  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center font-sans">
      {/* Header: app name and search bar */}
      <div className="w-full flex items-center justify-between py-6 bg-[#181818] sticky top-0 z-30 border-b border-neutral-800">
        <div className="flex-1 flex items-center">
          <span className="text-2xl font-extrabold tracking-tight pl-6" style={{ color: ACCENT_COLOR }}>
            Brain Music BM
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          {/* Step 1: Search input */}
          <form onSubmit={handleChannelSearch} className="flex w-full max-w-xl gap-2">
            <input
              className="flex-1 rounded-l-full px-4 py-2 bg-[#222] border border-[#333] focus:outline-none focus:ring-2"
              style={{ boxShadow: `0 0 0 2px ${ACCENT_COLOR}33` }}
              placeholder="Search for an artist or channel name"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-r-full px-6 py-2 font-bold transition-colors text-base sm:text-lg"
              style={{ background: ACCENT_COLOR, color: '#fff' }}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
        <div className="flex-1" />
      </div>
      {/* Step labels for user flow */}
      <div className="w-full max-w-3xl mx-auto mt-6 mb-2 px-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm sm:text-base font-semibold">
          <span className={step === 1 ? "text-white" : "text-gray-400"}>Step 1: Search Channel</span>
          <span className={step === 2 ? "text-white" : "text-gray-400"}>Step 2: Confirm Channel</span>
          <span className={step === 3 ? "text-white" : "text-gray-400"}>Step 3: Watch Playlist</span>
        </div>
      </div>
      {/* Step 2: Channel selection list */}
      {step === 2 && !fallbackMode && (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
          {channels.length === 0 && (
            <div className="text-gray-400 text-center">No channels found. Falling back to general video search...</div>
          )}
          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-4 bg-[#232323] rounded-lg p-4 shadow hover:bg-[#222c3a] transition cursor-pointer" onClick={() => handleSelectChannel(ch)}>
              <img src={ch.avatar} alt={ch.title} className="w-14 h-14 rounded-full border-2 border-[#333]" />
              <div className="flex-1">
                <div className="font-bold text-lg flex items-center gap-2" style={{ color: ACCENT_COLOR }}>
                  {ch.title}
                  {ch.subscriberCount && (
                    <span className="text-xs font-normal text-gray-300 ml-2">• {Number(ch.subscriberCount).toLocaleString()} subscribers</span>
                  )}
                </div>
                <div className="text-gray-400 text-sm line-clamp-2">{ch.description}</div>
              </div>
              <button className="ml-4 px-4 py-2 rounded bg-[#2563eb] text-white font-bold hover:bg-blue-700 transition">Select</button>
            </div>
          ))}
        </div>
      )}
      {/* Step 3: Playlist and player */}
      <div className="flex-1 w-full flex flex-col md:flex-row justify-center items-start max-w-[1800px] mx-auto px-0 md:px-6 py-6 gap-0 md:gap-6">
        {/* Video player and controls */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-start">
          {step === 3 && playlist.length > 0 && (
            <div className="w-full max-w-5xl mx-auto" style={{ minWidth: 0 }}>
              {/* Current video title */}
              <div className="mb-2 text-lg font-bold text-center" style={{ color: ACCENT_COLOR }}>
                {playlist[current]?.title}
              </div>
              <YouTubePlayer videoId={playlist[current]?.id} onEnd={handleEnd} />
              <div className="flex justify-between items-center w-full mt-4 gap-2">
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  className="px-5 py-2 rounded-full font-bold disabled:opacity-40 transition-all text-base"
                  style={{ background: '#222', color: '#fff', border: `1px solid ${ACCENT_COLOR}` }}
                >
                  ◀ Prev
                </button>
                <span className="text-base font-semibold text-white/80">
                  {current + 1} / {playlist.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={current === playlist.length - 1}
                  className="px-5 py-2 rounded-full font-bold disabled:opacity-40 transition-all text-base"
                  style={{ background: '#222', color: '#fff', border: `1px solid ${ACCENT_COLOR}` }}
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
          {loading && <div className="mt-8" style={{ color: ACCENT_COLOR }}>Loading...</div>}
          {error && <div className="text-red-400 mt-4 font-semibold text-base w-full text-center">{error}</div>}
          {fallbackMode && (
            <div className="mt-4 text-yellow-400 text-center font-semibold">No official channel found, showing general videos.</div>
          )}
        </div>
        {/* Playlist sidebar (desktop) */}
        {step === 3 && playlist.length > 0 && (
          <aside
            className="hidden md:flex flex-col items-start ml-0 md:ml-6"
            style={{ width: PLAYLIST_WIDTH, minWidth: PLAYLIST_WIDTH }}
          >
            <div className="w-full bg-[#212121] rounded-xl shadow-lg p-0 overflow-hidden max-h-[70vh] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-[#2563eb]/60 scrollbar-track-[#232323]">
              <ul className="flex flex-col gap-0 w-full">
                {playlist.map((video, idx) => (
                  <li
                    key={`${video.id || 'noid'}-${idx}`}
                    className={`flex items-center gap-3 px-2 py-2 cursor-pointer transition-all border-b border-[#232323] last:border-b-0 ${current === idx
                      ? 'bg-[#2563eb] text-white font-bold' : 'hover:bg-[#292929]'
                      }`}
                    onClick={() => handleSelect(idx)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded-md"
                    />
                    <span className="truncate text-base">{video.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
        {/* Playlist (mobile) */}
        {step === 3 && playlist.length > 0 && (
          <aside className="flex md:hidden flex-col w-full mt-6">
            <div className="w-full bg-[#212121] rounded-xl shadow-lg p-0 overflow-hidden max-h-[40vh] overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-[#2563eb]/60 scrollbar-track-[#232323]">
              <ul className="flex flex-col gap-0 w-full">
                {playlist.map((video, idx) => (
                  <li
                    key={`${video.id || 'noid'}-${idx}`}
                    className={`flex items-center gap-3 px-2 py-2 cursor-pointer transition-all border-b border-[#232323] last:border-b-0 ${current === idx
                      ? 'bg-[#2563eb] text-white font-bold' : 'hover:bg-[#292929]'
                      }`}
                    onClick={() => handleSelect(idx)}
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-10 object-cover rounded-md"
                    />
                    <span className="truncate text-base">{video.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
      {/* Footer */}
      <footer className="mt-8 mb-2 text-gray-400 text-xs text-center w-full">
        © {new Date().getFullYear()} • Brain Music BM • Developed by Brain Inc. <span style={{ color: ACCENT_COLOR }}>♪</span>
      </footer>
    </div>
  );
}
