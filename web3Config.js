import Web3 from "web3";

// Create a web3 instance that works both in Node (tests) and in-browser (MetaMask).
let web3;

// In Node there is no `window` global — guard references with typeof.
if (typeof window !== 'undefined' && window.ethereum) {
  // Browser environment with an injected provider (MetaMask)
  web3 = new Web3(window.ethereum);
  // Request accounts asynchronously but don't block module evaluation (avoid top-level await)
  if (window.ethereum.request) {
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(() => console.log('✅ Connected through MetaMask'))
      .catch(() => console.warn('⚠️ MetaMask connection request denied'));
  }
} else {
  // Fallback for Node / local development: connect to Ganache or local RPC
  console.warn('⚠️ MetaMask not detected or running in Node — using local Ganache RPC as fallback');
  web3 = new Web3('http://127.0.0.1:7545');
}

export default web3;
