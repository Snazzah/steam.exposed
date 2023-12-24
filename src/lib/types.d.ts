export interface SteamYearInReview {
  stats: YearInReviewStats;
  performance_stats: {
    from_dbo: boolean;
    overall_time_ms: string;
    dbo_load_ms: string;
    message_population_ms: string;
    dbo_lock_load_ms: string;
  };
  distribution: {
    new_releases: number;
    recent_releases: number;
    classic_releases: number;
    recent_cutoff_year: number;
  };
}

export interface YearInReviewStats {
  account_id: number;
  year: number;
  playtime_stats: PlaytimeStats;
  privacy_state: number;
}

export interface PlaytimeStats {
  total_stats: YearInReviewGameStats;
  games: Game[];
  playtime_streak: {
    longest_consecutive_days: number;
    rtime_start: number;
    streak_games: { appid: number; }[];
  };
  months: Month[];
  game_summary: PlaytimeStatsGameSummary[];
  demos_played: number;
  game_rankings: {
    overall_ranking: YearInReviewRanking;
    vr_ranking?: YearInReviewRanking;
    deck_ranking?: YearInReviewRanking;
    controller_ranking?: YearInReviewRanking;
    linux_ranking?: YearInReviewRanking;
    windows_ranking?: YearInReviewRanking;
    mac_ranking?: YearInReviewRanking;
  };
  playtests_played: number;
  summary_stats: {
    total_achievements: number;
    total_games_with_achievements: number;
    total_rare_achievements: number;
  };
  substantial: boolean;
  tag_stats: {
    stats: {
      tag_id: number;
      tag_weight: number;
      tag_weight_pre_selection: number;
    }[];
  };
  by_numbers: {
    screenshots_shared: number;
    gifts_sent: number;
    loyalty_reactions: number;
    written_reviews: number;
    guides_submitted: number;
    workshop_contributions: number;
    badges_earned: number;
    friends_added: number;
    forum_posts: number;
    workshop_subscriptions: number;
    guide_subscribers: number;
    workshop_subscribers: number;
    games_played_pct: number;
    achievements_pct: number;
    game_streak_pct: number;
    games_played_avg: number;
    achievements_avg: number;
    game_streak_avg: number;
  };
}

export interface PlaytimeStatsGameSummary {
  appid: number;
  new_this_year: boolean;
  rtime_first_played_lifetime: number;
  demo: boolean;
  playtest: boolean;
  played_vr: boolean;
  played_deck: boolean;
  played_controller: boolean;
  played_linux: boolean;
  played_mac: boolean;
  played_windows: boolean;
  total_playtime_percentagex100: number;
  total_sessions: number;
  rtime_release_date?: number;
}

export interface YearInReviewRanking {
  category: string;
  rankings: {
    appid: number;
    rank: number;
  }[];
}

export interface PlaytimeStatsGameSummary {
  appid: number;
  new_this_year: boolean;
  rtime_first_played_lifetime: number;
  demo: boolean;
  playtest: boolean;
  played_vr: boolean;
  played_deck: boolean;
  played_controller: boolean;
  played_linux: boolean;
  played_mac: boolean;
  played_windows: boolean;
  total_playtime_percentagex100: number;
  total_sessions: number;
  rtime_release_date?: number;
}

export interface Game {
  appid: number;
  stats: YearInReviewGameStats;
  playtime_streak: {
    longest_consecutive_days: number;
    rtime_start: number;
  };
  playtime_ranks: {
    overall_rank: number;
    windows_rank?: number;
    controller_rank?: number;
    deck_rank?: number;
    linux_rank?: number;
    mac_rank?: number;
    vr_rank?: number;
  };
  rtime_first_played: number;
  relative_game_stats: YearInReviewGameStats;
}

export interface Month {
  rtime_month: number;
  stats: YearInReviewGameStats;
  relative_monthly_stats: YearInReviewGameStats;
  game_summary: {
    appid: number;
    total_playtime_percentagex100: number;
    relative_playtime_percentagex100: number;
  }[];
  appid?: {
    appid: number;
    stats: YearInReviewGameStats;
    rtime_first_played: number;
    relative_game_stats: YearInReviewGameStats;
  }[];
}

export interface YearInReviewGameStats {
  total_playtime_seconds: number;
  total_sessions: number;
  vr_sessions: number;
  deck_sessions: number;
  controller_sessions: number;
  linux_sessions: number;
  macos_sessions: number;
  windows_sessions: number;
  total_playtime_percentagex100: number;
  vr_playtime_percentagex100: number;
  deck_playtime_percentagex100: number;
  controller_playtime_percentagex100: number;
  linux_playtime_percentagex100: number;
  macos_playtime_percentagex100: number;
  windows_playtime_percentagex100: number;
}

export interface SteamTag {
  tagid: number; name: string;
}
