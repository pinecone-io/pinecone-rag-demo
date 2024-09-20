import React, { forwardRef, useImperativeHandle, FormEvent, ChangeEvent, useRef, useEffect, useState } from "react";
import {useChat, experimental_useObject as useObject} from 'ai/react';
import Messages from "./Messages";
import type { PineconeRecord } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from 'uuid';

export interface ChatInterface {
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
  handleInputUpdated: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface ChatProps {
  withContext: boolean;
  setContext: (data: { context: PineconeRecord[] }[]) => void;
  context?: { context: PineconeRecord[] }[] | null;
}

const ChatWrapper = forwardRef<ChatInterface, ChatProps>(({ withContext, setContext, context }, ref) => {
  const [finished, setFinished] = useState(false);
  const { messages, input, setInput, append, handleSubmit, handleInputChange, data } = useChat({
    body: {
      withContext
    },
  });

  useEffect(() => {
    if (data?.length) {
      const { context } = data[0] as { context?: PineconeRecord[] };
      if (context) {
        setContext([{ context }]);
      }
    }
  }, [data, setContext]);

  const bottomChatRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<ChatInterface>(null);

  useEffect(() => {      
      if (finished && withContext && context) {
          setContext(context)
          setFinished(false)
      }
  }, [context, finished, withContext, setContext]);

  useEffect(() => {
      bottomChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useImperativeHandle(ref, () => ({
        handleMessageSubmit: (event: FormEvent<HTMLFormElement>) => {
            const id = uuidv4();
            handleSubmit(event, {
                data: {
                    messageId: id,
                },
            })
    },
    handleInputUpdated: (event: ChangeEvent<HTMLInputElement>) => {
            handleInputChange(event)
        },
        withContext,
        ref: chatRef,
  }));

  return (
    <div className="flex-col w-50 overflow-auto h-full" style={{ borderLeft: "1px solid #738FAB1F" }}>
      <div className={`${messages.length > 0 ? "flex flex-col justify-center items-center h-full" : "overflow-auto"}`}>
        {context ? (
          <Messages messages={messages} withContext={withContext} context={context} />
        ) : (
          <Messages messages={messages} withContext={withContext} />
        )}
      </div>
    </div>
  );
});

ChatWrapper.displayName = 'ChatWrapper';

export default ChatWrapper;
