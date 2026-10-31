import { requireApprovedRider } from "../../../lib/riderAuth.js";
import { createRiderSummaryHandler } from "../../../lib/riderEarnings.js";
import Delivery from "../../../models/Delivery.js";

export const dynamic = "force-dynamic";
export const GET = createRiderSummaryHandler({ requireApprovedRider, Delivery });
