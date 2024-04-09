export const dappInitialState = {
  txStatus: 'CLOSE', // 'BUSY', 'SUCCESS', 'ERROR', 'CLOSE'
  txHash: '',
  txError: ''
}

export const dappReducer = (state, action) => {
  switch (action.type) {
    case 'TX_SHOW':
      return {
        ...state,
        txStatus: 'BUSY',
        txHash: '',
        txError: '',
      };
    case 'TX_SET_HASH':
      return {
        ...state,
        txHash: action.txHash
      };
    case 'TX_SUCCESS':
      return {
        ...state,
        txStatus: 'SUCCESS'
      };
    case 'TX_ERROR':
      return {
        ...state,
        txStatus: 'ERROR',
        txError: action.txError,
      };
    case 'TX_CLOSE':
      return {
        ...state,
        txStatus: 'CLOSE',
        txHash: '',
        txError: '',
      };
    default:
      return state;
  }
};



