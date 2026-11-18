'use client';

import React, { useState } from 'react';

export type LiveStreamStatus = 'ended' | 'scheduled' | 'live';

export interface LiveStreamItem {
  id: string;
  title: string;
  host: string;
  status: LiveStreamStatus;
  viewers: number;
  productsCount: number;
}

const INITIAL_STREAMS: LiveStreamItem[] = [
  // Exact rows matching the screenshot
  {
    id: 'stream-1',
    title: 'Headphones & Audio · Live',
    host: '—',
    status: 'ended',
    viewers: 157,
    productsCount: 6,
  },
  {
    id: 'stream-2',
    title: 'Car & Auto · Live',
    host: '—',
    status: 'scheduled',
    viewers: 194,
    productsCount: 6,
  },
  {
    id: 'stream-3',
    title: 'Baby Essentials · Live',
    host: '—',
    status: 'live',
    viewers: 231,
    productsCount: 6,
  },
  {
    id: 'stream-4',
    title: 'Bags & Wallets · Live',
    host: '—',
    status: 'scheduled',
    viewers: 268,
    productsCount: 6,
  },
  {
    id: 'stream-5',
    title: 'Beauty Flash Deals · Live',
    host: '—',
    status: 'scheduled',
    viewers: 305,
    productsCount: 5,
  },
  {
    id: 'stream-6',
    title: 'Bedding & Bath · Live',
    host: '—',
    status: 'live',
    viewers: 342,
    productsCount: 6,
  },
  {
    id: 'stream-7',
    title: 'Tech Under $50 · Live',
    host: '—',
    status: 'scheduled',
    viewers: 379,
    productsCount: 6,
  },

  // Additional streams bringing total to 30 streams
  {
    id: 'stream-8',
    title: "Women's Fashion · Live",
    host: '—',
    status: 'scheduled',
    viewers: 416,
    productsCount: 8,
  },
  {
    id: 'stream-9',
    title: "Men's Apparel & Streetwear · Live",
    host: '—',
    status: 'live',
    viewers: 453,
    productsCount: 6,
  },
  {
    id: 'stream-10',
    title: 'Kitchen & Cookware Showcase · Live',
    host: '—',
    status: 'scheduled',
    viewers: 490,
    productsCount: 7,
  },
  {
    id: 'stream-11',
    title: 'Footwear & Sneakers Drop · Live',
    host: '—',
    status: 'ended',
    viewers: 527,
    productsCount: 5,
  },
  {
    id: 'stream-12',
    title: 'Smart Home & Living · Live',
    host: '—',
    status: 'scheduled',
    viewers: 564,
    productsCount: 6,
  },
  {
    id: 'stream-13',
    title: 'Jewelry & Luxury Watches · Live',
    host: '—',
    status: 'scheduled',
    viewers: 601,
    productsCount: 4,
  },
  {
    id: 'stream-14',
    title: 'Gaming & Esports Gear · Live',
    host: '—',
    status: 'live',
    viewers: 638,
    productsCount: 9,
  },
  {
    id: 'stream-15',
    title: 'Fitness & Workout Apparel · Live',
    host: '—',
    status: 'scheduled',
    viewers: 675,
    productsCount: 6,
  },
  {
    id: 'stream-16',
    title: 'Outdoor & Camping Gear · Live',
    host: '—',
    status: 'scheduled',
    viewers: 712,
    productsCount: 5,
  },
  {
    id: 'stream-17',
    title: 'Pet Supplies & Accessories · Live',
    host: '—',
    status: 'ended',
    viewers: 749,
    productsCount: 6,
  },
  {
    id: 'stream-18',
    title: 'Skin Care & Organic Wellness · Live',
    host: '—',
    status: 'live',
    viewers: 786,
    productsCount: 8,
  },
  {
    id: 'stream-19',
    title: 'Office Setup & Productivity · Live',
    host: '—',
    status: 'scheduled',
    viewers: 823,
    productsCount: 6,
  },
  {
    id: 'stream-20',
    title: 'Toys, Hobbies & Collectibles · Live',
    host: '—',
    status: 'scheduled',
    viewers: 860,
    productsCount: 7,
  },
  {
    id: 'stream-21',
    title: 'Art, Crafting & DIY Supplies · Live',
    host: '—',
    status: 'scheduled',
    viewers: 897,
    productsCount: 4,
  },
  {
    id: 'stream-22',
    title: 'Gourmet Snacks & Artisan Coffee · Live',
    host: '—',
    status: 'ended',
    viewers: 934,
    productsCount: 6,
  },
  {
    id: 'stream-23',
    title: 'Luggage & Travel Essentials · Live',
    host: '—',
    status: 'scheduled',
    viewers: 971,
    productsCount: 5,
  },
  {
    id: 'stream-24',
    title: 'Seasonal Deals & Clearance · Live',
    host: '—',
    status: 'live',
    viewers: 1008,
    productsCount: 12,
  },
  {
    id: 'stream-25',
    title: 'Nutritional Supplements & Health · Live',
    host: '—',
    status: 'scheduled',
    viewers: 1045,
    productsCount: 6,
  },
  {
    id: 'stream-26',
    title: 'Designer Eyewear & Sunglasses · Live',
    host: '—',
    status: 'scheduled',
    viewers: 1082,
    productsCount: 4,
  },
  {
    id: 'stream-27',
    title: 'Mobile Accessories & Fast Chargers · Live',
    host: '—',
    status: 'scheduled',
    viewers: 1119,
    productsCount: 6,
  },
  {
    id: 'stream-28',
    title: 'Smartwatches & Fitness Bands · Live',
    host: '—',
    status: 'ended',
    viewers: 1156,
    productsCount: 5,
  },
  {
    id: 'stream-29',
    title: 'Handcrafted Leather Bags · Live',
    host: '—',
    status: 'scheduled',
    viewers: 1193,
    productsCount: 6,
  },
  {
    id: 'stream-30',
    title: 'Lighting & Modern Home Decor · Live',
    host: '—',
    status: 'scheduled',
    viewers: 1230,
    productsCount: 7,
  },
];

interface AdminLiveStreamsViewProps {
  notify?: (msg: string) => void;
}

export function AdminLiveStreamsView({ notify }: AdminLiveStreamsViewProps) {
  const [streams, setStreams] = useState<LiveStreamItem[]>(INITIAL_STREAMS);

  const handleGoLive = (id: string, title: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'live', viewers: s.viewers + 15 } : s))
    );
    notify?.(`"${title}" is now broadcasting live`);
  };

  const handleEndStream = (id: string, title: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'ended' } : s))
    );
    notify?.(`"${title}" has ended`);
  };

  const renderStatusBadge = (status: LiveStreamStatus) => {
    switch (status) {
      case 'ended':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#f3f4f6] text-[#4b5563] select-none">
            ended
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#fef3c7] text-[#92400e] select-none">
            scheduled
          </span>
        );
      case 'live':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-[#ffe4e6] text-[#be123c] select-none">
            live
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Card Header: Title & Total Streams Count */}
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Live Streams
          </h1>
          <span className="text-sm text-gray-500 font-normal">
            {streams.length} streams
          </span>
        </div>

        {/* Streams Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs sm:text-[13px] font-semibold text-gray-600 bg-white">
                <th className="py-3.5 px-6 sm:px-8 font-semibold w-[35%]">Title</th>
                <th className="py-3.5 px-4 font-semibold w-[15%]">Host</th>
                <th className="py-3.5 px-4 font-semibold w-[15%]">Status</th>
                <th className="py-3.5 px-4 font-semibold w-[12%]">Viewers</th>
                <th className="py-3.5 px-4 font-semibold w-[10%]">Product</th>
                <th className="py-3.5 px-6 sm:px-8 font-semibold text-right w-[13%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 text-xs sm:text-sm">
              {streams.map((stream) => (
                <tr
                  key={stream.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  {/* Title */}
                  <td className="py-4 px-6 sm:px-8 text-gray-800 font-medium whitespace-nowrap">
                    {stream.title}
                  </td>

                  {/* Host */}
                  <td className="py-4 px-4 text-gray-400 font-medium whitespace-nowrap">
                    {stream.host}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {renderStatusBadge(stream.status)}
                  </td>

                  {/* Viewers */}
                  <td className="py-4 px-4 text-gray-600 font-normal whitespace-nowrap">
                    {stream.viewers}
                  </td>

                  {/* Product */}
                  <td className="py-4 px-4 text-gray-600 font-normal whitespace-nowrap">
                    {stream.productsCount}
                  </td>

                  {/* Action Button */}
                  <td className="py-4 px-6 sm:px-8 text-right whitespace-nowrap">
                    {stream.status === 'scheduled' && (
                      <button
                        type="button"
                        onClick={() => handleGoLive(stream.id, stream.title)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#18181b] hover:bg-black text-white transition-colors shadow-2xs min-w-[68px] text-center"
                      >
                        Go live
                      </button>
                    )}

                    {stream.status === 'live' && (
                      <button
                        type="button"
                        onClick={() => handleEndStream(stream.id, stream.title)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-gray-300 transition-colors shadow-2xs min-w-[68px] text-center"
                      >
                        End
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
