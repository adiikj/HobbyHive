"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Plus, Users } from "lucide-react";
import { getHobbyEvents, createEvent, rsvpToEvent, cancelRsvp, type HobbyEvent } from "@/api/api";
import Skeleton from "@/components/ui/Skeleton";
import { Card, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/Page";
import { withAlpha } from "@/lib/hobbyTheme";

interface HobbyEventsProps {
  slug: string;
  /** The hobby's colour, for date tiles and RSVP buttons. */
  color: string;
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HobbyEvents({ slug, color }: HobbyEventsProps) {
  const [events, setEvents] = useState<HobbyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rsvpLoadingId, setRsvpLoadingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getHobbyEvents(slug)
      .then(setEvents)
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleToggleRsvp = async (event: HobbyEvent) => {
    setRsvpLoadingId(event.id);
    try {
      const result = event.isAttending ? await cancelRsvp(event.id) : await rsvpToEvent(event.id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, isAttending: result.isAttending, attendeeCount: result.attendeeCount } : e
        )
      );
    } catch {
      // leave state as-is; user can retry
    } finally {
      setRsvpLoadingId(null);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !startsAt) {
      setError("Title and start time are required.");
      return;
    }

    setError("");
    setIsCreating(true);
    try {
      const event = await createEvent(slug, {
        title,
        description: description || undefined,
        location: location || undefined,
        startsAt: new Date(startsAt).toISOString(),
      });
      setEvents((prev) => [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setTitle("");
      setDescription("");
      setLocation("");
      setStartsAt("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  const upcomingCount = events.filter((e) => new Date(e.startsAt).getTime() >= Date.now()).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-chblack/55">
          {isLoading ? "\u00a0" : upcomingCount === 0 ? "Nothing on the calendar yet." : `${upcomingCount} upcoming`}
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className={showForm ? secondaryButtonClass : primaryButtonClass}
        >
          {showForm ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Plan an event
            </>
          )}
        </button>
      </div>

      {showForm && (
        <Card className="space-y-3 p-5">
          <p className="font-bnt text-2xl leading-none text-chblack">NEW EVENT</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's happening?"
            aria-label="Event title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details (optional)"
            aria-label="Event details"
            rows={2}
            className={`${inputClass} resize-none`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location or link (optional)"
              aria-label="Location"
              className={inputClass}
            />
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              aria-label="Starts at"
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleCreate} disabled={isCreating} className={`${primaryButtonClass} w-full py-2.5`}>
            {isCreating ? "Creating…" : "Create event"}
          </button>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} as="div" className="flex gap-4 p-4">
              <Skeleton className="h-16 w-14 shrink-0 rounded-xl bg-line" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-1/2 rounded-full bg-line" />
                <Skeleton className="h-3 w-1/3 rounded-full bg-canvas" />
              </div>
            </Card>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-chblack/15 p-10 text-center">
          <CalendarDays size={28} className="mx-auto" style={{ color }} />
          <p className="mt-2 font-bnt text-3xl text-chblack">NO EVENTS YET</p>
          <p className="mt-1 text-sm text-chblack/55">Jam session, meetup, watch party: be the first to organise one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const date = new Date(event.startsAt);
            const isPast = date.getTime() < Date.now();
            return (
              <Card key={event.id} as="article" className={`flex gap-4 p-4 sm:p-5 ${isPast ? "opacity-60" : ""}`}>
                <div
                  className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl"
                  style={{ backgroundColor: withAlpha(color, 0.12), color }}
                >
                  <span className="text-[11px] font-quick font-bold uppercase leading-none">
                    {date.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="mt-0.5 font-bnt text-3xl leading-none">{date.getDate()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-chblack">{event.title}</h3>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-chblack/55">
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {formatEventTime(event.startsAt)}
                        </span>
                        {event.location && (
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin size={14} className="shrink-0" /> <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    {!isPast && (
                      <button
                        onClick={() => handleToggleRsvp(event)}
                        disabled={rsvpLoadingId === event.id}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-quick font-bold transition-colors disabled:opacity-50 ${
                          event.isAttending ? "border border-line text-chblack hover:bg-canvas" : "text-white hover:opacity-90"
                        }`}
                        style={event.isAttending ? undefined : { backgroundColor: color }}
                      >
                        {event.isAttending ? "Going ✓" : "RSVP"}
                      </button>
                    )}
                  </div>

                  {event.description && <p className="mt-2 text-sm leading-relaxed text-chblack/75">{event.description}</p>}

                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-chblack/45">
                    <Link href={`/profile/${event.creator.username}`} className="hover:underline">
                      Organised by <span className="font-semibold text-chblack/70">{event.creator.name}</span>
                    </Link>
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {event.attendeeCount} going
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HobbyEvents;
