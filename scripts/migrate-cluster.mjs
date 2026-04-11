/**
 * Migrate all collections from one MongoDB cluster to another.
 *
 * Source:      MONGO_URI     (new-test-db on complianceone cluster)
 * Destination: NEW_MONGO_URI (pretty-petals on pretty cluster)
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-cluster.mjs --dry-run   # preview
 *   node --env-file=.env.local scripts/migrate-cluster.mjs              # execute
 */

import mongoose from "mongoose";

const { MongoClient } = mongoose.mongo;

const SRC_URI = process.env.MONGO_URI;
const DST_URI = process.env.NEW_MONGO_URI;
const DRY_RUN = process.argv.includes("--dry-run");

if (!SRC_URI) {
  console.error("MONGO_URI environment variable is required");
  process.exit(1);
}
if (!DST_URI) {
  console.error("NEW_MONGO_URI environment variable is required");
  process.exit(1);
}

async function main() {
  console.log(`\nMongoDB Cluster Migration${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  const srcClient = new MongoClient(SRC_URI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 120000,
  });
  const dstClient = new MongoClient(DST_URI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 120000,
  });

  try {
    await Promise.all([srcClient.connect(), dstClient.connect()]);
    console.log("Connected to both clusters\n");

    const srcDb = srcClient.db();
    const dstDb = dstClient.db();

    console.log(`Source DB:      ${srcDb.databaseName}`);
    console.log(`Destination DB: ${dstDb.databaseName}\n`);

    const collections = await srcDb.listCollections().toArray();
    const collectionNames = collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith("system."))
      .sort();

    console.log(`Found ${collectionNames.length} collections\n`);

    const results = [];

    for (let i = 0; i < collectionNames.length; i++) {
      const name = collectionNames[i];
      const srcCol = srcDb.collection(name);
      const srcCount = await srcCol.countDocuments();
      const indexes = await srcCol.indexes();
      const customIndexes = indexes.filter((idx) => idx.name !== "_id_");

      console.log(
        `[${i + 1}/${collectionNames.length}] ${name}: ${srcCount} documents, ${customIndexes.length} custom indexes`
      );

      if (DRY_RUN) {
        results.push({ name, srcCount, dstCount: "-", docsInserted: "-", indexesCopied: "-" });
        continue;
      }

      const dstCol = dstDb.collection(name);

      // Copy documents
      let docsInserted = 0;
      if (srcCount > 0) {
        const docs = await srcCol.find({}).toArray();
        try {
          const result = await dstCol.insertMany(docs, { ordered: false });
          docsInserted = result.insertedCount;
        } catch (err) {
          if (err.code === 11000 || err.name === "MongoBulkWriteError") {
            docsInserted = err.result?.insertedCount ?? 0;
            const dupes = srcCount - docsInserted;
            console.log(`  -> ${docsInserted} inserted, ${dupes} skipped (already exist)`);
          } else {
            throw err;
          }
        }
      }

      // Copy indexes
      let indexesCopied = 0;
      for (const idx of customIndexes) {
        const { key, v, ns, ...options } = idx;
        try {
          await dstCol.createIndex(key, options);
          indexesCopied++;
        } catch (err) {
          if (err.code === 85 || err.code === 86) {
            indexesCopied++;
            continue;
          }
          console.warn(`  Warning: index "${idx.name}" failed: ${err.message}`);
        }
      }

      const dstCount = await dstCol.countDocuments();
      console.log(`  -> ${docsInserted} docs inserted, ${indexesCopied} indexes copied`);

      results.push({ name, srcCount, dstCount, docsInserted, indexesCopied });
    }

    // Verification table
    console.log("\n" + "=".repeat(70));
    console.log("VERIFICATION");
    console.log("=".repeat(70));
    console.log(
      `${"Collection".padEnd(25)} ${"Source".padStart(10)} ${"Destination".padStart(12)} ${"Match".padStart(8)}`
    );
    console.log("-".repeat(70));

    let allMatch = true;
    for (const r of results) {
      const match = DRY_RUN ? "-" : r.srcCount === r.dstCount ? "OK" : "MISMATCH";
      if (match === "MISMATCH") allMatch = false;
      console.log(
        `${r.name.padEnd(25)} ${String(r.srcCount).padStart(10)} ${String(r.dstCount).padStart(12)} ${match.padStart(8)}`
      );
    }

    console.log("-".repeat(70));
    if (!DRY_RUN) {
      console.log(allMatch ? "\nAll collections match!\n" : "\nSome collections have mismatches — check above.\n");
    } else {
      console.log("\nDry run complete. No data was copied.\n");
    }
  } finally {
    await Promise.all([srcClient.close(), dstClient.close()]);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
