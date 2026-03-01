# First Glance

> One glance at what matters most

Turn your new tab into a focus dashboard. See your high-priority tasks instantly, stay on track, and avoid distractions.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/lbcklgfmlcjjiclnlhbpmpeaeopjkeop)](https://chromewebstore.google.com/detail/first-glance/lbcklgfmlcjjiclnlhbpmpeaeopjkeop)
[![Website](https://img.shields.io/badge/website-first--glance-pink)](https://gwifloria.github.io/first-glance/)

## Features

- **Dual View Mode** - Focus view (minimal clock + top 3 tasks) and List view (full task management)
- **Pomodoro Timer** - Built-in timer with work/break cycles, synced across tabs
- **Smart Lists** - Today, Tomorrow, This Week, Overdue, Inbox
- **Full Task Management** - View, complete, edit, delete, create tasks
- **5 Themes** - Milk, Beige, Pink, Blue, Dark
- **Guest Mode** - Works offline without account (up to 3 tasks)
- **Internationalization** - Chinese and English support
- **Site Blocking** - Block distracting websites to stay focused
- **Chill Mode** - Need a break? Hold for 10 seconds to temporarily disable blocking for 15 minutes
- **AI Buddy** - Chat-based task assistant powered by OpenAI-compatible API, gives suggestions based on your mood and tasks
- **Cross-device Sync** - Theme preferences synced via Chrome

## Supported Platforms

- Dida365 (TickTick)
- Todoist

## Installation

### From Chrome Web Store

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/first-glance/lbcklgfmlcjjiclnlhbpmpeaeopjkeop)

### Local Development

1. Clone the repository
```bash
git clone https://github.com/gwifloria/first-glance.git
cd first-glance
```

2. Install dependencies
```bash
pnpm install
```

3. Configure environment variables
```bash
cp apps/extension/.env.example apps/extension/.env
# Edit .env and add your Dida365 API credentials
```

4. Build
```bash
pnpm build
```

5. Load extension
   - Open Chrome and visit `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked extension"
   - Select `apps/extension/dist` directory

## Development

```bash
# Development mode (watch)
pnpm dev

# Build all apps
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build extension only
pnpm --filter @first-glance/extension build

# Build web only
pnpm --filter @first-glance/web build
```

## Tech Stack

- **Framework**: React 19 + TypeScript 5.7
- **Build**: Vite 6.4 + @crxjs/vite-plugin
- **UI**: Ant Design 5.22 + Tailwind CSS 4.1
- **i18n**: i18next
- **Monorepo**: pnpm + Turbo
- **Extension**: Chrome Manifest V3

## Project Structure

```
apps/
├── extension/               # Chrome extension
│   └── src/
│       ├── newtab/          # New tab entry point
│       ├── background/      # Service Worker (OAuth, token refresh)
│       ├── components/      # React components
│       │   ├── FocusView/   # Focus mode components
│       │   ├── Sidebar/     # List mode sidebar
│       │   ├── TaskList/    # Task list components
│       │   ├── Task/        # Task item components
│       │   ├── Buddy/       # AI Buddy (chat panel, settings)
│       │   ├── BlockedPage/ # Blocked page (Chill Mode)
│       │   └── common/      # Shared components
│       ├── contexts/        # React Context providers
│       ├── hooks/           # Custom React hooks
│       ├── api/adapters/    # Task data adapters
│       ├── themes/          # Theme configurations
│       ├── i18n/            # Internationalization
│       ├── utils/           # Utility functions
│       └── types/           # TypeScript types
└── web/                     # Project website (Astro)
```

## CI/CD

This project uses GitHub Actions for automation:

- **deploy-web.yml** - Deploys website to GitHub Pages on push to main
- **bump-version.yml** - Manual workflow to bump version (patch/minor/major)
- **release.yml** - Auto-publishes to Chrome Web Store when a version tag is created, generates bilingual changelog from merged PRs

## APIs

**Dida365 (TickTick)**
- Documentation: https://developer.dida365.com/docs
- Register an app in the developer portal to get Client ID and Client Secret

**Todoist**
- Documentation: https://developer.todoist.com/rest/v2/
- Register an app at https://developer.todoist.com to get credentials

## Privacy

See [PRIVACY.md](./PRIVACY.md)

## License

MIT
