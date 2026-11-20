export const CRYPTO_RECEIVING_NETWORKS = [
  { id: 'usdt_trc20', name: 'USDT (TRC20)', chain: 'Tron', format: 'tron' },
  { id: 'usdt_erc20', name: 'USDT (ERC20)', chain: 'Ethereum', format: 'evm' },
  { id: 'usdt_bep20', name: 'USDT (BEP20)', chain: 'BNB Smart Chain', format: 'evm' },
  { id: 'usdc_erc20', name: 'USDC (ERC20)', chain: 'Ethereum', format: 'evm' },
  { id: 'usdc_arbitrum', name: 'USDC (Arbitrum One)', chain: 'Arbitrum One', format: 'evm' },
] as const;

export const DEFAULT_USDT_BEP20_RECEIVING_ADDRESS = '0x5a3092ddac1399704ece4e01eb4253d48bb052a5';

type SellerCryptoDepositNetwork = Exclude<(typeof CRYPTO_RECEIVING_NETWORKS)[number], { id: 'usdt_erc20' }>;
export const SELLER_CRYPTO_DEPOSIT_NETWORKS = CRYPTO_RECEIVING_NETWORKS.filter(
  (network): network is SellerCryptoDepositNetwork => network.id !== 'usdt_erc20',
);

export type CryptoReceivingNetworkId = (typeof CRYPTO_RECEIVING_NETWORKS)[number]['id'];

export type CryptoReceivingAddressMap = Partial<Record<CryptoReceivingNetworkId, string>>;

export interface CryptoReceivingAddressConfig {
  addresses: CryptoReceivingAddressMap;
  sellerOverrides: Record<string, CryptoReceivingAddressMap>;
}

export function isCryptoReceivingNetworkId(value: unknown): value is CryptoReceivingNetworkId {
  return typeof value === 'string' && CRYPTO_RECEIVING_NETWORKS.some((network) => network.id === value);
}

export function validateCryptoReceivingAddress(networkId: CryptoReceivingNetworkId, value: string): string | null {
  const address = value.trim();
  if (!address) return 'Enter a receiving address.';

  const network = CRYPTO_RECEIVING_NETWORKS.find((item) => item.id === networkId);
  if (!network) return 'Choose a supported network.';

  if (network.format === 'tron' && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
    return 'Enter a valid 34-character TRON address beginning with T.';
  }
  if (network.format === 'evm' && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return 'Enter a valid 42-character EVM address beginning with 0x.';
  }
  return null;
}
