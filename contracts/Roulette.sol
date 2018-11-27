pragma solidity ^0.4.24;

import "./BackingContract.sol";
import "oraclize-api/contracts/usingOraclize.sol";
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

/**
 * @title Roulette
 * @author Rosco Kalis <roscokalis@gmail.com>
 */
contract Roulette is usingOraclize, Pausable, BackingContract {
    /*
     * checks player profit, bet size and player number is within range
     */
    modifier betIsValid(uint _value, uint8[] _numbers) {
        require(_numbers.length > 0, "Bet number invaild");
        require(getMinBet() <= maxBet(_numbers.length), "The prize pool is not enough");
        require(_value >= getMinBet(), "Bet amount can not less min bet size");
        require(_value <= maxBet(_numbers.length), "Bet amount can not exceed max bet size");
        require(inBetNumbers(_numbers.length));
		_;
    }

    struct PlayerInfo {
        address player;
        uint256 betSize;
        uint8[] betNumbers;
    }
    uint public minBet;
    uint[] public betNumbers = [1, 2, 3, 4, 6, 12, 18];
    uint[] public odds = [35, 17, 11, 8, 5, 2, 1];
    mapping(bytes32=>PlayerInfo) players;

    event Bet(address indexed player, bytes32 qid, uint256 betSize, uint8[] betNumbers);
    event Play(address indexed player, bytes32 qid, uint256 betSize, uint8[] betNumbers, uint8 winningNumber);
    event Payout(address indexed winner, bytes32 qid, uint256 payout);

    constructor(address roscoinAddress) BackingContract(roscoinAddress) public {
        // Set OAR for use with ethereum-bridge, remove for production
        setMinBet(100000000000000000);
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    /**
     * @notice Bets an amount of eth on a specific number.
     * @dev Updates token price according to value change.
     * @dev Stores the player info in `players` mapping so it can be retrieved in `__callback()`.
     * @dev Emits Bet event.
     * @param numbers The numbers that is bet on.
     */
    function bet(uint8[] numbers) external
        payable
        whenNotPaused
        betIsValid (msg.value, numbers)
    {

        uint256 oraclizeFee = oraclize_getPrice("WolframAlpha");
        require(msg.value > oraclizeFee, "Bet amount should be higher than oraclize fee");

        uint256 betValue = msg.value;

        bytes32 qid = oraclize_query("WolframAlpha", "random integer between 0 and 36");

        /* Store a player's info to retrieve it in the oraclize callback */
        players[qid] = PlayerInfo(msg.sender, betValue, numbers);

        emit Bet(msg.sender, qid, betValue, numbers);
    }
    /**
     * @param len Bet numbers length.
     */
    function inBetNumbers(uint len) public view returns (bool) {
        bool isIn = false;
        for(uint i = 0; i < betNumbers.length; i++){
            if(len == betNumbers[i]){
                isIn = true;
                break;
            }
        }
        return isIn;
    }
    /**
     * @notice Callback function for Oraclize, checks if the player won the bet, and payd out if they did.
     * @dev Uses the `players` mapping to retrieve a player's information, deletes the player information afterwards.
     * @dev Emits Play event.
     * @param qid The query id of the corresponding Oraclize query.
     * @param result The result of the Oraclize query.
     */
    function __callback(bytes32 qid, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Can only be called from oraclize callback address");
        require(players[qid].player != address(0), "Query needs an associated player");

        uint8 winningNumber = uint8(parseInt(result));
        PlayerInfo storage playerInfo = players[qid];

        emit Play(playerInfo.player, qid, playerInfo.betSize, playerInfo.betNumbers, winningNumber);
        balanceForBacking = balanceForBacking.add(playerInfo.betSize);

        bool isWin = false;
        uint oddsIndex;
        for(uint i = 0; i < playerInfo.betNumbers.length; i++){
            if (playerInfo.betNumbers[i] == winningNumber) {
                isWin = true;
                break;
            }
        }
        if (isWin) {
            for(i = 0; i < betNumbers.length; i++){
                if(playerInfo.betNumbers.length == betNumbers[i]){
                    oddsIndex = i;
                    break;
                }
            }
            payout(playerInfo.player, qid, playerInfo.betSize.mul(odds[oddsIndex]));
        }

        // TODO: Perhaps delete this info before sending payout (reentrancy)
        delete players[qid];
    }

    /**
     * @notice Pays out an amount of eth to a bet winner.
     * @dev Updates token price according to value change.
     * @dev Emits Payout event.
     * @param winner The account of the bet winner.
     * @param qid The game for which the payout is made
     * @param amount The amount to be paid out to the bet winner.
     */
    function payout(address winner, bytes32 qid, uint256 amount) internal {
        require(amount > 0, "Payout amount should be more than 0");
        require(amount <= address(this).balance, "Payout amount should not be more than contract balance");

        balanceForBacking = balanceForBacking.sub(amount);
        winner.transfer(amount);
        emit Payout(winner, qid, amount);
    }

    /**
     * @notice Returns the maximum bet (5% of balance)/odds for this contract.
     * @dev Based on empirical statistics (see docs/max_bet_size.md).
     * @return The maximum bet.
     */
    function maxBet(uint size) public view returns (uint256) {
        uint oddsIndex;
        for(uint i = 0; i < betNumbers.length; i++){
            if(size == betNumbers[i]){
                oddsIndex = i;
                break;
            }
        }

        return balanceForBacking.div(20*odds[oddsIndex]);
    }
    function getMinBet() public view returns (uint256) {
        return minBet;
    }
    /**
     * @notice Returns an estimate of the oraclize fee.
     * @return An estimate of the oraclize fee.
     */
    function oraclizeFeeEstimate() public pure returns (uint256) {
        return 0.004 ether;
    }
    function setConfiguration(uint[] _betNumbers, uint[] _odds) onlyOwner {
        uint lastBetNumbers = 0;
        uint lastOdds = 0;
        for (uint i = 0; i < _betNumbers.length; i++) {
            betNumbers.push(_betNumbers[i]);
            if (lastBetNumbers <= _betNumbers[i]) revert();
            lastBetNumbers = _betNumbers[i];
        }
        for (i = 0; i < _odds.length; i++) {
            odds.push(_odds[i]);
            if (lastOdds >= _odds[i]) revert();
            lastOdds = _betNumbers[i];
        }
    }
    /**
     * only owner address can set minBet
     */
    function setMinBet(uint _minBet) public
        onlyOwner
    {
        minBet = _minBet;
    }
}
