import React from 'react';
import { InfoPopover } from './InfoPopover';

interface RecursiveSplittingOptionsProps {
    chunkSize: number;
    setChunkSize: (value: number) => void;
    overlap: number;
    setOverlap: (value: number) => void;
}

export const RecursiveSplittingOptions: React.FC<RecursiveSplittingOptionsProps> = ({
    chunkSize,
    setChunkSize,
    overlap,
    setOverlap,
}) => {


    return (
        <div className="w-full">
            <div className="my-4 flex flex-col">
                <div className="flex flex-col w-full">
                    <div className="flex gap-1">
                        <span>Chunk Size: </span><span className="font-bold">{chunkSize}</span><span>
                            <div>
                                <InfoPopover
                                    className="mt-[1.5px]"
                                    infoText="Chunk size in recursive text splitting is the user defined portion of text that&apos;s divided and processed in each recursion step, influencing the accuracy of the operation."
                                />
                            </div>
                        </span>
                    </div>

                    <input
                        className="p-2"
                        type="range"
                        id="chunkSize"
                        min={1}
                        max={2048}
                        onChange={(e) => setChunkSize(parseInt(e.target.value))}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <div className="flex gap-1">
                        <span>Overlap:</span><span className="font-bold">{overlap}</span><span>
                            <div>
                                <InfoPopover
                                    className="mt-[1.5px]"
                                    infoText="Overlap in recursive text splitting is the user-specified section of text that&apos;s intentionally repeated across chunks to maintain context and potentially enhance accuracy."
                                />
                            </div>
                        </span>
                    </div>
                    <input
                        className="p-2"
                        type="range"
                        id="overlap"
                        min={1}
                        max={200}
                        onChange={(e) => setOverlap(parseInt(e.target.value))}
                    />
                </div>
            </div>
        </div>
    );
};