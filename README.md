# DEX

A Decentralised exchange built with react and truffle/web3.js


1. Install truffle dependencies:
``` 
npm i 
```

2. Start Ganache local blockchain:
```
truffle develop 
```

3. Then Deploy migration files 
```
migrate --reset
```

4. Install client dependencies and start localhost:
```
cd client/ 
npm i 
npm start
```

## Project Aim

The purpose of the project is to demonstrate the core functionalities of a DEX.

The DEX is pre-funded with tokens to provide liquidity as is the user.

Market orders can be executed against an order book based on its BUY/SELL side. 

Limit orders can be placed against an order book also. The createLimitOrder() function arranges the orders by price and recency using the bubble sort algorithm.

Dai token is the stablecoin of the DEX.

All trades will appear in the order book and the chart.

![Screenshot 2022-05-15 at 08 04 56](https://user-images.githubusercontent.com/64858288/168461398-003fdbca-92b8-4f57-bb8a-b63446087287.png)


![Screenshot 2022-05-15 at 08 06 50](https://user-images.githubusercontent.com/64858288/168461437-06566352-2b39-4fcf-ba0f-206da853350e.png)


## Current Objectives

* Implement TypeScript
* ~~Deploy to Rinkeby - currently experiencing synchronization issues~~
* Implement real price feeds
* Fix some issues with inputting decimal values

## Tech Stack

* React
* JavaScript/TypeScript
* Truffle/Web3.JS
* Solidity

