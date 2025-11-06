import web3Ready from "./blockchain.js";
import chequeContractPromise from "./chequeContract.js";

(async function() {
  try {
    const web3 = await web3Ready;
    const chequeContract = await chequeContractPromise;

    console.log("✅ Web3 ready:", web3);
    
    const tabs = document.querySelectorAll(".tab");
    const sections = document.querySelectorAll(".section");
    const submitBtn = document.getElementById("submitBtn");
    const resultMsg = document.getElementById("resultMsg");
    const tableBody = document.querySelector("#statusTable tbody");

    // Simulate user login
    let loginUser = JSON.parse(localStorage.getItem("loginUser") || '{"username":"User1"}');
    localStorage.setItem("loginUser", JSON.stringify(loginUser));

    // Tab navigation
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        sections.forEach(s => s.classList.remove("active"));
        tab.classList.add("active");

        if (tab.id === "tab-generate") {
          document.getElementById("section-generate").classList.add("active");
        } else if (tab.id === "tab-status") {
          document.getElementById("section-status").classList.add("active");
          loadStatus();
        } else if (tab.id === "tab-logout") {
          localStorage.removeItem("loginUser");
          window.location.href = "index.html";
        }
      });
    });

    // Submit button handler
    submitBtn.addEventListener("click", async () => {
      try {
        const bankName = document.getElementById("bankName").value;
        const receiverName = document.getElementById("receiverName").value.trim();
        const amount = document.getElementById("amount").value.trim();
        const chequeDate = document.getElementById("chequeDate").value;

        if (!bankName || !receiverName || !amount || !chequeDate) {
          resultMsg.style.color = "red";
          resultMsg.textContent = "Please fill all fields.";
          return;
        }

        console.log("🔵 Requesting MetaMask accounts...");
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("🟣 Accounts:", accounts);

        resultMsg.style.color = "orange";
        resultMsg.textContent = "⏳ Processing blockchain transaction...";

        console.log("🟠 Sending transaction...");
        await chequeContract.methods
          .issueCheque(accounts[0], web3.utils.toWei(amount, "ether"))
          .send({ from: accounts[0] });

        console.log("✅ Transaction complete!");
        resultMsg.style.color = "green";
        resultMsg.textContent = "✅ Cheque successfully created on blockchain!";

        // Save cheque data locally
        const cheques = JSON.parse(localStorage.getItem("cheques") || "[]");
        cheques.push({
          senderName: accounts[0],
          bankName,
          receiverName,
          amount,
          chequeDate,
          number: cheques.length + 1,
          status: "Pending"
        });
        localStorage.setItem("cheques", JSON.stringify(cheques));

        loadStatus(); // refresh table
      } catch (err) {
        console.error("❌ Blockchain transaction failed:", err);
        resultMsg.style.color = "red";
        resultMsg.textContent = "❌ Failed to create cheque. Check console.";
      }
    });

    // Load cheque records into table
    function loadStatus() {
      const cheques = JSON.parse(localStorage.getItem("cheques") || "[]");
      tableBody.innerHTML = "";

      if (cheques.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">No cheques found.</td></tr>';
        return;
      }

      cheques.forEach(chq => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${chq.senderName}</td>
          <td>${chq.bankName}</td>
          <td>${chq.receiverName}</td>
          <td>${chq.amount}</td>
          <td>${chq.chequeDate}</td>
          <td>${chq.number}</td>
          <td style="color:${chq.status === "Pending" ? "orange" : "green"};">${chq.status}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Failed to initialize:", err);
  }
})();