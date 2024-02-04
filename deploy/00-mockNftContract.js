module.exports = async function({deployments, network, getNamedAccounts}) {
    const {deployer} = await getNamedAccounts();
    const {deploy, log} = deployments;

    log("Deploying NftContract........");
    const deployResult = await deploy("NFTContract", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.blockConfirmations || 1
    })
    log("Mocks Deployed....");

}

module.exports.tags = ["all", "mocks"];