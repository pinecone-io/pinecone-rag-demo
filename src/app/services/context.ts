import type { PineconeRecord } from "@pinecone-database/pinecone";
import { getEmbeddings } from './embeddings';
import { getMatchesFromEmbeddings } from "./pinecone";
import { Permission, getFilteredMatches } from "./directory";

export type Metadata = {
  url: string,
  text: string,
  chunk: string,
}

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (message: string, namespace: string, maxTokens = 3000, minScore = 0.7, getOnlyText = true): Promise<PineconeRecord[]> => {

  // Get the embeddings of the input message
  const embedding = await getEmbeddings(message);

  // Retrieve the matches for the embeddings from the specified namespace
  const matches = await getMatchesFromEmbeddings(embedding, 10, namespace);
  const rick = {
    id: 'rick@the-citadel.com',
    picture: "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg",
    email: 'rick@the-citadel.com',
    name: 'Rick Sanchez',
    roles: ['admin']
  }

  const user = rick;
  const filteredMatches = await getFilteredMatches(user, matches, Permission.READ);

  console.log(filteredMatches);
  // Filter out the matches that have a score lower than the minimum score
  const qualifyingDocs = filteredMatches.filter(m => m.score && m.score > minScore);

  return qualifyingDocs


}
