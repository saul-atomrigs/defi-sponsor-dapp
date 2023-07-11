import { time, loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Lock', function () {
  // 테스트마다 동일한 설정을 재사용하기 위해 fixture를 정의:
  // loadFixture를 사용하여 이 설정을 한 번 실행하고 해당 상태를 스냅샷으로 만들고
  // 모든 테스트에서 Hardhat Network를 해당 스냅샷으로 재설정합니다.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // 컨트랙트는 기본적으로 첫 번째 서명자(signer)/계정(account)을 사용하여 배포됨:
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory('Lock');
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe('Deployment', function () {
    // unlocktime(1GWEI)가 설정되어 있는지 체크:
    it('Should set the right unlockTime', async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    // 주인이 올바른 사람인지 체크:
    it('Should set the right owner', async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);

      expect(await lock.owner()).to.equal(owner.address);
    });

    // 잠금된 금액이 올바른지 체크:
    it('Should receive and store the funds to lock', async function () {
      const { lock, lockedAmount } = await loadFixture(deployOneYearLockFixture);

      expect(await ethers.provider.getBalance(lock.target)).to.equal(lockedAmount);
    });

    // unlockTime이 미래 시점인지 체크:
    it('Should fail if the unlockTime is not in the future', async function () {
      // 여기서는 다른 배포이기 때문에 loadFixture를 사용하지 않는다:
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory('Lock');
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith('Unlock time should be in the future');
    });
  });

  // withdraw() 함수 테스트:
  describe('Withdrawals', function () {
    describe('Validations', function () {
      // withdraw() 함수가 unlockTime이 되기 전에 호출되면 revert 되는지 체크:
      it('Should revert with the right error if called too soon', async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith("You can't withdraw yet");
      });

      // 올바른 지갑 주소가 아닌 경우 체크:
      it('Should revert with the right error if called from another account', async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(deployOneYearLockFixture);

        // harhat의 unlocktime을 올려줌:
        await time.increaseTo(unlockTime);

        // 다른 계정에서 트랜잭션을 보내기 위해 lock.connect()를 사용:
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith("You aren't the owner");
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);

        // 기본적으로 첫 번째 서명자(signer)/계정(account)을 사용하여 트랜잭션을 보냄:
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    // Events 테스트:
    describe('Events', function () {
      // 출금 시 이벤트가 발생하는지 체크:
      it('Should emit an event on withdrawals', async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(deployOneYearLockFixture);

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.emit(lock, 'Withdrawal').withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    // Transfer 테스트:
    describe('Transfers', function () {
      // 송금이 되는지 체크:
      it('Should transfer the funds to the owner', async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(deployOneYearLockFixture);

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances([owner, lock], [lockedAmount, -lockedAmount]);
      });
    });
  });
});
