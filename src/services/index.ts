import { supabase } from "@/db";
import { init, fetchQuery } from "@airstack/node";
import { searchTalentProtocolUser } from "./talent-protocol";

init(process.env.AIRSTACK_API_KEY!);


export function generateRandomSequence(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export async function getNominationsFromFarcaster() {
  // TODO: inject into app_daily_nominations
}

export async function computeUserNominationsAndStats() {
  console.log("calculating user nominations and stats...");
  const { error: error_update_nominations } =
    await supabase.rpc("update_nominations");
  if (error_update_nominations) {
    throw error_update_nominations;
  }
  console.log("calculating user stats...");
  const { error: error_update_user_stats } =
    await supabase.rpc("update_user_stats");
  if (error_update_user_stats) {
    throw error_update_user_stats;
  }
  console.log("calculating user boss score...");
  const { error: error_user_boss_score } = await supabase.rpc(
    "update_user_boss_score",
  );
  if (error_user_boss_score) {
    throw error_user_boss_score;
  }
  console.log("calculating user boss budget...");
  const { error: error_user_boss_budget } = await supabase.rpc(
    "update_user_boss_budget",
  );
  if (error_user_boss_budget) {
    throw error_user_boss_budget;
  }
}

export async function computeLeaderboard() {
  const { error: error_update_leaderboard } =
    await supabase.rpc("update_leaderboard");
  if (error_update_leaderboard) {
    throw error_update_leaderboard;
  }
}
