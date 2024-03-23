/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from 'frog';
import { handle } from 'frog/next';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { PinataFDK } from 'pinata-fdk';
// import abi from './abi.json';

/**************************
 * Inital Setup
 **************************/

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT || '',
  pinata_gateway: '',
});

// const CONTRACT = (process.env.CONTRACT_ADDRESS as `0x${string}`) || '';

// const account = privateKeyToAccount(
//   (process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`) || ''
// );

// const publicClient = createPublicClient({
//   chain: baseSepolia,
//   transport: http(process.env.ALCHEMY_URL),
// });

// const walletClient = createWalletClient({
//   // account,
//   chain: baseSepolia,
//   transport: http(process.env.ALCHEMY_URL),
// });

/**************************
 * State
 **************************/

type State = {
  step: 0 | 1 | 2 | 3;
  buttons: string[];
};

/**************************
 * Util Functions
 **************************/

// async function checkBalance(address: any) {
//   // NEEDS EDIT
//   // Check balance of contract pot?
//   try {
//     const balance = await publicClient.readContract({
//       address: CONTRACT,
//       abi: abi.abi,
//       functionName: 'balanceOf',
//       args: [address, 0],
//     });
//     const readableBalance = Number(balance);
//     return readableBalance;
//   } catch (error) {
//     console.log(error);
//     return error;
//   }
// }

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
  // Welcome screen
  // one button to `play` - smart contract collects fee
  const { deriveState } = c;
  const state = deriveState((previousState) => {
    // reset `step` to 0
    previousState.step = 0;
  });
  return c.res({
    action: '/wire1', // button click directs frame to wire1 route
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Defuse the bomb to win!
      </div>
    ),
    intents: [
      // test button
      <Button>Play for 0.00069 ETH</Button>,
    ],
    // intents: [
    //   // transaction button triggers value send
    //   <Button.Transaction target="/collect">
    //     Play for 0.00069 ETH
    //   </Button.Transaction>,
    // ],
    title: 'Defuse The Bomb!',
  });
});

app.transaction('/collect', async (c) => {
  // Collect fee
  const fee = 0.00069;

  return c.send({
    // @ts-ignore
    chainId: 'eip155:84532', // base sepolia testnet
    to: '0xaddress', // contract address
    value: parseEther(`${fee}`),
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

app.frame('/wire1', (c) => {
  // First game screen
  // server calculates 0.75 chance of success
  const { deriveState } = c;
  const state = deriveState((previousState) => {
    previousState.step = 1;
  });
  return c.res({
    action: '/wire2',
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        Cut a wire
      </div>
    ),
    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame('/wire2', (c) => {
  // Second game screen
  // the second time, server calculates only 0.66 chance of success
  const { deriveState, buttonValue, previousState } = c;
  if (previousState.step !== 1) {
    // check if previousState.step === 1
    // if not then direct to welcome screen
    return c.res({
      browserLocation: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          redirect to home
        </div>
      ),
    });
  } else {
    const state = deriveState((previousState) => {
      previousState.buttons = previousState.buttons.filter(
        (btn) => btn !== buttonValue
      );
      previousState.step = 2;
    });
    return c.res({
      action: '/wire3',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Cut a wire
        </div>
      ),
      intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
    });
  }
});

app.frame('/wire3', async (c) => {
  // Third game screen
  // the second time, server calculates only 0.50 chance of success
  const { deriveState, buttonValue, previousState } = c;
  if (previousState.step !== 2) {
    // check if previousState.step === 2
    // if not then direct to welcome screen
    return c.res({
      browserLocation: '/',
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          redirect to home
        </div>
      ),
    });
  } else {
    const state = deriveState((previousState) => {
      previousState.buttons = previousState.buttons.filter(
        (btn) => btn !== buttonValue
      );
      previousState.step = 3;
    });
    return c.res({
      image: (
        <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
          Cut a wire
        </div>
      ),
      intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
    });
  }
});

// app.frame('/success', (c) => {
//   // Winner screen
//   // Call contract - Winner!
//   //
//   // one button to claim prize (pull from smart contract)
// });

// app.frame('/gameover', (c) => {
//   // Game over screen
//   // Call contract - Loser
//   // one button to play again
// });

/**************************
 * End of the file exports
 **************************/
devtools(app, { serveStatic });

export const GET = handle(app);
export const POST = handle(app);
