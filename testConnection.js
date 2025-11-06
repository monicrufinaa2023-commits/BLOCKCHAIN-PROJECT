import web3 from "./web3Config.js";
import chequeContract from "./chequeContract.js";

async function test() {
  try {
    // Get Ganache accounts
    const accounts = await web3.eth.getAccounts();
    console.log("✅ Connected accounts:", accounts);
    // Basic environment info
    try { console.log('Provider URL / connection OK'); } catch(e){}
    console.log('Contract address:', chequeContract.options && chequeContract.options.address ? chequeContract.options.address : '(unknown)');

    // Get total number of cheques (starts at 0 if none issued)
    const count = await chequeContract.methods.chequeCount().call();
    console.log("📄 Current cheque count:", count);

    // (Optional) Issue a new cheque from first account to second
    console.log("🪙 Preparing to issue new cheque...");

    // Estimate gas first to catch obvious issues
    let gasEstimate = 300000;
    try {
      gasEstimate = await chequeContract.methods.issueCheque(accounts[1], 500).estimateGas({ from: accounts[0] });
      console.log('⚙️ Estimated gas for issueCheque:', gasEstimate);
    } catch (err) {
      console.warn('⚠️ Gas estimation failed (method may revert or params are invalid):', err.message || err);
    }

    // Try a simulated call to detect reverts (this does not create a tx)
    try {
      await chequeContract.methods.issueCheque(accounts[1], 500).call({ from: accounts[0] });
      console.log('✅ Simulation call succeeded (method did not revert)');
    } catch (err) {
      console.warn('❌ Simulation (call) failed — likely revert. Reason:', err.message || err);
    }

    // Send transaction with an explicit gas limit and listen for events and errors
    console.log('🪙 Sending transaction (this may still fail if contract logic revverts or account is locked)');
    try {
      // Normalize gasEstimate which may be a BigInt (web3 v4) to a Number for send()
      let gasToUse;
      try {
        if (typeof gasEstimate === 'bigint') {
          const min = 300000n;
          gasToUse = gasEstimate > min ? Number(gasEstimate) : Number(min);
        } else {
          gasToUse = Math.max(Number(gasEstimate || 0), 300000);
        }
      } catch (convErr) {
        console.warn('Could not normalize gasEstimate, falling back to 300000:', convErr);
        gasToUse = 300000;
      }

      const receipt = await chequeContract.methods.issueCheque(accounts[1], 500).send({ from: accounts[0], gas: gasToUse });
      console.log('✅ Transaction mined. Receipt:', receipt);

      // Fetch the updated count
      const newCount = await chequeContract.methods.chequeCount().call();
      console.log("✅ Cheque successfully issued! New count:", newCount);

      // Get details of the newly issued cheque
      const cheque = await chequeContract.methods.cheques(newCount).call();
      console.log("🧾 Cheque details:", cheque);
      
      // Attempt to verify the cheque from the payee account (accounts[1])
      try {
        console.log(`🔎 Attempting to verify cheque id=${newCount} from payee ${accounts[1]}`);

        // Estimate gas for verifyCheque
        let verifyGas = 100000;
        try {
          verifyGas = await chequeContract.methods.verifyCheque(newCount).estimateGas({ from: accounts[1] });
          console.log('⚙️ Estimated gas for verifyCheque:', verifyGas);
        } catch (eg) {
          console.warn('⚠️ verifyCheque gas estimation failed:', eg.message || eg);
        }

        // Simulate call first
        try {
          await chequeContract.methods.verifyCheque(newCount).call({ from: accounts[1] });
          console.log('✅ Simulation call for verifyCheque succeeded (no revert)');
        } catch (simErr) {
          console.warn('❌ Simulation for verifyCheque failed — likely revert:', simErr.message || simErr);
        }

        // Normalize gas (handle BigInt)
        let verifyGasToUse;
        try {
          if (typeof verifyGas === 'bigint') verifyGasToUse = Number(verifyGas > 100000n ? verifyGas : 100000n);
          else verifyGasToUse = Math.max(Number(verifyGas || 0), 100000);
        } catch (gerr) { verifyGasToUse = 100000; }

        const verifyReceipt = await chequeContract.methods.verifyCheque(newCount).send({ from: accounts[1], gas: verifyGasToUse });
        console.log('✅ verifyCheque transaction mined. Receipt:', verifyReceipt);
      } catch (verifyErr) {
        console.error('❌ verifyCheque failed:', verifyErr.message || verifyErr);
        // try to decode revert reason if present
        try {
          let dataHex = null;
          if (verifyErr.data) {
            if (typeof verifyErr.data === 'string' && verifyErr.data.startsWith('0x')) dataHex = verifyErr.data;
            else if (typeof verifyErr.data === 'object') dataHex = Object.values(verifyErr.data).find(v => typeof v === 'string' && v.startsWith('0x'));
          }
          if (dataHex && dataHex.length > 138) {
            const reason = web3.utils.hexToAscii(dataHex.slice(138)).replace(/\0/g, '');
            console.error('Revert reason (decoded):', reason);
          }
        } catch (decErr) { console.warn('Could not decode verify revert reason:', decErr); }
      }
    } catch (err) {
      // Detailed error logging to help diagnose (RPC error, revert reason, insufficient funds, etc.)
      console.error('❌ Transaction failed or rejected! Error details below:');
      console.error('Error message:', err.message || err);
      if (err.receipt) console.error('Receipt:', err.receipt);
      if (err.raw && err.raw.message) console.error('Raw RPC message:', err.raw.message);
      throw err; // rethrow so outer catch logs as well
    }

  } catch (err) {
    console.error("❌ Error interacting with contract:", err);
  }
}

test();

// Global handlers to help catch silent failures
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

console.log('>> testConnection.js script invoked');

