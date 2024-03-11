import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { PoolConfig } from "pg";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

// First, follow set-up instructions at
// https://js.langchain.com/docs/modules/indexes/vector_stores/integrations/pgvector

async function main() {
  const config = {
    postgresConnectionOptions: {
      type: "postgres",
      host: "127.0.0.1",
      port: 5431,
      user: "locallm",
      password: "locallm",
      database: "llmchat",
    } as PoolConfig,
    tableName: "embeddings",
    columns: {
      idColumnName: "id",
      vectorColumnName: "embeddings",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
  };
  const embeddings = new OllamaEmbeddings({
    model: "mistral:7b", // default value
    baseUrl: "http://localhost:11434", // default value
  });
  const pgvectorStore = await PGVectorStore.initialize(
    embeddings,
    config
  );

  await pgvectorStore.addDocuments([
    { pageContent: "what's this", metadata: { a: 2 } },
    { pageContent: "Cat drinks milk", metadata: { a: 1 } },
  ]);

  const results = await pgvectorStore.similaritySearch("water", 1);

  console.log(results);

  /*
    [ Document { pageContent: 'Cat drinks milk', metadata: { a: 1 } } ]
  */

// Filtering is supported
  const results2 = await pgvectorStore.similaritySearch("water", 1, {
    a: 2,
  });

  console.log(results2);

  /*
    [ Document { pageContent: 'what's this', metadata: { a: 2 } } ]
  */

// Filtering on multiple values using "in" is supported too
  const results3 = await pgvectorStore.similaritySearch("water", 1, {
    a: {
      in: [2],
    },
  });

  console.log(results3);

  /*
    [ Document { pageContent: 'what's this', metadata: { a: 2 } } ]
  */

  await pgvectorStore.delete({
    filter: {
      a: 1,
    },
  });

  const results4 = await pgvectorStore.similaritySearch("water", 1);

  console.log(results4);

  /*
    [ Document { pageContent: 'what's this', metadata: { a: 2 } } ]
  */

  await pgvectorStore.end();
}

main().then(r => {
  console.log(r);
});
