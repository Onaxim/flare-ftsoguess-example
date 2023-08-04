// SPDX-License-Identifier: MIT

pragma solidity ^0.7.6;

import { IFtso } from "@flarenetwork/flare-periphery-contracts/songbird/ftso/userInterfaces/IFtso.sol";
import { IPriceSubmitter } from "@flarenetwork/flare-periphery-contracts/songbird/ftso/userInterfaces/IPriceSubmitter.sol";
import { IFtsoRegistry } from "@flarenetwork/flare-periphery-contracts/songbird/ftso/userInterfaces/IFtsoRegistry.sol";
import { IFtsoManager } from "@flarenetwork/flare-periphery-contracts/songbird/ftso/userInterfaces/IFtsoManager.sol";

contract FtsoGuess {

    address public owner;

    struct UserGuess {
        uint256 guess;
        uint256 credits;
    }

    mapping(uint256 => mapping(address => UserGuess)) private userGuess;
    mapping(uint256 => address[]) private participants;
    mapping(address => uint256) public balance;

    uint256 public playableBalance;

    string public symbol = "testDGB"; // to constructor
    uint256 public multiplierPercentageBip = 5000; // to constructor
    uint256 public maxGuessCredits = 10 * 10**18; // to constructor

    constructor() payable {
        owner = msg.sender; 
        playableBalance = msg.value;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function setMultiplierPercentageBip(uint256 _bips) public onlyOwner {
        multiplierPercentageBip = _bips;
    }

    function withdraw() public onlyOwner {
        address payable ownerPayable = payable(owner);
        ownerPayable.transfer(playableBalance);
    }

    function withdrawBalance() public {
        // deduct any amount in game

        require(!this.addressParticipating(msg.sender, this.getFtsoEpochId()), "must not be participating in round to withdraw");

        uint256 amount = balance[msg.sender];

        require(amount > 0, "No balance to withdraw");

        balance[msg.sender] = 0; // Set user's balance to zero before transferring

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function getPriceSubmitter() public virtual view returns(IPriceSubmitter) {
        return IPriceSubmitter(0x1000000000000000000000000000000000000003);
    }

    function getFtsoEpochConfig() public view returns(uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration) {

        IFtsoManager ftsoManager = IFtsoManager(address(getPriceSubmitter().getFtsoManager()));

        (_startTime, _commitDuration, _revealDuration) = ftsoManager.getPriceEpochConfiguration();
    }

    function getFtsoEpochId() public view returns(uint256 _epochId) {

        IFtsoRegistry ftsoRegistry = IFtsoRegistry(address(getPriceSubmitter().getFtsoRegistry()));
        IFtso ftso = IFtso(address(ftsoRegistry.getFtsoBySymbol(symbol)));

        _epochId = ftso.getCurrentEpochId();
    }

    function getSafeFinalizeTimestamp(uint256 epochId) public view returns(uint256 _safeFinalizeTimestamp) {

        (uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration ) = this.getFtsoEpochConfig();

        _safeFinalizeTimestamp = (_startTime + (epochId * _commitDuration)) + _commitDuration + _revealDuration;

    }

    function getTokenPriceWei(uint256 epoch) public view returns(uint256 _price) {

        IFtsoRegistry ftsoRegistry = IFtsoRegistry(address(getPriceSubmitter().getFtsoRegistry()));
        IFtso ftso = IFtso(address(ftsoRegistry.getFtsoBySymbol(symbol)));

        _price = ftso.getEpochPrice(epoch);
    }

    function addressParticipating(address target, uint256 epoch) public view returns (bool) {
        for (uint256 i = 0; i < participants[epoch].length; i++) {
            if (participants[epoch][i] == target) {
                return true;
            }
        }
        return false;
    }

    function submitGuess(uint256 epoch, uint256 guess) public payable {
        // reject double guess or ensure update credit amount

        require(epoch == this.getFtsoEpochId(), "guess can only be for current epochid");

        require(msg.value <= maxGuessCredits, "max guess credits exceeded");

        // consider rejecting if there is no playable balance

        if (!this.addressParticipating(msg.sender, epoch)) participants[epoch].push(msg.sender);
        
        balance[msg.sender] += msg.value;
        
        uint256 updatedBalance = userGuess[epoch][msg.sender].credits += msg.value;

        userGuess[epoch][msg.sender] = UserGuess(guess, updatedBalance);
    }

    function getGuess(uint256 epoch, address user) public view returns (uint256, uint256) {
        return (userGuess[epoch][user].guess, userGuess[epoch][user].credits);
    }

    function finalizeGuesses(uint256 epoch) public {

        uint256 safeFinalizeTimestamp = this.getSafeFinalizeTimestamp(epoch);

        // TODO: convert to ensure epoch round AND reveal period finished (endOfEpochTimestamp + revealDuration)
        // uint256 currentEpochId = this.getFtsoEpochId();
        // require(epoch < currentEpochId, "must wait for round epoch to finalize");
        
        require(block.timestamp > safeFinalizeTimestamp, "must wait for round epoch to finalize");

        require(participants[epoch].length > 0, "no participants");

        // consider ensuring token price timestamp is greater than epoch end timestamp so it's fresh, if not refund guesses
        uint256 _price = this.getTokenPriceWei(epoch);

        for (uint256 i = 0; i < participants[epoch].length; i++) {
            address userAddress = participants[epoch][i];

            UserGuess storage guess = userGuess[epoch][userAddress];

            if (guess.guess == _price) {
                uint256 decimalFraction = multiplierPercentageBip * 10**14; // 10**14 is equivalent to dividing by 10,000
                uint256 awardAmount = (guess.credits * decimalFraction) / 10**18; // Balance is in wei, so we divide by 10**18 to get the result in wei
                // Deduct credits from playable balance and send to user balance
                playableBalance -= awardAmount;
                balance[userAddress] += awardAmount;
            } else {
                // Deduct credits that user used in guess & send to playable balance
                balance[userAddress] -= guess.credits;
                playableBalance += guess.credits;
            }
        }
        delete participants[epoch];
    }

}