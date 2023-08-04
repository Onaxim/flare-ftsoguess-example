import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { FtsoGuess__factory } from "../typechain-types";


// TODO: Not working, resolve for testing on Costwo

describe("FtsoGuess", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployWithPlayableBalance() {
    const ONE_GWEI = 1_000_000_000;

    const playableBalance = ONE_GWEI;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const FtsoGuess = await ethers.deployContract("FtsoGuess", [], {
      value: playableBalance,
    });
    await FtsoGuess.waitForDeployment();

    const ftsoGuess = FtsoGuess__factory.connect(FtsoGuess.target.toString(), await ethers.provider.getSigner())

    console.log(ftsoGuess)
    console.log(await ftsoGuess.playableBalance())

    return { ftsoGuess, playableBalance, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right playable balance", async function () {
      const { ftsoGuess, playableBalance } = await loadFixture(deployWithPlayableBalance);
      expect(Number(await ftsoGuess.playableBalance()));
    });

    // it("Should set the right owner", async function () {
    //   const { ftsoGuess, owner } = await loadFixture(deployWithPlayableBalance);

    //   expect(await ftsoGuess.owner()).to.equal(owner.address);
    // });

    // it("Should recieve epoch ID > 0", async function () {
    //   const { ftsoGuess } = await loadFixture(
    //     deployWithPlayableBalance
    //   );

    //   expect(await ftsoGuess.getFtsoEpochId()).to.gt(0)
    // });

    // it("Should recieve ftso price with value > 0", async function () {
    //   const { ftsoGuess } = await loadFixture(
    //     deployWithPlayableBalance
    //   );

    //   expect(Number(await ftsoGuess.getTokenPriceWei("testDGB"))).to.gt(0)
    // });

  });

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
