import type { ScriptInput } from '../../engine/schemas'
import { origin } from '../dsl'
import { enter, exit, mono, nar, say, toneChoice } from './helpers'

/** The person who approaches you depends on where you came from (design §4). */
export const approaches: ScriptInput[] = [
  // ───────────── Fallen Ace → Sora Kaizuka (original) ─────────────
  {
    id: 'opening.approach.sora', title: 'The Teammate You Passed To', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('Third floor. A cafeteria of strangers, all pretending not to count each other. One of them is not a stranger.'),
      enter('sora', 'right', 'shocked'),
      say('sora', '{player}…? You got the letter too.', 'shocked'),
      say('sora', 'I almost didn’t come. I kept thinking the invitation was for the miss and not the pass, and then I realised that doesn’t make sense, and then I came anyway.', 'despair'),
      mono('Sora Kaizuka. Left wing. The boy I gave the final to. He is looking at me the way you look at a creditor you actually like.'),
      say('sora', 'I’m sorry again. I know you’re sick of it. I just— I want to be worth the pass.', 'despair'),
      ...toneChoice('sora', 'sora', {
        Support: {
          label: '“It wasn’t your miss. Let’s make sure it never matters again.”', major: true,
          memory: { verb: 'forgave', text: 'You told Sora the miss wasn’t his, and promised it would never matter again.' },
          reply: [say('sora', '…Okay. Okay. Then I’ll stop apologising. Starting now. Starting— sorry.', 'smirk'), say('sora', 'No. Starting *now*.', 'smirk')],
        },
        Devour: {
          label: '“Next time you won’t get my pass. You’ll have to take the ball from me.”', major: true,
          memory: { verb: 'cut-off', text: 'You told Sora you would never pass to him again.' },
          reply: [
            say('sora', 'I… understand.', 'despair'),
            say('sora', 'Then I’ll take it. I’ll take it from you. I’ve never taken anything from anyone before.', 'furious'),
          ],
        },
        Provoke: {
          label: '“Say sorry one more time. I dare you.”',
          reply: [say('sora', 'I— no. No, I won’t.', 'shocked'), say('sora', 'You *are* doing this on purpose, aren’t you?', 'furious')],
        },
        Analyze: {
          label: '“What were you looking at, right before the miss?”',
          reply: [
            say('sora', 'The keeper’s hands. They shifted at the last second. I knew it was too late to change it.', 'shocked'),
            mono('He saw the save before he took the shot. A bad habit worth knowing about: he reads the keeper, then flinches.'),
          ],
        },
        Ignore: {
          label: '(Nod once and keep walking.)',
          reply: [say('sora', '…Right. Of course. Sorry for— never mind.', 'despair')],
        },
      }, { prompt: 'How do you answer his apology?', delayed: [{ eventId: 'evt.sora.reunion', delay: [2, 3] }] }),
      exit('sora'),
    ],
  },

  // ───────────── Academy Exile → Reiji Hasegawa (original) ─────────────
  {
    id: 'opening.approach.reiji', title: 'The Golden Boy', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('Third floor. A long table by the window, the best seat in the room. Someone is already sitting in it.'),
      enter('reiji', 'right', 'smirk'),
      say('reiji', 'You look surprised. Don’t be. They send the academy’s sons through the front door. They let you in through the back.', 'smirk'),
      mono('Reiji Hasegawa. The captain who watched me leave. He kept the window seat. Of course he did.'),
      say('reiji', 'For what it’s worth: I didn’t know they were cutting you. I only knew afterwards. I thought you’d want to hear that from me.', 'neutral'),
      mono('He thinks that’s a kindness. It’s the most patronising thing anyone has ever said to me and I want to remember every word.'),
      ...toneChoice('reiji', 'reiji', {
        Provoke: {
          label: '“Enjoy the window. It won’t be yours for long.”', major: true,
          memory: { verb: 'provoked', text: 'You told Reiji his seat wouldn’t be his for long.' },
          reply: [say('reiji', 'Careful. People who talk like that usually end up in a box by the gate.', 'furious'), say('reiji', 'I mean that as a courtesy.', 'smirk')],
        },
        Devour: {
          label: '“I’m going to eat your position, Hasegawa.”', major: true,
          memory: { verb: 'declared', text: 'You told Reiji you would take his place.' },
          reply: [say('reiji', 'You can’t eat a position. You have to be *given* it.', 'neutral'), say('reiji', '…But I’d like to watch you try.', 'smirk')],
        },
        Analyze: {
          label: '“Your first touch is still dead weight on your left. You hide it with a faster second one.”',
          requires: origin('academy_exile'), lockedHint: 'Only an insider would know his tells.',
          reply: [
            say('reiji', '…Nobody has ever noticed that.', 'shocked'),
            mono('He’s rattled. For two seconds, the golden boy is a boy.'),
          ],
        },
        Support: {
          label: '“We both got dealt this. Let’s not eat each other yet.”',
          reply: [say('reiji', 'How *mature*.', 'smirk'), say('reiji', 'Don’t mistake courtesy for weakness. I’ll remember you said that.', 'neutral')],
        },
        Ignore: {
          label: '(Pick a different table.)',
          reply: [say('reiji', 'You can’t avoid me forever. We’re the same weight class.', 'smirk')],
        },
      }, { prompt: 'He’s waiting for you to react.', delayed: [{ eventId: 'evt.reiji.test', delay: [2, 3] }] }),
      exit('reiji'),
    ],
  },

  // ───────────── Street Renegade → Bachira (canon) ─────────────
  {
    id: 'opening.approach.bachira', title: 'Anomaly Recognises Anomaly', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('The cafeteria goes quiet in the way a room goes quiet when everyone has read the same rumour.'),
      enter('bachira', 'right', 'smirk'),
      say('bachira', 'Heyyy. You’re the cage kid, right? The staff say “anomaly”. I say: *monster*. Same thing but nicer.', 'smirk'),
      say('bachira', 'Have you got one too? Everyone who plays like us has one. A monster. It lives in the ball.', 'metavision'),
      mono('Meguru Bachira. I’ve never met him and I already know how he moves. Wrong. *Right*. Unreasonable.'),
      ...toneChoice('bachira', 'bachira', {
        Support: {
          label: '“Play with me one day, then.”', major: true,
          memory: { verb: 'promised', text: 'You promised Bachira you’d play with him one day.' },
          reply: [{ t: 'aura', who: 'bachira', aura: 'flow' }, say('bachira', 'You *mean* that. I can tell. Okay. I’m going to hold you to it.', 'flow'), { t: 'aura', who: 'bachira', aura: null }],
        },
        Devour: {
          label: '“Monsters get eaten.”', major: true,
          memory: { verb: 'challenged', text: 'You told Bachira that monsters get eaten.' },
          reply: [say('bachira', 'Oooh. Okay.', 'metavision'), say('bachira', 'Then try to catch mine.', 'smirk')],
        },
        Provoke: {
          label: '“Which of us is the monster, then?”',
          reply: [say('bachira', 'Both. That’s the *fun* part!', 'smirk')],
        },
        Analyze: {
          label: '“What do you see when you start a dribble?”',
          reply: [say('bachira', 'I don’t see. I *hear*. Like the ball’s humming a direction.', 'metavision'), mono('Rhythm, not geometry. His weakness is that it only works when he’s having fun.')],
        },
        Ignore: {
          label: '“I don’t do monsters.”',
          reply: [say('bachira', 'Aww. That’s sad. Everybody does.', 'despair')],
        },
      }, { prompt: 'Everyone in the cafeteria is watching.', delayed: [{ eventId: 'evt.bachira.invitation', delay: [2, 3] }] }),
      exit('bachira'),
    ],
  },

  // ───────────── Overlooked Playmaker → Barou (canon) ─────────────
  {
    id: 'opening.approach.barou', title: 'A King Needs Servants', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('The fastest way to find the loudest person in a room is to look for the empty space around him.'),
      enter('barou', 'right', 'smirk'),
      say('barou', 'A playmaker. Good. A king needs somebody to carry the ball to the box.', 'smirk'),
      say('barou', 'You’ll feed me. You’ll be punished if you don’t. That’s all you need to know.', 'neutral'),
      mono('Shoei Barou. He has said eleven words and he has already assigned me a job.'),
      ...toneChoice('barou', 'barou', {
        Support: {
          label: '“Tell me where you want it.”', major: true,
          memory: { verb: 'served', text: 'You asked Barou where he wanted the ball.' },
          reply: [say('barou', 'Hm. You learn quickly.', 'smirk'), say('barou', 'That’s what a servant is for.', 'neutral')],
          reveal: 'Barou now thinks of you as a servant. It is a respect of sorts, and a cage.',
        },
        Devour: {
          label: '“I eat kings.”', major: true,
          memory: { verb: 'defied', text: 'You told Barou you eat kings.' },
          reply: [{ t: 'shake', intensity: 2 }, say('barou', 'You *what*?', 'furious'), say('barou', '…Say it again when you’ve scored in front of me.', 'smirk')],
        },
        Provoke: {
          label: '“Kings who have to ask for the ball aren’t kings.”',
          reply: [say('barou', 'Careful, passer.', 'furious')],
        },
        Analyze: {
          label: '“You always take the first touch with your right. Even when the left is open.”',
          reply: [say('barou', 'Hm.', 'shocked'), mono('He hates being read. He also noticed that I could.')],
        },
        Ignore: {
          label: '(Walk past him.)',
          reply: [say('barou', 'You’ll come to me. They always do.', 'smirk')],
        },
      }, { prompt: 'He has not asked a question. He expects an answer.', delayed: [{ eventId: 'evt.barou.feed_me', delay: [2, 3] }] }),
      exit('barou'),
    ],
  },

  // ───────────── Prodigy's Shadow → Rin Itoshi (canon) ─────────────
  {
    id: 'opening.approach.rin', title: 'Another Famous Name', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('Third floor. A boy sits very straight at a table by himself. His food is untouched.'),
      enter('rin', 'right', 'neutral'),
      say('rin', 'Another one with a famous name behind them.', 'neutral'),
      say('rin', 'Here, it means nothing. Mine either. I intend to make that true.', 'neutral'),
      mono('Rin Itoshi. His brother’s name is the biggest thing in the building and he is the only one who can’t hear it without flinching.'),
      ...toneChoice('rin', 'rin', {
        Support: {
          label: '“I know what it’s like. Being measured against someone who isn’t even in the room.”', major: true,
          reply: [say('rin', '…Don’t.', 'furious'), say('rin', 'Don’t say that as if we’re the same.', 'neutral')],
        },
        Devour: {
          label: '“Then we’ll find out who’s the bigger name when this is over.”', major: true,
          reply: [say('rin', 'Interesting. Most people want to be on the page next to him.', 'smirk')],
        },
        Provoke: { label: '“You flinch every time they say his name.”', reply: [say('rin', 'And you’ve never counted how many times they say yours?', 'furious')] },
        Analyze: { label: '“You’re not eating. You’re saving it for something.”', reply: [say('rin', '…Observant.', 'shocked')] },
        Ignore: { label: '(Sit somewhere else.)', reply: [say('rin', 'Good. Sit far away.', 'neutral')] },
      }, { prompt: 'He doesn’t look at you.', delayed: [{ eventId: 'evt.rin.measure', delay: [2, 3] }] }),
      exit('rin'),
    ],
  },

  // ───────────── Late Starter → Kunigami (canon) ─────────────
  {
    id: 'opening.approach.kunigami', title: 'A Hero’s Handshake', bg: 'cafeteria',
    beats: [
      { t: 'bgChange', bg: 'cafeteria' },
      nar('The cafeteria is a room of arms crossed. One hand is held out.'),
      enter('kunigami', 'right', 'neutral'),
      say('kunigami', 'Rensuke Kunigami. You were whispering about how long you’d been playing. I overheard.', 'neutral'),
      say('kunigami', 'Eleven months? That’s… a lot of ground to make up.', 'shocked'),
      say('kunigami', 'I’m not going to pretend it’s fair. But if you want, I’ll show you what I know.', 'smirk'),
      mono('A stranger offered me a lesson in the first hour. In a building designed to turn us against each other.'),
      ...toneChoice('kunigami', 'kunigami', {
        Support: {
          label: '“Yes. Teach me. I’ll pay you back by beating you.”', major: true,
          memory: { verb: 'accepted', text: 'You accepted Kunigami’s offer to teach you.' },
          reply: [say('kunigami', 'Good. That’s the right way to say it.', 'smirk')],
        },
        Devour: {
          label: '“I’ll learn from you, and then I’ll take your spot.”', major: true,
          reply: [say('kunigami', '…Fair. I’d do the same.', 'smirk')],
        },
        Provoke: { label: '“I don’t need charity.”', reply: [say('kunigami', 'It’s not charity. Charity doesn’t want anything back.', 'furious')] },
        Analyze: { label: '“What’s the first thing you’d fix about me?”', reply: [say('kunigami', 'Your stance. You stand like a player who thinks the ball is going to hurt him.', 'neutral')] },
        Ignore: { label: '(Shake his hand, say nothing.)', reply: [say('kunigami', 'Strong grip. Good.', 'smirk')] },
      }, { prompt: 'His hand is still out.', delayed: [{ eventId: 'evt.kunigami.lesson', delay: [2, 3] }] }),
      exit('kunigami'),
    ],
  },
]
