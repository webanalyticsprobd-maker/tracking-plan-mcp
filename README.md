# Tracking Plan MCP Server

> Beginner-friendly Model Context Protocol (MCP) server built with **TypeScript + Node.js** to create, list, inspect, and validate tracking plans for **Ecommerce** and **Lead-Generation / Service Businesses**.

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Vitest](https://img.shields.io/badge/Tests-22%20Passed-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![MCP SDK](https://img.shields.io/badge/MCP-v1.5.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📌 Project Overview

The **Tracking Plan MCP Server** allows AI assistants (such as Cursor, Claude Desktop, and Antigravity) to manage analytics tracking specifications locally.

It supports two distinct business models out-of-the-box:
1. **Ecommerce Businesses**: Product views, cart activity, checkout steps, payment info, revenue, and purchase transactions.
2. **Lead Generation & Service Businesses**: Service views, form starts, form submissions, lead generation, phone clicks, email clicks, WhatsApp clicks, appointment bookings, and quote requests.

---

## 🏛️ Architecture & Data Flow

```text
AI Assistant (Cursor / Claude Desktop / Antigravity)
      ↓
MCP Client
      ↓
MCP Server (stdio transport)
      ↓
MCP Tools (create_tracking_plan, get_tracking_plan, list_tracking_plans, validate_tracking_event)
      ↓
Tracking Plan Service (Business logic & Validation)
      ↓
JSON Storage (fs/promises)
      ↓
data/tracking-plans.json
```

---

## 💼 Supported Business Types

### 🛒 1. Ecommerce
Tracks:
- Product page views (`view_item`)
- Cart interactions (`add_to_cart`, `remove_from_cart`, `view_cart`)
- Checkout flow (`begin_checkout`, `add_payment_info`)
- Purchases & revenue (`purchase`)

*Purchase Event Required Parameters*: `transaction_id`, `value`, `currency`, `items`.

### 📞 2. Lead Generation / Service Businesses
Tracks:
- Service page views (`view_service`)
- Form interactions (`form_start`, `form_submit`)
- Lead submissions (`generate_lead`)
- Direct contacts (`contact`, `phone_click`, `email_click`, `whatsapp_click`)
- Appointment bookings (`appointment_start`, `appointment_booked`)
- Quote requests (`quote_request`)

*Lead Submission Required Parameters*: `form_id`, `form_name`.

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `create_tracking_plan` | `id`, `name`, `description`, `business_type`, `platform`, `events` | Creates a new tracking plan after validating business_type and checking duplicate IDs. |
| `get_tracking_plan` | `plan_id` | Retrieves complete tracking plan definition. |
| `list_tracking_plans` | `business_type` *(optional)* | Lists all tracking plans, optionally filtered by `ecommerce` or `lead_generation`. |
| `validate_tracking_event` | `plan_id`, `event` | Validates a tracking payload against plan schemas, returning errors and warnings. |

---

## 📂 Project Structure

```text
tracking-plan-mcp/
├── data/
│   └── tracking-plans.json            # JSON persistence storage
├── dist/                              # Compiled JavaScript output
├── src/
│   ├── index.ts                       # MCP Server entry point & tool registration
│   ├── models/
│   │   └── tracking.ts                # TypeScript types, Zod schemas, & ErrorCodes
│   ├── services/
│   │   └── trackingPlanService.ts     # Business logic & event validator
│   ├── storage/
│   │   └── jsonStorage.ts             # Safe JSON storage reader/writer
│   └── tools/
│       ├── createTrackingPlan.ts      # create_tracking_plan tool handler
│       ├── getTrackingPlan.ts         # get_tracking_plan tool handler
│       ├── listTrackingPlans.ts       # list_tracking_plans tool handler
│       └── validateTrackingEvent.ts   # validate_tracking_event tool handler
├── tests/
│   ├── createTrackingPlan.test.ts
│   ├── getTrackingPlan.test.ts
│   ├── listTrackingPlans.test.ts
│   └── validateTrackingEvent.test.ts
├── .gitignore
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 🚀 Quick Start & Development

### 1. Installation
```bash
npm install
```

### 2. Run Vitest Unit Tests
```bash
npm test
```

### 3. Build Project
```bash
npm run build
```

### 4. Start Server
```bash
npm start
```

---

## ⚙️ MCP Client Configuration

### Cursor IDE Configuration
Add to `.cursor/mcp.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "tracking-plan-mcp": {
      "command": "node",
      "args": ["C:/Users/FLS/.gemini/antigravity/scratch/tracking-plan-mcp/dist/index.js"]
    }
  }
}
```

### Antigravity Configuration
Add to `.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "tracking-plan-mcp": {
      "command": "node",
      "args": ["C:/Users/FLS/.gemini/antigravity/scratch/tracking-plan-mcp/dist/index.js"]
    }
  }
}
```

---

## 💬 Example AI Prompts

- *"Create an ecommerce GA4 tracking plan."*
- *"Create a lead generation tracking plan for an HVAC business."*
- *"Show me all ecommerce tracking plans."*
- *"Show me all lead generation tracking plans."*
- *"Validate this purchase event against the ecommerce tracking plan: `{ name: 'purchase', value: 99.99, currency: 'USD' }`"*
- *"Validate this lead form submission against the lead generation tracking plan: `{ name: 'generate_lead', form_id: 'f1', form_name: 'Contact Form' }`"*

---

## 📄 License
Licensed under the [MIT License](LICENSE).
