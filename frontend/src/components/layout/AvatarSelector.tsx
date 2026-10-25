
import { useEffect, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'

type EyeStyle =
  | 'round' | 'square' | 'sleepy' | 'angry' | 'surprised'
  | 'wink' | 'star' | 'glasses' | 'hearts' | 'happy' | 'crying'

type MouthStyle =
  | 'none' | 'smile' | 'straight' | 'open' | 'frown'
  | 'grin' | 'tongue' | 'laugh' | 'teeth' | 'smirk' | 'tiny'

type PlayerAvatar = {
  color: string
  eye: EyeStyle
  mouth: MouthStyle
}

type AvatarSelectorProps = {
  value?: PlayerAvatar
  onChange?: (avatar: PlayerAvatar) => void
}

const DEFAULT_AVATAR: PlayerAvatar = {
  color: '#ffe600',
  eye: 'round',
  mouth: 'smile',
}

const COLORS = [
  '#ffe600', '#65e817', '#ff3434', '#ff941e',
  '#20dce8', '#5367ff', '#bd35f5', '#f06acb',
  '#ffffff', '#37d9a0', '#ffcf54', '#ff6b6b',
  '#8b5cf6', '#38bdf8', '#fb7185', '#a3e635',
  '#f97316', '#14b8a6', '#c084fc', '#f9a8d4',
  '#94a3b8', '#a16207', '#f5f5dc', '#64748b',
]

const EYES: EyeStyle[] = [
  'round', 'square', 'sleepy', 'angry', 'surprised',
  'wink', 'star', 'glasses', 'hearts', 'happy', 'crying',
]

const MOUTHS: MouthStyle[] = [
  'smile', 'straight', 'open', 'frown', 'grin',
  'tongue', 'laugh', 'teeth', 'smirk', 'tiny', 'none',
]

const buttonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: 36,
  height: 48,
  padding: 0,
  border: 0,
  background: 'transparent',
  color: '#fff',
  fontSize: 31,
  fontWeight: 900,
  lineHeight: 1,
  WebkitTextStroke: '1px #000',
  textShadow: '2px 2px #000, -2px -2px #000',
  cursor: 'pointer',
}

function PixelAvatar({ color, eye, mouth }: PlayerAvatar) {
  return (
    <svg
      viewBox="0 0 140 160"
      role="img"
      aria-label="Selected player avatar"
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        width: 120,
        height: 138,
        maxWidth: '100%',
        flexShrink: 0,
        overflow: 'visible',
        imageRendering: 'pixelated',
      }}
    >
      <defs>
        <clipPath id="avatar-head-clip">
          <path d="M46 8 H78 V12 H91 V20 H99 V28 H107 V40 H111 V68 H107 V80 H99 V88 H87 V96 H43 V92 H31 V84 H23 V72 H19 V40 H23 V28 H31 V20 H39 V12 H46 Z" />
        </clipPath>
        <clipPath id="avatar-body-clip">
          <path d="M42 105 H54 V101 H78 V105 H90 V111 H102 V119 H114 V127 H122 V139 H18 V131 H26 V123 H34 V115 H42 Z" />
        </clipPath>
      </defs>

      {/* Body */}
      <path
        d="M42 103 H54 V99 H78 V103 H90 V109 H102 V117 H114 V125 H122 V139 H18 V131 H26 V123 H34 V115 H42 Z"
        fill="#080514"
      />
      <g clipPath="url(#avatar-body-clip)">
        <rect x="15" y="98" width="110" height="44" fill={color} />
        <path d="M18 130 H122 V139 H18 Z" fill="#000" opacity=".12" />
      </g>

      {/* Head */}
      <path
        d="M46 5 H78 V9 H91 V17 H99 V25 H107 V37 H111 V67 H107 V79 H99 V87 H87 V95 H43 V91 H31 V83 H23 V71 H19 V39 H23 V27 H31 V19 H39 V11 H46 Z"
        fill="#080514"
      />
      <g clipPath="url(#avatar-head-clip)">
        <rect x="18" y="5" width="94" height="92" fill={color} />
        <path d="M18 5 H48 L23 35 H18 Z" fill="#fff" opacity=".12" />
        <path d="M85 5 H112 V27 L45 97 H29 Z" fill="#000" opacity=".1" />
      </g>

      {/* Eyes */}
      {eye === 'round' && <>
        <circle cx="43" cy="46" r="9" fill="#080514" />
        <circle cx="83" cy="46" r="9" fill="#080514" />
        <rect x="40" y="42" width="3" height="3" fill="#fff" />
        <rect x="80" y="42" width="3" height="3" fill="#fff" />
      </>}

      {eye === 'square' && <>
        <rect x="35" y="36" width="17" height="20" fill="#080514" />
        <rect x="75" y="36" width="17" height="20" fill="#080514" />
      </>}

      {eye === 'sleepy' && <>
        <path d="M32 45 H54 M74 45 H96" stroke="#080514" strokeWidth="7" />
      </>}

      {eye === 'angry' && <>
        <path d="M31 34 L56 43 V51 L31 42 Z" fill="#080514" />
        <path d="M73 43 L98 34 V42 L73 51 Z" fill="#080514" />
      </>}

      {eye === 'surprised' && <>
        <circle cx="43" cy="45" r="11" fill="#080514" />
        <circle cx="83" cy="45" r="11" fill="#080514" />
        <rect x="40" y="40" width="4" height="4" fill="#fff" />
        <rect x="80" y="40" width="4" height="4" fill="#fff" />
      </>}

      {eye === 'wink' && <>
        <circle cx="43" cy="45" r="9" fill="#080514" />
        <path d="M73 45 H94" stroke="#080514" strokeWidth="6" />
      </>}

      {eye === 'star' && <>
        <path d="M43 33 L47 41 L56 42 L49 48 L51 57 L43 52 L35 57 L37 48 L30 42 L39 41 Z" fill="#080514" />
        <path d="M83 33 L87 41 L96 42 L89 48 L91 57 L83 52 L75 57 L77 48 L70 42 L79 41 Z" fill="#080514" />
      </>}

      {eye === 'glasses' && <>
        <rect x="29" y="34" width="29" height="24" rx="5" fill="none" stroke="#080514" strokeWidth="5" />
        <rect x="69" y="34" width="29" height="24" rx="5" fill="none" stroke="#080514" strokeWidth="5" />
        <path d="M58 41 H69" stroke="#080514" strokeWidth="5" />
        <circle cx="43" cy="45" r="4" fill="#080514" />
        <circle cx="83" cy="45" r="4" fill="#080514" />
      </>}

      {eye === 'hearts' && <>
        <path d="M43 54 C39 50 29 43 34 36 C38 31 43 35 43 39 C47 32 56 33 57 40 C58 46 49 51 43 54 Z" fill="#ff4d79" />
        <path d="M83 54 C79 50 69 43 74 36 C78 31 83 35 83 39 C87 32 96 33 97 40 C98 46 89 51 83 54 Z" fill="#ff4d79" />
      </>}

      {eye === 'happy' && <>
        <path d="M31 47 Q43 31 55 47 M71 47 Q83 31 95 47" fill="none" stroke="#080514" strokeWidth="6" />
      </>}

      {eye === 'crying' && <>
        <circle cx="43" cy="43" r="8" fill="#080514" />
        <circle cx="83" cy="43" r="8" fill="#080514" />
        <path d="M39 54 L36 66 L43 62 L46 54 Z M79 54 L76 66 L83 62 L86 54 Z" fill="#38bdf8" />
      </>}

      {/* Mouths */}
      {mouth === 'smile' && <path d="M49 70 H77 V74 H73 V78 H57 V74 H49 Z" fill="#080514" />}
      {mouth === 'straight' && <rect x="51" y="72" width="27" height="5" fill="#080514" />}
      {mouth === 'open' && <ellipse cx="64" cy="74" rx="7" ry="9" fill="#080514" />}
      {mouth === 'frown' && <path d="M49 79 H56 V75 H72 V79 H79 V83 H49 Z" fill="#080514" />}

      {mouth === 'grin' && <>
        <path d="M47 69 H81 V81 H47 Z" fill="#080514" />
        <path d="M51 71 H77 V76 H51 Z" fill="#fff" />
      </>}

      {mouth === 'tongue' && <>
        <rect x="51" y="70" width="27" height="9" fill="#080514" />
        <rect x="59" y="78" width="13" height="9" fill="#ff6685" />
      </>}

      {mouth === 'laugh' && <>
        <path d="M45 68 H83 V80 H77 V85 H51 V80 H45 Z" fill="#080514" />
        <path d="M51 71 H77 V76 H51 Z" fill="#fff" />
        <path d="M55 80 H73 V85 H55 Z" fill="#ff6685" />
      </>}

      {mouth === 'teeth' && <>
        <path d="M48 69 H80 V81 H48 Z" fill="#080514" />
        <rect x="52" y="72" width="24" height="6" fill="#fff" />
        <path d="M60 72 V78 M68 72 V78" stroke="#080514" strokeWidth="2" />
      </>}

      {mouth === 'smirk' && <path d="M50 74 H66 V78 H76 V73 H81 V79 H74 V83 H57 V79 H50 Z" fill="#080514" />}
      {mouth === 'tiny' && <rect x="59" y="72" width="11" height="5" fill="#080514" />}
      {/* none = no mouth */}
    </svg>
  )
}

export default function AvatarSelector({ value, onChange }: AvatarSelectorProps) {
  const initial = value ?? DEFAULT_AVATAR

  const [colorIndex, setColorIndex] = useState(() =>
    Math.max(0, COLORS.indexOf(initial.color)),
  )
  const [eyeIndex, setEyeIndex] = useState(() =>
    Math.max(0, EYES.indexOf(initial.eye)),
  )
  const [mouthIndex, setMouthIndex] = useState(() =>
    Math.max(0, MOUTHS.indexOf(initial.mouth)),
  )

  const avatar: PlayerAvatar = {
    color: COLORS[colorIndex],
    eye: EYES[eyeIndex],
    mouth: MOUTHS[mouthIndex],
  }

  useEffect(() => {
    onChange?.(avatar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar.color, avatar.eye, avatar.mouth])

  const changeIndex = (
    setter: Dispatch<SetStateAction<number>>,
    length: number,
    direction: number,
  ) => {
    setter(current => (current + direction + length) % length)
  }

  const arrow = (
    direction: number,
    label: string,
    setter: Dispatch<SetStateAction<number>>,
    length: number,
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={buttonStyle}
      onClick={() => changeIndex(setter, length, direction)}
    >
      {direction === -1 ? '❮' : '❯'}
    </button>
  )

  const randomize = () => {
    setColorIndex(Math.floor(Math.random() * COLORS.length))
    setEyeIndex(Math.floor(Math.random() * EYES.length))
    setMouthIndex(Math.floor(Math.random() * MOUTHS.length))
  }

  return (
    <div
      className="avatar-selector"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minWidth: 0,
        height: 176,
        minHeight: 176,
        margin: '8px 0',
        padding: '8px 48px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-label="Randomize avatar"
        title="Random avatar"
        onClick={randomize}
        style={{
          position: 'absolute',
          top: 6,
          right: 8,
          zIndex: 3,
          width: 32,
          height: 32,
          padding: 0,
          border: 0,
          background: 'transparent',
          fontSize: 24,
          cursor: 'pointer',
        }}
      >
        🎲
      </button>

      {/* Left arrows: moved inward toward the avatar */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        {arrow(-1, 'Previous eyes', setEyeIndex, EYES.length)}
        {arrow(-1, 'Previous color', setColorIndex, COLORS.length)}
        {arrow(-1, 'Previous mouth', setMouthIndex, MOUTHS.length)}
      </div>

      {/* Centered avatar */}
      <PixelAvatar {...avatar} />

      {/* Right arrows: moved inward toward the avatar */}
      <div
        style={{
          position: 'absolute',
          right: 70,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 2,
        }}
      >
        {arrow(1, 'Next eyes', setEyeIndex, EYES.length)}
        {arrow(1, 'Next color', setColorIndex, COLORS.length)}
        {arrow(1, 'Next mouth', setMouthIndex, MOUTHS.length)}
      </div>
    </div>
  )
}
