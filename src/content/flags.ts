/** Human-readable lines for flags worth surfacing on Ripple cards. `name:*` matches `name:<npc>`; `{npc}` is substituted. */
export const flagLabels: Record<string, string> = {
  'DEVOUR_TARGET:*': 'You marked {npc} as prey. The next match you share must pay this off, or you’ll be humiliated.',
  'COMBO_ELIGIBLE:*': 'A combo play with {npc} is now possible.',
  'SEEN_AS_SOFT:*': '{npc} reads you as soft.',
  'GRUDGE:*': 'A grudge with {npc} is festering.',
  'READ:*': 'You found a weakness in {npc}: a one-time match option is unlocked.',
  ADMITTED_FEAR: 'You told Ego the truth about the pass. It cost you pride and bought you something rarer.',
  INSIDER_READ: 'You turned the academy’s own scouting language back on the selection staff.',
  ANOMALY_CONFIRMED: 'Staff now treat you as a confirmed anomaly.',
  EGO_DOUBTS_YOU: 'Ego is not yet convinced you are a striker.',
  KNOWS_METRIC: 'You know how the selection is being measured.',
  FROZE_AT_ENTRY: 'You froze when Ego asked why you were here. Everyone saw it.',
}
