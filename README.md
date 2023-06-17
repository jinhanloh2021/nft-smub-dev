<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a name="readme-top"></a>

<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Don't forget to give the project a star!
*** Thanks again! Now go create something AMAZING! :D
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/jinhanloh2021/nft-smub-dev">
    <img src="./images//Logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">NFT Pet</h3>

  <p align="center">
    SMU Blockchain Developer Project
    <br />
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a>
      <ul>
      <li><a href="#options"/>Options</li></ul>
    </li>
    <li><a href="#additional-notes">Additional-notes</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

A project to learn about implementing ERC721 and VRF for an NFT. Learn how to deploy to local and testnets, unit testing with chai.

View the deployment on sepolia <a href="https://sepolia.etherscan.io/address/0x0487bEb78Da01400acD59fA68FfAaeA5cEBaD4E0">etherscan</a>.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- Hardhat
- Chainlink VRF
- Chai
- Typescript
- Solidity

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

### Prerequisites

Developed on **WSL2**. Application should work on Linux and Mac. Not tested on native Windows.

- yarn
  ```sh
  npm install --global yarn
  ```
- NodeJs
  ```
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm --version
  nvm install 16.14.2
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/jinhanloh2021/nft-smub-dev.git
   ```
2. Install yarn packages
   ```sh
   yarn
   ```
3. Fill in environment variables. See `.env.example` for and <a href="#options">options</a> for instructions

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

1. Compilation

```sh
yarn hardhat compile
```

2. Deployment (local network). Add `--network sepolia` to deploy on testnet.

```sh
yarn hardhat deploy
```

3. Testing

```sh
yarn hardhat test
```

### Options:

- The contract is auto verified on etherscan when deployed. You can turn this setting off by leaving `ETHERSCAN_API_KEY` empty.
- Turn off gas reporting by setting GasReporter `enabled` to `false` in `hardhat.config.ts`.
- Gas cost is calculated in USD by using the `COINMARKETCAP_API_KEY`. This can be turned off by leaving the field empty.
- During deployment, images are uploaded to IPFS using **Pinata**. Set `UPLOAD_TO_PINATA` to `false` to turn off this feature.
- Images for NFT can be changed in the `./images` folder but keep the filename the same and the number of images to 3.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Additional Notes

Gas issues in unit test. No staging tests although deployment to testnet successful. Image files upload not scalable to 10000 images. Hardcoded rarity values. Not gas optimised. NFTs are not collectible, they are just photos of pets I took.

<!-- CONTACT -->

## Contact

Jin Han - jinhan.loh.2021@scis.smu.edu.sg

Project Link: [https://github.com/jinhanloh2021/nft-smub-dev](https://github.com/jinhanloh2021/nft-smub-dev)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
