# DEX

A Decentralised exchange built with react and truffle/web3.js

1. Install client dependencies:
```
cd DEX/client 
npm i 
```

2. Install truffle dependencies:
```
cd DEX/ 
npm i 
```

3. Start Ganache local blockchain:
```
cd DEX/ 
truffle develop 
```

4. Then Deploy migration files 
```
migrate --reset
```

5. Start localhost:3000
```
cd DEX/client/ 
npm start
```

**Will be updated with TypeScript**.

## Project Aim

The purpose of the project is to demonstrate the core functionalities of a DEX.

The DEX is pre-funded with tokens to provide liquidity as is the user.

Market orders can be executed against an order book based on its BUY/SELL side. 

Limit orders can be placed against an order book also. The createLimitOrder() function arranges the orders by price and recency using the bubble sort algorithm.

Dai token is the stablecoin of the DEX.

All trades will appear in the order book and the chart.

![Screenshot 2022-04-24 at 14 15 00](https://user-images.githubusercontent.com/64858288/164978419-52cd18af-8658-44c7-9209-adb096018559.png)

![Screenshot 2022-04-24 at 14 15 11](https://user-images.githubusercontent.com/64858288/164978411-14f8df8a-1f5b-4397-8821-37b578772096.png)


## Current Objectives

* Implement TypeScript
* Deploy to Testnet
* Fix some issues with inputting decimal values

## Tech Stack

* React
* JavaScript/TypeScript
* Truffle/Web3.JS
* Solidity

