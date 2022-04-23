// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Cel is ERC20 {
    constructor() ERC20('Celsius', 'CEL') {}
    // default value of 'decimals' is 18 - therefore is not included in constructor
    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}
