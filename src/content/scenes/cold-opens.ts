import type { ScriptInput } from '../../engine/schemas'
import { impact, mono, nar, say, enter, exit } from './helpers'

/** Cold opens: the wound each origin carries into the facility. Called from opening.main by origin. */
export const coldOpens: ScriptInput[] = [
  {
    id: 'opening.cold.fallen_ace', title: 'Cold Open: The Pass', bg: 'old_pitch', music: 'memory-hush',
    beats: [
      nar('Prefectural final. Eighty-ninth minute. One goal apiece.'),
      { t: 'panel', layout: 'strip3', cells: [
        { bg: 'old_pitch', caption: 'Your feet. The ball. Twelve yards of open grass.' },
        { bg: 'old_pitch', who: 'sora', emotion: 'shocked', caption: 'Sora, screaming for it on the left. Unmarked.' },
        { bg: 'old_pitch', who: 'player', emotion: 'neutral', caption: 'The goal was yours. The shot was on.', sfx: '…' },
      ] },
      mono('I saw the goal. I saw the whole goal. And then I looked at Sora and thought: *he’s wanted this longer than me.*'),
      impact('PASS.', 'quiet'),
      { t: 'shake', intensity: 1 },
      enter('sora', 'right', 'despair'),
      say('sora', 'It hit the post. I— sorry. I’m sorry, {player}. You gave me everything and I—', 'despair'),
      mono('He apologised. For *my* pass. We lost 1–2 and the scouts were already filing out. One of them stopped at the gate and kept looking at me.'),
      exit('sora'),
    ],
  },
  {
    id: 'opening.cold.academy_exile', title: 'Cold Open: Too Selfish', bg: 'academy_gate', music: 'memory-hush',
    beats: [
      nar('Academy gate. Rain. A cardboard box containing everything that was ever in your locker.'),
      enter('reiji', 'right', 'smirk'),
      say('reiji', '“Too selfish.” That’s what the report says. I read it over the director’s shoulder. Strange word for a forward.', 'smirk'),
      mono('Reiji Hasegawa. Captain. The kind of player coaches build brochures around. He never took a shot he hadn’t been given permission for.'),
      say('reiji', 'You were better than me on the ball, you know. You were just worse at pretending you weren’t.', 'neutral'),
      impact('CUT.', 'quiet'),
      mono('Nobody asked what I was being selfish *for*.'),
      exit('reiji'),
    ],
  },
  {
    id: 'opening.cold.street_renegade', title: 'Cold Open: The Cage', bg: 'street_cage', music: 'memory-hush',
    beats: [
      nar('Night. A wire-fenced cage under a flyover. The streetlight hums at the same pitch as the crowd.'),
      mono('No offside. No shape. Nobody telling me where to stand. Just five of them and one of me and the ball.'),
      { t: 'panel', layout: 'grid4', cells: [
        { bg: 'street_cage', who: 'player', emotion: 'smirk', caption: 'First defender: gone.', sfx: 'ZZT' },
        { bg: 'street_cage', who: 'player', emotion: 'flow', caption: 'Second: on the floor.' },
        { bg: 'street_cage', caption: 'The fence rattles when I score. It always rattles.' },
        { bg: 'street_cage', caption: 'Behind the wire: a man in a cheap suit, writing something down.' },
      ] },
      nar('He doesn’t cheer. He writes one word on his notepad and underlines it twice: ANOMALY.'),
      mono('A stranger wrote my name down like I was a weather event.'),
    ],
  },
  {
    id: 'opening.cold.overlooked_playmaker', title: 'Cold Open: Four Assists', bg: 'training_pitch', music: 'memory-hush',
    beats: [
      nar('Training pitch, Friday. Your fourth assist of the week. Nobody writes about assists.'),
      mono('I see where the gaps will be before the gaps do. It never mattered: the only number anybody reads is the one next to *his* name.'),
      nar('Your striker celebrates with the entire bench. You jog back to the halfway line, alone, still looking at the space the pass came from.'),
      { t: 'shake', intensity: 1 },
      mono('If I’d shot, would anyone have noticed I could?'),
    ],
  },
  {
    id: 'opening.cold.prodigys_shadow', title: 'Cold Open: Brother Of', bg: 'stadium', music: 'memory-hush',
    beats: [
      nar('A stadium big-screen. Your sibling’s face, thirty feet tall, mid-celebration. Beneath it, a graphic: transfer fee, club crest, a record.'),
      nar('Beneath that, a smaller caption: *“Younger brother also plays.”*'),
      mono('Everyone asks if I’m *that* Kuroiwa’s brother. Nobody has ever asked me what position I play.'),
      impact('SHADOW.', 'quiet'),
    ],
  },
  {
    id: 'opening.cold.late_starter', title: 'Cold Open: Eleven Months', bg: 'bench_dusk', music: 'memory-hush',
    beats: [
      nar('Dusk. A bench outside a school gym. A secondhand pair of boots, laces knotted twice.'),
      mono('Seventeen. Most of them started at five. I started eleven months ago.'),
      nar('A thousand hours of football on a cracked phone screen, and not one hour of being coached.'),
      mono('So I’m behind. Good. Behind means there is more to take.'),
    ],
  },
]
