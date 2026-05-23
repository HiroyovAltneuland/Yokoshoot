# Yokoshoot Agent Guide

## Overview

Yokoshoot is a browser-playable side-scrolling shooter.

All in-game text shown to players must be Japanese.

The game flow is:

1. Title screen
2. In-game
3. Game over or game clear

The in-game section has 6 stages. Each stage follows the same structure:

1. Defeat regular enemies
2. Conversation before the mid-boss
3. Defeat the mid-boss
4. Defeat regular enemies
5. Conversation before the stage boss
6. Defeat the stage boss

## Screen Flow

### Title Screen

- Show the game title.
- Provide a clear start action.
- Starting the game moves to stage 1.

### In-Game

- The player controls the protagonist in a horizontal-scrolling shooting stage.
- The stage progresses through enemy waves, mid-boss battle, more enemy waves, and boss battle.
- Clearing the boss of stage 6 moves to the game clear screen.
- Losing all lives moves to the game over screen.

### Game Over

- Show that the player has been defeated.
- Provide a retry action that returns to the title screen or restarts the game.

### Game Clear

- Show that all 6 stages have been cleared.
- Provide a return-to-title action.

## Stage Structure

There are 6 stages:

- Stage 1
- Stage 2
- Stage 3
- Stage 4
- Stage 5
- Stage 6

Each stage should contain:

- Regular enemy wave 1
- Pre-mid-boss dialogue
- Mid-boss battle
- Regular enemy wave 2
- Pre-boss dialogue
- Boss battle

## Dialogue Direction

Before every mid-boss battle and boss battle, show a conversation scene.

The conversation layout is:

- Protagonist standing portrait on the left
- Enemy standing portrait on the right
- Dialogue text area
- Speaker name display

The conversation should end before combat begins.

Dialogue should make it clear whether the upcoming fight is a mid-boss or boss encounter.

## Implementation Priorities

When building or modifying the game, prioritize:

1. A playable full game loop from title to clear/game over
2. All 6 stages with the required encounter structure
3. Dialogue scenes before every mid-boss and boss
4. Clear, responsive browser controls
5. Readable code organized around game state, stage state, enemies, bosses, bullets, and dialogue

## Text And Localization

- All visible in-game text must be Japanese.
- Source code identifiers and comments may use English when that keeps the codebase clear.
- Player-facing UI, dialogue, results, buttons, and messages should be written in natural Japanese.

## Suggested Game States

Use explicit states for the main flow:

- `title`
- `dialogue`
- `playing`
- `gameOver`
- `gameClear`

Use stage phase values for in-game progression:

- `wave1`
- `midBossDialogue`
- `midBoss`
- `wave2`
- `bossDialogue`
- `boss`
- `stageClear`

## Notes For Future Agents

- Keep the game runnable in a browser.
- Avoid adding server-only requirements unless the project later adopts a framework that needs one.
- Preserve the core flow described in this file.
- If expanding story, art, or mechanics, keep the 6-stage structure and dialogue-before-boss requirement intact.

## Repository And Release Workflow

- Manage work with Git.
- The canonical remote repository should be a public GitHub repository under `HiroyovAltneuland`.
- Use pull requests for each meaningful unit of work.
- Review each pull request before merging.
- Publish the playable game with GitHub Pages.
- Keep the default branch deployable.
