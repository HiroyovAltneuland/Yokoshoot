# Gakuen Blade Agent Guide

## Overview

Gakuen Blade is a browser-playable side-scrolling shooter.

All in-game text shown to players must be Japanese.

The Japanese game title is `学園ブレード`.

The overall stage setting should evoke a Japanese high school.

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

- Stage 1: Tennis club, set on the tennis courts at sunset. Boss: `朝比奈 つばめ`.
- Stage 2: Public morals committee, set in the school corridor near the student guidance room. Boss: `鬼塚 律子`.
- Stage 3: Rival bob-cut kendo girl, set in the kendo hall. Boss: `一文字 小夜`.
- Stage 4: Yakuza underlings serving the boss, set behind the school gate around the bicycle parking area and old gym storage. Boss: `黒須 仁美`.
- Stage 5: Student council president in a white sailor uniform, set in the student council room and stairway toward the clock tower. Boss: `御門院 真琴`.
- Stage 6: School chairperson, set in the chairperson's office and rooftop garden at night. Boss: `御門院 朔夜`.

Each stage should contain:

- Regular enemy wave 1
- Pre-mid-boss dialogue
- Mid-boss battle
- Regular enemy wave 2
- Pre-boss dialogue
- Boss battle

## Setting Direction

- The game takes place in and around a Japanese high school.
- Stage backgrounds, enemies, dialogue, and UI copy should reinforce the school setting.
- Use locations such as classrooms, corridors, gymnasiums, courtyards, rooftops, club rooms, and school gates when expanding stage concepts.
- Enemy groups should feel like exaggerated school factions rather than military units.

## Player Character

Suggested protagonist name: `黒羽 凛` (`くろは りん`).

The player character is:

- A long-haired girl in a black sailor uniform
- Spawned at the vertical center near the left edge of the screen
- A close-to-mid-range knife fighter with burst movement

### Player Shot

- The normal shot is a thrown small knife.
- The normal shot fires 3 times per second.
- The shot should travel from the player toward the right side of the screen.
- The shot visual should read as a small blade or throwing knife.

### Charged Dash Attack

- Holding Space charges the attack.
- After holding Space for at least 1 second, show a charge effect around the protagonist.
- Releasing Space after charging for at least 1 second triggers a dash attack.
- After using a charged dash, it cannot be used again for 4 seconds.
- During the charged dash cooldown, show a small cooldown gauge above the protagonist's head that shrinks as the cooldown decreases.
- During the dash and return, the protagonist is invincible, cannot fire shots, and flickers 2 times per second.
- During the dash, the protagonist rushes to the right edge of the screen at 3 times normal movement speed, leaving a visible trail.
- A charged dash can damage each target it collides with once, dealing 9 normal-shot hits of damage.
- After reaching the right edge, the protagonist returns to the original position at normal movement speed.
- The original position should be remembered from the point where the charged dash began.
- If Space is released before 1 second, fire the normal small-knife shot instead.

## Boss And Faction Direction

- Stage 1 boss `朝比奈 つばめ`: Tennis club ace. Use tennis rackets, tennis balls, court lines, and club uniforms as visual motifs.
- Stage 2 boss `鬼塚 律子`: Public morals committee leader. Use armbands, inspection notebooks, discipline signs, and strict school-rule imagery.
- Stage 3 boss `一文字 小夜`: A rival girl swordswoman with a bob haircut and kendo uniform. She should feel like the protagonist's personal mirror and technical equal.
- Stage 4 boss `黒須 仁美`: A woman who commands yakuza underlings serving the boss. Keep the school setting by framing them as intruders or outside enforcers around the school grounds.
- Stage 5 boss `御門院 真琴`: The student council president, a girl in a white sailor uniform. She should feel elegant, commanding, and ideologically opposed to the protagonist.
- Stage 6 boss `御門院 朔夜`: The school chairperson. The final enemy should feel like the hidden authority behind the school conflict.
- `御門院 真琴` and `御門院 朔夜` share the same family name to connect the stage 5 and stage 6 conflicts.

## Stage 1 Gameplay Direction

- Stage 1 is playable first and should establish the core shooting feel.
- The protagonist's normal attack fires 3 times per second.
- Stage 1 enemies mainly attack with tennis balls.
- Regular enemy shot frequency should be about 75% of the initial prototype frequency.
- In each regular enemy section, the first 3 spawned regular enemies should fire only normal player-aimed shots.
- During regular enemies 1, tennis ball attacks should be player-aimed shots and forward 2-way shots at a 3:1 ratio.
- The forward 2-way shot uses 30 degrees and 330 degrees, where 0 degrees means left and angles increase clockwise.
- During regular enemies 2, tennis ball attacks should be player-aimed shots and 8-way radial shots at a 3:1 ratio.
- The 8-way radial shot uses 0, 45, 90, 135, 180, 225, 270, and 315 degrees, where 0 degrees means left and angles increase clockwise.
- Regular enemies can fire a special 2-way or 8-way shot only while they are in the right half of the screen.
- A regular enemy can fire a special 2-way or 8-way shot only once; after that, it should fire only normal player-aimed shots.
- Regular enemies that fire 2-way or 8-way shots should immediately change direction and move right.
- Regular enemies are defeated by 1 normal attack hit.
- Stage 1 should move to the mid-boss or boss only after the current regular enemies are defeated or leave the screen, and their remaining tennis balls are gone.
- The mid-boss is defeated by 20 normal attack hits.
- Stage 1 mid-boss dialogue should be a single line and should advance automatically without pressing a button.
- The boss changes attack behavior after taking 10 hits.
- The boss is defeated after taking 25 total hits.
- Target play-time feel: regular enemies 1 for about 15 seconds, mid-boss for about 15 seconds, regular enemies 2 for about 7 seconds, boss for about 30 seconds.

## Title Art Direction

- Title logo text: `学園ブレード`.
- Title art should center on 黒羽 凛, the black sailor-uniform protagonist with long hair and small knives.
- The image should suggest the stage hierarchy: tennis club, public morals committee, rival kendo girl, yakuza underlings, white-sailor student council president, and the school chairperson.
- The background should clearly read as a Japanese high school after dark or at dramatic sunset.
- The tone should be stylish school action, not military sci-fi.

## Dialogue Direction

Before every mid-boss battle and boss battle, show a conversation scene.

The conversation layout is:

- Protagonist standing portrait on the left
- Enemy standing portrait on the right
- Dialogue text area
- Speaker name display

Standing portrait direction:

- 黒羽 凛 faces left in conversation art.
- Stage 1 mid-boss 朝比奈つばめ faces front and should feel relaxed, confident, and slightly taunting.
- Stage 1 boss 朝比奈つばめ faces right and should feel serious, focused, and fully committed.

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
