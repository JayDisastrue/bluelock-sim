import type { Trait } from '../engine/schemas'

export const traits: Trait[] = [
  // origin identity
  { id: 'haunted', name: 'Haunted', desc: 'One decisive pass still replays every night. Hesitation under pressure, but you notice teammates others miss.' },
  { id: 'insider', name: 'Insider', desc: 'Academy training taught you how clubs think. Extra options in tactical briefings; staff are colder to you.' },
  { id: 'anomaly', name: 'Anomaly', desc: 'Structured defenses misread your dribbling. Officials watch you closer.' },
  { id: 'autopilot_passer', name: 'Autopilot Passer', desc: 'Instincts default to the pass. Fights you in selfish moments until you break the habit.' },
  { id: 'shadowed', name: 'Shadowed', desc: 'Everyone compares you to a famous sibling. Media notice you early, and forgive you late.' },
  { id: 'late_bloomer', name: 'Late Bloomer', desc: 'Raw fundamentals, ferocious learning curve. Skills gain XP faster, from a lower base.' },
  // earned
  { id: 'hunger', name: 'Hunger', desc: 'Missing a chance makes you sharper, not shakier.' },
  { id: 'clutch', name: 'Clutch', desc: 'Final-minute decisions get a Composure shield.' },
  { id: 'bait', name: 'Bait', desc: 'Fake the pass, then shoot: defenders bite on your passing reputation.' },
  { id: 'cold_blooded', name: 'Cold Blooded', desc: 'Pressure no longer drains Composure, but teammates feel you pulling away.' },
  { id: 'devourer', name: 'Devourer', desc: 'You have eaten a rival and it shows. Rivals play you with fear.' },
]
