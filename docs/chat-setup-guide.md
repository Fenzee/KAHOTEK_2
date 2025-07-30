# Chat Feature Setup Guide

## Overview
This document provides instructions for setting up the real-time chat feature for the GolekQuiz application. The chat functionality allows participants and hosts to communicate during quiz sessions.

## Database Setup

1. Run the migration script to create the necessary database table and set up permissions:

```bash
# Navigate to your project directory
cd Kahoote

# Run the SQL migration script using Supabase CLI or directly in your Supabase SQL editor
# If using Supabase CLI
supabase db run < scripts/08-add-chat-feature.sql

# If using Supabase SQL Editor, copy the contents of scripts/08-add-chat-feature.sql
# and execute it in the SQL Editor
```

## Features
The chat system includes:
- Real-time messaging between quiz hosts and participants
- Avatar display for each message
- Time stamps for messages
- Responsive design that works on both desktop and mobile
- Floating chat bubble that can be opened and closed

## Implementation Details
- The chat system uses Supabase's real-time functionality to deliver messages instantly
- Messages are stored in the `game_chat_messages` table
- Security is ensured through Row Level Security (RLS) policies
- The chat UI is implemented as a reusable component that can be added to any page

## Row Level Security
The SQL migration sets up the following RLS policies:
1. Users can view messages for game sessions they're participating in
2. Participants and hosts can insert messages
3. Users can only update or delete their own messages

## Component Usage
The ChatPanel component is used in:
1. The host page (`app/host/[id]/page.tsx`)
2. The player waiting room page (`app/play/[id]/page.tsx`)

To add the chat panel to additional pages, import it and include it in your component:

```tsx
import { ChatPanel } from "@/components/ui/chat-panel";

// Then in your component:
<ChatPanel 
  sessionId={gameSession.id} 
  userId={user?.id || null}
  nickname={displayName}
  avatarUrl={userProfile?.avatar_url}
  position="right" // or "bottom"
/>
```

## Troubleshooting
If you encounter issues with the chat feature:

1. **Messages not appearing in real-time**:
   - Ensure Supabase real-time is enabled for the `game_chat_messages` table
   - Check that the publication includes this table

2. **Permission errors**:
   - Verify RLS policies are correctly configured
   - Make sure users have the appropriate roles

3. **UI issues**:
   - Check if the z-index of the chat panel is being overridden by other elements
   - Verify that the chat panel position is appropriate for your layout

## Future Enhancements
Potential improvements to consider:
- Message reactions
- Read receipts
- Image/attachment support
- Private messaging between participants 