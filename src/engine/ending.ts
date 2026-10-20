import type { EndingBlock, GameContent } from "../content/types";
import { collectedClueIds } from "./logic";
import type { GameState } from "./state";

export function visibleEnding(state: GameState, content: GameContent): EndingBlock[] {
  const held = new Set(collectedClueIds(state, content));
  const heard = new Set(state.heard);
  return content.ending.filter((block) => {
    if (!block.clues.every((id) => held.has(id))) return false;
    if (!block.heard.every((id) => heard.has(id))) return false;
    if (
      block.hideIfHeard.length > 0 &&
      block.hideIfHeard.every((id) => heard.has(id))
    ) {
      return false;
    }
    return true;
  });
}
