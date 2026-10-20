const scenes = {
  booth: `<svg viewBox="0 0 640 360" role="img" aria-label="Night booth with a dark on-air lamp, a console, and two reels.">
    <rect width="640" height="360" fill="#17130f"/>
    <rect x="36" y="28" width="250" height="150" fill="#0c1218" stroke="#3c3428"/>
    <circle cx="150" cy="92" r="28" fill="#d7d2c4" opacity=".85"/>
    <rect x="70" y="150" width="180" height="8" fill="#2a241c"/>
    <rect x="310" y="150" width="280" height="70" rx="6" fill="#2a2118" stroke="#6d5432"/>
    <circle cx="360" cy="186" r="22" fill="none" stroke="#e2a14a" stroke-width="6"/>
    <circle cx="430" cy="186" r="22" fill="none" stroke="#9dbe7c" stroke-width="6"/>
    <rect x="470" y="168" width="90" height="10" fill="#3a3126"/>
    <circle cx="500" cy="128" r="8" fill="#5a2a24"/>
    <rect x="300" y="230" width="300" height="16" fill="#3a3126"/>
    <rect x="70" y="250" width="120" height="70" fill="#241c14" stroke="#6d5432"/>
    <path d="M90 250v70M130 250v70" stroke="#6d5432"/>
  </svg>`,
  lobby: `<svg viewBox="0 0 640 360" role="img" aria-label="Lobby with a glass door, coat pegs, and a desk.">
    <rect width="640" height="360" fill="#14110e"/>
    <rect x="40" y="30" width="160" height="250" fill="#101820" stroke="#8a8172"/>
    <path d="M40 150h160M120 30v250" stroke="#8a8172" opacity=".6"/>
    <rect x="250" y="70" width="14" height="180" fill="#5c4a32"/>
    <circle cx="257" cy="110" r="8" fill="#e2a14a"/>
    <circle cx="257" cy="150" r="8" fill="#cbbfa6"/>
    <circle cx="257" cy="190" r="8" fill="#8a8172"/>
    <rect x="340" y="160" width="240" height="90" fill="#2a2118" stroke="#6d5432"/>
    <rect x="360" y="176" width="90" height="12" fill="#e7dcc4"/>
  </svg>`,
  archive: `<svg viewBox="0 0 640 360" role="img" aria-label="Archive shelves, a binder, and an inbox tray.">
    <rect width="640" height="360" fill="#16130f"/>
    <rect x="40" y="40" width="250" height="260" fill="#241c14" stroke="#6d5432"/>
    <path d="M40 110h250M40 180h250M40 250h250" stroke="#6d5432"/>
    <rect x="60" y="58" width="28" height="40" fill="#9dbe7c"/>
    <rect x="96" y="64" width="28" height="34" fill="#e2a14a"/>
    <rect x="132" y="60" width="28" height="38" fill="#8a8172"/>
    <rect x="340" y="80" width="110" height="150" fill="#e7dcc4" stroke="#6d5432"/>
    <rect x="470" y="150" width="130" height="28" fill="#3a3126" stroke="#e2a14a"/>
    <rect x="488" y="156" width="90" height="14" fill="#f4efe2"/>
  </svg>`,
  dock: `<svg viewBox="0 0 640 360" role="img" aria-label="Loading dock with a roll-up door and a transmitter rack.">
    <rect width="640" height="360" fill="#101418"/>
    <rect x="40" y="36" width="280" height="250" fill="#1b242c" stroke="#8a8172"/>
    <path d="M40 80h280M40 120h280M40 160h280M40 200h280M40 240h280" stroke="#8a8172" opacity=".45"/>
    <rect x="300" y="150" width="36" height="18" fill="#e2a14a"/>
    <rect x="390" y="70" width="200" height="220" fill="#241c14" stroke="#6d5432"/>
    <circle cx="450" cy="120" r="8" fill="#9dbe7c"/>
    <circle cx="490" cy="120" r="8" fill="#5a2a24"/>
    <rect x="420" y="160" width="140" height="10" fill="#3a3126"/>
    <rect x="520" y="200" width="16" height="40" fill="#e2a14a"/>
  </svg>`,
};

export function sceneMarkup(id) {
  return scenes[id] || scenes.booth;
}
