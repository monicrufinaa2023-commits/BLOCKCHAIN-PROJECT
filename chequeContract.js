// chequeContract.js


import web3Ready from "./blockchain.js";
const web3 = await web3Ready;

// 🧩 Replace this address with your deployed contract address from Ganache
const contractAddress = "0x1EE050900c500293f3E2Fa31Aedd28Ea7e8bd24D";


// 🧾 Import the ABI JSON (must be in the same folder)
async function loadABI() {
  const response = await fetch("./ChequeVerification.json"); // <-- keep file in same folder or adjust path
  return await response.json();
}

// ✅ Validate the address
if (!web3.utils.isAddress(contractAddress)) {
  console.error(`❌ Invalid contract address: ${contractAddress}`);
  throw new Error("Invalid contract address");
}

// ✅ Create the contract instance
const chequeContractPromise = (async () => {
  const web3 = await web3Ready;
  const contractJSON = await loadABI();
  const chequeContract = new web3.eth.Contract(contractJSON.abi, contractAddress);
  console.log("🏦 ChequeVerification contract loaded at:", contractAddress);
  return chequeContract;
})();


// 🟢 Export for dashboard scripts
export default chequeContractPromise;
