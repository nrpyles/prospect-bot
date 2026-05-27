import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* ─────────────────────────────────────────────────────────────
   ENUMS — mirror the prospect-bot pipeline + add SaaS-specific
   ───────────────────────────────────────────────────────────── */

export const prospectStatusEnum = pgEnum("prospect_status", [
  "New Lead",
  "Email Sent",
  "DM Sent",
  "Text Sent",
  "Called",
  "Follow Up 1",
  "Follow Up 2",
  "Breakup Sent",
  "Interested",
  "Call Scheduled",
  "Proposal Sent",
  "Closed Won",
  "Closed Lost",
  "Not Interested",
]);

export const websiteQualityEnum = pgEnum("website_quality", [
  "No Website",
  "Terrible",
  "Outdated",
  "Decent",
  "Good",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
]);

export const sequenceStepKindEnum = pgEnum("sequence_step_kind", [
  "email",
  "wait",
  "task",
]);

export const messageDirectionEnum = pgEnum("message_direction", [
  "outbound",
  "inbound",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "draft",
  "queued",
  "sent",
  "delivered",
  "opened",
  "replied",
  "bounced",
  "failed",
]);

/* ─────────────────────────────────────────────────────────────
   USERS — synced from Clerk
   ───────────────────────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_clerk_id_idx").on(t.clerkId), index("users_email_idx").on(t.email)],
);

/* ─────────────────────────────────────────────────────────────
   ORGANIZATIONS — each user gets one workspace by default
   ───────────────────────────────────────────────────────────── */

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Per-org API keys (bring-your-own-key model)
  googleMapsApiKey: text("google_maps_api_key"),
  // Default search settings
  defaultCities: jsonb("default_cities").$type<string[]>().default(sql`'[]'::jsonb`),
  defaultIndustries: jsonb("default_industries").$type<string[]>().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgMembers = pgTable(
  "org_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("org_members_unique").on(t.orgId, t.userId)],
);

/* ─────────────────────────────────────────────────────────────
   SUBSCRIPTIONS — Stripe-backed, DB-configurable tiers
   ───────────────────────────────────────────────────────────── */

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(), // e.g. "solo", "pro", "agency"
  name: text("name").notNull(),
  stripePriceId: text("stripe_price_id"), // set when ready to charge
  priceCents: integer("price_cents").notNull(),
  interval: varchar("interval", { length: 16 }).notNull().default("month"),
  // Limits — null = unlimited
  monthlyLeadCap: integer("monthly_lead_cap"),
  activeSequenceCap: integer("active_sequence_cap"),
  seatCap: integer("seat_cap"),
  features: jsonb("features").$type<string[]>().default(sql`'[]'::jsonb`),
  isPublic: boolean("is_public").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => plans.id),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    currentPeriodEnd: timestamp("current_period_end"),
    trialEndsAt: timestamp("trial_ends_at"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("subscriptions_org_idx").on(t.orgId),
    index("subscriptions_stripe_sub_idx").on(t.stripeSubscriptionId),
  ],
);

/* ─────────────────────────────────────────────────────────────
   PROSPECTS — the core entity (ports prospect-bot's JSON shape)
   ───────────────────────────────────────────────────────────── */

export const prospects = pgTable(
  "prospects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Identity
    name: text("name").notNull(),
    ownerName: text("owner_name"),
    industry: text("industry"),
    city: text("city"),

    // Contact
    phone: text("phone"),
    email: text("email"),
    website: text("website"),

    // Scoring
    quality: websiteQualityEnum("quality"),
    qualityIssues: jsonb("quality_issues").$type<string[]>().default(sql`'[]'::jsonb`),
    rating: text("rating"), // Google rating, kept as string to match source
    reviewCount: integer("review_count"),
    googlePlaceId: text("google_place_id"),
    address: text("address"),

    // Pipeline
    status: prospectStatusEnum("status").notNull().default("New Lead"),
    source: text("source").default("Google Maps Bot"),
    channel: text("channel"),

    // Deal
    packageName: text("package_name"),
    valueCents: integer("value_cents"),

    // Activity
    lastContactedAt: timestamp("last_contacted_at"),
    nextFollowUpAt: timestamp("next_follow_up_at"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("prospects_org_idx").on(t.orgId),
    index("prospects_org_status_idx").on(t.orgId, t.status),
    uniqueIndex("prospects_org_place_idx").on(t.orgId, t.googlePlaceId),
  ],
);

/* ─────────────────────────────────────────────────────────────
   LEAD SEARCHES — saved search configs + run history
   ───────────────────────────────────────────────────────────── */

export const leadSearches = pgTable("lead_searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cities: jsonb("cities").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  industries: jsonb("industries").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  minRating: text("min_rating").default("3.5"),
  qualityFilter: jsonb("quality_filter")
    .$type<("No Website" | "Terrible" | "Outdated" | "Decent" | "Good")[]>()
    .default(sql`'["No Website","Terrible","Outdated"]'::jsonb`),
  isScheduled: boolean("is_scheduled").notNull().default(false),
  scheduleCron: text("schedule_cron"),
  lastRunAt: timestamp("last_run_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadSearchRuns = pgTable("lead_search_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => leadSearches.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  foundCount: integer("found_count").default(0),
  addedCount: integer("added_count").default(0),
  errorMessage: text("error_message"),
});

/* ─────────────────────────────────────────────────────────────
   SEQUENCES — outreach automation (Phase 4 fills this out)
   ───────────────────────────────────────────────────────────── */

export const sequences = pgTable("sequences", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sequenceSteps = pgTable("sequence_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  sequenceId: uuid("sequence_id")
    .notNull()
    .references(() => sequences.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  kind: sequenceStepKindEnum("kind").notNull(),
  // For 'email' kind:
  subject: text("subject"),
  body: text("body"), // may include {{prospect.name}} etc.
  useAiDraft: boolean("use_ai_draft").notNull().default(false),
  // For 'wait' kind:
  waitDays: integer("wait_days"),
});

export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => sequences.id, { onDelete: "cascade" }),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    currentStepPosition: integer("current_step_position").notNull().default(0),
    nextActionAt: timestamp("next_action_at"),
    completedAt: timestamp("completed_at"),
    pausedAt: timestamp("paused_at"),
    enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("sequence_enrollments_unique").on(t.sequenceId, t.prospectId),
    index("sequence_enrollments_next_action_idx").on(t.nextActionAt),
  ],
);

/* ─────────────────────────────────────────────────────────────
   MESSAGES — sent emails + replies
   ───────────────────────────────────────────────────────────── */

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    prospectId: uuid("prospect_id")
      .notNull()
      .references(() => prospects.id, { onDelete: "cascade" }),
    sequenceStepId: uuid("sequence_step_id").references(() => sequenceSteps.id, {
      onDelete: "set null",
    }),
    direction: messageDirectionEnum("direction").notNull(),
    status: messageStatusEnum("status").notNull().default("draft"),
    channel: varchar("channel", { length: 32 }).notNull().default("email"),
    subject: text("subject"),
    body: text("body"),
    fromAddress: text("from_address"),
    toAddress: text("to_address"),
    providerMessageId: text("provider_message_id"),
    threadId: text("thread_id"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    openedAt: timestamp("opened_at"),
    repliedAt: timestamp("replied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("messages_prospect_idx").on(t.prospectId),
    index("messages_org_idx").on(t.orgId),
    index("messages_thread_idx").on(t.threadId),
  ],
);

/* ─────────────────────────────────────────────────────────────
   USER CONNECTIONS — Gmail OAuth, etc.
   ───────────────────────────────────────────────────────────── */

export const userConnections = pgTable(
  "user_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(), // "gmail", "outlook"
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"), // store encrypted in real prod
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    scope: text("scope"),
    emailAddress: text("email_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_connections_unique").on(t.userId, t.provider, t.providerAccountId),
  ],
);

/* ─────────────────────────────────────────────────────────────
   RELATIONS
   ───────────────────────────────────────────────────────────── */

export const usersRelations = relations(users, ({ many }) => ({
  ownedOrgs: many(organizations),
  memberships: many(orgMembers),
  connections: many(userConnections),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  members: many(orgMembers),
  prospects: many(prospects),
  sequences: many(sequences),
  subscription: one(subscriptions),
}));

export const prospectsRelations = relations(prospects, ({ one, many }) => ({
  org: one(organizations, { fields: [prospects.orgId], references: [organizations.id] }),
  messages: many(messages),
  enrollments: many(sequenceEnrollments),
}));

export const sequencesRelations = relations(sequences, ({ one, many }) => ({
  org: one(organizations, { fields: [sequences.orgId], references: [organizations.id] }),
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one }) => ({
  sequence: one(sequences, { fields: [sequenceSteps.sequenceId], references: [sequences.id] }),
}));

/* ─────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────── */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;
export type Sequence = typeof sequences.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
