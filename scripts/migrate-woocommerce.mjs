/**
 * WooCommerce to MongoDB Migration Script
 *
 * Migrates: Categories, Products, Orders, Customers, Blogs, Coupons, Delivery Cities
 * Source: u458533161_tcw1k.sql (WordPress/WooCommerce SQL dump)
 * Target: MongoDB (Pretty Petals ecommerce)
 *
 * Usage: node scripts/migrate-woocommerce.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_FILE = resolve(__dirname, "../u458533161_tcw1k.sql");
const MONGO_URI =
  "mongodb+srv://mayuresh:IoDL89RcuajN2AKz@complianceone.obgaz.mongodb.net/new-test-db?retryWrites=true&w=majority";

// ============================================================================
// SQL Parser
// ============================================================================

function parseSqlFile(filePath) {
  console.log("Reading SQL file...");
  const sql = readFileSync(filePath, "utf-8");
  console.log(`SQL file size: ${(sql.length / 1024 / 1024).toFixed(1)} MB`);
  return sql;
}

function extractInserts(sql, tableName) {
  const rows = [];
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES\\s*`,
    "gi"
  );

  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const columns = match[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    const startIdx = match.index + match[0].length;
    const endIdx = findInsertEnd(sql, startIdx);
    const valuesStr = sql.substring(startIdx, endIdx);
    const rowTuples = parseValueTuples(valuesStr);

    for (const tuple of rowTuples) {
      const values = parseRowValues(tuple);
      if (values.length === columns.length) {
        const row = {};
        columns.forEach((col, i) => {
          row[col] = values[i];
        });
        rows.push(row);
      }
    }
  }

  return rows;
}

function findInsertEnd(sql, startIdx) {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = startIdx; i < sql.length; i++) {
    const ch = sql[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (inString) {
      if (ch === stringChar) {
        if (i + 1 < sql.length && sql[i + 1] === stringChar) { i++; continue; }
        inString = false;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; continue; }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ";" && depth === 0) return i;
  }
  return sql.length;
}

function parseValueTuples(valuesStr) {
  const tuples = [];
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let escaped = false;
  let start = -1;

  for (let i = 0; i < valuesStr.length; i++) {
    const ch = valuesStr[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (inString) {
      if (ch === stringChar) {
        if (i + 1 < valuesStr.length && valuesStr[i + 1] === stringChar) { i++; continue; }
        inString = false;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; continue; }
    if (ch === "(") { if (depth === 0) start = i + 1; depth++; }
    if (ch === ")") {
      depth--;
      if (depth === 0 && start !== -1) { tuples.push(valuesStr.substring(start, i)); start = -1; }
    }
  }
  return tuples;
}

function parseRowValues(tuple) {
  const values = [];
  let current = "";
  let inString = false;
  let stringChar = "";
  let escaped = false;

  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (escaped) { current += ch; escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; current += ch; continue; }
    if (inString) {
      if (ch === stringChar) {
        if (i + 1 < tuple.length && tuple[i + 1] === stringChar) { current += ch; i++; continue; }
        inString = false; current += ch; continue;
      }
      current += ch; continue;
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; current += ch; continue; }
    if (ch === ",") { values.push(cleanValue(current.trim())); current = ""; continue; }
    current += ch;
  }
  if (current.trim()) values.push(cleanValue(current.trim()));
  return values;
}

function cleanValue(val) {
  if (val === "NULL" || val === "null") return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "\t");
  }
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  const num = Number(val);
  if (!isNaN(num) && val !== "") return num;
  return val;
}

function decodeHtml(str) {
  if (!str || typeof str !== "string") return str;
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

// ============================================================================
// Mongoose Schemas (inline - avoids TS import issues)
// ============================================================================

const CategorySchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, image: String, description: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  order: { type: Number, default: 0 }, isActive: { type: Boolean, default: true },
  productCount: { type: Number, default: 0 }, wpTermId: Number,
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String, shortDescription: String,
  sku: String, type: { type: String, enum: ["simple", "variable"], default: "simple" },
  pricing: { regularPrice: Number, salePrice: Number, currentPrice: Number },
  inventory: { stock: { type: Number, default: 0 }, stockStatus: { type: String, default: "instock" }, trackStock: { type: Boolean, default: false } },
  images: [{ url: String, alt: String, order: Number }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  tags: [String],
  variants: [{ label: String, sku: String, price: Number, salePrice: Number, image: String, stock: Number }],
  addons: [{ name: String, price: Number, image: String }],
  metrics: { ratingCount: { type: Number, default: 0 }, averageRating: { type: Number, default: 0 }, totalSales: { type: Number, default: 0 } },
  seo: { metaTitle: String, metaDescription: String },
  isActive: { type: Boolean, default: true }, isFeatured: { type: Boolean, default: false },
  deliveryInfo: String, wpPostId: Number,
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { name: String, email: String, phone: String, clerkId: String },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, productName: String, variant: String, quantity: Number, price: Number, total: Number }],
  shipping: { address: String, city: String, state: String, pincode: String, method: String },
  deliveryCharge: { type: Number, default: 0 },
  pricing: { subtotal: Number, discount: Number, couponCode: String, tax: Number, shipping: Number, total: Number },
  payment: { method: String, status: String, transactionId: String },
  status: { type: String, default: "pending" },
  statusHistory: [{ status: String, timestamp: Date, note: String }],
  notes: String, invoice: { number: String, date: Date }, wpOrderId: Number,
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  clerkId: String, name: { first: String, last: String },
  email: { type: String, unique: true }, phone: String,
  addresses: [{ label: String, address: String, city: String, state: String, pincode: String, isDefault: Boolean }],
  orderCount: { type: Number, default: 0 }, totalSpent: { type: Number, default: 0 },
  lastOrderDate: Date, wpCustomerId: Number, wpUserId: Number,
}, { timestamps: true });

const BlogSchema = new mongoose.Schema({
  title: String, slug: { type: String, unique: true }, content: String, excerpt: String,
  image: String, author: String, category: String, tags: [String],
  isPublished: { type: Boolean, default: true }, views: { type: Number, default: 0 },
  seo: { metaTitle: String, metaDescription: String },
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true }, type: { type: String, enum: ["percentage", "fixed"] },
  value: Number, minOrderAmount: { type: Number, default: 0 }, maxDiscount: Number,
  usageLimit: Number, usedCount: { type: Number, default: 0 }, perUserLimit: { type: Number, default: 1 },
  validFrom: Date, validTo: Date, isActive: { type: Boolean, default: true },
}, { timestamps: true });

const DeliveryCitySchema = new mongoose.Schema({
  city: { type: String, unique: true }, state: String,
  pincodes: [{ code: String, deliveryDays: { type: Number, default: 0 }, codAvailable: { type: Boolean, default: true } }],
  baseCharge: { type: Number, default: 0 }, freeDeliveryAbove: Number,
  isActive: { type: Boolean, default: true }, estimatedTime: String,
}, { timestamps: true });

// ============================================================================
// Migration Functions
// ============================================================================

async function migrateCategories(sql, db) {
  console.log("\n--- Migrating Categories ---");
  const Category = db.model("Category", CategorySchema);
  await Category.deleteMany({});

  const terms = extractInserts(sql, "wp_terms");
  const taxonomy = extractInserts(sql, "wp_term_taxonomy");
  const productCats = taxonomy.filter((t) => t.taxonomy === "product_cat");
  console.log(`  Found ${productCats.length} product categories`);

  const termMap = {};
  terms.forEach((t) => { termMap[t.term_id] = t; });

  const wpIdToMongoId = {};
  const seenSlugs = new Set();

  for (const cat of productCats) {
    const term = termMap[cat.term_id];
    if (!term) continue;
    let slug = term.slug || term.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (seenSlugs.has(slug)) slug = `${slug}-${cat.term_id}`;
    seenSlugs.add(slug);

    try {
      const doc = await Category.create({
        name: decodeHtml(term.name), slug,
        description: decodeHtml(cat.description) || "",
        isActive: true, productCount: cat.count || 0, wpTermId: cat.term_id,
      });
      wpIdToMongoId[cat.term_id] = doc._id;
    } catch (err) {
      if (err.code === 11000) {
        slug = `${slug}-dup-${cat.term_id}`;
        const doc = await Category.create({
          name: decodeHtml(term.name), slug,
          description: decodeHtml(cat.description) || "",
          isActive: true, productCount: cat.count || 0, wpTermId: cat.term_id,
        });
        wpIdToMongoId[cat.term_id] = doc._id;
      }
    }
  }

  // Set parent references
  let parentsSet = 0;
  for (const cat of productCats) {
    if (cat.parent && cat.parent !== 0 && wpIdToMongoId[cat.term_id] && wpIdToMongoId[cat.parent]) {
      await Category.updateOne({ _id: wpIdToMongoId[cat.term_id] }, { parent: wpIdToMongoId[cat.parent] });
      parentsSet++;
    }
  }

  const count = await Category.countDocuments();
  console.log(`  Inserted ${count} categories (${parentsSet} with parents)`);
  return { wpIdToMongoId, taxonomy, termMap };
}

async function migrateProducts(sql, db, categoryMap) {
  console.log("\n--- Migrating Products ---");
  const Product = db.model("Product", ProductSchema);
  await Product.deleteMany({});

  const posts = extractInserts(sql, "wp_posts");
  const postmeta = extractInserts(sql, "wp_postmeta");
  const productMeta = extractInserts(sql, "wp_wc_product_meta_lookup");
  const termRels = extractInserts(sql, "wp_term_relationships");
  const taxonomy = extractInserts(sql, "wp_term_taxonomy");

  const products = posts.filter((p) => p.post_type === "product" && p.post_status === "publish");
  const variations = posts.filter((p) => p.post_type === "product_variation");
  const attachments = posts.filter((p) => p.post_type === "attachment");
  console.log(`  Found ${products.length} products, ${variations.length} variations`);

  // Lookups
  const metaByPost = {};
  postmeta.forEach((m) => { if (!metaByPost[m.post_id]) metaByPost[m.post_id] = {}; metaByPost[m.post_id][m.meta_key] = m.meta_value; });

  const pMetaMap = {};
  productMeta.forEach((m) => { pMetaMap[m.product_id] = m; });

  const relMap = {};
  termRels.forEach((r) => { if (!relMap[r.object_id]) relMap[r.object_id] = []; relMap[r.object_id].push(r.term_taxonomy_id); });

  const taxMap = {};
  taxonomy.forEach((t) => { taxMap[t.term_taxonomy_id] = t; });

  const varsByParent = {};
  variations.forEach((v) => { if (!varsByParent[v.post_parent]) varsByParent[v.post_parent] = []; varsByParent[v.post_parent].push(v); });

  const attachMap = {};
  attachments.forEach((a) => { attachMap[a.ID] = a.guid; });

  const wpIdToProductId = {};
  let insertedCount = 0;
  const seenSlugs = new Set();

  for (const p of products) {
    const meta = metaByPost[p.ID] || {};
    const pMeta = pMetaMap[p.ID] || {};
    const rels = relMap[p.ID] || [];

    // Type
    let productType = "simple";
    for (const ttId of rels) {
      const tax = taxMap[ttId];
      if (tax && tax.taxonomy === "product_type" && tax.term_id === 4) productType = "variable";
    }

    // Category
    let categoryId = null;
    for (const ttId of rels) {
      const tax = taxMap[ttId];
      if (tax && tax.taxonomy === "product_cat" && categoryMap[tax.term_id]) {
        categoryId = categoryMap[tax.term_id]; break;
      }
    }

    // Tags
    const tags = [];
    for (const ttId of rels) {
      const tax = taxMap[ttId];
      if (tax && tax.taxonomy === "product_tag") {
        const termRow = extractInserts._termsCache;
        // We'll skip tag names for now to keep it simple
      }
    }

    // Pricing
    const regularPrice = parseFloat(meta._regular_price) || parseFloat(meta._price) || parseFloat(pMeta.min_price) || 0;
    const salePrice = parseFloat(meta._sale_price) || null;

    // Images
    const images = [];
    if (meta._thumbnail_id && attachMap[meta._thumbnail_id]) {
      images.push({ url: attachMap[meta._thumbnail_id], alt: p.post_title, order: 0 });
    }
    if (meta._product_image_gallery && typeof meta._product_image_gallery === "string") {
      meta._product_image_gallery.split(",").forEach((id, idx) => {
        if (attachMap[id.trim()]) images.push({ url: attachMap[id.trim()], alt: "", order: idx + 1 });
      });
    }

    // Variations
    const variants = [];
    for (const vp of (varsByParent[p.ID] || [])) {
      const vMeta = metaByPost[vp.ID] || {};
      variants.push({
        label: decodeHtml(vp.post_excerpt || vp.post_title?.replace(`${p.post_title} - `, "") || "Variant"),
        sku: typeof vMeta._sku === "string" ? vMeta._sku : "",
        price: parseFloat(vMeta._regular_price) || parseFloat(vMeta._price) || 0,
        salePrice: parseFloat(vMeta._sale_price) || null,
        stock: parseInt(vMeta._stock) || 0,
      });
    }

    // Featured
    let isFeatured = false;
    for (const ttId of rels) {
      const tax = taxMap[ttId];
      if (tax && tax.taxonomy === "product_visibility" && tax.term_id === 8) isFeatured = true;
    }

    let slug = p.post_name || p.post_title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (seenSlugs.has(slug)) slug = `${slug}-${p.ID}`;
    seenSlugs.add(slug);

    try {
      const doc = await Product.create({
        name: decodeHtml(p.post_title), slug,
        description: p.post_content || "", shortDescription: p.post_excerpt || "",
        sku: typeof meta._sku === "string" ? meta._sku : "",
        type: productType,
        pricing: { regularPrice, salePrice, currentPrice: salePrice || regularPrice },
        inventory: {
          stock: parseInt(meta._stock) || 0,
          stockStatus: pMeta.stock_status || meta._stock_status || "instock",
          trackStock: meta._manage_stock === "yes",
        },
        images, category: categoryId, tags, variants, addons: [],
        metrics: {
          ratingCount: parseInt(pMeta.rating_count) || 0,
          averageRating: parseFloat(pMeta.average_rating) || 0,
          totalSales: parseInt(pMeta.total_sales) || 0,
        },
        seo: { metaTitle: p.post_title, metaDescription: (p.post_excerpt || "").substring(0, 160) },
        isActive: true, isFeatured, wpPostId: p.ID,
      });
      wpIdToProductId[p.ID] = doc._id;
      insertedCount++;
    } catch (err) {
      if (err.code === 11000) {
        // skip duplicates
      } else {
        console.log(`    Error on product "${p.post_title}": ${err.message}`);
      }
    }

    if (insertedCount % 100 === 0 && insertedCount > 0) {
      process.stdout.write(`  ...${insertedCount} products\r`);
    }
  }

  console.log(`  Inserted ${insertedCount} products`);
  return wpIdToProductId;
}

async function migrateCustomers(sql, db) {
  console.log("\n--- Migrating Customers ---");
  const Customer = db.model("Customer", CustomerSchema);
  await Customer.deleteMany({});

  const customers = extractInserts(sql, "wp_wc_customer_lookup");
  console.log(`  Found ${customers.length} customer records`);

  const seenEmails = new Set();
  let count = 0;

  for (const c of customers) {
    const email = (c.email || "").toLowerCase().trim();
    if (!email || seenEmails.has(email)) continue;
    seenEmails.add(email);

    try {
      await Customer.create({
        name: { first: decodeHtml(c.first_name) || "", last: decodeHtml(c.last_name) || "" },
        email, phone: "",
        addresses: (c.city || c.state || c.postcode)
          ? [{ label: "Default", address: "", city: c.city || "", state: c.state || "", pincode: c.postcode || "", isDefault: true }]
          : [],
        wpCustomerId: c.customer_id, wpUserId: c.user_id || null,
      });
      count++;
    } catch {
      // skip duplicates
    }
  }

  console.log(`  Inserted ${count} customers`);
}

async function migrateOrders(sql, db, productMap) {
  console.log("\n--- Migrating Orders ---");
  const Order = db.model("Order", OrderSchema);
  await Order.deleteMany({});

  const orderStats = extractInserts(sql, "wp_wc_order_stats");
  const orderItems = extractInserts(sql, "wp_wc_order_product_lookup");
  const customerLookup = extractInserts(sql, "wp_wc_customer_lookup");

  console.log(`  Found ${orderStats.length} orders, ${orderItems.length} items`);

  const itemsByOrder = {};
  orderItems.forEach((item) => { if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []; itemsByOrder[item.order_id].push(item); });

  const custIdToInfo = {};
  customerLookup.forEach((c) => { custIdToInfo[c.customer_id] = { email: (c.email || "").toLowerCase(), name: `${c.first_name || ""} ${c.last_name || ""}`.trim() }; });

  const statusMap = {
    "wc-completed": "delivered", "wc-processing": "processing", "wc-pending": "pending",
    "wc-on-hold": "pending", "wc-cancelled": "cancelled", "wc-refunded": "refunded", "wc-failed": "cancelled",
  };

  let insertedCount = 0;

  for (const order of orderStats) {
    if (order.parent_id && order.parent_id !== 0) continue;

    const status = statusMap[order.status] || "pending";
    const custInfo = custIdToInfo[order.customer_id] || { email: "", name: "Guest" };
    const createdAt = order.date_created ? new Date(order.date_created) : new Date();
    const completedAt = order.date_completed ? new Date(order.date_completed) : null;

    const items = (itemsByOrder[order.order_id] || []).map((item) => ({
      product: productMap[item.product_id] || null,
      productName: `Product #${item.product_id}`,
      variant: item.variation_id && item.variation_id !== 0 ? `Var #${item.variation_id}` : "",
      quantity: item.product_qty || 1,
      price: (parseFloat(item.product_gross_revenue) || 0) / (item.product_qty || 1),
      total: parseFloat(item.product_gross_revenue) || 0,
    }));

    try {
      await Order.create({
        orderNumber: `PP-${String(order.order_id).padStart(5, "0")}`,
        customer: { name: custInfo.name, email: custInfo.email, phone: "" },
        items: items.filter((i) => i.total > 0),
        shipping: { address: "", city: "", state: "", pincode: "", method: "" },
        deliveryCharge: parseFloat(order.shipping_total) || 0,
        pricing: {
          subtotal: parseFloat(order.net_total) || 0, discount: 0, couponCode: "",
          tax: parseFloat(order.tax_total) || 0, shipping: parseFloat(order.shipping_total) || 0,
          total: parseFloat(order.total_sales) || 0,
        },
        payment: {
          method: "online",
          status: status === "delivered" ? "paid" : status === "refunded" ? "refunded" : "pending",
        },
        status,
        statusHistory: [
          { status: "pending", timestamp: createdAt, note: "Migrated from WooCommerce" },
          ...(status !== "pending" ? [{ status, timestamp: completedAt || createdAt, note: "WC status" }] : []),
        ],
        invoice: { number: `WEB-${order.order_id}`, date: createdAt },
        wpOrderId: order.order_id,
        createdAt, updatedAt: completedAt || createdAt,
      });
      insertedCount++;
    } catch (err) {
      if (err.code !== 11000) console.log(`    Order ${order.order_id}: ${err.message}`);
    }

    if (insertedCount % 200 === 0 && insertedCount > 0) {
      process.stdout.write(`  ...${insertedCount} orders\r`);
    }
  }

  // Update customer stats
  const Customer = db.model("Customer");
  const stats = await Order.aggregate([
    { $match: { "customer.email": { $ne: "" } } },
    { $group: { _id: "$customer.email", orderCount: { $sum: 1 }, totalSpent: { $sum: "$pricing.total" }, lastOrderDate: { $max: "$createdAt" } } },
  ]);
  for (const s of stats) {
    await Customer.updateOne({ email: s._id }, { orderCount: s.orderCount, totalSpent: s.totalSpent, lastOrderDate: s.lastOrderDate });
  }

  console.log(`  Inserted ${insertedCount} orders, updated customer stats`);
}

async function migrateBlogs(sql, db) {
  console.log("\n--- Migrating Blogs ---");
  const Blog = db.model("Blog", BlogSchema);
  await Blog.deleteMany({});

  const posts = extractInserts(sql, "wp_posts");
  const users = extractInserts(sql, "wp_users");

  const userMap = {};
  users.forEach((u) => { userMap[u.ID] = u.display_name || u.user_login; });

  const blogPosts = posts.filter((p) => p.post_type === "post" && p.post_status === "publish" && p.post_title);
  console.log(`  Found ${blogPosts.length} blog posts`);

  const seenSlugs = new Set();
  let count = 0;

  for (const p of blogPosts) {
    let slug = p.post_name || p.post_title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (seenSlugs.has(slug)) slug = `${slug}-${p.ID}`;
    seenSlugs.add(slug);

    try {
      await Blog.create({
        title: decodeHtml(p.post_title), slug,
        content: p.post_content || "", excerpt: p.post_excerpt || "",
        author: userMap[p.post_author] || "Admin", isPublished: true, views: 0,
        seo: { metaTitle: decodeHtml(p.post_title), metaDescription: (p.post_excerpt || "").substring(0, 160) },
        createdAt: p.post_date ? new Date(p.post_date) : new Date(),
        updatedAt: p.post_modified ? new Date(p.post_modified) : new Date(),
      });
      count++;
    } catch {
      // skip duplicates
    }
  }
  console.log(`  Inserted ${count} blog posts`);
}

async function migrateCoupons(sql, db) {
  console.log("\n--- Migrating Coupons ---");
  const Coupon = db.model("Coupon", CouponSchema);
  await Coupon.deleteMany({});

  const posts = extractInserts(sql, "wp_posts");
  const postmeta = extractInserts(sql, "wp_postmeta");

  const couponPosts = posts.filter((p) => p.post_type === "shop_coupon" && p.post_status === "publish");
  console.log(`  Found ${couponPosts.length} coupons`);

  const metaByPost = {};
  postmeta.forEach((m) => { if (!metaByPost[m.post_id]) metaByPost[m.post_id] = {}; metaByPost[m.post_id][m.meta_key] = m.meta_value; });

  let count = 0;
  for (const p of couponPosts) {
    if (!p.post_title) continue;
    const meta = metaByPost[p.ID] || {};

    try {
      await Coupon.create({
        code: p.post_title.toUpperCase(),
        type: meta.discount_type === "percent" ? "percentage" : "fixed",
        value: parseFloat(meta.coupon_amount) || 0,
        minOrderAmount: parseFloat(meta.minimum_amount) || 0,
        maxDiscount: parseFloat(meta.maximum_amount) || undefined,
        usageLimit: parseInt(meta.usage_limit) || undefined,
        usedCount: parseInt(meta.usage_count) || 0,
        perUserLimit: parseInt(meta.usage_limit_per_user) || 1,
        validFrom: new Date(p.post_date),
        validTo: meta.date_expires ? new Date(parseInt(meta.date_expires) * 1000) : new Date("2030-12-31"),
        isActive: true,
      });
      count++;
    } catch {
      // skip
    }
  }
  console.log(`  Inserted ${count} coupons`);
}

async function migrateDeliveryCities(sql, db) {
  console.log("\n--- Migrating Delivery Cities ---");
  const DeliveryCity = db.model("DeliveryCity", DeliveryCitySchema);
  await DeliveryCity.deleteMany({});

  const shipCities = extractInserts(sql, "wp_shiprate_cities");
  const pincodes = extractInserts(sql, "wp_wpzc_pincodes");
  console.log(`  Found ${shipCities.length} cities, ${pincodes.length} pincodes`);

  const cityDocs = {};
  for (const c of shipCities) {
    const name = c.city_name?.trim();
    if (!name) continue;
    cityDocs[name] = {
      city: name, state: ["Mumbai", "Navi Mumbai", "Thane"].includes(name) ? "Maharashtra" : "",
      baseCharge: parseFloat(c.rate) || 0,
      freeDeliveryAbove: name === "Mumbai" ? 0 : 3000,
      isActive: c.status === 1 || c.status === "1",
      estimatedTime: name === "Mumbai" ? "2-4 hours" : "4-8 hours",
      pincodes: [],
    };
  }

  for (const pc of pincodes) {
    const code = String(pc.pincode || "");
    if (!code) continue;
    const num = parseInt(code);
    let city = "Other City";
    if (num >= 400001 && num <= 400599) city = "Mumbai";
    else if (num >= 400600 && num <= 400699) city = "Thane";
    else if (num >= 400700 && num <= 400799) city = "Navi Mumbai";

    if (cityDocs[city]) {
      cityDocs[city].pincodes.push({ code, deliveryDays: parseInt(pc.days) || 0, codAvailable: true });
    }
  }

  const docs = Object.values(cityDocs);
  if (docs.length > 0) await DeliveryCity.insertMany(docs);
  console.log(`  Inserted ${docs.length} delivery cities`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("==========================================");
  console.log("  WooCommerce -> MongoDB Migration");
  console.log("  Pretty Petals Florist");
  console.log("==========================================\n");

  const sql = parseSqlFile(SQL_FILE);

  console.log("Connecting to MongoDB...");
  const db = await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  try {
    const { wpIdToMongoId: categoryMap } = await migrateCategories(sql, db);
    const productMap = await migrateProducts(sql, db, categoryMap);
    await migrateCustomers(sql, db);
    await migrateOrders(sql, db, productMap);
    await migrateBlogs(sql, db);
    await migrateCoupons(sql, db);
    await migrateDeliveryCities(sql, db);

    console.log("\n==========================================");
    console.log("  Migration Complete!");
    console.log("==========================================\n");

    const colls = ["categories", "products", "customers", "orders", "blogs", "coupons", "deliverycities"];
    for (const c of colls) {
      try {
        const n = await db.connection.db.collection(c).countDocuments();
        console.log(`  ${c.padEnd(16)} ${n} documents`);
      } catch { /* collection may not exist */ }
    }
  } finally {
    await mongoose.disconnect();
    console.log("\nDone.");
  }
}

main().catch((err) => { console.error("\nMigration failed:", err); process.exit(1); });
