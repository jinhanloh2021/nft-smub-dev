import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

export interface networkConfigItem {
  name?: string;
  subscriptionId?: string;
  callbackGasLimit?: BigNumber;
  vrfCoordinatorV2?: string;
  gasLane?: string;
  mintFee?: string;
}

export interface networkConfigInfo {
  [key: number]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  31337: {
    name: 'localhost',
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    callbackGasLimit: BigNumber.from((5e5).toString()),
    mintFee: (1e16).toString(), // 0.01 ETH
  },
  // Sepolia testnet VRF address: https://docs.chain.link/vrf/v2/subscription/supported-networks
  11155111: {
    name: 'sepolia',
    vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    callbackGasLimit: BigNumber.from((5e5).toString()),
    mintFee: (1e16).toString(),
    subscriptionId: process.env.SEPOLIA_VRF_SUBSCRIPTION_ID,
  },
  0: {
    name: '',
    subscriptionId: '',
    callbackGasLimit: BigNumber.from(0),
    vrfCoordinatorV2: '',
    gasLane: '',
    mintFee: '',
  },
};

export const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther('10');
export const devChains = ['hardhat', 'localhost'];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
export const BASE_FEE = ethers.utils.parseEther('0.25');
export const GAS_PRICE_LINK = BigNumber.from((1e9).toString());
