// blockchain.js

// Dynamically load Web3 from CDN
const web3Script = document.createElement("script");
web3Script.src = "https://cdn.jsdelivr.net/npm/web3@1.10.0/dist/web3.min.js";
document.head.appendChild(web3Script);

// Wait until Web3 is ready
const web3Ready = new Promise(resolve => {
  web3Script.onload = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        window.web3 = new Web3(window.ethereum);
        console.log("✅ Connected to MetaMask via Web3");
        resolve(window.web3);
      } else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
        console.log("✅ Connected via Legacy Web3 Provider");
        resolve(window.web3);
      } else {
        console.error("❌ No Web3 provider found. Please install MetaMask!");
        alert("Please install MetaMask to use this app.");
      }
    } catch (err) {
      console.error("❌ MetaMask connection error:", err);
    }
  };
});

export default web3Ready;
