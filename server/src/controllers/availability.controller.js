import db from "../db.js";
import moment from "moment";
import { createAvailabilitySchema } from "../utils/utils.js";

// UPDATE RULE START_DATE/END_DATE TO MATCH REMAINING INSTANCES
const updateRuleDateRange = async (ruleId) => {
  if (!ruleId) return;

  const result = await db.query(
    `SELECT instance_date::text
    FROM availability_instances 
    WHERE rule_id = $1  AND exception_type IS DISTINCT FROM 'deleted'`,
    [ruleId.toString()]
  );

  const row = result.rows;
  const new_start_date = moment
    .min(row.map((d) => moment(d.instance_date)))
    .format("YYYY-MM-DD");
  const new_end_date = moment
    .max(row.map((d) => moment(d.instance_date)))
    .format("YYYY-MM-DD");

  // If no instances left → delete the rule entirely (optional but clean)
  if (!new_start_date || !new_end_date) {
    await db.query("DELETE FROM availability_rules WHERE id = $1", [ruleId]);
    await db.query("DELETE FROM availability_instances WHERE rule_id = $1", [
      ruleId,
    ]);
    return;
  }

  await db.query(
    `UPDATE availability_rules
     SET start_date = $1,
         end_date = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [new_start_date, new_end_date, ruleId]
  );
};

// GENERATE DATES BASED ON RRULE-LIKE PARAMS
const generateDates = (start, until, freq, interval = 1, byDay = null) => {
  const results = [];
  const startDate = moment(start).startOf("day");
  const endDate = until
    ? moment(until).endOf("day")
    : moment(start).add(2, "years");

  const weekdays = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

  // --- DAILY ---
  if (freq === "DAILY") {
    let current = startDate.clone();
    while (current.isSameOrBefore(endDate)) {
      results.push(current.format("YYYY-MM-DD"));
      current.add(interval, "days");
    }
    return results;
  }

  // --- WEEKLY (supports TU,FR or any list) ---
  if (freq === "WEEKLY") {
    const selectedDays = byDay || [];

    let base = startDate.clone();

    while (base.isSameOrBefore(endDate)) {
      selectedDays.forEach((day) => {
        const weekdayIndex = weekdays.indexOf(day);

        const date = base.clone().weekday(weekdayIndex);

        if (date.isSameOrAfter(startDate) && date.isSameOrBefore(endDate)) {
          results.push(date.format("YYYY-MM-DD"));
        }
      });

      base.add(interval, "weeks");
    }

    return [...new Set(results)].sort();
  }

  // --- MONTHLY ---
  if (freq === "MONTHLY") {
    let current = startDate.clone();

    while (current.isSameOrBefore(endDate)) {
      results.push(current.format("YYYY-MM-DD"));
      current.add(interval, "months");
    }

    return results;
  }

  return [];
};

// REGENERATE INSTANCES
const regenerateInstancesFromRule = async (ruleId, fromDate = null) => {
  try {
    // 1. Get the rule
    const ruleRes = await db.query(
      `SELECT r.*, 
              COALESCE(r.end_date, (r.start_date::date + INTERVAL '2 years')) AS effective_end
       FROM availability_rules r 
       WHERE r.id = $1`,
      [ruleId]
    );

    if (ruleRes.rows.length === 0) {
      throw new Error("Rule not found");
    }

    const rule = ruleRes.rows[0];

    const startGenerateFrom = fromDate
      ? moment(fromDate)
      : moment(rule.start_date);

    const until = rule.effective_end
      ? moment(rule.effective_end)
      : moment().add(2, "years");

    // 2. Generate all dates according to the rule
    const dates = generateDates(
      startGenerateFrom.format("YYYY-MM-DD"),
      until.format("YYYY-MM-DD"),
      rule.freq,
      rule.interval || 1,
      rule.by_day
    );

    if (dates.length === 0) {
      // Nothing to regenerate
      return;
    }

    // 3. Delete old generated (non-exception) instances from the start date onward
    await db.query(
      `DELETE FROM availability_instances 
       WHERE rule_id = $1 
         AND instance_date >= $2
         AND (is_exception = false OR exception_type IS DISTINCT FROM 'modified')`,
      [ruleId, startGenerateFrom.format("YYYY-MM-DD")]
    );

    // 4. Bulk insert new instances
    if (dates.length > 0) {
      const values = dates.map((date) => [
        ruleId,
        rule.user_id,
        date,
        rule.time_start,
        rule.time_end,
        rule.status,
        false, // is_exception
        null, // exception_type
        rule.description,
      ]);

      const placeholders = values
        .map(
          (_, i) =>
            `($${i * 9 + 1}, $${i * 9 + 2}, $${i * 9 + 3}::date, $${
              i * 9 + 4
            }::time, $${i * 9 + 5}::time, $${i * 9 + 6}, $${i * 9 + 7}, $${
              i * 9 + 8
            }, $${i * 9 + 9})`
        )
        .join(",");

      const flatValues = values.flat();

      await db.query(
        `INSERT INTO availability_instances 
         (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
         VALUES ${placeholders}
         ON CONFLICT (rule_id, instance_date) DO NOTHING`,
        flatValues
      );
    }

    console.log(`Regenerated ${dates.length} instances for rule ${ruleId}`);
  } catch (err) {
    console.error("regenerateInstancesFromRule error:", err);
    throw err; // let caller handle
  }
};

// CHECK AVAILABILITY CONFLICTS
const checkAvailabilityConflicts = async (userId, datesWithTime) => {
  if (datesWithTime.length === 0) return [];

  const dates = [...new Set(datesWithTime.map((d) => d.date))];

  const result = await db.query(
    `SELECT instance_date::text, time_start::text, time_end::text, status, description
     FROM availability_instances
     WHERE user_id = $1
       AND instance_date = ANY($2)
       AND (exception_type IS NULL OR exception_type != 'deleted')`,
    [userId, dates]
  );

  const existing = result.rows.reduce((acc, row) => {
    const date = row.instance_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push({
      start: row.time_start.slice(0, 8),
      end: row.time_end.slice(0, 8),
      status: row.status,
      description: row.description || "",
    });
    return acc;
  }, {});

  const toMinutes = (t) => {
    const [h, m, s = 0] = t.split(":").map(Number);
    return h * 60 + m + s / 60;
  };

  const conflicts = [];

  // for (const { date, timeStart, timeEnd } of datesWithTime) {
  //   if (!existing[date]) continue;

  //   for (const slot of existing[date]) {
  //     const eStart = slot.start;
  //     const eEnd = slot.end;

  //     // Overlap: not (newEnd <= existingStart OR newStart >= existingEnd)
  //     if (timeStart < eEnd && timeEnd > eStart) {
  //       conflicts.push({
  //         date,
  //         new: { start: timeStart, end: timeEnd },
  //         existing: {
  //           start: eStart,
  //           end: eEnd,
  //           status: slot.status,
  //           description: slot.description,
  //         },
  //       });
  //     }
  //   }
  // }

  for (const { date, timeStart, timeEnd } of datesWithTime) {
    if (!existing[date]) continue;

    const newStartMin = toMinutes(timeStart);
    const newEndMin = toMinutes(timeEnd);

    for (const slot of existing[date]) {
      const eStartMin = toMinutes(slot.start);
      const eEndMin = toMinutes(slot.end);

      // Overlap if intervals are not clearly separate
      if (newStartMin < eEndMin && newEndMin > eStartMin) {
        conflicts.push({
          date,
          new: { start: timeStart, end: timeEnd },
          existing: {
            start: slot.start,
            end: slot.end,
            status: slot.status,
            description: slot.description,
          },
        });
      }
    }
  }

  return conflicts;
};

// CREATE AVAILABILITY — WITH PARTIAL SUCCESS
export const createAvailability = async (req, res) => {
  try {
    const parsed = createAvailabilitySchema.parse(req.body);
    const {
      startDate,
      endDate,
      timeStart,
      timeEnd,
      status,
      description,
      recurrence,
      applyToRange,
    } = parsed;
    const userId = req.user.id;

    let candidateDates = [];

    if (recurrence) {
      const genStart = applyToRange?.start
        ? moment(applyToRange.start)
        : moment(startDate);
      const genUntil =
        applyToRange?.end ||
        recurrence.until ||
        moment(startDate).add(2, "years");

      candidateDates = generateDates(
        genStart.format("YYYY-MM-DD"),
        genUntil,
        recurrence.freq,
        recurrence.interval || 1,
        recurrence.byDay || null
      );
    } else {
      const start = moment(startDate);
      const end = endDate ? moment(endDate) : start;
      for (let d = start.clone(); d.isSameOrBefore(end); d.add(1, "day")) {
        candidateDates.push(d.format("YYYY-MM-DD"));
      }
    }

    if (candidateDates.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No dates to create" });
    }

    // Conflict detection
    const datesWithTime = candidateDates.map((date) => ({
      date,
      timeStart,
      timeEnd,
    }));
    const allConflicts = await checkAvailabilityConflicts(
      userId,
      datesWithTime
    );

    let datesToCreate = candidateDates;
    let skippedDates = [];
    let conflictDetails = "";

    if (allConflicts.length > 0) {
      const conflictedSet = new Set(allConflicts.map((c) => c.date));
      skippedDates = [...conflictedSet];
      datesToCreate = candidateDates.filter((d) => !conflictedSet.has(d));

      conflictDetails =
        allConflicts
          .slice(0, 10)
          .map(
            (c) =>
              `${c.date}: ${c.new.start.slice(0, 5)}–${c.new.end.slice(
                0,
                5
              )} overlaps`
          )
          .join(", ") + (allConflicts.length > 10 ? " and more..." : "");

      if (datesToCreate.length === 0) {
        return res.status(409).json({
          success: false,
          message: "All dates conflict with existing availability",
          details: conflictDetails,
        });
      }
    }

    let ruleId = null;

    const new_start_date = moment
      .min(datesToCreate.map((date) => moment(date)))
      .format("YYYY-MM-DD");
    const new_end_date = moment
      .max(datesToCreate.map((date) => moment(date)))
      .format("YYYY-MM-DD");

    if (datesToCreate.length > 0) {
      if (recurrence) {
        const ruleRes = await db.query(
          `INSERT INTO availability_rules 
           (user_id, start_date, end_date, time_start, time_end, status, description, freq, interval, by_day)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            userId,
            new_start_date,
            new_end_date || null,
            timeStart,
            timeEnd,
            status,
            description || null,
            recurrence.freq,
            recurrence.interval || 1,
            recurrence.byDay || null,
          ]
        );
        ruleId = ruleRes.rows[0].id;

        for (const date of datesToCreate) {
          // await db.query(
          //   `INSERT INTO availability_instances
          //    (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
          //    SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
          //    WHERE NOT EXISTS (
          //      SELECT 1 FROM availability_instances
          //      WHERE rule_id = $1 AND instance_date = $3
          //    )`,
          //   [
          //     ruleId,
          //     userId,
          //     date,
          //     timeStart,
          //     timeEnd,
          //     status,
          //     false,
          //     null,
          //     description,
          //   ]
          // );

          await db.query(
            `INSERT INTO availability_instances
            (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
            SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
            WHERE NOT EXISTS (
            SELECT 1 FROM availability_instances
            WHERE rule_id = $1 
            AND instance_date = $3
            AND (exception_type IS NULL OR exception_type != 'deleted')
            )`,
            [
              ruleId,
              userId,
              date,
              timeStart,
              timeEnd,
              status,
              false,
              null,
              description,
            ]
          );
        }
      } else {
        for (const date of datesToCreate) {
          // await db.query(
          //   `INSERT INTO availability_instances
          //    (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
          //    SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
          //    WHERE NOT EXISTS (
          //      SELECT 1 FROM availability_instances
          //      WHERE user_id = $2 AND instance_date = $3 AND time_start = $4 AND time_end = $5
          //    )`,
          //   [
          //     null,
          //     userId,
          //     date,
          //     timeStart,
          //     timeEnd,
          //     status,
          //     false,
          //     null,
          //     description || null,
          //   ]
          // );
          await db.query(
            `INSERT INTO availability_instances
            (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
             SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
             WHERE NOT EXISTS (
             SELECT 1 FROM availability_instances
             WHERE user_id = $2 
             AND instance_date = $3 
             AND time_start = $4 
             AND time_end = $5
             AND (exception_type IS NULL OR exception_type != 'deleted'))`,
            [
              null,
              userId,
              date,
              timeStart,
              timeEnd,
              status,
              false,
              null,
              description || null,
            ]
          );
        }
      }

      const io = req.app.get("io");
      if (io) io.emit("availability-updated", { userId });

      if (allConflicts.length > 0) {
        return res.status(201).json({
          success: true,
          message: `Created on ${datesToCreate.length} date(s). Skipped ${skippedDates.length} conflicting date(s).`,
          createdDates: datesToCreate,
          skippedDates,
          warning: "Partial creation due to conflicts",
          details: conflictDetails,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Availability created successfully",
        createdDates: datesToCreate,
        ruleId,
      });
    }
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: err.errors.map((e) => e.message).join(", "),
      });
    }
    console.error("createAvailability error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET AVAILABILITY
export const getAvailability = async (req, res) => {
  try {
    const { start, end, userId } = req.query;
    if (!start || !end)
      return res
        .status(400)
        .json({ success: false, message: "start/end required" });

    const startDate = moment(start).format("YYYY-MM-DD");
    const endDate = moment(end).format("YYYY-MM-DD");

    const targetUserIds =
      req.user.role === "ADMIN" && userId
        ? String(userId).split(",")
        : [req.user.id];

    const result = await db.query(
      `SELECT 
     i.id, 
     i.rule_id, 
     i.instance_date::text, 
     TO_CHAR(i.time_start, 'HH24:MI:SS') AS time_start,
     TO_CHAR(i.time_end,   'HH24:MI:SS') AS time_end,
     i.status, 
     i.description, 
     i.is_exception, 
     i.exception_type,
     u.name AS user_name, 
     u.id AS user_id
   FROM availability_instances i
   JOIN users u ON i.user_id = u.id
   WHERE i.user_id = ANY($1)
     AND i.instance_date BETWEEN $2 AND $3
     AND (i.exception_type IS NULL OR i.exception_type != 'deleted')
   ORDER BY i.instance_date, i.time_start`,
      [targetUserIds, startDate, endDate]
    );

    const ruleData = await db.query(
      `SELECT 
      i.id ,
      i.user_id ,
      i.start_date,
      i.end_date ,
      i.time_start,
      i.time_end,
      i.freq,
      i.interval,
      i.by_day,
      u.name AS user_name,
      u.id AS user_id 
      FROM availability_rules i
      JOIN users u ON i.user_id=u.id
      WHERE i.user_id = ANY($1)
      `,
      [targetUserIds]
    );

    const events = result.rows.map((r) => {
      // const startISO = `${r.instance_date}T${r.time_start
      //   .toString()
      //   .slice(0, 8)}`;
      // const endISO = `${r.instance_date}T${r.time_end.toString().slice(0, 8)}`;

      const startISO = `${r.instance_date}T${r.time_start}`;
      const endISO = `${r.instance_date}T${r.time_end}`;
      const recurrence = ruleData?.rows?.find(
        (data) => data?.id === r.rule_id && data?.user_id === r.user_id
      );

      return {
        id: r.id,
        title: r.status,
        start: startISO,
        end: endISO,
        ...(r.rule_id &&
          recurrence && {
            recurrence: {
              byDay: recurrence?.by_day,
              freq: recurrence?.freq,
              start_date: moment(recurrence?.start_date).format("YYYY-MM-DD"),
              end_date: moment(recurrence?.end_date).format("YYYY-MM-DD"),
              until: moment(recurrence?.end_date).format("YYYY-MM-DD"),
              interval: recurrence?.interval,
              time_start: recurrence?.time_start,
              time_end: recurrence?.time_end,
            },
          }),
        backgroundColor:
          r.status === "AVAILABLE"
            ? "#34D399"
            : r.status === "BUSY"
            ? "#F87171"
            : "#FBBF24",
        borderColor:
          r.status === "AVAILABLE"
            ? "#10B981"
            : r.status === "BUSY"
            ? "#EF4444"
            : "#F59E0B",
        extendedProps: {
          description: r.description || "",
          instanceId: r.id,
          ruleId: r.rule_id || null,
          isRecurring: !!r.rule_id,
          userId: r.user_id,
          userName: r.user_name,
          isException: r.is_exception,
        },
      };
    });

    res.json({ success: true, data: events });
  } catch (err) {
    console.error("getAvailability error:", err);
    res.status(500).json({ success: false });
  }
};

// UPDATE AVAILABILITY — FULLY FLEXIBLE
export const updateAvailability = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const {
      timeStart,
      timeEnd,
      status,
      description,
      recurrence,
      applyFromDate,
      applyToRange,
    } = req.body;
    const isAll = req.path.endsWith("/all"); // true if URL ends with /all
    const editScope = isAll ? "all" : "single";

    if (!timeStart || !timeEnd || !status) {
      return res.status(400).json({
        success: false,
        message: "timeStart, timeEnd, status required",
      });
    }

    const instRes = await db.query(
      `SELECT i.*, r.freq, r.interval, r.by_day, r.start_date AS rule_start
       FROM availability_instances i
       LEFT JOIN availability_rules r ON i.rule_id = r.id
       WHERE i.id = $1`,
      [instanceId]
    );

    // const instRes1 = await db.query(
    //   `SELECT i.*, i.user_id, i.rule_id, i.instance_date FROM availability_instances i WHERE i.id = $1`,
    //   [instanceId]
    // );

    if (!instRes.rows[0])
      return res.status(404).json({ success: false, message: "Not found" });
    const inst = instRes.rows[0];

    if (inst.user_id !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const instanceDate = inst.instance_date;

    if (editScope === "all" && inst.rule_id && !recurrence) {
      let query = `
        UPDATE availability_rules
        SET time_start = $1, time_end = $2, status = $3, description = $4, updated_at = NOW()
        WHERE id = $5
      `;
      let params = [
        timeStart,
        timeEnd,
        status,
        description || null,
        inst.rule_id,
      ];

      // If user changed recurrence pattern
      if (recurrence?.freq) {
        query = `
          UPDATE availability_rules
          SET time_start = $1, time_end = $2, status = $3, description = $4,
              freq = $6, interval = $7, by_day = $8, end_date = $9,
              updated_at = NOW()
          WHERE id = $5
        `;
        params = [
          timeStart,
          timeEnd,
          status,
          description || null,
          inst.rule_id,
          recurrence.freq,
          recurrence.interval || 1,
          recurrence.byDay || null,
          recurrence.until || null,
        ];

        // Rebuild all future instances with new pattern
        await regenerateInstancesFromRule(
          inst.rule_id,
          applyFromDate || instanceDate
        );
      }

      // Update rule
      await db.query(query, params);

      // Update all non-modified instances
      await db.query(
        `UPDATE availability_instances
         SET time_start = $1, time_end = $2, status = $3, description = $4, updated_at = NOW()
         WHERE rule_id = $5 AND (exception_type IS NULL OR exception_type != 'modified')`,
        [timeStart, timeEnd, status, description || null, inst.rule_id]
      );
    }

    // CASE 1: Convert to recurring OR update recurring rule
    else if (recurrence && recurrence.freq) {
      let ruleId = inst.rule_id;

      if (!ruleId) {
        // Convert single → recurring
        const ruleRes = await db.query(
          `INSERT INTO availability_rules
           (user_id, start_date, end_date, time_start, time_end, status, description, freq, interval, by_day)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            inst.user_id,
            instanceDate,
            recurrence.until || null,
            timeStart,
            timeEnd,
            status,
            description || null,
            recurrence.freq,
            recurrence.interval || 1,
            recurrence.byDay || null,
          ]
        );
        ruleId = ruleRes.rows[0].id;

        // Update current instance
        await db.query(
          `UPDATE availability_instances SET rule_id = $1, is_exception = false, exception_type = NULL WHERE id = $2`,
          [ruleId, instanceId]
        );
      } else {
        // Update existing rule
        await db.query(
          `UPDATE availability_rules SET time_start=$1, time_end=$2, status=$3, description=$4, freq=$5, interval=$6, by_day=$7, end_date=$8 WHERE id=$9`,
          [
            timeStart,
            timeEnd,
            status,
            description || null,
            recurrence.freq,
            recurrence.interval || 1,
            recurrence.byDay || null,
            recurrence.until || null,
            ruleId,
          ]
        );
      }

      // Regenerate instances from applyFromDate or rule start
      const fromDate = applyFromDate
        ? moment(applyFromDate)
        : moment(inst.rule_start || instanceDate);
      const until = recurrence.until || moment().add(2, "years");

      const dates = generateDates(
        fromDate.format("YYYY-MM-DD"),
        until,
        recurrence.freq,
        recurrence.interval || 1,
        recurrence.byDay
      );

      if (dates.length > 0) {
        const values = dates.map((d) => [
          ruleId,
          inst.user_id,
          d,
          timeStart,
          timeEnd,
          status,
          false,
          null,
          description,
        ]);

        const placeholders = values
          .map(
            (_, i) =>
              `($${i * 9 + 1}::uuid, $${i * 9 + 2}::uuid, $${
                i * 9 + 3
              }::date, $${i * 9 + 4}::time, $${i * 9 + 5}::time, $${
                i * 9 + 6
              }, $${i * 9 + 7}, $${i * 9 + 8}, $${i * 9 + 9})`
          )
          .join(",");

        await db.query(
          `DELETE FROM availability_instances WHERE rule_id = $1 AND instance_date >= $2 AND (is_exception = false OR exception_type != 'modified')`,
          [ruleId, fromDate.format("YYYY-MM-DD")]
        );
        await db.query(
          `INSERT INTO availability_instances (rule_id, user_id, instance_date, time_start, time_end, status, is_exception, exception_type, description)
           VALUES ${placeholders} ON CONFLICT (rule_id, instance_date) DO UPDATE SET
           time_start=EXCLUDED.time_start, time_end=EXCLUDED.time_end, status=EXCLUDED.status, description=EXCLUDED.description`,
          values.flat()
        );
      }
    }

    // CASE 2: Edit range (e.g., Nov 10–17 only)
    else if (applyToRange && inst.rule_id) {
      const rangeStart = moment(applyToRange.start).format("YYYY-MM-DD");
      const rangeEnd = applyToRange.end
        ? moment(applyToRange.end).format("YYYY-MM-DD")
        : rangeStart;

      await db.query(
        `UPDATE availability_instances
         SET rule_id=null, time_start=$1, time_end=$2, status=$3, description=$4, is_exception=false, exception_type=null
         WHERE rule_id=$5 AND instance_date BETWEEN $6 AND $7`,
        [
          timeStart,
          timeEnd,
          status,
          description || null,
          inst.rule_id,
          rangeStart,
          rangeEnd,
        ]
      );
    }
    // CASE 3: This and future
    else if (applyFromDate && inst.rule_id) {
      await db.query(
        `UPDATE availability_instances
         SET rule_id=null,time_start=$1, time_end=$2, status=$3, description=$4, is_exception=false, exception_type=null
         WHERE rule_id=$5 AND instance_date >= $6`,
        [
          timeStart,
          timeEnd,
          status,
          description || null,
          inst.rule_id,
          instanceDate,
        ]
      );
    }

    // CASE 4: Single instance only
    else {
      await db.query(
        `UPDATE availability_instances
           SET rule_id=null,time_start=$1, time_end=$2, status=$3, description=$4, is_exception=false, exception_type=null
           WHERE id=$5`,
        [timeStart, timeEnd, status, description || null, instanceId]
      );
    }

    await updateRuleDateRange(inst.rule_id);

    const io = req.app.get("io");
    if (io) io.emit("availability-updated", { userId: inst.user_id });

    res.json({ success: true });
  } catch (err) {
    console.error("updateAvailability error:", err);
    res.status(500).json({ success: false });
  }
};

// DELETE AVAILABILITY
export const deleteAvailability = async (req, res) => {
  try {
    const { instanceId } = req.params;
    const { applyFromDate, applyToRange } = req.body;

    const instRes = await db.query(
      `SELECT i.*, r.id AS rule_id FROM availability_instances i
       LEFT JOIN availability_rules r ON i.rule_id = r.id WHERE i.id = $1`,
      [instanceId]
    );

    if (!instRes.rows[0]) return res.status(404).json({ success: false });
    const inst = instRes.rows[0];

    if (inst.user_id !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false });
    }

    const instanceDate = inst.instance_date;

    // Delete range
    if (applyToRange && inst.rule_id) {
      const start = applyToRange.start;
      const end = applyToRange.end || start;
      await db.query(
        `UPDATE availability_instances SET exception_type='deleted', status='BUSY'
         WHERE rule_id=$1 AND instance_date BETWEEN $2 AND $3`,
        [inst.rule_id, start, end]
      );
      await updateRuleDateRange(inst.rule_id);
    }
    // Delete this and future
    else if (applyFromDate && inst.rule_id) {
      await db.query(
        `UPDATE availability_instances SET exception_type='deleted', status='BUSY'
         WHERE rule_id=$1 AND instance_date >= $2`,
        [inst.rule_id, instanceDate]
      );
      await updateRuleDateRange(inst.rule_id);
    }
    // Delete all in series
    else if (req.path.includes("/all") && inst.rule_id) {
      await db.query("DELETE FROM availability_rules WHERE id = $1", [
        inst.rule_id,
      ]);
      await db.query("DELETE FROM availability_instances WHERE rule_id = $1", [
        inst.rule_id,
      ]);
    }
    // Single delete
    else {
      await db.query(
        `UPDATE availability_instances SET exception_type='deleted', status='BUSY' WHERE id=$1`,
        [instanceId]
      );
      if (inst.rule_id) {
        await updateRuleDateRange(inst.rule_id); // ← Also add here!
      }
    }

    const io = req.app.get("io");
    if (io) io.emit("availability-updated", { userId: inst.user_id });

    res.json({ success: true });
  } catch (err) {
    console.error("deleteAvailability error:", err);
    res.status(500).json({ success: false });
  }
};
