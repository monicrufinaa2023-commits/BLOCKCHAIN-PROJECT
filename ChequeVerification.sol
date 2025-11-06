// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

contract ChequeVerification {
    struct Cheque {
        address issuer;
        address receiver;
        uint256 amount;
        bool cleared;
    }

    uint256 public chequeCount;
    mapping(uint256 => Cheque) public cheques;

    event ChequeIssued(uint256 chequeId, address indexed issuer, address indexed receiver, uint256 amount);
    event ChequeCleared(uint256 chequeId);

    function issueCheque(address _receiver, uint256 _amount) public returns (uint256) {
        chequeCount++;
        cheques[chequeCount] = Cheque(msg.sender, _receiver, _amount, false);
        emit ChequeIssued(chequeCount, msg.sender, _receiver, _amount);
        return chequeCount;
    }

    function clearCheque(uint256 _chequeId) public {
        Cheque storage c = cheques[_chequeId];
        require(msg.sender == c.receiver, "Only receiver can clear");
        require(!c.cleared, "Already cleared");
        c.cleared = true;
        emit ChequeCleared(_chequeId);
    }
}
