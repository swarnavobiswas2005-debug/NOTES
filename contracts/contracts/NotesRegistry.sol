// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title NotesRegistry
/// @notice Stores SHA256 hashes of academic notes for tamper-proof verification
contract NotesRegistry {
    struct Note {
        address uploader;
        uint256 timestamp;
    }

    mapping(string => Note) private notes;

    event NoteRegistered(
        string indexed fileHash,
        address indexed uploader,
        uint256 timestamp
    );

    /// @notice Register a note hash on-chain. Reverts if already registered.
    function registerNote(string memory fileHash) public {
        require(bytes(fileHash).length == 64, "Invalid SHA256 hash length");
        require(notes[fileHash].timestamp == 0, "Note already registered");

        notes[fileHash] = Note({
            uploader: msg.sender,
            timestamp: block.timestamp
        });

        emit NoteRegistered(fileHash, msg.sender, block.timestamp);
    }

    /// @notice Returns true if a note with the given hash exists on-chain
    function verifyNote(string memory fileHash) public view returns (bool) {
        return notes[fileHash].timestamp != 0;
    }

    /// @notice Returns uploader address and timestamp for a registered note
    function getNote(string memory fileHash)
        public
        view
        returns (address uploader, uint256 timestamp)
    {
        require(notes[fileHash].timestamp != 0, "Note not found");
        Note memory note = notes[fileHash];
        return (note.uploader, note.timestamp);
    }
}
