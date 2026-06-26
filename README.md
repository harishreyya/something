# Some Thing — Real-time Social Chat App

A full-stack social chat application with real-time messaging, audio/video calling, friend management, and Google OAuth authentication. Built with Next.js and powered by WebRTC + Socket.IO.

---

## Features

### Authentication
- Google OAuth login via NextAuth.js
- Session-based protection — unauthenticated users are redirected to `/login`
- Persistent sessions stored in MongoDB via Prisma adapter

### Real-Time Messaging
- Instant messaging powered by **Socket.IO** (dedicated server on port 3001)
- Message history persisted to MongoDB
- Read receipts (double-check marks) sent via Socket.IO events
- Each conversation is loaded on-demand with full scrollable history

### Audio & Video Calling (WebRTC)
- Peer-to-peer audio and video calls using native WebRTC APIs
- Socket.IO signaling for offer/answer/ICE candidate exchange
- Google STUN + Metered TURN servers for connectivity
- Call timer, mute/unmute, speaker toggle, camera toggle
- Ringtone notification (oscillator-based) for incoming calls
- Dedicated incoming-call screen with accept/reject

### Friend Management
- Send, accept, and reject friend requests
- Real-time notification bell showing pending requests
- Accept/reject from the notification dropdown
- Unfriend any existing friend
- Relationship status tracking: `NONE`, `PENDING`, `FRIENDS`

### User Search
- Debounced search (500ms) by name or email
- Case-insensitive matching
- Displays relationship status for each result
- Current user excluded from results

### Responsive Chat UI
- Desktop sidebar (320px) with friend list and online status indicators
- Mobile swipeable sidebar via `react-swipeable` (swipe left/right gestures)
- Overlay backdrop on mobile
- Online/offline indicators via Socket.IO `online_users` tracking

---

## Tech Stack

| Category | Technologies |
|---|---|
| **Framework** | Next.js 16 (React 19, App Router) |
| **Language** | JavaScript (JSX) |
| **Authentication** | NextAuth.js (Google OAuth + JWT strategy) |
| **Database** | MongoDB (Atlas) via Prisma ORM |
| **Real-Time** | Socket.IO (server + client) |
| **WebRTC** | Native browser APIs (STUN/TURN) |
| **Styling** | Tailwind CSS v4 |
| **Fonts** | Geist (next/font/google) |
| **Gestures** | react-swipeable |
| **Linting** | ESLint (next/core-web-vitals) |

---

## Architecture & Flow

```
┌──────────────────────────────────────────────────┐
│                  Browser                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐ │
│  │ NextAuth  │  │ Socket.IO│  │   WebRTC       │ │
│  │ (Client)  │  │ (Client) │  │ (PeerConnection)│ │
│  └─────┬────┘  └────┬─────┘  └───────┬────────┘ │
│        │             │                │           │
└────────┼─────────────┼────────────────┼───────────┘
         │             │                │
    ┌────▼─────────────▼────────────────▼───────────┐
    │              Next.js Server (:3000)             │
    │  ┌──────────┐  ┌──────────────────────────┐   │
    │  │ API Routes│  │   Server Components      │   │
    │  │ (REST)    │  │   (SSR / Page Rendering) │   │
    │  └─────┬────┘  └──────────────────────────┘   │
    └────────┼──────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────────┐
    │         Socket.IO Server (:3001)                │
    │  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
    │  │Messaging │  │ Signaling│  │ Online      │   │
    │  │ Events   │  │ (WebRTC) │  │ Tracking    │   │
    │  └─────┬────┘  └──────────┘  └────────────┘   │
    └────────┼───────────────────────────────────────┘
             │
    ┌────────▼──────────────────────────────────────┐
    │             MongoDB (Atlas)                     │
    │  Users │ Messages │ Friends │ FriendRequests   │
    └────────────────────────────────────────────────┘
```

### App Flow

1. User visits any protected route → `getServerSession` checks auth → redirects to `/login` if unauthenticated
2. **Login** → Google OAuth → session persisted via Prisma adapter → redirected to home (`/`)
3. **Home** (`/`) → shows user profile, avatar, navigation
4. **Search** (`/search`) → find users by name/email → send friend requests
5. **Friends** (`/friends`) → view/manage friend list → unfriend
6. **Chat** (`/chat?userId=X`) → select a friend from sidebar → load conversation history → send/receive messages in real-time → initiate audio/video calls

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas (or local MongoDB) instance
- Google OAuth credentials ([Google Cloud Console](https://console.cloud.google.com/))

### Environment Variables

```env
# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# MongoDB
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Installation

```bash
npm install
```

### Setup Database

```bash
npx prisma generate
npx prisma db push
```

### Run (Development)

Start both the Next.js server and the Socket.IO server:

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — Socket.IO
node server.js
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── api/               # REST API routes
│   │   ├── auth/          # NextAuth handler
│   │   ├── users/         # User search & profile
│   │   ├── friends/       # Friends list & unfriend
│   │   ├── friend-request/ # Send/accept/reject/list
│   │   └── messages/      # Get/send/seen
│   ├── chat/              # Chat page
│   ├── components/        # UI components
│   │   ├── Navbar.jsx, LogoutButton.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── SearchUsers.jsx, UserCard.jsx
│   │   ├── AddFriendButton.jsx
│   │   ├── FriendList.jsx, FriendsSidebar.jsx
│   │   ├── ChatLayout.jsx, ChatBox.jsx
│   ├── friends/           # Friends page
│   ├── login/             # Login page
│   ├── search/            # Search users page
│   ├── layout.js          # Root layout
│   ├── page.js            # Home/dashboard
│   └── globals.css        # Tailwind styles
├── lib/
│   └── auth.js            # NextAuth configuration
├── prisma/
│   └── schema.prisma      # Database schema
├── server.js              # Socket.IO standalone server
├── package.json
├── next.config.mjs
├── tailwind.config.*
└── postcss.config.mjs
```

---

## API Reference

### Authentication
- `GET /api/auth/[...nextauth]` — NextAuth handler

### Users
- `GET /api/users/search?q=<query>` — Search users by name/email
- `GET /api/users/[id]` — Get user by ID

### Friends
- `GET /api/friends` — List user's friends
- `POST /api/friends/unfriend` — Remove a friend

### Friend Requests
- `POST /api/friend-request/send` — Send a friend request
- `POST /api/friend-request/accept` — Accept a pending request
- `POST /api/friend-request/reject` — Reject a pending request
- `GET /api/friend-request/list` — List pending requests

### Messages
- `GET /api/messages?senderId=X&receiverId=Y` — Get conversation
- `POST /api/messages` — Send a message
- `POST /api/messages/seen` — Mark messages as seen

---

## Deployment

The app is configured for deployment on **Vercel**. The Socket.IO server would need a separate hosting solution (e.g., Railway, Render, or a VPS).

```bash
npm run build
```

---

## License

MIT
