import { createPublicClient, createWalletClient, http } from "@/node_modules/viem/_types/index";
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from "viem/accounts";
import bombGameAbi from "../../contract/out/BombGame.sol/BombGame.json"

////////////////////////////////////////////////////////////////////////
// assume that these contract data are imported from somewhere - feel free to configure how you want
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // replace with deployed address
const contractABI = bombGameAbi.abi
const contractConfig = { address: contractAddress, abi: contractABI }
////////////////////////////////////////////////////////////////////////

const userAddress = '0x1111222233334444555566667777888899990000' // replace with user's authenticated addr4ess

////////////////////////////////////////////////////////////////////////
// defines various viem clients - I assume these will most likely be defined at the top level of the routes
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

const walletClient = createWalletClient({
  account: userAddress,
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

const ownerAddress = privateKeyToAccount((process.env.PRIVATE_KEY as `0x`) || ""); //assumes PK is stored somewhere as ENV variable

const ownerWalletClient = createWalletClient({
  account: ownerAddress,
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
})
///////////////////////////////////////////////////////////////////////


// NOTE: not including error handling in everything as I'm not really sure how you want to implement

// get the current gameNonce - we need this to pay out winners
async function getGameNonce() {
  const nonce = await publicClient.readContract({
    ...contractConfig,
    functionName: 'gameNonce'
  }) 
  return nonce // bigint
}

// get entry price to pass with play()
async function getEntryFee() {
  const fee = await publicClient.readContract({
    ...contractConfig,
    functionName: 'ENTRY_FEE'
  }) 
  return fee // bigint
}

// check that smart contract has received payment and recorded user as playing
async function isPlaying() {
  const userIsPlaying = await publicClient.readContract({
    ...contractConfig,
    functionName: "isPlaying",
    args: [userAddress]
  })
  return userIsPlaying // boolean
}

// function to initiate game - user must sign from their wallet
async function play() {
  try {
    const { request }: any = await publicClient.simulateContract({
      account: userAddress,
      ...contractConfig,
      functionName: "play",
      value: getEntryFee() // maybe better to save this in a variable rather than calling it directly here
    });
    const transaction = await walletClient.writeContract(request);
    
    // not sure if this is the right place to do this, but somewhere we want to wait for the transaction receipt
    // and use it to verify that the user has paid to initiate the game
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: transaction
    }) 
    return receipt // type TransactionReceipt (from Viem)
  } catch (error) {
    console.log(error);
    return error;
  }
}

// this function should be called when the game ends - pass the user address + true (for win) or false (for lose)
// this must be called from the `owner` account - not user account
async function endGame(isWinner: boolean) {
  try {
    const { request }: any = await publicClient.simulateContract({
      account: ownerAddress,
      ...contractConfig,
      functionName: "endGame",
      args: [userAddress, isWinner]
    });
    const transaction = await ownerWalletClient.writeContract(request);
    
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: transaction
    }) 
    return receipt // type TransactionReceipt (from Viem)
  } catch (error) {
    console.log(error);
    return error;
  }
}

// this function should be called when the user wins
// user must sign transaction to pull the prize money
async function claimWinnings(gameNonce: bigint) {
  const nonce = await getGameNonce() // may need error handling here
  try {
    const { request }: any = await publicClient.simulateContract({
      account: userAddress,
      ...contractConfig,
      functionName: "claimWinnings",
      args: [nonce]
    });
    const transaction = await ownerWalletClient.writeContract(request);
    // definitely need some mechanism to check whether transfer was successful
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: transaction
    }) 
    return receipt // type TransactionReceipt (from Viem)
  } catch (error) {
    console.log(error);
    return error;
  }
}


export {}
