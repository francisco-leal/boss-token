"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { DateTime, Interval } from "luxon";
import { supabase } from "@/db";
import { getSession } from "@/services/authentication/cookie-session";
import { abbreviateWalletAddress } from "@/shared/utils/abbreviate-wallet-address";
import { BadRequestError } from "@/shared/utils/error";
import { CacheKey } from "../helpers/cache-keys";
import { JobTypes } from "../helpers/job-types";
import { getCurrentUser, getUserBalances } from "./users";
import { User } from "./users";
import { WalletInfo, createWallet, getWalletFromExternal } from "./wallets";
import  { EAS, SchemaEncoder }  from "@ethereum-attestation-service/eas-sdk";
import { Wallet } from "ethers";

export type Nomination = {
  id: number;
  bossPointsReceived: number;
  bossPointsSent: number;
  originUserId: string;
  originUsername: string;
  originRank: number | null;
  destinationWallet: string;
  destinationUsername: string;
  destinationRank: number | null;
  createdAt: string;
};

const SELECT_NOMINATIONS_FROM_USER = `
  id,
  boss_points_received,
  boss_points_sent,
  origin_user_id,
  destination_wallet_id,
  created_at,
  wallets (
    username,
    users (
      id,
      username,
      boss_leaderboard (
        id,
        rank
      )
    ) 
  )       
` as const;

const SELECT_NOMINATIONS_TO_USER = `
  *,
  wallets!inner(
    user_id,
    users (
      id,
      username,
      boss_leaderboard (
        id,
        rank
      )
    ) 
  ),
  users (
    id,
    username,
    boss_leaderboard (
      id,
      rank
    )
  )
` as const;

const easContractAddress = "0x4200000000000000000000000000000000000021";
const schemaUID = "0x5e0dc83b2de7b440d03ad0b07f85869f7eff68fb32a11849a4c12a2b2516b244";

const makeEasAttestation = async (nominator: string, nominated: string) => {
  const signer = new Wallet(process.env.EAS_SIGNER_PRIVATE_KEY as string)
  const eas = new EAS(easContractAddress);
  // Signer must be an ethers-like signer.
  eas.connect(signer as any);
  // Initialize SchemaEncoder with the schema string
  const schemaEncoder = new SchemaEncoder("address nominator");
  const encodedData = schemaEncoder.encodeData([
    { name: "nominator", value: nominator, type: "address" }
  ]);
  const tx = await eas.attest({
    schema: schemaUID,
    data: {
      recipient: nominated,
      expirationTime: BigInt(0),
      revocable: true,
      data: encodedData,
    },
  });
  // const newAttestationUID = await tx.wait();
  await tx.wait();
}

export const getNomination = async (
  user: User,
  wallet: WalletInfo,
): Promise<Nomination | null> => {
  const userId = user.id;

  const nomination = await supabase
    .from("boss_nominations")
    .select(SELECT_NOMINATIONS_FROM_USER)
    .eq("origin_user_id", userId)
    .in("destination_wallet_id", wallet.allWallets)
    .throwOnError()
    .then((res) => res.data?.[0]);

  if (!nomination) return null;

  return {
    id: nomination.id,
    originUserId: nomination.origin_user_id,
    originUsername: user.username ?? "", // TODO: a default here should be redundant.
    originRank: user.boss_leaderboard?.rank ?? null,
    bossPointsReceived: nomination.boss_points_received,
    bossPointsSent: nomination.boss_points_sent,
    destinationWallet: nomination.destination_wallet_id,
    destinationUsername:
      nomination.wallets?.users?.username ??
      nomination.wallets?.username ??
      abbreviateWalletAddress(nomination.destination_wallet_id),
    destinationRank: nomination.wallets?.users?.boss_leaderboard?.rank ?? null,
    createdAt: nomination.created_at,
  };
};

export const getNominationsUserSent = async (
  user: User,
): Promise<Nomination[]> => {
  const { data: nominations } = await supabase
    .from("boss_nominations")
    .select(SELECT_NOMINATIONS_FROM_USER)
    .order("created_at", { ascending: false })
    .eq("origin_user_id", user.id)
    .throwOnError();

  return (
    nominations?.map((nomination) => ({
      id: nomination.id,
      originUserId: user.id,
      originUsername: user.username ?? "", // TODO: a default here should be redundant.
      originRank: user.boss_leaderboard?.rank ?? null,
      bossPointsReceived: nomination.boss_points_received,
      bossPointsSent: nomination.boss_points_sent,
      destinationWallet: nomination.destination_wallet_id,
      destinationUsername:
        nomination.wallets?.users?.username ??
        nomination.wallets?.username ??
        abbreviateWalletAddress(nomination.destination_wallet_id) ??
        null,
      destinationRank:
        nomination.wallets?.users?.boss_leaderboard?.rank ?? null,
      createdAt: nomination.created_at,
    })) ?? []
  );
};

export const getNominationsUserReceived = async (
  user: User,
): Promise<Nomination[]> => {
  const nominations = await supabase
    .from("boss_nominations")
    .select(SELECT_NOMINATIONS_TO_USER)
    .eq("wallets.user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .throwOnError()
    .then((res) => res.data ?? []);

  return (
    nominations?.map((nomination) => ({
      id: nomination.id,
      originUserId: nomination.origin_user_id,
      originUsername: nomination?.users?.username ?? "",
      originRank: nomination?.users?.boss_leaderboard?.rank ?? null,
      bossPointsReceived: nomination.boss_points_received,
      bossPointsSent: nomination.boss_points_sent,
      destinationWallet: nomination.destination_wallet_id,
      destinationUsername:
        user.username ??
        abbreviateWalletAddress(nomination.destination_wallet_id),
      destinationRank:
        nomination?.wallets?.users?.boss_leaderboard?.rank ?? null,
      createdAt: nomination.created_at,
    })) ?? []
  );
};

export const getNominationsFromUserToday = async (user: User) => {
  const nominations = await getNominationsUserSent(user);
  const fromDate = DateTime.utc().startOf("day");
  const toDate = fromDate.plus({ hours: 24 });
  const interval = Interval.fromDateTimes(fromDate, toDate);
  return nominations.filter((n) =>
    interval.contains(DateTime.fromISO(n.createdAt)),
  );
};

export const isSelfNomination = async (
  user: User,
  wallet: WalletInfo,
): Promise<boolean> => {
  const wallets = [...wallet.allWallets, ...user.wallets.map((w) => w.wallet)];
  const isSelfNomination = [...new Set(wallets)].length !== wallets.length;
  if (isSelfNomination) return true;
  if (user.farcaster_id === (wallet.farcasterId ?? false)) return true;
  if (user.passport_id === (wallet.passportId ?? false)) return true;
  return false;
};

export const isUpdatingLeaderboard = async () => {
  const { data: updates } = await supabase
    .from("scheduled_updates")
    .select("*")
    .is("finished_at", null)
    .eq("job_type", "leaderboard" satisfies JobTypes);

  if (!updates) return true;
  if (updates.length > 0) return true;
  return false;
};

export const isDuplicateNomination = async (user: User, wallet: WalletInfo) => {
  return !!(await getNomination(user, wallet));
};

export const hasExceededNominationsToday = async (nominatorUser: User) => {
  const nominations = await getNominationsFromUserToday(nominatorUser);
  return (nominations?.length || 0) >= 3;
};

export const hasNoDailyBudget = async (nominatorUser: User) => {
  return nominatorUser.boss_budget <= 0;
};

export const createNewNomination = async (
  nominatorUser: User,
  nominatedWallet: WalletInfo,
  // TODO formalize this, instead of it being a complete hack
  origin_wallet_id?: string,
): Promise<Nomination> => {
  if (await hasNoDailyBudget(nominatorUser)) {
    throw new BadRequestError("You need a BUILD budget to nominate!");
  }
  if (await isSelfNomination(nominatorUser, nominatedWallet)) {
    throw new BadRequestError("You cannot nominate yourself!");
  }
  if (await isDuplicateNomination(nominatorUser, nominatedWallet)) {
    throw new BadRequestError("You already nominated this builder before!");
  }
  if (await hasExceededNominationsToday(nominatorUser)) {
    throw new BadRequestError("You have already nominated 3 builders today!");
  }
  if (await isUpdatingLeaderboard()) {
    throw new BadRequestError(
      "Leaderboard is currently updating, please try again later!",
    );
  }

  await createWallet(nominatedWallet.wallet);

  const balances = await getUserBalances(nominatorUser);

  const nomination = await supabase
    .from("boss_nominations")
    .insert({
      origin_user_id: nominatorUser.id,
      origin_wallet_id: origin_wallet_id,
      destination_wallet_id: nominatedWallet.wallet,
      boss_points_received: balances.pointsEarned,
      boss_points_sent: balances.pointsGiven,
    })
    .select(SELECT_NOMINATIONS_FROM_USER)
    .single()
    .throwOnError()
    .then((res) => res.data);

  if (!nomination) throw new BadRequestError("Could not create nomination");

  await supabase.rpc("update_boss_daily_streak_for_user", {
    user_to_update: nominatorUser.id,
  });

  await supabase.rpc("update_boss_score_for_user", {
    user_to_update: nominatorUser.id,
  });

  if (nominatedWallet.userId) {
    await supabase.rpc("update_boss_score_for_user", {
      user_to_update: nominatedWallet.userId,
    });
  }

  // TODO: which wallet?
  await makeEasAttestation(nominatorUser.wallets[0].wallet, nominatedWallet.wallet);

  revalidatePath(`/airdrop`);
  revalidatePath(`/airdrop/nominate/${nominatedWallet.wallet}`);
  revalidatePath(`/nominate/${nominatedWallet.wallet}`);
  revalidateTag(`user_${nominatorUser.id}` as CacheKey);
  revalidateTag(`user_${nominatedWallet.userId}` as CacheKey);
  revalidateTag(`nominations` as CacheKey);
  return {
    id: nomination.id,
    originUserId: nomination.origin_user_id,
    originUsername: nominatorUser.username ?? "", // TODO: a default here should be redundant.
    originRank: nominatorUser.boss_leaderboard?.rank ?? null,
    bossPointsReceived: nomination.boss_points_received,
    bossPointsSent: nomination.boss_points_sent,
    destinationWallet: nomination.destination_wallet_id,
    destinationUsername:
      nomination.wallets?.users?.username ??
      abbreviateWalletAddress(nomination.destination_wallet_id),
    destinationRank: nomination.wallets?.users?.boss_leaderboard?.rank ?? null,
    createdAt: nomination.created_at,
  };
};

export const createNewNominationForCurrentUser = async (
  walletToNominate: string,
) => {
  const currentUser = await getCurrentUser();
  const walletInfo = await getWalletFromExternal(walletToNominate);
  if (!currentUser) throw new BadRequestError("Could not find user");
  if (!walletInfo) throw new BadRequestError("Could not find wallet info");
  return createNewNomination(currentUser, walletInfo, currentUser.wallet);
};
