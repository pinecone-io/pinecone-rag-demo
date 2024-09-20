import { Popover, PopoverContent, PopoverHandler } from "@material-tailwind/react";
import React, { useState } from 'react';
import { IoMdInformationCircleOutline } from "react-icons/io";

interface InfoPopoverProps {
    infoText: string;
    className?: string;
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({ infoText, className }) => {
    const [open, setOpen] = useState(false);

    const popoverTriggers = {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
    };

    return (
        <div className={className}>
            <Popover open={open} handler={setOpen} placement="left">
                <PopoverHandler {...popoverTriggers}>
                    <div><IoMdInformationCircleOutline className="text-[#72788D] text-lg" /></div>
                </PopoverHandler>
                <PopoverContent onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} {...popoverTriggers} className="z-50 max-w-[24rem]" placeholder="">
                    <div className="mb-2 flex items-center justify-between gap-4">
                        {infoText}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};