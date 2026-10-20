import { getCurrentUser } from "@/lib/auth-helpers";
import { getScoreForPlayer } from "@/lib/scores";
import { downloadText } from "@/lib/sastorage";
import { contentTypeFor } from "@/lib/music/score-format";

type Ctx = { params: Promise<{ id: string }> };

/** The score file the player renders, served from our origin (no cross-origin fetch in the browser). */
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  const score = await getScoreForPlayer(id, user);
  if (!score) return new Response("Not found", { status: 404 });
  const text = await downloadText(score.fileKey).catch(() => null);
  if (text === null) return new Response("Unavailable", { status: 502 });
  return new Response(text, {
    headers: {
      "Content-Type": `${contentTypeFor(score.format)}; charset=utf-8`,
      "Cache-Control": score.status === "PUBLISHED" ? "public, max-age=300, s-maxage=86400" : "private, no-store",
    },
  });
}
