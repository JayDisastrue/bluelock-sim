import type { BgId } from '../engine/schemas'
import { assetUrl, useManifest } from '../assets'

/**
 * Backgrounds are image-first: public/assets/backgrounds/<id>.(jpg|png|webp), listed under "backgrounds" in
 * manifest.json. With no image installed, a plain CSS gradient (no drawn scenery) keeps the scene readable.
 */
const g = (a: string, b: string, mid?: string) => `linear-gradient(180deg, ${a}, ${mid ? mid + ', ' : ''}${b})`
const pitch = (sky: string, grass: string) => `linear-gradient(180deg, ${sky} 0%, ${sky} 45%, ${grass} 46%, #07140c 100%)`
const radial = (a: string, b: string) => `radial-gradient(circle at 50% 45%, ${a}, ${b} 72%)`
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
  // reserved ids: simple colour fallbacks until art is imported
  dorm_hallway: g('#2a3150', '#0c0f1a'),
  dorm_room: g('#2f3a5a', '#10131f'),
  shower_room: g('#23405a', '#0c1824'),
  gym: g('#2a2f45', '#10131f'),
  medical_room: g('#2b4a55', '#0f1a20'),
  lounge: g('#33304a', '#12111c'),
  rooftop: g('#10204a', '#0c0f1a', '#2a3150'),
  monitor_room_night: 'repeating-linear-gradient(90deg, #0a1226 0 150px, #1f6bff22 150px 152px), #05060a',
  selection_hall: g('#1a2040', '#05060a'),
  tag_test_arena: pitch('#0a1226', '#1d5a3a'),
  first_selection_field: pitch('#10204a', '#1d5a3a'),
  second_selection_field: pitch('#1b1030', '#1a4a2a'),
  training_pitch_night: pitch('#05060a', '#0c2a1c'),
  training_pitch_rain: pitch('#1c2a3a', '#12301f'),
  pitch_sunrise: pitch('#7a3a46', '#1d5a3a'),
  pitch_snow: pitch('#9fb4c8', '#dfe8f2'),
  indoor_court: g('#3a2f20', '#14100a'),
  futsal_court: g('#20304a', '#0a1020'),
  press_room: g('#2a2a38', '#0c0c14'),
  interview_stage: g('#3a1a2a', '#0a0610'),
  sponsor_lounge: g('#3a3350', '#14101c'),
  ego_lab: g('#0a1a2a', '#05060a'),
  briefing_room: g('#222a40', '#0a0c14'),
  corridor: g('#2a3150', '#05060a'),
  stairwell: g('#2a2f45', '#0a0c14'),
  vending_corner: g('#2f4a5a', '#0c1620'),
  hometown_street: g('#3a4a6a', '#1a2030'),
  school_gym: g('#3a3220', '#14100a'),
  school_classroom: g('#4a4a3a', '#1a1a14'),
  school_rooftop: g('#2a4a7a', '#1a2a4a'),
  riverside_pitch: pitch('#2a4a7a', '#2a6a3a'),
  convenience_store: g('#2a4a4a', '#0c1a1a'),
  train_station: g('#2a3040', '#0c0e16'),
  airport_gate: g('#2a3a50', '#0c1220'),
  bus_window: g('#1a2030', '#05060a'),
  bedroom_night: g('#1a1f38', '#05060a'),
  family_kitchen: g('#4a3a2a', '#1a140c'),
  hospital_room: g('#4a5a5a', '#1a2222'),
  shrine_steps: g('#3a2a2a', '#120c0c'),
  festival_night: g('#4a1a3a', '#0a0510'),
  beach_dusk: g('#7a3a56', '#10204a'),
  cafe: g('#4a3a30', '#14100c'),
  u20_stadium_day: pitch('#4a7ac8', '#2a6a3a'),
  u20_stadium_night: pitch('#0a1030', '#14502a'),
  stadium_tunnel_roar: 'radial-gradient(circle at 50% 50%, #ffe9c8 0 8%, #2a1a3a 9%, #05060a 70%)',
  press_conference: g('#202a40', '#05060a'),
  hotel_room: g('#3a3040', '#100c14'),
  city_night: g('#0a1226', '#2a1a4a'),
  locker_room_europe: g('#2a3a4a', '#0c1218'),
  training_ground_europe: pitch('#4a6a8a', '#1d5a3a'),
  penalty_spot: pitch('#1b1030', '#2a7a3a'),
  goal_mouth_close: g('#0a1a10', '#2a7a3a'),
  white_void: '#f2efe6',
  red_void: radial('#7a0f20', '#1a0308'),
  memory_haze: radial('#3a3a5a', '#0a0a14'),
  flow_field: radial('#1f6bff', '#05060a'),
  metavision_grid: 'repeating-linear-gradient(0deg, #1f6bff22 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, #1f6bff22 0 1px, transparent 1px 48px), #05060a',
  scoreboard_closeup: g('#10131f', '#000'),
  newspaper_wall: g('#4a4a42', '#14140f'),
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
