const Dai = artifacts.require('mocks/Dai.sol');
const Eth = artifacts.require('mocks/Eth.sol');
const Hex = artifacts.require('mocks/Hex.sol');
const Cel = artifacts.require('mocks/Cel.sol');
const Dex = artifacts.require('Dex.sol');
const { expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const SIDE = {
    BUY: 0,
    SELL: 1
};

contract('Dex', (accounts) => {
    // contract variables are defined before the beforeEach() hook
    let dai, eth, hex, cel, dex;
    const [trader1, trader2] = [accounts[1], accounts[2]]; // accounts[0] is admin, don't use
    const [DAI, ETH, HEX, CEL] = ['DAI', 'ETH', 'HEX', 'CEL']
        .map(ticker => web3.utils.asciiToHex(ticker)); // convert string to bytes32, before sending string to SC
        // fromAscii(string) is deprecated

    beforeEach(async() => { // returns array of 4 token contract instances and Dex instance before each test
        ([dai, eth, hex, cel] = await Promise.all([
            Dai.new(),
            Eth.new(),
            Hex.new(),
            Cel.new()
        ])); 
        dex = await Dex.new(); // create dex contract instance
        await Promise.all([ // call addToken to tokenList from each contract instance
            dex.addToken(DAI, dai.address),
            dex.addToken(ETH, eth.address),
            dex.addToken(HEX, hex.address),
            dex.addToken(CEL, cel.address)
        ])
    

        const amount = web3.utils.toWei('1000'); // 1000 x 10^18 = 10^21 = 4 ETH
        const seedTokenBalance = async (token, trader) => {
            await token.faucet(trader, amount); // allocate token to recipient and the amount 
            await token.approve( // approve DEX to transfer their token
                dex.address,
                amount,
                {from: trader}
            );
        };
        await Promise.all(
            [dai, eth, hex, cel].map(
                token => seedTokenBalance(token, trader1)
            )
        );
        await Promise.all(
            [dai, eth, hex, cel].map(
                token => seedTokenBalance(token, trader2)
            )
        );
    });

    it('should deposit tokens', async() => {
        const amount = web3.utils.toWei('100'); // isnt amount set to 1000 WEI beforeEach?
    
        await dex.deposit(
            amount,
            DAI,
            {from: trader1}
        );
    
        const balance = await dex.traderBalances(trader1, DAI);
        assert(balance.toString() === amount);
    });
    
    it('should NOT deposit tokens if token does not exist', async () => {
        const amount = web3.utils.toWei('100');
        const error = web3.utils.asciiToHex('TOKEN-DOES-NOT-EXIST')
        await expectRevert(
            dex.deposit(
                amount,
                error,
                {from: trader1}
            ),
            'this token does not exist'
        );
    });

    it('should withdraw tokens', async () => {
        const amount = web3.utils.toWei('100');

        await dex.deposit(
            amount,
            DAI,
            {from: trader1}
        );

        await dex.withdraw(
            amount,
            DAI,
            {from: trader1}
        );

        const [balanceDex, balanceDai] = await Promise.all([
            dex.traderBalances(trader1, DAI), // Dex balance
            dai.balanceOf(trader1) // account/wallet balance
        ]);

        assert(balanceDex.isZero());
        assert(balanceDai.toString() === web3.utils.toWei('1000')); // figure this 
        
        // toNumber() gives 'number can only store up to 53 bits'
    });

    it('should NOT withdraw tokens if token does not exist', async () => {
        const amount = web3.utils.toWei('100');
        const error = web3.utils.asciiToHex('TOKEN-DOES-NOT-EXIST');

        await expectRevert(
            dex.withdraw(
                amount,
                error,
                {from: trader1}
            ),
            'this token does not exist'
        );
    });

    it('should NOT withdraw tokens if balance is too low', async () => {
        const amount = web3.utils.toWei('100');
        const incorrectAmount = web3.utils.toWei('1000');
        // const error = web3.utils.asciiToHex('balance too low'); only do if passing value to smart contract param

        await dex.deposit(
            amount,
            DAI,
            {from: trader1}
        );
        await expectRevert(
            dex.withdraw(
                incorrectAmount,
                DAI,
                {from: trader1}
            ),
            'balance too low' // error message
        );
    });

    it('should create limit order', async () => {
        // PART 1: create simple limit order

        await dex.deposit(
            web3.utils.toWei('100'),
            DAI,
            {from: trader1}
        );

        await dex.createLimitOrder(
            ETH, // ticker
            web3.utils.toWei('10'), // # of tokens
            10, // price of token
            SIDE.BUY, // Buy/Sell
            {from: trader1}
        );

        let buyOrders = await dex.getOrders(ETH, SIDE.BUY);
        let sellOrders = await dex.getOrders(ETH, SIDE.SELL);
        assert(buyOrders.length === 1);
        assert(buyOrders[0].trader === trader1);
        assert(buyOrders[0].ticker === web3.utils.padRight(ETH, 64));
        assert(buyOrders[0].price === '10');
        assert(buyOrders[0].amount === web3.utils.toWei('10'));
        assert(sellOrders.length === 0);
        
        //PART 2: ensure higher price has higher priority
        await dex.deposit(
            web3.utils.toWei('200'),
            DAI,
            {from: trader2}
        );

        await dex.createLimitOrder(
            ETH,
            web3.utils.toWei('10'),
            11,
            SIDE.BUY,
            {from: trader2}
        );

        buyOrders = await dex.getOrders(ETH, SIDE.BUY);
        sellOrders = await dex.getOrders(ETH, SIDE.SELL);
        console.log('buyOrders: ', buyOrders)
        assert(buyOrders.length === 2); // [11, 10]
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);
        assert(sellOrders.length === 0);

        //PART 3: ensure lower price has lower priority
        await dex.createLimitOrder(
            ETH,
            web3.utils.toWei('10'),
            9,
            SIDE.BUY,
            {from: trader2}
        );

        buyOrders = await dex.getOrders(ETH, SIDE.BUY);
        sellOrders = await dex.getOrders(ETH, SIDE.SELL);
        assert(buyOrders.length === 3); // [11, 10, 9]
        assert(buyOrders[0].trader === trader2);
        assert(buyOrders[1].trader === trader1);
        assert(buyOrders[2].trader === trader2);
        assert(buyOrders[2].price === '9');
        assert(buyOrders[2].amount === web3.utils.toWei('10'));
        assert(sellOrders.length === 0);

    })

    it('should not create limit order if token does not exist', async () => {
        await expectRevert(
            dex.createLimitOrder(
                web3.utils.asciiToHex('TOKEN-DOES-NOT-EXIST'),
                web3.utils.toWei('10'),
                10,
                SIDE.BUY,
                {from: trader1}
            ),
            'this token does not exist'
        );
    });

    it('should NOT create limit order if token is DAI', async() => {
        await dex.deposit(
            web3.utils.toWei('100'),
            DAI,
            {from: trader1}
        );

        await expectRevert(
            dex.createLimitOrder(
                DAI,
                web3.utils.toWei('10'),
                10,
                SIDE.BUY,
                {from: trader1}  
            ),
            'cannot trade DAI'
        );  
    });

    it('should NOT create limit order if balance is too low', async () => {
        var balanceOf = await dex.traderBalances(trader1, ETH);
        console.log('1st balance: ', balanceOf.toString());
        await dex.deposit(
            web3.utils.toWei('99'),
            ETH,
            {from: trader1}
        );
        balanceOf = await dex.traderBalances(trader1, ETH);
        console.log('2nd balanceOf: ', balanceOf.toString())
        await expectRevert(
            dex.createLimitOrder(
                ETH,
                web3.utils.toWei('100'),
                10,
                SIDE.SELL,
                {from: trader1}
            ),
            'token balance too low'
        )
        balanceOf = await dex.traderBalances(trader1, ETH); // observable would subscribe, updating balanceOf
        console.log('balanceOf: ', balanceOf.toString());
    })

    it('should NOT create limit order if DAI balance is too low', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            DAI,
            {from: trader1}
        );
        await expectRevert(
            dex.createLimitOrder(
                ETH,
                web3.utils.toWei('200'),
                10,
                SIDE.BUY,
                {from: trader1}
            ),
            'dai balance too low'
        )
    });

    it('should create market order & match against existing limit order', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            DAI,
            {from: trader1}
        );
        await dex.createLimitOrder(
            ETH,
            web3.utils.toWei('10'),
            10,
            SIDE.BUY,
            {from: trader1}
        );

        await dex.deposit(
            web3.utils.toWei('100'),
            ETH,
            {from: trader2}
        );
        await dex.createMarketOrder(
            ETH,
            web3.utils.toWei('5'),
            SIDE.SELL,
            {from: trader2} 
        );

        const balances = await Promise.all([
            dex.traderBalances(trader1, DAI),
            dex.traderBalances(trader1, ETH),
            dex.traderBalances(trader2, DAI),
            dex.traderBalances(trader2, ETH)
        ])

        const buyOrders = await dex.getOrders(ETH, SIDE.BUY);
        const sellOrders = await dex.getOrders(ETH, SIDE.SELL);
        console.log('buyOrders: ', buyOrders);

        assert(buyOrders.length === 1);
        assert(buyOrders[0].filled === web3.utils.toWei('5'));
        assert(balances[0].toString() === web3.utils.toWei('50'));
        assert(balances[1].toString() === web3.utils.toWei('5'));
        assert(balances[2].toString() === web3.utils.toWei('50'));
        assert(balances[3].toString() === web3.utils.toWei('95'));
        assert(sellOrders.length === 0);
    });

    it('should NOT create market order for tokens that do not exist', async () => {
        await expectRevert(
            dex.createMarketOrder(
                web3.utils.asciiToHex('TOKEN-DOES-NOT-EXIST'),
                10,
                SIDE.BUY,
                {from: trader1}
            ),
            'this token does not exist'
        )
    })

    it('should NOT create market order if token is DAI', async () => {
        await expectRevert(
            dex.createMarketOrder(
                DAI,
                10,
                SIDE.BUY,
                {from: trader1}
            ),
            'cannot trade DAI'
        )
    });

    it('should NOT create market SELL ORDER if token balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('0'),
            ETH,
            {from: trader1}
        );

        await expectRevert(
            dex.createMarketOrder(
                ETH,
                100,
                SIDE.SELL,
                {from: trader1}
            ),
            'balance too low'
        );
    });

    it('should NOT create market BUY ORDER if dai balance too low', async () => {
        await dex.deposit(
            web3.utils.toWei('100'),
            ETH,
            {from: trader1}
        );
        
        await dex.createLimitOrder(
            ETH,
            web3.utils.toWei('100'),
            10,
            SIDE.SELL,
            {from: trader1}
        );

        await expectRevert(
            dex.createMarketOrder(
                ETH,
                web3.utils.toWei('100'),
                SIDE.BUY,
                {from: trader2}
            ),
            'dai balance too low'
        )
    })
});

