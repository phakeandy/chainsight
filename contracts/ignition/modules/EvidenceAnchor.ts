import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EvidenceAnchorModule", (m) => {
  const evidenceAnchor = m.contract("EvidenceAnchor");

  return { evidenceAnchor };
});