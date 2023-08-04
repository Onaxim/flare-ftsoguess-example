import { ethers } from "hardhat";

import PriceSubmitterABI from "./artifacts/costwo/PriceSubmitter.json"
import FtsoManagerABI from "./artifacts/costwo/FtsoManager.json"
import FtsoRegistryABI from "./artifacts/costwo/FtsoRegistry.json"
import FtsoABI from "./artifacts/costwo/Ftso.json"
import { FtsoGuess__factory } from "../typechain-types";

// const rpcUrl = "https://coston2-api.flare.network/ext/C/rpc";
// const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

const priceSubmitter = new ethers.Contract(
      "0x1000000000000000000000000000000000000003",
      PriceSubmitterABI,
      ethers.provider
);



main()
async function main() {
      const contractAddress = "0x5b8D569Fe7d3654515C5153AAd327f35c67F8F20";
      const contract = FtsoGuess__factory.connect(contractAddress, await ethers.provider.getSigner())


      // TODO: convert contract instantiations to use typchain
      const ftsoManagerAddress = await priceSubmitter.getFtsoManager();
      const ftsoRegistryAddress = await priceSubmitter.getFtsoRegistry();

      const ftsoManager = new ethers.Contract(
            ftsoManagerAddress,
            FtsoManagerABI,
            ethers.provider
      );
      const ftsoRegistry = new ethers.Contract(
            ftsoRegistryAddress,
            FtsoRegistryABI,
            ethers.provider
      );

      const ftsoAddress = await ftsoRegistry.getFtsoBySymbol("testBTC");
      const ftso = new ethers.Contract(ftsoAddress, FtsoABI, ethers.provider);

      const epochConfig = await ftsoManager.getPriceEpochConfiguration();

      const epochStartTs = Number(epochConfig[0]);
      const epochDurationSeconds = Number(epochConfig[1]);
      const epochRevealDurationSeconds = Number(epochConfig[2]);

      console.log({ epochStartTs, epochDurationSeconds, epochRevealDurationSeconds });

      async function getCurrentTimestamp() {
            return Math.floor(Date.now() / 1000);
      }

      async function getEpochId(timestamp: number) {
            const epochId = Math.floor((timestamp - epochStartTs) / epochDurationSeconds);
            return epochId;
      }

      async function getEpochEndTimestamp(epochId: number) {
            let elapsedEpochDuration = epochId * epochDurationSeconds;
            return epochStartTs + elapsedEpochDuration + epochDurationSeconds;
      }

      async function getEpochRevealEndTimestamp(epochId: number) {
            let elapsedEpochDuration = epochId * epochDurationSeconds;
            return (
                  epochStartTs +
                  elapsedEpochDuration +
                  epochDurationSeconds -
                  epochRevealDurationSeconds
            );
      }

      let latestGuessRound = 0
      let unfinalizedRound = 0

      let latestEpoch = 0
      let latestEpochFinalized = 0

      setInterval(async () => {
            const timestamp = await getCurrentTimestamp();
            const epochId = await getEpochId(timestamp);
            const epochEndTimestamp = await getEpochEndTimestamp(epochId);
            const epochRevealEndTimestamp = await getEpochRevealEndTimestamp(epochId);
            const secondsToEndCommit = epochEndTimestamp - timestamp;
            const secondsToEndReveal = epochRevealEndTimestamp - timestamp;
            const ftsoPrice = Number((await ftso.getCurrentPrice())[0]);
            const safeFinalizeCount = Number(await contract.getSafeFinalizeTimestamp(epochId - 1)) - timestamp
            const safeFinalizeTs = (async (epochId: number) => Number(await contract.getSafeFinalizeTimestamp(epochId)))


            // finalize is only safe when once price has been revealed, for given epoch n total duration elapsed must be commit duration + reveal duration (180 + 90)
            // therefore, to finalize guesses for epoch n, we must be in middle of epoch n+1 or greater
            console.log({
                  ftsoPrice,
                  timestamp,
                  // epochEndTimestamp,
                  // epochRevealEndTimestamp,
                  safeFinalize: safeFinalizeCount < 0 ? true : false,
                  safeFinalizeEpochId: epochId - 1,
                  submittingEpoch: epochId,
                  revealingEpoch: epochId - 1,
                  secondsToEndCommit,
                  secondsToEndReveal:
                        secondsToEndReveal < 0 ? "Waiting next epoch..." : secondsToEndReveal,
            });

            // Entered new round, runs once
            if (latestEpoch < epochId) {
                  latestEpoch = epochId
                  submitGuess(epochId)
            }

            // runs every tick where safe conditon met
            if (latestEpochFinalized < (epochId - 1) && timestamp >= await safeFinalizeTs(epochId - 1)) {
                  latestEpochFinalized = epochId - 1
                  let guesserAddress = (await ethers.provider.getSigner()).address
                  let guess = await contract.getGuess(latestEpochFinalized, guesserAddress)
                  console.log({ guess, correctPrice: ftsoPrice })
                  try {
                        await contract.finalizeGuesses(latestEpochFinalized)
                        console.log(`\n\nfinalized epoch ${latestEpochFinalized} ====== \n\n`)
                  } catch (error: any) {
                        console.log('Finalize Error:', error.message)
                  }
            }

      }, 1000);

      async function submitGuess(epochId: number) {
            let guess = 123456
            const submittedGuess = await contract.submitGuess(epochId, guess, {
                  value: ethers.parseEther("0.001")
            })
            console.log(`\n\nSubmitted Guess for epoch ${epochId}, Hash: ${submittedGuess.hash}\n\n`)
      }

      // Listen to the event, this can be delayed to actual update of price
      ftso.on("PriceFinalized", (eventArgs) => {
            console.log("PriceFinalized:", Number(eventArgs));
      });

      // ftso.on("PriceRevealed", (eventArgs) => {
      //       console.log("PriceRevealed received:", eventArgs);
      // });
}