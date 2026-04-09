import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, packagesTable, ticketsTable,
  transfersTable, topUpRequestsTable, cardPaymentRequestsTable, stcPaymentRequestsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const ADMIN_EMAIL = "888888000888";
const ADMIN_PASSWORD = "888888000888";

async function ensureAdmin() {
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: "المدير",
      lastLogin: new Date().toISOString(), isAdmin: true, wallet: 9999,
      hasFakePaySubscription: true, isBanned: false,
    });
  }
}
ensureAdmin().catch(() => {});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────────

async function sendPushNotification(token: string, title: string, body: string, data?: Record<string, unknown>) {
  try {
    if (!token || !token.startsWith("ExponentPushToken")) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate" },
      body: JSON.stringify({ to: token, title, body, data: data ?? {}, sound: "default", badge: 1 }),
    });
  } catch {}
}

async function getUserToken(email: string): Promise<string | null> {
  try {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return u?.expoPushToken ?? null;
  } catch { return null; }
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (!user || user.password !== password) return res.status(401).json({ success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    if (user.isBanned) return res.status(403).json({ success: false, message: "تم حظر حسابك من التطبيق" });
    const updated = { ...user, lastLogin: new Date().toISOString() };
    await db.update(usersTable).set({ lastLogin: updated.lastLogin }).where(eq(usersTable.email, email.toLowerCase()));
    return res.json({ success: true, user: updated });
  } catch (e) {
    return res.status(500).json({ success: false, message: "خطأ في الخادم" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const allowed = ["gmail.com", "hotmail.com", "live.com", "yahoo.com"];
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !allowed.includes(domain))
      return res.status(400).json({ success: false, message: "البريد الإلكتروني غير مدعوم. يجب أن يكون gmail أو hotmail أو live أو yahoo" });
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "البريد الإلكتروني مسجل مسبقاً" });
    const newUser = {
      email: email.toLowerCase(), password, name,
      lastLogin: new Date().toISOString(), isAdmin: false, wallet: 0,
      hasFakePaySubscription: false, isBanned: false,
    };
    await db.insert(usersTable).values(newUser);
    return res.json({ success: true, user: newUser });
  } catch (e) {
    return res.status(500).json({ success: false, message: "خطأ في الخادم" });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────

router.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    return res.json(users);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.get("/users/lookup", async (req, res) => {
  try {
    const email = (req.query.email as string)?.toLowerCase();
    if (!email) return res.status(400).json({ error: "البريد مطلوب" });
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(404).json({ error: "المستخدم غير موجود" });
    return res.json({ email: user.email, name: user.name });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.patch("/users/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const updates = req.body;
    await db.update(usersTable).set(updates).where(eq(usersTable.email, email));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return res.json(user);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.delete("/users/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    await db.delete(usersTable).where(eq(usersTable.email, email));
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── PACKAGES ──────────────────────────────────────────────────────────────────

router.get("/packages", async (req, res) => {
  try {
    const pkgs = await db.select().from(packagesTable);
    return res.json(pkgs);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/packages", async (req, res) => {
  try {
    const pkg = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(packagesTable).values(pkg);
    return res.json(pkg);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.patch("/packages/:id", async (req, res) => {
  try {
    await db.update(packagesTable).set(req.body).where(eq(packagesTable.id, req.params.id));
    const [pkg] = await db.select().from(packagesTable).where(eq(packagesTable.id, req.params.id)).limit(1);
    return res.json(pkg);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.delete("/packages/:id", async (req, res) => {
  try {
    await db.delete(packagesTable).where(eq(packagesTable.id, req.params.id));
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── TICKETS ───────────────────────────────────────────────────────────────────

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await db.select().from(ticketsTable);
    return res.json(tickets);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/tickets", async (req, res) => {
  try {
    const ticket = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(ticketsTable).values(ticket);
    return res.json(ticket);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/tickets/:id/transfer", async (req, res) => {
  try {
    const { id } = req.params;
    const { toEmail } = req.body;
    if (!toEmail) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id)).limit(1);
    if (!ticket) return res.status(404).json({ error: "التذكرة غير موجودة" });
    const [toUser] = await db.select().from(usersTable).where(eq(usersTable.email, toEmail.toLowerCase())).limit(1);
    if (!toUser) return res.status(404).json({ error: "المستخدم غير موجود" });
    if (toUser.email === ticket.userEmail) return res.status(400).json({ error: "لا يمكن تحويل التذكرة لنفس المستخدم" });

    await db.update(ticketsTable).set({
      userEmail: toUser.email,
      userName: toUser.name,
    }).where(eq(ticketsTable.id, id));

    const token = await getUserToken(toUser.email);
    if (token) {
      await sendPushNotification(
        token,
        "🎫 تذكرة جديدة!",
        `قام ${ticket.userName} بتحويل تذكرة "${ticket.eventName}" إليك`,
        { type: "ticket_received", ticketId: id }
      );
    }

    const [updated] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id)).limit(1);
    return res.json(updated);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── TRANSFERS ─────────────────────────────────────────────────────────────────

router.get("/transfers", async (req, res) => {
  try {
    const transfers = await db.select().from(transfersTable);
    return res.json(transfers);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/transfers", async (req, res) => {
  try {
    const transfer = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(transfersTable).values(transfer);

    const token = await getUserToken(transfer.toEmail);
    if (token) {
      const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.email, transfer.fromEmail)).limit(1);
      const fromName = fromUser?.name ?? transfer.fromEmail;
      await sendPushNotification(
        token,
        "💰 تم استلام تحويل!",
        `أرسل لك ${fromName} مبلغ ${transfer.amount} ريال`,
        { type: "transfer_received", amount: transfer.amount }
      );
    }

    return res.json(transfer);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── TOP-UP REQUESTS ───────────────────────────────────────────────────────────

router.get("/topup-requests", async (req, res) => {
  try {
    const requests = await db.select().from(topUpRequestsTable);
    return res.json(requests);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/topup-requests", async (req, res) => {
  try {
    const req2 = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(topUpRequestsTable).values(req2);
    return res.json(req2);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.patch("/topup-requests/:id", async (req, res) => {
  try {
    await db.update(topUpRequestsTable).set(req.body).where(eq(topUpRequestsTable.id, req.params.id));

    if (req.body.status === "approved") {
      const [r] = await db.select().from(topUpRequestsTable).where(eq(topUpRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "✅ تم شحن رصيدك!",
            `تمت الموافقة على طلب الشحن وتم إضافة ${r.amount} ريال لمحفظتك`,
            { type: "topup_approved", amount: r.amount }
          );
        }
      }
    }

    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── CARD PAYMENT REQUESTS ─────────────────────────────────────────────────────

router.get("/card-payments", async (req, res) => {
  try {
    const requests = await db.select().from(cardPaymentRequestsTable);
    return res.json(requests);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/card-payments", async (req, res) => {
  try {
    const req2 = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(cardPaymentRequestsTable).values(req2);
    return res.json(req2);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.patch("/card-payments/:id", async (req, res) => {
  try {
    await db.update(cardPaymentRequestsTable).set(req.body).where(eq(cardPaymentRequestsTable.id, req.params.id));

    if (req.body.status === "approved") {
      const [r] = await db.select().from(cardPaymentRequestsTable).where(eq(cardPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "✅ تم شحن رصيدك!",
            `تمت الموافقة على دفع البطاقة وتم إضافة ${r.amount} ريال لمحفظتك`,
            { type: "card_approved", amount: r.amount }
          );
        }
      }
    } else if (req.body.status === "rejected") {
      const [r] = await db.select().from(cardPaymentRequestsTable).where(eq(cardPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "❌ تم رفض طلب الدفع",
            `تم رفض طلب دفع البطاقة لباقة ${r.packageName}`,
            { type: "card_rejected" }
          );
        }
      }
    } else if (req.body.status === "awaiting_code") {
      const [r] = await db.select().from(cardPaymentRequestsTable).where(eq(cardPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "🔐 مطلوب كود التحقق",
            "يرجى فتح التطبيق وإدخال كود التحقق المرسل لك",
            { type: "card_awaiting_code" }
          );
        }
      }
    }

    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

// ── STC PAYMENT REQUESTS ──────────────────────────────────────────────────────

router.get("/stc-payments", async (req, res) => {
  try {
    const requests = await db.select().from(stcPaymentRequestsTable);
    return res.json(requests);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.post("/stc-payments", async (req, res) => {
  try {
    const req2 = { ...req.body, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) };
    await db.insert(stcPaymentRequestsTable).values(req2);
    return res.json(req2);
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

router.patch("/stc-payments/:id", async (req, res) => {
  try {
    await db.update(stcPaymentRequestsTable).set(req.body).where(eq(stcPaymentRequestsTable.id, req.params.id));

    if (req.body.status === "approved") {
      const [r] = await db.select().from(stcPaymentRequestsTable).where(eq(stcPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "✅ تم شحن رصيدك!",
            `تمت الموافقة على دفع STC Pay وتم إضافة ${r.amount} ريال لمحفظتك`,
            { type: "stc_approved", amount: r.amount }
          );
        }
      }
    } else if (req.body.status === "rejected") {
      const [r] = await db.select().from(stcPaymentRequestsTable).where(eq(stcPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "❌ تم رفض طلب الدفع",
            `تم رفض طلب STC Pay لباقة ${r.packageName}`,
            { type: "stc_rejected" }
          );
        }
      }
    } else if (req.body.status === "awaiting_code") {
      const [r] = await db.select().from(stcPaymentRequestsTable).where(eq(stcPaymentRequestsTable.id, req.params.id)).limit(1);
      if (r) {
        const token = await getUserToken(r.userEmail);
        if (token) {
          await sendPushNotification(
            token,
            "🔐 مطلوب كود التحقق",
            "يرجى فتح التطبيق وإدخال كود التحقق المرسل لك من STC",
            { type: "stc_awaiting_code" }
          );
        }
      }
    }

    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: "خطأ في الخادم" }); }
});

export default router;
