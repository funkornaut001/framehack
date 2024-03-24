/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog';
import { handle } from 'frog/next';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, anvil } from 'viem/chains';
import { PinataFDK } from 'pinata-fdk';
import { cutWire } from '../../game/logic';
import abi from '../../../utils/abi.json';
// import { getConnectedAddressForUser } from '@/utils/fc';
// import { ethers } from 'ethers';

/**************************
 * Inital Setup
 **************************/

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT as string,
  pinata_gateway: process.env.GATEWAY_URL as string,
});

const CONTRACT =
  (process.env.CONTRACT_ADDRESS as `0x${string}`) || '';

const account = privateKeyToAccount(
  (process.env.PRIVATE_KEY as `0x${string}`) || ''
);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(process.env.ALCHEMY_URL),
  });
// const walletClient = createWalletClient({
//   account,
//   chain: baseSepolia,
//   transport: http(process.env.ALCHEMY_URL),
// });

/**************************
 * Util Functions
 **************************/

async function checkEntered(address: any) {
  // Check if user has paid fee to enter game
  try {
    const entered = await publicClient.readContract({
      address: CONTRACT,
      abi: abi,
      functionName: 'isPlayerEntered',
      args: [address],
    });
    const hasEntered = Boolean(entered);
    return hasEntered;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function getNonce() {
  try {
    const nonce = await publicClient.readContract({
      address: CONTRACT,
      abi: abi,
      functionName: 'getNonce',
      args: [],
    });
    const gameNonce = Number(nonce);
    return gameNonce;
  } catch (error) {
    console.log(error);
    return error;
  }
}


////////////////////////////////

type State = {
  step: 0 | 1 | 2 | 3 | 4;
  buttons: string[];
};

const app = new Frog<{ State: State }>({
  initialState: {
    step: 0,
    buttons: ['red', 'blue', 'green', 'yellow'],
  },
  assetsPath: '/',
  basePath: '/api',
});

// NEEDS EDIT
// app.use(
//   "/ad",
//   fdk.analyticsMiddleware({ frameId: "hats-store", customId: "ad" }),
// );
// app.use(
//   "/finish",
//   fdk.analyticsMiddleware({ frameId: "hats-store", customId: "purchased" }),
// );

/**************************
 * Routes
 **************************/

app.frame('/', async (c) => {
  // const nonce = await getNonce();
  // console.log(nonce);
  // Welcome screen
  const { deriveState } = c;
  deriveState((previousState) => {
    // Reset state for when a player "plays again"
    previousState.buttons = ['red', 'blue', 'green', 'yellow'];
    previousState.step = 0;
  });

  //QmdeRFEw39zFSCzkin2vyv6CscpTAoWMsT4iKTy6Twiiw1
  //QmQorsSr5wv8WFyskbF77LaWremnEJYzMpWAAjneR2QKHu
  return c.res({
    action: '/wire1', // button click directs frame to wire1 route
    //Image not rendering 
    image: 'https://ipfs.io/ipfs/QmcBbZN8aoHDWXJEEa5xMVKChKv8zmvNbVBwWSmZZGSdbW',
    imageAspectRatio: "1:1",

    // intents: [
    //   //test button
    //   <Button>Play for 0.00069 SEP ETH TEST BUTTON</Button>,
    //   <Button>nonce</Button>,
    //   //<Button>Play for 0.00069 ETH</Button>,
    // ],
    // //@todo this is where we need to make the user send us eth
    intents: [
      // transaction button triggers value send
      <Button.Transaction target="/enter">
        Play for 0.00069 SEP ETH
      </Button.Transaction>,
    ],
    title: 'Defuse The Bomb!',
  });
});

app.frame('/wire1', (c) => {
  // First game screen
  const { deriveState, previousState } = c;
  // NOTE: Need to gate based on completed payment transaction
  // if (someCondition) {
  //   // if not then direct to welcome screen
  //   return c.res({
  //     action: '/',
  //     image: (
  //       <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
  //         Looks like some wires got crossed...
  //       </div>
  //     ),
  //     intents: [<Button>Go Home</Button>],
  //   });
  // }

  const state = deriveState((previousState) => {
    previousState.step = 1;
  });

  return c.res({
    action: '/wire2',
    image: 'https://ipfs.io/ipfs/QmQorsSr5wv8WFyskbF77LaWremnEJYzMpWAAjneR2QKHu',
    imageAspectRatio: "1:1",

    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame('/wire2', (c) => {
  // Second game screen
  const { deriveState, buttonValue, previousState } = c;
  if (previousState.step !== 1) {
    // check if previousState.step === 1
    // if not then direct to welcome screen
    return c.res({
      action: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Looks like some wires got crossed...
        </div>
      ),
      intents: [<Button>Go Home</Button>],
    });
  }

  const isSafe = cutWire(previousState.step);
  if (!isSafe) {
    // boom
    return c.res({
      action: '/',
      image: 'https://ipfs.io/ipfs/QmdeRFEw39zFSCzkin2vyv6CscpTAoWMsT4iKTy6Twiiw1',
      imageAspectRatio: "1:1",


      intents: [<Button>Go Home</Button>],
    });
  }

  const state = deriveState((previousState) => {
    previousState.buttons = previousState.buttons.filter(
      (btn) => btn !== buttonValue
    );
    previousState.step = 2;
  });

  return c.res({
    action: '/wire3',
    image: 'https://ipfs.io/ipfs/QmQorsSr5wv8WFyskbF77LaWremnEJYzMpWAAjneR2QKHu',
    imageAspectRatio: "1:1",

    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame('/wire3', async (c) => {
  // Third game screen
  const { deriveState, buttonValue, previousState } = c;
  if (previousState.step !== 2) {
    // check if previousState.step === 2
    // if not then direct to welcome screen
    return c.res({
      action: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Looks like some wires got crossed...
        </div>
      ),
      imageAspectRatio: "1:1",

      intents: [<Button>Go Home</Button>],
    });
  }

  const isSafe = cutWire(previousState.step);
  if (!isSafe) {
    // boom
    return c.res({
      action: '/',
      image: 'https://ipfs.io/ipfs/QmdeRFEw39zFSCzkin2vyv6CscpTAoWMsT4iKTy6Twiiw1',
      imageAspectRatio: "1:1",


      intents: [<Button>Go Home</Button>],
    });
  }

  const state = deriveState((previousState) => {
    previousState.buttons = previousState.buttons.filter(
      (btn) => btn !== buttonValue
    );
    previousState.step = 3;
  });

  return c.res({
    action: '/final',
    image: 'https://ipfs.io/ipfs/QmQorsSr5wv8WFyskbF77LaWremnEJYzMpWAAjneR2QKHu',
    imageAspectRatio: "1:1",

    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame('/final', (c) => {
  // Final screen
  const { deriveState, buttonValue, previousState } = c;
  if (previousState.step !== 3) {
    // check if previousState.step === 3
    // if not then direct to welcome screen
    return c.res({
      action: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Looks like some wires got crossed...
        </div>
      ),
      imageAspectRatio: "1:1",

      intents: [<Button>Go Home</Button>],
    });
  }

  const isSafe = cutWire(previousState.step);
  if (!isSafe) {
    // boom
    return c.res({
      action: '/',
      image: 'https://ipfs.io/ipfs/QmdeRFEw39zFSCzkin2vyv6CscpTAoWMsT4iKTy6Twiiw1',
      imageAspectRatio: "1:1",


      intents: [<Button>Go Home</Button>],
    });
  }

  const state = deriveState((previousState) => {
    // reset state after winning - prevent URL jumping
    previousState.buttons = ['red', 'blue', 'green', 'yellow'];
    previousState.step = 4;
  });

  // Call contract - Winner!
  // one button to claim prize (pull from smart contract)
  return c.res({
    action: '/',
    image: 'https://ipfs.io/ipfs/QmYvgj9cncf5oQrHohpG8nj9bpzeyqoBNo3Tf4mCRco5Qj',
    imageAspectRatio: "1:1",

    intents: [
      <Button.Transaction target="/payout">Collect Payout</Button.Transaction>,
      <Button>Play Again!</Button>,
    ],
  });
});

app.transaction('/payout', async (c) => {
  // Send winnings to user
  // how much?
  const payout = 0;

  return c.send({
    // @ts-ignore
    chainId: 'eip155:84532', // base sepolia testnet
    to: '0xaddress', // contract address
    value: parseEther(`${payout}`),
  });

  // return c.contract({
  //   abi: abi.abi,
  //   // @ts-ignore
  //   chainId: "eip155:84532",
  //   functionName: "start-game",
  //   args: [c.frameData?.fid],
  //   to: CONTRACT,
  //   value: parseEther(`${fee}`),
  // });
});


app.transaction('/enter', async (c) => {
  console.log('Collect route hit');
  // enter fee
  const fee = 0.00069;

  // return c.send({
  //   // @ts-ignore
  //   chainId: 'eip155:84532', // base sepolia testnet84532
  //   to: CONTRACT, // contract address
  //   value: parseEther(`${fee}`),
  // });

  return c.contract({
    abi: abi,
    // @ts-ignore
    chainId: "eip155:84532", //base sepolia 84532
    functionName: "play",
    args: [],
    to: CONTRACT,
    value: parseEther(`${fee}`),
  });
});

/**************************
 * End of the file exports
 **************************/
devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
