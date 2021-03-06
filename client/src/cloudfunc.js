Moralis.Cloud.define("getPrice", async (request) => {
    let url = "https://deep-index.moralis.io/api/v2/erc20/" + request.params.address + "/price?chain=eth"
    logger.info(url);
    return Moralis.Cloud.httpRequest({
      url: url,
      params: {chain: "eth", chain_name: "ropsten"},
      headers: {
        "accept": "application/json",
      }
    }).then( function(httpResponse){
      return httpResponse.data;
    }, function(httpResponse){
          logger.info("error");
          logger.info(httpResponse);
    })
  })