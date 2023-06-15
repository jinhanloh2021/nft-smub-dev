import { ethers } from 'hardhat';

export interface networkConfigItem {
  name?: string;
  subscriptionId?: string;
  callbackGasLimit?: string;
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
      '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc', // 30 gwei
    callbackGasLimit: (5e5).toString(), // 500,000 gas
    mintFee: (1e16).toString(), // 0.01 ETH
  },
  // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
  11155111: {
    name: 'sepolia',
    vrfCoordinatorV2: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
    gasLane:
      '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
    callbackGasLimit: (5e5).toString(),
    mintFee: (1e16).toString(),
    subscriptionId: '2708',
  },
  0: {
    name: '',
    subscriptionId: '',
    callbackGasLimit: '',
    vrfCoordinatorV2: '',
    gasLane: '',
    mintFee: '',
  },
};

export const VRF_SUBSCRIPTION_FUND_AMOUNT = ethers.utils.parseEther('2');
export const developmentChains = ['hardhat', 'localhost'];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
