// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTContract is ERC721 {

    uint private s_tokenCounter;

    constructor() ERC721("testToken", "TT") {

    }

    function mintNft() external {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
    }

}