# CharityChain: A Decentralized Charity Platform

CharityChain is a transparent and decentralized application built on the Ethereum blockchain that facilitates charitable donations. It allows anyone to donate Ether to a common pool and provides a clear, auditable log of all incoming donations and outgoing expenditures. The contract owner can create spending requests, which are also publicly visible, ensuring complete transparency in how funds are utilized.

## 🚀 Features

-   **Connect Wallet**: Users can connect their MetaMask wallet to interact with the application.
-   **Donate Ether**: Anyone can donate any amount of Ether to the charity contract.
-   **View Donations**: A real-time log of all donations, including the donor's address, amount, and timestamp.
-   **Admin Panel**: The owner of the contract has access to an admin panel to manage funds.
-   **Create Spending Requests**: The owner can create requests to spend a portion of the donated funds for specific purposes.
-   **Execute Spending Requests**: The owner can execute pending requests, transferring funds to the specified recipient.
-   **Transparency Log**: All spending requests and their statuses (Pending/Executed) are publicly visible.
-   **IPFS Integration**: Spending requests can include an IPFS Content ID (CID) for linking to receipts or other documentation, further enhancing transparency.

## 🛠️ Tech Stack

-   **Blockchain**: Solidity, Ethereum (Sepolia Testnet)
-   **Frontend**: Next.js, React, TypeScript
-   **Styling**: Tailwind CSS
-   **Web3 Integration**: ethers.js

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm installed on your machine.
-   MetaMask browser extension installed.

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/Khushmeet-patil/charity-frontend.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd charity-frontend
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Run the development server**
    ```sh
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

##  usage

1.  **Connect Your Wallet**: Click the "Connect Wallet" button and approve the connection in MetaMask. Ensure you are connected to the **Sepolia Test Network**.
2.  **Make a Donation**: Enter the amount of ETH you wish to donate and click "Send Donation".
3.  **View Logs**: Scroll down to the "Transparency Log" to see all past donations and spending requests.
4.  **(Admin) Create a Request**: If you are the contract owner, the admin panel will be visible. You can create a new spending request by filling out the form.
5.  **(Admin) Execute a Request**: In the "Spending Requests" log, pending requests will have an "Execute" button visible only to the owner.

## 📄 Contract Details

-   **Contract Address**: `0x4d3D95FBD81f68e98734290bf2E112d809321874`
-   **Network**: Sepolia Testnet
-   **View on Etherscan**: [https://sepolia.etherscan.io/address/0x4d3D95FBD81f68e98734290bf2E112d809321874](https://sepolia.etherscan.io/address/0x4d3D95FBD81f68e98734290bf2E112d809321874)
