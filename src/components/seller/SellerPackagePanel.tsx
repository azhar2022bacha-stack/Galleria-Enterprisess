'use client';

import React, { useEffect, useState } from 'react';
import { sendSellerNotification } from '@/lib/sellerNotifications';
import { ArrowRight } from 'lucide-react';
import {
  getCurrentTier,
  getPackageSpend,
  getWallet,
  subscribeToOrders,
  upgradePackageTier,
  PackageTierId,
  PACKAGE_TIERS,
} from '@/lib/sellerOrders';

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface SellerPackagePanelProps {
  sellerEmail: string;
  onOpenWallet: () => void;
  notify?: (msg: string) => void;
}

export function SellerPackagePanel({ sellerEmail, onOpenWallet, notify }: SellerPackagePanelProps) {
  const [wallet, setWallet] = useState(0);
  const [currentTierId, setCurrentTierId] = useState<PackageTierId>('free');
  const [packageSpend, setPackageSpend] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setWallet(getWallet());
      setCurrentTierId(getCurrentTier());
      setPackageSpend(getPackageSpend());
    };
    refresh();
    return subscribeToOrders(refresh);
  }, []);

  const handleTierClick = async (targetTierId: PackageTierId) => {
    if (targetTierId === currentTierId) return;

    const targetTier = PACKAGE_TIERS.find((t) => t.id === targetTierId);
    if (!targetTier) return;

    const cost = targetTier.price;
    if (cost === 0) return;

    if (wallet < cost) {
      notify?.(
        `Insufficient wallet balance. You need ${money(cost - wallet)} more to upgrade to ${targetTier.name}.`
      );
      return;
    }

    const res = await upgradePackageTier(targetTierId);
    if (res.success) {
      const title = `Upgraded to ${targetTier.name}`;
      const message = `You can now add up to ${targetTier.productLimit.toLocaleString()} products.`;
      const sent = await sendSellerNotification({
        sellerEmail,
        title,
        message: [{ text: message }],
        tone: 'success',
        category: 'Account Updates',
        href: '/seller/dashboard?tab=package',
        dedupeKey: `package-upgrade:${targetTier.id}`,
      });
      if (!sent) notify?.(`${title}. ${message}`);
    } else {
      notify?.(res.error || 'Failed to upgrade tier.');
    }
  };

  const tierOrder: PackageTierId[] = ['free', 'silver', 'gold', 'platinum'];
  const currentTierIndex = tierOrder.indexOf(currentTierId);

  return (
    <div className="animate-fadeIn">
      {/* Header matching screenshot */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          Package &amp; tier
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Raise your seller commission and product limit by purchasing a higher package — a one-time charge from your wallet balance (non-refundable).
        </p>
      </div>

      {/* Top info card matching screenshot */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mt-5 flex items-center justify-between flex-wrap gap-4">
        <div className="text-xs text-gray-500">
          <span>Spent on packages: </span>
          <span className="font-bold text-gray-900">{money(packageSpend)}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span>Wallet balance: </span>
          <span className="font-bold text-gray-900">{money(wallet)}</span>
        </div>

        <button
          type="button"
          onClick={onOpenWallet}
          className="text-xs font-semibold text-[#059669] hover:text-[#047857] flex items-center gap-1 transition-colors"
        >
          <span>Top up wallet</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Upgrade explainer paragraph matching screenshot */}
      <p className="text-xs text-gray-500 mt-4 leading-relaxed max-w-3xl">
        Upgrading a tier is a <span className="font-semibold text-gray-700">one-time purchase</span> from your wallet balance — it is spent, not refundable. Pick a tier to raise your seller commission and product limit. Each upgrade costs the listed price.
      </p>

      {/* 4 Tier Cards matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {PACKAGE_TIERS.map((tier, idx) => {
          const isCurrent = tier.id === currentTierId;
          const isIncluded = idx < currentTierIndex;
          const costToUpgrade = tier.price;
          const canAfford = wallet >= costToUpgrade;

          return (
            <div
              key={tier.id}
              className={`bg-white rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-2 border-[#10b981]'
                  : 'border border-gray-200'
              }`}
            >
              <div>
                {/* Card Title & Badge */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{tier.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#059669] text-[10px] font-bold">
                      Current
                    </span>
                  )}
                </div>

                {/* Percentage & Rebate */}
                <div className="mt-4">
                  <span className="text-3xl font-black text-gray-900 block tracking-tight">
                    {tier.rebatePercent}%
                  </span>
                  <span className="text-[11px] text-gray-400 block mt-0.5">
                    seller commission
                  </span>
                </div>

                {/* Features & Price */}
                <div className="mt-5 space-y-2 text-xs">
                  <span className="text-gray-600 block">
                    Up to {tier.productLimit} distinct products
                  </span>
                  <div>
                    <span className="text-gray-500 block">Price (one-time):</span>
                    {tier.price === 0 ? (
                      <span className="font-semibold text-gray-900 block mt-0.5">Free</span>
                    ) : (
                      <span className="font-bold text-gray-900 block mt-0.5">
                        {money(tier.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full py-2.5 rounded-xl bg-[#ecfdf5] text-[#059669] font-bold text-xs text-center cursor-default">
                    Your tier
                  </div>
                ) : isIncluded ? (
                  <div className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs text-center cursor-default">
                    Included
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTierClick(tier.id)}
                    className="w-full py-2.5 rounded-xl bg-[#64748b] hover:bg-[#475569] text-white font-bold text-xs text-center transition-colors shadow-sm"
                  >
                    {canAfford ? `Upgrade for ${money(costToUpgrade)}` : `Need ${money(costToUpgrade)}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
