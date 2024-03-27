"use client"
import React, { useState } from 'react';
import { NextPage } from 'next';
import { cutWire as cutWireLogic } from './game/logic';
import { useWriteContract, useAccount, useWaitForTransactionReceipt, type BaseError } from 'wagmi';
import { abi } from './game/abi';
import { parseEther, parseGwei } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';

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

  const { isConnected, address } = useAccount();

  const { 
    data: hash,
    error,
    isPending,
    writeContract
  } = useWriteContract()
    
  const { isLoading: isConfirming, isSuccess: isConfirmed  } = useWaitForTransactionReceipt({
    hash: hash,
  });
  
  async function enterGame() {
    // try {
    //   const tx = 
    writeContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'play',
      args: [],
        value: parseEther('0.00069'),
      });
      //console.log("transaction initiated: ", tx);
  } 
    // catch (error) {
    //   console.error("transaction error: ", error);
    // }
  //}

  async function endGame() {
    writeContract({
      address: contractConfig.address,
      abi: contractConfig.abi,
      functionName: 'endGame',
      args: [address as `0x${string}`, won as boolean],
    });
  }


  const cutWire = async (color: string) => {
    console.log(`Cutting the ${color} wire.`);
    
    // Using the imported cutWire logic
    const isSafe = cutWireLogic(step);

    if (isSafe) {
      if (step === 3) { // Last step before winning
        setGameStatus('defused');
        console.log('Bomb defused! Winner!');
      } else {
        setStep(step + 1);
        setAvailableWires(wires => wires.filter(wire => wire !== color)); // Remove the cut wire from available wires
      }
    } else {
      setGameStatus('exploded');
      console.log('Boom! Game Over.');
    }
  };


  return (
    <main>
      <ConnectButton />

      {isConnected === true && gameStatus === '' && step === 0 && (
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
          {isConfirmed && <div>Transaction confirmed.</div>} 
          {error && ( 
            <div>Error: {(error as BaseError).shortMessage || error.message}</div> 
          )} 
        </div>
      )}

      {gameStatus === '' && step > 0 && (
        <div>
          {availableWires.map((wire) => (
            <button key={wire} onClick={() => cutWire(wire)}>{wire}</button>
          ))}
        </div>
      )}

      {isConnected === true && gameStatus === 'defused' && (
        <p>Congratulations! You've successfully defused the bomb.</p>
      )}

      {isConnected === true && gameStatus === 'exploded' && (
        <div>
            <p>KABOOM!!!</p>
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