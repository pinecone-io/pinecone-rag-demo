import AppContext from "@/appContext";
import { Button } from "@material-tailwind/react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React, { useContext, useState } from "react";
import Header from "../Header";
import { Card, ICard } from "./Card";
import { InfoPopover } from "./InfoPopover";
import { RecursiveSplittingOptions } from "./RecursiveSplittingOptions";
import { urls } from "./urls";
import { clearIndex, crawlDocument } from "./utils";

const styles: Record<string, React.CSSProperties> = {
  contextWrapper: {
    display: "flex",
    padding: "var(--spacer-huge, 64px) var(--spacer-m, 32px) var(--spacer-m, 32px) var(--spacer-m, 32px)",
    alignItems: "flex-start",
    gap: "var(--Spacing-0, 0px)",
    alignSelf: "stretch",
    backgroundColor: "#FBFBFC",
    fontSize: 14
  },
  textHeaderWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch"
  },
  entryUrl: {
    fontSize: 'small',
    color: 'grey',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: "400px"
  },
  h4: {
    fontWeight: 600, marginBottom: 8, fontSize: 16
  },
  h7: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  }
}


export const Sidebar: React.FC = () => {
  const [entries, setEntries] = useState(urls);
  const [cards, setCards] = useState<ICard[]>([]);
  const [splittingMethod, setSplittingMethod] = useState<string>("markdown");
  const [chunkSize, setChunkSize] = useState<number>(256);
  const [overlap, setOverlap] = useState<number>(1);
  const [url, setUrl] = useState<string>(entries[0].url);
  const [clearIndexComplete, setClearIndexCompleteMessageVisible] = useState<boolean>(false)
  const [crawling, setCrawling] = useState<boolean>(false)
  const [crawlingDoneVisible, setCrawlingDoneVisible] = useState<boolean>(false)

  const { refreshIndex } = useContext(AppContext);

  const handleUrlChange = (event: SelectChangeEvent<typeof url>) => {
    const {
      target: { value },
    } = event;
    setUrl(value)
  }

  const handleSplittingMethodChange = (event: SelectChangeEvent<typeof splittingMethod>) => {
    const {
      target: { value },
    } = event;
    setSplittingMethod(value)
  }

  const handleEmbedAndUpsertClick = async () => {
    setCrawling(true)
    await crawlDocument(
      url,
      setEntries,
      setCards,
      splittingMethod,
      chunkSize,
      overlap
    )

    setCrawling(false)
    setCrawlingDoneVisible(true)
    setTimeout(() => {
      setCrawlingDoneVisible(false)
      console.log("it's time")
      refreshIndex()
    }, 2000)
  }

  const handleClearIndexClick = async () => {
    await clearIndex(setEntries, setCards)
    setClearIndexCompleteMessageVisible(true)
    refreshIndex()
    setTimeout(() => {
      setClearIndexCompleteMessageVisible(false)
    }, 2000)
  }

  const menuItems = entries.map((entry, key) => (
    <MenuItem

      key={key} value={entry.url}
    ><div className="flex-col" data-testid={entry.url}>
        <div>{entry.title}</div>
        <div style={{ ...styles.entryUrl, whiteSpace: 'nowrap' as 'nowrap' }}>{entry.url}</div>
      </div>
    </MenuItem>
  ));


  return (
    <div
      className="w-full"
      style={{ ...styles.contextWrapper, flexDirection: "column" as "column" }}
    >
      <div style={{ ...styles.textHeaderWrapper, flexDirection: "column" as "column" }} className="w-full">
        <Header />
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          This RAG chatbot uses Pinecone and Vercel&apos;s AI SDK to demonstrate a URL crawl, data chunking and embedding, and semantic questioning.
        </div>
      </div>
      <div className="flex flex-column w-full" style={{ ...styles.textHeaderWrapper, flexDirection: "column", }}>
        <div className="mb-6 w-full">
          <h4 style={styles.h4}>Select demo url to index</h4>
          <Select className="w-full" value={url} data-testid="url-selector" onChange={handleUrlChange} IconComponent={ExpandMoreIcon} MenuProps={{
            keepMounted: true,
            PaperProps: {
              style: {
                width: 'fit-content',
                marginLeft: 15,
                marginTop: 10,
              },
            },
          }}>
            {menuItems}
          </Select>
        </div>
        <div className="mb-6 w-full">
          <h4 style={styles.h4} className="flex items-center">
            <div>Chunking method</div>
            <InfoPopover
              className="ml-1"
              infoText="The chunking method determines how documents are split into smaller chunks for vector embedding to accommodate size limits. Overlapping content between chunks preserves context, improving search relevance."
            />
          </h4>
          <Select IconComponent={ExpandMoreIcon} value={splittingMethod} className="w-full" onChange={handleSplittingMethodChange}
            renderValue={(value) => {
              if (value === "markdown") {
                return "Markdown Chunking";
              } else if (value === "recursive") {
                return "Recursive Chunking";
              }
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  marginTop: 10,
                  marginLeft: 15,
                  width: '30%',
                }
              }
            }} >
            {/* Using tailwind here resulted in broken css when deployed on Vercel */}
            <MenuItem value="markdown" style={{ maxWidth: '100%', overflow: 'auto', whiteSpace: 'normal' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>Markdown chunking</div>
                <div style={{ fontSize: 14, color: 'grey' }}>Markdown chunking leverages the structure of the document itself, creating chunks that correlate to the markdown semantics of the content. The crawler converts the URL content to markdown and then applies the markdown chunking methods on the content.</div>
              </div>
            </MenuItem>
            <MenuItem value="recursive" style={{ maxWidth: '100%', overflow: 'auto', whiteSpace: 'normal' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>Recursive Chunking</div>
                <div style={{ fontSize: 14, color: 'grey' }}>With recursive chunking, the text will be divided into smaller parts in each recursion step, based on the chunk size you define. The overlap will ensure that the chunks include content found in adjacent chunks so that no content is lost.  </div>
              </div>

            </MenuItem>
          </Select>
        </div>
        {splittingMethod === "recursive" && (
          <RecursiveSplittingOptions
            chunkSize={chunkSize}
            setChunkSize={setChunkSize}
            overlap={overlap}
            setOverlap={setOverlap}
          />
        )}
        <Button
          className={`mb-6 duration-100 button-primary ${crawlingDoneVisible ? "bg-green-500" : "bg-blue-700"} text-white font-medium px-8 py-3 transition-all duration-500 ease-in-out`}
          onClick={handleEmbedAndUpsertClick}
          style={{ backgroundColor: `${crawlingDoneVisible ? "#15B077" : "#1B17F5"}`, textTransform: 'none', fontSize: 14, borderRadius: 4, padding: '12px 22px', fontWeight: 400 }}
          placeholder="" onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined}        >
          {!crawling ? (crawlingDoneVisible ? "Success" : "Embed and upsert") : (<div className="flex">
            <CircularProgress size={20} sx={{
              color: "white",
            }} />
            <div className="ml-5">In progress</div>
          </div>)}
        </Button>
      </div>
      <div className="flex flex-wrap w-full mt-5 border-b border-[#738FAB1F]">
        <div style={{ ...styles.h7 }}>Index records</div>
        <div className="text-[#1B17F5] ml-auto cursor-pointer text-xs" onClick={handleClearIndexClick} data-testid="clear-button">Clear</div>
      </div>
      {(
        <div className={`text-xs mt-4 
                        transition-all 
                        duration-500 
                        ease-in-out 
                        transform ${clearIndexComplete ? "translate-y-0" : "translate-y-16"} 
                        opacity-${clearIndexComplete ? "100" : "0"} 
                        ${clearIndexComplete ? "h-auto" : "h-0"}`}>
          Index cleared
        </div>
      )}
      {(
        <div className={`text-xs mt-2  
                        transition-all 
                        duration-500 
                        ease-in-out 
                        transform ${crawling ? "translate-y-0" : "translate-y-16"} 
                        opacity-${crawling ? "100" : "0"} ${crawling ? "h-auto" : "h-0"}`}>
          <CircularProgress size={10} sx={{
            color: "black",
          }} /> <span className="ml-2">Chunking and embedding your data...</span>
        </div>
      )}
      <div className="flex flex-wrap w-full">
        <div className="flex">
          {cards && cards.length > 0 ?
            <div className="mt-2 flex flex-row">
              <div className="font-semibold mb-4 whitespace-nowrap">{cards.length} records:</div>
              <div className="ml-2 overflow-hidden overflow-ellipsis whitespace-nowrap max-w-xs text-[#72788D]">
                <a href={url} target="_blank">{url}</a>
              </div>
            </div>
            :
            <div></div>
          }
        </div>
      </div>
      <div className="flex flex-col w-full">
        {cards.map((card, index) => (
          <Card key={index} card={card} index={index} context={null} id={card.id} />
        ))}
        {cards.length > 0 && (<div className="text-[#72788D]">End of results</div>)}
      </div>

    </div>
  );
};
