// const hre = require('hardhat');
const abi = require('../artifacts/contracts/BuyMeACoffee.sol/BuyMeACoffee.json');

async function getBalance(provider: any, address: string) {
  const balanceBigInt = await provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

async function withdraw() {
  // Goerli로 배포된 컨트랙트를 가져온다:
  const contractAddress = '0xDBa03676a2fBb6711CB652beF5B7416A53c1421D';
  const contractABI = abi.abi;

  // node연결, 지갑연결하는 provider 생성:
  const provider = new hre.ethers.providers.AlchemyProvider('goerli', process.env.GOERLI_API_KEY);

  // 원래 배포한 사람의 지갑주소와 같은 signer인지 체크:
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // 연결된 컨트랙트 인스턴스 생성:
  const buyMeACoffee = new hre.ethers.Contract(contractAddress, contractABI, signer);

  // 잔액 확인:
  console.log('current balance of owner: ', await getBalance(provider, signer.address), 'ETH');
  const contractBalance = await getBalance(provider, buyMeACoffee.address);
  console.log('current balance of contract: ', await getBalance(provider, buyMeACoffee.address), 'ETH');

  // 충분한 금액이 있는 경우 출금:
  if (contractBalance !== '0.0') {
    const withdrawTxn = await buyMeACoffee.withdrawTips();
    await withdrawTxn.wait();
  } else {
    console.error('no funds to withdraw!');
  }

  // 최종 잔액 조회:
  console.log('current balance of owner: ', await getBalance(provider, signer.address), 'ETH');
}

withdraw()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
