"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// --- TYPE DEFINITIONS ---
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Donation {
  donor: string;
  amount: string;
  timestamp: string;
}

interface SpendingRequest {
  id: string;
  description: string;
  amount: string;
  recipient: string;
  isComplete: boolean;
  receiptCID: string;
}

// --- CONTRACT CONFIGURATION ---
// This is the address of your deployed contract on the Sepolia testnet.
const contractAddress = "0x4d3D95FBD81f68e98734290bf2E112d809321874";
// This is the Application Binary Interface (ABI) for your contract.
const contractABI = [{"inputs":[{"internalType":"string","name":"_description","type":"string"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"address","name":"_recipient","type":"address"},{"internalType":"string","name":"_receiptCID","type":"string"}],"name":"createSpendingRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"donate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"donor","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Donated","type":"event"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"executeSpendingRequest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"string","name":"description","type":"string"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"}],"name":"RequestCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"RequestExecuted","type":"event"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"donations","outputs":[{"internalType":"address","name":"donor","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getDonationsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"requestCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"spendingRequests","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"string","name":"description","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address payable","name":"recipient","type":"address"},{"internalType":"bool","name":"isComplete","type":"bool"},{"internalType":"string","name":"receiptCID","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalDonations","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}];


export default function Home() {
    // Connection and contract state
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    
    // Data state
    const [balance, setBalance] = useState("0");
    const [owner, setOwner] = useState("");
    const [allDonations, setAllDonations] = useState<Donation[]>([]);
    const [allRequests, setAllRequests] = useState<SpendingRequest[]>([]);
    
    // UI state
    const [loadingMessage, setLoadingMessage] = useState("");

    // Form state
    const [donationAmount, setDonationAmount] = useState("");
    const [requestDescription, setRequestDescription] = useState("");
    const [requestAmount, setRequestAmount] = useState("");
    const [requestRecipient, setRequestRecipient] = useState("");
    const [receiptCID, setReceiptCID] = useState("");

    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            const web3Provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(web3Provider);
        } else {
            console.log("MetaMask is not installed.");
        }
    }, []);

    const connectWallet = async () => {
        if (!provider) {
            alert("MetaMask is not installed. Please install it to use this app.");
            return;
        }
        try {
            const network = await provider.getNetwork();
            const sepoliaChainId = BigInt(11155111);

            if (network.chainId !== sepoliaChainId) {
                alert("Please switch to the Sepolia Test Network in your wallet.");
                return;
            }

            const accounts = await provider.send("eth_requestAccounts", []);
            if (accounts.length > 0) {
                const connectedAccount = accounts[0];
                setAccount(connectedAccount);
                
                const signer = await provider.getSigner();
                const charityContract = new ethers.Contract(contractAddress, contractABI, signer);
                setContract(charityContract);
                
                await loadContractData(provider, charityContract);
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };
    
    const loadContractData = async (currentProvider: ethers.BrowserProvider, contractInstance: ethers.Contract) => {
        try {
            const contractBalance = await currentProvider.getBalance(contractAddress);
            setBalance(ethers.formatEther(contractBalance));

            const contractOwner = await contractInstance.owner();
            setOwner(contractOwner);
            
            // Load all donations
            const donationsCount = await contractInstance.getDonationsCount();
            let donations: Donation[] = [];
            for (let i = 0; i < donationsCount; i++) {
                const d = await contractInstance.donations(i);
                donations.push({
                    donor: d.donor,
                    amount: ethers.formatEther(d.amount),
                    timestamp: new Date(Number(d.timestamp) * 1000).toLocaleString()
                });
            }
            setAllDonations(donations.reverse());

            // Load all spending requests
            const requestCount = await contractInstance.requestCount();
            let requests: SpendingRequest[] = [];
            for (let i = 1; i <= requestCount; i++) {
                const r = await contractInstance.spendingRequests(i);
                // Ensure we don't push empty requests if something goes wrong
                if (r.id > 0) {
                    requests.push({
                        id: r.id.toString(),
                        description: r.description,
                        amount: ethers.formatEther(r.amount),
                        recipient: r.recipient,
                        isComplete: r.isComplete,
                        receiptCID: r.receiptCID
                    });
                }
            }
            setAllRequests(requests.reverse());

        } catch (error) {
            console.error("Error loading contract data:", error);
        }
    };

    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !donationAmount || !provider) return;
        
        setLoadingMessage("Processing your donation... Please wait.");
        try {
            const amountInWei = ethers.parseEther(donationAmount);
            const tx = await contract.donate({ value: amountInWei });
            await tx.wait();
            alert("Thank you for your generous donation! 🎉");
            setDonationAmount("");
            await loadContractData(provider, contract); // Refresh data
        } catch (error) {
            console.error("Donation failed:", error);
            alert("Donation failed. Please check the console for details.");
        } finally {
            setLoadingMessage("");
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contract || !requestDescription || !requestAmount || !requestRecipient || !provider) return;
        
        setLoadingMessage("Creating spending request... Please confirm in your wallet.");
        try {
            const amountInWei = ethers.parseEther(requestAmount);
            const tx = await contract.createSpendingRequest(requestDescription, amountInWei, requestRecipient, receiptCID);
            await tx.wait();
            alert("Spending request created successfully!");
            setRequestDescription("");
            setRequestAmount("");
            setRequestRecipient("");
            setReceiptCID("");
            await loadContractData(provider, contract); // Refresh data
        } catch (error) {
            console.error("Failed to create request:", error);
            alert("Failed to create request. See console for details.");
        } finally {
            setLoadingMessage("");
        }
    };

    const handleExecuteRequest = async (requestId: string) => {
        if (!contract || !provider) return;
        
        setLoadingMessage(`Executing request #${requestId}... Please wait.`);
        try {
            const tx = await contract.executeSpendingRequest(requestId);
            await tx.wait();
            alert(`Request ${requestId} has been executed successfully!`);
            await loadContractData(provider, contract); // Refresh data
        } catch (error) {
            console.error(`Failed to execute request ${requestId}:`, error);
            alert(`Failed to execute request. See console for details.`);
        } finally {
            setLoadingMessage("");
        }
    };

    const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans relative">
            {loadingMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="text-center">
                        <p className="text-xl mb-4">{loadingMessage}</p>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
                    </div>
                </div>
            )}
            <nav className="bg-gray-800 p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-teal-400">CharityChain 💖</h1>
                {account ? (
                    <div className="bg-gray-700 text-sm rounded-full px-4 py-2">
                        Connected: {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                    </div>
                ) : (
                    <button onClick={connectWallet} className="bg-teal-500 hover:bg-teal-600 rounded-full px-6 py-2 font-semibold transition-colors">
                        Connect Wallet
                    </button>
                )}
            </nav>

            <main className="container mx-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">Total Raised</h3>
                        <p className="text-4xl font-bold text-teal-400">{parseFloat(balance).toFixed(4)} ETH</p>
                    </div>
                     <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-2">
                        <h3 className="text-lg font-semibold text-gray-400 mb-2">Charity Wallet (Owner)</h3>
                        <p className="text-xl font-mono break-all">{owner || "Loading..."}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
                        <h2 className="text-3xl font-bold mb-6 text-center text-teal-400">Make a Donation</h2>
                        <form onSubmit={handleDonate}>
                            <div className="mb-4">
                                <label htmlFor="donation" className="block text-gray-400 mb-2">Amount (ETH)</label>
                                <input
                                    type="text"
                                    id="donation"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    placeholder="e.g., 0.1"
                                    value={donationAmount}
                                    onChange={(e) => setDonationAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 rounded-full text-lg py-3 font-bold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" disabled={!account}>
                                {account ? 'Send Donation' : 'Connect Wallet to Donate'}
                            </button>
                        </form>
                    </div>

                    {isOwner && (
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
                            <h2 className="text-3xl font-bold mb-6 text-center text-red-400">Charity Admin Panel</h2>
                            <form onSubmit={handleCreateRequest}>
                                <input type="text" value={requestDescription} onChange={(e) => setRequestDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4" placeholder="Description e.g., Purchase new blankets" required/>
                                <input type="text" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4" placeholder="Amount (ETH) e.g., 5.5" required/>
                                <input type="text" value={requestRecipient} onChange={(e) => setRequestRecipient(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4" placeholder="Recipient Address 0x..." required/>
                                <input type="text" value={receiptCID} onChange={(e) => setReceiptCID(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-6" placeholder="Receipt (IPFS CID - Optional)"/>
                                <button type="submit" className="w-full bg-red-500 hover:bg-red-600 rounded-full text-lg py-3 font-bold transition-colors">Create Spending Request</button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="mt-16">
                    <h2 className="text-3xl font-bold mb-6 text-center">Transparency Log</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-teal-400">Spending Requests</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {allRequests.length > 0 ? allRequests.map(req => (
                                    <div key={req.id} className="bg-gray-800 p-4 rounded-lg">
                                        <p className="font-bold">{req.description}</p>
                                        <p className="text-sm text-gray-400">Amount: {req.amount} ETH</p>
                                        <p className="text-sm text-gray-400 break-all">Recipient: {req.recipient}</p>
                                        {req.receiptCID && <a href={`https://ipfs.io/ipfs/${req.receiptCID}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">View Receipt on IPFS</a>}
                                        <div className="mt-2 flex justify-between items-center">
                                             <span className={`px-3 py-1 text-xs rounded-full ${req.isComplete ? 'bg-green-600' : 'bg-yellow-600'}`}>
                                                {req.isComplete ? 'Executed' : 'Pending'}
                                            </span>
                                            {!req.isComplete && isOwner && (
                                                <button onClick={() => handleExecuteRequest(req.id)} className="bg-green-500 hover:bg-green-600 text-xs px-3 py-1 rounded-full font-semibold">Execute</button>
                                            )}
                                        </div>
                                    </div>
                                )) : <p className="text-gray-500">No spending requests yet.</p>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4 text-teal-400">All Donations</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {allDonations.length > 0 ? allDonations.map((donation, index) => (
                                    <div key={index} className="bg-gray-800 p-4 rounded-lg">
                                        <p className="font-bold">{donation.amount} ETH</p>
                                        <p className="text-sm text-gray-400 break-all">From: {donation.donor}</p>
                                        <p className="text-xs text-gray-500">{donation.timestamp}</p>
                                    </div>
                                )) : <p className="text-gray-500">No donations yet. Be the first!</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}