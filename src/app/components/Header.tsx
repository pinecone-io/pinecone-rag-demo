import Image from 'next/image';
import PineconeLogo from '../../../public/pinecone.svg';
import { AsertoLogoSvg } from '../assets/svg/aserto';


export default function Header({ className }: { className?: string }) {
  return (
    <header
      className={`flex items-center justify-center text-gray-200 text-2xl ${className}`}
    >
      <Image
        src={PineconeLogo}
        alt="pinecone-logo"
        width="160"
        height="50"

      />{' '}
      <div className="text-3xl ml-3 mr-3">/</div>
      {/* <Image
        src={AsertoLogo}
        alt="aserto-logo"
        
      /> */}
      <AsertoLogoSvg 
        width="110"
        height="40"
        className="mr-3 mt-2"/>

    </header>
  );
}