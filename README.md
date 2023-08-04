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

**HardHat Example Commands**

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
