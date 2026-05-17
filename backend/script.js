const { ChromaClient } = require("chromadb");

const client = new ChromaClient({
  path: "http://localhost:8000",
});

(async () => {
  try {
    console.log("\n🔍 Connecting to ChromaDB...\n");

    await client.heartbeat();
    console.log("✅ ChromaDB is alive\n");

    const collections = await client.listCollections();
    console.log("📦 Collections:");
    console.log(collections);

    if (!collections || collections.length === 0) {
      console.log("\n⚠️ No collections found");
      return;
    }

    const name = collections[0]; // ✅ FIX HERE

    console.log(`\n📂 Checking collection: ${name}`);

    const collection = await client.getCollection({
      name,
    });

    const count = await collection.count();
    console.log(`📊 Total documents: ${count}`);

    const data = await collection.get({
      limit: 5,
    });

    console.log("\n📄 Sample data:");
    console.log(JSON.stringify(data, null, 2));

    const results = await collection.query({
      queryTexts: ["fever headache"],
      nResults: 3,
    });

    console.log("\n🔎 Search results:");
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error("\n❌ Error:");
    console.error(err.message);
  }
})();