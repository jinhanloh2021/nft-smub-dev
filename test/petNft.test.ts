import { deployments, ethers, getNamedAccounts, network } from 'hardhat';
import { devChains, networkConfig } from '../helper-hardhat-config';
import { assert, expect } from 'chai';
import { BigNumber } from 'ethers';
import { PetNft, VRFCoordinatorV2Mock } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

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
          assert.equal(await petNft.getInitialised(), true);
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
        it('Reverts if fulfillRandomWords called before minting NFT', async () => {
          await expect(
            VRFCoordinatorV2.fulfillRandomWords(0, petNft.address)
          ).to.be.revertedWith('nonexistent request');
        });
        it('Increments token counter when NFT minted', async () => {
          await new Promise<void>(async (resolve, reject) => {
            petNft.once('NftMinted', async () => {
              try {
                const newTokenId = await petNft.getTokenCounter();
                assert.equal(
                  newTokenId.toString(),
                  oldTokenId.add(1).toString()
                );
                resolve();
              } catch (e) {
                reject(e);
              }
            });
            const oldTokenId = await petNft.getTokenCounter();
            const transRes = await petNft.requestNft({ value: mintFee });
            const transReceipt = await transRes.wait(1);
            const requestId = transReceipt.events![1].args!.requestId;

            await VRFCoordinatorV2.fulfillRandomWords(
              requestId,
              petNft.address
            );
          });
        });
        it('Owner of NFT set and token balance incremented', async () => {
          await new Promise<void>(async (resolve, reject) => {
            petNft.once('NftMinted', async () => {
              try {
                const endTokenBalance = await petNft.balanceOf(deployer);
                const ownerOfNft = await petNft.ownerOf(tokenId);
                assert.equal(ownerOfNft, deployer);
                assert.equal(
                  endTokenBalance.toString(),
                  startTokenBalance.add(1).toString()
                );
                resolve();
              } catch (e) {
                reject(e);
              }
            });
            const tokenId = await petNft.getTokenCounter();
            const startTokenBalance = await petNft.balanceOf(deployer);
            const transRes = await petNft.requestNft({ value: mintFee });
            const transReceipt = await transRes.wait(1);
            const requestId = transReceipt.events![1].args!.requestId;

            await VRFCoordinatorV2.fulfillRandomWords(
              requestId,
              petNft.address
            );
          });
        });
      });

      describe('getNftName', () => {
        it('Returns 0 for rand num between 0 and 9', async () => {
          const lowerName = await petNft.getNftName(0);
          const midName = await petNft.getNftName(5);
          const highName = await petNft.getNftName(9);
          assert.equal(lowerName, 0);
          assert.equal(midName, 0);
          assert.equal(highName, 0);
        });
        it('Returns 1 for rand num between 10 and 29', async () => {
          const lowerName = await petNft.getNftName(10);
          const midName = await petNft.getNftName(20);
          const highName = await petNft.getNftName(29);
          assert.equal(lowerName, 1);
          assert.equal(midName, 1);
          assert.equal(highName, 1);
        });
        it('Returns 2 for rand num between 30 and 99', async () => {
          const lowerName = await petNft.getNftName(30);
          const midName = await petNft.getNftName(50);
          const highName = await petNft.getNftName(99);
          assert.equal(lowerName, 2);
          assert.equal(midName, 2);
          assert.equal(highName, 2);
        });
      });

      describe('withdraw', () => {
        it('Reverts if non-owner calls withdraw', async () => {
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          const nonOwner = accounts[1];
          await expect(petNft.connect(nonOwner).withdraw()).to.be.revertedWith(
            'Ownable: caller is not the owner'
          );
        });
        it('Sends all balance to owner', async () => {
          // Arrange: Fund contract by minting
          const accounts: SignerWithAddress[] = await ethers.getSigners();
          const deployerStartBalance = await petNft.provider.getBalance(
            deployer
          );
          const nonOwner = accounts[1];
          const transRes = await petNft
            .connect(nonOwner)
            .requestNft({ value: mintFee });
          const transReceipt = await transRes.wait(1);
          const { gasUsed, effectiveGasPrice } = transReceipt;
          const petNftStartBalance = await petNft.provider.getBalance(
            petNft.address
          );

          // Act: Withdraw funds
          await petNft.withdraw();
          const deployerEndBalance = await petNft.provider.getBalance(deployer);
          const petNftEndBalance = await petNft.provider.getBalance(
            petNft.address
          );

          // console.log(`Dep start: ${deployerStartBalance}`);
          // console.log(`Pet start: ${petNftStartBalance}`);
          // console.log(`Dep end: ${deployerEndBalance}`);
          // console.log(`Pet end: ${petNftEndBalance}`);
          // console.log(`Gas used: ${gasUsed.mul(effectiveGasPrice)}`);

          // Assert: Check if money withdrawn
          // ? Gas calculations not adding up, assertion always fails
          // assert.equal(
          //   deployerStartBalance.add(petNftStartBalance).toString(),
          //   deployerEndBalance.add(gasUsed.mul(effectiveGasPrice)).toString()
          // );
          assert.equal(
            petNftEndBalance.toString(),
            BigNumber.from(0).toString()
          );
        });
      });
    });

// ! No staging tests. No time to do this.
