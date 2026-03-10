import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Minimal ABI for the NotesRegistry contract
const ABI = [
  "function registerNote(string memory fileHash) public",
  "function verifyNote(string memory fileHash) public view returns (bool)",
  "function getNote(string memory fileHash) public view returns (address uploader, uint256 timestamp)",
  "event NoteRegistered(string indexed fileHash, address indexed uploader, uint256 timestamp)",
];

function getContract() {
  const rpcUrl = process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) return null;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, ABI, wallet);
}

export interface BlockchainNoteInfo {
  uploader: string;
  timestamp: number;
}

/**
 * Register a file hash on the smart contract.
 * Returns the transaction hash. Falls back to a mock tx if contract not configured.
 */
export async function registerNoteOnChain(fileHash: string): Promise<string> {
  const contract = getContract();
  if (!contract) {
    console.warn("[Blockchain] Contract not configured — using mock tx hash");
    return "0x" + "mock" + fileHash.slice(0, 60);
  }
  const tx = await contract.registerNote(fileHash);
  const receipt = await tx.wait();
  return receipt.hash;
}

/**
 * Returns true if the hash is registered on-chain.
 */
export async function verifyNoteOnChain(fileHash: string): Promise<boolean> {
  const contract = getContract();
  if (!contract) {
    console.warn("[Blockchain] Contract not configured — verification skipped");
    return false;
  }
  return contract.verifyNote(fileHash);
}

/**
 * Returns on-chain metadata for a registered note.
 */
export async function getNoteFromChain(fileHash: string): Promise<BlockchainNoteInfo | null> {
  const contract = getContract();
  if (!contract) return null;
  try {
    const [uploader, timestamp]: [string, bigint] = await contract.getNote(fileHash);
    return { uploader, timestamp: Number(timestamp) };
  } catch {
    return null;
  }
}
