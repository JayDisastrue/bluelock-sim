import roster from './roster.json'

export type Region = 'japan' | 'world' | 'staff' | 'family' | 'media' | 'officials' | 'sponsor' | 'other'
export interface RosterEntry { id: string; name: string; group: 'canon' | 'original'; region: Region; role: string; teams: string[]; groups?: string[]; female?: boolean }
export interface TeamEntry { id: string; name: string; kind: 'selection' | 'national' | 'club' | 'school' | 'group' | 'original'; squad: number; named: number; filler: number; staff: number }

/** Every character id the project reserves an art slot for (portraits/<id>.png), written or not. */
export const ROSTER = roster.characters as RosterEntry[]
/** Every squad: Blue Lock selection teams, national U-20 sides, clubs, schools and the invented teams for the player's origins. */
export const TEAMS = roster.teams as TeamEntry[]
export const TEAM_IDS = TEAMS.map((t) => t.id)
export const ROSTER_GROUPS = roster.groups as { id: string; name: string }[]

/**
 * Unnamed squad slots. A team of 23 with 9 named players has 14 more places, addressed `<teamId>_fill_01` ... `_14`
 * (art at portraits/<id>.png, written when the match engine needs a full bench). Two digits, starting at 01.
 */
export const FILLER_PATTERN = /^([a-z0-9_]+)_fill_(\d{2})$/
export const fillerIds = (teamId: string): string[] => {
  const t = TEAMS.find((x) => x.id === teamId)
  return Array.from({ length: t?.filler ?? 0 }, (_, i) => `${teamId}_fill_${String(i + 1).padStart(2, '0')}`)
}
export const isFillerId = (id: string): boolean => {
  const m = FILLER_PATTERN.exec(id)
  return !!m && fillerIds(m[1]!).includes(id)
}

/** Reserved sound ids for future features, grouped for docs. Files are wired by hand in manifest.json "music" / "sfx" / "ambience" (see ASSETS.md). */
export const MUSIC_GROUPS: Record<string, string[]> = {
  'Used by scenes today': ['memory-hush', 'envelope', 'selection-tension', 'dorm-calm'],
  'Menus and hub': ['main-menu', 'creation', 'hub-day', 'hub-night', 'hub-tense', 'hub-warm', 'save-load', 'gallery', 'credits'],
  'Story moods': ['ego-lecture', 'rival-theme', 'bond-warm', 'betrayal', 'awakening', 'loss', 'resolve', 'reunion', 'confession', 'flashback', 'dread', 'comic-relief', 'quiet-night', 'press-pressure', 'sponsor-intrigue'],
  'Arcs and selections': ['arc-intro', 'tag-test', 'first-selection', 'second-selection', 'third-selection', 'neo-egoist-league', 'u20-japan', 'u20-world-cup', 'worlds-best', 'selection-announce', 'elimination', 'rank-up'],
  'Training': ['training-montage', 'training-hard', 'training-calm', 'minigame'],
  'Matches': ['match-kickoff', 'match-tension', 'match-flow', 'match-metavision', 'match-desperate', 'match-comeback', 'match-lead', 'goal-celebrate', 'goal-conceded', 'half-time', 'full-time-win', 'full-time-loss', 'full-time-draw', 'penalty-shootout', 'post-match-quiet', 'u20-anthem'],
}
export const MUSIC_IDS = Object.values(MUSIC_GROUPS).flat()

export const SFX_GROUPS: Record<string, string[]> = {
  'Used today': ['don'],
  'Interface': ['menu-click', 'menu-back', 'choice-hover', 'choice-confirm', 'choice-timer-tick', 'choice-timeout', 'save-ok', 'load-ok', 'error', 'notification', 'text-blip', 'page-flip', 'tab-switch', 'dice-roll', 'unlock', 'level-up', 'rank-up-sting'],
  'Manga and cutscene': ['impact-hit', 'impact-big', 'panel-slam', 'panel-slide', 'speedlines-whoosh', 'ripple-chime', 'ripple-bad', 'flow-on', 'flow-off', 'metavision-on', 'metavision-off', 'devoured-sting', 'ego-sting', 'heartbeat', 'heartbeat-fast', 'breath', 'gasp', 'transition-whoosh', 'transition-slam', 'camera-shutter', 'glass-break', 'thunder'],
  'Football': ['shot-strike', 'shot-curve', 'pass-short', 'pass-long', 'ball-kick-soft', 'ball-kick-hard', 'ball-bounce', 'ball-net', 'post-hit', 'bar-hit', 'save-dive', 'keeper-catch', 'tackle', 'slide-tackle', 'sprint', 'dribble-touch', 'header', 'whistle-short', 'whistle-long', 'card-show', 'var-beep', 'scoreboard-tick', 'goal-horn'],
  'Crowd': ['crowd-roar', 'crowd-gasp', 'crowd-groan', 'crowd-chant', 'crowd-boo', 'crowd-cheer-small', 'crowd-clap', 'commentator-excited'],
  'World': ['door-slide', 'door-open', 'locker-slam', 'footsteps-grass', 'footsteps-concrete', 'footsteps-corridor', 'keyboard', 'phone-buzz', 'paper-rustle', 'elevator-ding', 'monitor-hum', 'vending-machine', 'shower', 'rain', 'wind', 'train-pass'],
}
export const SFX_IDS = Object.values(SFX_GROUPS).flat()

export const AMBIENCE_IDS = [
  'dorm-night', 'canteen-chatter', 'corridor-hum', 'monitor-room', 'training-pitch-day', 'training-pitch-night', 'rain-pitch', 'stadium-empty', 'stadium-crowd-low', 'stadium-crowd-full',
  'locker-room', 'tunnel-echo', 'press-room', 'city-night', 'hometown-day', 'school-gym', 'train-station', 'hospital', 'beach', 'festival',
] as const

/** Story arcs of the series, reserved as ids for the long campaign (not the same as the game's own arc ids in content/arcs). */
export const CANON_ARC_IDS = ['introduction', 'first_selection', 'second_selection', 'third_selection', 'neo_egoist_league', 'u20_japan', 'u20_world_cup', 'worlds_best'] as const

/** Equipment and collectible ids reserved for the shop and rewards. */
export const ITEM_IDS = [
  'boots_speed', 'boots_control', 'boots_power', 'boots_grip', 'shin_guards', 'gloves_keeper', 'captain_armband', 'training_weights', 'resistance_band', 'recovery_boots',
  'energy_drink', 'protein_meal', 'sleep_mask', 'ice_pack', 'tactical_notebook', 'match_footage', 'rival_dossier', 'lucky_charm', 'hometown_photo', 'sponsor_contract',
  'jersey_team_z', 'jersey_team_v', 'jersey_blue_lock_eleven', 'jersey_u20_japan', 'headband', 'wristband',
] as const

/** Part ids planned for the creator, from the part sheets still to be generated (docs/PART_SHEET_PROMPTS.md). */
export const PLANNED_PARTS: Record<string, string[]> = {
  nose: ['small', 'straight', 'pointed', 'broad', 'upturned', 'hooked', 'flat_wide', 'long_thin', 'button'],
  mark: ['bandage', 'mole', 'freckles', 'eyebags', 'bruise', 'nose_plaster', 'split_lip', 'black_eye'],
  accessory: ['headband', 'glasses', 'earring', 'hair_clip', 'headphones'],
}

/** Backgrounds grouped for docs/IDS.md. A test checks the groups cover BG_IDS exactly. */
export const BG_GROUPS: Record<string, string[]> = {
  'Used by the current scenes': ['black', 'letter', 'room_z', 'cafeteria', 'locker_room', 'training_pitch', 'tunnel', 'stadium', 'monitor_wall', 'ego_office', 'old_pitch', 'academy_gate', 'street_cage', 'bench_dusk'],
  'Blue Lock facility': ['dorm_hallway', 'dorm_room', 'shower_room', 'gym', 'medical_room', 'lounge', 'rooftop', 'monitor_room_night', 'selection_hall', 'ego_lab', 'briefing_room', 'corridor', 'stairwell', 'vending_corner', 'press_room', 'interview_stage', 'sponsor_lounge'],
  'Pitches and courts': ['tag_test_arena', 'first_selection_field', 'second_selection_field', 'training_pitch_night', 'training_pitch_rain', 'pitch_sunrise', 'pitch_snow', 'indoor_court', 'futsal_court', 'riverside_pitch', 'penalty_spot', 'goal_mouth_close'],
  'Home and everyday life': ['hometown_street', 'school_gym', 'school_classroom', 'school_rooftop', 'convenience_store', 'train_station', 'airport_gate', 'bus_window', 'bedroom_night', 'family_kitchen', 'hospital_room', 'shrine_steps', 'festival_night', 'beach_dusk', 'cafe'],
  'The world stage': ['u20_stadium_day', 'u20_stadium_night', 'stadium_tunnel_roar', 'press_conference', 'hotel_room', 'city_night', 'locker_room_europe', 'training_ground_europe'],
  'Match day': ['stadium_stands_wide', 'stadium_crowd_close', 'pitch_centre_circle', 'pitch_corner_flag', 'pitch_penalty_area', 'pitch_touchline', 'dugout', 'bench_row', 'substitution_board', 'halftime_locker', 'pre_match_tunnel', 'pitch_floodlights_night', 'pitch_rain_heavy', 'stadium_empty', 'scoreboard_goal', 'trophy_room', 'award_stage', 'mixed_zone'],
  'Venues and places from the series': ['stadium_munchen', 'stadium_manshine', 'stadium_barcha', 'stadium_paris', 'stadium_ubers', 'stadium_japan_national', 'stadium_u20_final', 'champ_nou', 'bm_clubhouse', 'jfu_hq', 'mikage_corp', 'lagos_orphanage', 'relaxation_theater', 'wild_card_room', 'blue_lock_exterior'],
  'Transitions and cards': ['wipe_black', 'wipe_white', 'flash_white', 'speedlines', 'title_card', 'chapter_card', 'week_card', 'loading_pitch', 'split_diagonal', 'ink_splash', 'halftone_red', 'halftone_blue', 'countdown_board'],
  'Cutscene moods': ['flashback_sepia', 'dream_field', 'childhood_pitch', 'rain_window', 'empty_dorm', 'silhouette_stage', 'spotlight_floor', 'tv_static', 'phone_screen', 'social_feed', 'news_broadcast', 'video_review_room'],
  'Abstract and effect backdrops': ['white_void', 'red_void', 'memory_haze', 'flow_field', 'metavision_grid', 'scoreboard_closeup', 'newspaper_wall'],
}
