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
- The shot should travel straight right by default, diagonally up-right while Up is held, and diagonally down-right while Down is held. If Up and Down are both held, fire straight.
- Rin's normal shot should spawn near her chest-height right hand so it appears to launch from the knife-ready pose.
- The shot visual should read as a small blade or throwing knife.
- The player shot sound effect should feel like a small blade cutting through air.
- Rin's damage hitbox should be a small waist-centered area only; visual body overlap outside the waist should not count as damage.
- Immediately after taking damage, Rin should show a dedicated flinch sprite for about 0.5 seconds and be knocked back about one character width to the left.
- Humanoid in-game characters should read as grounded in roughly the lower third of the screen. For Rin and humanoid regular enemies, clamp their movement centers there; for bosses, it is enough for their feet to stay in that area so larger vertical movement is allowed.

### Charged Dash Attack

- Holding Space charges the attack.
- After holding Space for at least 1 second, show a charge effect around the protagonist.
- The charge-ready effect should be centered around Rin's waist, not her full body center.
- Releasing Space after charging for at least 1 second triggers a dash attack.
- After the protagonist returns to the original position from a charged dash, it cannot be used again for 4 seconds.
- During the charged dash cooldown, show a small cooldown gauge above the protagonist's head that shrinks as the cooldown decreases.
- During the charged dash cooldown, holding Space should not build charge or show the charge effect, but releasing Space should still fire a normal small-knife shot if the normal shot cooldown allows it.
- During the dash and return, the protagonist is invincible, cannot fire shots, and flickers 2 times per second.
- During the dash, the protagonist rushes to the right edge of the screen at 3 times normal movement speed, leaving a visible trail. Use the same vertical aim rule as shots: straight by default, diagonal up while Up is held, and diagonal down while Down is held.
- A charged dash can damage each target it collides with once, dealing 9 normal-shot hits of damage.
- After reaching the right edge, the protagonist returns to the original position at normal movement speed.
- The original position should be remembered from the point where the charged dash began.
- If Space is released before 1 second, fire the normal small-knife shot instead.

## Boss And Faction Direction

- Stage 1 boss uses a two-state 3-frame sprite: normal state with an upright chest-height racket guard, and powered state with a lowered return-ace stance.

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
- Rin's normal shot sound should feel like a sword practice swing.
- Rin's charge start should not play a sound.
- Rin's charge completion sound should feel like a motor spinning up.
- Regular enemy shot sound effects should feel like tennis return hits.
- Boss shot sound effects should feel like tennis smash hits.
- Rin's damage voice should be a restrained, cool female `くぅっ` with slightly strained pain.
- Rin's charged dash should play a short cool female `ハッ`, then a strong ground-kick `ドン`.
- Defeating stage 1 mid-boss 朝比奈つばめ should play a lively female `本気なの！？`.
- Stage 1 boss 朝比奈つばめ's attack change should play a lively female `通さない！`.
- Defeating stage 1 boss 朝比奈つばめ should play a lively female `うわーっ`.
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
- Stage 1 regular enemies 1 should use only the smaller umpire drone A sprite.
- Stage 1 regular enemies 2 should use only the smaller umpire drone B sprite.
- Drone-type regular enemies should emit one continuous small-motor-like loop per existing drone.
- Each drone loop should get louder as the drone gets closer to Rin; if it is farther than half the screen width from Rin, use 30% volume.
- Drone-type regular enemies should play a brief stronger wind-cut sound when they reverse direction.
- After the stage 1 mid-boss 朝比奈 つばめ takes 10 or more damage, she becomes invincible and retreats to the right side of the screen.
- When the stage 1 mid-boss retreats, spawn exactly one pink twin-tail tennis club girl and one tall visor-and-glasses tennis club girl with a single ponytail.
- The twin-tail and visor-and-glasses reinforcements should be about Rin's in-game size, use 3-frame forward animations, and keep their head-to-body proportions close to Rin rather than a chibi look.
- The twin-tail and visor-and-glasses reinforcements should lean strongly forward and read as walking or running with alternating left/right foot placement across their 3 animation frames.
- The twin-tail and visor-and-glasses reinforcements should display about 1.4 times larger than their original 132x99 prototype size.
- Stage 1 should move from the mid-boss encounter to regular enemies 2 after both reinforcements are defeated or leave the screen.
- Umpire drone A and B should animate their propellers rotating across 3 frames.
- Stage 1 should move to the mid-boss or boss only after the current regular enemies are defeated or leave the screen, and their remaining tennis balls are gone.
- Stage 1 mid-boss dialogue should be a single line and should advance automatically after 3.4 seconds without pressing a button.
- The boss changes attack behavior after taking 10 hits.
- The boss is defeated after taking 25 total hits.
- Target play-time feel: regular enemies 1 for about 15 seconds, mid-boss for about 15 seconds, regular enemies 2 for about 7 seconds, boss for about 30 seconds.

## Title Art Direction

- Title logo text: `学園ブレード`.
- Title art should center on 黒羽 凛, the black sailor-uniform protagonist with long hair and small knives.
- The image should suggest the stage hierarchy: tennis club, public morals committee, rival kendo girl, yakuza underlings, white-sailor student council president, and the school chairperson.
- The background should clearly read as a Japanese high school after dark or at dramatic sunset.
- The tone should be stylish school action, not military sci-fi.

## In-Game Visual Direction

- In-game characters, projectiles, effects, and stage backgrounds should use a readable pixel-art style.
- The in-game canvas should always preserve its 16:9 aspect ratio across resolutions; unused viewport space should be black letterbox/pillarbox bars.
- Prefer blocky silhouettes, hard edges, and stepped shapes in canvas gameplay rendering.
- Avoid smooth gradients or round vector-like character shapes in in-game rendering unless there is a strong reason.
- Rin's in-game sprite uses a late-1990s Japanese horror adventure mood: subdued, semi-realistic pixel art with six 3-frame rows for forward movement, backward movement, charged dash, neutral idle, damage flinch, and knife throw.
- Rin's forward movement row should read as walking forward, with left and right feet alternating across the 3 animation frames.
- Rin's neutral 3-frame animation should keep her head horizontally stable while her hair, scarf, and skirt flutter like she is taking a large quiet breath.
- Rin's neutral stance should keep her feet closed.
- Rin's knife throw row should read as a quick 2-frame throw based on the forward/neutral stance; apply it only while moving forward, moving vertically, or standing idle, not while moving backward.
- Rin's charged dash row should include a visible afterimage or speed trail behind her body.
- When regenerating Rin sprites, keep consistent cell padding and stable apparent character height across all frames.
- Moving straight up or straight down should use Rin's forward movement sprite row.
- Rin's charge-ready effect and charged dash trail use smooth circular effects rather than pixel blocks.
- Stage 1 enemy bullets should read as rotating tennis balls with animated seams.

### Sprite Padding Rules

- Sprite sheets should use equal-size cells, one animation frame per cell.
- Keep the subject fully inside each cell and never touching cell edges.
- Keep at least 6-10px of transparent padding on every side of every cell.
- For humanoid sprites, align the apparent foot position and character height across all frames.
- For idle and walk loops, keep the head and torso anchor visually stable; animate secondary motion such as hair, scarf, skirt, propellers, baskets, or effects.
- Generate poses using the largest silhouette in the animation as the padding baseline so no frame clips when rendered in-game.
- Do not trust an AI-generated sprite grid by eye alone. Generated rows and columns can drift, overlap, or contain fragments from neighboring frames.
- If frames cross nominal cell boundaries, remove the chroma key first, then extract visible connected components and repack each frame into a clean equal-size output grid.
- Preserve intentional secondary effects such as dash afterimages, speed trails, hair streaks, cloth motion, propellers, and baskets by grouping nearby or connected components with the body.
- Do not clear fixed cell margins blindly after packing; it can cut off hair, shoes, and effects. Prefer measured packing with target padding and then validate the result.
- After chroma-key removal, clear a small transparent safety margin around every cell edge to remove stray pixels.
- Validate each sheet by checking transparent corners, per-cell alpha bounds, apparent height consistency, and stable anchor positions.
- Inspect both a bright-background grid preview and a black-background preview before accepting a transparent sprite sheet.
- Measure idle head horizontal positions before adding draw offsets; prefer fixing the packed source over compensating with per-frame offsets.
- Also validate the in-game render result: source rectangles, draw offsets, scaling, and movement clamps must leave the full sprite visible on screen.
- Avoid sampling neighboring sprite cells during canvas rendering by using safe source insets or sufficient transparent gutters between cells.
- Use `tools/sprite-tool.ps1` for repeatable sprite checks and cleanup before writing one-off image-processing code.
- Use `sprite-tool.ps1 -Mode preview` to create white and black grid previews, `-Mode validate` to check grid size, padding, transparent RGB leaks, and target-row black backgrounds, `-Mode clean-black` to remove unintended pure-black row backgrounds, and `-Mode pack-chroma` to repack generated chroma-key sheets into equal cells.
- The sprite tool speeds up mechanical checks, but final acceptance still requires visual inspection of previews, especially for hair, shoes, propellers, dash trails, and thin effects.

## Dialogue Direction

Before every mid-boss battle and boss battle, show a conversation scene.

The conversation layout is:

- Protagonist standing portrait on the left
- Enemy standing portrait on the right
- Dialogue text area
- Speaker name display
- Conversation portraits should not be enclosed in visible frames.
- Conversation portraits should be displayed large enough to feel prominent; small screens may crop them slightly.
- Conversation portraits should visually meet the bottom edge of the 16:9 game area without a gap.

Standing portrait direction:

- 黒羽 凛 faces right in conversation art.
- Stage 1 mid-boss 朝比奈つばめ faces front and should feel relaxed, confident, and slightly taunting.
- Stage 1 boss 朝比奈つばめ faces left and should feel serious, focused, fully committed, and framed about as close as the mid-boss portrait.
- Conversation character portraits should use transparent backgrounds so they can be reused across different stage situations.

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
