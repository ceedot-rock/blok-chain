import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGameStore } from "@/lib/game/store";
import { formatNumber } from "@/lib/utils";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

function formatChatTime(at: number): string {
  // Fixed UTC clock so SSR/client match for seed messages
  try {
    return new Date(at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}

export function ChatPanel() {
  const chat = useGameStore((s) => s.chat);
  const staked = useGameStore((s) => s.staked);
  const postChat = useGameStore((s) => s.postChat);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  const send = () => {
    const res = postChat(text);
    if (!res.ok) toast.error(res.error);
    else setText("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" />
          Validator Chat
        </CardTitle>
        <CardDescription>
          Comments from stakers securing the bLOK CHaiN community pool.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {staked <= 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-warn)]/25 bg-[var(--color-warn)]/10 px-3 py-3 text-sm text-[var(--color-warn)]">
            Stake $bLOkz to unlock posting. You can still read the room.
          </div>
        )}

        <div className="max-h-[22rem] space-y-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
          {chat.map((m) => (
            <div
              key={m.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{m.author}</span>
                <Badge variant="muted">{formatNumber(m.staked)} staked</Badge>
                <span className="text-[11px] text-[var(--color-subtle)]" suppressHydrationWarning>
                  {formatChatTime(m.at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-muted)]">{m.text}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              staked > 0 ? "Leave a comment for the chain…" : "Stake to comment…"
            }
            disabled={staked <= 0}
            maxLength={240}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <Button onClick={send} disabled={staked <= 0 || !text.trim()} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
