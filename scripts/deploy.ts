import { ethers } from "hardhat";

async function main() {

  const playableBalance = ethers.parseEther("2");

  const ftsoGuess = await ethers.deployContract("FtsoGuess", [], {
    value: playableBalance,
  });

  await ftsoGuess.waitForDeployment();

  console.log(
    `Deployed with ${ethers.formatEther(
      playableBalance
    )}FLR to ${ftsoGuess.target}`
  );
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
