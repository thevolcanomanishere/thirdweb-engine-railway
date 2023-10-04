import { LocalWallet } from "@thirdweb-dev/wallets";
import { WalletType } from "../../../src/schema/wallet";
import { env } from "../../../src/utils/env";
import { LocalFileStorage } from "../storage/localStorage";

export const createLocalWallet = async (): Promise<string> => {
  if (env.WALLET_CONFIGURATION.type !== WalletType.local) {
    throw new Error(`Server was not configured for local wallet creation.`);
  }

  const wallet = new LocalWallet();
  const walletAddress = await wallet.generate();

  // Creating wallet details row is handled by LocalFileStorage
  await wallet.save({
    strategy: "encryptedJson",
    password: env.THIRDWEB_API_SECRET_KEY,
    storage: new LocalFileStorage(walletAddress),
  });

  return walletAddress;
};