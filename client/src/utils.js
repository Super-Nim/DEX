import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import Dex from'./contracts/Dex.json';
const ERC20Abi = require('./ERC20Abi.json');
// import { MetaMaskInpageProvider } from "@metamask/providers";


const getWeb3 = () =>
  new Promise( async (resolve, reject) => {
    let provider = await detectEthereumProvider();
    if(provider) {
      await provider.request({ method: 'eth_requestAccounts' });
      try {
        const web3 = new Web3(window.ethereum);
        resolve(web3);
      } catch(error) {
        reject(error);
      }
    }
    reject('Install Metamask');
  });

const getContracts = async web3 => { // accepts instance of type Web3
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = Dex.networks[networkId];
    const dex = new web3.eth.Contract( // instantiate contract instance for DEX
        Dex.abi,
        deployedNetwork && deployedNetwork.address,
    );
    // need contract instance for ERC20 tokens
    console.log('dex: ', dex);
    const tokens = await dex.methods.getTokens().call(); // array of token objects = [{ticker, tokenAddress}...]
    const tokenContracts = tokens.reduce((acc, token) => ({
        ...acc,
        [web3.utils.hexToUtf8(token.ticker)]: new web3.eth.Contract(
            ERC20Abi,
            token.tokenAddress
        )
        }), {}) ;// inital value of accumulator = {} = 0
        return { dex, ...tokenContracts }; // e.g. { dex, HEX, FTM...}
}
export { getWeb3, getContracts };