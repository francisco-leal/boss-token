"use server";

import { supabase } from "@/db";
import { Database } from "@/db/database.types";
import { abbreviateWalletAddress } from "@/shared/utils/abbreviate-wallet-address";
import { removeDuplicates } from "@/shared/utils/remove-duplicates";
import { getFarcasterUser } from "../external/farcaster";
import { getTalentProtocolUser } from "../external/talent-protocol";
import { getUserFromWallet } from "./users";

type DbWallet = Database["public"]["Tables"]["wallets"]["Row"];
type PartialWallet = Partial<DbWallet> & Pick<DbWallet, "wallet">;

export type WalletInfo = {
  username: string;
  wallet: string;
  allWallets: string[];
  image?: string;
  farcasterId?: number;
  passportId?: number;
  userId?: string;
};

/**
 * Creates the passed wallet, as well as update / create all other related
 * to the user associated to this wallet... if they exist.
 */
export const createWallet = async (walletId: string): Promise<WalletInfo> => {
  const [farcasterUser, talentUser, bossUser] = await Promise.all([
    getFarcasterUser(walletId),
    getTalentProtocolUser(walletId),
    getUserFromWallet(walletId),
  ]);

  const wallets: Record<string, PartialWallet> = {};
  const userId = bossUser?.id;

  if (farcasterUser?.custody_address) {
    wallets[farcasterUser.custody_address] = {
      ...wallets[farcasterUser.custody_address],
      wallet: farcasterUser.custody_address,
      farcaster_id: farcasterUser.fid,
      user_id: userId,
    };
  }

  farcasterUser?.verified_addresses?.eth_addresses?.forEach((wallet) => {
    wallets[wallet] = {
      ...wallets[wallet],
      wallet: wallet,
      farcaster_id: farcasterUser.fid,
      user_id: userId,
    };
  });

  talentUser?.verified_wallets?.forEach((verifiedWallet) => {
    wallets[verifiedWallet] = {
      ...wallets[verifiedWallet],
      wallet: verifiedWallet,
      passport_id: talentUser.passport_id,
      user_id: userId,
    };
  });

  const newWallets = await supabase
    .from("wallets")
    .upsert(Object.values(wallets))
    .select("*, users(username, id, wallets(wallet))")
    .throwOnError()
    .then((res) =>
      (res.data ?? []).map(
        (wallet): WalletInfo => ({
          username:
            wallet.users?.username ?? 
            abbreviateWalletAddress(wallet.wallet),
          wallet: wallet.wallet,
          allWallets: wallet.users?.wallets.map((w) => w.wallet) ?? [],
          image: "",
          farcasterId: wallet.farcaster_id ?? undefined,
          passportId: wallet.passport_id ?? undefined,
          userId: wallet.user_id ?? undefined,
        }),
      ),
    );
  const newWallet = newWallets.find((w) => w.wallet === walletId);
  if (!newWallet) {
    throw new Error(`Wallet ${walletId} not found in the database`);
  } 
  return newWallet;
};

export const getWallets = async (
  walletIds: string[],
): Promise<WalletInfo[]> => {
  return await supabase
    .from("wallets")
    .select("*, users(username, id, wallets(wallet))")
    .in("wallet", walletIds)
    .throwOnError()
    .then((res) =>
      (res.data ?? []).map(
        (wallet): WalletInfo => ({
          username:
            wallet.users?.username ?? abbreviateWalletAddress(wallet.wallet),
          wallet: wallet.wallet,
          allWallets: wallet.users?.wallets.map((w) => w.wallet) ?? [],
          image: "",
          farcasterId: wallet.farcaster_id ?? undefined,
          passportId: wallet.passport_id ?? undefined,
          userId: wallet.user_id ?? undefined,
        }),
      ),
    );
};

export const getWalletFromExternal = async (
  walledId: string,
): Promise<WalletInfo | null> => {
  const [farcasterSocial, talentSocial, bossUser] = await Promise.all([
    getFarcasterUser(walledId),
    getTalentProtocolUser(walledId),
    getUserFromWallet(walledId),
  ]);

  const allWallets = [
    farcasterSocial?.custody_address,
    ...(farcasterSocial?.verified_addresses?.eth_addresses ?? []),
    ...(talentSocial?.verified_wallets ?? []),
    ...(bossUser?.wallets.map((w) => w.wallet) ?? []),
  ]
    .filter(Boolean)
    .filter(removeDuplicates);

  const walletInfo: WalletInfo = {
    wallet: walledId.toLowerCase(),
    userId: bossUser?.id,
    passportId: talentSocial?.passport_id ?? bossUser?.passport_id ?? undefined,
    farcasterId: farcasterSocial?.fid ?? bossUser?.farcaster_id ?? undefined,
    image:
      farcasterSocial?.pfp_url ??
      talentSocial?.user?.profile_picture_url ??
      talentSocial?.passport_profile?.image_url,
    username:
      farcasterSocial?.username ??
      talentSocial?.user?.username ??
      bossUser?.username ??
      walledId.toLowerCase(),
    allWallets: allWallets,
  };

  return walletInfo;
};
