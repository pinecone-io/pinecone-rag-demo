export interface Object {
    id: string;
    type: string;
    properties: Record<string, any>;
    displayName: string;
}


export interface Relation {
    subjectId: string;
    subjectType: string;
    objectId: string;
    objectType: string;
    relation: string;
}

export interface ImportRequestMessage {
    case: 'object' | 'relation';
    value: Object | Relation;
}

export interface ImportOperation {
    opCode: number;
    msg: ImportRequestMessage;
}