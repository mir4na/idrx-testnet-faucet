const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=".repeat(60));
  console.log("Deploying IDRXFaucet to", hre.network.name);
  console.log("=".repeat(60));

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  // Get IDRX token address
  let idrxAddress = process.env.IDRX_TOKEN_ADDRESS;

  // Default addresses for known networks
  if (!idrxAddress) {
    if (hre.network.name === "base_sepolia") {
      idrxAddress = "0xa44fF300eC504991Ac6Cd88cd29E2CCDC88B6CD3"; // Deployed MockIDRX
      console.log("Using known Base Sepolia MockIDRX address");
    } else {
      console.error("Error: IDRX_TOKEN_ADDRESS not set in .env");
      process.exit(1);
    }
  }

  console.log("\nIDRX Token Address:", idrxAddress);
  console.log("-".repeat(60));

  // Deploy IDRXFaucet
  console.log("\nDeploying IDRXFaucet...");
  const IDRXFaucet = await hre.ethers.getContractFactory("IDRXFaucet");
  const faucet = await IDRXFaucet.deploy(idrxAddress);
  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("IDRXFaucet deployed to:", faucetAddress);

  // Get contract info
  const dripAmount = await faucet.dripAmount();
  const cooldownPeriod = await faucet.cooldownPeriod();

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());
  console.log("-".repeat(60));
  console.log("IDRXFaucet Address:", faucetAddress);
  console.log("IDRX Token Address:", idrxAddress);
  console.log("Drip Amount:", (dripAmount / 100n).toString(), "IDRX");
  console.log("Cooldown Period:", (cooldownPeriod / 3600n).toString(), "hours");
  console.log("=".repeat(60));

  // Save deployment info
  const deploymentFile = `./deployments-${hre.network.name}.json`;
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      IDRXFaucet: faucetAddress,
      IDRXToken: idrxAddress,
    },
    config: {
      dripAmount: dripAmount.toString(),
      dripAmountHuman: (dripAmount / 100n).toString() + " IDRX",
      cooldownPeriod: cooldownPeriod.toString(),
      cooldownPeriodHuman: (cooldownPeriod / 3600n).toString() + " hours",
    },
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", deploymentFile);

  // Instructions
  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("1. Fund the faucet with IDRX tokens:");
  console.log(`   npm run fund:base-sepolia`);
  console.log("");
  console.log("2. Verify the contract on BaseScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${faucetAddress} ${idrxAddress}`);
  console.log("");
  console.log("3. Users can claim tokens by calling claim() on:");
  console.log(`   ${faucetAddress}`);
  console.log("=".repeat(60));

  console.log("\nAdd to your .env:");
  console.log(`IDRX_FAUCET_ADDRESS=${faucetAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
