// Bible Jeopardy's board (design 9.3, 9.10): a played tile ignores a click, except while "Replay a tile" is on.
import { fireEvent, render, screen } from "@testing-library/react";
import { handBoard } from "./bank.test.fixture";
import { Board } from "./Board";

const played = [[true, false, false, false, false], [false, false, false, false, false], [false, false, false, false, false]];
const clickPlayed = (replaying: boolean) => {
  const onOpen = vi.fn();
  const board = handBoard();
  render(<Board board={board} played={played} focus={{ col: 1, row: 0 }} onFocus={() => {}} onOpen={onOpen} replaying={replaying} />);
  fireEvent.click(screen.getByRole("button", { name: `${board.columns[0].title}, 100, played` }));
  return onOpen;
};

describe("Board", () => {
  it("ignores a click on a played tile in normal play", () => {
    expect(clickPlayed(false)).not.toHaveBeenCalled();
  });

  it("reopens a played tile by click while Replay a tile is on", () => {
    expect(clickPlayed(true)).toHaveBeenCalledWith({ col: 0, row: 0 });
  });
});
