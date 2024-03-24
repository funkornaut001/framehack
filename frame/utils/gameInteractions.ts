import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import bombGameAbi from '../../contract/out/BombGame.sol/BombGame.json';
import { getConnectedAddressForUser } from "./fc";

//const address = getConnectedAddressForUser
const contractABI = bombGameAbi.abi;


const contractAddress = process.env.CONTRACT_ADDRESS as `0x`;

const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x`) || "");

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

export async function play(toAddress: string) {
  try {
    const { request }: any = await publicClient.simulateContract({
      account,
      address: contractAddress,
      abi: contractABI,
      functionName: "play",
    });
    const transaction = await walletClient.writeContract(request);
    return transaction;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function endGame(address: string) {
  try {
    const { request }: any = await publicClient.simulateContract({
      account,
      address: contractAddress,
      abi: contractABI,
      functionName: "endGame",
      args: [userAddress as `0x`],
    });
    const balanceData = await publicClient.writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "balanceOf",
      args: [address as `0x`, 0]
    });
    const balance: number = Number(balanceData)
    return balance
  } catch (error) {
    console.log(error);
    return error;
  }
}