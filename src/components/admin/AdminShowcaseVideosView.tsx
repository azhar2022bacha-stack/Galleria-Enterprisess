'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Eye,
  Heart,
  MousePointer,
  ShoppingBag,
  TrendingUp,
  Filter,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export interface ShowcaseVideoItem {
  id: string;
  title: string;
  status: 'published' | 'unpublished';
  product: string;
  productFull: string;
  storeOwner: string;
  storeOwnerFull: string;
  views: number;
  likes: number;
  clicks: number;
  orders: number;
  conv: string;
  duration?: string;
  thumbnailColor?: string;
}

// Generate the 100 showcase videos with the exact initial rows from screenshot
const INITIAL_VIDEOS: ShowcaseVideoItem[] = [
  {
    id: 'vid-1',
    title: 'Store owner pick of the day',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_marcus...',
    storeOwnerFull: 'cr_marcus_vance_92',
    views: 4476,
    likes: 742,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:34',
    thumbnailColor: 'from-amber-700 to-orange-900',
  },
  {
    id: 'vid-2',
    title: 'Unboxing this',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_sophia...',
    storeOwnerFull: 'cr_sophia_chen_04',
    views: 6258,
    likes: 835,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:48',
    thumbnailColor: 'from-emerald-700 to-teal-900',
  },
  {
    id: 'vid-3',
    title: 'Real review, no filter',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_marcus...',
    storeOwnerFull: 'cr_marcus_vance_92',
    views: 4660,
    likes: 646,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:52',
    thumbnailColor: 'from-sky-700 to-indigo-900',
  },
  {
    id: 'vid-4',
    title: 'Trending right now',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_marcus...',
    storeOwnerFull: 'cr_marcus_vance_92',
    views: 5759,
    likes: 617,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:29',
    thumbnailColor: 'from-rose-700 to-pink-900',
  },
  {
    id: 'vid-5',
    title: 'Store owner pick of the day',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_yuki...',
    storeOwnerFull: 'cr_yuki_tanaka_18',
    views: 5421,
    likes: 89,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:41',
    thumbnailColor: 'from-purple-700 to-violet-900',
  },
  {
    id: 'vid-6',
    title: 'Store owner pick of the day',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: 'cr_sophia...',
    storeOwnerFull: 'cr_sophia_chen_04',
    views: 1415,
    likes: 539,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:38',
    thumbnailColor: 'from-blue-700 to-cyan-900',
  },
  {
    id: 'vid-7',
    title: 'Galleria Enterprises daily find',
    status: 'published',
    product: 'prod_01KZF...',
    productFull: 'prod_01KZFA88H6NMS7XPW',
    storeOwner: '01KY2Y8TZW...',
    storeOwnerFull: '01KY2Y8TZWV4R90A7',
    views: 2543,
    likes: 401,
    clicks: 0,
    orders: 0,
    conv: '0%',
    duration: '0:45',
    thumbnailColor: 'from-amber-600 to-yellow-800',
  },
  // Additional videos to total exactly 100
  ...Array.from({ length: 93 }, (_, i) => {
    const idx = i + 8;
    const sampleTitles = [
      'Must-have seasonal staple',
      'Daily outfit inspiration',
      'How I style this piece',
      'Unboxing and first impression',
      'Behind the counter showcase',
      'Weekly best seller spotlight',
      'Quick review & sizing guide',
      'Premium craft in detail',
    ];
    const owners = ['cr_marcus...', 'cr_sophia...', 'cr_yuki...', 'cr_adams...', '01KY2Y8TZW...'];
    const views = Math.floor(1200 + ((idx * 347) % 5200));
    const likes = Math.floor(views * 0.12);
    return {
      id: `vid-${idx}`,
      title: sampleTitles[idx % sampleTitles.length],
      status: (idx % 25 === 0 ? 'unpublished' : 'published') as 'published' | 'unpublished',
      product: 'prod_01KZF...',
      productFull: `prod_01KZFA88H6NMS${idx}PW`,
      storeOwner: owners[idx % owners.length],
      storeOwnerFull: `creator_${owners[idx % owners.length].replace(/\./g, '')}_full`,
      views,
      likes,
      clicks: Math.floor(views * 0.04),
      orders: Math.floor(views * 0.005),
      conv: (views > 0 && idx % 7 === 0 ? '1.2%' : '0%'),
      duration: `0:${25 + (idx % 35)}`,
      thumbnailColor: 'from-slate-700 to-zinc-900',
    };
  }),
];

interface AdminShowcaseVideosViewProps {
  notify?: (msg: string) => void;
}

export function AdminShowcaseVideosView({ notify }: AdminShowcaseVideosViewProps) {
  const [videos, setVideos] = useState<ShowcaseVideoItem[]>(INITIAL_VIDEOS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Video preview modal state
  const [previewVideo, setPreviewVideo] = useState<ShowcaseVideoItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Filtered dataset
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.storeOwner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.product.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [videos, searchQuery, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVideos.slice(start, start + itemsPerPage);
  }, [filteredVideos, currentPage]);

  const handleToggleStatus = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const newStatus = v.status === 'published' ? 'unpublished' : 'published';
          notify?.(
            `"${v.title}" has been ${newStatus === 'published' ? 'published' : 'unpublished'}.`
          );
          if (previewVideo && previewVideo.id === id) {
            setPreviewVideo({ ...previewVideo, status: newStatus });
          }
          return { ...v, status: newStatus };
        }
        return v;
      })
    );
  };

  const handleRefresh = () => {
    notify?.('Showcase video metrics and feeds refreshed.');
  };

  const publishedCount = videos.filter((v) => v.status === 'published').length;
  const unpublishedCount = videos.filter((v) => v.status === 'unpublished').length;

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        
        {/* Header Row */}
        <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Showcase Videos
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              {videos.length} videos
            </span>
          </div>
        </div>

        {/* Better-Way Search & Filter Bar */}
        <div className="px-6 sm:px-8 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search videos, creators, or products..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({videos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('published');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'published'
                    ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('unpublished');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  statusFilter === 'unpublished'
                    ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Unpublished ({unpublishedCount})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-colors"
              title="Refresh videos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-600 font-semibold bg-white">
                <th className="py-3.5 px-6 font-semibold w-[22%]">Title</th>
                <th className="py-3.5 px-4 font-semibold w-[10%]">Status</th>
                <th className="py-3.5 px-4 font-semibold w-[12%]">Product</th>
                <th className="py-3.5 px-4 font-semibold w-[12%]">Store Owner</th>
                <th className="py-3.5 px-4 font-semibold w-[8%]">Views</th>
                <th className="py-3.5 px-4 font-semibold w-[8%]">Likes</th>
                <th className="py-3.5 px-4 font-semibold w-[6%]">Clicks</th>
                <th className="py-3.5 px-4 font-semibold w-[6%]">Orders</th>
                <th className="py-3.5 px-4 font-semibold w-[6%]">Conv.</th>
                <th className="py-3.5 px-6 font-semibold text-right w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {paginatedVideos.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setPreviewVideo(item)}
                  className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                >
                  {/* Title */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors shrink-0">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </div>
                      <span className="font-semibold text-gray-900 group-hover:text-black">
                        {item.title}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {item.status === 'published' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#d1fae5] text-[#065f46]">
                        published
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                        unpublished
                      </span>
                    )}
                  </td>

                  {/* Product */}
                  <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {item.product}
                  </td>

                  {/* Store Owner */}
                  <td className="py-3.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {item.storeOwner}
                  </td>

                  {/* Views */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.views.toLocaleString()}
                  </td>

                  {/* Likes */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.likes.toLocaleString()}
                  </td>

                  {/* Clicks */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.clicks}
                  </td>

                  {/* Orders */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.orders}
                  </td>

                  {/* Conv. */}
                  <td className="py-3.5 px-4 text-gray-700">
                    {item.conv}
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(item.id, e)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors shadow-2xs ${
                        item.status === 'published'
                          ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                          : 'bg-[#18181b] border-[#18181b] text-white hover:bg-black'
                      }`}
                    >
                      {item.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedVideos.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No videos match your search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination Controls */}
        <div className="px-6 sm:px-8 py-3.5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredVideos.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-800">{filteredVideos.length}</span> videos
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-md font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      {/* Video Preview Modal (Better Way Enhancement) */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">Video Player Preview</span>
                {previewVideo.status === 'published' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#d1fae5] text-[#065f46]">
                    published
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                    unpublished
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Video Player Screen */}
            <div className="relative aspect-[9/14] sm:aspect-[9/13] max-h-[380px] bg-black mx-auto overflow-hidden flex flex-col justify-between p-4 text-white">
              {/* Top Bar inside player */}
              <div className="flex items-center justify-between text-xs z-10">
                <span className="font-mono bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs text-[11px]">
                  {previewVideo.duration}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xs transition-colors"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Animated Center Play/Pause button */}
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className={`w-14 h-14 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 transition-transform ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100 scale-105'}`}>
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </div>
              </button>

              {/* Bottom Video Info inside player */}
              <div className="z-10 space-y-2">
                <div>
                  <h3 className="font-bold text-sm tracking-tight drop-shadow-md">
                    {previewVideo.title}
                  </h3>
                  <p className="text-[11px] text-gray-300 font-mono drop-shadow">
                    By @{previewVideo.storeOwner} · Product: {previewVideo.product}
                  </p>
                </div>

                {/* Scrubber bar */}
                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div className={`h-full bg-white transition-all ${isPlaying ? 'w-2/3' : 'w-1/3'}`} />
                </div>
              </div>
            </div>

            {/* Performance Metrics inside modal */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Views</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {previewVideo.views.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Likes</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {previewVideo.likes.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Clicks</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {previewVideo.clicks}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-medium">Orders</span>
                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                    {previewVideo.orders}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-gray-500 font-mono">
                  Conversion: {previewVideo.conv}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(previewVideo.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      previewVideo.status === 'published'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {previewVideo.status === 'published' ? 'Unpublish Video' : 'Publish Video'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
