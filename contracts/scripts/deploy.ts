import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying NotesRegistry with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const NotesRegistry = await ethers.getContractFactory("NotesRegistry");
  const registry = await NotesRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("✅ NotesRegistry deployed to:", address);
  console.log("\nAdd this to your backend .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log("\nAdd this to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
