const hre = require('hardhat');

// 지갑 주소의 잔액을 리턴:
async function getBalance(address: string) {
  const balanceBigInt = await hre.ethers.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

// 주소 목록의 잔액을 출력:
async function printBalances(addresses: string[]) {
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${idx} balance: `, await getBalance(address));
    idx++;
  }
}

type Memo = {
  timestamp: number;
  from: string;
  name: string;
  message: string;
};

// 메모를 출력:
async function printMemos(memos: Memo[]) {
  for (const memo of memos) {
    const timestamp = memo.timestamp;
    const tipper = memo.name;
    const tipperAddress = memo.from;
    const message = memo.message;
    console.log(`At ${timestamp}, ${tipper} (${tipperAddress}) said: "${message}"`);
  }
}

async function main() {
  // 예시 주소들:
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // 배포할 컨트랙트:
  const BuyMeACoffee = await hre.ethers.getContractFactory('BuyMeACoffee');
  const buyMeACoffee = await BuyMeACoffee.deploy();

  // 배포:
  await buyMeACoffee.deployed();
  console.log('BuyMeACoffee deployed to:', buyMeACoffee.address);

  // 잔액 조회:
  const addresses = [owner.address, tipper.address, buyMeACoffee.address];
  console.log('== start ==');
  await printBalances(addresses);

  // 커피 사주기:
  const tip = { value: hre.ethers.utils.parseEther('1') };
  await buyMeACoffee.connect(tipper).buyCoffee('Carolina', "You're the best!", tip);
  await buyMeACoffee.connect(tipper2).buyCoffee('Vitto', 'Amazing teacher', tip);
  await buyMeACoffee.connect(tipper3).buyCoffee('Kay', 'I love my Proof of Knowledge', tip);

  // 구매 후 잔액 조회:
  console.log('== bought coffee ==');
  await printBalances(addresses);

  // 출금:
  await buyMeACoffee.connect(owner).withdrawTips();

  // 출금 후 잔액 조회:
  console.log('== withdrawTips ==');
  await printBalances(addresses);

  // 메모들 조회:
  console.log('== memos ==');
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
