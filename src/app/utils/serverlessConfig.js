const PINECONE_REGION = process.env.PINECONE_REGION || 'us-west-2'
const PINECONE_CLOUD = process.env.PINECONE_CLOUD || 'aws'
const DIMENSION = process.env.DIMENSION || 1536;

export {
  PINECONE_REGION,
  PINECONE_CLOUD,
  DIMENSION
}

