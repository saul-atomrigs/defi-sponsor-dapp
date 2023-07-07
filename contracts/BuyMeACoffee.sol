//SPDX-License-Identifier: Unlicense

// contracts/BuyMeACoffee.sol
pragma solidity ^0.8.0;

// Example Contract Address on Goerli: 0xDBa03676a2fBb6711CB652beF5B7416A53c1421D

contract BuyMeACoffee {
    // Memo가 생성될 때 발생하는 이벤트:
    event NewMemo(
        address indexed from,
        uint256 timestamp,
        string name,
        string message
    );
    
    // Memo 구조체:
    struct Memo {
        address from;
        uint256 timestamp;
        string name;
        string message;
    }
    
    // 컨트랙트 소유자의 주소:
    address payable owner;

    // 모든 메모를 저장하는 배열:
    Memo[] memos;

    constructor() {
        // 이곳에서 출금한다:
        owner = payable(msg.sender);
    }

    /**
     * @dev 모든 메모를 fetch한다:
     */
    function getMemos() public view returns (Memo[] memory) {
        return memos;
    }

    /**
     * @dev 이더리움 팁 보내주고 메모 남긴다
     * @param _name 후원하는 사람 이름
     * @param _message 후원 메시지
     */
    function buyCoffee(string memory _name, string memory _message) public payable {
        // 0 이상의 이더리움을 보내야 한다:
        require(msg.value > 0, "can't buy coffee for free!");

        // 메모를 배열에 추가한다:
        memos.push(Memo(
            msg.sender,
            block.timestamp,
            _name,
            _message
        ));

        // 이벤트를 발생시킨다:
        emit NewMemo(
            msg.sender,
            block.timestamp,
            _name,
            _message
        );
    }

    /**
     * @dev 컨트랙트에 있는 모든 이더리움을 출금한다:
     */
    function withdrawTips() public {
        require(owner.send(address(this).balance));
    }
}