import { Router } from "express";
import { rsvpToEvent, cancelRsvp, getEventAttendees } from "../controllers/event.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/:eventId/rsvp", rsvpToEvent);
router.delete("/:eventId/rsvp", cancelRsvp);
router.get("/:eventId/attendees", getEventAttendees);

export default router;
