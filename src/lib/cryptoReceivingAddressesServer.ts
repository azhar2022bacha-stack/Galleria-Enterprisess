import fs from 'fs';
import path from 'path';
import {
  CRYPTO_RECEIVING_NETWORKS,
  type CryptoReceivingAddressConfig,
  type CryptoReceivingAddressMap,
  type CryptoReceivingNetworkId,
} from '@/lib/cryptoReceivingAddresses';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'crypto_receiving_addresses.json');

function emptyConfig(): CryptoReceivingAddressConfig {
  return { addresses: {}, sellerOverrides: {} };
}

export function readCryptoReceivingAddressConfig(): CryptoReceivingAddressConfig {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyConfig();
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const addresses: CryptoReceivingAddressMap = {};
    const sellerOverrides: Record<string, CryptoReceivingAddressMap> = {};

    for (const network of CRYPTO_RECEIVING_NETWORKS) {
      const address = parsed?.addresses?.[network.id];
      if (typeof address === 'string' && address.trim()) addresses[network.id] = address.trim();
    }
    if (parsed?.sellerOverrides && typeof parsed.sellerOverrides === 'object' && !Array.isArray(parsed.sellerOverrides)) {
      for (const [emailValue, overrides] of Object.entries(parsed.sellerOverrides)) {
        const email = emailValue.trim().toLowerCase();
        if (!email || !overrides || typeof overrides !== 'object' || Array.isArray(overrides)) continue;
        const sellerAddresses: CryptoReceivingAddressMap = {};
        for (const network of CRYPTO_RECEIVING_NETWORKS) {
          const address = (overrides as Record<string, unknown>)[network.id];
          if (typeof address === 'string' && address.trim()) sellerAddresses[network.id] = address.trim();
        }
        if (Object.keys(sellerAddresses).length) sellerOverrides[email] = sellerAddresses;
      }
    }
    return { addresses, sellerOverrides };
  } catch {
    return emptyConfig();
  }
}

export function writeCryptoReceivingAddressConfig(config: CryptoReceivingAddressConfig): void {
  const directory = path.dirname(DATA_FILE);
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
  const temporaryFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(config, null, 2), 'utf8');
  fs.renameSync(temporaryFile, DATA_FILE);
}

export function getSellerCryptoReceivingAddresses(
  config: CryptoReceivingAddressConfig,
  sellerEmail: string
): CryptoReceivingAddressMap {
  const email = sellerEmail.trim().toLowerCase();
  const overrides = config.sellerOverrides[email] || {};
  return Object.fromEntries(
    CRYPTO_RECEIVING_NETWORKS.map(({ id }) => [id, overrides[id] || config.addresses[id] || ''])
  ) as Record<CryptoReceivingNetworkId, string>;
}
