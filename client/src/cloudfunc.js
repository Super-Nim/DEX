Moralis.Cloud.define("getPrice", async (request) => {
    let url = "https://deep-index.moralis.io/api/v2/token/ERC20/" + request.params.address + "/price"
    logger.info(url);
    return Moralis.Cloud.httpRequest({
      url: url,
      params: {chain: "eth", chain_name: "ropsten"},
      headers: {
        "accept": "application/json",
        "X-API-Key": "viQQvEfmTzgOHEDSuJ7UKj7UVTJ6pPT8OJSzk9EWhR3C3T3Bic2EVLFqhrZhGCpK"
      }
    }).then( function(httpResponse){
      return httpResponse.data;
    }, function(httpResponse){
          logger.info("error");
          logger.info(httpResponse);
    })
  })