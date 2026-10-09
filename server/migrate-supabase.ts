import pg from "pg";

const { Pool } = pg;

const url = process.env.SUPABASE_DATABASE_URL;
if (!url) throw new Error("SUPABASE_DATABASE_URL manquant");

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    console.log("✅ Connecté à Supabase");

    // Session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`);
    console.log("✅ Table session créée");

    // Countries
    await client.query(`
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
    console.log("✅ Table countries créée");

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "full_name" text NOT NULL,
        "phone" text NOT NULL UNIQUE,
        "country" text NOT NULL,
        "password" text NOT NULL,
        "referral_code" text NOT NULL UNIQUE,
        "referred_by" text,
        "balance" decimal(15,2) NOT NULL DEFAULT 200,
        "today_earnings" decimal(15,2) NOT NULL DEFAULT 0,
        "total_earnings" decimal(15,2) NOT NULL DEFAULT 0,
        "is_admin" boolean NOT NULL DEFAULT false,
        "is_super_admin" boolean NOT NULL DEFAULT false,
        "is_banned" boolean NOT NULL DEFAULT false,
        "is_withdrawal_blocked" boolean NOT NULL DEFAULT false,
        "is_promoter" boolean NOT NULL DEFAULT false,
        "must_invite_to_withdraw" boolean NOT NULL DEFAULT false,
        "has_deposited" boolean NOT NULL DEFAULT false,
        "has_active_product" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "last_free_product_claim" timestamp,
        "last_daily_bonus_claim" timestamp,
        "promoter_set_by" integer,
        "admin_set_by" integer,
        "admin_set_at" timestamp,
        "admin_pin" text,
        "is_admin_password_required" boolean NOT NULL DEFAULT true,
        "is_banker" boolean NOT NULL DEFAULT false,
        "banker_set_by" integer
      )
    `);
    console.log("✅ Table users créée");

    // Products
    await client.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "price" integer NOT NULL,
        "daily_earnings" integer NOT NULL,
        "cycle_days" integer NOT NULL DEFAULT 80,
        "total_return" integer NOT NULL,
        "image_url" text,
        "is_free" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ Table products créée");

    // User products
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_products" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "product_id" integer NOT NULL REFERENCES "products"("id"),
        "purchase_date" timestamp NOT NULL DEFAULT now(),
        "last_earning_date" timestamp,
        "earnings_collected" decimal(15,2) NOT NULL DEFAULT 0,
        "status" text NOT NULL DEFAULT 'active',
        "cycle_end_date" timestamp,
        "total_earnings_target" decimal(15,2) NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ Table user_products créée");

    // Withdrawal wallets
    await client.query(`
      CREATE TABLE IF NOT EXISTS "withdrawal_wallets" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "account_name" text NOT NULL,
        "account_number" text NOT NULL,
        "payment_method" text NOT NULL,
        "country" text NOT NULL,
        "is_default" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table withdrawal_wallets créée");

    // Deposits
    await client.query(`
      CREATE TABLE IF NOT EXISTS "deposits" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "amount" decimal(15,2) NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "payment_method" text NOT NULL,
        "country" text NOT NULL,
        "account_name" text,
        "account_number" text,
        "channel_name" text,
        "payment_number_id" integer,
        "screenshot" text,
        "payment_message" text,
        "reference" text,
        "ashtech_transaction_id" text,
        "ashtech_reference" text,
        "admin_note" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table deposits créée");
    await client.query(`ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "ashtech_transaction_id" text`);
    await client.query(`ALTER TABLE "deposits" ADD COLUMN IF NOT EXISTS "ashtech_reference" text`);
    console.log("✅ Colonnes AshtechPay vérifiées");

    // Withdrawals
    await client.query(`
      CREATE TABLE IF NOT EXISTS "withdrawals" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "amount" decimal(15,2) NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "wallet_id" integer REFERENCES "withdrawal_wallets"("id"),
        "admin_note" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table withdrawals créée");

    // Payment channels
    await client.query(`
      CREATE TABLE IF NOT EXISTS "payment_channels" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ Table payment_channels créée");

    // Payment numbers
    await client.query(`
      CREATE TABLE IF NOT EXISTS "payment_numbers" (
        "id" serial PRIMARY KEY,
        "operator_name" text NOT NULL,
        "phone" text NOT NULL,
        "owner_name" text NOT NULL,
        "country" text NOT NULL,
        "logo_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ Table payment_numbers créée");

    // Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS "tasks" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "description" text,
        "reward" integer NOT NULL,
        "required_invites" integer NOT NULL DEFAULT 1,
        "is_active" boolean NOT NULL DEFAULT true
      )
    `);
    console.log("✅ Table tasks créée");

    // User tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_tasks" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "task_id" integer NOT NULL REFERENCES "tasks"("id"),
        "completed_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table user_tasks créée");

    // Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "type" text NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "description" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table transactions créée");

    // Platform settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id" serial PRIMARY KEY,
        "key" text NOT NULL UNIQUE,
        "value" text NOT NULL
      )
    `);
    console.log("✅ Table platform_settings créée");

    // Referral commissions
    await client.query(`
      CREATE TABLE IF NOT EXISTS "referral_commissions" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "from_user_id" integer NOT NULL REFERENCES "users"("id"),
        "level" integer NOT NULL,
        "amount" decimal(15,2) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table referral_commissions créée");

    // Staking products
    await client.query(`
      CREATE TABLE IF NOT EXISTS "staking_products" (
        "id" serial PRIMARY KEY,
        "name" text NOT NULL,
        "min_amount" integer NOT NULL,
        "max_amount" integer,
        "duration_days" integer NOT NULL,
        "interest_rate" decimal(5,2) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" integer NOT NULL DEFAULT 0
      )
    `);
    console.log("✅ Table staking_products créée");

    // User stakings
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_stakings" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id"),
        "staking_product_id" integer NOT NULL REFERENCES "staking_products"("id"),
        "amount" decimal(15,2) NOT NULL,
        "interest_earned" decimal(15,2) NOT NULL DEFAULT 0,
        "status" text NOT NULL DEFAULT 'active',
        "start_date" timestamp NOT NULL DEFAULT now(),
        "end_date" timestamp NOT NULL,
        "released_at" timestamp
      )
    `);
    console.log("✅ Table user_stakings créée");

    // Admin audit log
    await client.query(`
      CREATE TABLE IF NOT EXISTS "admin_audit_log" (
        "id" serial PRIMARY KEY,
        "admin_id" integer NOT NULL REFERENCES "users"("id"),
        "action" text NOT NULL,
        "target_user_id" integer,
        "details" text,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    console.log("✅ Table admin_audit_log créée");

    // ── Seed countries ──
    const countriesData = [
      { code: "TD", name: "Tchad", currency: "XAF", phone_prefix: "235", operators: '["Airtel Tchad","Moov Africa Tchad"]' },
      { code: "NE", name: "Niger", currency: "XOF", phone_prefix: "227", operators: '["NITA TRANSFERT","AMANA TRANSFERT"]' },
      { code: "CF", name: "Centrafrique", currency: "XAF", phone_prefix: "236", operators: '["Telecel Centrafrique","Orange Centrafrique"]' },
    ];
    for (const c of countriesData) {
      await client.query(
        `INSERT INTO countries (code, name, currency, phone_prefix, operators) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (code) DO NOTHING`,
        [c.code, c.name, c.currency, c.phone_prefix, c.operators]
      );
    }
    console.log("✅ Pays insérés");

    // Administrator provisioning is intentionally not part of a data migration.
    // Create or update an administrator through the application seed flow with
    // ADMIN_PASSWORD supplied as a secret, never through embedded credentials.

    // ── Seed platform settings ──
    const settings = [
      ["minDeposit", "3000"], ["minWithdrawal", "1000"], ["withdrawalFees", "18"],
      ["withdrawalStartHour", "9"], ["withdrawalEndHour", "17"], ["maxWithdrawalsPerDay", "1"],
      ["level1Commission", "20"], ["level2Commission", "5"], ["level3Commission", "2"],
      ["signupBonus", "500"], ["soleaspayEnabled", "false"], ["soleaspayCountries", ""],
      ["soleaspayChannelName", "Westpay"], ["omnipayEnabled", "false"],
      ["omnipayChannelName", "OmniPay"], ["omnipayCallbackKey", ""],
       ["ashtechEnabled", "false"], ["ashtechChannelName", "AshtechPay"],
       ["ashtechCountries", ""], ["ashtechWebhookSecret", ""],
      ["supportLink", "https://t.me/intelappgroup"], ["supportType", "telegram"],
      ["supportLabel", "Service client"], ["channelLink", "https://t.me/intelappgroup"],
      ["channelType", "telegram"], ["channelLabel", "Chaîne officielle"],
    ];
    for (const [key, value] of settings) {
      await client.query(
        `INSERT INTO platform_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
    }
    console.log("✅ Paramètres plateforme insérés");

    // ── One-time seed of the default VIP catalog ──
    // Preserve any products created or customized by an administrator on later
    // runs, including after the catalog has been intentionally cleared.
    const vipCatalogSeedKey = "bootstrap_vip_catalog_v1";
    const vipCatalogSeed = await client.query(
      "SELECT key FROM platform_settings WHERE key = $1 LIMIT 1",
      [vipCatalogSeedKey]
    );
    if (vipCatalogSeed.rows.length === 0) {
      const existingProducts = await client.query("SELECT id FROM products LIMIT 1");
      if (existingProducts.rows.length === 0) {
        const productsData = [
          { name: "VIP1 — Kakubin", price: 3000, daily_earnings: 450, cycle_days: 60, total_return: 27000, sort_order: 1 },
          { name: "VIP2 — Suntory Whisky Toki", price: 8000, daily_earnings: 1300, cycle_days: 60, total_return: 78000, sort_order: 2 },
          { name: "VIP3 — Chita", price: 15000, daily_earnings: 1900, cycle_days: 60, total_return: 114000, sort_order: 3 },
          { name: "VIP4 — Roku Gin", price: 20000, daily_earnings: 2900, cycle_days: 60, total_return: 174000, sort_order: 4 },
          { name: "VIP5 — Hakushu", price: 30000, daily_earnings: 3600, cycle_days: 60, total_return: 216000, sort_order: 5 },
          { name: "VIP6 — Yamazaki", price: 40000, daily_earnings: 4900, cycle_days: 60, total_return: 294000, sort_order: 6 },
          { name: "VIP7 — Hibiki", price: 75000, daily_earnings: 8900, cycle_days: 60, total_return: 534000, sort_order: 7 },
          { name: "VIP8 — Jim Beam", price: 150000, daily_earnings: 19000, cycle_days: 60, total_return: 1140000, sort_order: 8 },
          { name: "VIP9 — Maker's Mark", price: 250000, daily_earnings: 25000, cycle_days: 60, total_return: 1500000, sort_order: 9 },
          { name: "VIP10 — Sipsmith", price: 300000, daily_earnings: 39000, cycle_days: 60, total_return: 2340000, sort_order: 10 },
        ];
        for (const p of productsData) {
          await client.query(
            `INSERT INTO products (name, price, daily_earnings, cycle_days, total_return, is_free, is_active, sort_order)
             VALUES ($1,$2,$3,$4,$5,false,true,$6)`,
            [p.name, p.price, p.daily_earnings, p.cycle_days, p.total_return, p.sort_order]
          );
        }
        console.log("✅ Catalogue VIP Suntory initialisé");
      } else {
        console.log("Catalogue existant conservé; aucun produit n'a été remplacé");
      }
      await client.query(
        "INSERT INTO platform_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [vipCatalogSeedKey, "complete"]
      );
    }

    // ── Seed tasks ──
    const tasksData = [
      { name: "Parrain Bronze", description: "Inviter 3 personnes", reward: 1000, required_invites: 3 },
      { name: "Parrain Argent", description: "Inviter 5 personnes", reward: 2000, required_invites: 5 },
      { name: "Parrain Or", description: "Inviter 10 personnes", reward: 5000, required_invites: 10 },
      { name: "Parrain Platine", description: "Inviter 20 personnes", reward: 10000, required_invites: 20 },
      { name: "Parrain Diamant", description: "Inviter 50 personnes", reward: 25000, required_invites: 50 },
      { name: "Parrain Elite", description: "Inviter 100 personnes", reward: 50000, required_invites: 100 },
    ];
    for (const t of tasksData) {
      await client.query(
        `INSERT INTO tasks (name, description, reward, required_invites) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
        [t.name, t.description, t.reward, t.required_invites]
      );
    }
    console.log("✅ Tâches insérées");

    console.log("\n🎉 Migration Supabase terminée avec succès !");
    console.log("ℹ️ Aucun compte administrateur n'est créé par ce script.");

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error("❌ Erreur:", e.message); process.exit(1); });
