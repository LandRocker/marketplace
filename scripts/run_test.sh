#!/bin/bash
# A simple Bash script to run Hardhat tests

set -euo pipefail

echo "Starting Hardhat node..."
npx hardhat node &
hardhat_node_pid=$!

sleep 5  # Give the node some time to start

echo "Running Hardhat tests..."
npx hardhat test --network localhost

# Clean up
kill $hardhat_node_pid
