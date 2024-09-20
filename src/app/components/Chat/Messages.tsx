import { EllipseIcon } from "@/assets/icons/ellipse";
import { PineconeIcon } from "@/assets/icons/pinecone";
import { UserIcon } from "@/assets/icons/user";
import { PineconeLogoSvg } from "@/assets/svg/pineconeLogo";
import { Typography } from "@mui/material";
import Popover from "@mui/material/Popover";
import type { PineconeRecord } from "@pinecone-database/pinecone";
import { Message } from "ai";
import { useRef, useState } from "react";

export default function Messages({ messages, withContext, context }: { messages: Message[], withContext: boolean, context?: { context: PineconeRecord[] }[] }) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [anchorEls, setAnchorEls] = useState<{ [key: string]: HTMLButtonElement | null }>({});

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>, messageId: string, chunkId: string) => {
    setAnchorEls(prev => ({ ...prev, [`${messageId}-${chunkId}`]: event.currentTarget }));
  };

  // Handle close function
  const handleClose = (messageId: string, chunkId: string) => {
    setAnchorEls(prev => ({ ...prev, [`${messageId}-${chunkId}`]: null }));
  };

  const styles = {
    lightGrey: {
      color: "#72788D"
    },
    placeholder: {
      fontSize: 12,
      marginTop: 10,
    }
  }

  return (
    <div className="rounded-lg overflow-y-scroll flex-grow flex flex-col justify-end h-full pr-5">
      {messages.length == 0 && (
        <div className="flex h-full w-full justify-center items-center">
          <div className="text-center">
            {withContext ? (
              <>
                <div className="flex justify-center">
                  <PineconeLogoSvg />
                </div>
                <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
                  This is your chatbot powered by pinecone
                </div>
              </>
            ) : (
              <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
                Compare to a chatbot without context
              </div>
            )}
          </div>
        </div>
      )}
      {messages?.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const entry = isAssistant && withContext && context && context[Math.floor(index / 2)];
        
        return (
          <div
            key={message.id}
            className={`my-2 ml-3 pt-2 transition-shadow duration-200 flex slide-in-bottom`}
          >
            <div className="p-2 flex items-start">
              {message.role === "assistant" ? (withContext ? <PineconeIcon /> : <EllipseIcon />) : <UserIcon />}
            </div>
            <div className="ml-2 mt-1.5 flex items-center">
              <div className="flex flex-col">
                <div className="font-bold">
                  {message.role === "assistant" ? (withContext ? "Pinecone + OpenAI Model" : "OpenAI Model") : "You"}
                </div>
                <div>{message.content}</div>
                {entry && entry.context.length > 0 && (
                  <div className="flex text-xs">
                    <div className="text-[#72788D]">Source:</div>
                    {entry.context.map((chunk, index) => {
                      return (
                        <div key={index}>
                          <button onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => handleClick(event, message.id, chunk.id)} onMouseLeave={() => handleClose(message.id, chunk.id)} className="ml-2">
                            [<span className="px-0.5 text-[#1B17F5] underline" >{index + 1}</span>]
                          </button>
                          <Popover
                            id={message.id}
                            open={Boolean(anchorEls[`${message.id}-${chunk.id}`])}
                            anchorEl={anchorEls[`${message.id}-${chunk.id}`]}
                            onClose={() => handleClose(message.id, chunk.id)}
                            disableRestoreFocus
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'center',
                            }}
                            transformOrigin={{
                              vertical: 'bottom',
                              horizontal: 'center',
                            }}
                            sx={{
                              width: "60%",
                              pointerEvents: 'none',
                            }}
                          >
                            <div key={index} className="p-2">
                              <Typography sx={{ fontSize: 12, fontWeight: 400 }}>
                                {chunk.metadata?.chunk}
                              </Typography>
                            </div>
                          </Popover>
                        </div>
                      )
                    })}
                  </div>

                )
                }
                {
                  !withContext && message.role === "assistant" && (index == messages.length - 1) && (<div className="mt-1" style={{ color: "#72788D", fontSize: 12 }}>
                    This answer may be speculative or inaccurate.
                  </div>)
                }
              </div>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
