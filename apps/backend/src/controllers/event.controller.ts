import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { prisma } from "../db/prisma.js";

const eventSelect = {
  id: true,
  title: true,
  description: true,
  location: true,
  startsAt: true,
  createdAt: true,
  creator: { select: { id: true, name: true, username: true, avatarUrl: true } },
  _count: { select: { rsvps: true } },
};

const toEventResponse = (
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    startsAt: Date;
    createdAt: Date;
    creator: { id: string; name: string; username: string; avatarUrl: string | null };
    _count: { rsvps: number };
  },
  isAttending: boolean
) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  startsAt: event.startsAt,
  createdAt: event.createdAt,
  creator: event.creator,
  attendeeCount: event._count.rsvps,
  isAttending,
});

// Upcoming events for a hobby's community page, soonest first
export const getHobbyEvents = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);

  const hobby = await prisma.hobby.findUnique({ where: { slug }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  const events = await prisma.event.findMany({
    where: { hobbyId: hobby.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    select: eventSelect,
  });

  const rsvps = events.length
    ? await prisma.eventRSVP.findMany({
        where: { userId: req.user!.id, eventId: { in: events.map((e) => e.id) } },
        select: { eventId: true },
      })
    : [];
  const attendingIds = new Set(rsvps.map((r) => r.eventId));

  res.status(200).json(new ApiResponse(200, events.map((e) => toEventResponse(e, attendingIds.has(e.id)))));
});

// Create an event under a hobby
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const { title, description, location, startsAt } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw new ApiError(400, "Event title is required");
  }

  const startsAtDate = new Date(startsAt);
  if (!startsAt || Number.isNaN(startsAtDate.getTime())) {
    throw new ApiError(400, "A valid start time is required");
  }

  if (startsAtDate.getTime() < Date.now()) {
    throw new ApiError(400, "Event start time must be in the future");
  }

  const hobby = await prisma.hobby.findUnique({ where: { slug }, select: { id: true } });
  if (!hobby) {
    throw new ApiError(404, "Hobby not found");
  }

  const event = await prisma.event.create({
    data: {
      hobbyId: hobby.id,
      creatorId: req.user!.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      location: typeof location === "string" ? location.trim() || null : null,
      startsAt: startsAtDate,
    },
    select: eventSelect,
  });

  res.status(201).json(new ApiResponse(201, toEventResponse(event, false), "Event created successfully"));
});

// RSVP to an event (idempotent)
export const rsvpToEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventId = String(req.params.eventId);

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId, userId: req.user!.id } },
    create: { eventId, userId: req.user!.id },
    update: {},
  });

  const attendeeCount = await prisma.eventRSVP.count({ where: { eventId } });

  res.status(200).json(new ApiResponse(200, { isAttending: true, attendeeCount }));
});

// Cancel an RSVP (idempotent)
export const cancelRsvp = asyncHandler(async (req: Request, res: Response) => {
  const eventId = String(req.params.eventId);

  await prisma.eventRSVP.deleteMany({ where: { eventId, userId: req.user!.id } });

  const attendeeCount = await prisma.eventRSVP.count({ where: { eventId } });

  res.status(200).json(new ApiResponse(200, { isAttending: false, attendeeCount }));
});

// Attendee list for an event
export const getEventAttendees = asyncHandler(async (req: Request, res: Response) => {
  const eventId = String(req.params.eventId);

  const attendees = await prisma.eventRSVP.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  res.status(200).json(new ApiResponse(200, attendees.map((a) => a.user)));
});
