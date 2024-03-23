Instantiate anvil:
```
anvil
```

Run local deployment script
```
forge script script/DeploymentLocal.s.sol:DeploymentLocal --fork-url 'http://127.0.0.1:8545' --broadcast
```

Output should look something like this:
```
⠉ [00:00:00] [#################################################################################################################################################] 1/1 receipts (0.0s)
##### anvil-hardhat
✅  [Success]Hash: 0xca0ebc9888dd5788a856f55a00d214414e963eea46c91adb04ecf2e50947dcba
Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Block: 1
Paid: 0.002735368 ETH (683842 gas * 4 gwei)
```

Copy `Contract Address` for frontend. ABI can be found in `out > BombGame.sol > BombGame.json`