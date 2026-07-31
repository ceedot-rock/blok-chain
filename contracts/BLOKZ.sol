// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BLOKZ ($bLOkz)
 * @notice Fixed-supply ERC-20 for bLOK CHaiN.
 * @dev Supply is minted once in the constructor to six unique allocation wallets.
 *      There is no owner, no admin, and no further mint after deploy.
 *      Burn + burnFrom reduce totalSupply permanently.
 *      EIP-2612 permit supported for gasless approvals.
 *
 * Allocations (1_000_000_000 * 1e18):
 *  - forge       28%  — play rewards
 *  - staking     30%  — staker yield
 *  - community   10%  — non-staker drip
 *  - treasury    15%  — protocol ops
 *  - ecosystem   12%  — team / builders (vest off-chain or via vest contract)
 *  - genesis      5%  — airdrop (receives integer remainder so sum == TOTAL_SUPPLY)
 *
 * Deploy (Remix or Foundry):
 *  1. Compile with solc 0.8.20+
 *  2. Deploy BLOKZ(forge, staking, community, treasury, ecosystem, genesis)
 *     — six addresses, all non-zero and pairwise unique
 *  3. Verify on Basescan / Etherscan
 *  4. Hold large buckets on multi-sig; vest ecosystem off-chain or via vest contract
 */

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

contract BLOKZ is IERC20, IERC20Permit {
    string public constant name = "bLOkz";
    string public constant symbol = "bLOkz";
    uint8 public constant decimals = 18;

    /// @notice Fixed hard cap: 1 billion tokens (with 18 decimals).
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 1e18;

    uint256 public immutable forgeAllocation; // 28%
    uint256 public immutable stakingAllocation; // 30%
    uint256 public immutable communityAllocation; // 10%
    uint256 public immutable treasuryAllocation; // 15%
    uint256 public immutable ecosystemAllocation; // 12%
    uint256 public immutable genesisAllocation; // ~5% (remainder)

    address public immutable forgeWallet;
    address public immutable stakingWallet;
    address public immutable communityWallet;
    address public immutable treasuryWallet;
    address public immutable ecosystemWallet;
    address public immutable genesisWallet;

    /// @dev EIP-712 domain separator (immutable; chainId + address fixed at deploy).
    bytes32 public immutable DOMAIN_SEPARATOR;

    // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
    bytes32 private constant _PERMIT_TYPEHASH =
        0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => uint256) private _nonces;

    uint256 private _totalSupply;

    error ZeroAddress();
    error DuplicateWallet();
    error InsufficientBalance();
    error InsufficientAllowance();
    error ExpiredPermit();
    error InvalidSignature();

    constructor(
        address forge_,
        address staking_,
        address community_,
        address treasury_,
        address ecosystem_,
        address genesis_
    ) {
        if (
            forge_ == address(0) ||
            staking_ == address(0) ||
            community_ == address(0) ||
            treasury_ == address(0) ||
            ecosystem_ == address(0) ||
            genesis_ == address(0)
        ) revert ZeroAddress();

        // Pairwise uniqueness — avoids collapsing two allocation buckets into one wallet by mistake.
        if (
            forge_ == staking_ ||
            forge_ == community_ ||
            forge_ == treasury_ ||
            forge_ == ecosystem_ ||
            forge_ == genesis_ ||
            staking_ == community_ ||
            staking_ == treasury_ ||
            staking_ == ecosystem_ ||
            staking_ == genesis_ ||
            community_ == treasury_ ||
            community_ == ecosystem_ ||
            community_ == genesis_ ||
            treasury_ == ecosystem_ ||
            treasury_ == genesis_ ||
            ecosystem_ == genesis_
        ) revert DuplicateWallet();

        forgeWallet = forge_;
        stakingWallet = staking_;
        communityWallet = community_;
        treasuryWallet = treasury_;
        ecosystemWallet = ecosystem_;
        genesisWallet = genesis_;

        forgeAllocation = (TOTAL_SUPPLY * 28) / 100;
        stakingAllocation = (TOTAL_SUPPLY * 30) / 100;
        communityAllocation = (TOTAL_SUPPLY * 10) / 100;
        treasuryAllocation = (TOTAL_SUPPLY * 15) / 100;
        ecosystemAllocation = (TOTAL_SUPPLY * 12) / 100;
        // Remainder to genesis so integer division never drops dust from total supply.
        genesisAllocation =
            TOTAL_SUPPLY -
            forgeAllocation -
            stakingAllocation -
            communityAllocation -
            treasuryAllocation -
            ecosystemAllocation;

        _mint(forge_, forgeAllocation);
        _mint(staking_, stakingAllocation);
        _mint(community_, communityAllocation);
        _mint(treasury_, treasuryAllocation);
        _mint(ecosystem_, ecosystemAllocation);
        _mint(genesis_, genesisAllocation);

        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    /*//////////////////////////////////////////////////////////////
                                ERC-20
    //////////////////////////////////////////////////////////////*/

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _spendAllowance(from, msg.sender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /// @notice Safer approve pattern — raise allowance without setting absolute value.
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {
        _approve(msg.sender, spender, _allowances[msg.sender][spender] + addedValue);
        return true;
    }

    /// @notice Safer approve pattern — lower allowance without setting absolute value.
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {
        uint256 current = _allowances[msg.sender][spender];
        if (current < subtractedValue) revert InsufficientAllowance();
        unchecked {
            _approve(msg.sender, spender, current - subtractedValue);
        }
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                                  BURN
    //////////////////////////////////////////////////////////////*/

    /// @notice Permanent supply reduction (self-burn).
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /// @notice Burn `amount` from `from` using caller allowance (or infinite allowance).
    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
    }

    /*//////////////////////////////////////////////////////////////
                               EIP-2612
    //////////////////////////////////////////////////////////////*/

    function nonces(address owner) external view returns (uint256) {
        return _nonces[owner];
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (block.timestamp > deadline) revert ExpiredPermit();
        if (owner == address(0)) revert ZeroAddress();

        bytes32 structHash = keccak256(
            abi.encode(_PERMIT_TYPEHASH, owner, spender, value, _nonces[owner]++, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        address recovered = ecrecover(digest, v, r, s);
        if (recovered == address(0) || recovered != owner) revert InvalidSignature();

        _approve(owner, spender, value);
    }

    /*//////////////////////////////////////////////////////////////
                                INTERNAL
    //////////////////////////////////////////////////////////////*/

    function _mint(address to, uint256 amount) private {
        if (to == address(0)) revert ZeroAddress();
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) private {
        if (from == address(0)) revert ZeroAddress();
        uint256 bal = _balances[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            _balances[from] = bal - amount;
            _totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }

    function _transfer(address from, address to, uint256 amount) private {
        if (from == address(0) || to == address(0)) revert ZeroAddress();
        uint256 bal = _balances[from];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            _balances[from] = bal - amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) private {
        if (owner == address(0) || spender == address(0)) revert ZeroAddress();
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /// @dev Skips decrement when allowance is type(uint256).max (infinite approve).
    function _spendAllowance(address owner, address spender, uint256 amount) private {
        uint256 current = _allowances[owner][spender];
        if (current != type(uint256).max) {
            if (current < amount) revert InsufficientAllowance();
            unchecked {
                _approve(owner, spender, current - amount);
            }
        }
    }
}
