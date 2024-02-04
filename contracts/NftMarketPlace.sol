// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error NftMarketPlace__PriceMustBeAboveZero();
error NftMarketPlace__AlreadyListed(address nftContractAddress, uint tokenId);
error NftMarketPlace__NotListed(address nftContractAddress, uint tokenId);
error NftMarketPlace__NotOwner();
error NftMarketPlace__InsufficientPurchaseAmt();
error NftMarketPlace__OwnerCannotBuyOwnItem();
error NftMarketPlace__ZeroProceeds();
error NftMarketPlace__WithdrawFailed();
error NftMarketPlace__NotApprovedForMarketPlace();

contract NftMarketPlace is ReentrancyGuard {

    struct Listing {
        address seller;
        uint price;
    }

    mapping(address => mapping(uint => Listing)) private s_Listings;
    mapping(address => uint) private s_proceeds;

    event ItemListed(address seller, address nftContract, uint tokenId, uint price);
    event ItemBought(address buyer, address nftContract, uint tokenId, uint price);
    event ItemUnlisted(address seller, address nftContract, uint tokenId);

    modifier notListed(address nftContract, uint tokenId){
        Listing memory listing = s_Listings[nftContract][tokenId];
        if(listing.price > 0) revert  NftMarketPlace__AlreadyListed(nftContract, tokenId);
        _;
    }

    modifier isOwner(address nftContract, uint tokenId, address caller) {
        IERC721 nft = IERC721(nftContract);
        address owner = nft.ownerOf(tokenId);
        if(caller != owner) revert NftMarketPlace__NotOwner();
        _;
    }

    modifier isListed(address nftContract, uint tokenId) {
        Listing memory listing = s_Listings[nftContract][tokenId];
        if(listing.price <= 0) revert  NftMarketPlace__NotListed(nftContract, tokenId);
        _;
    }

    function listItem(address nftContract, uint tokenId, uint price) external 
    notListed(nftContract, tokenId) 
    isOwner(nftContract, tokenId, msg.sender) 
    {
        if(price <= 0) revert NftMarketPlace__PriceMustBeAboveZero();
        IERC721 nft = IERC721(nftContract);
        if(nft.getApproved(tokenId) != address(this)) revert NftMarketPlace__NotApprovedForMarketPlace();

        Listing memory newListing = Listing(msg.sender, price);
        s_Listings[nftContract][tokenId] = newListing;
        emit ItemListed(msg.sender, nftContract, tokenId, price);

    }

    function buyItem(address nftContract, uint tokenId) 
    external payable 
    isListed(nftContract, tokenId) 
    nonReentrant
    {
        Listing memory listing = s_Listings[nftContract][tokenId];
        if(msg.sender == listing.seller) revert NftMarketPlace__OwnerCannotBuyOwnItem();
        if(msg.value < listing.price) revert NftMarketPlace__InsufficientPurchaseAmt();
        s_proceeds[listing.seller] += msg.value;
        delete (s_Listings[nftContract][tokenId]);
        IERC721 nft = IERC721(nftContract);
        nft.safeTransferFrom(listing.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftContract, tokenId, listing.price);
    }

    function removeListing(address nftContract, uint tokenId) external 
    isOwner(nftContract, tokenId, msg.sender) 
    isListed(nftContract, tokenId)
    {
        delete (s_Listings[nftContract][tokenId]);
        emit ItemUnlisted(msg.sender, nftContract, tokenId);
    }

    function updateListing(address nftContract, uint tokenId, uint newPrice) external 
    isOwner(nftContract, tokenId, msg.sender) 
    isListed(nftContract, tokenId)
    {
        if(newPrice <= 0) revert NftMarketPlace__PriceMustBeAboveZero();
        s_Listings[nftContract][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftContract, tokenId, newPrice);
    }

    function withdrawProceeds() external payable nonReentrant{
        uint bal = s_proceeds[msg.sender];
        if(bal <= 0) revert NftMarketPlace__ZeroProceeds();
        delete(s_proceeds[msg.sender]);
        (bool success, ) = payable(msg.sender).call{value : bal}("");
        if(!success) revert NftMarketPlace__WithdrawFailed();
    }

    function getListing(address nft, uint tokenId) public view returns (Listing memory){
        return s_Listings[nft][tokenId];
    }

    function getProceeds(address seller) public view returns(uint){
        return s_proceeds[seller];
    }
}


// 1. `ListItem`: List NFTS on the marketplace
// 2. `BuyItem` : Buy the NFTS
// 3. `RemoveItem`: Remove the NFT listing from the marketplace
// 4. `updateListing` : update the price of nft
// 5. `withdrawProceeds` : The contract holds the payment for nfts and this function transfers the 
// proceeds to the nft lister/creater  