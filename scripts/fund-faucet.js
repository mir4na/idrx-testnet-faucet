const hre = require("hardhat");
const fs = require("fs");

// MockIDRX ABI for minting
const MockIDRXABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function owner() view returns (address)",
];

async function main() {
  console.log("=".repeat(60));
  console.log("Funding IDRXFaucet on", hre.network.name);
  console.log("=".repeat(60));

  const [funder] = await hre.ethers.getSigners();
  console.log("Funder address:", funder.address);

  // Load deployment info
  const deploymentFile = `./deployments-${hre.network.name}.json`;

  if (!fs.existsSync(deploymentFile)) {
    console.error("Deployment file not found. Please deploy the faucet first.");
    console.error("Run: npm run deploy:base-sepolia");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const faucetAddress = deploymentInfo.contracts.IDRXFaucet;
  const idrxAddress = deploymentInfo.contracts.IDRXToken;

  console.log("Faucet Address:", faucetAddress);
  console.log("IDRX Token Address:", idrxAddress);

  // Get contract instances
  const idrx = new hre.ethers.Contract(idrxAddress, MockIDRXABI, funder);
  const faucet = await hre.ethers.getContractAt("IDRXFaucet", faucetAddress);

  // Check balances
  const funderBalance = await idrx.balanceOf(funder.address);
  const faucetBalance = await idrx.balanceOf(faucetAddress);

  console.log("\nCurrent balances:");
  console.log("- Funder IDRX balance:", (funderBalance / 100n).toString(), "IDRX");
  console.log("- Faucet IDRX balance:", (faucetBalance / 100n).toString(), "IDRX");

  // Amount to fund (1,000,000 IDRX = enough for 100 claims)
  const fundAmount = 1_000_000n * 100n; // 1 million IDRX with 2 decimals

  // Check if we need to mint
  if (funderBalance < fundAmount) {
    console.log("\nInsufficient balance. Attempting to mint IDRX...");

    try {
      const owner = await idrx.owner();
      if (owner.toLowerCase() !== funder.address.toLowerCase()) {
        console.error("You are not the owner of MockIDRX. Cannot mint.");
        console.error("Please get IDRX tokens from another source.");
        process.exit(1);
      }

      const mintTx = await idrx.mint(funder.address, fundAmount);
      console.log("Minting tx:", mintTx.hash);
      await mintTx.wait();
      console.log("Minted", (fundAmount / 100n).toString(), "IDRX");
    } catch (error) {
      console.error("Could not mint IDRX:", error.message);
      process.exit(1);
    }
  }

  // Approve faucet to spend tokens
  console.log("\nApproving faucet to spend IDRX...");
  const approveTx = await idrx.approve(faucetAddress, fundAmount);
  console.log("Approve tx:", approveTx.hash);
  await approveTx.wait();
  console.log("Approved!");

  // Fund the faucet
  console.log("\nFunding faucet with", (fundAmount / 100n).toString(), "IDRX...");
  const fundTx = await faucet.fundFaucet(fundAmount);
  console.log("Fund tx:", fundTx.hash);
  await fundTx.wait();
  console.log("Faucet funded!");

  // Check new balance
  const newFaucetBalance = await idrx.balanceOf(faucetAddress);
  const dripAmount = await faucet.dripAmount();
  const remainingClaims = await faucet.getRemainingClaims();

  console.log("\n" + "=".repeat(60));
  console.log("FUNDING COMPLETE");
  console.log("=".repeat(60));
  console.log("Faucet balance:", (newFaucetBalance / 100n).toString(), "IDRX");
  console.log("Drip amount:", (dripAmount / 100n).toString(), "IDRX per claim");
  console.log("Remaining claims:", remainingClaims.toString());
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
