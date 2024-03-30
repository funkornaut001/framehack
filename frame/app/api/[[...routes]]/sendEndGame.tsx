import { createWalletClient, http, createPublicClient, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

const CONTRACT = (process.env.CONTRACT_ADDRESS as `0x${string}`) || '';

const account = privateKeyToAccount(
  (process.env.PRIVATE_KEY as `0x${string}`) || ''
);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

// const request = await walletClient.prepareTransactionRequest({ 
//     account,
//     to: CONTRACT,
//     args: [address as `0x${string}`, won as boolean],
//   })

export async function sendEndTransaction(address: Address, won: boolean) { 
    const hash = await walletClient.sendTransaction({ 
        account,
        to: CONTRACT,
        args: [address as Address, won as boolean],
    })
    
  // const signature = await walletClient.signTransaction(request);    
    
  // const hash = await walletClient.sendRawTransaction(signature);    
}