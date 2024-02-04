require("dotenv").config();
const verify = require("../utils/verify");

const developmentChains = ["hardhat", "localhost"];

module.exports = async function({deployments, network, getNamedAccounts}) {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;

    log("Deploying NftMarketPlaceContract........");
    const deployResult = await deploy("NftMarketPlace", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.blockConfirmations || 1
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log("Verifying contract........Pls wait...");
        await verify(deployResult.address, [])
    }

}

module.exports.tags = ["all", "NFTMarketPlace"];
