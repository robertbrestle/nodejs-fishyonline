# Potential Future Changes
A running list of notes for any future changes. Nothing in this file is guaranteed to be added.

## Lobby
- a lobby experience
  - share a code with your friends to get into the same game
  - random match-making
- support for profanity filter
- update player list
  - show size as percentage
  - add table headers

## Map
- scale map to the size of the user's screen
  - maintain ratio
  - scale assets to match size
- removed fixed 900x700 screen
  - allow for scrolling user's view around the map

## Player
- adjust momentum based on size
  - larger = slower to stop
  - smaller = faster to stop
- players spawn at the top of the screen [added in 0.1.3]
  - "drop in"
  - clams and jelly polyps sink to the bottom
- if crab launches off the ground into the water, they lose control and slowly drift back down
- send configurations on `registration` event to set client globals

## Enemies
- new art for fish
  - updated jelly sprites [added in 0.1.2]
  - more colors?
- swarms of fish
  - a densely-packed cluster of fish
- only eat at mouth [added in 0.1.2]
  - enemy fish mouth is 1/3 length, starting on mouth-side
  - player mouth unaffected (for now)
  - update for players too [future]
- fish eat other fish
  - fix current implementation

&nbsp;