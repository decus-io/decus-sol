import { expect } from "chai";
import { BigNumber, Contract, Wallet } from "ethers";
import type { Fixture, MockProvider } from "ethereum-waffle";
import { waffle, ethers } from "hardhat";
const { loadFixture } = waffle;
const { parseEther } = ethers.utils;

const DAY = 86400;
const WEEK = DAY * 7;

async function advanceBlockAtTime(time: number) {
    await ethers.provider.send("evm_mine", [time]);
}

/**
 * Note that failed transactions are silently ignored when automining is disabled.
 */
 async function setAutomine(flag: boolean) {
    await ethers.provider.send("evm_setAutomine", [flag]);
}

describe("CustodyGauge", function () {
    interface FixtureWalletMap {
        readonly [name: string]: Wallet;
    }

    interface FixtureData {
        readonly wallets: FixtureWalletMap;
        readonly startTimestamp: number;
        readonly decus: Contract;
        readonly gauge: Contract;
    }

    let currentFixture: Fixture<FixtureData>;
    let fixtureData: FixtureData;

    let user1: Wallet;
    let user2: Wallet;
    let owner: Wallet;
    let startTimestamp: number;
    let addr1: string;
    let addr2: string;
    let decus: Contract;
    let gauge: Contract;

    async function deployFixture(_wallets: Wallet[], provider: MockProvider): Promise<FixtureData> {
        const [user1, user2, owner] = provider.getWallets();

        const RewardToken = await ethers.getContractFactory("MockRewardToken");
        const decus = await RewardToken.connect(owner).deploy();

        const startTimestamp = (await ethers.provider.getBlock("latest")).timestamp + DAY;

        await decus.set(startTimestamp + WEEK * 2, 1);

        const CustodyGauge = await ethers.getContractFactory("CustodyGauge");
        const gauge = await CustodyGauge.connect(owner).deploy("eBTC Custody", "ceBTC", decus.address, owner.address);
        await gauge.setMonetaryPolicy(owner.address);

        return {
            wallets: { user1, user2, owner },
            startTimestamp,
            decus,
            gauge: gauge.connect(owner),
        };
    }

    before(function () {
        currentFixture = deployFixture;
    });

    beforeEach(async function () {
        fixtureData = await loadFixture(currentFixture);
        user1 = fixtureData.wallets.user1;
        user2 = fixtureData.wallets.user2;
        owner = fixtureData.wallets.owner;
        startTimestamp = fixtureData.startTimestamp;
        addr1 = user1.address;
        addr2 = user2.address;
        decus = fixtureData.decus;
        gauge = fixtureData.gauge;
    });

    describe("mint()", function () {
        it("Should mint to user1", async function () {
            expect(await gauge.balanceOf(addr1)).to.be.equal(0);
            startTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

            setAutomine(false);
            await gauge.mint(addr1, parseEther("100"));
            await advanceBlockAtTime(startTimestamp + 100);
            setAutomine(true);

            expect(await gauge.totalGons()).to.equal(parseEther("100"));
            expect(await gauge.gonBalanceOf(addr1)).to.equal(parseEther("100"));
            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100"));

            await advanceBlockAtTime(startTimestamp + 1000);
    
            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100"));
            expect(await gauge.callStatic["claimableRewards"](addr1)).to.equal(BigNumber.from("900"));
        });

        it("Should mint to user1 and user2", async function () {
            expect(await gauge.balanceOf(addr1)).to.be.equal(0);
            startTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

            setAutomine(false);
            await gauge.mint(addr1, parseEther("100"));
            await gauge.mint(addr2, parseEther("200"));
            await advanceBlockAtTime(startTimestamp + 100);
            setAutomine(true);

            expect(await gauge.totalGons()).to.equal(parseEther("300"));
            expect(await gauge.gonBalanceOf(addr1)).to.equal(parseEther("100"));
            expect(await gauge.gonBalanceOf(addr2)).to.equal(parseEther("200"));
            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100"));
            expect(await gauge.balanceOf(addr2)).to.be.equal(parseEther("200"));

            await advanceBlockAtTime(startTimestamp + 1000);
    
            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100"));
            expect(await gauge.callStatic["claimableRewards"](addr1)).to.equal(BigNumber.from("300"));
            expect(await gauge.callStatic["claimableRewards"](addr2)).to.equal(BigNumber.from("600"));
        });

        it("Should mint to user1 and user2 with rebase", async function () {
            expect(await gauge.balanceOf(addr1)).to.be.equal(0);
            startTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

            setAutomine(false);
            await gauge.mint(addr1, parseEther("100"));
            await gauge.mint(addr2, parseEther("200"));
            await advanceBlockAtTime(startTimestamp + 100);
            setAutomine(true);

            expect(await gauge.totalGons()).to.equal(parseEther("300"));
            expect(await gauge.gonBalanceOf(addr1)).to.equal(parseEther("100"));
            expect(await gauge.gonBalanceOf(addr2)).to.equal(parseEther("200"));
            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100"));
            expect(await gauge.balanceOf(addr2)).to.be.equal(parseEther("200"));

            await advanceBlockAtTime(startTimestamp + 400);

            await expect(gauge.rebase(0, parseEther("3"), true))
                .to.emit(gauge, "Rebased")
                .withArgs(0, parseEther("297"));

            expect(await gauge.balanceOf(addr1)).to.be.equal(parseEther("100").sub(parseEther("1")));
            expect(await gauge.balanceOf(addr2)).to.be.equal(parseEther("200").sub(parseEther("2")));
            expect(await gauge.callStatic["claimableRewards"](addr1)).to.equal(BigNumber.from("100"));
            expect(await gauge.callStatic["claimableRewards"](addr2)).to.equal(BigNumber.from("200"));
        });
    });
});