import { P, defineChars } from './helpers'

/** Original characters (invented for this game). Eight so far; the remaining ones arrive with the arcs that need them. */
export const original = defineChars([
  {
    id: 'sora', name: 'Sora Kaizuka', short: 'Sora', kind: 'original',
    portrait: P('spiky', '#3b2a1f', '#f0cfae', 'round', '#4a3a2a', 'arched', '#2a8a5a', '#fff', 'mid', 'bandage'),
    personality: 'Gentle, over-apologetic, hiding a fear that he is the reason you were never selfish. Wants to be worth your pass.',
    speech: 'Apologises first, thinks second. Gets steadier when someone gives him a plan.',
    egoType: 'redemption-seeker', playStyle: 'Left-wing runner with good first-touch finishing and shaky nerves.', weapon: 'Late-arriving volley',
    hooks: ['Your old teammate: the one you passed to in the final', 'How you answer his apology decides whether he becomes your engine or your wound'],
    originVariants: { fallen_ace: 'The pass you gave him, and the miss he gave back.' },
  },
  {
    id: 'reiji', name: 'Reiji Hasegawa', short: 'Reiji', kind: 'original', contemptForSoft: true,
    portrait: P('swept', '#c9b27a', '#f3d6bc', 'narrow', '#3a5a8a', 'straight', '#1f4ba8', '#fff', 'lean'),
    personality: 'Academy golden boy: polished, patient, certain the system loves the obedient. Resents you for being better on the ball and worse at hiding it.',
    speech: 'Smooth, courteous, edged. Compliments that land like fouls.',
    egoType: 'system prodigy', playStyle: 'Tidy, positional playmaking forward who never takes the unscripted shot.', weapon: 'Structured Press-Break',
    hooks: ['Was the academy captain on the day you were cut', 'Tests you in the cafeteria before the first match'],
    originVariants: { academy_exile: 'Was there the day you were cut. Says he “didn’t know”.' },
  },
  {
    id: 'mio', name: 'Mio Tachibana', short: 'Mio', kind: 'original', selectee: false, placeholder: true,
    portrait: P('curly', '#5a3a2a', '#f0cfae', 'round', '#4a3a2a', 'arched', '#f2efe6', '#e5233b', 'lean', 'freckles'),
    personality: 'Sports journalist with a camera and a conscience: wants the story, not the scandal.',
    speech: 'Quick, curious, relentlessly polite until the question that matters.', egoType: 'journalist', playStyle: 'Does not play.', weapon: 'Press pass',
    hooks: ['Media feed arc (M3+)', 'Remembers every contradiction you utter in public'], originVariants: {},
  },
  {
    id: 'haruka', name: 'Haruka Shirane', short: 'Haruka', kind: 'original', selectee: false, placeholder: true,
    portrait: P('long', '#2a1f1f', '#f3d6bc', 'round', '#3a2a2a', 'arched', '#f2efe6', '#1f6bff', 'lean'),
    personality: 'Your younger sister. Sharp, funny, afraid you will come back changed.',
    speech: 'Teasing, then suddenly direct.', egoType: 'family', playStyle: 'Does not play.', weapon: 'Honesty',
    hooks: ['Hometown contact scale (M3+)'], originVariants: {},
  },
  {
    id: 'dante', name: 'Dante Cavalli', short: 'Dante', kind: 'original', placeholder: true,
    portrait: P('curly', '#1a1a1f', '#e0b896', 'sharp', '#3a2a1f', 'thick', '#2a8a5a', '#fff', 'mid', 'mole'),
    personality: 'Italian stratum prodigy: a defender who treats attackers as a personal insult.',
    speech: 'Courteous, cutting, uses football idiom like poetry.', egoType: 'fortress', playStyle: 'Anticipating centre-back.', weapon: 'Catenaccio read',
    hooks: ['NEL Italy stratum antagonist (M6)'], originVariants: {},
  },
  {
    id: 'lukas', name: 'Lukas Brandt', short: 'Lukas', kind: 'original', placeholder: true,
    portrait: P('buzz', '#d9c27a', '#f3d6bc', 'sharp', '#4a6a8a', 'straight', '#101014', '#e5233b', 'broad'),
    personality: 'German stratum prodigy: precise, joyless, devastatingly consistent.',
    speech: 'Exact and unemotional.', egoType: 'machine', playStyle: 'Pressing forward.', weapon: 'Gegenpress',
    hooks: ['NEL Germany stratum (M6)'], originVariants: {},
  },
  {
    id: 'tomas', name: 'Tomás Ferreira', short: 'Tomás', kind: 'original', placeholder: true,
    portrait: P('long', '#2a1f1f', '#e5c19c', 'droopy', '#3a2a2a', 'arched', '#e5233b', '#f5d142', 'lean'),
    personality: 'Spanish stratum prodigy: plays like he is bored, because he reads everything three passes early.',
    speech: 'Soft, amused, ruthless.', egoType: 'conductor', playStyle: 'Midfield conductor.', weapon: 'Tiki-taka read',
    hooks: ['NEL Spain stratum (M6)'], originVariants: {},
  },
  {
    id: 'kisaragi', name: 'Ayame Kisaragi', short: 'Kisaragi', kind: 'original', selectee: false, placeholder: true,
    portrait: P('swept', '#8a1f3a', '#f3d6bc', 'narrow', '#3a1f2a', 'thin', '#101014', '#e5233b', 'lean'),
    personality: 'Sponsor executive who wants a face, not a footballer.',
    speech: 'Warm sales-patter over an iron spine.', egoType: 'sponsor', playStyle: 'Does not play.', weapon: 'Contracts',
    hooks: ['Sponsorships (M3+)', 'Buys your image; you may or may not sell it'], originVariants: {},
  },
])
