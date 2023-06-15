import pinataSDK, { PinataPinResponse } from '@pinata/sdk';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

interface iMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: [
    {
      trait_types: string;
      value: number;
    }
  ];
}

export const storeImages = async (imagesFilePath: string) => {
  // ./images/ -> absolute file path
  const fullImagesPath = path.resolve(imagesFilePath);
  const files = fs.readdirSync(fullImagesPath);
  let responses = [];
  console.log(`Uploading images to IPFS...`);
  for (const fileIndex in files) {
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    const options = {
      pinataMetadata: {
        name: files[fileIndex],
      },
    };
    try {
      const res = await pinata.pinFileToIPFS(readableStreamForFile, options);
      responses.push(res);
      console.log(`File: ${files[fileIndex]} uploaded...`);
    } catch (e) {
      console.error(e);
    }
  }
  return { responses, files };
};

export const storeMetadata = async (
  responses: PinataPinResponse[],
  files: string[]
) => {
  let tokenUris: string[] = [];
  console.log('Uploading metadata to IPFS...');

  for (const imageUploadResIndex in responses) {
    // Create metadata
    const tokenUriMetadata: iMetadata = {
      name: files[imageUploadResIndex].replace('.png', ''),
      description: '',
      image: `ipfs://${responses[imageUploadResIndex].IpfsHash}`,
    };
    tokenUriMetadata.description = `My cute pet ${
      tokenUriMetadata.name ?? 'unknown'
    }`;

    // Upload JSON metadata to pinata
    const metadataUploadRes = await storeTokenUriMetadata(tokenUriMetadata);
    tokenUris.push(`ipfs://${metadataUploadRes?.IpfsHash}`);
    console.log(`Metadata: ${tokenUriMetadata.name} uploaded...`);
  }
  return tokenUris;
};

const storeTokenUriMetadata = async (metadata: iMetadata) => {
  try {
    const res = await pinata.pinJSONToIPFS(metadata);
    return res;
  } catch (e) {
    console.error(e);
  }
  return null;
};
