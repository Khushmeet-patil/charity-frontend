
pragma solidity ^0.8.20;

contract CharityContract {
    
    address payable public owner;

    // A counter to give each spending request a unique ID.
    uint256 public requestCount;

    // A running total of all funds raised.
    uint256 public totalDonations;

    // --- STRUCTS ---

    // A struct to hold information about each individual donation.
    struct Donation {
        address donor; // The address of the person who donated.
        uint256 amount; // The amount they donated in wei (the smallest unit of Ether).
        uint256 timestamp; // When the donation was made.
    }

    // A struct to hold information about each spending request made by the charity.
    struct SpendingRequest {
        uint256 id; // Unique ID for the request.
        string description; // What the money will be used for.
        uint256 amount; // How much money is being requested.
        address payable recipient; // Who the money will be sent to.
        bool isComplete; // True if the money has been sent.
        string receiptCID; // (For IPFS integration) A link to the receipt.
    }

    // --- MAPPINGS ---

    // A list of all donations.
    Donation[] public donations;

    // A mapping to look up a spending request by its ID.
    mapping(uint256 => SpendingRequest) public spendingRequests;

    // --- EVENTS ---

    // An event that is emitted whenever a new donation is made.
    // This allows the frontend application to easily listen for new donations.
    event Donated(address indexed donor, uint256 amount, uint256 timestamp);

    // An event emitted when a new spending request is created.
    event RequestCreated(uint256 id, string description, uint256 amount, address recipient);
    
    // An event emitted when a spending request is finalized and money is sent.
    event RequestExecuted(uint256 id, address recipient, uint256 amount);


    // --- MODIFIERS ---

    // A modifier is a reusable check. This one ensures that only the owner
    // of the contract can call a function.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _; // This means "continue with the function execution."
    }

    // --- FUNCTIONS ---

    /**
     * @dev The constructor is called only once, when the contract is deployed.
     * It sets the deployer of the contract as the owner.
     */
    constructor() {
        owner = payable(msg.sender);
    }

    /**
     * @dev Allows anyone to send Ether to the contract to make a donation.
     * The 'payable' keyword is crucial; it allows this function to accept Ether.
     */
    function donate() external payable {
        // We require a donation of at least 1 wei.
        require(msg.value > 0, "Donation amount must be greater than zero.");

        // Create a new Donation struct and add it to our list of donations.
        donations.push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Increase the total amount raised.
        totalDonations += msg.value;

        // Emit an event to notify the outside world of this new donation.
        emit Donated(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Allows the owner to create a request to spend some of the donated funds.
     * @param _description A description of the spending purpose.
     * @param _amount The amount to be spent.
     * @param _recipient The address that will receive the funds.
     * @param _receiptCID The IPFS hash of the receipt for this spending.
     */
    function createSpendingRequest(
        string memory _description,
        uint256 _amount,
        address _recipient,
        string memory _receiptCID 
    ) external onlyOwner {
        require(_amount > 0, "Amount must be greater than zero.");
        require(address(this).balance >= _amount, "Insufficient funds in contract.");
        
        requestCount++;
        
        spendingRequests[requestCount] = SpendingRequest({
            id: requestCount,
            description: _description,
            amount: _amount,
            recipient: payable(_recipient),
            isComplete: false,
            receiptCID: _receiptCID
        });

        emit RequestCreated(requestCount, _description, _amount, _recipient);
    }

    /**
     * @dev Allows the owner to execute a spending request, sending the funds.
     * @param _id The ID of the spending request to execute.
     */
    function executeSpendingRequest(uint256 _id) external onlyOwner {
        SpendingRequest storage request = spendingRequests[_id];
        
        require(request.id != 0, "Request does not exist.");
        require(!request.isComplete, "Request has already been completed.");
        require(address(this).balance >= request.amount, "Insufficient funds to execute.");

        // Mark the request as complete BEFORE sending the money.
        // This is a security best practice to prevent re-entrancy attacks.
        request.isComplete = true;

        // Send the Ether to the recipient.
        (bool success, ) = request.recipient.call{value: request.amount}("");
        require(success, "Transaction failed.");

        emit RequestExecuted(_id, request.recipient, request.amount);
    }

    // --- VIEW FUNCTIONS (Read-only) ---

    /**
     * @dev Returns the total number of donations made.
     */
    function getDonationsCount() external view returns (uint256) {
        return donations.length;
    }

    /**
     * @dev Returns the total contract balance.
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
