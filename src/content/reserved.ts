import roster from './roster.json'

export interface RosterEntry { id: string; name: string; group: 'canon' | 'original'; region: string; role: string; verify?: boolean }
/** Every character id the project reserves an art slot for (portraits/<id>.png), written or not. */
export const ROSTER = roster.characters as RosterEntry[]

/** Reserved sound ids for future features. Files are wired by hand in manifest.json "music" / "sfx" (see ASSETS.md). */
export const MUSIC_IDS = [
  'memory-hush', 'envelope', 'selection-tension', 'dorm-calm',
  'main-menu', 'creation', 'hub-day', 'hub-night', 'training-montage', 'match-kickoff', 'match-tension', 'match-flow', 'match-metavision',
  'goal-celebrate', 'goal-conceded', 'half-time', 'post-match-quiet', 'selection-announce', 'elimination', 'ego-lecture', 'rival-theme',
  'bond-warm', 'betrayal', 'awakening', 'tag-test', 'first-selection', 'second-selection', 'u20-anthem', 'credits',
] as const
export const SFX_IDS = [
  'don', 'impact-hit', 'impact-big', 'page-flip', 'panel-slam', 'choice-hover', 'choice-confirm', 'ripple-chime', 'ripple-bad',
  'shot-strike', 'ball-net', 'post-hit', 'whistle', 'crowd-roar', 'crowd-gasp', 'tackle', 'sprint', 'heartbeat', 'flow-on', 'metavision-on',
  'devoured-sting', 'menu-click', 'save-ok', 'error', 'phone-buzz', 'door-slide', 'locker-slam', 'rain', 'wind', 'typing',
] as const

/** Team ids for rosters and fixtures (M4+). Letters are the Blue Lock team names; the rest are clubs and invented sides. */
export const TEAM_IDS = [
  'team_z', 'team_v', 'team_y', 'team_w', 'team_x', 'blue_lock_eleven', 'u20_japan',
  'bastard_munchen', 'pxg', 'manshine_city', 'ubers', 'barcha',
  'academy_team', 'street_crew', 'hometown_club', 'rival_academy',
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
  'Abstract and effect backdrops': ['white_void', 'red_void', 'memory_haze', 'flow_field', 'metavision_grid', 'scoreboard_closeup', 'newspaper_wall'],
}
