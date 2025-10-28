// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

/**
 * @title EvidenceAnchor
 * @dev 去中心化证据锚定合约 - 极简版本
 * 只负责锚定证据，记录IPFS CID、提交者地址和时间戳
 * AI分析结果和语义关联等可变数据存储在链下数据库
 */
contract EvidenceAnchor {
    // 事件定义
    event EvidenceAnchored(
        uint256 indexed evidenceId,
        string indexed ipfsCid,
        address indexed submitter,
        uint256 timestamp
    );

    // 结构体定义
    struct Evidence {
        string ipfsCid; // IPFS内容哈希
        address submitter; // 提交者地址
        uint256 timestamp; // 提交时间戳
    }

    // 状态变量
    Evidence[] public evidences;
    mapping(string => uint256) public cidToEvidenceId; // IPFS CID到证据ID的映射

    /**
     * @dev 锚定证据，任何人都可以调用
     * @param _ipfsCid 证据在IPFS上的内容哈希
     * @return evidenceId 新创建的证据ID
     */
    function anchorEvidence(
        string memory _ipfsCid
    ) external returns (uint256 evidenceId) {
        require(bytes(_ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(
            cidToEvidenceId[_ipfsCid] == 0,
            "Evidence with this CID already exists"
        );

        // 创建新证据
        evidenceId = evidences.length;
        Evidence memory newEvidence = Evidence({
            ipfsCid: _ipfsCid,
            submitter: msg.sender,
            timestamp: block.timestamp
        });

        evidences.push(newEvidence);
        cidToEvidenceId[_ipfsCid] = evidenceId + 1; // +1 因为0表示不存在

        emit EvidenceAnchored(
            evidenceId,
            _ipfsCid,
            msg.sender,
            block.timestamp
        );

        return evidenceId;
    }

    /**
     * @dev 根据IPFS CID获取证据ID
     * @param _ipfsCid IPFS内容哈希
     * @return evidenceId 证据ID，如果不存在返回0
     */
    function getEvidenceIdByCid(
        string memory _ipfsCid
    ) external view returns (uint256 evidenceId) {
        evidenceId = cidToEvidenceId[_ipfsCid];
        if (evidenceId > 0) {
            return evidenceId - 1; // 减1恢复原始ID
        }
        return 0;
    }

    /**
     * @dev 获取证据总数
     * @return count 证据总数
     */
    function getEvidenceCount() external view returns (uint256 count) {
        return evidences.length;
    }

    /**
     * @dev 获取证据详情
     * @param _evidenceId 证据ID
     * @return evidence 证据结构体
     */
    function getEvidence(
        uint256 _evidenceId
    ) external view returns (Evidence memory evidence) {
        require(_evidenceId < evidences.length, "Evidence does not exist");
        return evidences[_evidenceId];
    }
}
