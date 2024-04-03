import express from 'express';
import multer from 'multer';
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { PoolConfig } from "pg";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers"
import { Ollama } from "@langchain/community/llms/ollama";

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const upload = multer({ dest: 'uploads/' })
const ollamaHost = process.env.OLLAMA_HOST ?? 'ollama';
const ollamaPort = process.env.OLLAMA_PORT ?? '11434';
const postgresHost = process.env.POSTGRES_HOST ?? 'postgres';
const postgresPort = process.env.POSTGRES_PORT ?? 5432;
const postgresDb = process.env.POSTGRES_DB ?? 'llmchat';
const postgresUser = process.env.POSTGRES_USER ?? 'locallm';
const postgresPassword = process.env.POSTGRES_PASSWORD ?? 'locallm';

const app = express();

app.post('/api/datasets', upload.single('file'), async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  try {
    await trainDataSets(`${req.file.destination}${req.file.filename}`, req.file.mimetype);
    res.send({ file: req.file, body: req.body });
  } catch (e) {
    console.log(e);
    res.send({ error: e });
  }
});
app.get('/api/ask', async (req: any, res) => {
  console.log('api called', ollamaHost);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  console.log('chunks', req.query.q);
  try {
    const chunks = await ask(req.query.q);
    console.log(chunks);
    res.send({ message: chunks });
  } catch (e) {
    console.log(e);
    res.send({ error: e });
  }
});

app.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

async function trainDataSets(docPath: string, type: string) {
  const config = getPgVectorConfig();
  const embeddings = getOllamaEmbeddings();
  let loader: PDFLoader | TextLoader;
  if (type === 'application/pdf') {
    console.log('PDF', type)
    loader= new PDFLoader(docPath);
  } {
    console.log('TEXT')
    loader= new TextLoader(docPath);
  }
  const docs = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:1000,
    separators: ['\n\n','\n',' ',''],
    chunkOverlap: 200
  });
  const docsOutput = await splitter.splitDocuments(docs);
  const pgvectorStore = await PGVectorStore.initialize(
    embeddings,
    config
  );
  await pgvectorStore.addDocuments(docsOutput);
  await pgvectorStore.end();
}

async function ask(userQ: string) {
  const config = getPgVectorConfig();
  const embeddings = getOllamaEmbeddings();
  const ollamaLlm = getOllama();
  const pgvectorStore = await PGVectorStore.initialize(
    embeddings,
    config
  );

  const userQuestion = userQ;
  const prompt = PromptTemplate.fromTemplate(`
    For following user question convert it into a standalone question
    {userQuestion}
  `);
  const questionChain = prompt.pipe(ollamaLlm)
    .pipe(new StringOutputParser())
    .pipe(pgvectorStore.asRetriever());
  const documents = await questionChain.invoke({
    userQuestion: userQuestion
  });
  const combinedDocs = combineDocuments(documents);
  const questionTemplate = PromptTemplate.fromTemplate(`
    Answer the below question using the context.
    Strictly use the context and answer in crisp and point to point.
    <context>
    {context}
    </context>

    question: {userQuestion}
`)
  const answerChain = questionTemplate.pipe(ollamaLlm);
  const llmResponse = await answerChain.invoke({
    context: combinedDocs,
    userQuestion: userQuestion
  });
  console.log("Printing llm response --> ",llmResponse);
  await pgvectorStore.end();
  return llmResponse;
}

function combineDocuments(docs) {
  return docs.map((doc) => doc.pageContent).join('\n\n');
}

function getPgVectorConfig() {
  return {
    postgresConnectionOptions: {
      type: "postgres",
      host: postgresHost,
      port: postgresPort,
      user: postgresUser,
      password: postgresPassword,
      database: postgresDb,
    } as PoolConfig,
    tableName: "langchain",
    columns: {
      idColumnName: "id",
      vectorColumnName: "vector",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
  };
}

function getOllamaEmbeddings(): OllamaEmbeddings {
  return new OllamaEmbeddings({
    model: "tinydolphin",
    baseUrl: `http://${ollamaHost}:${ollamaPort}`,
  });
}

function getOllama(): Ollama {
  return new Ollama({
    model: "tinydolphin",
    baseUrl: `http://${ollamaHost}:${ollamaPort}`,
  });
}
