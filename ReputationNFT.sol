// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Correct constructor: pass name and symbol to ERC721
    constructor()
        ERC721("FreelanceReputation", "FRP")
        Ownable(msg.sender)
    {}

    function mintReputation(address to, uint256 score)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        require(score >= 1 && score <= 5, "Score must be 1-5");
        _nextTokenId++;
        tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _buildURI(score));
        return tokenId;
    }

    function _buildURI(uint256 score) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json,",
                "%7B%22name%22%3A%22Freelance%20Reputation%22%2C",
                "%22description%22%3A%22Reputation%20score%20for%20job%22%2C",
                "%22attributes%22%3A%5B%7B%22trait_type%22%3A%22Score%22%2C%22value%22%3A",
                _uint2str(score),
                "%7D%5D%7D"
            )
        );
    }

    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }
}