import { getFrameMetadata } from 'frog/next'
import type { Metadata } from 'next'
import Image from 'next/image'
import Game from './game'
// import { ConnectButton } from '@rainbow-me/rainbowkit'
// import { SendEth } from './sendEth'

import styles from './page.module.css'
import { Button } from 'frog'

export async function generateMetadata(): Promise<Metadata> {
  const frameTags = await getFrameMetadata(
    `${process.env.VERCEL_URL || 'http://localhost:3000'}/api`,
  )
  return {
    other: frameTags,
  }
}

export default function Home() {
  return (
    <main className={styles.body}>
      {/* <div>
        <p>Your mission, should you choose to accept it, is to defuse the bomb before it goes KABOOM!!!</p>
        <p>There are 3 wires that must be cut to safely disarm the bomb</p>
        <p>Good luck, agent!</p>
      </div>

      <div>
        <button className={styles.kaboombuttonred} >Red</button>
        <button className={styles.kaboombuttonblue}>Blue</button>
        <button className={styles.kaboombuttongreen}>Green</button>
        <button className={styles.kaboombuttonyellow}>Yellow</button>
      </div> */}
      {/* <ConnectButton /> */}
      {/* <SendEth /> */}
      <Game />
    </main>
  )
}
