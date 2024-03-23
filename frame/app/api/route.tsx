/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput, parseEther } from "frog";
import { handle } from "frog/next";
import { createWalletClient, http, createPublicClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { PinataFDK } from "pinata-fdk";
import abi from "./abi.json";

/**************************
 * Inital Setup
 **************************/

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT || "",
  pinata_gateway: "",
});

const CONTRACT = (process.env.CONTRACT_ADDRESS as `0x`) || "";

const account = privateKeyToAccount((process.env.PRIVATE_KEY as `0x`) || "");

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(process.env.ALCHEMY_URL),
});

// const buttons = ["red", "blue", "green", "yellow"];
// const buttons = [
//   { name: "red", button: <Button value="red">Red</Button> },
//   { name: "blue", button: <Button value="blue">Blue</Button> },
//   { name: "green", button: <Button value="green">Green</Button> },
//   { name: "yellow", button: <Button value="yellow">Yellow</Button> },
// ];

// type Btn = { name: String, button: typeof Button}

// const buttons: Array<Btn> = [
//   { name: "red", button: <Button value="red">Red</Button> },
//   { name: "blue", button: <Button value="blue">Blue</Button> },
//   { name: "green", button: <Button value="green">Green</Button> },
//   { name: "yellow", button: <Button value="yellow">Yellow</Button> },
// ];

/**************************
 * State
 **************************/

type State = {
  currentWire: 0 | 1 | 2 | 3;
  buttons: string[];
  // cutWires: String[];
};

/**************************
 * Util Functions
 **************************/

async function checkBalance(address: any) {
  // NEEDS EDIT
  // Check balance of contract pot?
  try {
    const balance = await publicClient.readContract({
      address: CONTRACT,
      abi: abi.abi,
      functionName: "balanceOf",
      args: [address, 0],
    });
    const readableBalance = Number(balance);
    return readableBalance;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// NEEDS EDIT???
const app = new Frog<{ State: State }>({
  initialState: {
    currentWire: 0,
    buttons: ["red", "blue", "green", "yellow"],
    // cutWires: [],
  },
  assetsPath: "/",
  basePath: "/api",
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

app.frame("/", async (c) => {
  // Welcome screen
  // one button to `play` - smart contract collects fee
  return c.res({
    // button click directs frame to wire1 route
    action: "/wire1",
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Defuse the bomb to win!
      </div>
    ),
    intents: [
      // transaction button triggers value send
      <Button.Transaction target="/collect">
        Play for 0.00069 ETH
      </Button.Transaction>,
    ],
    title: "Defuse The Bomb!",
  });
});

app.transaction("/collect", async (c) => {
  // Collect fee
  const fee = 0.00069;

  return c.send({
    // @ts-ignore
    chainId: "eip155:84532", // base sepolia testnet
    to: "0xaddress", // contract address
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

app.frame("/wire1", (c) => {
  const { deriveState } = c;
  const state = deriveState((previousState) => {
    previousState.currentWire++;
  });
  // if (state.currentWire === 1) {} else {}
  return c.res({
    action: "/wire2",
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Cut a wire
      </div>
    ),
    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame("/wire2", (c) => {
  // Second game screen
  // the second time, server calculates only 0.66 chance of success
  const { deriveState, buttonValue } = c;
  const state = deriveState((previousState) => {
    previousState.buttons = previousState.buttons.filter(
      (btn) => btn !== buttonValue,
    );
    previousState.currentWire = 2;
    // if (previousState.currentWire === 0) {
    //   previousState.currentWire = 1;
    // }
  });
  // if (state.currentWire === 1) {} else {}
  return c.res({
    action: "/wire3",
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Cut a wire
      </div>
    ),
    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame("/wire3", async (c) => {
  // Third game screen
  const { deriveState, buttonValue } = c;
  const state = deriveState((previousState) => {
    previousState.buttons = previousState.buttons.filter(
      (btn) => btn !== buttonValue,
    );
    previousState.currentWire = 2;
    // if (previousState.currentWire === 0) {
    //   previousState.currentWire = 1;
    // }
  });
  // if (state.currentWire === 1) {} else {}
  return c.res({
    image: (
      <div style={{ color: "white", display: "flex", fontSize: 60 }}>
        Cut a wire
      </div>
    ),
    intents: state.buttons.map((btn) => <Button value={btn}>{btn}</Button>),
  });
});

app.frame("/success", async (c) => {
  // Winner screen
  // Call contract - Winner!
  //
  // one button to claim prize (pull from smart contract)
});

app.frame("/gameover", async (c) => {
  // Game over screen
  // Call contract - Loser
  // one button to play again
});

/**************************
 * End of the file exports
 **************************/

export const GET = handle(app);
export const POST = handle(app);
