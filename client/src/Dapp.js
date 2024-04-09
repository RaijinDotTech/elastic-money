const axios = require('axios');
const ethers = require('ethers').ethers;
const maxUINT = ethers.constants.MaxUint256;

const CHAIN_NAME = 'ETHERLINK TESTNET';
const BANK = '0x6787fC888702286A4b209b2075B81d901Ae63F6F';
const RPC = 'https://node.ghostnet.etherlink.com/';
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=tezos&vs_currencies=usd'
const BOT_URL = 'https://xtz-elastic-dollar.vercel.app/api/bot';
const COINGECKOID1 = 'tezos';
const COINGECKOID2 = 'usd';
const CHAIN_ID = '128123';
const ALGOBANK_ABI = require('./abis/AlgoBank.json');
const ESTOKEN_ABI = require('./abis/ESToken.json');
const PRICEORACLE_ABI = require('./abis/PriceOracle.json');

function wei2eth(wei) {
  return ethers.utils.formatUnits(wei, "ether");
}

function eth2wei(eth) {
  return ethers.utils.parseEther(eth);
}

module.exports = class Dapp {
  constructor() {
    this.OPTS = {};
    this.PROVIDER = null;
    this.SIGNER = null;
    this.USER_ADDRESS = null;
    this.RANDOM_WALLET = false;
  }

  async initContracts() {
    const signer = this.SIGNER;
    if (!signer) throw new Error('SIGNER not loaded.');
    this.bank = new ethers.Contract(BANK, ALGOBANK_ABI, signer);
    const addressToken = await this.bank.token();
    this.token = new ethers.Contract(addressToken, ESTOKEN_ABI, signer);
    const addressOracle = await this.bank.oracle();
    this.oracle = new ethers.Contract(addressOracle, PRICEORACLE_ABI, signer);
  }

  async loadMetamask() {
    if (!window.ethereum) throw new Error('Metamask not installed!!');
    window.ethereum.on('chainChanged', (_chainId) => window.location.reload());
    window.ethereum.enable();
    const connected = window.ethereum.isConnected();
    if (!connected) throw new Error('Metamask not connected!!');
    let chainId = await window.ethereum.request({ method: 'eth_chainId' });
    chainId = Number(chainId) + '';
    const allowedChainId = [CHAIN_ID];
    if (allowedChainId.indexOf(chainId) < 0) throw new Error('Metamask on wrong network!!');
    this.CHAIN_ID = chainId;
    this.PROVIDER = new ethers.providers.Web3Provider(window.ethereum);
    this.SIGNER = this.PROVIDER.getSigner();
    this.USER_ADDRESS = await this.SIGNER.getAddress();
    return this.USER_ADDRESS;
  }

  async loadPrivateKey(pk) {
    console.log('** read only wallet **');
    if (!pk) {
      const tmp = ethers.Wallet.createRandom();
      pk = tmp.privateKey;
      this.RANDOM_WALLET = true;
    }
    this.CHAIN_ID = CHAIN_ID;
    this.PROVIDER = new ethers.providers.JsonRpcProvider(RPC);
    this.SIGNER = new ethers.Wallet(pk, this.PROVIDER);
    this.USER_ADDRESS = await this.SIGNER.getAddress();
    return this.USER_ADDRESS;
  }

  isReadOnly() {
    return this.RANDOM_WALLET;
  }

  getSigner() {
    return this.SIGNER;
  }

  getUserAddress() {
    return this.USER_ADDRESS;
  }

  async getBlockTS() {
    return (await this.PROVIDER.getBlock('latest')).timestamp;
  }

  getChainName() {
    return CHAIN_NAME;
  }

  async getChainData() {
    const ret = {};

    const tot = await this.token.totalSupply();
    ret.tokenTotalSupply = wei2eth(tot);
    const bal = await this.PROVIDER.getBalance(this.bank.address);
    ret.bankCoinBalance = wei2eth(bal);
    const cnp = await this.bank.coinPrice();
    ret.bankCoinPrice = wei2eth(cnp);
    ret.bankCoinBalanceUsd = Number(ret.bankCoinBalance) * Number(ret.bankCoinPrice);
    const data = await this.getCoingeckoData();
    ret.coingeckoPrice = data.price;
    ret.rebase = data.rebase;

    return ret;
  }

  async coinToToken(amount) {
    const wei = eth2wei(amount);
    let res = await this.bank.coinToToken(wei);
    res = wei2eth(res);
    return res;
  }

  async mint(amount) {
    const wei = eth2wei(amount);
    const tx = await this.bank.swapCoinToToken({ value: wei })
    return tx;
  }

  async tokenToCoin(amount) {
    const wei = eth2wei(amount);
    let res = await this.bank.tokenToCoin(wei);
    res = wei2eth(res);
    return res;
  }

  async burn(amount) {
    const wei = eth2wei(amount);
    const tx = await this.bank.swapTokenToCoin(wei)
    return tx;
  }

  async getUserData() {
    const userAddress = this.USER_ADDRESS;
    const userETH = await this.PROVIDER.getBalance(userAddress);
    const userToken = await this.token.balanceOf(userAddress);
    return {
      userAddress,
      userETH: wei2eth(userETH),
      userToken: wei2eth(userToken)
    }
  }

  async needApprove(tokenSC, spenderAddress) {
    const userAddress = this.getUserAddress();
    const token = tokenSC;
    const allowance = await token.allowance(userAddress, spenderAddress);
    const owned = await token.balanceOf(userAddress);
    const ok = allowance.gte(owned) && allowance.gt('0');
    return !ok;
  }

  async approve(tokenSC, spenderAddress) {
    const opts = Object.assign({}, this.OPTS);
    const tx = await tokenSC.approve(spenderAddress, maxUINT, opts);
    return tx;
  }

  async triggerBot() {
    try {
      const url = BOT_URL;
      const res = await axios.get(url);
      console.log(res.data);
    } catch (err) {
    }
  }

  async getCoingeckoData() {
    const url = COINGECKO_URL;
    const res = await axios.get(url);
    const price = res.data[COINGECKOID1][COINGECKOID2];

    const op = await this.oracle.price();
    const opPrice = Number(wei2eth(op));

    const bp = await this.bank.coinPrice();
    const bpPrice = Number(wei2eth(bp));

    const ret = {
      price, opPrice, bpPrice
    }

    let updateOracle = false;
    let rebase = false;

    if (price !== opPrice) updateOracle = true;
    else if (opPrice !== bpPrice) rebase = true;

    ret.updateOracle = updateOracle;
    ret.rebase = rebase;

    return ret;
  }

  async updateOracle(price) {
    const priceWei = eth2wei('' + price);
    const tx = await this.oracle.setPriceVal(priceWei);
    return tx;
  }

  async rebase() {
    const tx = await this.bank.updateBasePrice();
    return tx;
  }

}
