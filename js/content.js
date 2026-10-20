// Narrative data for The Last Broadcast.
// The view does not import this module. Locked lines stay out of the projection
// until their action has happened. The file is still visible in the bundle.

const has = (id) => ({ op: "hasEvidence", id });
const ded = (id) => ({ op: "hasDeduction", id });
const topic = (id) => ({ op: "hasTopic", id });
const all = (...of) => ({ op: "all", of });
const any = (...of) => ({ op: "any", of });
const not = (cond) => ({ op: "not", cond });

export const content = {
  intro: {
    eyebrow: "WKXR 88.7, Marrow Creek",
    title: "The Last Broadcast",
    deck: "June Pell, the night engineer, did not come out after the station's final night on air. Her car is still in the lot.",
    paragraphs: [
      "You are Rowan Hale, the weekend archivist. Your name is the second one on June's emergency card, under the booth lamp.",
      "Ellis Voss called you. He is the station manager. He wants the building understood before a Harbor Light inspector walks through at dawn for the license transfer.",
      "You are not the police. June is unaccounted for, and the file that inspector is handed will become the station's last night on record. The staff's severance sits inside that sale.",
      "Ellis stayed to lock up. Nadia Crowe came back for her coat. Cal Renner is on his transmitter check. Your archive key opens the shelves. Nothing in the building is on a clock you have to beat.",
    ],
    contentNote:
      "Content note: a person is missing at the start. The story has workplace dishonesty and a deliberate absence. It does not depict violence, injury, or death.",
    objective:
      "Find out where June went, and whether the night on paper is the night that happened.",
  },
  locations: [
    {
      id: "booth",
      name: "On-air booth",
      blurb:
        "The on-air lamp is dark. A long music bed has finished, and the board is sitting with its faders down.",
    },
    {
      id: "lobby",
      name: "Lobby",
      blurb:
        "The front door is locked. Ellis Voss is at the desk with the sale folder shut under his hand.",
    },
    {
      id: "archive",
      name: "Archive",
      blurb:
        "Shelves of tape, the public-file cabinet, and the pledge drawer. The lamp in here is the only warm light.",
    },
    {
      id: "dock",
      name: "Loading dock",
      blurb:
        "The transmitter rack is on standby. The roll-up door is down. Cal Renner is logging a check.",
    },
  ],
  objects: [
    { id: "obj-log", locationId: "booth", label: "Booth log", evidenceId: "ev-booth-log" },
    { id: "obj-board", locationId: "booth", label: "Console and chair", evidenceId: "ev-board" },
    { id: "obj-reel", locationId: "booth", label: "Reel stack", evidenceId: "ev-reel" },
    { id: "obj-pad", locationId: "booth", label: "Scratch pad", evidenceId: "ev-pad" },
    { id: "obj-lock", locationId: "lobby", label: "Door strip and guest book", evidenceId: "ev-lock" },
    { id: "obj-hook", locationId: "lobby", label: "Coat pegs", evidenceId: "ev-hook" },
    { id: "obj-binder", locationId: "archive", label: "Public-file binder", evidenceId: "ev-binder" },
    { id: "obj-tray", locationId: "archive", label: "Inbox tray", evidenceId: "ev-printout" },
    { id: "obj-note", locationId: "archive", label: "Note under the cover", evidenceId: "ev-note" },
    { id: "obj-pledge", locationId: "archive", label: "Pledge envelope", evidenceId: "ev-memo" },
    { id: "obj-latch", locationId: "dock", label: "Dock latch", evidenceId: "ev-dock" },
    { id: "obj-peg", locationId: "dock", label: "Transmitter key peg", evidenceId: "ev-txkey" },
  ],
  suspects: [
    {
      id: "nadia",
      locationId: "booth",
      name: "Nadia Crowe",
      role: "Evening host",
      presence: "She stands by the rack with her coat over her arm, as if she just came back in.",
    },
    {
      id: "ellis",
      locationId: "lobby",
      name: "Ellis Voss",
      role: "Station manager",
      presence: "He has not taken his coat off. He keeps looking at the front door.",
    },
    {
      id: "cal",
      locationId: "dock",
      name: "Cal Renner",
      role: "Transmitter tech",
      presence: "He has a rag in his pocket and grease on one thumb. He is not hurrying.",
    },
  ],
  evidence: [
    {
      id: "ev-booth-log",
      kind: "evidence",
      title: "Unfinished booth log",
      source: "On-air booth, console log",
      description: "The log is open on the console. Two hands used this page.",
      facts: [
        "June's hooked hand runs through 11:12 PM, then stops.",
        "The 11:12 line reads: music bed, dub copy, back for sign-off.",
        "The midnight line is in the block print used on Ellis Voss's station memos. It is not the hooked hand above it.",
        "The midnight line reads: clean sign-off, J. Pell.",
      ],
      related: ["ev-printout", "ev-note"],
    },
    {
      id: "ev-board",
      kind: "evidence",
      title: "Console left mid-break",
      source: "On-air booth, board",
      description: "The chair is back from the desk and the board is powered, with the show finished.",
      facts: [
        "The mic fader is down. The headphone cup is on the bridge, not on the floor.",
        "The chair is pushed back. The casters are even, and the riser has no fresh scuff.",
        "The speed-dial card shows an outgoing station-line call at 11:16 PM, two minutes, on the button labeled Harbor Light inspector.",
        "Nothing on the desk is broken or overturned.",
      ],
      related: ["ev-booth-log", "ev-reel"],
    },
    {
      id: "ev-reel",
      kind: "evidence",
      title: "Finished dub reel",
      source: "On-air booth, reel stack",
      description: "The top box is labeled in the same hooked hand as the early log lines.",
      facts: [
        "The label reads: public file copy, do not air.",
        "The take-up reel is full. The source reel is a blank dub pancake.",
        "A paper band on the box reads: copy finished 11:21.",
      ],
      related: ["ev-binder", "ev-pad"],
    },
    {
      id: "ev-pad",
      kind: "evidence",
      title: "Torn scratch pad",
      source: "On-air booth, board ledge",
      description: "The top sheet is gone. The sheet under it still holds a pencil impression.",
      facts: [
        "The impression reads: Call 3, say thanks for keeping the lights on, N.C.",
        "The letters are not June's hooked hand.",
      ],
      related: ["ev-reel"],
    },
    {
      id: "ev-lock",
      kind: "evidence",
      title: "Front door strip",
      source: "Lobby, front door",
      description: "The lock printer and the guest book sit on the same shelf by the glass.",
      facts: [
        "The strip shows Ellis Voss's card at 10:40 PM, entry.",
        "There is no exit cycle after that, and no other card tonight.",
        "The guest book’s last line is yesterday, a meter reader. Harbor Light is not signed in.",
      ],
      related: ["ev-hook"],
    },
    {
      id: "ev-hook",
      kind: "evidence",
      title: "Coat pegs",
      source: "Lobby, peg rail",
      description: "Four pegs, three coats, and a set of keys.",
      facts: [
        "June's car keys are on her peg. The tag reads PELL / LOT.",
        "Her peg has no coat. A wool scarf is still hanging there.",
        "Ellis's coat is on his peg. Nadia's coat is on the chair, damp at the shoulders.",
      ],
      related: ["ev-lock", "ev-note"],
    },
    {
      id: "ev-binder",
      kind: "evidence",
      title: "Public-file binder",
      source: "Archive, shelf",
      description: "The original binder is on the shelf, punched and worn at the spine.",
      facts: [
        "The ad log types three spots as community calendar.",
        "A pencil margin, in the hooked hand, reads: these match the fair invoices, not a calendar. Hold this binder for the inspector. Do not file a reprint.",
        "Invoice copies clipped behind the page bill those spots to the station. The station contact on the clip is E. Voss. The invoices are marked unpaid.",
      ],
      related: ["ev-printout", "ev-note"],
    },
    {
      id: "ev-printout",
      kind: "evidence",
      title: "Tray printout",
      source: "Archive, inbox tray",
      description: "A single crisp printout sits in the tray. It is not punched for the binder.",
      facts: [
        "The footer reads WKXR OFFICE 12:06 AM.",
        "The same three spots are relabeled: paid public service, no invoice.",
        "The pencil margin from the binder is not on this page.",
        "The invoices are not clipped to it.",
      ],
      related: ["ev-binder", "ev-booth-log"],
    },
    {
      id: "ev-note",
      kind: "evidence",
      title: "June's note",
      source: "Archive, under the binder cover",
      description: "Pencil on a torn log sheet, tucked under the binder cover. The hooked J matches the log lines above 11:12.",
      facts: [
        "The time at the top is 11:22 PM.",
        "It is addressed to Rowan.",
        "It says she has already left and is not in the building.",
        "It says she is walking the copy out the dock because the lobby is Ellis and the front book would be the wrong file.",
        "It names Priya Shah as the inspector and says she is early.",
        "It says the binder on the shelf is the real one and the tray copy is not.",
        "It is signed J.",
      ],
      related: ["ev-dock", "ev-binder", "ev-printout"],
    },
    {
      id: "ev-memo",
      kind: "evidence",
      title: "Pledge envelope",
      source: "Archive, pledge drawer",
      description: "A clasp envelope with an unbroken seal.",
      facts: [
        "The seal is intact and dated Tuesday, in Cal Renner's print.",
        "The memo inside says the $40 short was two misfiled receipts, that the receipts are in the envelope, and that the count matches.",
        "Nothing in the envelope is dated tonight.",
      ],
      related: [],
    },
    {
      id: "ev-dock",
      kind: "evidence",
      title: "Dock latch",
      source: "Loading dock, interior latch",
      description: "The roll-up door is closed. The latch has been taped and pressed down again.",
      facts: [
        "Gaffer tape on the interior latch is marked CAL, LEAVE FOR J.",
        "The tape has been pressed back down. The door is closed now.",
        "A card in the rail reads: Harbor Light Media, courtesy shuttle, Priya Shah.",
        "Cal's check clipboard, 1:05 AM, says the dock was secured after a guest.",
      ],
      related: ["ev-note"],
    },
    {
      id: "ev-txkey",
      kind: "evidence",
      title: "Transmitter key",
      source: "Loading dock, rack peg",
      description: "The peg by the transmitter rack is labeled and occupied.",
      facts: [
        "The peg label reads: TX key, do not remove from rack.",
        "The transmitter key is hanging on it.",
      ],
      related: [],
    },
    {
      id: "stmt-ellis-where",
      kind: "statement",
      title: "Ellis on the lobby",
      source: "Ellis Voss, lobby",
      description: "What he says about where he has been.",
      facts: [
        "He says he badged in at 10:40 and has been in the lobby since.",
        "He says June never came through the front door, and that the night was supposed to be a clean handoff.",
        "He says the transmitter key is missing and tells you to try the tower path.",
        "He tells you to ask Cal about the pledge box before you invent a scandal.",
      ],
      related: ["ev-lock", "ev-txkey", "ev-memo"],
    },
    {
      id: "stmt-ellis-signoff",
      kind: "statement",
      title: "Ellis on the midnight line",
      source: "Ellis Voss, lobby",
      description: "What he says about the last line of the log.",
      facts: [
        "He says the midnight line was blank and that he filled it in.",
        "He says June told him earlier to sign off clean if she got tied up in the archive.",
      ],
      related: ["ev-booth-log"],
    },
    {
      id: "stmt-ellis-file",
      kind: "statement",
      title: "Ellis on the printout",
      source: "Ellis Voss, lobby",
      description: "What he says about the page in the tray.",
      facts: [
        "He says he printed the tray copy so nobody has to squint at pencil.",
        "He says nothing in it changes the facts.",
      ],
      related: ["ev-printout", "ev-binder"],
    },
    {
      id: "stmt-ellis-keys",
      kind: "statement",
      title: "Ellis on the keys",
      source: "Ellis Voss, lobby",
      description: "What he says about the peg.",
      facts: [
        "He says keys on the peg mean June is still in the building.",
        "He tells you to try the roof stairs.",
        "He does not account for the missing coat.",
      ],
      related: ["ev-hook"],
    },
    {
      id: "stmt-nadia-last",
      kind: "statement",
      title: "Nadia on the last hour",
      source: "Nadia Crowe, booth",
      description: "What she says about the end of her show.",
      facts: [
        "She says June killed the mic, started the long music bed, and went to dub something for the shelf.",
        "She says she went out to her car and did not see June leave the building.",
        "She says Ellis was calling June's name when she came back.",
      ],
      related: ["ev-board", "ev-reel"],
    },
    {
      id: "stmt-nadia-pad",
      kind: "statement",
      title: "Nadia on the pad",
      source: "Nadia Crowe, booth",
      description: "What she says about the torn sheet.",
      facts: [
        "She says the phones were dead and she wrote a thank-you line so the show would not end on silence.",
        "She says she tore the sheet because she thought June was dubbing her show.",
        "She says June was holding the archive key and walking toward the archive, and that they did not fight.",
      ],
      related: ["ev-pad", "ev-reel"],
    },
    {
      id: "stmt-nadia-reel",
      kind: "statement",
      title: "Nadia on the reel",
      source: "Nadia Crowe, booth",
      description: "What she says about the dub.",
      facts: [
        "She says the reel label is June's and that the dub was the public file.",
        "She says it was not her show and not a caller.",
      ],
      related: ["ev-reel"],
    },
    {
      id: "stmt-cal-ask",
      kind: "statement",
      title: "Cal on June's request",
      source: "Cal Renner, dock",
      description: "What he says she asked him.",
      facts: [
        "He says June asked him, just after eleven, to tape the dock latch until she came through.",
        "He says he taped it.",
        "He says he assumed she was avoiding a goodbye speech from Ellis.",
      ],
      related: ["ev-dock"],
    },
    {
      id: "stmt-cal-memo",
      kind: "statement",
      title: "Cal on the envelope",
      source: "Cal Renner, dock",
      description: "What he says about the pledge drawer.",
      facts: [
        "He says the Tuesday memo is still accurate.",
        "He says the seal is intact and he has not opened the envelope since he signed it.",
      ],
      related: ["ev-memo"],
    },
    {
      id: "stmt-cal-saw",
      kind: "statement",
      title: "Cal on the ramp",
      source: "Cal Renner, dock",
      description: "What he says he saw at the door.",
      facts: [
        "He says a woman in a Harbor Light coat was at the bottom of the ramp before midnight.",
        "He says June came out with a reel box, walking and talking, and that nobody was holding her.",
        "He says he heard the name Priya, and that June said not to send Ellis out.",
        "He says he pressed the tape back down after the shuttle lights left.",
      ],
      related: ["ev-dock", "ev-note", "ev-reel"],
    },
  ],
  topics: [
    {
      id: "ellis-where",
      suspectId: "ellis",
      label: "Where were you after 10:40?",
      requires: null,
      evidenceId: "stmt-ellis-where",
      speech: [
        "I badged in at 10:40 and I have been in this lobby since. She was supposed to walk the public file out with me so the handoff stayed clean. She never came through that door.",
        "If you are staring at her keys, ask Cal about the pledge box before you invent a scandal. And I could not find the transmitter key. Try the tower path.",
      ],
    },
    {
      id: "ellis-signoff",
      suspectId: "ellis",
      label: "Who wrote the last line of the log?",
      requires: has("ev-booth-log"),
      evidenceId: "stmt-ellis-signoff",
      speech: [
        "The midnight line was blank. I filled it so the inspector would not see an empty box. June told me earlier to sign off clean if she got tied up in the archive.",
      ],
    },
    {
      id: "ellis-file",
      suspectId: "ellis",
      label: "What is the page in the archive tray?",
      requires: has("ev-printout"),
      evidenceId: "stmt-ellis-file",
      speech: [
        "That tray copy is the same file, just legible. I printed it so nobody has to squint at pencil. Nothing in it changes the facts.",
      ],
    },
    {
      id: "ellis-keys",
      suspectId: "ellis",
      label: "Her keys are still on the peg.",
      requires: has("ev-hook"),
      evidenceId: "stmt-ellis-keys",
      speech: [
        "Keys on the peg means she is still in this building. Try the roof stairs. I am not unsealing the sale over a coat.",
      ],
    },
    {
      id: "nadia-last",
      suspectId: "nadia",
      label: "When did you last see June?",
      requires: null,
      evidenceId: "stmt-nadia-last",
      speech: [
        "End of my hour she killed the mic, put up the long music bed, and said she had to dub something for the shelf. She told me to let the bed ride.",
        "I went out to my car for a cigarette and the rain. When I came back, Ellis was calling her name. I did not see her leave the building.",
      ],
    },
    {
      id: "nadia-pad",
      suspectId: "nadia",
      label: "What was on the scratch pad?",
      requires: has("ev-pad"),
      evidenceId: "stmt-nadia-pad",
      speech: [
        "The phones were dead. I wrote a thank-you line so the last show would not end on silence. I tore it off when I heard her say dub. I thought she meant my show.",
        "She was holding the archive key, not my reel. We did not fight. I snapped at her to leave the board alone. She was already walking toward the archive.",
      ],
    },
    {
      id: "nadia-reel",
      suspectId: "nadia",
      label: "What was she dubbing?",
      requires: has("ev-reel"),
      evidenceId: "stmt-nadia-reel",
      speech: [
        "That label is her print. Public file. She was copying paper. It was not my hour and it was not a caller.",
      ],
    },
    {
      id: "cal-ask",
      suspectId: "cal",
      label: "What did June ask you tonight?",
      requires: null,
      evidenceId: "stmt-cal-ask",
      speech: [
        "She caught me at the rack just after eleven. Asked me to tape the latch and leave it until she came through. I did. I figured she was ducking Ellis's goodbye speech. Not my business why.",
      ],
    },
    {
      id: "cal-memo",
      suspectId: "cal",
      label: "What about the pledge envelope?",
      requires: has("ev-memo"),
      evidenceId: "stmt-cal-memo",
      speech: [
        "Tuesday's memo is still the truth. The seal is intact. I have not opened that envelope since I signed it. I am not your thief.",
      ],
    },
    {
      id: "cal-saw",
      suspectId: "cal",
      label: "Who used the dock tonight?",
      requires: has("ev-dock"),
      evidenceId: "stmt-cal-saw",
      speech: [
        "A woman in a Harbor Light coat was at the bottom of the ramp before midnight. June came out with a reel box under her arm, walking and talking. Nobody was holding her.",
        "I heard the name Priya. June said she would ride with her and not to send Ellis out. I pressed the tape back down after the shuttle lights left.",
      ],
    },
  ],
  deductions: [
    {
      id: "ded-not-front",
      prompt: "Did June leave through the front door?",
      unlock: any(has("ev-lock"), has("ev-hook"), has("ev-note")),
      choices: [
        { id: "front-yes", label: "Yes. She left through the front door." },
        { id: "front-no", label: "No. She did not leave through the front door." },
      ],
      correctChoice: "front-no",
      supports: [
        ["ev-lock", "ev-hook"],
        ["ev-lock", "ev-note"],
        ["ev-hook", "ev-note"],
        ["ev-lock", "stmt-ellis-where"],
      ],
      explanation:
        "After Ellis badged in, the front strip never recorded an exit. Her keys are still on the peg. The way out is not that door, and it is not her car.",
    },
    {
      id: "ded-dock-exit",
      prompt: "Which way out of the station can you account for?",
      unlock: any(has("ev-note"), has("ev-dock"), has("stmt-cal-saw")),
      choices: [
        { id: "stayed", label: "She is still somewhere inside." },
        { id: "front", label: "She left through the front door." },
        { id: "dock", label: "She left on foot by the loading dock." },
      ],
      correctChoice: "dock",
      supports: [
        ["ev-note", "ev-dock"],
        ["ev-note", "stmt-cal-saw"],
        ["ev-dock", "stmt-cal-saw"],
        ["ev-dock", "ev-hook", "ev-lock"],
      ],
      explanation:
        "The latch was taped for her and secured again after a guest. Her note names the dock. Cal, once asked, saw her walk out with a reel box, talking. The front door and her car keys do not account for the coat leaving.",
    },
    {
      id: "ded-file-swap",
      prompt: "Do the binder and the tray printout record the same facts?",
      unlock: all(has("ev-binder"), has("ev-printout")),
      choices: [
        { id: "same", label: "Yes. The printout is only a cleaner copy." },
        {
          id: "swap",
          label: "No. The printout changes the ad log and was printed to stand in for the binder.",
        },
      ],
      correctChoice: "swap",
      supports: [
        ["ev-binder", "ev-printout"],
        ["ev-binder", "ev-printout", "stmt-ellis-file"],
        ["ev-binder", "ev-printout", "ev-booth-log"],
      ],
      explanation:
        "The binder calls three spots a community calendar and clips unpaid invoices to them. The tray page, printed at 12:06 AM, relabels those spots as paid and drops the invoices. Ellis's claim that nothing changes is not what the two pages show.",
    },
    {
      id: "ded-other-tracks",
      prompt: "Do the side problems explain the empty booth?",
      unlock: any(has("ev-pad"), has("ev-memo"), has("stmt-nadia-pad"), has("stmt-cal-memo")),
      choices: [
        { id: "yes", label: "Yes. One of those problems is why she is gone." },
        { id: "no", label: "No. They are real, and they are not the exit." },
      ],
      correctChoice: "no",
      supports: [
        ["ev-pad", "ev-reel"],
        ["ev-memo", "ev-note"],
        ["ev-pad", "ev-note"],
        ["ev-memo", "ev-reel"],
        ["stmt-nadia-pad", "ev-reel"],
        ["stmt-cal-memo", "ev-note"],
        ["ev-pad", "ev-memo", "ev-note"],
      ],
      explanation:
        "Nadia wrote a caller line because the phones were dead, and the reel she worried about is labeled as a public-file copy. Cal's short is a Tuesday misfile with the seal still shut. June's work this night was the file.",
    },
  ],
  hints: [
    {
      id: "hint-start",
      priority: 1,
      complete: { op: "evidenceAtLeast", n: 1 },
      actionable: { op: "phasePlay" },
      lines: [
        "Start where her shift ended. The booth still holds the night's paper.",
        "The console in the booth has a log and a board you can read.",
        "Open the booth log and look at the last two lines.",
      ],
    },
    {
      id: "hint-files",
      priority: 10,
      complete: all(has("ev-binder"), has("ev-printout")),
      actionable: { op: "phasePlay" },
      lines: [
        "The station's argument is on paper, in the archive.",
        "Read the binder on the shelf and the page in the tray. They are different objects.",
        "Compare the ad log in the binder with the printout in the inbox tray.",
      ],
    },
    {
      id: "hint-note",
      priority: 12,
      complete: has("ev-note"),
      actionable: all(
        any(has("ev-binder"), has("ev-printout")),
        not(all(ded("ded-dock-exit"), ded("ded-file-swap"))),
      ),
      lines: [
        "The binder is not only a log. Something in the archive is addressed to you.",
        "Look under the binder cover.",
        "Read the note under the binder cover.",
      ],
    },
    {
      id: "hint-dock",
      priority: 14,
      complete: has("ev-dock"),
      actionable: any(has("ev-note"), topic("cal-ask"), all(has("ev-binder"), has("ev-printout"))),
      lines: [
        "A door that is not the front door is still part of the building.",
        "The loading dock is down the hall from the archive.",
        "Inspect the dock latch and what was left in the rail.",
      ],
    },
    {
      id: "hint-exit",
      priority: 16,
      complete: ded("ded-dock-exit"),
      actionable: { op: "supportReady", id: "ded-dock-exit" },
      lines: [
        "You can settle the way out on the deduction desk.",
        "Open Deductions and answer which way out you can account for.",
        "The dock exit holds if you attach the note and the latch, or Cal's account of the ramp with either one.",
      ],
    },
    {
      id: "hint-file",
      priority: 17,
      complete: ded("ded-file-swap"),
      actionable: all(has("ev-binder"), has("ev-printout")),
      lines: [
        "Two versions of the public file are in the notebook. Put them on the deduction desk.",
        "Open Deductions and answer whether the binder and the tray page agree.",
        "They do not agree. Attach the binder and the tray printout to that conclusion.",
      ],
    },
    {
      id: "hint-cal",
      priority: 18,
      complete: any(has("stmt-cal-saw"), ded("ded-dock-exit")),
      actionable: all(has("ev-dock"), not(has("stmt-cal-saw")), not(ded("ded-dock-exit"))),
      lines: [
        "Cal is at the dock, and the latch is a question he can answer.",
        "Ask Cal who used the dock tonight.",
        "Cal's topic about who used the dock is open once you have seen the latch.",
      ],
    },
    {
      id: "hint-accuse",
      priority: 40,
      complete: { op: "never" },
      actionable: all(ded("ded-dock-exit"), ded("ded-file-swap")),
      lines: [
        "You can file an explanation. The form is not the proof. Attach three entries that carry it.",
        "Use File an explanation. Choose only what the notebook can hold.",
        "Put the dock exit together with the two public files in the three entries you attach.",
      ],
    },
  ],
  accusation: {
    success: { status: "left", route: "dock", purpose: "deliver", conduct: "ellis" },
    steps: [
      {
        id: "status",
        prompt: "What happened to June Pell?",
        options: [
          { id: "inside", label: "She is still in the station." },
          { id: "left", label: "She left the station on her own." },
          { id: "taken", label: "She was taken against her will." },
        ],
      },
      {
        id: "route",
        prompt: "Which route fits the night?",
        options: [
          { id: "unknown", label: "No route is established." },
          { id: "front", label: "The front door." },
          { id: "car", label: "Her own car." },
          { id: "dock", label: "The loading dock, on foot." },
        ],
      },
      {
        id: "purpose",
        prompt: "What was the point of leaving the booth?",
        options: [
          { id: "unclear", label: "No purpose you can support." },
          { id: "caller", label: "To keep a scripted caller off a recording." },
          { id: "theft", label: "To cover a theft from the pledge box." },
          { id: "deliver", label: "To get the real public file to the inspector." },
        ],
      },
      {
        id: "conduct",
        prompt: "Whose conduct made that necessary?",
        options: [
          { id: "none", label: "No one else's. It was private." },
          { id: "nadia", label: "Nadia Crowe, over the caller line." },
          { id: "cal", label: "Cal Renner, over the pledge box." },
          { id: "ellis", label: "Ellis Voss, over a substitute public file." },
        ],
      },
    ],
    feedback: {
      insufficient:
        "The outline matches what this night can support, but those three entries do not establish both a way out and the contradiction in the public file.",
      plausibleRoute:
        "You can put her outside. The reason you named is not what the papers are arguing about.",
      plausibleReason:
        "The file problem you named is real enough to test. The route you named is not the one the doors can carry.",
      inside:
        "Every room the staff can open has been available to you. What is missing is an exit, not another closet.",
      incorrect:
        "That account fights the rooms. Weigh what the doors recorded against what was written down, and which papers disagree.",
    },
  },
  ending: {
    id: "handoff",
    title: "She made the handoff",
    paragraphs: [
      "June Pell left WKXR on foot, alive, during the long music bed. The booth was an orderly pause: faders down, the headphone cup on the bridge, her log stopped at 11:12 in her own hand. The midnight line was written later, in Ellis Voss's block print, and it signs a sign-off she did not make.",
      "At 11:16 the station line called the Harbor Light inspector. The dub reel was full at 11:21, labeled as a public-file copy. At 11:22 she wrote you the note. She said she was walking that copy out the dock because Ellis held the lobby, and that the binder on the shelf was the real file.",
      "The latch was taped for her. Priya Shah's courtesy card was in the rail. Cal saw June leave with a reel box, walking and talking, and he secured the door after the shuttle lights left. Her keys stayed on the peg. The front door never cycled out. She did not take the car.",
      "The binder calls three spots a community calendar and clips unpaid invoices to them, with E. Voss as the station contact. The tray printout, stamped 12:06 AM, relabels those spots as paid and drops the invoices. That page was made after she was gone. Ellis described it as the same facts. The two pages are not the same facts.",
      "Nadia's torn pad is a thank-you line for a dead phone. She thought the dub was about her show. The reel says otherwise. Cal's pledge envelope is a Tuesday misfile with the seal intact. Neither one took June out of the building. Ellis's missing-key story fails the peg, which still holds the transmitter key.",
      "Dawn is a handoff, not a search. The copy she carried is with the inspector she named. The binder on the shelf is the file you can walk into that room.",
    ],
  },
};

export const SAVE_VERSION = 1;
