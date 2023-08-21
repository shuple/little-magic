# Little Magic Stage Editor

Little Magic Stage Editor mimics the original SNES Little Magic Stage Editor with minor adjustments.\
The UI is written entirely in vanilla Javascript.

## Demo

https://little-magic.jp:44343

The demo contains all stages from SNES and GBC, including unused stages.

## Tool Usage

__Item:__\
Tap to open an item box. Tap the item from the item box and place it within the stage area.
Tap again on the item to change its direction. This only works for some items.
Items are assigned layers where some items can overlap, whereas others will overwrite the existing item.
Items such as rickety floor and warp gate are set with lower opacity so that the item underneath it is slightly visible.
Tap hold and release to remove the item from the stage area.

__Fill:__\
Tap hold and release to fill the stage area with the selected item.

__Block:__\
Tap to traverse different types of blocks. Tap hold and release to traverse the blocks in reverse order.
Available block types are forest, fire cave, ice palace, trial tower, dark area, and final tower.

__CG:__\
Tap to traverse different types of CGs. Tap hold and release to traverse the CGs in reverse order.
The feature replaces all existing blocks with a new sprite without reloading the stage to see the same stage with sprite changes.
Available CG types are SNES and GBC.

__Stage:__\
Tap to traverse stages. Tap hold and release to traverse the stages in reverse order.
Tap twice to discard changes on the current stage to continue traversing.

__New:__\
Tap hold and release to create a new stage.

__Save:__\
Tap hold and release to save the stage. The feature is disabled on the demo site.


## Change log
##### 0.1a (2022-02-01)
- Initial Alpha Release.
