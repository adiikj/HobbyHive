import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";
import { MENTOR_MIN_HELPFUL, mentorLevel } from "../utils/reputation.js";
import { getViewerState, postSelect, toPostResponse } from "./post.controller.js";

const MAX_NOTE = 200;
const HELPFUL_SCANNED = 150;
const POPULAR_SCANNED = 200;
const POPULAR_PER_SECTION = 2;
const MIN_LIKES_FOR_POPULAR = 2;

type SkillRef = { id: string; name: string; tier: number };

/** Moderators and members at Mentor level in the hive can add to its guide. */
export const canCurate = async (userId: string, hobbyId: string) => {
  const [moderator, helpful] = await Promise.all([
    prisma.userHobby.findFirst({ where: { userId, hobbyId, role: "MODERATOR" }, select: { id: true } }),
    prisma.feedback.count({ where: { authorId: userId, helpfulAt: { not: null }, post: { hobbyId } } }),
  ]);
  return Boolean(moderator) || helpful >= MENTOR_MIN_HELPFUL;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Which skill a piece of text is about: the longest skill name that appears in it as whole words
 * ("double pirouette" wins over "pirouette"). Plain and explainable; null if none match.
 */
export const matchSkill = <S extends { name: string }>(text: string, skills: S[]): S | null => {
  const lower = text.toLowerCase();
  for (const skill of [...skills].sort((a, b) => b.name.length - a.name.length)) {
    if (new RegExp(`\\b${escapeRegExp(skill.name.toLowerCase())}\\b`).test(lower)) return skill;
  }
  return null;
};

// A hive's living guide: sections by skill, each with posts curators added, feedback people found helpful,
// and the hive's most-liked posts on that skill
export const getGuide = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true, name: true, slug: true } });
  if (!hobby) throw new ApiError(404, "Hobby not found");

  const [skills, entries, helpful, popular, curator] = await Promise.all([
    prisma.skill.findMany({ where: { hobbyId: hobby.id }, orderBy: [{ tier: "asc" }, { position: "asc" }], select: { id: true, name: true, tier: true } }),
    prisma.guideEntry.findMany({
      where: { hobbyId: hobby.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        skillId: true,
        note: true,
        createdAt: true,
        addedBy: { select: { id: true, name: true, username: true } },
        post: { select: postSelect },
      },
    }),
    prisma.feedback.findMany({
      where: { helpfulAt: { not: null }, post: { hobbyId: hobby.id } },
      orderBy: { helpfulAt: "desc" },
      take: HELPFUL_SCANNED,
      select: {
        id: true,
        working: true,
        tryNext: true,
        at: true,
        helpfulAt: true,
        author: { select: { id: true, name: true, username: true, avatarUrl: true } },
        post: {
          select: {
            id: true,
            content: true,
            feedbackAsk: true,
            author: { select: { name: true, username: true } },
            practiceSession: { select: { skillId: true } },
          },
        },
      },
    }),
    prisma.post.findMany({
      where: { hobbyId: hobby.id, likes: { some: {} } },
      orderBy: { likes: { _count: "desc" } },
      take: POPULAR_SCANNED,
      select: { ...postSelect, practiceSession: { select: { skillId: true } } },
    }),
    canCurate(userId, hobby.id),
  ]);

  const skillById = new Map(skills.map((s) => [s.id, s]));
  const skillFor = (explicit: string | null | undefined, ...texts: (string | null | undefined)[]): SkillRef | null =>
    (explicit ? skillById.get(explicit) : null) ?? matchSkill(texts.filter(Boolean).join(" "), skills);

  // Reputation of everyone whose feedback appears, so the guide shows who's a mentor
  const giverIds = [...new Set(helpful.map((f) => f.author.id))];
  const giverHelpful = giverIds.length
    ? await prisma.feedback.groupBy({
        by: ["authorId"],
        where: { authorId: { in: giverIds }, helpfulAt: { not: null }, post: { hobbyId: hobby.id } },
        _count: { _all: true },
      })
    : [];
  const levels = new Map(giverHelpful.map((g) => [g.authorId, mentorLevel(g._count._all)]));

  const viewer = await getViewerState(userId, [...entries.map((e) => e.post), ...popular]);
  const curatedPostIds = new Set(entries.map((e) => e.post.id));

  type Section = { skill: SkillRef | null; curated: unknown[]; helpful: unknown[]; popular: unknown[] };
  const sections = new Map<string, Section>();
  const sectionFor = (skill: SkillRef | null) => {
    const key = skill?.id ?? "general";
    let section = sections.get(key);
    if (!section) {
      section = { skill, curated: [], helpful: [], popular: [] };
      sections.set(key, section);
    }
    return section;
  };

  for (const e of entries) {
    sectionFor(e.skillId ? (skillById.get(e.skillId) ?? null) : null).curated.push({
      id: e.id,
      note: e.note,
      createdAt: e.createdAt,
      addedBy: e.addedBy,
      canRemove: curator,
      post: toPostResponse(e.post, viewer),
    });
  }
  for (const f of helpful) {
    const skill = skillFor(f.post.practiceSession?.skillId, f.post.feedbackAsk, f.post.content);
    sectionFor(skill).helpful.push({
      id: f.id,
      working: f.working,
      tryNext: f.tryNext,
      at: f.at,
      helpfulAt: f.helpfulAt,
      author: f.author,
      mentorLevel: levels.get(f.author.id) ?? null,
      post: { id: f.post.id, ask: f.post.feedbackAsk, excerpt: f.post.content.slice(0, 140), author: f.post.author },
    });
  }
  for (const p of popular) {
    if (curatedPostIds.has(p.id) || p._count.likes < MIN_LIKES_FOR_POPULAR) continue;
    const skill = skillFor(p.practiceSession?.skillId, p.content, p.feedbackAsk);
    if (!skill) continue; // "popular" is per skill; general chatter stays in the feed
    const section = sectionFor(skill);
    if (section.popular.length < POPULAR_PER_SECTION) section.popular.push(toPostResponse(p, viewer));
  }

  // Skill-map order, then the general section last
  const ordered = [...skills.map((s) => sections.get(s.id)), sections.get("general")].filter((s): s is Section => Boolean(s));

  res.status(200).json(new ApiResponse(200, { hive: hobby, canCurate: curator, skills, sections: ordered }));
});

// Add a post to the hive's guide (moderators and mentors)
export const addGuideEntry = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const hobby = await prisma.hobby.findUnique({ where: { slug: String(req.params.slug) }, select: { id: true } });
  if (!hobby) throw new ApiError(404, "Hobby not found");
  if (!(await canCurate(userId, hobby.id))) {
    throw new ApiError(403, `Only moderators and members with ${MENTOR_MIN_HELPFUL}+ helpful answers here can add to the guide`);
  }

  const post = await prisma.post.findUnique({ where: { id: String(req.body.postId ?? "") }, select: { id: true, hobbyId: true } });
  if (!post || post.hobbyId !== hobby.id) throw new ApiError(400, "That post isn't in this hive");

  let skillId: string | null = null;
  if (req.body.skillId) {
    const skill = await prisma.skill.findFirst({ where: { id: String(req.body.skillId), hobbyId: hobby.id }, select: { id: true } });
    if (!skill) throw new ApiError(400, "That skill isn't part of this hive");
    skillId = skill.id;
  }
  const note = typeof req.body.note === "string" ? req.body.note.trim() : "";
  if (note.length > MAX_NOTE) throw new ApiError(400, `Keep the note under ${MAX_NOTE} characters`);

  const existing = await prisma.guideEntry.findUnique({ where: { hobbyId_postId: { hobbyId: hobby.id, postId: post.id } }, select: { id: true } });
  if (existing) throw new ApiError(409, "That post is already in the guide");

  const entry = await prisma.guideEntry.create({
    data: { hobbyId: hobby.id, postId: post.id, skillId, note: note || null, addedById: userId },
    select: { id: true, skillId: true, note: true, createdAt: true },
  });
  res.status(201).json(new ApiResponse(201, entry, "Added to the guide"));
});

// Take a post out of the guide (moderators and mentors of that hive)
export const removeGuideEntry = asyncHandler(async (req: Request, res: Response) => {
  const entry = await prisma.guideEntry.findUnique({ where: { id: String(req.params.entryId) }, select: { id: true, hobbyId: true } });
  if (!entry) throw new ApiError(404, "Guide entry not found");
  if (!(await canCurate(req.user!.id, entry.hobbyId))) throw new ApiError(403, "Only moderators and mentors can edit the guide");
  await prisma.guideEntry.delete({ where: { id: entry.id } });
  res.status(200).json(new ApiResponse(200, { id: entry.id }, "Removed from the guide"));
});
