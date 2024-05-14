"use server";

import { unstable_cache } from "next/cache";
import { supabase } from "@/db";
import { makeMap } from "@/shared/utils/make-map";
import {
  CACHE_5_MINUTES,
  CACHE_1_MINUTE,
  CacheKey,
} from "./helpers/cache-keys";

export type Nomination = {
  id: number;
  bossPointsEarned: number;
  bossPointsGiven: number;
  originWallet: string;
  destinationWallet: string;
  destinationUsername: string | null;
  destinationRank: number | null;
  createdAt: string;
};

export const getNominationsFromWallet = async (
  wallet: string,
): Promise<Nomination[]> => {
  if (!wallet) return [];
  const walletLc = wallet.toLowerCase();
  return await unstable_cache(
    async () => {
      const { data: nominations } = await supabase
        .from("boss_nominations")
        .select("*")
        .order("created_at", { ascending: false })
        // FIXME: This limit will break the app if Builder lasts
        // longer than 50 days
        .limit(50 * 3)
        .eq("wallet_origin", walletLc);

      if (!nominations) return [];

      const { data: users } = await supabase
        .from("users")
        .select("*")
        .in(
          "wallet",
          nominations.map((n) => n.wallet_destination),
        );
      const usersMap = makeMap(users ?? [], (u) => u.wallet);
      const { data: leaderboardUsers } = await supabase
        .from("boss_leaderboard")
        .select("*")
        .in(
          "wallet",
          nominations.map((n) => n.wallet_destination),
        );

      const leaderboardUsersMap = makeMap(
        leaderboardUsers ?? [],
        (u) => u.wallet,
      );

      return nominations.map((nomination) => ({
        id: nomination.id,
        originWallet: nomination.wallet_origin,
        bossPointsEarned: nomination.boss_points_earned,
        bossPointsGiven: nomination.boss_points_given,
        destinationWallet: nomination.wallet_destination,
        destinationUsername: usersMap[nomination.wallet_destination]?.username,
        destinationRank:
          leaderboardUsersMap[nomination.wallet_destination]?.rank,
        createdAt: nomination.created_at,
      }));
    },
    ["nominations", `user_${walletLc}`] satisfies CacheKey[],
    { revalidate: CACHE_1_MINUTE },
  )();
};

export const getNomination = async (
  originWallet: string,
  destinationWallet: string,
): Promise<Nomination | null> => {
  const origin = originWallet.toLowerCase();
  const destination = destinationWallet.toLowerCase();
  return await unstable_cache(
    async () => {
      const { data: nomination } = await supabase
        .from("boss_nominations")
        .select("*")
        .eq("wallet_origin", origin)
        .eq("wallet_destination", destination)
        .single();

      if (!nomination) return null;

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("wallet", destination)
        .single();

      if (!user) return null;

      const { data: leaderboardUser } = await supabase
        .from("boss_leaderboard")
        .select("rank")
        .eq("wallet", destination)
        .single();

      return {
        id: nomination.id,
        bossPointsEarned: nomination.boss_points_earned,
        bossPointsGiven: nomination.boss_points_given,
        originWallet: nomination.wallet_origin,
        destinationWallet: nomination.wallet_destination,
        destinationUsername: user?.username ?? null,
        destinationRank: leaderboardUser?.rank ?? null,
        createdAt: nomination.created_at,
      };
    },
    [
      "nominations",
      `user_${origin}`,
      `user_${destination}`,
    ] satisfies CacheKey[],
    { revalidate: CACHE_5_MINUTES },
  )();
};
