import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';

const { SystemProgram } = web3;
const programID = new PublicKey('DcJUJ1FNVNHy9iihgDJ9f5B8C7KpvEh4cF8ZjwckfKYZ');
const network = clusterApiUrl('devnet');
const TWITTER_HANDLE = 'hsdk_';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const opts = {
  preflightCommitment: "processed"
};
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)


const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkWalletConnection = async () => {
    if (window?.solana?.isPhantom) {
      console.log('Phantom was found!');
      const responce = await window.solana.connect({ onlyIfTrusted: true});
      console.log('Connected with PublicKey: ', responce.publicKey.toString());
      setWalletAddress(responce.publicKey.toString());
    } else {
      alert('Please install Phantom Wallet!');
    }
  };

  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const responce = await solana.connect();
      console.log('Connceted with PubKey:', responce.publicKey.toString());
      setWalletAddress(responce.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log('Nothing given')
      return
    }
    setInputValue('');
    console.log('Gif link: ', inputValue);
    try {
      const provider = getProvider();
      const program = await getProgram();

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log('GIF added: ', inputValue);
      await getGifList();
    } catch (error) {
      console.log('Error sendGIF: ', error);
    }
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const getGifList = async () => {
    try {
      const program = await getProgram();
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('Got account: ', account)
      setGifList(account.gifList);
    } catch (error) {
      console.log('Error in getGifList: ', error)
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = await getProgram();

      console.log('INIT');
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log('Created acc: ', baseAccount.publicKey.toString())
      await getGifList();
    } catch (error) {
      console.log('Error creating baseacc', error)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  }

  const renderNotConnected = () => (
    <button 
      className='cta-button connect-wallet-button'
      onClick={connectWallet}>
        Connect Wallet
    </button> 
  );

  const renderConnected = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
        <button className="cta-button submit-gif-button" onClick={createGifAccount}>
          Do One-Time Initialization For GIF Program Account
        </button>
      </div>
      )
    } else {
      return (
    <div className='connected-container'>
      <form onSubmit={(event) => {
        event.preventDefault();
        sendGif();
      }}>
        <input type='text' placeholder='Enter gif link!' value={inputValue} onChange={onInputChange}/>
        <button type='submit' className='cta-button submit-gif-button'>Submit</button>
      </form>
      <div className='gif-grid'>
        {gifList.map((item, index) => (
          <div className='gif-item' key={index}>
            <img src={item.gifLink} alt='GIF'/>
            
          </div>
        ))}
      </div>
    </div>
    )
  }
}

  useEffect(() => {
    const onLoad = async () => {
      await checkWalletConnection();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getProgram = async () => {
    const idl = await Program.fetchIdl(programID, getProvider());
    return new Program(idl, programID, getProvider());
  };

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list');
      getGifList()
    }
    // eslint-disable-next-line
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : "container"}>
        <div className="header-container">
          <p className="header">🖼 nsense's GIF Portal</p>
          <p className="sub-text">
            nsense's gifs ✨
          </p>
          {!walletAddress && renderNotConnected()}
          {walletAddress && renderConnected()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`builder is @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
