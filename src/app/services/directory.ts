import {
    DirectoryServiceV3,
    createAsyncIterable,
    readAsyncIterable,
    ImportMsgCase,
    ImportOpCode,
    objectPropertiesAsStruct
} from "@aserto/aserto-node";
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

    const operations = documents.map((document, docKey) => {
        const userObject = {
            id: user.id,
            type: "user",
            properties: objectPropertiesAsStruct({
                email: user.email,
                name: user.name,
                role: user.role,
            }),
            displayName: user.name,
        };

        const documentObject = {
            id: document.id,
            type: "resource",
            properties: document.metadata ? objectPropertiesAsStruct({
                url: document.metadata.url,
                hash: document.metadata.hash,
            }) : objectPropertiesAsStruct({}),
            displayName: document.metadata && document.metadata.title ? document.metadata.title as string : "",
        };

        const userDocumentRelation = {
            subjectId: user.id,
            subjectType: "user",
            objectId: document.id,
            objectType: "resource",
            relation: relationName,
        };

        const objectOperations: any[] = [
            {
                opCode: ImportOpCode.SET,
                msg: {
                    case: ImportMsgCase.OBJECT,
                    value: userObject,
                },
            },
            {
                opCode: ImportOpCode.SET,
                msg: {
                    case: ImportMsgCase.OBJECT,
                    value: documentObject,
                },
            }
        ];

        const relationOperation: any = {
            opCode: ImportOpCode.SET,
            msg: {
                case: ImportMsgCase.RELATION,
                value: userDocumentRelation,
            },
        };

        return [...objectOperations, relationOperation];
    }).flat();


    try {
        const importRequest = createAsyncIterable(operations);
        const resp = await directoryClient.import(importRequest);
        return await (readAsyncIterable(resp))
    } catch (error) {
        console.error("Error importing request: ", error);
        throw error;
    }
}