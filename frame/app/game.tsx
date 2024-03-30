"use client"
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { cutWire as cutWireLogic } from './game/logic';
import { useWriteContract, useAccount, useWaitForTransactionReceipt, type BaseError, useReadContract } from 'wagmi';
import { abi } from './game/abi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { createWalletClient, http, createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

/**
 * Notes:
 * Issue with coinbase wallet not estimating gas properly
 */


const initialWires = ['Red', 'Blue', 'Green', 'Yellow'];

const contractConfig = {
  address: '0x581edB15c5bdc49d3772972DD722aF9ae6414d78',
  abi: abi,
} as const;

const Game: NextPage = () => {
  const [step, setStep] = useState(0);
  const [gameStatus, setGameStatus] = useState('');
  const [availableWires, setAvailableWires] = useState(initialWires);
  const [won, setWon] = useState(false);
  const [entered, setEntered] = useState(false);
  const { isConnected, address } = useAccount();


  async function endGameLost() {
    try {
      //Viem end game tx from owner account
      const account = privateKeyToAccount(
        (process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`) || ''
      );

      console.log("account: ", account);

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
      });

      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
      });

      const { request } = await publicClient.simulateContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'endGame',
        args: [address as `0x${string}`, false],
        account,
      })

      const endGameHash = await walletClient.writeContract(request)
      console.log("end game tx hash: ", endGameHash);

      } catch (error) {
        console.error("transaction error: ", error);
      }
    }
  
  
    async function endGameWon() {
      try {
        //Viem end game tx from owner account
        const account = privateKeyToAccount(
          (process.env.NEXT_PUBLIC_PRIVATE_KEY as `0x${string}`) || ''
        );
  
        console.log("account: ", account);
  
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
        });
  
        const walletClient = createWalletClient({
          account,
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_ALCHEMY_URL),
        });
  
        const { request } = await publicClient.simulateContract({
          address: contractConfig.address,
          abi: contractConfig.abi,
          functionName: 'endGame',
          args: [address as `0x${string}`, true],
          account,
        })
  
        const endGameHash = await walletClient.writeContract(request)
        console.log("end game tx hash: ", endGameHash);

        } catch (error) {
          console.error("transaction error: ", error);
        }
      }

  console.log("address 1: ", address);
  console.log("won 2: ", won);

    
  ///

  // check if use has entered the game on the contract
  const {data : hasEntered, refetch: refetchEntered} = useReadContract({
    address: contractConfig.address,
    abi: contractConfig.abi,
    functionName: 'isPlaying',
    args: [address as `0x${string}`],
  })
  
  // useEffect to set entered state when hasEntered is defined
  useEffect(() => {
    if (hasEntered !== undefined) {
      setEntered(hasEntered);
    }
    console.log("hasEntered: ", hasEntered)
  }, [hasEntered]);

  // useEffect to refetch entered state when address changes
  useEffect(() => {
    if (address) {
      refetchEntered();
    }
  }, [address, refetchEntered]);


  const { 
    data: hash,
    error,
    isPending,
    writeContract
  } = useWriteContract()
  
  
  const { isLoading: isConfirming, isSuccess: isConfirmed  } = useWaitForTransactionReceipt({
    hash: hash
  });

  //use effect to set step = 1 after paying entry fee
  // may need to change handle case where use navigates away from page after paying to play
  useEffect(() => {
    if (isConfirmed) {
      console.log("Transaction confirmed.");
      setEntered(true); // Update the entered state to true
      setStep(1); // Proceed to the next step of the game
    }
  }, [isConfirmed]); // Depends on the isConfirmed state
  
  
  async function enterGame() {
    try {
      writeContract({
        address: contractConfig.address,
        abi: contractConfig.abi,
        functionName: 'play',
        args: [],
        value: parseEther('0.00069'),
      });
      console.log("transaction initiated");
    }
    catch (error) {
      console.error("transaction error: ", error);
    }
  }


  const cutWire = async (color: string) => {
    console.log(`Cutting the ${color} wire.`);
    
    // Using the imported cutWire logic
    const isSafe = cutWireLogic(step);

    if (isSafe && address) {
      if (step === 3) { // Last step before winning
        setGameStatus('defused');
        setWon(true);
        endGameWon();
        setEntered(false);

        console.log('Bomb defused! Winner!');
      } else {
        setStep(step + 1);
        setAvailableWires(wires => wires.filter(wire => wire !== color)); // Remove the cut wire from available wires
      }
    } else {
      setGameStatus('exploded');
      // need error handleing for end game tx
      if (address) {
        console.log("address lost: ", address);
        console.log("won: ", won);

        endGameLost()
      }
      setEntered(false);
      console.log('Boom! Game Over.');
    }
  };


  return (
    <main>
      <ConnectButton />
      <div>
        <button onClick={endGameLost}>
          End Game L
        </button>
      </div>
      <div>
        <button onClick={endGameWon}>
          End Game W
        </button>
      </div>
      {isConnected === true && gameStatus === '' && !entered && (
        <div>
          {/* <p>My address is {address}</p> */}
          <button
            disabled={isPending}
            onClick={enterGame}
          >
            Send Eth To Play
            {isPending ? 'Confirming...' : 'Enter Game'} 
          </button>
          {hash && <div>Transaction Hash: {hash}</div>} 
          {isConfirming && <div>Waiting for confirmation...</div>} 
          {isConfirmed &&
            <div>
              Transaction confirmed.
            </div>        
          } 
          {error && ( 
            <div>Error: {(error as BaseError).shortMessage || error.message}</div> 
          )} 
        </div>
      )}

      {gameStatus === '' && step > 0 /*&& isConfirmed*/ && entered === true && (
        <div>
          {availableWires.map((wire) => (
            <button key={wire} onClick={() => cutWire(wire)}>{wire}</button>
          ))}
        </div>
      )}

      {isConnected === true && gameStatus === 'defused' && entered === true && (
        <p>Congratulations! {address} You've successfully defused the bomb.</p>
      )}

      {isConnected === true && gameStatus === 'exploded' && (
        <div>
          <p>KABOOM!!!</p>
          {/* reset the game */}
          <button onClick={() => {
            setStep(0);
            setGameStatus('');
            setAvailableWires(initialWires);
          }}>Play Again</button>
         
        </div>
      )}
    </main>
  );
}

export default Game;