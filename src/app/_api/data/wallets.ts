"use server";

import { unstable_cache } from "next/cache";
import { supabase } from "@/db";
import { getFarcasterUser } from "@/services/farcaster";
import { getTalentProtocolUser } from "@/services/talent-protocol";
import { removeDuplicates } from "@/shared/utils/remove-duplicates";
import { CACHE_5_MINUTES, CacheKey } from "../helpers/cache-keys";
import { getUserFromWallet } from "./users";

export type WalletInfo = {
  username: string;
  wallet: string;
  allWallets: string[];
  image?: string;
  farcasterId?: number;
  passportId?: number;
  userId?: string;
};

// TODO rewrite this with a wrap around the cache
export const getWallet = (walletId: string): Promise<WalletInfo | null> =>
  unstable_cache(
    async (walledId: string) => {
      const [farcasterSocial, talentSocial, bossUser] = await Promise.all([
        getFarcasterUser(walledId),
        getTalentProtocolUser(walledId),
        getUserFromWallet(walledId),
      ]);

      const allWallets = [
        ...(farcasterSocial?.allWallets ?? []),
        ...(talentSocial?.verified_wallets ?? []),
        ...(bossUser?.wallets.map((w) => w.wallet) ?? []),
      ].filter(removeDuplicates);

      const walletInfo: WalletInfo = {
        wallet: walledId.toLowerCase(),
        userId: bossUser?.id,
        passportId:
          talentSocial?.passport_id ?? bossUser?.passport_id ?? undefined,
        farcasterId:
          farcasterSocial?.profileTokenId ??
          bossUser?.farcaster_id ??
          undefined,
        image:
          farcasterSocial?.profile_image ??
          talentSocial?.user?.profile_picture_url ??
          talentSocial?.passport_profile?.image_url,
        username:
          farcasterSocial?.username ??
          talentSocial?.user?.username ??
          bossUser?.username ??
          walledId.toLowerCase(),
        allWallets: allWallets,
      };

      await supabase
        .from("wallets")
        .upsert({
          wallet: walletInfo.wallet,
          user_id: walletInfo.userId,
          farcaster_id: walletInfo.farcasterId,
          passport_id: walletInfo.passportId,
        })
        .throwOnError();
      return walletInfo;
    },
    [`wallet_info_${walletId}`] as CacheKey[],
    { revalidate: CACHE_5_MINUTES },
  )(walletId);