export const DELIVERY_EARNING_MMK = 1800;
export const RIDER_SUMMARY_TIMEZONE = "Asia/Yangon";

export function riderSummaryMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: RIDER_SUMMARY_TIMEZONE, year: "numeric", month: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find(({ type }) => type === "year").value);
  const month = Number(parts.find(({ type }) => type === "month").value);
  // Myanmar calendar months use UTC+06:30 (no daylight saving).
  const offset = 390 * 60 * 1000;
  return {
    period: `${year}-${String(month).padStart(2, "0")}`,
    start: new Date(Date.UTC(year, month - 1, 1) - offset),
    end: new Date(Date.UTC(year, month, 1) - offset),
  };
}

export function deliveryTransitionUpdate(current, riderId, version, nextStatus, now) {
  const completion = nextStatus === "delivered";
  return {
    filter: {
      _id: current._id, assignedRiderId: riderId, version, status: current.status,
      ...(completion ? {
        deliveredAt: { $exists: false }, completedBy: { $exists: false }, earning: { $exists: false },
      } : {}),
    },
    update: {
      $set: {
        status: nextStatus, updatedBy: riderId,
        ...(completion ? {
          deliveredAt: now, completedBy: riderId,
          earning: { amount: DELIVERY_EARNING_MMK, currency: "MMK" },
        } : {}),
      },
      $inc: { version: 1 },
      $push: { events: { status: nextStatus, actorId: riderId, actorRole: "rider", at: now } },
    },
    // Mongoose normally strips immutable fields from updates. This guarded write
    // initializes them; subsequent writes cannot match the completion filter.
    options: { returnDocument: "after", runValidators: true, overwriteImmutable: completion },
  };
}

export function riderSummaryPipeline(riderId, { start, end }) {
  const dates = { $gte: start, $lt: end };
  return [
    { $match: { status: "delivered", $or: [
      { completedBy: riderId, deliveredAt: dates },
      { completedBy: { $exists: false }, events: { $elemMatch: {
        status: "delivered", actorRole: "rider", actorId: riderId, at: dates,
      } } },
    ] } },
    { $set: { legacyCompletion: { $arrayElemAt: [{ $filter: {
      input: { $ifNull: ["$events", []] }, as: "event",
      cond: { $and: [{ $eq: ["$$event.status", "delivered"] }, { $eq: ["$$event.actorRole", "rider"] }] },
    } }, 0] } } },
    { $set: {
      summaryRider: { $ifNull: ["$completedBy", "$legacyCompletion.actorId"] },
      summaryDate: { $ifNull: ["$deliveredAt", "$legacyCompletion.at"] },
      priced: { $and: [
        // Legacy events establish attribution, never a price.
        { $ne: [{ $ifNull: ["$completedBy", null] }, null] },
        { $ne: [{ $ifNull: ["$deliveredAt", null] }, null] },
        { $isNumber: "$earning.amount" }, { $gte: ["$earning.amount", 0] },
        { $eq: ["$earning.currency", "MMK"] },
      ] },
    } },
    { $match: { summaryRider: riderId, summaryDate: dates } },
    { $group: {
      _id: null,
      successfulDeliveries: { $sum: 1 },
      earnedAmount: { $sum: { $cond: ["$priced", "$earning.amount", 0] } },
      unpricedDeliveries: { $sum: { $cond: ["$priced", 0, 1] } },
    } },
    { $project: { _id: 0, successfulDeliveries: 1, earnedAmount: 1, unpricedDeliveries: 1 } },
  ];
}

// Dependencies are supplied by the route; keeping this handler separate lets
// tests exercise responses and aggregation without connecting to production.
export function createRiderSummaryHandler({ requireApprovedRider, Delivery, now = () => new Date() }) {
  const privateResponse = (response) => {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Authorization");
    return response;
  };
  return async function GET(req) {
    try {
      const auth = await requireApprovedRider(req);
      if (!auth.ok) return privateResponse(auth.response);
      const month = riderSummaryMonth(now());
      const [totals] = await Delivery.aggregate(riderSummaryPipeline(auth.user._id, month));
      return privateResponse(Response.json({ success: true, data: {
        period: month.period, timezone: RIDER_SUMMARY_TIMEZONE, currency: "MMK",
        successfulDeliveries: totals?.successfulDeliveries ?? 0,
        earnedAmount: totals?.earnedAmount ?? 0,
        unpricedDeliveries: totals?.unpricedDeliveries ?? 0,
      } }));
    } catch (error) {
      console.error("GET /api/rider/summary error:", { name: error?.name, code: error?.code });
      return privateResponse(Response.json({ success: false, error: {
        code: "SERVER_ERROR", message: "Unable to load rider summary.",
      } }, { status: 500 }));
    }
  };
}
