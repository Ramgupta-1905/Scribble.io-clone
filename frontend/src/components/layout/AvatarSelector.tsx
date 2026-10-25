import { useEffect, useId, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export type EyeStyle =
  | 'round'
  | 'square'
  | 'sleepy'
  | 'angry'
  | 'surprised'
  | 'wink'
  | 'star'
  | 'glasses'
  | 'hearts'
  | 'happy'
  | 'crying'

export type MouthStyle =
  | 'none'
  | 'smile'
  | 'straight'
  | 'open'
  | 'frown'
  | 'grin'
  | 'tongue'
  | 'laugh'
  | 'teeth'
  | 'smirk'
  | 'tiny'

export type PlayerAvatar = {
  color: string
  eye: EyeStyle
  mouth: MouthStyle
}

export const DEFAULT_PLAYER_AVATAR: PlayerAvatar = {
  color: '#ff3434',
  eye: 'round',
  mouth: 'frown',
}

const colors = [
  '#ffe600',
  '#65e817',
  '#ff3434',
  '#ff941e',
  '#20dce8',
  '#5367ff',
  '#bd35f5',
  '#f06acb',
  '#ffffff',
  '#37d9a0',
  '#ffcf54',
  '#ff6b6b',
  '#8b5cf6',
  '#38bdf8',
  '#fb7185',
  '#a3e635',
  '#f97316',
  '#14b8a6',
  '#c084fc',
  '#f9a8d4',
  '#94a3b8',
  '#a16207',
  '#f5f5dc',
  '#64748b',
]

const eyeStyles: EyeStyle[] = [
  'round',
  'square',
  'sleepy',
  'angry',
  'surprised',
  'wink',
  'star',
  'glasses',
  'hearts',
  'happy',
  'crying',
]

const mouthStyles: MouthStyle[] = [
  'smile',
  'straight',
  'open',
  'frown',
  'grin',
  'tongue',
  'laugh',
  'teeth',
  'smirk',
  'tiny',
  'none',
]

type AvatarSelectorProps = {
  value?: PlayerAvatar
  onChange?: (avatar: PlayerAvatar) => void
  className?: string
}

type PixelAvatarProps = PlayerAvatar & {
  className?: string
  size?: number | string
}

export function PixelAvatar({
  color,
  eye,
  mouth,
  className = 'pixel-avatar',
  size = '100%',
}: PixelAvatarProps) {
  const generatedId = useId()
  const avatarId = `pixel-avatar-${generatedId.replace(/:/g, '')}`

  return (
    <svg
      className={className}
      viewBox="0 0 140 160"
      width={size}
      height={size}
      role="img"
      aria-label="Player avatar"
      shapeRendering="crispEdges"
    >
      <defs>
        <clipPath id={`${avatarId}-head`}>
          <path d="M46 8 H78 V12 H91 V20 H99 V28 H107 V40 H111 V68 H107 V80 H99 V88 H87 V96 H43 V92 H31 V84 H23 V72 H19 V40 H23 V28 H31 V20 H39 V12 H46 Z" />
        </clipPath>

        <clipPath id={`${avatarId}-body`}>
          <path d="M42 105 H54 V101 H78 V105 H90 V111 H102 V119 H114 V127 H122 V139 H18 V131 H26 V123 H34 V115 H42 Z" />
        </clipPath>
      </defs>

      {/* Body outline */}
      <path
        d="M42 103 H54 V99 H78 V103 H90 V109 H102 V117 H114 V125 H122 V139 H18 V131 H26 V123 H34 V115 H42 Z"
        fill="#080514"
      />

      {/* Colored body */}
      <g clipPath={`url(#${avatarId}-body)`}>
        <rect x="15" y="98" width="110" height="44" fill={color} />
        <path d="M18 130 H122 V139 H18 Z" fill="#000" opacity="0.1" />
      </g>

      {/* Head outline */}
      <path
        d="M46 5 H78 V9 H91 V17 H99 V25 H107 V37 H111 V67 H107 V79 H99 V87 H87 V95 H43 V91 H31 V83 H23 V71 H19 V39 H23 V27 H31 V19 H39 V11 H46 Z"
        fill="#080514"
      />

      {/* Colored head */}
      <g clipPath={`url(#${avatarId}-head)`}>
        <rect x="18" y="5" width="94" height="92" fill={color} />
        <path d="M18 5 H48 L23 35 H18 Z" fill="#fff" opacity="0.12" />
        <path d="M85 5 H112 V27 L45 97 H29 Z" fill="#000" opacity="0.1" />
      </g>

      {/* Round eyes */}
      {eye === 'round' && (
        <>
          <circle cx="43" cy="46" r="9" fill="#080514" />
          <circle cx="83" cy="46" r="9" fill="#080514" />
          <rect x="40" y="42" width="3" height="3" fill="#fff" />
          <rect x="80" y="42" width="3" height="3" fill="#fff" />
        </>
      )}

      {/* Square eyes */}
      {eye === 'square' && (
        <>
          <rect x="35" y="36" width="17" height="20" fill="#080514" />
          <rect x="75" y="36" width="17" height="20" fill="#080514" />
        </>
      )}

      {/* Sleepy eyes */}
      {eye === 'sleepy' && (
        <>
          <path d="M32 45 H54" stroke="#080514" strokeWidth="7" />
          <path d="M74 45 H96" stroke="#080514" strokeWidth="7" />
        </>
      )}

      {/* Angry eyes */}
      {eye === 'angry' && (
        <>
          <path d="M31 34 L56 43 V51 L31 42 Z" fill="#080514" />
          <path d="M73 43 L98 34 V42 L73 51 Z" fill="#080514" />
        </>
      )}

      {/* Surprised eyes */}
      {eye === 'surprised' && (
        <>
          <circle cx="43" cy="45" r="11" fill="#080514" />
          <circle cx="83" cy="45" r="11" fill="#080514" />
          <rect x="40" y="40" width="4" height="4" fill="#fff" />
          <rect x="80" y="40" width="4" height="4" fill="#fff" />
        </>
      )}

      {/* Wink */}
      {eye === 'wink' && (
        <>
          <circle cx="43" cy="45" r="9" fill="#080514" />
          <path d="M73 45 H94" stroke="#080514" strokeWidth="6" />
        </>
      )}

      {/* Star eyes */}
      {eye === 'star' && (
        <>
          <path
            d="M43 33 L47 41 L56 42 L49 48 L51 57 L43 52 L35 57 L37 48 L30 42 L39 41 Z"
            fill="#080514"
          />
          <path
            d="M83 33 L87 41 L96 42 L89 48 L91 57 L83 52 L75 57 L77 48 L70 42 L79 41 Z"
            fill="#080514"
          />
        </>
      )}

      {/* Glasses */}
      {eye === 'glasses' && (
        <>
          <rect
            x="29"
            y="34"
            width="29"
            height="24"
            rx="5"
            fill="none"
            stroke="#080514"
            strokeWidth="5"
          />
          <rect
            x="69"
            y="34"
            width="29"
            height="24"
            rx="5"
            fill="none"
            stroke="#080514"
            strokeWidth="5"
          />
          <path d="M58 41 H69" stroke="#080514" strokeWidth="5" />
          <circle cx="43" cy="45" r="4" fill="#080514" />
          <circle cx="83" cy="45" r="4" fill="#080514" />
        </>
      )}

      {/* Heart eyes */}
      {eye === 'hearts' && (
        <>
          <path
            d="M43 54 C39 50 29 43 34 36 C38 31 43 35 43 39 C47 32 56 33 57 40 C58 46 49 51 43 54 Z"
            fill="#ff4d79"
          />
          <path
            d="M83 54 C79 50 69 43 74 36 C78 31 83 35 83 39 C87 32 96 33 97 40 C98 46 89 51 83 54 Z"
            fill="#ff4d79"
          />
        </>
      )}

      {/* Happy eyes */}
      {eye === 'happy' && (
        <>
          <path
            d="M31 47 Q43 31 55 47"
            fill="none"
            stroke="#080514"
            strokeWidth="6"
            strokeLinecap="square"
          />
          <path
            d="M71 47 Q83 31 95 47"
            fill="none"
            stroke="#080514"
            strokeWidth="6"
            strokeLinecap="square"
          />
        </>
      )}

      {/* Crying eyes */}
      {eye === 'crying' && (
        <>
          <circle cx="43" cy="43" r="8" fill="#080514" />
          <circle cx="83" cy="43" r="8" fill="#080514" />
          <path d="M39 54 L36 66 L43 62 L46 54 Z" fill="#38bdf8" />
          <path d="M79 54 L76 66 L83 62 L86 54 Z" fill="#38bdf8" />
        </>
      )}

      {/* Smile */}
      {mouth === 'smile' && (
        <path d="M49 70 H77 V74 H73 V78 H57 V74 H49 Z" fill="#080514" />
      )}

      {/* Straight mouth */}
      {mouth === 'straight' && (
        <rect x="51" y="72" width="27" height="5" fill="#080514" />
      )}

      {/* Open mouth */}
      {mouth === 'open' && (
        <ellipse cx="64" cy="74" rx="7" ry="9" fill="#080514" />
      )}

      {/* Frown */}
      {mouth === 'frown' && (
        <path d="M49 79 H56 V75 H72 V79 H79 V83 H49 Z" fill="#080514" />
      )}

      {/* Grin */}
      {mouth === 'grin' && (
        <>
          <path d="M47 69 H81 V81 H47 Z" fill="#080514" />
          <path d="M51 71 H77 V76 H51 Z" fill="#fff" />
        </>
      )}

      {/* Tongue */}
      {mouth === 'tongue' && (
        <>
          <rect x="51" y="70" width="27" height="9" fill="#080514" />
          <rect x="59" y="78" width="13" height="9" fill="#ff6685" />
        </>
      )}

      {/* Laugh */}
      {mouth === 'laugh' && (
        <>
          <path d="M45 68 H83 V80 H77 V85 H51 V80 H45 Z" fill="#080514" />
          <path d="M51 71 H77 V76 H51 Z" fill="#fff" />
          <path d="M55 80 H73 V85 H55 Z" fill="#ff6685" />
        </>
      )}

      {/* Teeth */}
      {mouth === 'teeth' && (
        <>
          <path d="M48 69 H80 V81 H48 Z" fill="#080514" />
          <rect x="52" y="72" width="24" height="6" fill="#fff" />
          <path d="M60 72 V78 M68 72 V78" stroke="#080514" strokeWidth="2" />
        </>
      )}

      {/* Smirk */}
      {mouth === 'smirk' && (
        <path
          d="M50 74 H66 V78 H76 V73 H81 V79 H74 V83 H57 V79 H50 Z"
          fill="#080514"
        />
      )}

      {/* Tiny mouth */}
      {mouth === 'tiny' && (
        <rect x="59" y="72" width="11" height="5" fill="#080514" />
      )}

      {/* The 'none' mouth style intentionally renders no mouth */}
    </svg>
  )
}

export default function AvatarSelector({
  value,
  onChange,
  className = '',
}: AvatarSelectorProps) {
  const [colorIndex, setColorIndex] = useState(() => {
    const index = colors.indexOf(value?.color ?? DEFAULT_PLAYER_AVATAR.color)
    return index >= 0 ? index : colors.indexOf(DEFAULT_PLAYER_AVATAR.color)
  })

  const [eyeIndex, setEyeIndex] = useState(() => {
    const index = eyeStyles.indexOf(value?.eye ?? DEFAULT_PLAYER_AVATAR.eye)
    return index >= 0 ? index : eyeStyles.indexOf(DEFAULT_PLAYER_AVATAR.eye)
  })

  const [mouthIndex, setMouthIndex] = useState(() => {
    const index = mouthStyles.indexOf(value?.mouth ?? DEFAULT_PLAYER_AVATAR.mouth)
    return index >= 0 ? index : mouthStyles.indexOf(DEFAULT_PLAYER_AVATAR.mouth)
  })

  const color = colors[colorIndex]
  const eye = eyeStyles[eyeIndex]
  const mouth = mouthStyles[mouthIndex]

  useEffect(() => {
    onChange?.({ color, eye, mouth })
  }, [color, eye, mouth, onChange])

  const randomAvatar = () => {
    setColorIndex(Math.floor(Math.random() * colors.length))
    setEyeIndex(Math.floor(Math.random() * eyeStyles.length))
    setMouthIndex(Math.floor(Math.random() * mouthStyles.length))
  }

  const changeIndex = (
    setter: Dispatch<SetStateAction<number>>,
    length: number,
    direction: number,
  ) => {
    setter(current => (current + direction + length) % length)
  }

  const arrowButton = (
    direction: number,
    label: string,
    action: (direction: number) => void,
  ) => (
    <button
      type="button"
      className="avatar-arrow"
      onClick={() => action(direction)}
      aria-label={label}
    >
      {direction === -1 ? '❮' : '❯'}
    </button>
  )

  return (
    <div className={`avatar-selector ${className}`.trim()}>
      <button
        type="button"
        className="random-avatar"
        onClick={randomAvatar}
        aria-label="Randomize avatar"
        title="Random avatar"
      >
        🎲
      </button>

      <div className="avatar-stage">
        <div className="avatar-arrows avatar-arrows-left">
          {arrowButton(-1, 'Previous eye style', direction =>
            changeIndex(setEyeIndex, eyeStyles.length, direction),
          )}

          {arrowButton(-1, 'Previous avatar color', direction =>
            changeIndex(setColorIndex, colors.length, direction),
          )}

          {arrowButton(-1, 'Previous mouth style', direction =>
            changeIndex(setMouthIndex, mouthStyles.length, direction),
          )}
        </div>

        <PixelAvatar color={color} eye={eye} mouth={mouth} />

        <div className="avatar-arrows avatar-arrows-right">
          {arrowButton(1, 'Next eye style', direction =>
            changeIndex(setEyeIndex, eyeStyles.length, direction),
          )}

          {arrowButton(1, 'Next avatar color', direction =>
            changeIndex(setColorIndex, colors.length, direction),
          )}

          {arrowButton(1, 'Next mouth style', direction =>
            changeIndex(setMouthIndex, mouthStyles.length, direction),
          )}
        </div>
      </div>
    </div>
  )
}