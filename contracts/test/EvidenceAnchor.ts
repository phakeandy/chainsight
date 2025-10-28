import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("EvidenceAnchor", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, user] = await viem.getWalletClients();

  async function deployEvidenceAnchor() {
    const evidenceAnchor = await viem.deployContract("EvidenceAnchor");
    return evidenceAnchor;
  }

  it("Should deploy successfully", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    assert.ok(evidenceAnchor.address);
  });

  it("Should allow anyone to anchor evidence", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    const testCid = "QmTestEvidence123456789";
    
    // 锚定证据
    const tx = await evidenceAnchor.write.anchorEvidence([testCid], {
      account: user.account,
    });
    
    // 等待交易确认
    await publicClient.waitForTransactionReceipt({ hash: tx });
    
    // 验证证据ID映射
    const evidenceId = await evidenceAnchor.read.getEvidenceIdByCid([testCid]);
    assert.equal(evidenceId, 0n);
    
    // 验证证据ID映射
    const mappedId = await evidenceAnchor.read.getEvidenceIdByCid([testCid]);
    assert.equal(mappedId, 0n);
    
    // 验证证据详情
    const evidence = await evidenceAnchor.read.getEvidence([0n]);
    assert.equal(evidence.ipfsCid, testCid);
    assert.equal(evidence.submitter.toLowerCase(), user.account.address.toLowerCase());
    assert.ok(evidence.timestamp > 0n);
  });

  it("Should not allow duplicate CID anchoring", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    const testCid = "QmDuplicateTest123456";
    
    // 第一次锚定应该成功
    await evidenceAnchor.write.anchorEvidence([testCid], {
      account: user.account,
    });
    
    // 第二次锚定应该失败
    await assert.rejects(
      evidenceAnchor.write.anchorEvidence([testCid], {
        account: user.account,
      }),
      /Evidence with this CID already exists/
    );
  });

  it("Should not allow empty CID anchoring", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    
    await assert.rejects(
      evidenceAnchor.write.anchorEvidence([""], {
        account: user.account,
      }),
      /IPFS CID cannot be empty/
    );
  });

  it("Should return correct evidence count", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    
    // 初始证据数量应为0
    let count = await evidenceAnchor.read.getEvidenceCount();
    assert.equal(count, 0n);
    
    // 锚定多个证据
    const cids = ["QmTest1", "QmTest2", "QmTest3"];
    for (const cid of cids) {
      await evidenceAnchor.write.anchorEvidence([cid], {
        account: user.account,
      });
    }
    
    // 验证证据数量
    count = await evidenceAnchor.read.getEvidenceCount();
    assert.equal(count, 3n);
  });

  it("Should handle multiple evidence anchoring correctly", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    const cids = ["QmMulti1", "QmMulti2", "QmMulti3"];
    
    // 锚定多个证据
    for (let i = 0; i < cids.length; i++) {
      const tx = await evidenceAnchor.write.anchorEvidence([cids[i]], {
        account: user.account,
      });
      
      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash: tx });
      
      // 验证CID到ID的映射
      const evidenceId = await evidenceAnchor.read.getEvidenceIdByCid([cids[i]]);
      assert.equal(evidenceId, BigInt(i));
      
      // 验证证据详情
      const evidence = await evidenceAnchor.read.getEvidence([BigInt(i)]);
      assert.equal(evidence.ipfsCid, cids[i]);
      assert.equal(evidence.submitter.toLowerCase(), user.account.address.toLowerCase());
    }
  });

  it("Should return zero for non-existent CID", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    
    const evidenceId = await evidenceAnchor.read.getEvidenceIdByCid(["QmNonExistent"]);
    assert.equal(evidenceId, 0n);
  });

  it("Should revert when accessing non-existent evidence", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    
    await assert.rejects(
      evidenceAnchor.read.getEvidence([999n]),
      /Evidence does not exist/
    );
  });

  it("Should emit EvidenceAnchored event", async function () {
    const evidenceAnchor = await deployEvidenceAnchor();
    const testCid = "QmEventTest123456";
    
    // 锚定证据
    const tx = await evidenceAnchor.write.anchorEvidence([testCid], {
      account: user.account,
    });
    
    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    
    // 验证事件
    assert.equal(receipt.logs.length, 1);
    const log = receipt.logs[0];
    
    // 验证事件主题 (事件签名 + 3个indexed参数)
    assert.equal(log.topics.length, 4);
  });
});