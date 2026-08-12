"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getHobbyEvents, createEvent, rsvpToEvent, cancelRsvp, type HobbyEvent } from "@/api/api";

interface HobbyEventsProps {
  slug: string;
}

function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function HobbyEvents({ slug }: HobbyEventsProps) {
  const router = useRouter();
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-quick font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-full px-5 py-2"
        >
          {showForm ? "Cancel" : "Create Event"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full font-pop text-sm p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full font-pop text-sm p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500 resize-none"
          />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location or link (optional)"
            className="w-full font-pop text-sm p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full font-pop text-sm p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-pink-500"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full text-sm font-quick font-semibold text-white bg-black rounded-full px-5 py-2.5 disabled:opacity-60"
          >
            {isCreating ? "Creating..." : "Create Event"}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-t-2 border-pink-600 rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center bg-white rounded-xl shadow-md p-8">
          <p className="font-semibold text-lg">No upcoming events.</p>
          <p className="text-gray-600 mt-1">Be the first to organize one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-md p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bnt text-xl text-chblack">{event.title}</p>
                  <p className="font-pop text-sm text-pink-600 font-semibold mt-1">
                    {formatEventTime(event.startsAt)}
                  </p>
                  {event.location && <p className="font-pop text-sm text-chblack/60 mt-1">📍 {event.location}</p>}
                  {event.description && (
                    <p className="font-pop text-sm text-chblack/70 mt-2">{event.description}</p>
                  )}
                  <button
                    onClick={() => router.push(`/profile/${event.creator.username}`)}
                    className="font-pop text-xs text-chblack/40 mt-2 hover:underline"
                  >
                    Organized by {event.creator.name}
                  </button>
                </div>

                <button
                  onClick={() => handleToggleRsvp(event)}
                  disabled={rsvpLoadingId === event.id}
                  className={`text-sm font-quick font-semibold rounded-full px-4 py-2 shrink-0 disabled:opacity-60 ${
                    event.isAttending
                      ? "bg-gray-100 text-chblack hover:bg-gray-200"
                      : "bg-pink-600 text-white hover:bg-pink-700"
                  }`}
                >
                  {event.isAttending ? "Going" : "RSVP"}
                </button>
              </div>

              <p className="font-pop text-xs text-chblack/40 mt-3">
                {event.attendeeCount} {event.attendeeCount === 1 ? "person" : "people"} going
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HobbyEvents;
