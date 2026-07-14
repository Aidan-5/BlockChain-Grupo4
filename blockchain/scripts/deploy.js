const hre = require("hardhat");

async function main() {

  const CredentialRegistry =
    await hre.ethers.getContractFactory(
      "CredentialRegistry"
    );

  const registry =
    await CredentialRegistry.deploy();

  await registry.waitForDeployment();

  console.log(
    "CredentialRegistry deployed at:",
    await registry.getAddress()
  );
}


main()
.catch((error)=>{
  console.error(error);
  process.exitCode = 1;
});