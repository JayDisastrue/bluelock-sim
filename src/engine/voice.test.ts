import { describe, expect, it } from 'vitest'
import { pickBankClip, voiceFile, voiceKey, type VoiceBanks } from './voice'

const banks: VoiceBanks = {
  sora: { default: ['voice/sora/a.mp3', 'voice/sora/b.mp3', 'voice/sora/c.mp3'], furious: ['voice/sora/furious/x.mp3'] },
  solo: { default: ['voice/solo/only.mp3'] },
}

describe('voice banks', () => {
  it('prefers the emotion bank, falls back to default, and is silent for unknown speakers', () => {
    expect(pickBankClip(banks, 'sora', 'furious', undefined, () => 0)).toBe('voice/sora/furious/x.mp3')
    expect(pickBankClip(banks, 'sora', 'smirk', undefined, () => 0)).toBe('voice/sora/a.mp3')
    expect(pickBankClip(banks, 'nobody', 'smirk', undefined, () => 0)).toBeUndefined()
    expect(pickBankClip(undefined, 'sora', undefined, undefined, () => 0)).toBeUndefined()
  })
  it('never repeats the previous clip when there is an alternative', () => {
    for (let i = 0; i < 20; i++) expect(pickBankClip(banks, 'sora', undefined, 'voice/sora/a.mp3', () => i / 20)).not.toBe('voice/sora/a.mp3')
    expect(pickBankClip(banks, 'solo', undefined, 'voice/solo/only.mp3', () => 0)).toBe('voice/solo/only.mp3')
  })
  it('exact-line file naming is stable', () => {
    expect(voiceFile('opening.main:23')).toBe('voice/opening.main_23.mp3')
    expect(voiceKey('opening.main:23', 'fallen_ace')).toBe('opening.main_23@fallen_ace')
  })
})
