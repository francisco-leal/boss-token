export type CacheKey =
  | `user_${string}`
  | `wallet_info_${string}`
  | "nominations"
  | "leaderboard_top_50"
  | "leaderboard_undiscovered"
  | "search_builders"
  | `talent_protocol_${string}`
  | `talent_protocol_search_${string}`
  | `farcaster_${string}`
  | `farcaster_search_${string}`
  | "users_count"
  | "nominations_count"
  | `nominations_sent_${string}`
  | `nominations_received_${string}`
  | `stats_${string}`
  | `api_key_${string}`
  | `api_user_${string}`
  | `api_nominations_received_${string}`
  | `count_nominations_received_${string}`
  | `nominations_weekly_stats_${string}`
  | `eligibility_${string}`
  | `nominations_reminder_${string}`;

export const CACHE_1_MINUTE = 60;
export const CACHE_5_MINUTES = 60 * 5;
export const CACHE_24_HOURS = 60 * 60 * 24;
