module.exports = async ({
      // @ts-ignore
      getNamedAccounts,
      // @ts-ignore
      deployments,
      // @ts-ignore
      getChainId,
      // @ts-ignore
      getUnnamedAccounts,
}) => {
      const { deploy } = deployments;
      const { deployer } = await getNamedAccounts();
      const chainId = await getChainId();
      console.log({ chainId, deployer })
      // the following will only deploy "GenericMetaTxProcessor" if the contract was never deployed or if the code changed since last deployment
      await deploy('FtsoGuess', {
            from: deployer,
            gasLimit: 4000000,
            args: [],
      });
};
