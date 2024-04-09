'use server';
import { chunkedUpsert } from '@/services/chunkedUpsert';
import { getEmbeddings } from '@/services/embeddings';
import { truncateStringByBytes } from '@/utils/truncateString';
import { Document, MarkdownTextSplitter, RecursiveCharacterTextSplitter } from '@pinecone-database/doc-splitter';
import { Pinecone, PineconeRecord, type RecordMetadata } from '@pinecone-database/pinecone';
import { ServerlessSpecCloudEnum } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import md5 from 'md5';
import loadCSVFile from '@/utils/csvLoader';
import { assignRelation } from '@/services/directory';
import path from 'path';
import { clerkClient } from '@clerk/nextjs';


interface UserDataAssignments {
  [key: string]: {
    [key: string]: boolean
  }
}

interface SeedOptions {
  splittingMethod: string
  chunkSize: number
  chunkOverlap: number,
  usersDataAssignment: UserDataAssignments
}

interface Page {
  url: string;
  content: string;
  category: string;
  title: string;
}

export interface CategorizedRecordMetadata extends RecordMetadata {
  url: string;
  title: string;
  text: string;
  category: string;
  chunk: string;
}

const PINECONE_REGION = process.env.PINECONE_REGION || 'us-west-2'
const PINECONE_CLOUD = process.env.PINECONE_CLOUD || 'aws'

// const dataPath = '../assets/data/acmecorp-data.csv'
const dataPath = path.join(process.env.PROJECT_ROOT!, 'assets', 'data', 'acmecorp-data.csv');

type DocumentSplitter = RecursiveCharacterTextSplitter | MarkdownTextSplitter

function filterRecordsByUserAssignments(
  user: string,
  records: PineconeRecord<CategorizedRecordMetadata>[],
  userDataAssignments: UserDataAssignments
): PineconeRecord<CategorizedRecordMetadata>[] {
  // Filter out the records that include the UserDataAssignments marked as true for the given user
  return records.filter(record => {
    const userAssignments = userDataAssignments[user];
    if (!userAssignments) {
      return false;
    }
  
    return Object.keys(userAssignments).some(assignment => userAssignments[assignment] && record.metadata?.category === assignment);
  });
}

async function seed(indexName: string, options: SeedOptions) {
  try {
    // Initialize the Pinecone client
    const pinecone = new Pinecone();

    // Destructure the options object
    const { splittingMethod, chunkSize, chunkOverlap, usersDataAssignment } = options;

    const { data, meta } = await loadCSVFile(dataPath)
    
    const pages: Page[] = data.map((row: any) => ({ 
      url: row.url,
      content: row.content,
      category: row.category,
      title: row.title
    }))
    // // Choose the appropriate document splitter based on the splitting method
    const splitter: DocumentSplitter = splittingMethod === 'recursive' ?
      new RecursiveCharacterTextSplitter({ chunkSize,
        chunkOverlap }) : new MarkdownTextSplitter({});

    // Prepare documents by splitting the pages
    const documents = await Promise.all(pages.map(page => prepareDocument(page, splitter)));
    

    // Create Pinecone index if it does not exist
    const indexList = await pinecone.listIndexes();
    const indexes = indexList.indexes
    const indexExists = indexes && indexes.some(index => index.name === indexName)
    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536,
        waitUntilReady: true,
        spec: {
          serverless: {
            region: PINECONE_REGION,
            cloud: PINECONE_CLOUD as ServerlessSpecCloudEnum
          }
        }
      });
    }

    const index = pinecone.Index(indexName)
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    await Promise.all(Object.keys(usersDataAssignment).map(async (userId) => {
      const userVectors = filterRecordsByUserAssignments(userId, vectors, usersDataAssignment)
      const userObject = await clerkClient.users.getUser(userId);
      return assignRelation(userObject, userVectors, 'owner');
    }));
    // Upsert vectors into the Pinecone index
    await chunkedUpsert(index, vectors, '', 10);

    // Return the first document
    return documents[0];
  } catch (error) {
    console.error('Error seeding:', error);
    throw error;
  }
}

async function embedDocument(doc: Document): Promise<PineconeRecord<CategorizedRecordMetadata>> {
  try {
    const embedding = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    const metadata: CategorizedRecordMetadata = {      
      url: doc.metadata.url as string,
      text: doc.metadata.text as string,
      category: doc.metadata.category as string,
      chunk: doc.pageContent,
      title: doc.metadata.title as string
    };
    return {
      id: hash,
      values: embedding,
      metadata
    } as PineconeRecord<CategorizedRecordMetadata>;
  } catch (error) {
    console.error('Error embedding document: ', error);
    throw error;
  }
}

async function prepareDocument(page: Page, splitter: DocumentSplitter): Promise<Document[]> {
  // Get the content of the page
  const pageContent = page.content;

  // Split the documents using the provided splitter
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        title: page.title,
        url: page.url,
        // Truncate the text to a maximum byte length
        text: truncateStringByBytes(pageContent, 36000),
        category: page.category
      },
    }),
  ]);

  // Map over the documents and add a hash to their metadata
  return docs.map((doc: Document) => {
    return {
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        // Create a hash of the document content
        hash: md5(doc.pageContent)
      },
    };
  });
}

export default seed;
