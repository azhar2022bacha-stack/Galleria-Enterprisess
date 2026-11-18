'use client';

import React from 'react';

export function AdminAnalyticsView() {
  const metrics = [
    { label: 'Orders', value: '—' },
    { label: 'Order GMV', value: '—' },
    { label: 'Store owner GMV', value: '—' },
    { label: 'Commission', value: '—' },
    { label: 'GMV share', value: '—' },
    { label: 'Active owners', value: '—' },
    { label: 'Videos', value: '—' },
    { label: 'Reviews', value: '—' },
  ];

  const topStoreOwners: { owner: string; gmv: string; commission: string }[] = [];
  const topVideos: { title: string; views: string; likes: string }[] = [];

  return (
    <div className="max-w-[1300px] mx-auto animate-fadeIn pb-12">
      {/* Outer Card */}
      <div className="bg-white rounded-xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Analytics
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Sample figures have been removed. Live analytics data is not connected yet.
          </p>
        </div>

        {/* 4x2 Metric Cards Grid */}
        <div className="p-6 sm:px-8 sm:pt-8 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white border border-gray-200/90 rounded-xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-center min-h-[110px]"
            >
              <div className="text-xs sm:text-sm font-semibold text-gray-500 mb-2">
                {m.label}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Side-by-Side Tables: Top Store Owners & Top Videos */}
        <div className="px-6 sm:px-8 pt-4 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Left: Top store owners */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 tracking-tight">
              Top store owners
            </h2>
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-600">
                    <th className="py-3 px-4 font-semibold">Store Owner</th>
                    <th className="py-3 px-4 font-semibold text-right">GMV</th>
                    <th className="py-3 px-4 font-semibold text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {topStoreOwners.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-500">No live store-owner analytics available yet.</td>
                    </tr>
                  ) : topStoreOwners.map((owner) => (
                    <tr
                      key={owner.owner}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                        {owner.owner}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-700 font-mono whitespace-nowrap">
                        {owner.gmv}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-700 font-mono whitespace-nowrap">
                        {owner.commission}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Top videos */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3 tracking-tight">
              Top videos
            </h2>
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-600">
                    <th className="py-3 px-4 font-semibold">Title</th>
                    <th className="py-3 px-4 font-semibold text-right">Views</th>
                    <th className="py-3 px-4 font-semibold text-right">Likes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {topVideos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-gray-500">No live video analytics available yet.</td>
                    </tr>
                  ) : topVideos.map((video) => (
                    <tr
                      key={video.title}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                        {video.title}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-700 font-mono whitespace-nowrap">
                        {video.views}
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-700 font-mono whitespace-nowrap">
                        {video.likes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
