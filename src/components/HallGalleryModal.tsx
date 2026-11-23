import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Images,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { VenueHall } from '../data/menuData';

interface CustomHallVideo {
  id: string;
  title: string;
  url: string;
}

type StoredHallVideos = Record<string, CustomHallVideo[]>;

const STORAGE_KEY = 'bz_hall_custom_videos_v1';
const SCENE_DURATION_MS = 6000;
const PROGRESS_TICK_MS = 100;

function loadStoredVideos(): StoredHallVideos {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStoredVideos(data: StoredHallVideos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota issues gracefully
  }
}

function parseVideoEmbed(url: string):
  | { type: 'youtube'; embedUrl: string }
  | { type: 'vimeo'; embedUrl: string }
  | { type: 'direct'; src: string }
  | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const watchId = parsed.searchParams.get('v');
      if (watchId) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(watchId)}?rel=0`,
        };
      }
      const pathMatch = parsed.pathname.match(/^\/(embed|shorts)\/([^/?#]+)/);
      if (pathMatch?.[2]) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(pathMatch[2])}?rel=0`,
        };
      }
    }

    if (host === 'youtu.be') {
      const shortId = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (shortId) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(shortId)}?rel=0`,
        };
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const vimeoMatch = parsed.pathname.match(/\/(\d+)/);
      if (vimeoMatch?.[1]) {
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        };
      }
    }

    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return { type: 'direct', src: trimmed };
    }
  } catch {
    return null;
  }

  return null;
}

interface HallGalleryModalProps {
  hall: VenueHall | null;
  isSelected: boolean;
  totalGuests: number;
  selectionDisabled?: boolean;
  onClose: () => void;
  onSelectHall: (hallName: string) => void;
}

export const HallGalleryModal: React.FC<HallGalleryModalProps> = ({
  hall,
  isSelected,
  totalGuests,
  selectionDisabled = false,
  onClose,
  onSelectHall,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Virtual walkthrough reel state
  const [reelSceneIndex, setReelSceneIndex] = useState(0);
  const [reelPlaying, setReelPlaying] = useState(true);
  const [reelProgressMs, setReelProgressMs] = useState(0);
  const [reelRunKey, setReelRunKey] = useState(0);

  // Venue custom video links state (persisted in localStorage per hall)
  const [allCustomVideos, setAllCustomVideos] = useState<StoredHallVideos>(() => loadStoredVideos());
  const [showAddVideoForm, setShowAddVideoForm] = useState(false);
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoFormError, setVideoFormError] = useState<string | null>(null);

  // Reset modal view state whenever a different hall is opened
  useEffect(() => {
    if (!hall) return;
    setActiveTab('photos');
    setPhotoIndex(0);
    setReelSceneIndex(0);
    setReelPlaying(true);
    setReelProgressMs(0);
    setReelRunKey((k) => k + 1);
    setShowAddVideoForm(false);
    setVideoTitleInput('');
    setVideoUrlInput('');
    setVideoFormError(null);
  }, [hall?.id]);

  // Escape key & scroll lock
  useEffect(() => {
    if (!hall) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (activeTab === 'photos' && hall.photos.length > 1) {
        if (e.key === 'ArrowRight') {
          setPhotoIndex((prev) => (prev + 1) % hall.photos.length);
        } else if (e.key === 'ArrowLeft') {
          setPhotoIndex((prev) => (prev - 1 + hall.photos.length) % hall.photos.length);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hall, activeTab, onClose]);

  // Auto-advance virtual walkthrough reel when Videos tab is active & playing
  useEffect(() => {
    if (!hall || activeTab !== 'videos' || !reelPlaying || hall.photos.length === 0) return;

    const timer = window.setInterval(() => {
      setReelProgressMs((prev) => {
        const next = prev + PROGRESS_TICK_MS;
        if (next >= SCENE_DURATION_MS) {
          setReelSceneIndex((s) => (s + 1) % hall.photos.length);
          setReelRunKey((k) => k + 1);
          return 0;
        }
        return next;
      });
    }, PROGRESS_TICK_MS);

    return () => window.clearInterval(timer);
  }, [hall, activeTab, reelPlaying]);

  if (!hall) return null;

  const hallVideos = allCustomVideos[hall.id] || [];
  const currentPhoto = hall.photos[photoIndex] || hall.photos[0];
  const currentReelScene = hall.photos[reelSceneIndex] || hall.photos[0];
  const tooSmall = totalGuests > hall.maxCapacity;
  const canSelect = !tooSmall && !selectionDisabled;
  const reelProgressPct = Math.min(100, (reelProgressMs / SCENE_DURATION_MS) * 100);

  const handlePrevPhoto = () => {
    setPhotoIndex((prev) => (prev - 1 + hall.photos.length) % hall.photos.length);
  };

  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % hall.photos.length);
  };

  const handleJumpReelScene = (idx: number) => {
    setReelSceneIndex(idx);
    setReelProgressMs(0);
    setReelRunKey((k) => k + 1);
    setReelPlaying(true);
  };

  const handleRestartReel = () => {
    setReelSceneIndex(0);
    setReelProgressMs(0);
    setReelRunKey((k) => k + 1);
    setReelPlaying(true);
  };

  const handleAddCustomVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseVideoEmbed(videoUrlInput);
    if (!parsed) {
      setVideoFormError('Enter a valid YouTube, Vimeo, or direct MP4/WebM video URL (starting with https://).');
      return;
    }

    const newVideo: CustomHallVideo = {
      id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: videoTitleInput.trim() || `${hall.name} Walkthrough Video`,
      url: videoUrlInput.trim(),
    };

    const nextAll: StoredHallVideos = {
      ...allCustomVideos,
      [hall.id]: [...hallVideos, newVideo],
    };
    setAllCustomVideos(nextAll);
    saveStoredVideos(nextAll);
    setVideoTitleInput('');
    setVideoUrlInput('');
    setVideoFormError(null);
    setShowAddVideoForm(false);
  };

  const handleDeleteCustomVideo = (videoId: string) => {
    const nextAll: StoredHallVideos = {
      ...allCustomVideos,
      [hall.id]: hallVideos.filter((v) => v.id !== videoId),
    };
    setAllCustomVideos(nextAll);
    saveStoredVideos(nextAll);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hall-gallery-title"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-3xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3
              id="hall-gallery-title"
              className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight"
            >
              {hall.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 tabular-nums">
              {hall.capacitySummary} &middot; {hall.recommendationNote}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hall gallery"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50/70 flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'photos'
                ? 'border-[#25408F] text-[#25408F]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>Photos ({hall.photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'videos'
                ? 'border-[#25408F] text-[#25408F]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>
              Videos &amp; Walkthrough{hallVideos.length > 0 ? ` (${hallVideos.length + 1})` : ''}
            </span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'photos' ? (
            <div className="space-y-3.5">
              {/* Primary Photo Viewer */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                {!failedImages[currentPhoto.src] ? (
                  <img
                    src={currentPhoto.src}
                    alt={`${hall.name} — ${currentPhoto.title}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [currentPhoto.src]: true }))
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                    <Images className="w-8 h-8 mb-2 opacity-70" />
                    <div className="text-sm font-semibold">{hall.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{currentPhoto.title}</div>
                  </div>
                )}

                {hall.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/65 hover:bg-slate-950/85 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/65 hover:bg-slate-950/85 text-white flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent px-4 pt-8 pb-3.5 text-white flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-snug">{currentPhoto.title}</div>
                    <div className="text-xs text-slate-200 mt-0.5 line-clamp-2">
                      {currentPhoto.caption}
                    </div>
                  </div>
                  <div className="text-xs font-semibold tabular-nums shrink-0 text-slate-200">
                    {photoIndex + 1} / {hall.photos.length}
                  </div>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {hall.photos.map((photo, idx) => {
                  const active = idx === photoIndex;
                  return (
                    <button
                      key={photo.src}
                      type="button"
                      onClick={() => setPhotoIndex(idx)}
                      className={`group text-left rounded-xl overflow-hidden border transition-all bg-white ${
                        active
                          ? 'border-[#25408F] ring-2 ring-[#25408F]/30'
                          : 'border-slate-200 hover:border-slate-400 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                        <img
                          src={photo.src}
                          alt={photo.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="px-2.5 py-2 text-xs font-semibold text-slate-800 truncate">
                        {photo.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Interactive Virtual Walkthrough Reel */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#25408F]" />
                    <span>{hall.name} — Virtual Walkthrough Preview</span>
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    Scene {reelSceneIndex + 1} of {hall.photos.length}
                  </span>
                </div>

                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                  <img
                    key={`${hall.id}-${reelSceneIndex}-${reelRunKey}`}
                    src={currentReelScene.src}
                    alt={`${hall.name} walkthrough — ${currentReelScene.title}`}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      reelSceneIndex % 2 === 0 ? 'animate-hall-pan-a' : 'animate-hall-pan-b'
                    } ${reelPlaying ? '' : 'hall-pan-paused'}`}
                  />

                  {/* Top Scene Progress Segments */}
                  <div className="absolute top-3 inset-x-3 flex items-center gap-1.5">
                    {hall.photos.map((scene, idx) => (
                      <button
                        key={scene.src}
                        type="button"
                        onClick={() => handleJumpReelScene(idx)}
                        aria-label={`Jump to scene ${idx + 1}: ${scene.title}`}
                        className="h-1.5 flex-1 rounded-full bg-white/30 overflow-hidden cursor-pointer"
                      >
                        <div
                          className="h-full bg-white transition-[width] duration-100 ease-linear"
                          style={{
                            width:
                              idx < reelSceneIndex
                                ? '100%'
                                : idx === reelSceneIndex
                                ? `${reelProgressPct}%`
                                : '0%',
                          }}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Bottom Walkthrough Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent px-4 pt-10 pb-3.5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold leading-snug">
                        {currentReelScene.title}
                      </div>
                      <div className="text-xs text-slate-200 mt-0.5">
                        {currentReelScene.caption}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReelPlaying((p) => !p)}
                        className="h-9 px-3.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {reelPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Play</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleRestartReel}
                        aria-label="Restart walkthrough"
                        className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Venue Uploaded / Linked Real Walkthrough Videos */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Venue Walkthrough Clips</div>
                    <div className="text-xs text-slate-600">
                      Attach a YouTube, Vimeo, or direct MP4 video tour for {hall.name}.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddVideoForm((prev) => !prev);
                      setVideoFormError(null);
                    }}
                    className="h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddVideoForm ? 'Cancel' : 'Add Video Link'}</span>
                  </button>
                </div>

                {showAddVideoForm && (
                  <form
                    onSubmit={handleAddCustomVideo}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Video Label (optional)
                        </label>
                        <input
                          type="text"
                          value={videoTitleInput}
                          onChange={(e) => setVideoTitleInput(e.target.value)}
                          placeholder={`e.g. ${hall.name} Full Tour`}
                          className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#25408F]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Video URL (YouTube, Vimeo, or MP4)
                        </label>
                        <input
                          type="url"
                          required
                          value={videoUrlInput}
                          onChange={(e) => setVideoUrlInput(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or https://.../tour.mp4"
                          className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#25408F]"
                        />
                      </div>
                    </div>

                    {videoFormError && (
                      <div className="text-xs font-medium text-rose-700">{videoFormError}</div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-lg bg-[#25408F] hover:bg-[#1b3173] text-white text-xs font-bold transition-colors"
                      >
                        Save Video to {hall.name}
                      </button>
                    </div>
                  </form>
                )}

                {hallVideos.length > 0 && (
                  <div className="space-y-3">
                    {hallVideos.map((vid) => {
                      const embed = parseVideoEmbed(vid.url);
                      return (
                        <div
                          key={vid.id}
                          className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                        >
                          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {vid.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomVideo(vid.id)}
                              aria-label={`Remove ${vid.title}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="aspect-[16/9] w-full bg-slate-950">
                            {embed?.type === 'youtube' || embed?.type === 'vimeo' ? (
                              <iframe
                                src={embed.embedUrl}
                                title={vid.title}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : embed?.type === 'direct' ? (
                              <video
                                src={embed.src}
                                controls
                                playsInline
                                className="w-full h-full object-contain bg-black"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-slate-300 p-4">
                                Unable to preview this video link.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hall Details Summary */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5">
            <p className="text-sm text-slate-700 leading-relaxed">{hall.tagline}</p>
            <p className="text-xs font-medium text-slate-600">
              {hall.highlights.join(' · ')}
            </p>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-safe">
          <div className="text-xs font-semibold tabular-nums">
            {tooSmall ? (
              <span className="text-rose-700">
                Too small for your current {totalGuests} guests (max {hall.maxCapacity})
              </span>
            ) : totalGuests > hall.recommendedMax ? (
              <span className="text-amber-800">
                Fits {totalGuests} guests (above {hall.recommendedMax} recommended)
              </span>
            ) : (
              <span className="text-emerald-700">
                Great fit for your {totalGuests} guests
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-sm font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!canSelect || isSelected}
              onClick={() => {
                onSelectHall(hall.name);
                onClose();
              }}
              className={`h-11 px-5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${
                isSelected && !tooSmall
                  ? 'bg-emerald-700 text-white cursor-default'
                  : canSelect
                  ? 'bg-[#25408F] hover:bg-[#1b3173] text-white'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isSelected && !tooSmall ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Selected</span>
                </>
              ) : (
                <span>Select {hall.name}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
