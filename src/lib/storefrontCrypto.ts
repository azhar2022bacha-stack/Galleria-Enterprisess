import { DEFAULT_USDT_BEP20_RECEIVING_ADDRESS, SELLER_CRYPTO_DEPOSIT_NETWORKS, type CryptoReceivingNetworkId } from '@/lib/cryptoReceivingAddresses';

const addresses = {
  usdt_trc20: 'TWcFottS5S3zQ6sdt5m5XiWTieoV2q3HWt',
  usdt_bep20: DEFAULT_USDT_BEP20_RECEIVING_ADDRESS,
  usdc_erc20: '0x5a3092ddac1399704ece4e01eb4253d48bb052a5',
  usdc_arbitrum: '0x5a3092ddac1399704ece4e01eb4253d48bb052a5',
} as const;

export const STOREFRONT_CRYPTO_NETWORKS = SELLER_CRYPTO_DEPOSIT_NETWORKS.map((network) => ({
  ...network,
  token: network.id.startsWith('usdt_') ? 'USDT' as const : 'USDC' as const,
  address: addresses[network.id],
}));

export interface StorefrontCryptoPayment {
  networkId: CryptoReceivingNetworkId;
  networkName: string;
  chain: string;
  token: 'USDT' | 'USDC';
  address: string;
  amount: string;
  transactionId?: string;
  verifiedAt?: string;
}

export function storefrontCryptoNetwork(networkId: unknown) {
  return STOREFRONT_CRYPTO_NETWORKS.find(({ id }) => id === networkId);
}

export function normalizeCryptoTransactionId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const transactionId = value.trim().toLowerCase().replace(/^0x/, '');
  return /^[a-f0-9]{64}$/.test(transactionId) ? transactionId : null;
}
