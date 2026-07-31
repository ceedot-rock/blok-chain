import { useEffect, useMemo, useState } from "react";
import { BlockTile } from "./BlockTile";
import { isLinked } from "@/lib/game/engine";
import { E, N, S, W, type BoardState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface GameBoardProps {
  board: BoardState;
  onRotate: (index: number) => void;
  disabled?: boolean;
  solved?: boolean;
}

export function GameBoard({ board, onRotate, disabled, solved }: GameBoardProps) {
  const [tilePx, setTilePx] = useState(64);

  useEffect(() => {
    const measure = () => {
      const vw = Math.min(window.innerWidth - 32, 560);
      const gap = 6;
      const px = Math.floor((vw - gap * (board.size - 1)) / board.size);
      setTilePx(Math.max(44, Math.min(78, px)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [board.size]);

  const links = useMemo(() => {
    return board.cells.map((_, i) => ({
      n: isLinked(board, i, N),
      e: isLinked(board, i, E),
      s: isLinked(board, i, S),
      w: isLinked(board, i, W),
    }));
  }, [board]);

  return (
    <div
      className={cn(
        "mx-auto grid w-fit gap-1.5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:p-4",
        solved && "ring-1 ring-[var(--color-primary)]/50",
      )}
      style={{
        gridTemplateColumns: `repeat(${board.size}, ${tilePx}px)`,
      }}
    >
      {board.cells.map((cell, i) => (
        <BlockTile
          key={i}
          cell={cell}
          linked={links[i]!}
          onRotate={() => onRotate(i)}
          disabled={disabled}
          highlight={solved}
          sizePx={tilePx}
        />
      ))}
    </div>
  );
}
