import React from 'react';
import { useContext } from 'react';
import { DappContext } from './App';

const EXPLORER_TX_URL = "";

const PopupTx = () => {
  const { state } = useContext(DappContext);

  const txStatus = state?.txStatus;
  const txHash = state?.txHash;
  let txError = state?.txError;

  let pts = 0; // busy without hash
  if (txStatus === 'BUSY' && txHash && txHash.length > 0) pts = 1; // busy with hash not confirmed
  else if (txStatus === 'SUCCESS') pts = 2; // confirmed
  else if (txStatus === 'ERROR') pts = 3; // error

  let btnExplorerStyle = 'hidden';
  let btnExplorerUrl = '';
  if (txHash && txHash.length > 0) {
    btnExplorerStyle = 'btn';
    btnExplorerUrl = EXPLORER_TX_URL + txHash;
  }

  return (
    <dialog id="modal_tx" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box grid grid-cols-1 gap-2">
        <h3 className="font-bold text-xl text-center">Transaction</h3>
        <div className="flex flex-col items-center justify-center p-4">
          {pts === 3 ? (
            <p className="text-error w-full break-words">
              {txError}
            </p>) : null}
          {pts === 0 || pts === 1 ? (<div className="border-base-300 h-8 w-8 animate-spin rounded-full border-4 border-t-black" />) : null}
          {pts === 2 ? (<p className="text-success text-center font-bold">{"transaction confirmed".toUpperCase()}</p>) : null}
        </div>
        {pts === 1 || pts === 2 ? (
          <button className={btnExplorerStyle} onClick={() => window.open(btnExplorerUrl, '_blank')}>Verify In Explorer</button>
        ) : null}

        {pts === 2 || pts === 3 ? (
          <form method="dialog">
            <button className="btn w-full">Close</button>
          </form>
        ) : null}
      </div>
    </dialog>
  )
}

export default PopupTx
