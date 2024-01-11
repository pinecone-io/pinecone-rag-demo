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
    <div className="rounded-lg overflow-y-scroll flex-grow flex flex-col justify-end h-full">
      {messages.length == 0 && (
        <div className="flex justify-center items-center h-full">
          {withContext ? <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PineconeLogoSvg />
            </div>
            <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
              This is your chatbot powered by pinecone
            </div>
          </div> : <div style={{ ...styles.lightGrey, ...styles.placeholder }}>
            Compare to a chatbot without context
          </div>}
        </div>
      )}
      {messages?.map((messsage, index) => {
        const isAssistant = messsage.role === "assistant";
        const entry = isAssistant && withContext && context && context[Math.floor(index / 2)];

        return (
          <div
            key={index}
            className={`my-2 ml-3 pt-2 transition-shadow duration-200 flex slide-in-bottom`}
          >
            <div className="p-2 flex items-start">
              {messsage.role === "assistant" ? (withContext ? <PineconeIcon /> : <EllipseIcon />) : <UserIcon />}
            </div>
            <div className="ml-2 mt-1.5 flex items-center">
              <div className="flex flex-col">
                <div className="font-bold">
                  {messsage.role === "assistant" ? (withContext ? "Pinecone + OpenAI Model" : "OpenAI Model") : "You"}
                </div>
                <div>{messsage.content}</div>
                {entry && entry.context.length > 0 && (
                  <div className="flex text-xs">
                    <div className="text-[#72788D]">Source:</div>
                    {entry.context.map((chunk, index) => {
                      return (
                        <div key="index">
                          <button onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => handleClick(event, messsage.id, chunk.id)} onMouseLeave={() => handleClose(messsage.id, chunk.id)} className="ml-2">
                            [<span className="px-0.5 text-[#1B17F5] underline" >{index + 1}</span>]
                          </button>
                          <Popover
                            id={messsage.id}
                            open={Boolean(anchorEls[`${messsage.id}-${chunk.id}`])}
                            anchorEl={anchorEls[`${messsage.id}-${chunk.id}`]}
                            onClose={() => handleClose(messsage.id, chunk.id)}
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
                  !withContext && messsage.role === "assistant" && (index == messages.length - 1) && (<div className="mt-1" style={{ color: "#72788D", fontSize: 12 }}>
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
