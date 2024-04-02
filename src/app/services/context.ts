import type { PineconeRecord } from "@pinecone-database/pinecone";
import { getEmbeddings } from './embeddings';
import { getMatchesFromEmbeddings } from "./pinecone";
import { Permission, getFilteredMatches } from "./directory";

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
export const getContext = async (message: string, namespace: string, maxTokens = 3000, minScore = 0.95, getOnlyText = true): Promise<ContextResponse> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 10, namespace);

  let noMatches = matches.length === 0;

  const rick = {
    id: 'rick@the-citadel.com',
    picture: "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg",
    email: 'rick@the-citadel.com',
    name: 'Rick Sanchez',
    roles: ['admin']
  }

  const morty = {
    "id": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg",
    "roles": [
      "editor"
    ],
  }

  const user = morty;
  const filteredMatches = await getFilteredMatches(user, matches, Permission.READ);

  // console.log(filteredMatches);
  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = filteredMatches.filter(m => m.score && m.score > minScore);
  let accessNotice = false

  if (filteredMatches.length < matches.length) {
    accessNotice = true
  }

  return {
    documents: qualifyingDocs,
    accessNotice,
    noMatches
  }
}
