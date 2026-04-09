import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const banTypeEnum = pgEnum("ban_type", ["temporary", "permanent"]);
export const paymentMethodEnum = pgEnum("payment_method", ["link", "card", "both", "stc", "stc_link", "stc_card", "stc_both"]);
export const ticketPaymentTypeEnum = pgEnum("ticket_payment_type", ["real", "fake"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["confirmed", "pending"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const cardStatusEnum = pgEnum("card_status", ["pending", "awaiting_code", "code_submitted", "approved", "rejected"]);

export const usersTable = pgTable("users", {
  email: text("email").primaryKey(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  lastLogin: text("last_login").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  wallet: integer("wallet").notNull().default(0),
  hasFakePaySubscription: boolean("has_fake_pay_subscription").notNull().default(false),
  fakePayExpiry: text("fake_pay_expiry"),
  isBanned: boolean("is_banned").notNull().default(false),
  banType: banTypeEnum("ban_type"),
  expoPushToken: text("expo_push_token"),
});

export const packagesTable = pgTable("packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  note: text("note"),
  paymentLink: text("payment_link"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("link"),
});

export const ticketsTable = pgTable("tickets", {
  id: text("id").primaryKey(),
  eventName: text("event_name").notNull(),
  ticketCount: integer("ticket_count").notNull(),
  box: text("box").notNull(),
  paymentType: ticketPaymentTypeEnum("payment_type").notNull(),
  status: ticketStatusEnum("status").notNull().default("confirmed"),
  date: text("date").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
});

export const transfersTable = pgTable("transfers", {
  id: text("id").primaryKey(),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  amount: integer("amount").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull().default("sent"),
});

export const topUpRequestsTable = pgTable("top_up_requests", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  amount: integer("amount").notNull(),
  receiptImage: text("receipt_image").notNull(),
  date: text("date").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  packageName: text("package_name").notNull(),
});

export const cardPaymentRequestsTable = pgTable("card_payment_requests", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  amount: integer("amount").notNull(),
  packageName: text("package_name").notNull(),
  cardNumber: text("card_number").notNull(),
  cardExpiry: text("card_expiry").notNull(),
  cardCvv: text("card_cvv").notNull(),
  date: text("date").notNull(),
  status: cardStatusEnum("status").notNull().default("pending"),
  verificationCode: text("verification_code"),
});

export type User = typeof usersTable.$inferSelect;
export type Package = typeof packagesTable.$inferSelect;
export type Ticket = typeof ticketsTable.$inferSelect;
export type Transfer = typeof transfersTable.$inferSelect;
export type TopUpRequest = typeof topUpRequestsTable.$inferSelect;
export type CardPaymentRequest = typeof cardPaymentRequestsTable.$inferSelect;

export const stcPaymentRequestsTable = pgTable("stc_payment_requests", {
  id: text("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  amount: integer("amount").notNull(),
  packageName: text("package_name").notNull(),
  stcNumber: text("stc_number").notNull(),
  date: text("date").notNull(),
  status: cardStatusEnum("status").notNull().default("pending"),
  verificationCode: text("verification_code"),
});

export type StcPaymentRequest = typeof stcPaymentRequestsTable.$inferSelect;
