# Changelog  
All notable changes to this project will be documented in this file.  
  
## [Unreleased]  
  
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