// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/**
    * Dex contract:
    * 1. Liquidity is provided to DEX and user in migration file
    * 2. User's can immeadiately create market/limit orders
    * 3. Happy trading
    */

contract Dex {

       
    enum Side {
        BUY,
        SELL
    }

    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    /// @param unique id of order
    /// @param address of trader associated with trade
    /// @param BUY/SELL
    /// @param ticker symbol of token
    /// @param quantity of token
    /// @param for limit orders, how much was filled
    /// @param price of token
    /// @param date of creation of trade
    struct Order {
        uint id;
        address trader;
        Side side;
        bytes32 ticker;
        uint amount;
        uint filled;
        uint price;
        uint date;
    }


    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    mapping(address => mapping(bytes32 => uint)) public traderBalances;
    mapping(bytes32 => mapping(uint => Order[])) public orderBook; // for storing order/time priority e.g BUY = [50, 40, 35, 22]

    address public admin;
    uint public nextTradeId;
    uint public nextOrderId;
    bytes32 constant DAI = bytes32('DAI'); // constants save repeated computation/gas 

    event NewTrade(
        uint tradeId,
        uint orderId,
        bytes32 indexed ticker,
        address indexed trader1,
        address indexed trader2,
        uint amount,
        uint price,
        uint date
    );

    constructor() {
        admin = msg.sender;
    }

    function getOrders(bytes32 ticker, Side side) external view returns(Order[] memory) {
        return orderBook[ticker][uint(side)];
    }

    function getTokens() external view returns(Token[] memory) { // go back to cryptozombies
        Token[] memory _tokens = new Token[](tokenList.length);
        for (uint i = 0; i < tokenList.length; i++) {
            _tokens[i] = Token(
                tokens[tokenList[i]].ticker,
                tokens[tokenList[i]].tokenAddress
            );
        }
        return _tokens;
    }
     
    function addToken(bytes32 ticker, address tokenAddress) onlyAdmin() external {
            tokens[ticker] = Token(ticker, tokenAddress); // register new token: CEL; 0xAvw34rfr... 
            tokenList.push(ticker); // push CEL into list of tokens --> [KSM, DOT, CEL]
    }
    

    function deposit(uint amount, bytes32 ticker) external tokenExist(ticker) { // need a pointer to ERC20 token defined by the ticker param
    // Interface's method - accessing tokenAddress value from tokens mapping/object
        IERC20(tokens[ticker].tokenAddress).transferFrom(
            msg.sender, // address of caller
            address(this), // address of this smart contract/wallet
            amount
        );
        traderBalances[msg.sender][ticker] += amount;
    }

    function withdraw(uint amount, bytes32 ticker) external tokenExist(ticker) {
        require(traderBalances[msg.sender][ticker] >= amount, 'balance too low');
        traderBalances[msg.sender][ticker] -= amount;
        IERC20(tokens[ticker].tokenAddress).transfer(
            msg.sender,
            amount
        );
    }

    function createLimitOrder(bytes32 ticker, uint amount, uint price, Side side) 
        external tokenExist(ticker) tokenIsNotDai(ticker) {
        if(side == Side.SELL) {
            require(
                traderBalances[msg.sender][ticker] >= amount,
                'token balance too low'
            );
        } else {
            require(
                traderBalances[msg.sender][DAI] >= amount * price,
                'dai balance too low'
            );
        }
        Order[] storage orders = orderBook[ticker][uint(side)];
        orders.push(Order(
            nextOrderId,
            msg.sender,
            side,
            ticker,
            amount,
            0,
            price,
            block.timestamp
        ));

        uint i = orders.length > 0 ? orders.length - 1 : 0;
        while(i > 0) {
            if(side == Side.BUY && orders[i - 1].price > orders[i].price) {
                break;
            }
            if(side == Side.SELL && orders[i - 1].price < orders[i].price) {
                break;
            }
            Order memory order = orders[i - 1];
            orders[i - 1] = orders[i];
            orders[i] = order;
            i--;
        }
        nextOrderId++;

        //bubble sort algortithm
    }

    function createMarketOrder(bytes32 ticker, uint amount, Side side) 
        external tokenExist(ticker) tokenIsNotDai(ticker) {
            if(side == Side.SELL) {
            require(
                traderBalances[msg.sender][ticker] >= amount,
                'balance too low'
            );
        }
        // type cast into integer to access key in orderbook 
        Order[] storage orders = orderBook[ticker][uint(side == Side.BUY ? Side.SELL : Side.BUY)];
        uint i;
        uint remaining = amount;

        // price matching process: 
        // stop when reaching end of orderbook and when eveything has been matched
        while(i < orders.length && remaining > 0) {
            uint availableLiquidity = orders[i].amount - orders[i].filled;
            uint matched = (remaining > availableLiquidity) ? availableLiquidity : remaining;
            remaining -= matched;
            orders[i].filled += matched;
            emit NewTrade(
                nextTradeId,
                orders[i].id,
                ticker,
                orders[i].trader,
                msg.sender,
                matched, // amount
                orders[i].price, // price
                block.timestamp // date
            );
            if(side == Side.SELL) {
                traderBalances[msg.sender][ticker] -= matched;
                traderBalances[msg.sender][DAI] += matched * orders[i].price;
                traderBalances[orders[i].trader][ticker] += matched;
                traderBalances[orders[i].trader][DAI] -= (matched * orders[i].price);
            }
            if(side == Side.BUY) {
                require(
                    traderBalances[msg.sender][DAI] >= matched * orders[i].price,
                    'dai balance too low'
                    );
                traderBalances[msg.sender][ticker] += matched;
                traderBalances[msg.sender][DAI] -= matched * orders[i].price;
                traderBalances[orders[i].trader][ticker] -= matched;
                traderBalances[orders[i].trader][DAI] += (matched * orders[i].price);
            }
            nextTradeId++;
            i++;
        }

        i = 0;
        while(i < orders.length && orders[i].filled == orders[i].amount) {
            for(uint j = i; j < orders.length - 1; j++) {
                orders[j] = orders[j + 1];
            }
            orders.pop();
            i++;
        }
        
        

    }

    modifier tokenIsNotDai(bytes32 ticker) {
        require(ticker != DAI, 'cannot trade DAI');
        _;
    }

    modifier tokenExist(bytes32 ticker) {
        require(
            tokens[ticker].tokenAddress != address(0),
            'this token does not exist'
        );
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, 'only admin');
        _;
    }
}
