import React, { useEffect, useState } from "react";
import Footer from './Footer.jsx';
import Header from "./Header.jsx";
import Wallet from "./Wallet.jsx";
import NewOrder from "./NewOrder.jsx";
import AllOrders from "./AllOrders.jsx";
import MyOrders from "./MyOrders.jsx";
import AllTrades from "./AllTrades.jsx";

const SIDE = {
  BUY: 0,
  SELL: 1
};

function App({web3, accounts, contracts}) {

  const [tokens, setTokens] = useState([]);
  const [user, setUser] = useState({ // stores user data
    accounts: [],
    balances: {
      tokenDex: 0,
      tokenWallet: 0
    },
    selectedToken: undefined
  });
  const [orders, setOrders] = useState({
    buy: [],
    sell: []
  });
  const [trades, setTrades] = useState([]);
  const [listener, setListener] = useState(undefined);

  const getBalances = async (account, token) => {
    const tokenDex = await contracts.dex.methods
      .traderBalances(account, web3.utils.asciiToHex(token.ticker))
      .call();
    const tokenWallet = await contracts[token.ticker].methods
      .balanceOf(account)
      .call()
    return {tokenDex, tokenWallet};
    }

  const getOrders = async token => {
    const orders = await Promise.all([
      contracts.dex.methods
        .getOrders(web3.utils.asciiToHex(token.ticker), SIDE.BUY)
        .call(),
      contracts.dex.methods
        .getOrders(web3.utils.asciiToHex(token.ticker), SIDE.SELL)
        .call()
    ]);
    return {buy: orders[0], sell: orders[1]};
  }

  const listenToTrades = token => {
    const tradeIds = new Set(); // prevent duplicates in object
    setTrades([]);
    const listener = contracts.dex.events.NewTrade(
      {
        filter: {ticker: web3.utils.asciiToHex(token.ticker)}, // filter indexed param
        fromBlock: 0 // in production can put block where SC was deployed
      })
      .on('data', newTrade => {
        if(tradeIds.has(newTrade.returnValues.tradeId)) return;
        tradeIds.add(newTrade.returnValues.tradeId)
        setTrades( trades => ([...trades, newTrade.returnValues]))
      })
      setListener(listener);
  }


  // Typescript would be useful here to prevent erronous argument being passed here
  const selectToken = token => {
    setUser({
      ...user, // copies all key/value
      selectedToken: token
    });
  };

  // from wallet to DEX smart contract
  const deposit = async amount => {
    await contracts[user.selectedToken.ticker].methods
      .approve(contracts.dex.options.address, amount) // FIRST, approve dex contract to use our token 
      .send({from: user.accounts[0]});
    await contracts.dex.methods
      .deposit( // THEN, deposit to the DEX smart contract
        amount,
        web3.utils.asciiToHex(user.selectedToken.ticker)
      )
      .send({from: user.accounts[0]});
    const balances = await getBalances(
      user.accounts[0],
      user.selectedToken
    );
    setUser(user => ({...user, balances}));
  }

  const withdraw = async amount => {
    await contracts.dex.methods
      .withdraw( // THEN, deposit to the DEX smart contract
        amount,
        web3.utils.asciiToHex(user.selectedToken.ticker)
      )
      .send({from: user.accounts[0]});
    const balances = await getBalances(
      user.accounts[0],
      user.selectedToken
    );
    setUser(user => ({...user, balances}));
  }

  const createMarketOrder = async (amount, side) => {
    await contracts.dex.methods
      .createMarketOrder(
        web3.utils.asciiToHex(user.selectedToken.ticker),
        amount,
        side
      )
      .send({from: user.accounts[0]});
    const orders = await getOrders(user.selectedToken);
    setOrders(orders);
  }

  const createLimitOrder = async (amount, price, side) => {
    await contracts.dex.methods
      .createLimitOrder(
        web3.utils.asciiToHex(user.selectedToken.ticker),
        amount,
        price,
        side
      )
      .send({from: user.accounts[0]});
      const orders = await getOrders(user.selectedToken);
      setOrders(orders);
  }

  useEffect(() => {
    const init = async () => { 
      const rawTokens = await contracts.dex.methods.getTokens().call(); // the web3 contract instance of DEX
      const tokens = rawTokens.map(token => ({    // convert from Bytes32 to string
        ...token, // destructure the token object, as only the ticker key/value is converted
        ticker: web3.utils.hexToUtf8(token.ticker)
      }));
      const [balances, orders] = await Promise.all([
        getBalances(accounts[0], tokens[0]),
        getOrders(tokens[0])
      ]);
      listenToTrades(tokens[0]);
      setTokens(tokens); // save tokens in react state
      setUser({
        accounts,
        balances,
        selectedToken: tokens[0]
      });
      setOrders(orders)
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const init = async () => {
      const [balances, orders] = await Promise.all([
        getBalances(accounts[0], user.selectedToken),
        getOrders(user.selectedToken)
      ])
      listenToTrades(user.selectedToken);
      setUser(user => ({...user, balances}));
      setOrders(orders);
    }
    if(typeof user.selectedToken !== 'undefined') {
      init();
    }
  }, [user.selectedToken], () => { // when user selects new token, unsubscribe from prev event
    listener.unsubscribe();
  });

  if(typeof user.selectedToken === 'undefined') {
    return <div>Loading APPJS... User: {user.selectedToken}</div>
  }
    return (
      <div id="app">
       <Header
        contracts={contracts} // received from props
        tokens={tokens} // array of tokens modified on mount
        user={user} // user object set on mount
        selectToken={selectToken} // function to update user object
       />
        <main className="container-fluid"> 
          <div className="row">
            <div className="col-sm-4 first-col">
              <Wallet
                user={user}
                deposit={deposit}
                withdraw={withdraw}
                />
           
            {user.selectedToken.ticker !== 'DAI' ? (
              <NewOrder
                createMarketOrder={createMarketOrder}
                createLimitOrder={createLimitOrder}
              />
            ) : null} 
            </div>
            {user.selectedToken.ticker !== 'DAI' ? (
            <div className="col-sm-8">
              <AllTrades
                trades={trades}
              />
              <AllOrders 
                orders={orders}
              />
              <MyOrders
                  orders={{
                    buy: orders.buy.filter(
                      order => order.trader.toLowerCase() === user.accounts[0].toLowerCase()
                    ),
                    sell: orders.sell.filter(
                      order => order.trader.toLowerCase() === user.accounts[0].toLowerCase()
                    )
                  }}
                />
            </div>
          ) : null}
          </div>
        </main>
        <Footer/>
      </div>
    );  
  
}
export default App;
