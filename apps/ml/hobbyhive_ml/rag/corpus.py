"""The knowledge base: posts and comments from the app database, cleaned and chunked."""

import os
import re
from dataclasses import dataclass
from pathlib import Path

from .text import content_terms

MAX_CHUNK_CHARS = 280  # short posts/comments stay whole — splitting "Singles are stable now." off its post loses meaning
MIN_POST_TERMS = 2
MIN_COMMENT_TERMS = 4  # "Keep it up!" / "Love this energy." are reactions, not knowledge

_SENTENCE_END = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class Chunk:
    id: str
    text: str
    kind: str  # "post" | "comment"
    post_id: str
    comment_id: str | None
    author_name: str
    author_username: str
    hive_slug: str
    hive_name: str
    created_at: str
    # For replies: the post being replied to. "Count the 8s out loud" only means something next to
    # "Anyone have tips for staying on beat?" — so it's indexed with that context (but shown without it).
    context: str | None = None
    # Posts that only ask something ("Anyone have tips…?") help find their replies but aren't answers themselves
    is_question: bool = False

    @property
    def retrieval_text(self) -> str:
        return f"{self.context} → {self.text}" if self.context else self.text


@dataclass
class CorpusStats:
    posts: int = 0
    comments: int = 0
    chunks: int = 0
    skipped_low_information: int = 0
    skipped_duplicates: int = 0


def split_long(text: str) -> list[str]:
    """Whole text if short; otherwise windows of up to two sentences."""
    if len(text) <= MAX_CHUNK_CHARS:
        return [text]
    sentences = [s for s in _SENTENCE_END.split(text) if s.strip()]
    return [" ".join(sentences[i : i + 2]) for i in range(0, len(sentences), 2)]


def is_question(text: str) -> bool:
    """A post that asks rather than tells: it ends with a question mark, or every sentence is a question."""
    sentences = [s for s in _SENTENCE_END.split(text.strip()) if s.strip()]
    return bool(sentences) and all(s.rstrip(" 🙏😅!").endswith("?") for s in sentences)


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        from dotenv import dotenv_values

        url = dotenv_values(Path(__file__).resolve().parents[3] / "backend" / ".env").get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL not set (env or apps/backend/.env)")
    return url.replace("&pgbouncer=true", "").replace("?pgbouncer=true", "")


def build_chunks(rows: list[tuple]) -> tuple[list[Chunk], CorpusStats]:
    """rows: (kind, post_id, comment_id, text, author_name, author_username, hive_slug, hive_name, created_at,
    parent_post_text), oldest first. parent_post_text is set for comments only."""
    stats = CorpusStats()
    seen: set[tuple[str, str]] = set()
    chunks: list[Chunk] = []
    for kind, post_id, comment_id, text, author_name, username, slug, hive_name, created_at, parent in rows:
        stats.posts += kind == "post"
        stats.comments += kind == "comment"
        for i, piece in enumerate(split_long(text.strip())):
            if len(content_terms(piece)) < (MIN_POST_TERMS if kind == "post" else MIN_COMMENT_TERMS):
                stats.skipped_low_information += 1
                continue
            key = (slug, " ".join(piece.lower().split()))
            if key in seen:
                stats.skipped_duplicates += 1
                continue
            seen.add(key)
            chunks.append(
                Chunk(
                    id=f"{comment_id or post_id}:{i}",
                    text=piece,
                    kind=kind,
                    post_id=post_id,
                    comment_id=comment_id,
                    author_name=author_name,
                    author_username=username,
                    hive_slug=slug,
                    hive_name=hive_name,
                    created_at=str(created_at),
                    context=parent if kind == "comment" else None,
                    is_question=kind == "post" and is_question(piece),
                )
            )
    stats.chunks = len(chunks)
    return chunks, stats


def load_chunks() -> tuple[list[Chunk], CorpusStats]:
    import psycopg

    with psycopg.connect(database_url(), connect_timeout=15) as conn:
        rows = conn.execute(
            """
            SELECT 'post', p.id, NULL, p.content, u.name, u.username, h.slug, h.name, p."createdAt", NULL
            FROM "Post" p JOIN "User" u ON u.id = p."authorId" JOIN "Hobby" h ON h.id = p."hobbyId"
            UNION ALL
            SELECT 'comment', p.id, c.id, c.content, u.name, u.username, h.slug, h.name, c."createdAt", p.content
            FROM "Comment" c JOIN "Post" p ON p.id = c."postId" JOIN "User" u ON u.id = c."userId"
            JOIN "Hobby" h ON h.id = p."hobbyId"
            ORDER BY 9
            """
        ).fetchall()
    return build_chunks(rows)
