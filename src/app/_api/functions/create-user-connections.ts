import { supabase } from "@/db";
import { getFarcasterUser } from "@/services/farcaster";
import { getTalentProtocolUser } from "@/services/talent-protocol";
import { PartialWallet, User } from "../data/users";

/**
 * connects a user to a new wallet. This will be a redundant action
 * most times, as the wallet will already be connected, but in case it is
 * not it will make sure we invalidate duplicate nominations, and prevent
 * future duplicates.
 */
export const createUserConnections = async (user: User, newWallet: string) => {
  const walletLc = newWallet.toLowerCase();
  const talentUser = await getTalentProtocolUser(walletLc);
  const farcasterUser = await getFarcasterUser(walletLc);

  const existingWallets = await supabase
    .from("wallets")
    .select("wallet, farcaster_id, passport_id, user_id")
    .eq("user_id", user.id)
    .throwOnError()
    .then((res) => res.data);

  const allWallets: PartialWallet[] = [
    ...(existingWallets ?? []),
    ...(talentUser?.verified_wallets ?? []).map((w) => ({
      wallet: w,
      passport_id: talentUser?.passport_id,
      user_id: user.id,
    })),
    ...(farcasterUser?.allWallets ?? []).map((w) => ({
      wallet: w,
      farcaster_id: farcasterUser?.profileTokenId,
      user_id: user.id,
    })),
  ].reduce<PartialWallet[]>((acc, w) => {
    const index = acc.findIndex((e) => e.wallet === w.wallet);
    if (index === -1) {
      acc.push(w);
    } else {
      acc[index] = { ...acc[index], ...w };
    }
    return acc;
  }, []);

  await supabase
    .from("wallets")
    .upsert(allWallets.map((w) => ({ ...w })))
    .throwOnError();

  const nominationsForUser = await supabase
    .from("users")
    .select("id, wallets(wallet, boss_nominations(*))")
    .eq("users.id", user.id)
    .single()
    .throwOnError()
    .then((res) => res.data);

  if (!nominationsForUser) return null;

  const nominations = nominationsForUser.wallets
    .map((w) => w.boss_nominations)
    .flat();
  const uniqueNominatorUsers = Array.from(
    new Set(nominations.map((n) => n.origin_user_id)),
  );

  uniqueNominatorUsers.forEach(async (userId) => {
    const nominationsByUser = nominations
      .filter((n) => n.origin_user_id === userId)
      .sort((a, b) => {
        const initial = new Date(a.created_at).getTime();
        const final = new Date(b.created_at).getTime();
        return initial - final;
      });

    if (nominationsByUser.length > 1) {
      const nominationsToInvalidate = nominationsByUser.slice(1);

      await supabase
        .from("boss_nominations")
        .update({ valid: false })
        .in(
          "id",
          nominationsToInvalidate.map((n) => n.id),
        )
        .throwOnError();
    }
  });
};