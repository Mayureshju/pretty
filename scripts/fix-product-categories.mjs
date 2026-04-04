/**
 * Fix product categories: assign ALL WooCommerce categories to each product.
 * The original migration only captured the FIRST category per product.
 * This script re-reads the SQL and adds all matching categories.
 *
 * Run: node scripts/fix-product-categories.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SQL_FILE = resolve(__dirname, "../u458533161_tcw1k.sql");
const MONGO_URI = "mongodb+srv://mayuresh:IoDL89RcuajN2AKz@complianceone.obgaz.mongodb.net/new-test-db?retryWrites=true&w=majority";

function extractInserts(sql, tableName) {
  const rows = [];
  const insertRegex = new RegExp(String.raw`INSERT INTO \x60${tableName}\x60\s*\(([^)]+)\)\s*VALUES\s*`, "gi");
  let match;
  while ((match = insertRegex.exec(sql)) !== null) {
    const columns = match[1].split(",").map(c => c.trim().replace(/`/g, ""));
    const startIdx = match.index + match[0].length;
    const endIdx = findInsertEnd(sql, startIdx);
    const valuesStr = sql.substring(startIdx, endIdx);
    const rowTuples = parseValueTuples(valuesStr);
    for (const tuple of rowTuples) {
      const values = parseRowValues(tuple);
      if (values.length === columns.length) {
        const row = {};
        columns.forEach((col, i) => { row[col] = values[i]; });
        rows.push(row);
      }
    }
  }
  return rows;
}

function findInsertEnd(sql, startIdx) {
  let depth = 0, inStr = false, sCh = "", esc = false;
  for (let i = startIdx; i < sql.length; i++) {
    const c = sql[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === sCh) { if (i + 1 < sql.length && sql[i + 1] === sCh) { i++; continue; } inStr = false; } continue; }
    if (c === "'" || c === '"') { inStr = true; sCh = c; continue; }
    if (c === "(") depth++;
    if (c === ")") depth--;
    if (c === ";" && depth === 0) return i;
  }
  return sql.length;
}

function parseValueTuples(valuesStr) {
  const tuples = [];
  let depth = 0, inStr = false, sCh = "", esc = false, start = -1;
  for (let i = 0; i < valuesStr.length; i++) {
    const c = valuesStr[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (inStr) { if (c === sCh) { if (i + 1 < valuesStr.length && valuesStr[i + 1] === sCh) { i++; continue; } inStr = false; } continue; }
    if (c === "'" || c === '"') { inStr = true; sCh = c; continue; }
    if (c === "(") { if (depth === 0) start = i + 1; depth++; }
    if (c === ")") { depth--; if (depth === 0 && start !== -1) { tuples.push(valuesStr.substring(start, i)); start = -1; } }
  }
  return tuples;
}

function parseRowValues(tuple) {
  const values = [];
  let cur = "", inStr = false, sCh = "", esc = false;
  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i];
    if (esc) { cur += c; esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; cur += c; continue; }
    if (inStr) { if (c === sCh) { if (i + 1 < tuple.length && tuple[i + 1] === sCh) { cur += c; i++; continue; } inStr = false; cur += c; continue; } cur += c; continue; }
    if (c === "'" || c === '"') { inStr = true; sCh = c; cur += c; continue; }
    if (c === ",") { values.push(cleanVal(cur.trim())); cur = ""; continue; }
    cur += c;
  }
  if (cur.trim()) values.push(cleanVal(cur.trim()));
  return values;
}

function cleanVal(val) {
  if (val === "NULL" || val === "null") return null;
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (val.startsWith('"') && val.endsWith('"')) return val.slice(1, -1);
  const num = Number(val);
  if (!isNaN(num) && val !== "") return num;
  return val;
}

async function main() {
  console.log("=== Fix Product Categories ===\n");
  console.log("Reading SQL file...");
  const sql = readFileSync(SQL_FILE, "utf-8");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const termRels = extractInserts(sql, "wp_term_relationships");
  const taxonomy = extractInserts(sql, "wp_term_taxonomy");
  console.log("Term relationships:", termRels.length);
  console.log("Taxonomy entries:", taxonomy.length);

  const taxMap = {};
  taxonomy.forEach(t => { taxMap[t.term_taxonomy_id] = t; });

  const relMap = {};
  termRels.forEach(r => {
    if (!relMap[r.object_id]) relMap[r.object_id] = [];
    relMap[r.object_id].push(r.term_taxonomy_id);
  });

  const categories = await db.collection("categories").find({}).toArray();
  const wpTermIdToMongoId = {};
  categories.forEach(cat => { if (cat.wpTermId) wpTermIdToMongoId[cat.wpTermId] = cat._id; });
  console.log("MongoDB categories:", categories.length);

  const products = await db.collection("products").find({}).toArray();
  console.log("Products:", products.length, "\n");

  let updated = 0, unchanged = 0;

  for (const product of products) {
    if (!product.wpPostId) { unchanged++; continue; }
    const rels = relMap[product.wpPostId] || [];

    const categoryIds = [];
    for (const ttId of rels) {
      const tax = taxMap[ttId];
      if (tax && tax.taxonomy === "product_cat" && wpTermIdToMongoId[tax.term_id]) {
        categoryIds.push(wpTermIdToMongoId[tax.term_id]);
      }
    }

    if (categoryIds.length === 0) { unchanged++; continue; }

    const currentIds = (product.categories || []).map(id => id.toString()).sort();
    const newIds = categoryIds.map(id => id.toString()).sort();

    if (JSON.stringify(currentIds) === JSON.stringify(newIds)) { unchanged++; continue; }

    await db.collection("products").updateOne(
      { _id: product._id },
      { $set: { categories: categoryIds } }
    );
    updated++;
    if (updated % 50 === 0) process.stdout.write("  " + updated + " updated...\r");
  }

  console.log("Updated:", updated, "products");
  console.log("Unchanged:", unchanged, "products");

  console.log("\n--- Verification ---");
  for (const slug of ["roses", "birthday", "anniversary", "flowers", "orchids", "lilies", "cakes", "mixed-flowers", "corporate"]) {
    const cat = await db.collection("categories").findOne({ slug });
    if (cat) {
      const count = await db.collection("products").countDocuments({ categories: cat._id });
      console.log("  " + cat.name + " (" + slug + "): " + count + " products");
    }
  }

  // Update productCount on each category
  console.log("\nUpdating category product counts...");
  for (const cat of categories) {
    const count = await db.collection("products").countDocuments({ categories: cat._id, isActive: true });
    await db.collection("categories").updateOne({ _id: cat._id }, { $set: { productCount: count } });
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch(err => { console.error("Failed:", err); process.exit(1); });
