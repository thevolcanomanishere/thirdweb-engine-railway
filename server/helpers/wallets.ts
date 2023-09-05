import { CreateKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { KeyManagementServiceClient } from "@google-cloud/kms";
import * as protos from "@google-cloud/kms/build/protos/protos";
import { providers } from "ethers";
import { GcpKmsSigner } from "ethers-gcp-kms-signer";
import { FastifyInstance } from "fastify";
import { env } from "../../core";

const AWS_REGION = process.env.AWS_REGION;

export async function createAWSKMSWallet(
  fastify: FastifyInstance,
  description: string,
): Promise<{ keyId: string; arn: string }> {
  try {
    // key input params
    const input = {
      Description: description,
      KeyUsage: "SIGN_VERIFY",
      KeySpec: "ECC_SECG_P256K1",
      MultiRegion: false,
    };
    const client = new KMSClient({
      region: AWS_REGION,
    });

    const command = new CreateKeyCommand(input);
    const response = await client.send(command);

    fastify.log.debug(
      `Created KMS Key in Region ${AWS_REGION}, KeyId: ${
        response.KeyMetadata!.KeyId
      }, KeyArn: ${response.KeyMetadata!.Arn} `,
    );

    return {
      keyId: response.KeyMetadata!.KeyId!,
      arn: response.KeyMetadata!.Arn!,
    };
  } catch (error) {
    throw error;
  }
}

export const createGCPKMSWallet =
  async (): Promise<protos.google.cloud.kms.v1.ICryptoKey> => {
    try {
      if (!env.GCP_KEY_RING_ID || !env.GCP_LOCATION_ID || !env.GCP_PROJECT_ID) {
        throw new Error(
          "GCP_KEY_RING_ID or GCP_LOCATION_ID or GCP_PROJECT_ID is not defined. Please check .env file",
        );
      }

      const kmsCredentials = {
        projectId: env.GCP_PROJECT_ID!, // your project id in gcp
        locationId: env.GCP_LOCATION_ID!, // the location where your key ring was created
        keyRingId: env.GCP_KEY_RING_ID!, // the id of the key ring
      };

      const client = new KeyManagementServiceClient({
        credentials: {
          client_email: env.GOOGLE_APPLICATION_CREDENTIAL_EMAIL,
          private_key: env.GOOGLE_APPLICATION_CREDENTIAL_PRIVATE_KEY,
        },
        projectId: env.GCP_PROJECT_ID,
      });

      // Build the parent key ring name
      const keyRingName = client.keyRingPath(
        kmsCredentials.projectId,
        kmsCredentials.locationId,
        kmsCredentials.keyRingId,
      );
      const [key] = await client.createCryptoKey({
        parent: keyRingName,
        cryptoKeyId: `web3api-${new Date().getTime()}`,
        cryptoKey: {
          purpose: "ASYMMETRIC_SIGN",
          versionTemplate: {
            algorithm: "RSA_SIGN_PKCS1_2048_SHA256",
          },
        },
      });

      return key;
    } catch (error) {
      throw error;
    }
  };

export const getGCPKeyWalletAddress = async (
  name: string,
  provider: providers.Provider,
): Promise<string> => {
  try {
    // ToDo Need to change the hard-coded stuff
    const kmsCredentials = {
      projectId: env.GCP_PROJECT_ID!,
      locationId: env.GCP_LOCATION_ID!,
      keyRingId: env.GCP_KEY_RING_ID!,
      keyId: "test-web3-api", // the id of the key
      keyVersion: "1",
    };

    let signer = new GcpKmsSigner(kmsCredentials);
    signer = signer.connect(provider);
    const walletAddress = await signer.getAddress();
    return walletAddress;
  } catch (error) {
    console.log(error);
    throw error;
  }
};