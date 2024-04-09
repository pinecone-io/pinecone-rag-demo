import type { PineconeRecord } from '@pinecone-database/pinecone';
import { useChat } from 'ai/react';
import React, { ChangeEvent, FormEvent, Ref, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Messages from './Messages';

export interface ChatInterface {
    handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => void;
    handleInputUpdated: (event: ChangeEvent<HTMLInputElement>) => void;
    ref: Ref<ChatInterface>;
    withContext: boolean;
}

interface ChatProps {
    withContext: boolean;
    setContext: (data: { context: PineconeRecord[] }[]) => void;
    context?: { context: PineconeRecord[], accessNotice: boolean }[] | null;
    ref: Ref<ChatInterface>
}

const Chat: React.FC<ChatProps> = forwardRef<ChatInterface, ChatProps>(({ withContext, setContext, context }, ref) => {
  const [finished, setFinished] = React.useState<boolean>(false)
  const { messages, handleInputChange, handleSubmit, data } = useChat({
    sendExtraMessageFields: true,
    body: {
      withContext,
    },
    onFinish: () => {
      setFinished(true)
    }
  });

  const bottomChatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (finished && withContext && data) {
      setContext(data as { context: PineconeRecord[] }[]) // Logs the additional data
      setFinished(false)
    }
  }, [data, finished, withContext, setContext]);

  useEffect(() => {
    bottomChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const chatRef = useRef<ChatInterface>(null);

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
    <div className="flex-col w-50 overflow-auto h-full" style={{ borderLeft: '1px solid #738FAB1F' }}>
      <div className={`${messages.length == 0 ? 'flex flex-col justify-center items-center h-full' : 'overflow-auto'}`}>
        {context ? <Messages messages={messages} withContext={withContext} context={context} /> : <Messages messages={messages} withContext={withContext} />}
        <div ref={bottomChatRef} />
      </div>
    </div >
  );
});


Chat.displayName = 'Chat';

export default Chat;
