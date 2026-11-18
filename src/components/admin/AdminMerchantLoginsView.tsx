'use client';

import React, { useState } from 'react';

type LoginsTab = 'Overview' | 'Sessions' | 'Login attempts' | 'Actions' | 'By merchant';

interface SessionItem {
  id: string;
  merchantName: string;
  email: string;
  status: string;
  isProxied: boolean;
  ip: string;
  device: string;
  started: string;
  dwell: string;
  reqAct: string;
  flags: string;
}

const INITIAL_SESSIONS: SessionItem[] = [
  // Row 1 from screenshot
  {
    id: 'sess-1',
    merchantName: 'The Modern Essentials',
    email: 'simmid45@gmail.com',
    status: 'active',
    isProxied: true,
    ip: '127.0.0.1',
    device: 'Windows / Chrome / Desktop',
    started: '10/19/2026, 2:59:35 PM',
    dwell: '0s',
    reqAct: '2/0',
    flags: '—',
  },
  // Row 2 from screenshot
  {
    id: 'sess-2',
    merchantName: 'The Modern Essentials',
    email: 'simmid45@gmail.com',
    status: 'active',
    isProxied: true,
    ip: '127.0.0.1',
    device: 'Windows / Chrome / Desktop',
    started: '10/19/2026, 1:52:30 PM',
    dwell: '21m 33s',
    reqAct: '46/4',
    flags: '—',
  },
  // Additional sessions
  {
    id: 'sess-3',
    merchantName: 'Ansar collection',
    email: 'ansarkhan3363@gmail.com',
    status: 'active',
    isProxied: false,
    ip: '182.160.114.22',
    device: 'Android / Chrome / Mobile',
    started: '10/19/2026, 11:20:14 AM',
    dwell: '14m 02s',
    reqAct: '28/3',
    flags: '—',
  },
  {
    id: 'sess-4',
    merchantName: 'Azhar collection',
    email: 'ansarkhan363@gmail.com',
    status: 'active',
    isProxied: false,
    ip: '192.168.1.104',
    device: 'Windows / Chrome / Desktop',
    started: '10/19/2026, 10:04:18 AM',
    dwell: '35m 12s',
    reqAct: '62/8',
    flags: '—',
  },
  {
    id: 'sess-5',
    merchantName: 'Silva Trading Co',
    email: 'silva.trade@outlook.com',
    status: 'inactive',
    isProxied: false,
    ip: '104.28.192.14',
    device: 'macOS / Safari / Desktop',
    started: '10/18/2026, 6:15:40 PM',
    dwell: '8m 45s',
    reqAct: '19/2',
    flags: '—',
  },
];

interface AdminMerchantLoginsViewProps {
  notify?: (msg: string) => void;
}

export function AdminMerchantLoginsView({ notify }: AdminMerchantLoginsViewProps) {
  const [activeTab, setActiveTab] = useState<LoginsTab>('Overview');
  const [dateRange, setDateRange] = useState('30 days');
  const [sessions, setSessions] = useState<SessionItem[]>(INITIAL_SESSIONS);

  const handleRefresh = () => {
    setSessions(INITIAL_SESSIONS);
    notify?.('Telemetry and session logs refreshed.');
  };

  const handleTimelineClick = (merchantName: string) => {
    notify?.(`Activity timeline opened for ${merchantName}.`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* Outer Card Container matching screenshot */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
        
        {/* Header: Title and Subtitle */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Merchant Logins &amp; Activity
          </h1>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-4xl">
            Logins, dwell time, key actions and action timeline, with geo, foreign-location, new IP/device, concurrent IPs and failed-login signals. Real IP &amp; browser are forwarded from the storefront.
          </p>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="mt-3.5 mb-5 flex items-center gap-2.5">
          <select
            value={dateRange}
            onChange={(e) => {
              setDateRange(e.target.value);
              notify?.(`Date range filtered: ${e.target.value}`);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs cursor-pointer focus:outline-none"
          >
            <option value="Today">Today</option>
            <option value="7 days">7 days</option>
            <option value="30 days">30 days</option>
            <option value="90 days">90 days</option>
            <option value="All time">All time</option>
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            className="text-xs font-medium text-gray-700 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(['Overview', 'Sessions', 'Login attempts', 'Actions', 'By merchant'] as LoginsTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-[#18181b] text-white shadow-xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {/* Active today */}
          <div className="border border-gray-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">
              Active today
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 block mt-1.5">
              2
            </span>
          </div>

          {/* Logins OK (today) */}
          <div className="border border-gray-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">
              Logins OK (today)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 block mt-1.5">
              9
            </span>
          </div>

          {/* Logins failed (today) */}
          <div className="border border-gray-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">
              Logins failed (today)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 block mt-1.5">
              0
            </span>
          </div>

          {/* New sessions (today) */}
          <div className="border border-gray-200/90 rounded-xl p-4 sm:p-5 bg-white shadow-2xs">
            <span className="text-xs text-gray-500 font-medium block">
              New sessions (today)
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 block mt-1.5">
              9
            </span>
          </div>
        </div>

        {/* Recent sessions Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 tracking-tight">
            Recent sessions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-semibold bg-white">
                  <th className="py-3 px-3 font-semibold w-[25%]">Merchant</th>
                  <th className="py-3 px-3 font-semibold w-[15%]">IP · geo</th>
                  <th className="py-3 px-3 font-semibold w-[18%]">Device</th>
                  <th className="py-3 px-3 font-semibold w-[18%]">Started</th>
                  <th className="py-3 px-3 font-semibold w-[10%]">Dwell</th>
                  <th className="py-3 px-3 font-semibold w-[8%]">Req/Act</th>
                  <th className="py-3 px-3 font-semibold w-[6%]">Flags</th>
                  <th className="py-3 px-3 font-semibold text-right w-[10%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/80 text-xs">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Merchant */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-gray-900 text-xs sm:text-[13px]">
                        {sess.merchantName}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {sess.email} ·{' '}
                        <span className={sess.status === 'active' ? 'text-gray-500' : 'text-gray-400'}>
                          {sess.status}
                        </span>
                      </div>
                    </td>

                    {/* IP · geo */}
                    <td className="py-3.5 px-3">
                      {sess.isProxied && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#ffedd5] text-[#c2410c] border border-[#fed7aa] mb-0.5">
                          Proxied
                        </span>
                      )}
                      <div className="font-mono text-gray-500 text-[11px]">
                        {sess.ip}
                      </div>
                    </td>

                    {/* Device */}
                    <td className="py-3.5 px-3 text-gray-700">
                      {sess.device}
                    </td>

                    {/* Started */}
                    <td className="py-3.5 px-3 text-gray-700 whitespace-nowrap">
                      {sess.started}
                    </td>

                    {/* Dwell */}
                    <td className="py-3.5 px-3 text-gray-700 font-mono">
                      {sess.dwell}
                    </td>

                    {/* Req/Act */}
                    <td className="py-3.5 px-3 text-gray-700 font-mono">
                      {sess.reqAct}
                    </td>

                    {/* Flags */}
                    <td className="py-3.5 px-3 text-gray-400">
                      {sess.flags}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTimelineClick(sess.merchantName)}
                        className="text-xs font-semibold text-gray-800 hover:text-black hover:underline transition-colors"
                      >
                        Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
