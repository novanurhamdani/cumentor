import { Pinecone } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: {
      pageNumber: number;
    };
  };
};

export const getPineconeClient = () => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

export async function loadS3IntoPinecone(fileKey: string) {
  // 1. Obtain the PDF file from S3 - Download and Read the file
  const file_name = await downloadFromS3(fileKey);

  if (!file_name) {
    throw new Error("could not download from s3");
  }

  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. Prepare the document for Pinecone
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. Vectorize and embed the individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));

  // 4. Upload to Pinecone
  const client = await getPineconeClient();
  const pineconeIndex = await client.index("cumentor");

  const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

  await namespace.upsert(vectors);

  return documents[0];
}

async function embedDocument(doc: Document) {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embedding,
      metadata: {
        pageNumber: doc.metadata.pageNumber as number,
        text: doc.metadata.text as string,
      },
    };
  } catch (error) {
    console.error("Error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, maxBytes: number) => {
  const encodedString = new TextEncoder().encode(str);
  const truncatedString = new TextDecoder("utf-8").decode(
    encodedString.slice(0, maxBytes)
  );
  return truncatedString;
};

async function prepareDocument(page: PDFPage) {
  let { pageContent } = page;

  pageContent = pageContent.replace(/\n/g, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: page.metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);

  return docs;
}
