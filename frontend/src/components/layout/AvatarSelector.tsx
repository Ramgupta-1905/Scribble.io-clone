
import { useState } from 'react'

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
  '#ff8c24',
  '#37d9a0',
  '#ffcf54',
]

const eyeStyles = [
  'cyclops',
  'round',
  'square',
  'sleepy',
  'angry',
  'surprised',
  'wink',
] as const

const mouthStyles = [
  'none',
  'smile',
  'straight',
  'open',
  'frown',
  'grin',
  'tongue',
] as const

function AvatarSelector() {
  const [colorIndex, setColorIndex] = useState(0)
  const [eyeIndex, setEyeIndex] = useState(0)
  const [mouthIndex, setMouthIndex] = useState(0)

  const randomAvatar = () => {
    setColorIndex(Math.floor(Math.random() * colors.length))
    setEyeIndex(Math.floor(Math.random() * eyeStyles.length))
    setMouthIndex(Math.floor(Math.random() * mouthStyles.length))
  }

  const changeEye = (direction: number) => {
    setEyeIndex(
      (current) => (current + direction + eyeStyles.length) % eyeStyles.length
    )
  }

  const changeColor = (direction: number) => {
    setColorIndex(
      (current) => (current + direction + colors.length) % colors.length
    )
  }

  const changeMouth = (direction: number) => {
    setMouthIndex(
      (current) => (current + direction + mouthStyles.length) % mouthStyles.length
    )
  }

  const arrowButton = (
    direction: number,
    label: string,
    action: (direction: number) => void
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

  const color = colors[colorIndex]
  const eye = eyeStyles[eyeIndex]
  const mouth = mouthStyles[mouthIndex]

  return (
    <div className="avatar-selector">
      <button
        type="button"
        className="random-avatar"
        onClick={randomAvatar}
        aria-label="Randomize avatar"
        title="Random avatar"
      >
        🎲
      </button>

      <div className="avatar-arrows avatar-arrows-left">
        {arrowButton(-1, 'Previous eye style', changeEye)}
        {arrowButton(-1, 'Previous avatar color', changeColor)}
        {arrowButton(-1, 'Previous mouth style', changeMouth)}
      </div>

      <svg
        className="pixel-avatar"
        viewBox="0 0 140 160"
        role="img"
        aria-label={`Pixel avatar: ${eye} eyes, ${color} color, ${mouth} mouth`}
        shapeRendering="crispEdges"
      >
        <defs>
          <clipPath id="avatar-head-clip">
            <path d="
              M46 8 H78 V12 H91 V20 H99 V28 H107
              V40 H111 V68 H107 V80 H99 V88 H87
              V96 H43 V92 H31 V84 H23 V72 H19
              V40 H23 V28 H31 V20 H39 V12 H46 Z
            " />
          </clipPath>

          <clipPath id="avatar-body-clip">
            <path d="
              M42 105 H54 V101 H78 V105 H90
              V111 H102 V119 H114 V127 H122
              V139 H18 V131 H26 V123 H34
              V115 H42 Z
            " />
          </clipPath>
        </defs>

        {/* Body outline */}
        <path
          d="
            M42 103 H54 V99 H78 V103 H90
            V109 H102 V117 H114 V125 H122
            V139 H18 V131 H26 V123 H34
            V115 H42 Z
          "
          fill="#080514"
        />

        {/* Solid-color pixel body */}
        <g clipPath="url(#avatar-body-clip)">
          <rect x="15" y="98" width="110" height="44" fill={color} />
          <path
            d="M18 130 H122 V139 H18 Z"
            fill="#000000"
            opacity="0.10"
          />
        </g>

        {/* Dark pixel outline around the head */}
        <path
          d="
            M46 5 H78 V9 H91 V17 H99 V25 H107
            V37 H111 V67 H107 V79 H99 V87 H87
            V95 H43 V91 H31 V83 H23 V71 H19
            V39 H23 V27 H31 V19 H39 V11 H46 Z
          "
          fill="#080514"
        />

        {/* Solid head color and subtle shading */}
        <g clipPath="url(#avatar-head-clip)">
          <rect x="18" y="5" width="94" height="92" fill={color} />

          <path
            d="M18 5 H48 L23 35 H18 Z"
            fill="#ffffff"
            opacity="0.12"
          />

          <path
            d="M85 5 H112 V27 L45 97 H29 Z"
            fill="#000000"
            opacity="0.10"
          />
        </g>

        {/* Eye expressions */}
        {eye === 'cyclops' && (
          <>
            <circle cx="49" cy="46" r="17" fill="#080514" />
            <circle cx="49" cy="46" r="12" fill={color} />
            <circle cx="49" cy="46" r="7" fill="#080514" />
            <rect x="44" y="39" width="5" height="4" fill="#ffffff" />
          </>
        )}

        {eye === 'round' && (
          <>
            <circle cx="43" cy="46" r="9" fill="#080514" />
            <circle cx="83" cy="46" r="9" fill="#080514" />
            <rect x="40" y="42" width="3" height="3" fill="#ffffff" />
            <rect x="80" y="42" width="3" height="3" fill="#ffffff" />
          </>
        )}

        {eye === 'square' && (
          <>
            <rect x="35" y="36" width="17" height="20" fill="#080514" />
            <rect x="75" y="36" width="17" height="20" fill="#080514" />
          </>
        )}

        {eye === 'sleepy' && (
          <>
            <path d="M32 45 H54" stroke="#080514" strokeWidth="7" />
            <path d="M74 45 H96" stroke="#080514" strokeWidth="7" />
          </>
        )}

        {eye === 'angry' && (
          <>
            <path d="M31 34 L56 43 V51 L31 42 Z" fill="#080514" />
            <path d="M73 43 L98 34 V42 L73 51 Z" fill="#080514" />
          </>
        )}

        {eye === 'surprised' && (
          <>
            <circle cx="43" cy="45" r="11" fill="#080514" />
            <circle cx="83" cy="45" r="11" fill="#080514" />
            <rect x="40" y="40" width="4" height="4" fill="#ffffff" />
            <rect x="80" y="40" width="4" height="4" fill="#ffffff" />
          </>
        )}

        {eye === 'wink' && (
          <>
            <circle cx="43" cy="45" r="9" fill="#080514" />
            <path d="M73 45 H94" stroke="#080514" strokeWidth="6" />
          </>
        )}

        {/* Mouth expressions */}
        {mouth === 'smile' && (
          <path
            d="M49 70 H77 V74 H73 V78 H57 V74 H49 Z"
            fill="#080514"
          />
        )}

        {mouth === 'straight' && (
          <rect x="51" y="72" width="27" height="5" fill="#080514" />
        )}

        {mouth === 'open' && (
          <ellipse cx="64" cy="74" rx="7" ry="9" fill="#080514" />
        )}

        {mouth === 'frown' && (
          <path
            d="M49 79 H56 V75 H72 V79 H79 V83 H49 Z"
            fill="#080514"
          />
        )}

        {mouth === 'grin' && (
          <>
            <path d="M47 69 H81 V81 H47 Z" fill="#080514" />
            <path d="M51 71 H77 V76 H51 Z" fill="#ffffff" />
          </>
        )}

        {mouth === 'tongue' && (
          <>
            <rect x="51" y="70" width="27" height="9" fill="#080514" />
            <rect x="59" y="78" width="13" height="9" fill="#ff6685" />
          </>
        )}

        {/* 'none' intentionally renders no mouth */}
      </svg>

      <div className="avatar-arrows avatar-arrows-right">
        {arrowButton(1, 'Next eye style', changeEye)}
        {arrowButton(1, 'Next avatar color', changeColor)}
        {arrowButton(1, 'Next mouth style', changeMouth)}
      </div>
    </div>
  )
}

export default AvatarSelector
