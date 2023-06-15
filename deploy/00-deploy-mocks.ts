import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { developmentChains } from '../reference/helper-hardhat-config';
import { BigNumber, ethers } from 'ethers';
import { DeployFunction } from 'hardhat-deploy/dist/types';

const BASE_FEE = ethers.utils.parseEther('0.25'); // 0.25 is the premium
const GAS_PRICE_LINK = BigNumber.from((1e9).toString());

const deployMocks: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log('------------------00-deploy-mocks.ts------------------');
  if (developmentChains.includes(network.name)) {
    log('Local network detected. Deploying mocks...');
    // deploy mock vrf coordinator
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    });
    log('Mocks deployed');
    log('-'.repeat(54));
  } else {
    log('Testnet or Mainnet detected, skipping mocks...');
    log('-'.repeat(54));
  }
};

deployMocks.tags = ['all', 'mocks'];
export default deployMocks;
