import { db } from "./db";
import { users, tasks, paymentChannels, platformSettings, countries, stakingProducts } from "@shared/schema";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import { migrateReferralBonusDefaults } from "./referral-bonus-migration";

export async function seed() {
  console.log("Seeding database...");

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);

  // Ensure countries table exists
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "countries" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "name" text NOT NULL,
      "currency" text NOT NULL,
      "phone_prefix" text NOT NULL,
      "operators" text NOT NULL DEFAULT '[]',
      "is_active" boolean NOT NULL DEFAULT true
    )
  `);

  // Check if admin already exists. Keep a development fallback for existing
  // installations, while allowing deployments to configure the admin phone
  // through the secret store.
  const adminPhone = process.env.ADMIN_PHONE || "99935673";
  const existingAdmin = await db.select().from(users).where(eq(users.phone, adminPhone));
  const adminPassword = process.env.ADMIN_PASSWORD;

  const adminPin = process.env.ADMIN_PIN;

  if (existingAdmin.length === 0) {
    if (!adminPassword) {
      console.warn("No administrator exists yet; set ADMIN_PASSWORD to provision the initial admin.");
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db.insert(users).values({
        fullName: "Super Admin",
        phone: adminPhone,
        country: "TG",
        password: hashedPassword,
        referralCode: "ADMIN1",
        balance: "0",
        isAdmin: true,
        isSuperAdmin: true,
        adminPin: adminPin || null,
      });
      console.log("Super admin created");
      if (adminPin) console.log("Super admin PIN configured");
    }
  } else {
    // Always update admin flags; also update password and PIN if env vars are set
    const updateData: any = {
      isAdmin: true,
      isSuperAdmin: true,
      // Keep the bootstrap administrator able to use an active login country
      // after legacy countries are retired.
      ...(existingAdmin[0].country === "CD" ? { country: "TG" } : {}),
    };
    if (adminPassword) {
      updateData.password = await bcrypt.hash(adminPassword, 12);
      console.log("Super admin password updated");
    }
    if (adminPin) {
      updateData.adminPin = adminPin;
      console.log("Super admin PIN updated");
    }
    await db.update(users)
      .set(updateData)
      .where(eq(users.phone, adminPhone));
    console.log("Super admin access verified");
  }

  await migrateReferralBonusDefaults();

  // Canonical user-facing countries. Existing rows retain administrator-managed
  // operators; only newly created rows receive bootstrap operators.
  const canonicalCountries = [
    { code: "TG", name: "Togo", currency: "XOF", phonePrefix: "228", operators: ["T-Money", "Moov Money"] },
    { code: "BJ", name: "Bénin", currency: "XOF", phonePrefix: "229", operators: ["MTN", "Moov Money"] },
    { code: "BF", name: "Burkina Faso", currency: "XOF", phonePrefix: "226", operators: ["Orange Money", "Moov Money"] },
    { code: "CI", name: "Côte d'Ivoire", currency: "XOF", phonePrefix: "225", operators: ["Orange Money", "MTN", "Moov Money", "Wave"] },
    { code: "CM", name: "Cameroun", currency: "XAF", phonePrefix: "237", operators: ["MTN", "Orange Money"] },
  ];
  const existingCountries = await db.select().from(countries);
  for (const country of canonicalCountries) {
    const existing = existingCountries.find((item) => item.code === country.code);
    if (existing) {
      await db.update(countries).set({
        name: country.name, currency: country.currency, phonePrefix: country.phonePrefix,
      }).where(eq(countries.id, existing.id));
    } else {
      await db.insert(countries).values({ ...country, operators: JSON.stringify(country.operators), isActive: true });
    }
  }
  await db.update(countries).set({ isActive: false })
    .where(sql`${countries.code} NOT IN ('TG', 'BJ', 'BF', 'CI', 'CM')`);

  // Seed tasks only if table is empty (first install only — never overwrite admin changes)
  const existingTasks = await db.select().from(tasks);
  if (existingTasks.length === 0) {
    await db.insert(tasks).values([
      { name: "Parrain Bronze", description: "Inviter 3 personnes a investir", requiredInvites: 3, reward: 1428, sortOrder: 1 },
      { name: "Parrain Argent", description: "Inviter 5 personnes a investir", requiredInvites: 5, reward: 3060, sortOrder: 2 },
      { name: "Parrain Or", description: "Inviter 10 personnes a investir", requiredInvites: 10, reward: 10200, sortOrder: 3 },
      { name: "Parrain Platine", description: "Inviter 30 personnes a investir", requiredInvites: 30, reward: 26520, sortOrder: 4 },
      { name: "Parrain Diamant", description: "Inviter 100 personnes a investir", requiredInvites: 100, reward: 61200, sortOrder: 5 },
      { name: "Parrain Elite", description: "Inviter 300 personnes a investir", requiredInvites: 300, reward: 204000, sortOrder: 6 },
    ]);
    console.log("Tasks seeded (first install)");
  } else {
    console.log(`Tasks skipped — ${existingTasks.length} existing tasks preserved`);
  }

  // Check if payment channels exist
  const existingChannels = await db.select().from(paymentChannels);
  if (existingChannels.length === 0) {
    await db.insert(paymentChannels).values([
      { name: "LeekPay", redirectUrl: "https://leekpay.com/pay", isApi: false },
      { name: "FedaPay", redirectUrl: "https://fedapay.com/payment", isApi: false },
    ]);
    console.log("Payment channels seeded");
  }

  // Check if settings exist - apply new values for new keys or update existing
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://t.me/sybotx" },
    { key: "supportType", value: "telegram" },
    { key: "supportLabel", value: "Service client" },
    { key: "support2Link", value: "https://t.me/sybotx" },
    { key: "support2Type", value: "telegram" },
    { key: "support2Label", value: "Service client 2" },
    { key: "channelLink", value: "https://t.me/sybotx" },
    { key: "channelType", value: "telegram" },
    { key: "channelLabel", value: "Chaîne officielle" },
    { key: "groupLink", value: "https://t.me/sybotx" },
    { key: "groupType", value: "telegram" },
    { key: "groupLabel", value: "Groupe de discussion" },
    { key: "popupButtonLabel", value: "Cliquez ici pour rejoindre le groupe Telegram" },
    { key: "noticeText", value: "TELD (Tcharging) est un leader incontournable qui possède l'un des plus grands réseaux de bornes connectées à travers le pays." },
    { key: "supportEnabled", value: "true" },
    { key: "support2Enabled", value: "true" },
    { key: "channelEnabled", value: "true" },
    { key: "groupEnabled", value: "true" },
    { key: "minDeposit", value: "12240" },
    { key: "minWithdrawal", value: "6120" },
    { key: "withdrawalFees", value: "18" },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "maxWithdrawalsPerDay", value: "1" },
    { key: "level1Commission", value: "20" },
    { key: "level2Commission", value: "5" },
    { key: "level3Commission", value: "2" },
    { key: "signupBonus", value: "2040" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "Westpay" },
    { key: "omnipayEnabled", value: "false" },
    { key: "omnipayChannelName", value: "OmniPay" },
    { key: "omnipayCallbackKey", value: "" },
    { key: "sendavapayEnabled", value: "false" },
    { key: "sendavapayChannelName", value: "SendavaPay" },
    { key: "sendavapayWebhookSecret", value: "" },
    { key: "westpayEnabled", value: "false" },
    { key: "westpayChannelName", value: "WestPay" },
    { key: "westpayCountries", value: "" },
    { key: "westpayWebhookSecret", value: "" },
    { key: "ashtechEnabled", value: "false" },
    { key: "ashtechChannelName", value: "AshtechPay" },
    { key: "ashtechCountries", value: "" },
    { key: "ashtechWebhookSecret", value: "" },
  ];

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    const isSensitive = /secret|key|token|password/i.test(settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}${isSensitive ? "" : ` = ${settingData.value}`}`);
    } else if (
      settingData.key === "noticeText" &&
      /stone by ton|sybotx|disney|walt|pixar|marvel|star wars/i.test(existing.value)
    ) {
      await db.update(platformSettings)
        .set({ value: settingData.value })
        .where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key} = ${settingData.value}`);
    } else {
      console.log(`Setting preserved: ${existing.key}${isSensitive ? "" : ` = ${existing.value}`}`);
    }
  }
  console.log("Settings check complete");

  // Seed staking products only if table is empty (first install only — never overwrite admin changes)
  const existingStakingProducts = await db.select().from(stakingProducts);
  if (existingStakingProducts.length === 0) {
    await db.insert(stakingProducts).values([
      { name: "Produit 1", description: "5% par jour pendant 3 jours. Capital récupérable à la fin.", price: 8160, returnAmount: 9384, lockDays: 3, isActive: true },
      { name: "Produit 2", description: "5% par jour pendant 7 jours. Capital récupérable à la fin.", price: 20400, returnAmount: 27540, lockDays: 7, isActive: true },
      { name: "Produit 3", description: "5% par jour pendant 12 jours. Capital récupérable à la fin.", price: 40800, returnAmount: 65280, lockDays: 12, isActive: true },
      { name: "Produit 4", description: "5% par jour pendant 16 jours. Capital récupérable à la fin.", price: 81600, returnAmount: 146880, lockDays: 16, isActive: true },
      { name: "Produit 5", description: "5% par jour pendant 20 jours. Capital récupérable à la fin.", price: 204000, returnAmount: 408000, lockDays: 20, isActive: true },
    ]);
    console.log("Staking products seeded (first install)");
  } else {
    console.log(`Staking products skipped — ${existingStakingProducts.length} existing staking products preserved`);
  }

  console.log("Database seeding complete!");
}
