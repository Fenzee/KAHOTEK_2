# Submarine Game Integration

This document explains the submarine game integration that allows users to choose between different game models when hosting a quiz.

## Overview

The submarine integration adds a flexible navigation mode to the quiz system, allowing players to navigate between questions freely rather than following a linear progression.

## Features Added

### 1. Game Model Selection
- **Normal Mode**: Standard linear quiz progression
- **Submarine Mode**: Flexible navigation with question overview and marking system

### 2. Enhanced Host Interface
- Game model selection radio buttons in host setup
- Automatic routing based on selected model
- Maintains all existing functionality

### 3. Smart Routing System
- `/play-submarine/[id]` route for submarine games
- Automatic redirection based on game model
- Seamless integration with existing play system

## Database Changes

### New Column: `game_model`
- Added to `game_sessions` table
- Values: `'normal'` | `'submarine'`
- Default: `'normal'`
- Indexed for performance

### Updated Type Definitions
- Enhanced TypeScript interfaces
- Updated Supabase database types
- Proper type safety throughout

## Setup Instructions

### 1. Database Setup
Run the following script in your Supabase SQL editor:

```sql
-- Run this comprehensive setup script
-- File: scripts/setup-submarine-integration.sql
```

This script will:
- Add the `game_model` column to `game_sessions`
- Ensure all required columns exist
- Create indexes for performance
- Set up validation triggers
- Configure RLS policies

### 2. Environment Configuration
No additional environment variables needed. The integration uses existing Supabase configuration.

### 3. Verification
After running the setup script, verify:
1. `game_sessions` table has `game_model` column
2. Host interface shows game model selection
3. Routing works correctly for both models

## How It Works

### Host Flow
1. Host creates a quiz session
2. Selects game model (Normal/Submarine)
3. Starts the game
4. Players are automatically routed to appropriate interface

### Player Flow
1. Players join through normal join process
2. System detects game model from session
3. Redirects to appropriate play interface:
   - Normal: `/play-active/[id]`
   - Submarine: `/play-submarine/[id]` → `/play-active/[id]`

### Technical Implementation
- Game model stored in database session
- Routing logic checks `game_model` field
- Submarine route acts as intelligent redirect
- Maintains backward compatibility

## File Changes Made

### Frontend Changes
- `app/host/[id]/page.tsx`: Added game model selection UI
- `app/play/[id]/page.tsx`: Updated routing logic
- `app/play-submarine/[id]/page.tsx`: New submarine route (redirects)

### Database Changes
- `lib/supabase.ts`: Updated type definitions
- `scripts/14-add-game-model.sql`: Migration script
- `scripts/setup-submarine-integration.sql`: Comprehensive setup

### Configuration
- All scripts in `scripts/` folder for easy Supabase setup
- Backward compatible with existing data

## Usage

### For Hosts
1. Go to host interface
2. Select "Submarine" model for flexible navigation
3. Select "Normal" model for standard quiz
4. Start game as usual

### For Players
No changes needed - system automatically handles routing based on host's selection.

## Benefits

1. **Flexible Navigation**: Players can jump between questions
2. **Question Overview**: See all questions at once
3. **Progress Tracking**: Mark questions as completed or doubtful
4. **Time Management**: Better control over time allocation
5. **Backward Compatible**: Existing games continue to work

## Troubleshooting

### Database Issues
- Ensure all migration scripts are run in order
- Check that `game_model` column exists
- Verify RLS policies are active

### Routing Issues
- Clear browser cache
- Check that game model is properly saved
- Verify environment variables are set

### Type Errors
- Ensure TypeScript definitions are updated
- Restart development server
- Check import paths

## Future Enhancements

Potential improvements for the submarine system:
1. Custom question ordering
2. Advanced progress analytics
3. Collaborative features
4. Enhanced time management tools

## Support

For issues with the submarine integration:
1. Check database setup scripts
2. Verify type definitions
3. Test routing with both game models
4. Check browser console for errors