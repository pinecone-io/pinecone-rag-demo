import {
    DirectoryServiceV3,
    createAsyncIterable,
    readAsyncIterable,
} from "@aserto/aserto-node";
import { NotFoundError } from "@aserto/aserto-node";
import type { PineconeRecord } from "@pinecone-database/pinecone";

const directoryClient = DirectoryServiceV3({
    url: process.env.ASERTO_DIRECTORY_SERVICE_URL,
    apiKey: process.env.ASERTO_DIRECTORY_API_KEY,
    tenantId: process.env.ASERTO_TENANT_ID,
    insecure: true,
});



interface Object {
    id: string;
    type: string;
    properties: Record<string, any>;
    displayName: string;
}

interface Relation {
    subjectId: string;
    subjectType: string;
    objectId: string;
    objectType: string;
    relation: string;
}

interface ImportRequestMessage {
    case: "object" | "relation";
    value: Object | Relation;
}

interface ImportOperation {
    opCode: number;
    msg: ImportRequestMessage;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export const assignRelation = async (user: User, documents: PineconeRecord[], relationName: string) => {
    const objectCase = "object" as const;
    const relationCase = "relation" as const;

    const operations = documents.map((document, docKey) => {
        const userObject = {
            id: user.id,
            type: "user",
            properties: {
                email: user.email,
                name: user.name,
                role: user.role,
            },
            displayName: user.name,
        };

        const documentObject = {
            id: document.id,
            type: "document",
            properties: document.metadata ? document.metadata : {},
            displayName: document.metadata && document.metadata.title ? document.metadata.title as string : "",
        };

        const userDocumentRelation = {
            subjectId: user.id,
            subjectType: "user",
            objectId: document.id,
            objectType: "document",
            relation: relationName,
        };

        const objectOperations: any[] = [
            {
                opCode: docKey,
                msg: {
                    case: objectCase,
                    value: userObject,
                },
            },
            {
                opCode: docKey,
                msg: {
                    case: objectCase,
                    value: documentObject,
                },
            }
        ];

        const relationOperation: any = {
            opCode: docKey,
            msg: {
                case: relationCase,
                value: userDocumentRelation,
            },
        };

        return [...objectOperations, relationOperation];
    }).flat();

    const importRequest = createAsyncIterable(operations);
    try {
        await directoryClient.import(importRequest);
    } catch (error) {
        console.error("Error importing request: ", error);
        throw error;
    }
}