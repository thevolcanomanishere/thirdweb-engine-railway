import { FastifyInstance } from "fastify";
import { StatusCodes } from "http-status-codes";
import { getContractInstance } from "../../../../../../core/index";
import { Static, Type } from "@sinclair/typebox";
import {
  contractParamSchema,
  standardResponseSchema,
} from "../../../../../helpers/sharedApiSchemas";
import { nftSchema } from "../../../../../schemas/nft";

// INPUT
const requestSchema = contractParamSchema;
const querystringSchema = Type.Object({
  wallet_address: Type.String({
    description: "Address of the wallet to get NFTs for",
    examples: ["0x1946267d81Fb8aDeeEa28e6B98bcD446c8248473"],
  }),
});

// OUPUT
const responseSchema = Type.Object({
  result: Type.Array(nftSchema),
});

responseSchema.example = [
  {
    result: [
      {
        metadata: {
          id: "2",
          uri: "ipfs://QmWDdRcLqVMzFeawADAPr2EFCzdqCzx373VpWK3Kfx25GJ/0",
          name: "My NFT",
          description: "My NFT description",
          image:
            "ipfs://QmciR3WLJsf2BgzTSjbG5zCxsrEQ8PqsHK7JWGWsDSNo46/nft.png",
        },
        owner: "0x3EcDBF3B911d0e9052b64850693888b008e18373",
        type: "ERC721",
        supply: "1",
      },
    ],
  },
];

// LOGIC
export async function erc721GetOwned(fastify: FastifyInstance) {
  fastify.route<{
    Params: Static<typeof requestSchema>;
    Reply: Static<typeof responseSchema>;
    Querystring: Static<typeof querystringSchema>;
  }>({
    method: "GET",
    url: "/contract/:network/:contract_address/erc721/getOwned",
    schema: {
      description:
        "Get all NFTs owned by a specific wallet from a given contract.",
      tags: ["ERC721"],
      operationId: "erc721_getOwned",
      params: requestSchema,
      querystring: querystringSchema,
      response: {
        ...standardResponseSchema,
        [StatusCodes.OK]: responseSchema,
      },
    },
    handler: async (request, reply) => {
      const { network, contract_address } = request.params;
      const { wallet_address } = request.query;
      const contract = await getContractInstance(network, contract_address);
      const result = await contract.erc721.getOwned(wallet_address);
      reply.status(StatusCodes.OK).send({
        result,
      });
    },
  });
}