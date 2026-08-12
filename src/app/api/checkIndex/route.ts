import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from "next/server";
import { ServerlessSpecCloudEnum } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import {
    PINECONE_REGION,
    PINECONE_CLOUD,
    DIMENSION
} from "@/utils/serverlessConfig"

export async function POST() {
    // Instantiate a new Pinecone client
    const pinecone = new Pinecone();
    // Select the desired index
    const indexName = process.env.PINECONE_INDEX!;

    // Create the index if it doesn't already exist, 
    // but do not throw an error if it does already exist
    await pinecone.createIndex({
        name: indexName,
        dimension: Number(DIMENSION),
        suppressConflicts: true,
        waitUntilReady: true,
        spec: {
            serverless: {
                region: PINECONE_REGION,
                cloud: PINECONE_CLOUD as ServerlessSpecCloudEnum,
            }
        }
    })

    const index = pinecone.Index(indexName);

    // Use the custom namespace, if provided, otherwise use the default
    const namespaceName = process.env.PINECONE_NAMESPACE ?? ''
    const namespace = index.namespace(namespaceName)

    // Delete everything within the namespace
    const stats = await namespace.describeIndexStats()

    return NextResponse.json({
        ...stats
    })
}
