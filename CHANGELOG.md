# Changelog  
All notable changes to this project will be documented in this file.  
  
## [Unreleased]  

## [0.1.3] - 2022-09-26
### Changed  
- refactored flakes to match enemies operations  
- players now spawn at the top of their `spawnTop`  
  - the top 90px of the screen is now a safe zone  
- set max enemies to 35  
- updated socket.io to version 4.5.2  

### Fixed  
- server spamming `playerScore` events when player intersects larger enemy  
- send score with `playerDeath` event  
- if multiple people disconnect, `removePlayer()` could remove all enemies from the game (again)  

## [0.1.2] - 2022-08-13  
### Added  
- ping display  
- creatures of the same color cannot consume each other  
- new sprites for jellyfish  
- new sprites for blue and red fish  
- spacebar tracking in `wasd`  
- new `playerDeath` event  
  - resets player velocity and jellyfish back to polyps  
- new epic fish names  

### Changed  
- moved supporting server files to `src/`  
- separated ticks to manage:  
  - networking  
  - collision  
  - rendering  
  - second (animation/ping/etc)  
- refactored networking for flakes and enemies  
  - client will render them based position and speed  
  - server will only send on relevant update events  
  - from +30 calls/second to 1-4 calls/second for each  
- jellyfish movement is now more fluid, with no automatic velocity degradation  

### Fixed  
- having a name length of `playerVars.maxNameLength` causes the game not to start  
- if multiple people disconnect, `removePlayer()` could remove all enemies from the game  

## [0.1.1] - 2022-08-01  
### Added  
- CHANGELOG.md  
- FUTURE.md  
  - list of ideas for the future of this game  

### Changed  
- updated express to version 4.18.1  
- updated socket.io to version 4.5.1  
- reduced emitting `enemies` from every tick to every (`tickRate * enemyTickMax`) tick (currently every 10th tick)  
  - reduces socket chatter  
  - client now increments enemy speed to accurately reflect position  
- synchronized tick time for server and client  
- renamed `disconnect` event to `pdisconnect` to avoid socket.io event override error  
- updated `gameloop` player iteration to use new `io.fetchSockets()` promise  
- replaced deprecated 'e.code' with `e.keyCode` for more consistent keybindings  

### Fixed  
- increased fish spawn distance offset with `stageVars.spawnWidthOffset`  
  - reduces jarring spawn of faster fish  

## [0.1.0] - 2020-09  
### Added  
- intial commit of the game  

&nbsp;