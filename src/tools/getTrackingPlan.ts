import { z } from "zod";
import { TrackingPlanService } from "../services/trackingPlanService.js";
import { TrackingPlanError } from "../models/tracking.js";

export const getTrackingPlanToolSchema = {
  plan_id: z.string().describe("ID of the tracking plan to retrieve (e.g. 'ecommerce-ga4')"),
};

export async function handleGetTrackingPlan(
  service: TrackingPlanService,
  input: { plan_id: string }
) {
  try {
    const plan = await service.getTrackingPlan(input.plan_id);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(plan, null, 2),
        },
      ],
    };
  } catch (error: any) {
    const code = error instanceof TrackingPlanError ? error.code : "INTERNAL_ERROR";
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              error: {
                code,
                message: error.message || "Failed to retrieve tracking plan.",
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
