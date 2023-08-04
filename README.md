# FtsoGuess Hardhat Project

> :warning: - **Code is not audited and not considered production ready:** Use as example only.

Tested on node v16.20.1

**How To Use**

Copy `.env-example` to `.env` and fill in private keys data and RPC

- Get tokens from faucet: https://coston2-faucet.towolabs.com/
- Access node/RPC without rate-limit: https://api-portal.flare.network/
- Deploy your own node: https://docs.flare.network/infra/observation/deploying/

```shell
# Install dependencies
npm install

# Compile contract
npx hardhat compile

# Deploy contract
npx hardhat run scripts/deploy.ts --network costwo

# Optionally watch FTSO epochs and sample guesses and finalizations
npx hardhat run scripts/watchDeployment.ts --network costwo
```

Adding networks can be done in `hardhat.config.ts`

Deployed example: https://coston2-explorer.flare.network/address/0x5b8D569Fe7d3654515C5153AAd327f35c67F8F20

**Description**

FTSO Guess is a contract that uses the FTSO system to get price data for crypto currency and allows users to guess what the next price will be and award the user with credits if they guess correctly or deduct credits if they guess incorrectly.

The user calls `submitGuess` providing an active epochId (an epoch where submissions are still being provided), a guess of what the next finalized price will be and also provide some native tokens as credit.

All guesses will be stored in the contract and anyone can call `finalizeGuesses` providing the epochId for an elapsed epoch and accounting for the reveal period (ie. 90 seconds into the next epoch). This is secured by using the `getSafeFinalizeTimestamp` which provides a timestamp calculated as epochDuration + revealDuration (180 sec + 90 sec) which is added to the given epochs start time.

For example _epoch n_ start time is at _1691156500_ (the time where data providers begin submitting data), we add _270 (180 + 90) seconds_.

The `finalizeGuesses` method will loop over all guesses for the epoch awarding any correct guesses.

**HardHat Example Commands**

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
