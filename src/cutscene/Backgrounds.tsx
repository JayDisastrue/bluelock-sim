import type { BgId } from '../engine/schemas'
import { assetUrl, useManifest } from '../assets'

/**
 * Backgrounds are image-first: public/assets/backgrounds/<id>.(jpg|png|webp), listed under "backgrounds" in
 * manifest.json. With no image installed, a plain CSS gradient (no drawn scenery) keeps the scene readable.
 */
const FALLBACK: Record<BgId, string> = {
  black: '#000',
  letter: 'radial-gradient(circle at 50% 45%, #2b3150, #0a0c14 70%)',
  room_z: 'linear-gradient(180deg, #222a40, #0f1220)',
  cafeteria: 'linear-gradient(180deg, #2a3150 0%, #181c2c 60%, #0a0c14 100%)',
  locker_room: 'linear-gradient(180deg, #2f3a5a, #0c0f1a)',
  training_pitch: 'linear-gradient(180deg, #05060a 0%, #10204a 45%, #1d5a3a 46%, #0c2a1c 100%)',
  tunnel: 'radial-gradient(circle at 50% 50%, #d9ecff 0 8%, #14182a 9%, #05060a 70%)',
  stadium: 'linear-gradient(180deg, #1b1030 0%, #7a2a46 40%, #14182a 41%, #1d5a3a 75%, #0c2a1c 100%)',
  monitor_wall: 'repeating-linear-gradient(90deg, #0a1226 0 150px, #1f6bff22 150px 152px), #05060a',
  ego_office: 'linear-gradient(180deg, #0a1226, #05060a)',
  old_pitch: 'linear-gradient(180deg, #1b1030 0%, #7a2a46 45%, #1a3a22 46%, #0c2a1c 100%)',
  academy_gate: 'linear-gradient(180deg, #1a2030, #0c0f1a)',
  street_cage: 'linear-gradient(180deg, #05060a, #10204a 60%, #2a2a30 61%)',
  bench_dusk: 'linear-gradient(180deg, #1b1030 0%, #7a2a46 55%, #14182a 56%)',
}

export function Background({ id, className }: { id: BgId; className?: string }) {
  const m = useManifest()
  const file = m.backgrounds[id]
  return (
    <div className={`bg-layer ${className ?? ''}`} data-bg={id} style={file ? undefined : { background: FALLBACK[id] }}>
      {file && <img src={assetUrl(file)} alt="" className="bg-img" draggable={false} />}
    </div>
  )
}
