const {run} = require("hardhat");

const verify = async (contractAddress, constructorArgs) => {
    try{
        await run("verify:verify", {
            address: contractAddress,
            args: constructorArgs
        })
    }catch(e){
        if(e.message.toLowerCase().includes("already verified")){
            console.log("Contract already verified!!")
        }else{
            console.log("Could not verify contract...")
            console.log(e);
        }
    }
}

module.exports = verify;