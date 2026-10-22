export const profile = {
  name: "Jacob Gil",
  role: "Product Lead & Engineer",
  email: "jacobgil325@gmail.com",
  github: "https://github.com/jgil325",
  linkedin: "https://www.linkedin.com/in/gil-jacob/",
  site: "https://jgil325.github.io",
};

// This is the curated order used on the homepage and in the project library.
export const projects = [
  {
    slug: "ofc-mobile",
    title: "OFC Mobile",
    year: 2026,
    category: "games",
    description:
      "Multiplayer poker, from the rules engine to the last interaction.",
    tags: "React Native / Expo / TypeScript",
    role: "Product, design & engineering",
    platform: "iOS & Android",
    context: "Independent / 2026",
    summary:
      "A multiplayer poker experience, designed for asynchronous play and built from the rules up.",
    image: "ofc",
    imageWidth: 772,
    imageHeight: 450,
    mobileHeight: 320,
    alt: "OFC Mobile screens showing the game library, a live poker table, and practice play.",
    sections: [
      [
        "Complex rules. Clear play.",
        "Make a complex card game feel clear on a small screen. Every placement needs to be deliberate, and every player should see only what they’re allowed to see.",
      ],
      [
        "The complete experience.",
        "A React Native client, a deterministic rules engine, and an authoritative multiplayer service. Practice, invitations, live table updates, and hand history connect the experience.",
      ],
    ],
    detailsTitle: "Details are the product.",
    detailsIntro:
      "From card placement to reconnects, the useful work happens in the states between screens.",
    details: [
      [
        "Space for the table",
        "Compact controls keep the board and your hand in view, even when more players join.",
      ],
      [
        "One gesture, one action",
        "Placement, swapping, and cancellation states make card movement predictable.",
      ],
      [
        "The server owns the game",
        "Validated commands and private player views keep hidden information hidden across reconnects.",
      ],
    ],
  },
  {
    slug: "taiwanese-study",
    title: "Taiwanese Poker Solver + Tool",
    year: 2026,
    category: "games",
    description: "A desktop workspace for better poker decisions.",
    tags: "Rust / React / Tauri",
    role: "Product, design & engineering",
    platform: "Desktop",
    context: "Independent / 2026",
    summary:
      "A Rust-powered workspace for analyzing Taiwanese poker decisions and practicing hand arrangements.",
    image: "taiwanese",
    imageWidth: 516,
    imageHeight: 450,
    mobileHeight: 300,
    alt: "Taiwanese Poker Solver + Tool desktop workspace with hand arrangements, analysis, and practice controls.",
    sections: [
      [
        "Study the decision.",
        "Bring hand construction, simulation, and comparison into one workspace. The goal is to help a player understand the tradeoffs between arrangements.",
      ],
      [
        "A focused desktop tool.",
        "A React interface sits above a Rust simulation engine, with a Tauri desktop wrapper. Analysis and practice share the same card and arrangement language.",
      ],
    ],
    detailsTitle: "From analysis to practice.",
    detailsIntro:
      "An analytical tool is useful when it makes the next decision easier to understand.",
    details: [
      [
        "A clear workspace",
        "Cards, candidate arrangements, and results stay together while studying a hand.",
      ],
      [
        "A Rust core",
        "Monte Carlo simulation supports comparison of possible arrangements.",
      ],
      [
        "Practice the pattern",
        "A dedicated practice flow turns study into repeated decisions.",
      ],
    ],
  },
  {
    slug: "broadcast-graphics",
    title: "Live broadcast graphics",
    year: 2026,
    category: "apps",
    description:
      "Real-time data and animated overlays for Hustler Casino Live and Lodge Card Club.",
    tags: "RF Cloud / Lead Engineer / RF Labs",
    role: "Lead Engineer / RF Cloud",
    platform: "Live broadcast",
    context: "RF Labs / professional work",
    summary:
      "The on-air layer for live poker: player information, hand data, statistics, and motion that make the game readable.",
    image: "broadcast",
    imageWidth: 1312,
    imageHeight: 450,
    mobileHeight: 784,
    alt: "Real Hustler Casino Live player and pot graphics, beside a Lodge Livestream VPIP graphic. Sample hand and player data.",
    sections: [
      [
        "Hustler Casino Live.",
        "Built broadcast graphics that combine dynamic game data with animated on-screen visuals. Player names, stacks, hole cards, equity, actions, and pot information form one coordinated presentation.",
      ],
      [
        "Lodge Card Club.",
        "On-air statistics and hand graphics carry a consistent visual language. The preview uses the Lodge Livestream header and sample player statistics.",
      ],
    ],
    detailsTitle: "Readable in the moment.",
    detailsIntro:
      "A live overlay has to communicate quickly, update clearly, and fit the broadcast.",
    details: [
      [
        "Data becomes presentation",
        "Structured game state drives the displayed information and its changes.",
      ],
      [
        "Motion carries context",
        "Entrances, active-player states, and changing values make the action easier to follow.",
      ],
      [
        "Work with the team",
        "Professional engineering work at RF Labs. Screens shown here are captures of the actual renderer with sample data.",
      ],
    ],
    note: "Renderer previews use sample hand and player data. They are not captures of a live broadcast.",
  },
  {
    slug: "hand-history-recorder",
    title: "Hand History Recorder",
    year: 2026,
    category: "games",
    description: "Capture the hand. Review every decision.",
    tags: "React / TypeScript / PWA",
    role: "Product, design & engineering",
    platform: "Mobile web / PWA",
    context: "Independent / 2026",
    summary:
      "A mobile-first hand-history recorder for recording, reviewing, and organizing poker hands.",
    image: "hand-history",
    imageWidth: 516,
    imageHeight: 370,
    mobileHeight: 270,
    alt: "The mobile hand recorder with a poker table, player seats, pot, and action controls.",
    sections: [
      [
        "Remember the decision.",
        "Record a hand street by street, using a table interface instead of rebuilding the entire story in a notes app.",
      ],
      [
        "Local-first study.",
        "Sessions, hands, notes, and tags are stored with IndexedDB. Review and export connect the capture flow to later study.",
      ],
    ],
    detailsTitle: "A recorder that follows the hand.",
    detailsIntro:
      "Keep the important details close without covering the table.",
    details: [
      [
        "Street-by-street input",
        "Enter actions and chip amounts as the hand develops.",
      ],
      [
        "Fast card selection",
        "A four-color card selector makes hole-card and board entry clear.",
      ],
      [
        "A useful library",
        "Saved hands, tags, notes, and session stack carryover keep study organized.",
      ],
    ],
  },
  {
    slug: "card-vendor-tracker",
    title: "Card Vendor Tracker",
    year: 2026,
    category: "apps",
    description: "Inventory, sales, and the numbers behind a card business.",
    tags: "React / Supabase / Sample data shown",
    role: "Product, design & engineering",
    platform: "Web",
    context: "Independent / 2026",
    summary:
      "Stack is a workspace for the inventory, purchases, sales, grading, and expenses behind a trading-card business.",
    image: "card-vendor",
    imageWidth: 772,
    imageHeight: 370,
    mobileHeight: 270,
    alt: "The current Stack workspace with inventory totals, sales performance, and a card spotlight. Demo collection data.",
    source: "https://github.com/jgil325/card-vendor-tracker",
    sections: [
      [
        "The collection, connected.",
        "Bring purchase lots, inventory, sales, grading submissions, and expenses into a single workspace. The overview connects everyday activity to the numbers behind the collection.",
      ],
      [
        "Private data. Public code.",
        "The app supports a local demo collection and an authenticated Supabase workspace. Owner-scoped data and row-level security separate the public app from the underlying business records.",
      ],
    ],
    detailsTitle: "Built around the working day.",
    detailsIntro:
      "A useful operating tool should make the small, repeated tasks feel clear.",
    details: [
      [
        "One inventory",
        "Track stock, purchase costs, and card details together.",
      ],
      [
        "Beyond the sale",
        "Grading, fee presets, and expenses belong in the same picture.",
      ],
      [
        "A safe demo",
        "The portfolio screenshot shows a demo collection, not private business data.",
      ],
    ],
    note: "The preview shows the current Stack redesign with demo data. The public source repository may show an earlier UI.",
  },
  {
    slug: "oistir",
    title: "AI Audio Interface",
    year: 2023,
    category: "apps",
    description: "Exploring film ideas through interactive audio and language.",
    tags: "Next.js / TypeScript / Team project",
    eyebrow: "AN EARLY TEAM PROJECT",
    role: "Team project",
    platform: "Web",
    context: "OiStir / 2023",
    summary:
      "OiStir is a team exploration of audio and language as tools for developing film ideas about the environment and climate change.",
    image: "oistir",
    imageWidth: 644,
    imageHeight: 300,
    mobileHeight: 270,
    alt: "OiStir’s interactive canvas of connected words and ideas.",
    source: "https://github.com/jgil325/AI-Audio-Interface",
    sections: [
      [
        "Start with a possibility.",
        "An exploratory interface helps a filmmaker get ideas moving through audio, language, and connected concepts.",
      ],
      [
        "Built together.",
        "A team project built with Next.js and TypeScript. Its value is in the interaction experiment: letting ideas be explored before a story is fully formed.",
      ],
    ],
    detailsTitle: "An interface for exploration.",
    detailsIntro:
      "The experience favors curiosity and association over a fixed sequence of form fields.",
    details: [
      [
        "Language as a surface",
        "Related concepts form an interactive idea canvas.",
      ],
      [
        "An audio starting point",
        "Audio and AI-assisted language support the exploration.",
      ],
      [
        "Shared authorship",
        "Presented as a team project, with the original repository linked below.",
      ],
    ],
  },
  {
    slug: "weekly-slopmeter",
    title: "Weekly Slopmeter",
    year: 2026,
    category: "apps",
    description: "A clearer weekly view of coding agent usage.",
    tags: "TypeScript / CLI / Adapted from slopmeter",
    eyebrow: "AN OPEN SOURCE ADAPTATION",
    role: "Open source adaptation",
    platform: "CLI / SVG & PNG",
    context: "Independent / 2026",
    summary:
      "A weekly and monthly view of coding-agent usage, adapted from JeanMeijer’s slopmeter.",
    image: "slopmeter",
    imageWidth: 644,
    imageHeight: 300,
    mobileHeight: 270,
    alt: "A Weekly Slopmeter heatmap with daily token totals and input/output bars. Illustrative sample data.",
    source: "https://github.com/jgil325/weekly-slopmeter",
    upstream: "https://github.com/JeanMeijer/slopmeter",
    sections: [
      [
        "A shorter window.",
        "Replace the yearly view with rolling seven-day and thirty-day windows. Daily cells, token counts, and input/output bars make recent usage easier to inspect.",
      ],
      [
        "Keep the provenance.",
        "Adapted from JeanMeijer/slopmeter, retaining its provider data loading and output formats. The change focuses on the time window and presentation.",
      ],
    ],
    detailsTitle: "A view for the current week.",
    detailsIntro:
      "An example of making an existing open source tool fit a more specific workflow.",
    details: [
      ["Weekly and monthly", "Choose a rolling seven-day or thirty-day view."],
      [
        "Provider context",
        "Separate provider sections keep the original data-loading context visible.",
      ],
      [
        "Shareable output",
        "Export SVG, PNG, or JSON. The portfolio image uses illustrative sample data.",
      ],
    ],
    note: "Adapted from JeanMeijer/slopmeter (MIT). The preview uses illustrative sample usage data.",
  },
  {
    slug: "vanilla-chat",
    title: "Vanilla Chat",
    year: 2021,
    category: "early",
    description:
      "A real-time chat app built with a team at SEO Tech Developer.",
    tags: "Python / Flask / MySQL / Team project",
    role: "Team project",
    platform: "Web",
    context: "SEO Tech Developer / 2021",
    summary:
      "An early team collaboration: a real-time chat application built during SEO Tech Developer.",
    source: "https://github.com/unwosu6/Vanilla-Chat-App",
    sections: [
      [
        "Learn by building together.",
        "Vanilla Chat brought a team together around a working real-time chat application, using Python, Flask, and MySQL.",
      ],
      [
        "Kept for the story.",
        "An early project that represents collaborative development and the path toward the larger products and systems featured here.",
      ],
    ],
    detailsTitle: "An early collaboration.",
    detailsIntro: "Shared authorship is part of this project’s story.",
    details: [
      [
        "A working product",
        "A web interface connected to an application backend and database.",
      ],
      [
        "A team effort",
        "Built with fellow participants at SEO Tech Developer.",
      ],
      ["The original source", "The team repository is linked below."],
    ],
  },
];
