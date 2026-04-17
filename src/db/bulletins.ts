import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import {
  subscriptions,
  subscriptionPlans,
  subscriptionAlertSettings,
  subscriptionAlerts,
  userQuoteSubscriptions,
  users,
  products,
  cities,
  states,
  quotes,
  payments,
  newsArticles,
} from "./schema";
import {
  sendQuoteBulletinEmail,
  sendNewsBulletinEmail,
  sendSubscriptionExpiringEmail,
  sendSubscriptionExpiredEmail,
  sendPixPaymentEmail,
  sendBoletoPaymentEmail,
} from "../lib/email";

const db = drizzle(process.env.DB_FILE_NAME!);

async function sendQuoteBulletins() {
  console.log("Sending quote bulletins...");

  // Get all active subscribers with emailBulletins enabled
  const activeSubs = await db
    .select({
      userId: subscriptions.userId,
      userName: users.name,
      userEmail: users.email,
      emailBulletins: subscriptionPlans.emailBulletins,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptionPlans.emailBulletins, 1),
      ),
    );

  for (const sub of activeSubs) {
    // Get user's followed quotes
    const followed = await db
      .select({
        productId: userQuoteSubscriptions.productId,
        productName: products.name,
        cityId: userQuoteSubscriptions.cityId,
        cityName: cities.name,
        stateName: states.name,
      })
      .from(userQuoteSubscriptions)
      .innerJoin(products, eq(userQuoteSubscriptions.productId, products.id))
      .leftJoin(cities, eq(userQuoteSubscriptions.cityId, cities.id))
      .leftJoin(states, eq(cities.stateId, states.id))
      .where(eq(userQuoteSubscriptions.userId, sub.userId));

    if (followed.length === 0) continue;

    // Get latest quotes for followed products/cities
    const today = new Date().toISOString().slice(0, 10);
    const quotesData: Array<{
      productName: string;
      cityName: string;
      stateName: string;
      price: number;
      variation: number | null;
    }> = [];

    for (const f of followed) {
      const conditions = [
        eq(quotes.productId, f.productId),
        eq(quotes.quoteDate, today),
      ];
      if (f.cityId) {
        conditions.push(eq(quotes.cityId, f.cityId));
      }

      const [latestQuote] = await db
        .select({
          price: quotes.price,
          variation: quotes.variation,
        })
        .from(quotes)
        .where(and(...conditions))
        .orderBy(desc(quotes.createdAt))
        .limit(1);

      if (latestQuote) {
        quotesData.push({
          productName: f.productName,
          cityName: f.cityName ?? "Todas",
          stateName: f.stateName ?? "",
          price: latestQuote.price,
          variation: latestQuote.variation,
        });
      }
    }

    if (quotesData.length > 0) {
      try {
        await sendQuoteBulletinEmail(sub.userEmail, sub.userName, quotesData);
        console.log(`  Quote bulletin sent to ${sub.userEmail}`);
      } catch (err) {
        console.error(
          `  Failed to send quote bulletin to ${sub.userEmail}:`,
          err,
        );
      }
    }
  }
}

async function sendNewsBulletins() {
  console.log("Sending news bulletins...");

  // Get all active subscribers
  const activeSubs = await db
    .select({
      userId: subscriptions.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptionPlans.emailBulletins, 1),
      ),
    );

  if (activeSubs.length === 0) return;

  // Get latest news from last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const articles = await db
    .select({
      title: newsArticles.title,
      excerpt: newsArticles.excerpt,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
    })
    .from(newsArticles)
    .where(gte(newsArticles.publishedAt, yesterday.toISOString()))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(5);

  if (articles.length === 0) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agrocomm.com.br";

  const formattedArticles = articles.map((a) => ({
    title: a.title,
    excerpt: a.excerpt,
    url: `${appUrl}/noticias/${a.slug}`,
    imageUrl: a.imageUrl,
  }));

  for (const sub of activeSubs) {
    try {
      await sendNewsBulletinEmail(
        sub.userEmail,
        sub.userName,
        formattedArticles,
      );
      console.log(`  News bulletin sent to ${sub.userEmail}`);
    } catch (err) {
      console.error(`  Failed to send news bulletin to ${sub.userEmail}:`, err);
    }
  }
}

async function processExpiringSubscriptions() {
  console.log("Processing expiring subscriptions...");

  const [expiringAlert] = await db
    .select()
    .from(subscriptionAlertSettings)
    .where(
      and(
        eq(subscriptionAlertSettings.alertType, "expiring"),
        eq(subscriptionAlertSettings.enabled, 1),
      ),
    )
    .limit(1);

  if (!expiringAlert) return;

  const daysBefore = expiringAlert.daysBefore ?? 3;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  const targetDateStr = targetDate.toISOString().slice(0, 10);

  // Find subscriptions expiring on the target date
  const expiring = await db
    .select({
      subId: subscriptions.id,
      userId: subscriptions.userId,
      userName: users.name,
      userEmail: users.email,
      planName: subscriptionPlans.name,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.grantedByAdmin, 0),
        sql`date(${subscriptions.currentPeriodEnd}) = ${targetDateStr}`,
      ),
    );

  for (const sub of expiring) {
    // Check if alert already sent
    const [existing] = await db
      .select({ id: subscriptionAlerts.id })
      .from(subscriptionAlerts)
      .where(
        and(
          eq(subscriptionAlerts.subscriptionId, sub.subId),
          eq(subscriptionAlerts.alertType, "expiring"),
          sql`date(${subscriptionAlerts.sentAt}) = date('now')`,
        ),
      )
      .limit(1);

    if (existing) continue;

    try {
      await sendSubscriptionExpiringEmail(
        sub.userEmail,
        sub.userName,
        sub.planName,
        daysBefore,
      );
      await db.insert(subscriptionAlerts).values({
        subscriptionId: sub.subId,
        userId: sub.userId,
        alertType: "expiring",
        status: "sent",
      });
      console.log(`  Expiring alert sent to ${sub.userEmail}`);
    } catch {
      await db.insert(subscriptionAlerts).values({
        subscriptionId: sub.subId,
        userId: sub.userId,
        alertType: "expiring",
        status: "failed",
      });
    }
  }
}

async function processExpiredSubscriptions() {
  console.log("Processing expired subscriptions...");

  const [expiredAlert] = await db
    .select()
    .from(subscriptionAlertSettings)
    .where(
      and(
        eq(subscriptionAlertSettings.alertType, "expired"),
        eq(subscriptionAlertSettings.enabled, 1),
      ),
    )
    .limit(1);

  if (!expiredAlert) return;

  const maxAttempts = expiredAlert.maxAttempts ?? 3;

  // Find expired subscriptions
  const expired = await db
    .select({
      subId: subscriptions.id,
      userId: subscriptions.userId,
      userName: users.name,
      userEmail: users.email,
      planName: subscriptionPlans.name,
    })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .innerJoin(
      subscriptionPlans,
      eq(subscriptions.planId, subscriptionPlans.id),
    )
    .where(
      and(
        eq(subscriptions.status, "expired"),
        eq(subscriptions.grantedByAdmin, 0),
      ),
    );

  for (const sub of expired) {
    // Count how many alerts already sent
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptionAlerts)
      .where(
        and(
          eq(subscriptionAlerts.subscriptionId, sub.subId),
          eq(subscriptionAlerts.alertType, "expired"),
        ),
      );

    if ((countResult?.count ?? 0) >= maxAttempts) continue;

    try {
      await sendSubscriptionExpiredEmail(
        sub.userEmail,
        sub.userName,
        sub.planName,
      );
      await db.insert(subscriptionAlerts).values({
        subscriptionId: sub.subId,
        userId: sub.userId,
        alertType: "expired",
        status: "sent",
      });
      console.log(`  Expired alert sent to ${sub.userEmail}`);
    } catch {
      await db.insert(subscriptionAlerts).values({
        subscriptionId: sub.subId,
        userId: sub.userId,
        alertType: "expired",
        status: "failed",
      });
    }
  }

  // Also mark expired subscriptions that haven't been updated
  await db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.grantedByAdmin, 0),
        sql`datetime(${subscriptions.currentPeriodEnd}) < datetime('now')`,
      ),
    );
}

async function processFailedPayments() {
  console.log("Processing failed payments...");

  // Find pending pix/boleto payments from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingPayments = await db
    .select({
      paymentId: payments.id,
      userId: payments.userId,
      userName: users.name,
      userEmail: users.email,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      pixQrCode: payments.pixQrCode,
      pixQrCodeBase64: payments.pixQrCodeBase64,
      boletoUrl: payments.boletoUrl,
    })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .where(
      and(
        eq(payments.mpStatus, "pending"),
        gte(payments.createdAt, sevenDaysAgo.toISOString()),
      ),
    );

  for (const payment of pendingPayments) {
    if (payment.paymentMethod === "pix" && payment.pixQrCode) {
      try {
        await sendPixPaymentEmail(
          payment.userEmail,
          payment.userName,
          payment.amount,
          payment.pixQrCodeBase64 ?? "",
          payment.pixQrCode,
        );
        console.log(`  Pix reminder sent to ${payment.userEmail}`);
      } catch (err) {
        console.error(
          `  Failed to send pix reminder to ${payment.userEmail}:`,
          err,
        );
      }
    } else if (payment.paymentMethod === "boleto" && payment.boletoUrl) {
      try {
        await sendBoletoPaymentEmail(
          payment.userEmail,
          payment.userName,
          payment.amount,
          payment.boletoUrl,
        );
        console.log(`  Boleto reminder sent to ${payment.userEmail}`);
      } catch (err) {
        console.error(
          `  Failed to send boleto reminder to ${payment.userEmail}:`,
          err,
        );
      }
    }
  }
}

async function main() {
  console.log("=== AgroComm Bulletins & Alerts ===");
  console.log(`Started at ${new Date().toISOString()}`);

  try {
    await sendQuoteBulletins();
    await sendNewsBulletins();
    await processExpiringSubscriptions();
    await processExpiredSubscriptions();
    await processFailedPayments();
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }

  console.log("=== Done ===");
}

main().catch(console.error);
