"use client";
import { useState, useRef, useEffect } from "react";
import { fetchSongs, YouTubeVideo } from "@/utils/fetchSongs";

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
      className="w-full h-full aspect-video md:aspect-auto rounded-2xl shadow-2xl bg-black/80 backdrop-blur-lg border border-white/10 overflow-hidden"
    />
  );
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlaylist([]);
    setCurrent(0);
    const { videos, error } = await fetchSongs(keyword);
    if (error) setError(error);
    setPlaylist(videos);
    setLoading(false);
  };

  const handlePrev = () => setCurrent((c) => (c > 0 ? c - 1 : c));
  const handleNext = () => setCurrent((c) => (c < playlist.length - 1 ? c + 1 : c));
  const handleSelect = (idx: number) => setCurrent(idx);
  const handleEnd = () => handleNext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#191414] via-[#232526] to-[#1db954]/30 text-white flex flex-col items-center p-0 sm:p-0 font-sans">
      <header className="w-full px-2 sm:px-4 py-4 sm:py-6 flex flex-col items-center bg-black/60 backdrop-blur-md shadow-lg sticky top-0 z-30">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-[#1db954] drop-shadow-lg">YouTube Playlist</h1>
        <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2 mt-2">
          <input
            className="flex-1 rounded-l-full px-4 py-2 bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#1db954] text-white placeholder:text-white/60 text-base sm:text-lg"
            placeholder="Search for videos (e.g. diamond)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded-r-full px-4 sm:px-6 py-2 bg-[#1db954] hover:bg-[#1ed760] font-bold transition-colors shadow-md text-base sm:text-lg"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {error && <div className="text-red-400 mt-2 font-semibold text-sm sm:text-base">{error}</div>}
      </header>
      <main className="flex-1 w-full flex flex-col md:flex-row gap-0 md:gap-0 max-w-7xl mx-auto px-0 md:px-0 py-0 md:py-0 h-[calc(100vh-80px)] sm:h-[calc(100vh-96px)]">
        {/* Video Player (full height on desktop, full width on mobile) */}
        {playlist.length > 0 && (
          <section className="w-full md:w-2/3 lg:w-3/4 flex flex-col items-center md:items-stretch h-64 sm:h-96 md:h-full sticky md:top-[80px] sm:md:top-[96px] top-0 z-20 bg-transparent">
            <div className="flex-1 flex flex-col justify-center h-full w-full p-2 sm:p-4 md:p-6">
              <YouTubePlayer videoId={playlist[current]?.id} onEnd={handleEnd} />
            </div>
            <div className="flex justify-center md:justify-between w-full mt-2 sm:mt-4 gap-2 sm:gap-4 px-2 sm:px-4">
              <button
                onClick={handlePrev}
                disabled={current === 0}
                className="px-4 sm:px-6 py-2 rounded-full bg-white/10 hover:bg-[#1db954]/80 text-white font-bold shadow disabled:opacity-40 transition-all text-base sm:text-lg"
              >
                ◀ Prev
              </button>
              <span className="text-base sm:text-lg font-semibold text-white/80 self-center">
                {current + 1} / {playlist.length}
              </span>
              <button
                onClick={handleNext}
                disabled={current === playlist.length - 1}
                className="px-4 sm:px-6 py-2 rounded-full bg-white/10 hover:bg-[#1db954]/80 text-white font-bold shadow disabled:opacity-40 transition-all text-base sm:text-lg"
              >
                Next ▶
              </button>
            </div>
          </section>
        )}
        {/* Playlist */}
        {playlist.length > 0 && (
          <aside className="w-full md:w-1/3 lg:w-1/4 mt-4 md:mt-0 md:pl-2 max-h-[calc(100vh-80px)] sm:max-h-[calc(100vh-96px)] h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#1db954]/60 scrollbar-track-transparent bg-black/30 md:rounded-l-3xl">
            <ul className="flex flex-col gap-2 p-2 sm:p-4">
              {playlist.map((video, idx) => (
                <li
                  key={video.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-all shadow-md bg-white/5 hover:bg-[#1db954]/20 border border-transparent ${idx === current ? "bg-[#1db954]/80 text-black font-bold border-[#1db954] scale-105" : ""
                    }`}
                  onClick={() => handleSelect(idx)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-20 h-12 sm:w-24 sm:h-16 object-cover rounded-lg shadow"
                  />
                  <span className="truncate text-base sm:text-lg">{video.title}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
        {loading && <div className="mt-8 text-[#1db954] text-lg font-bold w-full text-center">Loading videos...</div>}
      </main>
      <footer className="mt-8 mb-2 text-gray-400 text-xs text-center w-full">
        Powered by YouTube Data API v3 & iFrame Player API. Inspired by Spotify. Built with Next.js 14 & TailwindCSS.
      </footer>
    </div>
  );
}
