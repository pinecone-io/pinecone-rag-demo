import Popover from '@mui/material/Popover';
import { PineconeRecord } from "@pinecone-database/pinecone";
import { FC, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';

export interface ICard {
  pageContent: string;
  metadata: {
    hash: string;
  };
  id: string
}

interface ICardProps {
  card: ICard;
  context: { context: PineconeRecord[] }[] | null;
  id: string;
  index: number;
}

export const Card: FC<ICardProps> = ({ card, index, context }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const myRef = useRef(null);

  const handleClose = () => {
    setAnchorEl(null);
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  return (
    <div
      id={card.id}
      className={"mb-4"}
    >
      <div className="flex-col w-full">
        <div className="flex w-full">
          <div className="mr-2 text-[#72788D]">{index}</div>
          <>
            <button className="w-full" onMouseLeave={() => handleClose()} onMouseEnter={(event: React.MouseEvent<HTMLButtonElement>) => handleClick(event)}>
              <div className="markdown-container">
                <ReactMarkdown
                  disallowedElements={["img"]}
                  className="markdown-content"
                  components={{ p: 'span' }}
                >
                  {card.pageContent.replace(/\n/g, ' ')}
                </ReactMarkdown>
              </div>
            </button>
            <Popover
              id={card.id}
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => handleClose()}
              disableRestoreFocus
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              sx={{
                pointerEvents: 'none',
              }}
            >
              <div className="p-2 max-h-[300px] max-w-[300px] overflow-scroll">
                <ReactMarkdown>{card.pageContent}</ReactMarkdown>
              </div>
            </Popover>
          </>

        </div>
      </div>
      {/* <div className="flex"> 
        {selected && selected.includes(card.metadata.hash) && <BlueEllipseSvg />}
        <b className="text-xs mt-2" style={{ color: "#72788D", fontWeight: 400 }}>
          ID: {card.metadata.hash}
        </b>
      </div>*/}
    </div>
  )

};
