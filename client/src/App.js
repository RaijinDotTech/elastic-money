import { useEffect, useState, useReducer, createContext } from "react";
import Dapp from './Dapp';
import { dappReducer, dappInitialState } from './reducer/DappReducer';
import PopupTx from "./PopupTx";
import Lib from "./Lib";
export const DappContext = createContext();

const COIN_SYMBOL = '$XTZ';
const TOKEN_SYMBOL = '$EM';
const CHAIN_NAME = 'ETHERLINK TESTNET';

function App() {
  const [state, dispatch] = useReducer(dappReducer, dappInitialState);
  const [connection, setConnection] = useState('busy');
  const [dapp, setDapp] = useState(null);
  const [chainName, setChainName] = useState('');
  const [userData, setUserData] = useState({});
  const [chainData, setChainData] = useState({});
  const [mintAmount, setMintAmount] = useState('');
  const [mintResultAmount, setMintResultAmount] = useState('0.0');
  const [burnAmount, setBurnAmount] = useState('');
  const [burnResultAmount, setBurnResultAmount] = useState('0.0');

  const onMintAmountChange = async (amount) => {
    setMintAmount(amount);
    if (Number(amount) > 0) {
      const res = await dapp.coinToToken(amount);
      setMintResultAmount(res);
    } else {
      setMintResultAmount('0.0');
    }
  }

  const onBurnAmountChange = async (amount) => {
    setBurnAmount(amount);
    if (Number(amount) > 0) {
      const res = await dapp.tokenToCoin(amount);
      setBurnResultAmount(res);
    } else {
      setBurnResultAmount('0.0');
    }
  }

  const refreshData = async () => {
    try {
      const userData = await dapp.getUserData();
      const chainData = await dapp.getChainData();
      setUserData(userData);
      setChainData(chainData);
    } catch (err) {
      console.error(err);
    }
  }

  const onMint = async () => {
    const amount = mintAmount;
    try {
      Lib.openPopupTx();
      dispatch({ type: 'TX_SHOW' });
      const tx = await dapp.mint(amount);
      dispatch({ type: 'TX_SET_HASH', txHash: tx.hash });
      await tx.wait();
      await refreshData();
      dispatch({ type: 'TX_SUCCESS' });
      console.log('success');
    } catch (err) {
      console.error(err);
      const errMsg = JSON.stringify(err);
      dispatch({ type: 'TX_ERROR', txError: errMsg });
    }
  }

  const onBurn = async () => {
    const amount = burnAmount;
    try {
      Lib.openPopupTx();
      dispatch({ type: 'TX_SHOW' });
      const tx = await dapp.burn(amount);
      dispatch({ type: 'TX_SET_HASH', txHash: tx.hash });
      await tx.wait();
      await refreshData();
      dispatch({ type: 'TX_SUCCESS' });
      console.log('success');
    } catch (err) {
      console.error(err);
      const errMsg = JSON.stringify(err);
      dispatch({ type: 'TX_ERROR', txError: errMsg });
    }
  }

  const onRebase = async () => {
    try {
      Lib.openPopupTx();
      dispatch({ type: 'TX_SHOW' });
      const tx = await dapp.rebase();
      dispatch({ type: 'TX_SET_HASH', txHash: tx.hash });
      await tx.wait();
      await refreshData();
      dispatch({ type: 'TX_SUCCESS' });
      console.log('success');
    } catch (err) {
      console.error(err);
      const errMsg = JSON.stringify(err);
      dispatch({ type: 'TX_ERROR', txError: errMsg });
    }
  }

  let { tokenTotalSupply, bankCoinBalance, bankCoinPrice, bankCoinBalanceUsd, coingeckoPrice, rebase } = chainData;
  let coinWorth = Number(bankCoinPrice) > 0 ? (1 / Number(bankCoinPrice)) : '0.0';
  coinWorth = Math.floor(coinWorth * 10000) / 10000;

  let PanelConnected = (
    <div className="bg-base-200 p-4">
      loading...
    </div>
  );

  let PanelInfo = null;
  let PanelMint = null;
  let PanelBurn = null;

  if (connection === 'connected') {
    PanelConnected = (
      <div className="bg-base-200 p-4">
        Connected to: {chainName}<br />
        {COIN_SYMBOL}: {userData?.userETH}<br />
        {TOKEN_SYMBOL}: {userData?.userToken}
        <p className="w-[80vw] truncate">{userData?.userAddress}</p>
      </div>
    );
    PanelInfo = (
      <div className="bg-base-100 p-4 grid grid-cols-1 gap-2">
        <div>
          {TOKEN_SYMBOL} total supply: {tokenTotalSupply}<br />
          algobank collateral: {bankCoinBalance} {COIN_SYMBOL}<br />
          algobank collateral in $: {bankCoinBalanceUsd} $<br />
          {COIN_SYMBOL} algobank price: {bankCoinPrice} $<br />
          {COIN_SYMBOL} coingecko price: {coingeckoPrice} $<br />
        </div>
        <div>
          <button className="btn btn-neutral btn-outline w-full" disabled={!rebase} onClick={onRebase}>Rebase</button>
        </div>
      </div>
    );

    PanelMint = (
      <div className="p-4 grid grid-cols-1 gap-2">
        <div className="">
          For {coinWorth} {COIN_SYMBOL} (worth ~1$) mint 1 {TOKEN_SYMBOL}
        </div>
        <div className="">
          <input type="text" placeholder={"Amount " + COIN_SYMBOL} class="input input-bordered w-full"
            value={mintAmount} onChange={(e) => onMintAmountChange(e.target.value)}
          />
        </div>
        <div className="">
          receive {mintResultAmount} {TOKEN_SYMBOL}
        </div>
        <div>
          <button className="btn btn-neutral btn-outline w-full" onClick={onMint}>Mint</button>
        </div>
      </div>
    );

    PanelBurn = (
      <div className="p-4 grid grid-cols-1 gap-2">
        <div className="">
          Burn 1 {TOKEN_SYMBOL} for {coinWorth} {COIN_SYMBOL} (worth ~1$)
        </div>
        <div className="">
          <input type="text" placeholder={"Amount " + TOKEN_SYMBOL} class="input input-bordered w-full"
            value={burnAmount} onChange={(e) => onBurnAmountChange(e.target.value)}
          />
        </div>
        <div className="">
          receive {burnResultAmount} {COIN_SYMBOL}
        </div>
        <div>
          <button className="btn btn-neutral btn-outline w-full" onClick={onBurn}>Burn</button>
        </div>
      </div>
    );

  } else if (connection === "error") {
    PanelConnected = (
      <div className="bg-base-200 p-4">
        ensure metamask installed,<br />
        set metamask network to {CHAIN_NAME},<br />
        and refresh the page
      </div>
    );
  }

  useEffect(() => {
    const dapp = new Dapp();
    setDapp(dapp);

    const init = async () => {
      try {
        await dapp.loadMetamask();
        await dapp.initContracts();
        const userData = await dapp.getUserData();
        const chainData = await dapp.getChainData();
        await dapp.triggerBot();
        setUserData(userData);
        setChainData(chainData);
        setChainName(dapp.getChainName());
        setConnection('connected');
      } catch (err) {
        console.log(err);
        console.log('metamask error');
        setConnection('error');
      }
    }

    init();

    let busy = false;
    const itv = setInterval(async () => {
      if (!busy) {
        busy = true;
        try {
          if (dapp) await dapp.triggerBot();
        } catch (err) {
          console.error(err);
        }
        busy = false;
      }
    }, 60000);

    return () => {
      clearInterval(itv);
    }
  }, []);

  return (
    <DappContext.Provider value={{ state, dispatch }}>
      <div className="min-h-screen flex justify-center bg-base-300 font-mono text-sm">
        <div className="flex-1 max-w-3xl min-h-screen bg-base-100 flex flex-col">
          <div className="flex-1 bg-primary p-4">
            <h1 className="text-3xl font-bold">Elastic Money {TOKEN_SYMBOL}</h1>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur eu.</p>
          </div>
          <div className="grid grid-cols-2">
            <div className="col-span-2">

            </div>
            <div className="col-span-2">
              {PanelConnected}
            </div>
            <div className="col-span-2">
              {PanelInfo}
            </div>
            <div className="col-span-2 md:col-span-1 bg-base-100">
              {PanelMint}
            </div>
            <div className="col-span-2 md:col-span-1 bg-base-100">
              {PanelBurn}
            </div>
          </div>
        </div>
        <PopupTx />
      </div >
    </DappContext.Provider>
  );
}

export default App;
