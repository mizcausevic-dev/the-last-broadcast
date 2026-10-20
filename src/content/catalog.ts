import type { GameContent } from "./types";

export const CANARY_TRANSCRIPT = "I am leaving the building on my own";
export const CANARY_FEE = "The fee is payable to Dennis Crowe";
export const CANARY_PIN = "card plus personal PIN";

export const catalog: GameContent = {
  id: "the-last-broadcast",
  title: "The Last Broadcast",
  contentNote:
    "The Last Broadcast is a mystery about a radio host who is missing at the end of an overnight show. It includes workplace pressure, a family disagreement, and characters who lie or are mistaken. There is no violence, injury, or death in the story. You can take as long as you need to read. Sound stays off until you turn on a local tone, and the written notes are the evidence.",
  shortNote:
    "No violence, injury, or death. Lies and workplace pressure are in the story. Reading is untimed. Sound is off until you start it.",
  canaries: [CANARY_TRANSCRIPT, CANARY_FEE, CANARY_PIN],
  locations: [
    {
      id: "lobby",
      name: "Lobby and lot",
      body: "The overnight lobby is lit by one desk lamp. The south dock reader prints to a tray by the door. Mara is not in this room. The list is every object you can use.",
    },
    {
      id: "studio",
      name: "Air studio",
      body: "The air studio still shows a live board from the overnight. The ON AIR lamp is steady. Mara is not in this room. The list is every object you can use.",
    },
    {
      id: "production",
      name: "Production and break room",
      body: "Production opens onto a break room with a couch and a microwave. Mara is not in this room. The list is every object you can use.",
    },
    {
      id: "office",
      name: "Manager's office",
      body: "Dennis Crowe's office connects to the roof stair. Mara is not in this room. The list is every object you can use.",
    },
  ],
  objects: [
    {
      id: "obj-signin",
      locationId: "lobby",
      label: "Sign-in clipboard",
      teaser: "Clipboard on the lobby counter.",
      grants: "clue-signin",
    },
    {
      id: "obj-lot",
      locationId: "lobby",
      label: "Parking checklist",
      teaser: "A morning checklist hung by the lot door.",
      grants: "clue-lot",
    },
    {
      id: "obj-dock",
      locationId: "lobby",
      label: "Dock reader slip",
      teaser: "The south dock reader has a printed slip in the tray.",
      grants: "clue-badge",
    },
    {
      id: "obj-binder",
      locationId: "lobby",
      label: "Security binder",
      teaser: "Reed's binder is on the security stool.",
      grants: "clue-camera",
    },
    {
      id: "obj-program",
      locationId: "studio",
      label: "Program log",
      teaser: "The program log is open on the copy stand.",
      grants: "clue-program",
    },
    {
      id: "obj-board",
      locationId: "studio",
      label: "Board and play slot",
      teaser: "The live board and the cartridge play slot.",
      grants: "clue-storm",
    },
    {
      id: "obj-phone",
      locationId: "studio",
      label: "Booth phone",
      teaser: "The booth phone keeps a paper call log.",
      grants: "clue-phone",
    },
    {
      id: "obj-computer",
      locationId: "studio",
      label: "Booth computer",
      teaser: "The booth computer is on, with one photo open.",
      grants: "clue-rider",
    },
    {
      id: "obj-rack",
      locationId: "studio",
      label: "Cartridge rack",
      teaser: "Labeled carts, including one marked HOLD.",
      grants: "clue-cart",
    },
    {
      id: "obj-couch",
      locationId: "production",
      label: "Break-room couch",
      teaser: "The couch faces the microwave.",
      grants: "clue-soup",
    },
    {
      id: "obj-prodlog",
      locationId: "production",
      label: "Production log",
      teaser: "The production log sits on the producer's desk.",
      grants: "clue-prod",
    },
    {
      id: "obj-roof",
      locationId: "office",
      label: "Roof landing log",
      teaser: "The roof stair has a door log and a landing tin.",
      grants: "clue-roof",
    },
    {
      id: "obj-folder",
      locationId: "office",
      label: "Contract folder",
      teaser: "A red folder is open on the desk.",
      grants: "clue-rider",
    },
  ],
  clues: [
    {
      id: "clue-signin",
      title: "Sign-in sheet",
      scopeNote:
        "Names and times in, and no sign-out. It does not place anyone at the dock at 2:19.",
      body: "Lobby sign-in. Jules Park 18:10 in, no out. Mara Ellison 21:40 in, no out. Dennis Crowe 22:36 in, no out. Reed Solano 23:10 in, no out. No other names.",
      conflicts: [],
    },
    {
      id: "clue-lot",
      title: "Parking checklist",
      scopeNote:
        "At 6:00 Mara's parking space was empty and three other vehicles were still there.",
      body: "Parking checklist, Dennis's handwriting, signed 06:00. Space 3, Mara Ellison: empty. Jules Park bicycle: present. Dennis Crowe sedan: present. Reed Solano truck: present.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-vol-inside",
          text: "This note says her parking space was empty at 6:00. It does not leave her inside the building.",
        },
        {
          kind: "accuse-action",
          id: "act-inside",
          text: "This note says her parking space was empty at 6:00. It does not leave her inside the building.",
        },
      ],
    },
    {
      id: "clue-badge",
      title: "Dock reader",
      scopeNote:
        "At 2:19 the south dock logged Mara Ellison's card and PIN going out, and no re-entry.",
      body: "South dock reader slip. 02:19:07 egress. Name: Ellison, Mara. Method: card plus personal PIN. No re-entry on this door. No other credential from 02:00 to 03:00.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-vol-inside",
          text: "This note records an egress at 2:19, not a person remaining inside.",
        },
        {
          kind: "accuse-action",
          id: "act-inside",
          text: "This note records an egress at 2:19, not a person remaining inside.",
        },
        {
          kind: "deduction-option",
          id: "opt-cam-empty",
          text: "This note records an egress at the dock. It does not say the dock was unused.",
        },
        {
          kind: "accuse-action",
          id: "act-abducted",
          text: "This note records her own card and PIN. It does not name a second person at the door.",
        },
      ],
    },
    {
      id: "clue-program",
      title: "Program log",
      scopeNote:
        "The live mic closed at 2:17 and the source became the play slot, with a handwritten bed / hold.",
      body: "Program log, last printed line 02:17: live mic closed, source moved to the play slot. Under it, handwritten: bed / hold. The hand matches the CART 17 label. No further live lines.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-board-tower",
          text: "This note moves the source to the play slot at 2:17. It does not say the transmitter failed.",
        },
      ],
    },
    {
      id: "clue-storm",
      title: "Storm bed",
      scopeNote:
        "From 2:17 the play slot ran the storm-bed room tone, the carrier stayed up, and the silence sensor did not alarm.",
      body: "The board play slot holds cartridge STORM BED. The slot log says it started at 02:17 and was still running at 06:10. The cartridge is room tone, very low, not digital silence. The silence-sensor printer shows no alarm all night. The carrier lamp is steady: the transmitter did not drop.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-board-tower",
          text: "This note says the carrier stayed up and a cartridge was playing. It does not say the transmitter failed.",
        },
        {
          kind: "deduction-option",
          id: "opt-board-cut",
          text: "This note says a cartridge was playing. It does not describe a cut feed or a struggle.",
        },
        {
          kind: "deduction-option",
          id: "opt-board-mic",
          text: "This note names a cartridge, not a person asleep on the microphone.",
        },
        {
          kind: "accuse-action",
          id: "act-tower",
          text: "This note says the carrier stayed up. It does not say anyone left to fix a tower.",
        },
        {
          kind: "deduction-option",
          id: "opt-vol-tower",
          text: "This note says the carrier stayed up. It does not say anyone left to fix a tower.",
        },
      ],
    },
    {
      id: "clue-phone",
      title: "Booth phone",
      scopeNote:
        "A four-minute outbound call at 1:05 to the contact Sis, do not air. No emergency call.",
      body: "Booth phone log. 01:05:11 outbound, four minutes, contact stored as Sis, do not air. No calls after that. No call to emergency services.",
      conflicts: [],
    },
    {
      id: "clue-rider",
      title: "Syndication rider",
      scopeNote:
        "The rider requires a personal segment, names Mara's sister, and pays Dennis Crowe.",
      body: "Syndication rider, one page. The buyer requires an exclusive personal segment. The segment named on the page is an interview with Mara Ellison's sister. The fee is payable to Dennis Crowe, not to the station account.",
      conflicts: [
        {
          kind: "accuse-motive",
          id: "mot-jules",
          text: "This note names a sister interview and a fee to Dennis Crowe. It does not establish a sponsor fight as the reason.",
        },
        {
          kind: "accuse-motive",
          id: "mot-reed",
          text: "This note names a sister interview and a fee to Dennis Crowe. It does not mention the dock camera.",
        },
        {
          kind: "accuse-motive",
          id: "mot-none",
          text: "This note puts a sister interview and a personal fee on the page. It is not an empty motive.",
        },
      ],
    },
    {
      id: "clue-cart",
      title: "Hold cart 17",
      scopeNote:
        "Unplayed cart recorded at 2:04. Mara states a chosen dock exit, that she is not hurt, a refusal to air her sister, and a fade to the storm bed.",
      body: "Booth recorder, CART 17, labeled HOLD. Play count zero. Recorded at 2:04. Transcript: This is Mara Ellison. It is 2:04. I am leaving the building on my own, out the south dock. I am not hurt. I will not put my sister on this station. I faded the board to the storm bed so the silence sensor would not page anyone. The rider photo is on this computer. If you are the engineer, the dock log will match.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-vol-taken",
          text: "This note is Mara saying the exit is her choice and that she is not hurt. It does not describe a forced removal.",
        },
        {
          kind: "deduction-option",
          id: "opt-vol-inside",
          text: "This note says she is leaving by the south dock. It does not leave her in the building.",
        },
        {
          kind: "deduction-option",
          id: "opt-vol-tower",
          text: "This note says she faded the board to a bed and is walking out the dock. It does not send her to a tower.",
        },
        {
          kind: "deduction-option",
          id: "opt-board-tower",
          text: "This note says she faded the board to the storm bed. It does not say the transmitter failed.",
        },
        {
          kind: "deduction-option",
          id: "opt-board-cut",
          text: "This note says she faded the board on purpose. It does not describe a struggle.",
        },
        {
          kind: "accuse-action",
          id: "act-abducted",
          text: "This note is Mara saying the exit is her choice and that she is not hurt. It does not describe a forced removal.",
        },
        {
          kind: "accuse-action",
          id: "act-inside",
          text: "This note says she is leaving by the south dock. It does not leave her in the building.",
        },
        {
          kind: "accuse-action",
          id: "act-tower",
          text: "This note says she faded the board to a bed and is walking out the dock. It does not send her to a tower.",
        },
        {
          kind: "accuse-person",
          id: "dennis",
          text: "This note names Mara Ellison as the person leaving. It does not make Dennis the one who left in her place.",
        },
        {
          kind: "accuse-person",
          id: "jules",
          text: "This note names Mara Ellison as the person leaving. It does not make Jules the one who left in her place.",
        },
        {
          kind: "accuse-person",
          id: "reed",
          text: "This note names Mara Ellison as the person leaving. It does not make Reed the one who left in her place.",
        },
        {
          kind: "accuse-motive",
          id: "mot-jules",
          text: "This note gives her reason as refusing to air her sister. It does not say a producer removed her.",
        },
        {
          kind: "accuse-motive",
          id: "mot-reed",
          text: "This note gives her reason as refusing to air her sister. It does not mention hiding a camera.",
        },
        {
          kind: "accuse-motive",
          id: "mot-none",
          text: "This note states a reason: she will not put her sister on the station.",
        },
      ],
    },
    {
      id: "clue-soup",
      title: "Break-room couch",
      scopeNote:
        "Cold soup, a microwave still at 1:44, and Jules Park's headphones on the break-room couch.",
      body: "Break room couch. A bowl of cold soup. The microwave still shows END at 1:44 because nobody pressed clear. Production headphones with Jules Park's name tape are on the cushion.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-jules-booth",
          text: "This note places Jules's headphones and a bowl in the break room, not in the air studio.",
        },
        {
          kind: "deduction-option",
          id: "opt-jules-dock",
          text: "This note places Jules's headphones and a bowl in the break room, not at the dock.",
        },
        {
          kind: "deduction-option",
          id: "opt-jules-home",
          text: "This note places Jules's headphones and a bowl in the break room at 1:44. It does not put Jules at home at 1:00.",
        },
      ],
    },
    {
      id: "clue-prod",
      title: "Production log",
      scopeNote:
        "Jules's last production line is 1:36, carts to hold, and no live-board actions after that.",
      body: "Production log, last line 01:36, Jules Park: segment carts dumped to hold, not dead. No board key after that line. The live assist column is blank through 2:30.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-jules-booth",
          text: "This note leaves the live assist column blank after 1:36. It does not put Jules on the live board.",
        },
        {
          kind: "deduction-option",
          id: "opt-jules-home",
          text: "This note has Jules writing in the building at 1:36. It does not send Jules home at 1:00.",
        },
      ],
    },
    {
      id: "clue-camera",
      title: "Security binder",
      scopeNote:
        "Reed's login disabled the dock camera at 1:50. His round sheet puts him on the north lot from 2:10 to 2:25. The reader is a different machine.",
      body: "Security binder. Dock camera: manual disable at 01:50 by login R.Solano. The picture is black after that. Round sheet in the same binder, Reed's hand: north lot 02:10 to 02:25. The sheet's map marks the dock on the south side. The dock reader is a separate machine from the camera.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-cam-wiped",
          text: "This note records a manual disable by login R.Solano. It does not say a recording was erased.",
        },
        {
          kind: "deduction-option",
          id: "opt-cam-empty",
          text: "This note says the picture was turned off. It does not say the dock was unused.",
        },
        {
          kind: "deduction-option",
          id: "opt-cam-mara",
          text: "This note names login R.Solano, not Mara Ellison.",
        },
      ],
    },
    {
      id: "clue-roof",
      title: "Roof door",
      scopeNote:
        "Dennis's code held the roof door from 2:02 to 2:28. The landing does not see the south dock.",
      body: "Roof door log: held open 02:02:11 through 02:28:40 by code D.Crowe. On the landing, a cigarette tin and a pharmacy receipt timed 22:50. From the landing you cannot see the south dock.",
      conflicts: [
        {
          kind: "deduction-option",
          id: "opt-roof-office",
          text: "This note holds Dennis's code on the roof door from 2:02 to 2:28. It does not leave him in the office.",
        },
        {
          kind: "deduction-option",
          id: "opt-roof-dock",
          text: "This note puts Dennis on the roof landing, which cannot see the south dock.",
        },
        {
          kind: "deduction-option",
          id: "opt-roof-studio",
          text: "This note puts Dennis on the roof landing, not in the air studio.",
        },
      ],
    },
  ],
  suspects: [
    {
      id: "reed",
      name: "Reed Solano",
      role: "Night security",
      locationId: "lobby",
      presence: "Reed is on the security stool with a coffee.",
    },
    {
      id: "jules",
      name: "Jules Park",
      role: "Producer",
      locationId: "production",
      presence: "Jules is awake now, still in yesterday's clothes.",
    },
    {
      id: "dennis",
      name: "Dennis Crowe",
      role: "Station manager",
      locationId: "office",
      presence: "Dennis is at the desk, waiting on the board call.",
    },
  ],
  topics: [
    {
      id: "dennis-where",
      suspectId: "dennis",
      prompt: "Where were you between 2:00 and 2:30?",
      requiresAll: [],
      requiresAny: [],
      stance: "lie",
      text: "I was in this office the whole stretch, 2:00 to 2:30, on paperwork. I did not go outside.",
    },
    {
      id: "dennis-where-confront",
      suspectId: "dennis",
      prompt: "The roof door log has your code. Where were you?",
      requiresAll: ["clue-roof"],
      requiresAny: [],
      stance: "true",
      text: "All right. I was on the roof from about 2:00 until half past. Smoke break. I used my door code. I could not see the south dock from the landing. I did not see Mara leave.",
    },
    {
      id: "dennis-deal",
      suspectId: "dennis",
      prompt: "Is there anything unusual in the syndication papers?",
      requiresAll: [],
      requiresAny: [],
      stance: "lie",
      text: "There is a normal syndication conversation. Nothing in it is about Mara's family, and no fee is paid to me personally.",
    },
    {
      id: "dennis-deal-confront",
      suspectId: "dennis",
      prompt: "This rider names her sister and pays you. Explain it.",
      requiresAll: ["clue-rider"],
      requiresAny: [],
      stance: "true",
      text: "The rider does name her sister, and the fee is written to me. I told Mara the segment had to air at 2:10 or the rider was void. I should have told you that at 6:00.",
    },
    {
      id: "dennis-lot",
      suspectId: "dennis",
      prompt: "You signed the 6:00 parking checklist. What did you see?",
      requiresAll: ["clue-lot"],
      requiresAny: [],
      stance: "true",
      text: "I filled that checklist at 6:00. Her space was empty. My car, Jules's bicycle, and Reed's truck were here.",
    },
    {
      id: "jules-home",
      suspectId: "jules",
      prompt: "Did you leave at 1:00?",
      requiresAll: [],
      requiresAny: [],
      stance: "lie",
      text: "I went home at 1:00. I was not in the building for the dead air.",
    },
    {
      id: "jules-confront",
      suspectId: "jules",
      prompt: "The break room says you stayed. What happened?",
      requiresAll: [],
      requiresAny: ["clue-soup", "clue-prod"],
      stance: "true",
      text: "I did not go home. I heated soup at 1:44 and fell asleep on the break-room couch. I woke around 5:30. I dumped the sister-segment carts to hold at 1:36. I did not go to the dock, and I did not run the live board after 1:36.",
    },
    {
      id: "jules-segment",
      suspectId: "jules",
      prompt: "What was the fight about the sister segment?",
      requiresAll: [],
      requiresAny: [],
      stance: "true",
      text: "I booked an interview with Mara's sister for a Harbor and Pine sponsorship. Mara refused it around 10 p.m. I was angry. Refusal is not the same thing as me putting hands on anyone. I never did.",
    },
    {
      id: "reed-round",
      suspectId: "reed",
      prompt: "Did anyone leave during your shift?",
      requiresAll: [],
      requiresAny: [],
      stance: "mistaken",
      text: "Nobody left while I was on duty. I had the lot.",
    },
    {
      id: "reed-confront",
      suspectId: "reed",
      prompt: "Your login disabled the dock camera. What happened?",
      requiresAll: ["clue-camera"],
      requiresAny: [],
      stance: "true",
      text: "I turned the dock camera off at 1:50. The picture was flickering and I did not want a fault on my first night. I was on the north lot from 2:10 to 2:25. The dock is south. I did not see that door. I did not touch the badge reader.",
    },
  ],
  deductions: [
    {
      id: "ded-board",
      question: "Why did the station sound like dead air while the carrier stayed up?",
      options: [
        { id: "opt-board-tower", label: "The transmitter failed.", correct: false },
        {
          id: "opt-board-cut",
          label: "Someone cut the studio feed during a struggle.",
          correct: false,
        },
        {
          id: "opt-board-bed",
          label: "The board was put on a near-silent bed on purpose.",
          correct: true,
        },
        {
          id: "opt-board-mic",
          label: "The producer fell asleep on the live microphone.",
          correct: false,
        },
      ],
      minimalSets: [
        ["clue-storm", "clue-program"],
        ["clue-storm", "clue-cart"],
        ["clue-program", "clue-cart"],
      ],
    },
    {
      id: "ded-voluntary",
      question: "What happened to Mara Ellison?",
      options: [
        {
          id: "opt-vol-taken",
          label: "She was taken out against her will.",
          correct: false,
        },
        {
          id: "opt-vol-chose",
          label: "She chose to leave, unhurt, during the show.",
          correct: true,
        },
        {
          id: "opt-vol-inside",
          label: "She is still somewhere in the building.",
          correct: false,
        },
        {
          id: "opt-vol-tower",
          label: "She left the booth to fix the tower.",
          correct: false,
        },
      ],
      minimalSets: [
        ["clue-cart", "clue-badge"],
        ["clue-cart", "clue-lot"],
      ],
    },
    {
      id: "ded-jules",
      question: "Where was Jules Park at 2:17 a.m.?",
      options: [
        {
          id: "opt-jules-break",
          label: "In the break room, not at a board.",
          correct: true,
        },
        {
          id: "opt-jules-booth",
          label: "In the air studio, running the board.",
          correct: false,
        },
        { id: "opt-jules-dock", label: "At the south dock.", correct: false },
        {
          id: "opt-jules-home",
          label: "Already home, since 1:00 a.m.",
          correct: false,
        },
      ],
      minimalSets: [["clue-soup", "clue-prod"]],
    },
    {
      id: "ded-camera",
      question: "What does the blank dock camera show?",
      options: [
        {
          id: "opt-cam-wiped",
          label: "Someone erased a recording of a crime.",
          correct: false,
        },
        {
          id: "opt-cam-disable",
          label:
            "Reed disabled the camera. The dock reader is a different machine and still logged the door.",
          correct: true,
        },
        {
          id: "opt-cam-empty",
          label: "The blank means nobody used the dock.",
          correct: false,
        },
        {
          id: "opt-cam-mara",
          label: "Mara turned the camera off on her way out.",
          correct: false,
        },
      ],
      minimalSets: [["clue-camera", "clue-badge"]],
    },
    {
      id: "ded-roof",
      question: "Where was Dennis Crowe at 2:19 a.m.?",
      options: [
        {
          id: "opt-roof-office",
          label: "In his office on paperwork.",
          correct: false,
        },
        {
          id: "opt-roof-up",
          label: "On the roof landing, not at the dock.",
          correct: true,
        },
        { id: "opt-roof-dock", label: "At the south dock.", correct: false },
        {
          id: "opt-roof-studio",
          label: "In the air studio with Mara.",
          correct: false,
        },
      ],
      minimalSets: [
        ["clue-roof", "clue-badge"],
        ["clue-roof", "clue-program"],
        ["clue-roof", "clue-cart"],
      ],
    },
  ],
  people: [
    { id: "mara", label: "Mara Ellison, the host, who is not in the building" },
    { id: "dennis", label: "Dennis Crowe, station manager" },
    { id: "jules", label: "Jules Park, producer" },
    { id: "reed", label: "Reed Solano, night security" },
  ],
  acts: [
    { id: "act-abducted", label: "Someone removed her against her will." },
    {
      id: "act-inside",
      label: "She is still in the building, unable to answer.",
    },
    { id: "act-left", label: "She left on her own and was not hurt." },
    {
      id: "act-tower",
      label: "She went to the transmitter because the station went off the air.",
    },
  ],
  motives: [
    {
      id: "mot-sister",
      label: "She would not air a private segment about her sister.",
    },
    {
      id: "mot-jules",
      label: "A producer's sponsor promise turned into a fight that removed her.",
    },
    {
      id: "mot-reed",
      label: "A guard needed to hide what the dock camera saw.",
    },
    { id: "mot-none", label: "No motive is on the record." },
  ],
  solution: {
    personId: "mara",
    actionId: "act-left",
    motiveId: "mot-sister",
    rawMinimalSets: [
      ["clue-cart", "clue-badge"],
      ["clue-cart", "clue-lot"],
    ],
    deductionSupportId: "ded-voluntary",
    relevantIds: [
      "clue-cart",
      "clue-badge",
      "clue-lot",
      "clue-storm",
      "clue-program",
      "clue-rider",
      "clue-phone",
      "ded-voluntary",
      "ded-board",
    ],
  },
  ending: [
    {
      id: "end-frame",
      text: "You leave the written account on the studio desk. The lines below repeat notes you already logged. They do not add a later discovery.",
      clues: [],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-cart",
      text: "Her hold cart, recorded at 2:04 and never played on air, says she is choosing to walk out the south dock, that she is not hurt, that she will not put her sister on the air, and that she faded the board to the storm bed.",
      clues: ["clue-cart"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-badge",
      text: "The south dock reader logged her card and personal PIN at 2:19, with no re-entry and no other credential in that hour.",
      clues: ["clue-badge"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-lot",
      text: "The 6:00 parking checklist shows her space empty. The other three vehicles were still there.",
      clues: ["clue-lot"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-storm",
      text: "The play slot was running the storm-bed room tone from 2:17. The carrier stayed up. The silence sensor did not alarm.",
      clues: ["clue-storm"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-program",
      text: "The program log closes the live mic at 2:17 and notes bed / hold in the same hand as the cart label.",
      clues: ["clue-program"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-rider",
      text: "The syndication rider names an interview with her sister and pays that fee to Dennis Crowe.",
      clues: ["clue-rider"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-phone",
      text: "The booth phone shows a four-minute call at 1:05 to the contact saved as Sis, do not air.",
      clues: ["clue-phone"],
      heard: [],
      hideIfHeard: [],
    },
    {
      id: "end-roof-short",
      text: "The roof door was held open by Dennis Crowe's code from 2:02 to 2:28, and the landing does not see the south dock.",
      clues: ["clue-roof"],
      heard: [],
      hideIfHeard: ["dennis-where", "dennis-where-confront"],
    },
    {
      id: "end-dennis",
      text: "Dennis first said he was in the office from 2:00 to 2:30 on paperwork. The roof door was open on his code from 2:02 to 2:28, and he then said he was on the landing and could not see the south dock.",
      clues: ["clue-roof"],
      heard: ["dennis-where", "dennis-where-confront"],
      hideIfHeard: [],
    },
    {
      id: "end-soup-short",
      text: "The break room still had cold soup, a microwave showing 1:44, and Jules Park's headphones.",
      clues: ["clue-soup"],
      heard: [],
      hideIfHeard: ["jules-home", "jules-confront"],
    },
    {
      id: "end-jules",
      text: "Jules first said they went home at 1:00. The break room still had soup from 1:44 and their headphones, and Jules then said they had fallen asleep on the couch and had not run the live board.",
      clues: ["clue-soup"],
      heard: ["jules-home", "jules-confront"],
      hideIfHeard: [],
    },
    {
      id: "end-camera-short",
      text: "The dock camera was manually disabled at 1:50 by login R.Solano. His round sheet puts him on the north lot, and the dock reader is a separate machine.",
      clues: ["clue-camera"],
      heard: [],
      hideIfHeard: ["reed-round", "reed-confront"],
    },
    {
      id: "end-reed",
      text: "Reed first said nobody left and that he had the lot. The binder shows he disabled the dock camera at 1:50, and he then said he was on the north lot from 2:10 to 2:25 and did not see the south dock.",
      clues: ["clue-camera"],
      heard: ["reed-round", "reed-confront"],
      hideIfHeard: [],
    },
    {
      id: "end-close",
      text: "No charge is filed in this case. The question was what the night's notes can support.",
      clues: [],
      heard: [],
      hideIfHeard: [],
    },
  ],
};
