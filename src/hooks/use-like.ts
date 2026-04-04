"use client";

import { useState, useCallback } from "react";

export function useLike(songId: string, initialLiked = false, initialCount = 0) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    setLoading(true);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; likeCount: number };
        setLiked(data.liked);
        setCount(data.likeCount);
      } else {
        setLiked((prev) => !prev);
        setCount((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
      }
    } catch {
      setLiked((prev) => !prev);
      setCount((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
    } finally {
      setLoading(false);
    }
  }, [songId, liked]);

  return { liked, count, loading, toggle };
}
