import type { BeatInput, EventInput, ScriptInput } from '../../engine/schemas'
import { and, flag, noFlag, origin, skill, or, trait, fx } from '../dsl'
import { enter, exit, label, mono, nar, say, toneChoice, go } from '../scenes/helpers'

interface EvtMeta {
  title: string
  cast: string[]
  hint?: string
  bg?: ScriptInput['bg']
}

/** Every opening event is scheduled by a choice (never rolled randomly) and its scene branches on what you did. */
function evt(id: string, meta: EvtMeta, beats: BeatInput[]): { event: EventInput; script: ScriptInput } {
  const sceneId = `scene.${id}`
  return {
    event: { id, title: meta.title, cast: meta.cast, hint: meta.hint, scheduledOnly: true, scenes: [sceneId], arc: 'prologue' },
    script: { id: sceneId, title: meta.title, bg: meta.bg ?? 'cafeteria', gallery: true, blurb: meta.hint, beats: [{ t: 'bgChange', bg: meta.bg ?? 'cafeteria' }, ...beats] },
  }
}

const list = [
  // ── Sora ──────────────────────────────────────────────────────────────
  evt('evt.sora.reunion', { title: 'Sora Remembers', cast: ['sora'], hint: 'Sora has not forgotten what you said to him.', bg: 'training_pitch' }, [
    nar('Two days later. Training pitch, before anyone else is awake.'),
    enter('sora', 'right', 'neutral'),
    say('sora', 'You said it wouldn’t matter again. I’ve been thinking about that. Can we run the finish? Please. No, sorry. *Can* we.', 'smirk', { when: flag('COMBO_ELIGIBLE:sora') }),
    say('sora', 'You said I’d have to take it from you. So.', 'furious', { when: flag('DEVOUR_TARGET:sora') }),
    say('sora', 'I know where you’d look. The keeper’s hands. That’s what I was staring at when I missed. Nobody told me I could stop.', 'neutral', { when: flag('READ:sora') }),
    say('sora', 'Hey. I did some drills on my own. I’m not apologising. I just wanted you to see.', 'neutral', { when: and(noFlag('COMBO_ELIGIBLE:sora'), noFlag('DEVOUR_TARGET:sora'), noFlag('READ:sora')) }),
    mono('He’s changed in two days. Or I have.'),
    ...toneChoice('soraB', 'sora', {
      Support: {
        label: 'Run the finish with him: you serve, he shoots.', major: true,
        effects: [fx.flag('SORA_ENGINE'), fx.rel('sora', { respect: 6 }), fx.skill('teamwork', 2)],
        reply: [say('sora', 'Left foot… right foot… *hit it*.', 'flow'), say('sora', 'It went in. It went IN, {player}.', 'smirk')],
      },
      Devour: {
        label: 'Take the ball off him. Show him what “taking it” costs.', major: true,
        effects: [fx.rel('sora', { rivalry: 8, respect: 6 }), fx.skill('ego', 2), fx.flag('SORA_RIVAL')],
        reply: [say('sora', 'Again.', 'furious'), say('sora', 'Again!', 'furious'), mono('He lost the ball six times. Each one, he got up faster. That’s not a miss any more: that’s a *hunger*.')],
      },
      Analyze: {
        label: 'Tell him: “Stop watching the keeper. Watch the net.”',
        effects: [fx.flag('SORA_FIXED'), fx.skill('finishing', 1)],
        reply: [say('sora', 'The net…', 'shocked'), say('sora', 'Oh. The net doesn’t move.', 'smirk')],
      },
      Ignore: { label: 'Leave him to it.', reply: [say('sora', 'Okay. Okay. I’ll do it by myself.', 'neutral')] },
    }, { prompt: 'He is waiting for you to decide who this is for.' }),
    exit('sora'),
  ]),

  // ── Reiji ─────────────────────────────────────────────────────────────
  evt('evt.reiji.test', { title: 'The Window Seat', cast: ['reiji'], hint: 'Reiji is not going to let the cafeteria forget.', bg: 'cafeteria' }, [
    nar('Lunch. Reiji and two academy boys have arranged themselves between you and the exit.'),
    enter('reiji', 'right', 'smirk'),
    say('reiji', 'Settle something for me. A one-on-one. Winner keeps the window seat.', 'smirk'),
    say('reiji', 'You said I wouldn’t have it for long. Let’s see how long.', 'smirk', { when: flag('DEVOUR_TARGET:reiji') }),
    say('reiji', 'You know my left first touch is dead weight. Don’t pretend you don’t. Let’s see if you can use it.', 'smirk', { when: flag('READ:reiji') }),
    ...toneChoice('reijiB', 'reiji', {
      Devour: {
        label: 'Accept. One-on-one, right now.', major: true,
        reply: [{ t: 'branch', cases: [{ when: or(skill('dribbling', '>=', 40), flag('READ:reiji')), goto: 'reijiWin' }], else: 'reijiLose' }],
      },
      Ignore: {
        label: 'Decline. Eat your lunch.', major: true,
        effects: [fx.rep('mediaDarling', -3), fx.flag('REIJI_SPREADS_IT')],
        memory: { verb: 'declined', text: 'You declined Reiji’s challenge in front of the cafeteria.' },
        reply: [say('reiji', 'Of course. Smart. Safe.', 'smirk')],
      },
    }, { prompt: 'The whole table has stopped chewing.' }),
    go('reijiOut'),
    label('reijiWin'),
    { t: 'shake', intensity: 2 },
    say('reiji', '…You got past me. On the *left*.', 'shocked'),
    { t: 'effects', effects: [fx.rel('reiji', { respect: 10, rivalry: 12 }), fx.flag('BEAT_REIJI'), fx.rep('egoAura', 5)] },
    mono('The window seat was just a seat. The room watching me take it wasn’t.'),
    go('reijiOut'),
    label('reijiLose'),
    { t: 'shake', intensity: 2 },
    say('reiji', 'Too slow. Too wild. They told you that, didn’t they?', 'smirk'),
    { t: 'effects', effects: [fx.rel('reiji', { rivalry: 10, trust: -6 }), fx.flag('LOST_TO_REIJI'), fx.adjust('composure', -10)] },
    mono('I know exactly what I did wrong. I’ll know it for a week.'),
    label('reijiOut'),
    exit('reiji'),
  ]),

  // ── Bachira ───────────────────────────────────────────────────────────
  evt('evt.bachira.invitation', { title: 'Play With Me', cast: ['bachira'], hint: 'Bachira has not stopped thinking about the monster in your feet.', bg: 'training_pitch' }, [
    nar('Night. The training pitch is supposed to be locked. It is not.'),
    enter('bachira', 'right', 'smirk'),
    say('bachira', 'You said you’d play with me one day. It’s one day.', 'smirk', { when: flag('COMBO_ELIGIBLE:bachira') }),
    say('bachira', 'You said monsters get eaten. So: catch.', 'metavision', { when: flag('DEVOUR_TARGET:bachira') }),
    say('bachira', 'Soooo. Have you got a monster? Show me.', 'smirk', { when: and(noFlag('COMBO_ELIGIBLE:bachira'), noFlag('DEVOUR_TARGET:bachira')) }),
    ...toneChoice('bachiraB', 'bachira', {
      Support: {
        label: 'Play for the joy of it. No score.', major: true,
        effects: [fx.rel('bachira', { trust: 10 }), fx.weapon('cage_feint'), fx.flag('BACHIRA_RHYTHM')],
        memory: { verb: 'played', text: 'You played with Bachira for no reason other than joy.' },
        reply: [{ t: 'aura', who: 'bachira', aura: 'flow' }, say('bachira', 'Heehee. There. There it is. Did you hear it? The ball hummed.', 'flow'), { t: 'aura', who: 'bachira', aura: null }],
      },
      Devour: {
        label: 'Play to win. Take the ball and keep it.', major: true,
        effects: [fx.rel('bachira', { rivalry: 12, respect: 8 }), fx.flag('BACHIRA_RIVAL')],
        reply: [say('bachira', 'Ahhh. You’re *serious*. Okay. Okay, I like it.', 'metavision')],
      },
      Ignore: { label: 'Tell him you’re tired.', reply: [say('bachira', 'Boo. Okay. Sleep tight, monster.', 'despair')] },
    }, { prompt: 'The ball is already rolling towards you.' }),
    exit('bachira'),
  ]),

  // ── Barou ─────────────────────────────────────────────────────────────
  evt('evt.barou.feed_me', { title: 'Feed Me', cast: ['barou'], hint: 'Barou is going to test whether you can be trusted with the ball.', bg: 'training_pitch' }, [
    nar('A five-a-side scrimmage. Barou has called for the ball four times and been ignored four times.'),
    enter('barou', 'right', 'furious'),
    say('barou', 'You. Passer. The next ball comes to me.', 'furious'),
    say('barou', 'You’ve already picked a side, haven’t you? Servant.', 'smirk', { when: flag('SEEN_AS_SOFT:barou') }),
    mono('The ball is at my feet. The goal is open. Barou is open. I can see both.'),
    {
      t: 'choice', prompt: 'Final minute. Level. Barou is open. You can score yourself.',
      choices: [
        {
          id: 'pass', label: 'Pass to Barou.', tone: 'Support', target: 'barou', major: true,
          effects: [fx.flag('FED_BAROU'), fx.rel('barou', { trust: 8 }), fx.flag('SERVANT_OF:barou')],
          memory: { verb: 'served', text: 'You passed to Barou in the final minute.' }, goto: 'feedPass',
        },
        {
          id: 'shoot', label: 'Shoot it yourself.', tone: 'Devour', target: 'barou', major: true,
          effects: [fx.flag('DENIED_BAROU'), fx.trait('hunger')],
          memory: { verb: 'denied', text: 'You scored in the final minute with Barou open.' }, goto: 'feedShoot',
        },
        {
          id: 'fake', label: 'Fake the pass, then shoot.', target: 'barou', major: true,
          requires: or(trait('bait'), skill('metavision', '>=', 45), origin('overlooked_playmaker')),
          lockedHint: 'Needs the Bait trait, Metavision ≥ 45, or a playmaker’s instincts.', hideWhenLocked: true,
          effects: [fx.trait('bait'), fx.rel('barou', { respect: 10, rivalry: 8 }), fx.flag('BAITED_BAROU')],
          memory: { verb: 'baited', text: 'You faked a pass to Barou and shot.' }, goto: 'feedFake',
        },
      ],
    },
    label('feedPass'),
    say('barou', 'Hm.', 'smirk'),
    say('barou', 'Good servant.', 'neutral'),
    go('feedEnd'),
    label('feedShoot'),
    { t: 'shake', intensity: 2 },
    say('barou', 'You *dare*.', 'furious'),
    say('barou', '…But you scored. Next time you will give it to me anyway.', 'smirk'),
    go('feedEnd'),
    label('feedFake'),
    { t: 'flash', color: 'blue' },
    say('barou', 'You looked at me, and then you shot. You *lied* with your eyes.', 'shocked'),
    say('barou', 'Do it again and I’ll break your legs. …Do it better and I’ll remember your name.', 'smirk'),
    label('feedEnd'),
    exit('barou'),
  ]),

  // ── Barou challenge (Devour stance) ───────────────────────────────────
  evt('evt.barou.challenge', { title: '“Every Goal?”', cast: ['barou'], hint: 'Someone in that room did not like what you said.', bg: 'cafeteria' }, [
    nar('Dinner. Barou’s tray lands next to yours hard enough to count as a statement.'),
    enter('barou', 'right', 'smirk'),
    say('barou', 'You’re the one who said “every goal.”', 'smirk'),
    say('barou', 'Including mine?', 'neutral'),
    ...toneChoice('barouC', 'barou', {
      Devour: {
        label: '“Especially yours.”', major: true,
        reply: [{ t: 'shake', intensity: 2 }, say('barou', 'Hahaha. Good. I’ll enjoy watching you try.', 'furious')],
      },
      Provoke: { label: '“Kings don’t have to ask.”', reply: [say('barou', 'Careful.', 'furious')] },
      Support: { label: '“Not yours. Yours I’ll set up.”', reply: [say('barou', 'You’d serve me?', 'shocked'), say('barou', 'Hm.', 'smirk')] },
      Ignore: { label: '(Keep eating.)', reply: [say('barou', 'You’ll answer me on the pitch, then.', 'neutral')] },
    }, { prompt: 'The table has gone silent.' }),
    exit('barou'),
  ]),

  // ── Rin ───────────────────────────────────────────────────────────────
  evt('evt.rin.measure', { title: 'Measured', cast: ['rin'], hint: 'Rin wants to see what is underneath your surname.', bg: 'training_pitch' }, [
    nar('Practice courts. Rin is waiting with a ball and a stopwatch.'),
    enter('rin', 'right', 'neutral'),
    say('rin', 'Three touches each. Whoever loses the ball first admits it.', 'neutral'),
    ...toneChoice('rinB', 'rin', {
      Devour: { label: 'Accept, and mean it.', major: true, effects: [fx.rel('rin', { respect: 8, rivalry: 10 })], reply: [say('rin', 'Good. Don’t look at the scoreboard. There isn’t one.', 'smirk')] },
      Support: { label: 'Accept, but say it’s just practice.', reply: [say('rin', 'Nothing is “just” anything.', 'neutral')] },
      Ignore: { label: 'Decline.', reply: [say('rin', 'Then you’re not as interesting as the name.', 'neutral')] },
    }, { prompt: 'He holds out the ball.' }),
    exit('rin'),
  ]),

  // ── Kunigami ──────────────────────────────────────────────────────────
  evt('evt.kunigami.lesson', { title: 'Fundamentals', cast: ['kunigami'], hint: 'Kunigami said he’d teach you. He meant it.', bg: 'training_pitch' }, [
    nar('Dawn. Kunigami is already doing wall passes.'),
    enter('kunigami', 'right', 'neutral'),
    say('kunigami', 'Stand with your weight on the balls of your feet. Not like you’re afraid it’ll hurt.', 'neutral'),
    ...toneChoice('kunB', 'kunigami', {
      Support: { label: 'Do exactly what he says. For an hour.', major: true, effects: [fx.skill('teamwork', 2), fx.skill('stamina', 2), fx.rel('kunigami', { trust: 6 })], reply: [say('kunigami', 'Better. Again.', 'smirk')] },
      Devour: { label: 'Ask him to show you his shot. Then copy it.', major: true, effects: [fx.skill('finishing', 3), fx.rel('kunigami', { respect: 4, rivalry: 4 })], reply: [say('kunigami', 'Not bad for eleven months. Not good either.', 'smirk')] },
      Ignore: { label: 'Practice alone, in silence.', reply: [say('kunigami', 'Suit yourself.', 'neutral')] },
    }, { prompt: 'The sun is barely up.' }),
    exit('kunigami'),
  ]),

  // ── Ego ───────────────────────────────────────────────────────────────
  evt('evt.ego.measured', { title: 'The Rubric', cast: ['ego'], hint: 'Ego took your question seriously. That should worry you.', bg: 'ego_office' }, [
    nar('Ego’s office. Monitors, a single chair, a graph that has your name on it.'),
    enter('ego', 'center', 'neutral'),
    say('ego', 'You asked what we measure. Here is one number: goals per opportunity.', 'neutral'),
    say('ego', 'Now: do you play to the number, or to the goal?', 'smirk'),
    {
      t: 'choice',
      choices: [
        { id: 'number', label: '“To the number. It tells me when to shoot.”', tone: 'Analyze', target: 'ego', major: true,
          effects: [fx.adjust('tacticalIntel', 2), fx.flag('GAMES_THE_METRIC'), fx.rel('ego', { respect: -2 })], goto: 'egoNumber', memory: { verb: 'optimised', text: 'You told Ego you play to the metric.' } },
        { id: 'goal', label: '“To the goal. The number is just paperwork.”', tone: 'Devour', target: 'ego', major: true,
          effects: [fx.flag('IGNORES_THE_METRIC'), fx.rel('ego', { respect: 8 }), fx.trait('hunger')], goto: 'egoGoal', memory: { verb: 'refused', text: 'You told Ego the number is just paperwork.' } },
      ],
    },
    label('egoNumber'),
    say('ego', 'Careful. A man who games the rubric ends up as a statistic.', 'neutral'),
    go('egoOut'),
    label('egoGoal'),
    say('ego', 'Good. The number was only ever my way of finding out which of you would say that.', 'smirk'),
    label('egoOut'),
    exit('ego'),
  ]),

  evt('evt.ego.doubts', { title: 'Prove It', cast: ['ego'], hint: 'Ego is not yet convinced you’re a striker.', bg: 'ego_office' }, [
    nar('Ego’s office again. The chair is gone; you stand.'),
    enter('ego', 'center', 'neutral'),
    say('ego', 'You said you wanted to make people better. I need to know if that’s a plan or an excuse.', 'neutral'),
    say('ego', 'Soon, some of you will be eliminated. Some, by you. What do you do when it’s a friend?', 'smirk'),
    {
      t: 'choice',
      choices: [
        { id: 'refuse', label: '“Nobody has to go. Not yet.”', tone: 'Support', target: 'ego', major: true,
          effects: [fx.rel('ego', { trust: 3, respect: -3 }), fx.flag('SOFT_ANSWER')], goto: 'doubtRefuse', memory: { verb: 'hesitated', text: 'You told Ego nobody has to go yet.' } },
        { id: 'accept', label: '“Then I’ll make sure it’s someone I can live with.”', tone: 'Devour', target: 'ego', major: true,
          effects: [fx.rel('ego', { respect: 8 }), fx.flag('EGO_DOUBTS_YOU', false), fx.rep('egoAura', 4)], goto: 'doubtAccept', memory: { verb: 'resolved', text: 'You told Ego you would choose who you can live with eliminating.' } },
      ],
    },
    label('doubtRefuse'),
    say('ego', 'Your kindness is a luxury. Enjoy it while the selections are still easy.', 'neutral'),
    go('doubtOut'),
    label('doubtAccept'),
    say('ego', 'Better. A striker who lies to himself about losing is not a striker.', 'smirk'),
    label('doubtOut'),
    exit('ego'),
  ]),
]

export const openingEvents: EventInput[] = list.map((x) => x.event)
export const openingEventScripts: ScriptInput[] = list.map((x) => x.script)
