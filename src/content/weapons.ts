import { WeaponSchema, type WeaponInput } from '../engine/schemas'

const defs: WeaponInput[] = [
  {
    id: 'direct_shot', name: 'Direct Shot', summary: 'First-time finishing: no touch, no tell.',
    levels: [
      { name: 'Direct Shot', desc: 'Shoot first-time from a pass without trapping.' },
      { name: 'Curved Direct Shot', desc: 'Adds bend to the first-time strike, beating keepers set for a straight line.' },
      { name: 'Flow Direct Shot', desc: 'While in Flow, direct shots ignore one defender block.' },
    ],
    trigger: 'Receiving a pass inside shooting range', cost: '6 Stamina', cooldown: 2, counters: ['Pressing keeper', 'Early shot-block'],
  },
  {
    id: 'spatial_read', name: 'Spatial Read', summary: 'You see the pitch as space, not players.',
    levels: [
      { name: 'Spatial Read', desc: 'Highlights the open lane nearest goal on the radar.' },
      { name: 'Predator Read', desc: 'Predicts the second ball in the box: reveals where a rebound will fall.' },
      { name: 'Metavision Lock', desc: 'Adds opponent next-move prediction while Metavision is active.' },
    ],
    trigger: 'Ball in the opponent half', cost: '4 Stamina', cooldown: 1, counters: ['Chaotic pressing', 'Decoy runs'],
  },
  {
    id: 'cage_feint', name: 'Cage Feint', summary: 'Concrete-court dribbling: tight spaces, no rules.',
    levels: [
      { name: 'Cage Feint', desc: 'A 1v1 dribble that wins the duel on a tied roll against structured defenders.' },
      { name: 'Concrete Rhythm', desc: 'Chain two feints; the second cannot be anticipated.' },
      { name: 'Flow Weave', desc: 'In Flow, beat two defenders in a single clash node.' },
    ],
    trigger: '1v1 clash node', cost: '8 Stamina', cooldown: 3, counters: ['Patient containment', 'Double-teams'],
  },
  {
    id: 'blindside_run', name: 'Blindside Run', summary: 'Disappear from a defender’s sight, reappear in the box.',
    levels: [
      { name: 'Blindside Run', desc: 'Off-ball run that opens a pass lane behind the marker.' },
      { name: 'Ghost Run', desc: 'Run reads as a decoy: marker follows the wrong player.' },
      { name: 'Vanishing Flow', desc: 'In Flow, the run is unmarkable for one possession.' },
    ],
    trigger: 'Off-ball, attacking third', cost: '5 Stamina', cooldown: 2, counters: ['Zonal marking', 'Offside trap'],
  },
  {
    id: 'needle_pass', name: 'Needle Pass', summary: 'The pass nobody else saw.',
    levels: [
      { name: 'Needle Pass', desc: 'Threads a pass through one defensive line.' },
      { name: 'Monster’s Pass', desc: 'Combo weapon: a pass placed exactly where a devoted teammate will arrive. Requires a Devoted teammate.' },
      { name: 'Flow Feed', desc: 'In Flow, the pass cannot be intercepted but cannot be taken back.' },
    ],
    trigger: 'Ball at feet in midfield', cost: '5 Stamina', cooldown: 2, counters: ['Aggressive interceptors'],
  },
  {
    id: 'hunter_press', name: 'Hunter Press', summary: 'Win the ball by making the opponent doubt it.',
    levels: [
      { name: 'Hunter Press', desc: 'Pressing a Tilted opponent forces a turnover on a tied roll.' },
      { name: 'Cornered Prey', desc: 'Pressing near the touchline traps the carrier.' },
      { name: 'Flow Hunt', desc: 'In Flow, your press cannot be dribbled past for 10 seconds.' },
    ],
    trigger: 'Opponent in possession near you', cost: '7 Stamina', cooldown: 3, counters: ['Quick one-twos', 'Calm carriers'],
    seedable: false,
  },
]

export const weapons = defs.map((w) => WeaponSchema.parse(w))
