
const characters = [
  { color: '#ff3434', face: 'glasses', mouth: 'smile' },
  { color: '#ff941e', face: 'round', mouth: 'open' },
  { color: '#ffeb27', face: 'angry', mouth: 'straight' },
  { color: '#70e52b', face: 'round', mouth: 'smile' },
  { color: '#20dce8', face: 'robot', mouth: 'grin' },
  { color: '#5367ff', face: 'sleepy', mouth: 'straight' },
  { color: '#bd35f5', face: 'angry', mouth: 'open' },
  { color: '#f06acb', face: 'cyclops', mouth: 'smile' },
] as const

type Character = (typeof characters)[number]

function PixelCharacter({
  character,
}: {
  character: Character
}) {
  const { color, face, mouth } = character

  return (
    <svg
      className="logo-character"
      viewBox="0 0 76 88"
      role="img"
      aria-label={`${face} pixel character`}
      shapeRendering="crispEdges"
    >
      {/* Body outline */}
      <path
        d="M22 61 H28 V56 H48 V61 H54 V65 H62 V70 H67 V78 H9 V70 H14 V65 H22 Z"
        fill="#080514"
      />

      {/* Body fill */}
      <path
        d="M24 62 H29 V59 H47 V62 H52 V66 H59 V71 H62 V74 H14 V70 H19 V66 H24 Z"
        fill={color}
      />

      {/* Head outline */}
      <path
        d="M25 5 H47 V9 H54 V14 H59 V21 H63 V42 H59 V49 H54 V54 H47 V58 H25 V54 H18 V49 H13 V42 H9 V21 H13 V14 H18 V9 H25 Z"
        fill="#080514"
      />

      {/* Head fill */}
      <path
        d="M26 9 H46 V13 H52 V18 H56 V24 H59 V40 H55 V46 H51 V50 H45 V54 H27 V50 H21 V46 H17 V40 H13 V24 H17 V18 H21 V13 H26 Z"
        fill={color}
      />

      {/* Pixel highlight */}
      <path
        d="M18 23 H22 V18 H27 V14 H36 V18 H27 V23 H22 V31 H18 Z"
        fill="#ffffff"
        opacity="0.22"
      />

      {/* Glasses */}
      {face === 'glasses' && (
        <>
          <path
            d="M16 24 H33 V27 H36 V36 H33 V39 H16 V36 H13 V27 H16 Z"
            fill="#080514"
          />
          <path
            d="M40 24 H55 V27 H58 V36 H55 V39 H40 V36 H37 V27 H40 Z"
            fill="#080514"
          />
          <rect x="17" y="27" width="14" height="9" fill={color} />
          <rect x="41" y="27" width="14" height="9" fill={color} />
          <rect x="32" y="28" width="8" height="3" fill="#080514" />
          <rect x="19" y="28" width="5" height="3" fill="#ffffff" />
          <rect x="43" y="28" width="5" height="3" fill="#ffffff" />
        </>
      )}

      {/* Round eyes */}
      {face === 'round' && (
        <>
          <rect x="20" y="25" width="10" height="13" fill="#080514" />
          <rect x="42" y="25" width="10" height="13" fill="#080514" />
          <rect x="22" y="27" width="4" height="4" fill="#ffffff" />
          <rect x="44" y="27" width="4" height="4" fill="#ffffff" />
        </>
      )}

      {/* Angry eyes */}
      {face === 'angry' && (
        <>
          <path d="M17 25 H34 V29 H30 V34 H25 V30 H17 Z" fill="#080514" />
          <path d="M40 29 H45 V25 H58 V30 H49 V34 H44 V30 H40 Z" fill="#080514" />
        </>
      )}

      {/* Robot eyes */}
      {face === 'robot' && (
        <>
          <rect x="18" y="24" width="15" height="16" fill="#080514" />
          <rect x="40" y="24" width="15" height="16" fill="#080514" />
          <rect x="22" y="28" width="7" height="7" fill="#ffffff" />
          <rect x="44" y="28" width="7" height="7" fill="#ffffff" />
        </>
      )}

      {/* Sleepy eyes */}
      {face === 'sleepy' && (
        <>
          <path d="M17 30 H34" stroke="#080514" strokeWidth="5" />
          <path d="M40 30 H57" stroke="#080514" strokeWidth="5" />
          <path d="M19 35 H31" stroke="#080514" strokeWidth="3" />
          <path d="M43 35 H55" stroke="#080514" strokeWidth="3" />
        </>
      )}

      {/* Single large eye */}
      {face === 'cyclops' && (
        <>
          <rect x="27" y="18" width="19" height="4" fill="#080514" />
          <rect x="23" y="22" width="27" height="4" fill="#080514" />
          <rect x="19" y="26" width="35" height="12" fill="#080514" />
          <rect x="23" y="38" width="27" height="4" fill="#080514" />
          <rect x="27" y="42" width="19" height="4" fill="#080514" />
          <rect x="25" y="26" width="23" height="12" fill="#ffffff" />
          <rect x="31" y="28" width="11" height="8" fill="#080514" />
        </>
      )}

      {/* Smiling mouth */}
      {mouth === 'smile' && (
        <>
          <rect x="25" y="43" width="25" height="4" fill="#080514" />
          <rect x="29" y="47" width="17" height="4" fill="#080514" />
        </>
      )}

      {/* Straight mouth */}
      {mouth === 'straight' && (
        <rect x="26" y="45" width="24" height="4" fill="#080514" />
      )}

      {/* Open mouth */}
      {mouth === 'open' && (
        <>
          <rect x="27" y="42" width="18" height="4" fill="#080514" />
          <rect x="23" y="46" width="26" height="7" fill="#080514" />
          <rect x="27" y="49" width="18" height="2" fill="#ff6685" />
        </>
      )}

      {/* Grinning mouth */}
      {mouth === 'grin' && (
        <>
          <rect x="22" y="42" width="32" height="4" fill="#080514" />
          <rect x="22" y="46" width="4" height="7" fill="#080514" />
          <rect x="50" y="46" width="4" height="7" fill="#080514" />
          <rect x="26" y="49" width="24" height="4" fill="#080514" />
          <rect x="27" y="43" width="22" height="4" fill="#ffffff" />
        </>
      )}
    </svg>
  )
}

function GameLogo() {
  return (
    <div className="game-logo">
      <h1 className="game-logo-title" aria-label="Skribbl.io!">
        <span className="logo-letter" style={{ color: '#ff3434' }}>s</span>
        <span className="logo-letter" style={{ color: '#ff941e' }}>k</span>
        <span className="logo-letter" style={{ color: '#ffeb27' }}>r</span>
        <span className="logo-letter" style={{ color: '#70e52b' }}>i</span>
        <span className="logo-letter" style={{ color: '#20dce8' }}>b</span>
        <span className="logo-letter" style={{ color: '#5367ff' }}>b</span>
        <span className="logo-letter" style={{ color: '#bd35f5' }}>l</span>
        <span className="logo-letter" style={{ color: '#ffffff' }}>.</span>
        <span className="logo-letter" style={{ color: '#ffffff' }}>i</span>
        <span className="logo-letter" style={{ color: '#ffffff' }}>o</span>

        <span className="logo-pencil" aria-hidden="true">
          <span className="pencil-eraser" />
          <span className="pencil-body" />
          <span className="pencil-tip" />
        </span>
      </h1>

      <div className="logo-characters" aria-label="Colorful pixel characters">
        {characters.map((character, index) => (
          <PixelCharacter
            key={`${character.color}-${index}`}
            character={character}
          />
        ))}
      </div>
    </div>
  )
}

export default GameLogo
