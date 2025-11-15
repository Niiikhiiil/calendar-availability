import db from "../db.js";
import { availabilitySchema, responseMessage } from "../utils/utils.js";
import moment from "moment";
import rrule from "rrule";
const { rrulestr } = rrule;

export const createAvailability = async (req, res) => {
  try {
    const parsed = availabilitySchema.parse(req.body);
    const { start, end, status, recurringRule, description } = parsed;

    // For the overlapping event check
    // const overlapCheck = await db.query(
    //   `SELECT * FROM availability
    //    WHERE user_id = $1
    //    AND DATE(start_time) = DATE($2)
    //    AND (
    //   (start_time, end_time) OVERLAPS ($2::timestamp, $3::timestamp))`,
    //   [req.user.id, start, end]
    // );

    // if (overlapCheck.rows.length > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "You already have availability for this time range.",
    //   });
    // }

    // Add new availability event
    const result = await db.query(
      `INSERT INTO availability (user_id, start_time, end_time, status, recurring_rule, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, start, end, status, recurringRule || null, description]
    );

    // For realtime checking and emmiting
    const io = req.app.get("io");
    if (io) io.emit("availability-updated", { userId: req.user.id });

    res.status(201).json({
      success: true,
      message: responseMessage.availabilityCreatedSuccess,
      data: result.rows[0],
    });
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorCreatingAvailability,
    });
  }
};

export const getAvailability = async (req, res) => {
  try {
    const { userId, start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: responseMessage.startTimeandEndTimeRequired,
      });
    }

    // Ensure full day coverage for the range
    const rangeStart = moment(start).startOf("day").toDate();
    const rangeEnd = moment(end).endOf("day").toDate();

    let users = [];
    if (userId) {
      users = Array.isArray(userId) ? userId : String(userId).split(",");
    } else {
      users = [req.user.id];
    }

    // Query both normal and recurring events
    const getEventQuery = `
      SELECT * 
      FROM availability 
      WHERE user_id = ANY($3::uuid[])
        AND (
          (start_time <= $2 AND end_time >= $1)
          OR recurring_rule IS NOT NULL
        )
    `;

    const result = await db.query(getEventQuery, [rangeStart, rangeEnd, users]);
    const rows = result.rows;

    const events = [];

    for (const r of rows) {
      const durationMs =
        new Date(r.end_time).getTime() - new Date(r.start_time).getTime();

      if (r.recurring_rule) {
        try {
          const options = rrulestr(r.recurring_rule, {
            forceset: true,
            dtstart: new Date(r.start_time),
          });

          const occs = options.between(rangeStart, rangeEnd, true);

          for (const occ of occs) {
            const occEnd = new Date(occ.getTime() + durationMs);

            events.push({
              id: `${r.id}::${occ.toISOString()}`,
              availabilityId: r.id,
              userId: r.user_id,
              start: occ.toISOString(),
              end: occEnd.toISOString(),
              status: r.status,
              recurring: true,
              recurringRule: r.recurring_rule,
              originalStart: r.start_time,
              originalEnd: r.end_time,
              description: r.description,
            });
          }
        } catch (err) {
          console.error("Failed to expand RRULE for availability", r.id, err);
        }
      } else {
        // Normal event
        events.push({
          id: r.id,
          availabilityId: r.id,
          userId: r.user_id,
          start: r.start_time,
          end: r.end_time,
          status: r.status,
          recurring: false,
          recurringRule: null,
          description: r.description,
        });
      }
    }

    // Add color mapping
    const mapped = events.map((e) => {
      let backgroundColor = "";
      let borderColor = "";

      if (e.status === "AVAILABLE") {
        backgroundColor = "#34D399";
        borderColor = "#10B981";
      } else if (e.status === "BUSY") {
        backgroundColor = "#F87171";
        borderColor = "#EF4444";
      } else {
        backgroundColor = "#FBBF24";
        borderColor = "#F59E0B";
      }

      return {
        id: e.id,
        status: e.status,
        start: e.start,
        end: e.end,
        description: e.description,
        backgroundColor,
        borderColor,
        recurringRule: e.recurringRule,
        extendedProps: {
          availabilityId: e.availabilityId,
          userId: e.userId,
          status: e.status,
          recurring: e.recurring,
        },
      };
    });

    res.json({
      success: true,
      message: responseMessage.availabilityFetchedSuccess,
      data: mapped,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorFetchingAvailability,
    });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    // Getting id from simple and recurring events
    let id = req.params.id;
    if (id.includes("::")) {
      id = id.split("::")[0];
    }

    const parsed = availabilitySchema.parse(req.body);
    const { start, end, status, recurringRule, description } = parsed;

    // Checking current user has own these events or not
    const ownerCheck = await db.query(
      "SELECT user_id FROM availability WHERE id = $1",
      [id]
    );
    if (ownerCheck.rows.length === 0)
      return res.status(404).json({ success: false, message: "Not found" });
    if (ownerCheck.rows[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: "Forbidden" });

    // Updating the event
    const result = await db.query(
      `UPDATE availability
       SET start_time = $1,
           end_time = $2,
           status = $3,
           recurring_rule = $4,
           description = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [start, end, status, recurringRule || null, description, id]
    );

    // For realtime checking and emmiting
    const io = req.app.get("io");
    if (io) io.emit("availability-updated", { userId: req.user.id });

    res.json({
      success: true,
      message: responseMessage.availabilityUpdatedSuccess,
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorUpdatingAvailability,
    });
  }
};

export const deleteAvailability = async (req, res) => {
  try {
    let { id } = req.params;

    // Checking id for simple/recurring event
    if (id.includes("::")) {
      id = id.split("::")[0];
    }

    const ownerCheck = await db.query(
      "SELECT user_id FROM availability WHERE id = $1",
      [id]
    );

    if (ownerCheck.rows.length === 0)
      return res.status(404).json({
        success: false,
        message: responseMessage.availabilityNotFound,
      });

    if (ownerCheck.rows[0].user_id !== req.user.id)
      return res.status(403).json({
        success: false,
        message: responseMessage.availabilityNotAuthorized,
      });

    await db.query("DELETE FROM availability WHERE id = $1", [id]);

    const io = req.app.get("io");
    if (io) io.emit("availability-updated", { userId: req.user.id });

    res.json({
      success: true,
      message: responseMessage.availabilityDeletedSuccess,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: responseMessage.serverErrorDeletingAvailability,
    });
  }
};
