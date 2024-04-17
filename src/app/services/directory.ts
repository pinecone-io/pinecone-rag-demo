import type { CategorizedRecordMetadata } from '@/api/seed/seed';
import {
  DirectoryServiceV3,
  createAsyncIterable,
  readAsyncIterable,
  ImportMsgCase,
  ImportOpCode,
  objectPropertiesAsStruct
} from '@aserto/aserto-node';
import type { User } from '@clerk/nextjs/dist/types/server';
import type { PineconeRecord, ScoredPineconeRecord } from '@pinecone-database/pinecone';

const directoryClient = DirectoryServiceV3({
  url: process.env.ASERTO_DIRECTORY_SERVICE_URL,
  apiKey: process.env.ASERTO_DIRECTORY_API_KEY,
  tenantId: process.env.ASERTO_TENANT_ID,
  insecure: true,
});


export enum Permission {
    READ = 'read',
    WRITE = 'write',
    DELETE = 'delete',
}

// Function to assign a relation between a user and multiple documents with a specified relation name
export const assignRelation = async (user: User, documents: PineconeRecord<CategorizedRecordMetadata>[], relationName: string) => {  
  // Map each document to a set of operations for setting up user-document relations
  const operations = documents.map((document) => {
    
    // Construct a display name for the user
    const userName = `${user.firstName}${user.lastName ? ' ' : ''}${user.lastName ?? ''}`
    // Create a user object for the directory service
    const userObject = {
      id: user.id,
      type: 'user',
      properties: objectPropertiesAsStruct({
        email: user.emailAddresses[0].emailAddress,
        name: userName,
        picture: user.imageUrl,
      }),
      displayName: userName
    };

    // Create a document object for the directory service
    const documentObject = {
      id: document.id,
      type: 'resource',
      properties: document.metadata ? objectPropertiesAsStruct({
        url: document.metadata.url,
        category: document.metadata.category,
      }) : objectPropertiesAsStruct({}),
      displayName: document.metadata && document.metadata.title ? document.metadata.title as string : '',
    };

    // Define the relation between the user and the document
    const userDocumentRelation = {
      subjectId: user.id,
      subjectType: 'user',
      objectId: document.id,
      objectType: 'resource',
      relation: relationName,
    };

    // Operations to set the user and document objects in the directory
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

    // Operation to set the relation between the user and the document
    const relationOperation: any = {
      opCode: ImportOpCode.SET,
      msg: {
        case: ImportMsgCase.RELATION,
        value: userDocumentRelation,
      },
    };

    // Combine object and relation operations
    return [...objectOperations, relationOperation];
  }).flat();

  try {
    // Create an async iterable from the operations and import them to the directory service
    const importRequest = createAsyncIterable(operations);
    const resp = await directoryClient.import(importRequest);
    // Read and return the result of the import operation
    const result = await (readAsyncIterable(resp))
    return result
  } catch (error) {
    // Log and rethrow any errors encountered during the import
    console.error('Error importing request: ', error);
    throw error;
  }
}
export const getFilteredMatches = async (user: User | null, matches: ScoredPineconeRecord[], permission: Permission) => {  

  // Check if a user object is provided
  if (!user) {
    console.error('No user provided. Returning empty array.')
    return [];
  }

  // Perform permission checks for each match concurrently
  const checks = await Promise.all(matches.map(async (match) => {
    // Construct permission request object
    const permissionRequest = {
      subjectId: user.id, // ID of the user requesting access
      subjectType: 'user', // Type of the subject requesting access
      objectId: match.id, // ID of the object access is requested for
      objectType: 'resource', // Type of the object access is requested for
      permission: 'can_read', // Specific permission being checked
    }

    // Check permission for the constructed request
    const response = await directoryClient.checkPermission(permissionRequest);    
    // Return true if permission granted, false otherwise
    return response ? response.check : false
  }));

  // Filter matches where permission check passed
  const filteredMatches = matches.filter((match, index) => checks[index]);

  // Identify matches where permission check failed
  const matchesThatFailed = matches.filter((match, index) => !checks[index]);
  // Log categories of matches that failed the permission check
  console.log('Categories of matches that failed: ', matchesThatFailed.map(match => match.metadata?.category));

  // Return matches that passed the permission check
  return filteredMatches
}