// const { time } = require('@openzeppelin/test-helpers');
const Dai = artifacts.require('mocks/Dai.sol'); // build artifacts are JSON files that contain binary representation of the contract
const Ftm = artifacts.require('mocks/Ftm.sol');
const Hex = artifacts.require('mocks/Hex.sol');
const Cel = artifacts.require('mocks/Cel.sol');
const Dex = artifacts.require('Dex.sol');

const [DAI, FTM, HEX, CEL] = ['DAI', 'FTM', 'HEX', 'CEL'] // transform ticker string to bytes32 for smart contract
    .map(ticker => web3.utils.asciiToHex(ticker));

SIDE = {
    BUY: 0,
    SELL: 1
}

// deployment function for: providing tokens to accounts, providing liquidity to Dex, and simulating market trades
module.exports = async function(deployer, _network, accounts) {
    console.log('deployer: ', deployer);
    console.log('_network: ', _network);
    console.log('accounts: ', accounts);

    // Replace these with actual eth addresses??
    const [trader1, trader2, trader3, trader4, _] = accounts;
    await Promise.all(
        [Dai, Ftm, Hex, Cel, Dex].map(contract => deployer.deploy(contract)) // deploy array of contract artifacts
    );
    const [dai, ftm, hex, cel, dex] = await Promise.all( // <pointer> to each deployed instance stored in constants
        [Dai, Ftm, Hex, Cel, Dex].map(contract => contract.deployed()) 
    );
    await Promise.all([ // call addToken to tokenList from each contract instance
        dex.addToken(DAI, dai.address),
        dex.addToken(FTM, ftm.address),
        dex.addToken(HEX, hex.address),
        dex.addToken(CEL, cel.address)
    ]);

    const amount = web3.utils.toWei('1000'); // 1000 x 10^18 = tokens have same granularity as ether
    // provide Dex with liquidity
    const seedTokenBalance = async (token, trader) => {
        balance = await web3.eth.getBalance(trader)
        console.log('trader balance: ', balance);
        await token.faucet(trader, amount); // allocate token to recipient and the amount 
        await token.approve( // approve DEX to transfer their token
            dex.address,
            amount,
            {from: trader}
        );
        const ticker = await token.symbol(); // calling ERC20 getter function for the ticker
        await dex.deposit( // deposit from trader to Dex smart contract
            amount,
            web3.utils.asciiToHex(ticker),
            {from: trader}
        );
    };

    await Promise.all(
        [dai, ftm, hex, cel].map(
            token => seedTokenBalance(token, trader1)
        )
    );

    await Promise.all(
        [dai, ftm, hex, cel].map(
            token => seedTokenBalance(token, trader2)
        )
    );

    await Promise.all(
        [dai, ftm, hex, cel].map(
            token => seedTokenBalance(token, trader3)
        )
    );

    await Promise.all(
        [dai, ftm, hex, cel].map(
            token => seedTokenBalance(token, trader4)
        )
    );

    // utility function: json-rpc method evm_increaseTime simulates a future call
    const increaseTime = async (seconds) => { // efwedf
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime', // m
            params: [seconds],
            id: 0,
        }, () => {});
    // then the block is mined to induce the time travel
        await web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [],
            id: 0,
        }, () => {});
    }
    balance = await web3.eth.getBalance(trader2)
    gas = await web3.eth.getGasPrice();

    // Simulate fake market and limit orders for recharts (trading graph)
    await dex.createLimitOrder(HEX, 1000, 10, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(HEX, 1000, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(HEX, 1200, 11, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(HEX, 1200, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(HEX, 1200, 15, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(HEX, 1200, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(HEX, 1500, 14, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(HEX, 1500, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(HEX, 2000, 12, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(HEX, 2000, SIDE.SELL, {from: trader2, gas: 3000000});

    await dex.createLimitOrder(CEL, 1000, 2, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(CEL, 1000, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(CEL, 500, 4, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(CEL, 500, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(CEL, 800, 2, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(CEL, 800, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(CEL, 1200, 6, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(CEL, 1200, SIDE.SELL, {from: trader2, gas: 3000000});

    await dex.createLimitOrder(FTM, 2000, 2, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(FTM, 2000, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(FTM, 800, 4, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(FTM, 800, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(FTM, 1500, 2, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(FTM, 1500, SIDE.SELL, {from: trader2, gas: 3000000});
    await increaseTime(1);
    await dex.createLimitOrder(FTM, 2000, 6, SIDE.BUY, {from: trader1, gas: 3000000});
    await dex.createMarketOrder(FTM, 2000, SIDE.SELL, {from: trader2, gas: 3000000});

    await Promise.all([
        dex.createLimitOrder(HEX, 1400, 10, SIDE.BUY, {from: trader1, gas: 3000000}),
        dex.createLimitOrder(HEX, 1200, 11, SIDE.BUY, {from: trader2, gas: 3000000}),
        dex.createLimitOrder(HEX, 1000, 12, SIDE.BUY, {from: trader2, gas: 3000000}),

        dex.createLimitOrder(CEL, 3000, 4, SIDE.BUY, {from: trader1, gas: 3000000}),
        dex.createLimitOrder(CEL, 2000, 5, SIDE.BUY, {from: trader1, gas: 3000000}),
        dex.createLimitOrder(CEL, 500, 6, SIDE.BUY, {from: trader2, gas: 3000000}),

        dex.createLimitOrder(FTM, 4000, 12, SIDE.BUY, {from: trader1, gas: 3000000}),
        dex.createLimitOrder(FTM, 3000, 13, SIDE.BUY, {from: trader1, gas: 3000000}),
        dex.createLimitOrder(FTM, 500, 14, SIDE.BUY, {from: trader2, gas: 3000000}),

        dex.createLimitOrder(HEX, 2000, 16, SIDE.SELL, {from: trader3, gas: 3000000}),
        dex.createLimitOrder(HEX, 3000, 15, SIDE.SELL, {from: trader4, gas: 3000000}),
        dex.createLimitOrder(HEX, 500, 14, SIDE.SELL, {from: trader4, gas: 3000000}),

        dex.createLimitOrder(CEL, 4000, 10, SIDE.SELL, {from: trader3, gas: 3000000}),
        dex.createLimitOrder(CEL, 2000, 9, SIDE.SELL, {from: trader3, gas: 3000000}),
        dex.createLimitOrder(CEL, 800, 8, SIDE.SELL, {from: trader4, gas: 3000000}),

        dex.createLimitOrder(FTM, 1500, 23, SIDE.SELL, {from: trader3, gas: 3000000}),
        dex.createLimitOrder(FTM, 1200, 22, SIDE.SELL, {from: trader3, gas: 3000000}),
        dex.createLimitOrder(FTM, 900, 21, SIDE.SELL, {from: trader4, gas: 3000000})
    ]);

}