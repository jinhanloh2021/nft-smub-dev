import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { devChains, networkConfig } from '../helper-hardhat-config';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { PetNft, VRFCoordinatorV2Mock } from '../typechain-types';

!devChains.includes(network.name)
  ? describe.skip
  : describe('PetNFT tests', () => {
      const chainId = network.config.chainId ?? 0;
      const mintFee = BigNumber.from(networkConfig[chainId].mintFee);
      let petNft: PetNft,
        deployer: string,
        VRFCoordinatorV2: VRFCoordinatorV2Mock;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(['petnft', 'mocks']); // Fixture checks tags to deploy
        petNft = await ethers.getContract('PetNft', deployer);
        VRFCoordinatorV2 = await ethers.getContract(
          'VRFCoordinatorV2Mock',
          deployer
        );
      });

      describe('constructor', () => {
        it('Initialise state variables correctly', async () => {
          assert.equal(
            await petNft.getVrfCoordinator(),
            VRFCoordinatorV2.address
          );
          assert.equal(
            await petNft.getGasLane(),
            networkConfig[chainId].gasLane
          );
          assert.equal(
            (await petNft.getSubscriptionId()).toString(),
            BigNumber.from(1).toString()
          );
          assert.equal(
            (await petNft.getMintFee()).toString(),
            mintFee.toString()
          );
          assert.equal(await petNft.name(), 'PetNft');
          assert.equal(await petNft.symbol(), 'PNT');
        });
      });

      describe('requestNft', () => {
        it('Reverts if sender does not send enough eth', async () => {
          await expect(petNft.requestNft({ value: BigNumber.from(42) }))
            .to.be.revertedWithCustomError(petNft, 'PetNft__NotEnoughETHSent')
            .withArgs(BigNumber.from(42));
        });
        it('Returns requestId', async () => {
          const transReceipt = await (
            await petNft.requestNft({ value: mintFee })
          ).wait(1);
          const requestId = transReceipt.events![1].args!.requestId;
          assert.equal(requestId, 1);
        });
        it('Maps requestId to message sender', async () => {
          const transReceipt = await (
            await petNft.requestNft({ value: mintFee })
          ).wait(1);
          const requestId = transReceipt.events![1].args!.requestId;
          assert.equal(
            await petNft.getSenderFromRequestId(requestId),
            deployer
          );
        });
        it('Emits NFTRequested event when successfully request random words', async () => {
          await expect(petNft.requestNft({ value: mintFee }))
            .to.emit(petNft, 'NftRequested')
            .withArgs(1, deployer);
        });
      });

      describe('fulfillRandomWords', () => {
        it('Cannot fulfill random words before minting NFT', async () => {
          await expect(
            VRFCoordinatorV2.fulfillRandomWords(0, petNft.address)
          ).to.be.revertedWith('nonexistent request');
        });
        it('Emits NftMinted event when successfully fulfills random words', async () => {
          await new Promise<void>(async (resolve, reject) => {
            console.log('Wait for nftminted event');
            petNft.once('NftMinted', async () => {
              console.log('Event listened');
              try {
                console.log('Minted. Check post mint states like counter.');
                const newTokenId = await petNft.getTokenCounter();
                // console.log(`OldTokenId ${oldTokenId}`);
                // console.log(`NewTokenId ${newTokenId}`);
                resolve();
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            const oldTokenId = await petNft.getTokenCounter();
            const transRes = await petNft.requestNft({ value: mintFee });
            const transReceipt = await transRes.wait(1);
            const requestId = transReceipt.events![1].args!.requestId;

            await VRFCoordinatorV2.fulfillRandomWords(
              requestId,
              petNft.address
            );
            console.log('Called fulfill random words');
          });
        });
        describe('withdraw', () => {});
        describe('getNftName', () => {});
      });
    });
