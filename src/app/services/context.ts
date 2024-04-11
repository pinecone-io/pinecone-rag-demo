import type { PineconeRecord } from '@pinecone-database/pinecone';
import { getEmbeddings } from './embeddings';
import { getMatchesFromEmbeddings } from './pinecone';
import { Permission, getFilteredMatches } from './directory';
import type { User } from '@clerk/nextjs/dist/types/server';

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
}

export interface ContextResponse {
  documents: PineconeRecord[]
  accessNotice: boolean,
  noMatches: boolean
}

export function isContextResponse(obj: any): obj is ContextResponse {
  return obj && obj.documents !== undefined && obj.accessNotice !== undefined && obj.noMatches !== undefined;
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async ({ message, namespace, maxTokens = 3000, minScore = 0.95, getOnlyText = true, user }:
  { message: string, namespace: string, maxTokens?: number, minScore?: number, getOnlyText?: boolean, user: User | null }): Promise<ContextResponse> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 10, namespace);

  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = matches.filter(m => m.score && m.score > minScore);
  let noMatches = qualifyingDocs.length === 0;

  const filteredMatches = await getFilteredMatches(user, qualifyingDocs, Permission.READ);
  
  let accessNotice = false

  if (filteredMatches.length < matches.length) {
    accessNotice = true
  }

  return {
    documents: filteredMatches,
    accessNotice,
    noMatches
  }
}
