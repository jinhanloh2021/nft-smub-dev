// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import '@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

error PetNft__RangeOutOfBounds();
error PetNft__NotEnoughETHSent(uint256 sentAmount);
error PetNft__WithdrawFailed(uint256 withdrawAmount);
error PetNft__AlreadyInitialised();

/**
 * @title Generate NFT using VRF
 * @author Jin Han
 * @notice Extends ERC721URIStorage, which means that URI is stored on chain. Can be gas inefficient. On mint, request VRF from chainlink. When fulfilled, random num returned and used to select random NFT. Different rarity for different NFT. Users have to pay to mint. Owner of contract can withdraw ETH.
 */

contract PetNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  // Type declarations
  enum Name {
    EVE,
    TEHPENG,
    ORHORH
  }

  // VRF Variables
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint8 private constant REQUEST_CONFIRMATIONS = 3;
  uint8 private constant NUM_WORDS = 1;

  // VRF Helpers
  // Map requestId -> sender
  mapping(uint256 => address) private s_requestIdToSender;

  // NFT Variables
  uint256 public s_tokenCounter;
  string[] private s_tokenUris;
  uint256 private immutable i_mintFee;
  bool private s_initialised;

  // Events
  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Name name, uint256 tokenId, address minter);

  // Functions
  /**
   * @notice Constructor calls parents VRFConsumerBaseV2 and ERC721
   * @param _vrfCoordinator - coordinator, check https://docs.chain.link/docs/vrf-contracts/#configurations
   * @param _gasLane - the gas lane to use, which specifies the max gas price to bump to
   * @param _subscriptionId - the subId that this contract uses for funding requests
   * @param _callbackGasLimit - gas limit for callback in fulfillRandomWords()
   * @param _tokenUris - URIs of 3 NFT images
   * @param _mintFee - fee for minting NFT
   */
  constructor(
    address _vrfCoordinator,
    bytes32 _gasLane,
    uint64 _subscriptionId,
    uint32 _callbackGasLimit,
    string[3] memory _tokenUris,
    uint256 _mintFee
  ) VRFConsumerBaseV2(_vrfCoordinator) ERC721('PetNft', 'PNT') {
    i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
    i_gasLane = _gasLane;
    i_subscriptionId = _subscriptionId;
    i_callbackGasLimit = _callbackGasLimit;
    i_mintFee = _mintFee;
    _initialiseContract(_tokenUris);
  }

  /**
   * @notice Public function to call when minting NFT. Requests randomness, and maps requestId to sender address.
   * @return requestId - Identifies the transaction for VRF and for mint
   */
  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert PetNft__NotEnoughETHSent(msg.value);
    }
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  /**
   * @notice Called when VRF verifies proof of randomness and responds to request
   * @param requestId - The id initially returned by requestRandomWords()
   * @param randomWords - The VRF output expanded to the number of words
   * @dev This function uses a single random number to pick an NFT randomly. After it's picked, the nft is minted by _safeMint and the URI to the image is set.
   */
  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    address minter = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;
    s_tokenCounter += 1;
    uint8 randNum = uint8(randomWords[0] % 100); // random number between 0 - 99
    Name name = getNftName(randNum);
    _safeMint(minter, newTokenId);
    _setTokenURI(newTokenId, s_tokenUris[uint8(name)]);
    emit NftMinted(name, newTokenId, minter);
  }

  /**
   * @notice Called in constructor. Prevents constructor from being called twice.
   * @param _tokenUris Uris of NFT tokens
   */
  function _initialiseContract(string[3] memory _tokenUris) private {
    if (s_initialised) {
      revert PetNft__AlreadyInitialised();
    }
    s_tokenUris = _tokenUris;
    s_initialised = true;
  }

  /**
   * @notice Called when owner of contract wants to withdraw funds collected from mints
   * @dev Only owner can call, as extended by Ownable. Use low level call to transfer funds.
   */
  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}('');
    if (!success) {
      revert PetNft__WithdrawFailed(amount);
    }
  }

  // View/Pure functions

  /**
   * @notice This pure function is used to randomly select an NFT
   * @param randNum - Accepts the random number from fulfillRandomWords
   * @return name - The name of the randomly selected NFT
   * @dev Loops through chance array and checks if RNG lies within an interval. Each interval corresponds to an NFT name. 0-9: Eve, 10-29: OrhOrh, 30-99: TehPeng. Chance array hardcoded. Hardcoded for loop uppper bound to prevent infinite loop for safety.
   */
  function getNftName(uint8 randNum) public pure returns (Name name) {
    uint8[3] memory chanceArray = getChanceArray();
    for (uint8 i = 0; i < chanceArray.length || i == 100; i++) {
      uint8 lowerBound = 0;
      uint8 upperBound = chanceArray[i];
      if (i != 0) {
        lowerBound = chanceArray[i - 1];
      }
      if (randNum >= lowerBound && randNum < upperBound) {
        return Name(i);
      }
    }
    revert PetNft__RangeOutOfBounds();
  }

  function getChanceArray() public pure returns (uint8[3] memory) {
    return [10, 30, 100]; // hard coded
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getTokenUris(uint8 index) public view returns (string memory) {
    return s_tokenUris[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getSenderFromRequestId(
    uint256 requestId
  ) public view returns (address) {
    return s_requestIdToSender[requestId];
  }

  function getVrfCoordinator() public view returns (VRFCoordinatorV2Interface) {
    return i_vrfCoordinator;
  }

  function getSubscriptionId() public view returns (uint64) {
    return i_subscriptionId;
  }

  function getGasLane() public view returns (bytes32) {
    return i_gasLane;
  }

  function getCallbackGasLimit() public view returns (uint32) {
    return i_callbackGasLimit;
  }

  function getInitialised() public view returns (bool) {
    return s_initialised;
  }
}
