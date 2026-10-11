import type { BeatInput, ChoiceInput, ScriptInput } from '../../engine/schemas'
import { flag, origin, skill, or } from '../dsl'
import { fx } from '../dsl'
import { enter, exit, go, impact, label, mono, nar, say } from './helpers'

interface EgoOption { choice: ChoiceInput; reply: BeatInput[] }

const egoOptions: EgoOption[] = [
  {
    choice: {
      id: 'devour', label: '“I’m here to take every goal in this room.”', tone: 'Devour', major: true,
      effects: [fx.flag('OPENING_STANCE', 'devour'), fx.rel('ego', { respect: 8 })],
      delayed: [{ eventId: 'evt.barou.challenge', delay: [1, 2] }],
      memory: { verb: 'declared', text: 'You told Ego, in front of three hundred strikers, that you would take every goal in the room.' },
      reveal: 'Three hundred egoists heard that. One of them will want to answer it.', goto: 'ego_devour',
    },
    reply: [
      { t: 'flash', color: 'red' },
      say('ego', 'Every goal. In front of three hundred witnesses.', 'smirk'),
      say('ego', 'Good. I hope you digest better than you posture.', 'neutral'),
    ],
  },
  {
    choice: {
      id: 'analyze', label: '“Before I answer: what are you measuring? I’ll play to the metric.”', tone: 'Analyze', major: true,
      requires: or(skill('metavision', '>=', 35), origin('academy_exile')),
      lockedHint: 'Needs Metavision ≥ 35, or insider knowledge from an academy.',
      effects: [fx.flag('KNOWS_METRIC'), fx.rel('ego', { respect: 5 })],
      delayed: [{ eventId: 'evt.ego.measured', delay: [2, 3] }],
      memory: { verb: 'questioned', text: 'You asked Ego how the selection is scored before you answered him.' },
      goto: 'ego_analyze',
    },
    reply: [
      say('ego', 'A player who asks for the rubric. Interesting. Most of this room is trying to impress me; you’re trying to *solve* me.', 'smirk'),
      say('ego', 'Careful: a metric you understand is a metric you can be tempted to cheat.', 'neutral'),
    ],
  },
  {
    choice: {
      id: 'support', label: '“To make whoever stands next to me better. Then beat them.”', tone: 'Support', major: true,
      effects: [fx.rel('ego', { trust: 4, respect: -4 }), fx.flag('EGO_DOUBTS_YOU')],
      delayed: [{ eventId: 'evt.ego.doubts', delay: [2, 3] }],
      memory: { verb: 'promised', text: 'You told Ego you would make others better before beating them. He heard the first half louder.' },
      goto: 'ego_support',
    },
    reply: [
      say('ego', 'Better teammates. How considerate.', 'neutral'),
      say('ego', 'Understand this: the world does not remember who made the striker better. It remembers the striker.', 'neutral'),
    ],
  },
  {
    choice: {
      id: 'ignore', label: '(Say nothing. Hold his stare.)', tone: 'Ignore',
      effects: [fx.flag('SILENT_AT_ENTRY'), fx.rel('ego', { respect: -2 })],
      memory: { verb: 'stared', text: 'You answered Ego’s first question with silence.' }, goto: 'ego_ignore',
    },
    reply: [
      say('ego', 'Nothing. Silence is also an answer, though rarely a good one.', 'neutral'),
      say('ego', 'You froze. I saw it. We’ll find out whether it was fear or calculation.', 'smirk', { when: flag('FROZE_AT_ENTRY') }),
    ],
  },
  {
    choice: {
      id: 'fear', label: '“I passed because I was afraid to be the one who missed.”', major: true,
      requires: origin('fallen_ace'), hideWhenLocked: true,
      effects: [fx.flag('ADMITTED_FEAR'), fx.rel('ego', { trust: 6, respect: 6 }), fx.rep('egoAura', -2)],
      memory: { verb: 'confessed', text: 'You told Ego the truth about the pass: you were afraid.' },
      reveal: 'Ego wrote something down. You just handed him the exact lever he will pull later.', goto: 'ego_fear',
    },
    reply: [
      say('ego', 'Honesty. Expensive and rare.', 'smirk'),
      say('ego', 'Don’t mistake my interest for mercy. A fear you can name is a fear I can use.', 'neutral'),
    ],
  },
  {
    choice: {
      id: 'jargon', label: '“Save your analysts the time: I’m ‘high ceiling, coachability concerns’.”', major: true,
      requires: origin('academy_exile'), hideWhenLocked: true,
      effects: [fx.flag('INSIDER_READ'), fx.adjust('tacticalIntel', 1), fx.rel('ego', { respect: 6 })],
      memory: { verb: 'out-read', text: 'You summarised your own scouting report back to Ego before he could.' }, goto: 'ego_jargon',
    },
    reply: [say('ego', 'Ha. “Coachability concerns.” The academy meant it as an indictment. I’ve filed it as a feature.', 'smirk')],
  },
  {
    choice: {
      id: 'juggle', label: '(Flick the loose ball at your feet up and juggle it. Say nothing.)', major: true,
      requires: origin('street_renegade'), hideWhenLocked: true,
      effects: [fx.flag('ANOMALY_CONFIRMED'), fx.rep('mystery', 4), fx.rep('egoAura', 3), fx.rel('ego', { respect: 4 })],
      memory: { verb: 'performed', text: 'You answered Ego with a juggle instead of a sentence.' }, goto: 'ego_juggle',
    },
    reply: [
      { t: 'aura', who: 'player', aura: 'flow' },
      say('ego', 'An anomaly doesn’t answer questions. It *is* the answer to one.', 'smirk'),
      { t: 'aura', who: 'player', aura: null },
    ],
  },
  {
    choice: {
      id: 'bait', label: '“To serve the team.” (Beat.) “After I score.”', major: true,
      requires: or(origin('overlooked_playmaker'), skill('metavision', '>=', 40)),
      lockedHint: 'Needs Metavision ≥ 40, or the instincts of a playmaker.', hideWhenLocked: true,
      effects: [fx.trait('bait'), fx.rel('ego', { respect: 6 })],
      memory: { verb: 'feinted', text: 'You baited Ego with a team-first answer, then took it back.' }, goto: 'ego_bait',
    },
    reply: [say('ego', 'You feint with your mouth first. I’ll remember you can.', 'smirk')],
  },
  {
    choice: {
      id: 'name', label: '“Write my name down. Mine. Not his.”', major: true,
      requires: origin('prodigys_shadow'), hideWhenLocked: true,
      effects: [fx.rep('egoAura', 3), fx.rel('ego', { respect: 5 })],
      memory: { verb: 'demanded', text: 'You made Ego write your name, not your sibling’s.' }, goto: 'ego_name',
    },
    reply: [say('ego', 'Written. Don’t make me regret the ink.', 'smirk')],
  },
  {
    choice: {
      id: 'blank', label: '“Because nobody here has told me yet what I can’t do.”', major: true,
      requires: origin('late_starter'), hideWhenLocked: true,
      effects: [fx.rep('mystery', 3), fx.rel('ego', { respect: 4 })],
      memory: { verb: 'boasted', text: 'You told Ego you hadn’t yet been told what you can’t do.' }, goto: 'ego_blank',
    },
    reply: [say('ego', 'Then I’ll start the list tomorrow.', 'smirk')],
  },
]

export const openingMain: ScriptInput = {
  id: 'opening.main', title: 'The Invitation', gallery: true,
  blurb: 'The envelope. The wall of monitors. Ego asks why you’re here, and the answer is yours.',
  bg: 'black', music: 'memory-hush',
  beats: [
    { t: 'run', script: 'opening.cold.fallen_ace', when: origin('fallen_ace') },
    { t: 'run', script: 'opening.cold.academy_exile', when: origin('academy_exile') },
    { t: 'run', script: 'opening.cold.street_renegade', when: origin('street_renegade') },
    { t: 'run', script: 'opening.cold.overlooked_playmaker', when: origin('overlooked_playmaker') },
    { t: 'run', script: 'opening.cold.prodigys_shadow', when: origin('prodigys_shadow') },
    { t: 'run', script: 'opening.cold.late_starter', when: origin('late_starter') },

    { t: 'bgChange', bg: 'letter' },
    { t: 'music', track: 'envelope' },
    { t: 'flash', color: 'white' },
    nar('Three weeks later. A matte-black envelope. No stamp, no return address, just the crest of the Japan Football Union.'),
    nar('*“You have been selected as one of three hundred young strikers for the BLUE LOCK Project. Its goal: to create the one striker Japan has never had. Report to the enclosed address. Bring boots. Bring nothing else.”*'),
    mono('Selected. After the pass. After the loss. Somebody watched that match and saw something worth keeping, and I still haven’t forgiven it.', {
      when: origin('fallen_ace'),
    }),
    mono('A union crest and the word *striker*. The academy never once called me that. They called me a problem.', { when: origin('academy_exile') }),
    mono('How does a federation find a boy who isn’t registered anywhere? …The man behind the fence. He wrote it all down.', { when: origin('street_renegade') }),
    mono('*Striker.* They wrote striker. Three seasons of assists, and the one document that names me finally has the wrong job on it, or the right one.', { when: origin('overlooked_playmaker') }),
    mono('My name. Mine. Not his. I read it three times to be sure.', { when: origin('prodigys_shadow') }),
    mono('Eleven months. Somebody timed my progress and decided it was worth a seat. Or it’s a mistake. Either way, I’m not handing the seat back.', { when: origin('late_starter') }),

    impact('BLUE LOCK', 'lock'),
    { t: 'shake', intensity: 2 },
    { t: 'bgChange', bg: 'monitor_wall' },
    { t: 'music', track: 'selection-tension' },
    nar('Three hundred strikers. One cavernous room. A wall of screens waking up one after another, until every one of them is the same face.'),
    enter('ego', 'center', 'neutral'),
    say('ego', 'Welcome, egoists.', 'neutral'),
    say('ego', 'Japan has never produced a striker who could win a World Cup. Today, we begin fixing that. By destroying most of you.', 'smirk'),
    say('ego', 'I am Jinpachi Ego. For as long as you survive here, mine is the only opinion that matters, and I will give it to you honestly.', 'neutral'),
    { t: 'vision', on: true },
    say('ego', 'Prefectural final. Eighty-ninth minute. A pass, when there was a shot. You looked at the goal, and then you chose to be liked.', 'neutral', {
      when: origin('fallen_ace'),
    }),
    say('ego', 'Cut at sixteen for being “too selfish”. Your academy filed a talent under character flaws. I file it under *frightened someone*.', 'neutral', {
      when: origin('academy_exile'),
    }),
    say('ego', 'No club, no coach, no shape. My staff flagged you as an anomaly. I flagged you as a test case: what happens to a player who was never taught to fear structure?', 'neutral', { when: origin('street_renegade') }),
    say('ego', 'Four assists a week for three seasons. You see more of the pitch than most of this room, and you have spent years donating it to other people’s goals.', 'neutral', { when: origin('overlooked_playmaker') }),
    say('ego', 'Your sibling’s surname is on the same page as yours. Here, no one’s brother is anything. You are only the name you earn.', 'neutral', { when: origin('prodigys_shadow') }),
    say('ego', 'Eleven months of football. Most here have logged eleven years. I selected you anyway: my staff measured how fast you improve, and it frightened them.', 'neutral', { when: origin('late_starter') }),
    { t: 'vision', on: false },
    { t: 'shake', intensity: 1 },
    { t: 'cutIn', left: { who: 'ego', emotion: 'smirk' }, right: { who: 'player', emotion: 'neutral' }, text: 'Say why you’re here. In one breath.' },
    {
      t: 'timedChoice', prompt: 'Ego: “Say why you’re here. In one breath.”', seconds: 6, defaultChoiceId: 'ignore',
      timeoutEffects: [fx.adjust('composure', -8), fx.flag('FROZE_AT_ENTRY'), fx.rel('ego', { respect: -4 })],
      choices: egoOptions.map((o) => o.choice),
    },
    ...egoOptions.flatMap((o) => [label(o.choice.goto!), ...o.reply, go('ego_done')]),
    label('ego_done'),
    exit('ego'),

    { t: 'bgChange', bg: 'room_z' },
    { t: 'music', track: 'dorm-calm' },
    enter('anri', 'right', 'neutral'),
    say('anri', 'That’s everyone’s first interview done. Congratulations: you’ve survived being looked at by Ego.', 'smirk'),
    say('anri', 'One thing about your file.', 'neutral', { when: flag('ANOMALY_FLAGGED') }),
    say('anri', 'There’s a flag on it: “anomaly”. It doesn’t mean trouble. It means more people will be watching you than you’d like.', 'neutral', { when: flag('ANOMALY_FLAGGED') }),
    say('anri', 'Some of the coaching staff noted your academy history. Perhaps… don’t sit near the staff table at dinner.', 'neutral', { when: flag('COACH_DISTRUST') }),
    say('anri', 'Rooms are assigned on the third floor. Go and meet the others. The ones who survive here won’t be the ones who waited to be introduced.', 'smirk'),
    exit('anri'),

    { t: 'run', script: 'opening.approach.sora', when: origin('fallen_ace') },
    { t: 'run', script: 'opening.approach.reiji', when: origin('academy_exile') },
    { t: 'run', script: 'opening.approach.bachira', when: origin('street_renegade') },
    { t: 'run', script: 'opening.approach.barou', when: origin('overlooked_playmaker') },
    { t: 'run', script: 'opening.approach.rin', when: origin('prodigys_shadow') },
    { t: 'run', script: 'opening.approach.kunigami', when: origin('late_starter') },
    { t: 'run', script: 'opening.finale' },
  ],
}

export const openingFinale: ScriptInput = {
  id: 'opening.finale', title: 'Lights Out, Room Z', bg: 'room_z',
  beats: [
    { t: 'bgChange', bg: 'room_z' },
    { t: 'music', track: 'dorm-calm' },
    nar('Lights out. Somewhere above you, a wall of monitors keeps three hundred names in a table, and the table is already changing.'),
    mono('I said I would take every goal in this room. Every one of them heard it.', { when: flag('OPENING_STANCE', 'devour') }),
    mono('I asked how they’re measuring us. If there’s a number, I will find where it lies.', { when: flag('KNOWS_METRIC') }),
    mono('I said I’d make people better. I meant it. I just can’t tell yet if that’s a strength or a leash.', { when: flag('EGO_DOUBTS_YOU') }),
    mono('I said nothing, and he heard everything. I will not be that quiet twice.', { when: flag('SILENT_AT_ENTRY') }),
    mono('Whatever tomorrow is, I will not give it away.', { when: flag('ADMITTED_FEAR') }),
    mono('They filed me as an anomaly. Fine. Anomalies don’t follow the table.', { when: flag('ANOMALY_CONFIRMED') }),
    mono('Day one. I’m still here.'),
    { t: 'setFlag', flag: 'OPENING_COMPLETE', value: true },
    { t: 'effects', effects: [{ t: 'setArc', id: 'prologue', chapter: 1 }, fx.rep('mystery', 1)] },
    impact('ROOM Z', 'lock'),
    { t: 'wait', ms: 400 },
  ],
}

