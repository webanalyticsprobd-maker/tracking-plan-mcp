import { z } from "zod";
import { TrackingPlanService } from "../services/trackingPlanService.js";
import { TrackingEventSchema, BusinessTypeSchema, TrackingPlanError } from "../models/tracking.js";

export const createTrackingPlanToolSchema = {
  id: z.string().describe("Unique tracking plan ID (e.g. 'ecommerce-ga4', 'leadgen-hvac')"),
  name: z.string().describe("Human readable tracking plan name"),
  description: z.string().optional().describe("Description of the tracking plan purpose"),
  business_type: BusinessTypeSchema.describe("Target business type: 'ecommerce' or 'lead_generation'"),
  platform: z.string().describe("Target platform (e.g. 'GA4', 'Mixpanel', 'GTM')"),
  events: z.array(TrackingEventSchema).describe("List of tracking events with parameters"),
};

export async function handleCreateTrackingPlan(
  service: TrackingPlanService,
  input: any
) {
  try {
    const plan = await service.createTrackingPlan(input);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              message: `Tracking plan '${plan.id}' created successfully for ${plan.business_type} business.`,
              plan,
            },
            null,
            2
          ),
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
              success: false,
              error: {
                code,
                message: error.message || "Failed to create tracking plan.",
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
