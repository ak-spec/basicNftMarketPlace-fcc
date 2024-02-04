const {expect, assert} = require("chai");
const developmentChains = ["hardhat", "localhost"];
const {network, deployments, getNamedAccounts, ethers} = require("hardhat");

!developmentChains.includes(network.name) ? describe.skip("") :

describe("NftMarketPlace Testing", function() {
    
    let nftSeller, nftBuyer, nftContract, nftMarketPlace;
    let owner, approvedOperator, tokenId;
    
    beforeEach(async () => {
        await deployments.fixture("all");
        nftSeller = (await getNamedAccounts()).seller;
        nftBuyer = (await getNamedAccounts()).buyer;

        nftContract = await ethers.getContract("NFTContract", nftSeller);
        nftMarketPlace = await ethers.getContract("NftMarketPlace", nftSeller);

        const tx = await nftContract.mintNft();
        await tx.wait(1);

        await nftContract.approve(nftMarketPlace.target, 0);
        const tx_res = await nftMarketPlace.listItem(nftContract.target, 0, ethers.parseEther("1"));
        const tx_receipt = await tx_res.wait(1);
        [owner, approvedOperator, tokenId] = tx_receipt.logs[0].args;
    });

    describe("listItem", function() {

        describe("Test revert cases", function () {
            it("reverts when caller is not the owner of the nft", async function(){
                marketPlaceConnectedToBuyer = await ethers.getContract("NftMarketPlace", nftBuyer);
                const tx = await nftContract.mintNft();
                await tx.wait(1);
                await expect(marketPlaceConnectedToBuyer.listItem(nftContract.target, 1, ethers.parseEther("1")))
                .to.be.revertedWithCustomError(marketPlaceConnectedToBuyer, "NftMarketPlace__NotOwner");
            });
    
            it("reverts when the nft is listed for a price of 0", async function (){
                const tx = await nftContract.mintNft();
                await tx.wait(1);
                await expect(nftMarketPlace.listItem(nftContract.target, 1, ethers.parseEther("0")))
                .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__PriceMustBeAboveZero");
            });
    
            it("reverts when the nft is not approved for marketplace", async function (){
                const tx = await nftContract.mintNft();
                await tx.wait(1);
                await expect(nftMarketPlace.listItem(nftContract.target, 1, ethers.parseEther("1")))
                .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotApprovedForMarketPlace");
            });
        })
        
        describe("List Nft successfully and list the same nft again to test alreadyListed error", function(){
            it("successfully lists nft on the marketplace when all input is gd", async () => {
                //first approve the marketplace in nftContract
                assert(owner, nftSeller);
                assert(approvedOperator, nftMarketPlace.target);
                assert(tokenId.toString(), "0");
                const listing = await nftMarketPlace.getListing(nftContract.target, 0);
                assert(listing[0], nftSeller);
                assert(listing[1] == ethers.parseEther("1"));
            });

            it("reverts when trying to relist an already listed nft", async () => {
                await expect(nftMarketPlace.listItem(nftContract.target, 0, ethers.parseEther("1")))
                .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__AlreadyListed")
                .withArgs(nftContract.target, 0);
            })

        })
    })

    describe("buyItem", function(){

        beforeEach(async () => {    
            nftContractConnectedToBuyer = await ethers.getContract("NftMarketPlace", nftBuyer);
        });

        it("reverts when buying an nft that is not listed", async () => {
            await expect(nftContractConnectedToBuyer.buyItem(nftContract.target, 1, {value: ethers.parseEther("1")}))
            .to.be.revertedWithCustomError(nftContractConnectedToBuyer, "NftMarketPlace__NotListed").withArgs(nftContract.target, 1);
        });
        it("reverts when the owner of nft is trying to buy it", async () => {
            await expect(nftMarketPlace.buyItem(nftContract.target, 0, {value: ethers.parseEther("1")}))
            .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__OwnerCannotBuyOwnItem");
        });
        it("reverts when insufficient purchase amount is entered", async () => {
            const nftMarketPlaceToBuyer = await ethers.getContract("NftMarketPlace", nftBuyer);
            await expect(nftMarketPlaceToBuyer.buyItem(nftContract.target, 0))
            .to.be.revertedWithCustomError(nftMarketPlaceToBuyer, "NftMarketPlace__InsufficientPurchaseAmt");
        });
        it("updates state variables properly on successful purchase", async () => {
            await expect(nftContractConnectedToBuyer.buyItem(nftContract.target, 0, {value: ethers.parseEther("1")}))
            .to.emit(nftMarketPlace, "ItemBought");

            const proceeds = await nftContractConnectedToBuyer.getProceeds(nftSeller);
            const newOwner = await nftContract.ownerOf(0);
            const deletedListing = await nftContractConnectedToBuyer.getListing(nftContract.target, 0);

            assert(proceeds.toString, "1");
            assert(newOwner, nftBuyer);
            assert(deletedListing[0], "0");
            assert(deletedListing[1].toString(), "0");
        });

    })

    describe("removeListing", function(){
       it("updates state variables correctly on success", async () => {
            await expect(nftMarketPlace.removeListing(nftContract.target, 0))
            .to.emit(nftMarketPlace, "ItemUnlisted").withArgs(nftSeller, nftContract.target, 0);
            const deletedListing = await nftMarketPlace.getListing(nftContract.target, 0);
            assert(deletedListing[0], "0");
            assert(deletedListing[1].toString(), "0");
       })

    });

    describe("updateListing", function() {
        it("reverts when newPrice is 0", async function(){
            await expect(nftMarketPlace.updateListing(nftContract.target, 0, ethers.parseEther("0")));
            .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__PriceMustBeAboveZero");
        });

        it("updates new price correctly and emits an event", async () => {
            await expect(nftMarketPlace.updateListing(nftContract.target, 0, ethers.parseEther("2")));
            .to.emit(nftMarketPlace, "ItemListed").withArgs(nftSeller, nftContract.target, 0, ethers.parseEther("2"));

            const updatedListing = await nftMarketPlace.getListing(nftContract.target, 0);
            assert(updatedListing[1], ethers.parseEther("2"));
        })
    });

    describe("withdrawProceeds", function(){
        it("reverts when seller has zero proceeds", async () => {
            await expect(nftMarketPlace.withdrawProceeds())
            .to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__ZeroProceeds")
        });

        it("updates state variables correctly after withdrawing", async () => {
            contractConnectedToBuyer = await ethers.getContract("NftMarketPlace", nftBuyer);
            await contractConnectedToBuyer.buyItem(nftContract.target, 0, {value: ethers.parseEther("1")});

            const balance_bef = await ethers.provider.getBalance(nftSeller);
            
            const tx = await nftMarketPlace.withdrawProceeds();
            tx_receipt = await tx.wait(1);

            const {gasUsed, gasPrice} = tx_receipt;
            const totalGasSpent = gasPrice * gasUsed;
            const balance_aft = await ethers.provider.getBalance(nftSeller);

            const proceeds = await nftMarketPlace.getProceeds(nftSeller);
            expect(proceeds).to.equal(0);           
            expect(balance_aft).to.equal(balance_bef + ethers.parseEther("1") - totalGasSpent);
        })
    })
});