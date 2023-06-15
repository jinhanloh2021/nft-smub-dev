import { HardhatRuntimeEnvironment } from 'hardhat/types';
import 'dotenv/config';
import { ethers, network } from 'hardhat';
import verify from '../utils/verify';
import {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  VRF_SUBSCRIPTION_FUND_AMOUNT,
  devChains,
  networkConfig,
} from '../helper-hardhat-config';
import { BigNumber } from 'ethers';
import { VRFCoordinatorV2Mock } from '../typechain-types';
import { storeImages, storeMetadata } from '../utils/uploadToPinata';
import { DeployFunction, DeployResult } from 'hardhat-deploy/dist/types';

const deployBasicNft: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId ?? 0;
  let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock,
    vrfCoordinatorV2Address: string,
    subId: BigNumber,
    waitConfirmations = VERIFICATION_BLOCK_CONFIRMATIONS,
    tokenUris: string[] = ['', '', ''];

  log('---------------01-deploy-randomIpfs.ts-----------------');
  // on development chain, get address from deployed mock
  if (devChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    waitConfirmations = 1;

    const transRes = await vrfCoordinatorV2Mock.createSubscription();
    const transReceipt = await transRes.wait(1);
    subId =
      transReceipt.events && transReceipt.events[0]?.args?.subId
        ? BigNumber.from(transReceipt.events[0].args.subId)
        : BigNumber.from(1234);
    // Fund subscription
    await vrfCoordinatorV2Mock.fundSubscription(
      subId,
      VRF_SUBSCRIPTION_FUND_AMOUNT
    );
  } else {
    // on testnet/mainnet, get address from const
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2 ?? '0x0';
    subId = BigNumber.from(networkConfig[chainId].subscriptionId ?? 1234);
  }

  if (process.env.UPLOAD_TO_PINATA == 'true') {
    tokenUris = await handleTokenUris();
    log('-'.repeat(54));
  }
  const args = [
    vrfCoordinatorV2Address,
    networkConfig[chainId].gasLane,
    subId,
    networkConfig[chainId].callbackGasLimit,
    tokenUris,
    networkConfig[chainId].mintFee,
  ];

  const petNft: DeployResult = await deploy('PetNft', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitConfirmations,
  });

  if (devChains.includes(network.name)) {
    vrfCoordinatorV2Mock!.addConsumer(subId, petNft.address);
  }

  log('Pet NFT contract deployed');
  log('-'.repeat(54));

  // Verify contract if on testnet/mainnet
  if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying contract...');
    await verify(petNft.address, args);
    log(`Contract ${petNft.address} verified`);
    log('-'.repeat(54));
  }
};

const handleTokenUris = async (): Promise<string[]> => {
  // Store image in IPFS
  const { responses, files } = await storeImages('./images/');
  // Store metadata in IPFS
  const tokenUris: string[] = await storeMetadata(responses, files);

  return tokenUris;
};

deployBasicNft.tags = ['all', 'petnft', 'main'];
export default deployBasicNft;
