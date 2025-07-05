"use client";
import { useState, useRef, useEffect } from "react";
import { fetchSongs, YouTubeVideo } from "@/utils/fetchSongs";

const PAGE_SIZE = 10;
const PLAYLIST_WIDTH = 370; // px, similar to YouTube
const ACCENT_COLOR = '#2563eb'; // nice blue

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
            if (event.data === 0 && isMounted) onEnd();
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
    if (!(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      (window as any).onYouTubeIframeAPIReady = createPlayer;
    } else {
      createPlayer();
    }
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

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(playlist.length / PAGE_SIZE);
  const paginatedPlaylist = playlist.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlaylist([]);
    setCurrent(0);
    setPage(0);
    const { videos, error } = await fetchSongs(keyword);
    if (error) setError(error);
    setPlaylist(videos);
    setLoading(false);
  };

  const handlePrev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const handleNext = () => setCurrent((c) => (c < playlist.length - 1 ? c + 1 : c));
  const handleSelect = (idx: number) => setCurrent(page * PAGE_SIZE + idx);
  const handleEnd = () => handleNext();

  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col items-center font-sans">
      {/* Header: only search bar, above video */}
      <div className="w-full flex items-center justify-between py-6 bg-[#181818] sticky top-0 z-30 border-b border-neutral-800">
        <div className="flex-1 flex items-center">
          <span className="text-2xl font-extrabold tracking-tight pl-6" style={{ color: ACCENT_COLOR }}>
            Brain Music BM
          </span>
        </div>
        <div className="flex-1 flex justify-center">
          <form onSubmit={handleSearch} className="flex w-full max-w-xl gap-2">
            <input
              className="flex-1 rounded-l-full px-4 py-2 bg-[#222] border border-[#333] focus:outline-none focus:ring-2"
              style={{
                boxShadow: `0 0 0 2px ${ACCENT_COLOR}33`,
              }}
              placeholder="Search for videos (e.g. diamond)"
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
      {/* Main layout: video left, playlist right */}
      <div className="flex-1 w-full flex flex-col md:flex-row justify-center items-start max-w-[1800px] mx-auto px-0 md:px-6 py-6 gap-0 md:gap-6">
        {/* Video player */}
        <div className="flex-1 flex flex-col items-center md:items-start justify-start">
          {playlist.length > 0 && (
            <div className="w-full max-w-5xl mx-auto" style={{ minWidth: 0 }}>
              <YouTubePlayer videoId={playlist[current]?.id} onEnd={handleEnd} />
              <div className="flex justify-between items-center w-full mt-4 gap-2">
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  className="px-5 py-2 rounded-full bg-[#222] hover:bg-[#1db954]/80 text-white font-bold disabled:opacity-40 transition-all text-base"
                >
                  ◀ Prev
                </button>
                <span className="text-base font-semibold text-white/80">
                  {current + 1} / {playlist.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={current === playlist.length - 1}
                  className="px-5 py-2 rounded-full bg-[#222] hover:bg-[#1db954]/80 text-white font-bold disabled:opacity-40 transition-all text-base"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}
          {loading && <div className="mt-8 text-[#1db954] text-lg font-bold w-full text-center">Loading videos...</div>}
          {error && <div className="text-red-400 mt-4 font-semibold text-base w-full text-center">{error}</div>}
        </div>
        {/* Playlist */}
        {playlist.length > 0 && (
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
        {/* Mobile playlist below video */}
        {playlist.length > 0 && (
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
      <footer className="mt-8 mb-2 text-gray-400 text-xs text-center w-full">
        © {new Date().getFullYear()} • Brain Music BM • Developed by Brain Inc. <span style={{ color: ACCENT_COLOR }}>♪</span>
      </footer>
    </div>
  );
}
