# Bellproof: Market & Competitive Research

*Compiled 2026-10-11 from four parallel research passes (competitors, quantum×Web3, integrations, demand & timing). Claims marked ✔ I checked against the primary source; everything else comes from the research passes with the source linked. Not legal or investment advice.*

---

## TL;DR

1. **No one sells cryptographically sound verification of general quantum computations.** That is verification that holds against a *malicious* provider, not just a noisy one. If Bellproof ships it, Bellproof is first. The closest direct competitor, **VeriQloud**, uses trap-based checks, sells to operators rather than buyers, and is at the 2027 pilot stage.
2. **"First quantum compute on-chain" is NOT available as a claim.** Quip Network (D-Wave, testnet live, 13k+ sign-ups), DQPU (NEAR, trap circuits plus deposits, very similar to our flow) and JPMorgan patent filings already exist. The defensible claim is narrower: *escrow + provider collateral + on-chain certificate for cryptographically verified general quantum jobs.*
3. **The flagship protocol is a fault-tolerant-era product, about 2030 or later.** Compiled-game verification needs the prover to hold quantum state across interactive rounds and to run quantum homomorphic encryption. No public cloud supports interactive rounds across separate jobs today, and chemistry-scale advantage is about 2029–2036.
4. **To lead now, sell assurance levels, not a single protocol.** Level 1 is attested provenance, level 2 is trap-based accreditation (works on today's hardware), level 3 is cryptographic verification via compiled games. All three use one open certificate standard. Customers adopt today and upgrade as hardware matures.
5. **Independence is the moat.** IBM, Google and Quantinuum now market their *own* "trusted / verifiable" results ✔. A provider certifying itself is like a company auditing its own books. Bellproof should be the neutral auditor that sits on top of every cloud, not another marketplace competing with them.
6. **Biggest commercial risk: no pharma buyer has publicly asked for verification yet.** Lead with buyers who already pay for independent evaluation: research funders and challenge prizes, DARPA, and second-tier quantum vendors who want third-party proof that they beat the incumbents.

---

## 1. Are we first to market?

| Claim | First? | Who's already there |
|---|---|---|
| Classical, cryptographic (LWE-sound) verification of **general** quantum computation, sold as a service | **Yes.** Nobody found. | Research only: Mahadev 2018, KLVY 2023, Natarajan–Zhang 2023, Holler–Natarajan 2026 ✔ (arXiv:2609.38060) |
| Verification of quantum results as a product (any technique) | **No** | VeriQloud QAssure (trap-based, 2027 pilot) ✔; IBM's self-issued fidelity certificates ✔ |
| On-chain marketplace / settlement for quantum compute | **No** | Quip Network ✔; DQPU ✔; D-Wave and BTQ "proof of quantum work" (consensus only) |
| On-chain delivery of certified quantum output | **No** (as IP) | JPMorgan patent filings on blockchain-delivered certified randomness (US20260037965A1) |
| Escrow + collateral + on-chain certificate for **verified general** quantum jobs | **Yes, nobody found** | DQPU is the nearest, but uses trusted verifiers and simulators and has little activity |

**How to phrase it in the pitch:** "The first marketplace where quantum results are cryptographically verified before anyone gets paid." Avoid "first quantum blockchain" and "first quantum verification".

---

## 2. Competitive landscape

### Tier 1: Direct thesis overlap
**VeriQloud: VQCP = QAssure + QEnclave** (Paris, founded 2017, Elham Kashefi co-founder) ✔
- QAssure mixes hidden test rounds into the client's circuit and returns a confidence score. It needs mid-circuit measurement and classically controlled gates, and accepts QASM, Qiskit and Tket.
- QAssure explicitly does not provide privacy: "QAssure is about correctness, not privacy." The operator sees the circuit.
- QEnclave is FPGA or quantum-bus hardware for universal blind quantum computing.
- Status: "2027 pilot programme" for operators, manufacturers and HPC centres. Granted EU and US patents on delegated and secure quantum computing.
- Their pitch is nearly identical to ours. They say cloud agreements "cover API uptime, not result integrity."
- **How we differ:**
  - Buyer-side versus operator-side.
  - Cryptographic soundness against an adversarial provider, versus traps that a provider who can see the circuit may learn to spot.
  - On-chain settlement and a portable certificate.
- **Partner or competitor?** Possibly a partner: licensing their trap tech for our level 2 would be faster than rebuilding it.

### Tier 2: Providers certifying themselves (the "good enough" threat)
- **IBM.** IBM and UChicago announced "trusted quantum computation" on 30 July 2026 ✔: 70 logical qubits, plus a statistical lower bound on fidelity from error detection. IBM also runs the Quantum Advantage Tracker and published companion papers with Qedma and Algorithmiq. UChicago's Fefferman: *"Verification remains one of the biggest challenges."*
- **Google: Quantum Echoes** (Nature, Oct 2025). "Verifiable" here means reproducible on another device of similar quality, not cryptographic.
- **Quantinuum and JPMorgan: certified randomness** (Nature, Mar 2025). Narrow task; checking needed exascale classical compute.
- **The threat:** buyers accept free, self-issued certificates. **Our counter:** a provider grading its own exam is a conflict of interest, and self-issued certificates don't let buyers compare across vendors.

### Tier 3: On-chain quantum projects
- **Quip Network (Postquant Labs)** ✔
  - Testnet built with D-Wave Advantage2 since 2 April 2026, with 13k+ sign-ups.
  - Spot marketplace for idle quantum capacity, with an open API planned for later in 2026.
  - Classical nodes check outputs, but only for problems that are easy to check (optimization, hidden subgroup).
  - Token "forge" launch was announced for end of July 2026. QuipSwap went live on Base on 1 Sep 2026.
  - The most likely rival to claim the "trustless quantum compute" story first.
- **DQPU** (github.com/dakk/dqpu, NEAR) ✔
  - Client escrow, sampler deposit, and verifier-inserted trap circuits; a sampler who fails the traps loses the deposit to the verifier.
  - Verifiers are trusted and appointed. 8 stars, simulator-focused.
  - **This is prior art for our flow.** Cite it, and stress that our verifier needs no trust.
- **D-Wave "proof of quantum work"** (arXiv:2503.14462, Phys. Rev. A) and **BTQ QPoW** (boson-sampling simulator, Nasdaq: BTQ): consensus mechanisms, not job verification.
- **Not quantum compute:** Qubic and Qubitcoin (GPU simulation), and the post-quantum-cryptography projects (QRL, QANplatform, Project Eleven).

### Tier 4: Adjacent, and could expand into this space
- **Benchmarkers:** Keysight Quantum Benchmark (formerly True-Q), Metriq, BlueQubit (peaked circuits; $10M seed).
- **Error-mitigation vendors:** Qedma ($26M Series A, IBM participating), Q-CTRL, Haiqu.
- **Aggregators** that own the buyer relationship: Strangeworks (~$28M raised), qBraid, Classiq ($173M total), Amazon Braket.
- **Horizon Quantum:** CEO Joe Fitzsimons co-invented verifiable blind computing; Nasdaq-listed via SPAC in March 2026. No product, but a latent risk.

### Three most dangerous
1. **VeriQloud:** same thesis, Kashefi's IP and team, distribution through operators.
2. **IBM (provider self-certification):** controls the biggest cloud and is defining what "trusted" means.
3. **Quip:** community, token and D-Wave relationship. It could extend to gate-model hardware and tell the story louder.

---

## 3. The hard truths

1. **Interactive rounds aren't available on public clouds.**
   - Sessions on IBM, Azure and Braket reduce queue time between jobs, but quantum state does not survive from one job to the next.
   - Real-time feedback exists only *inside* a single circuit. Quantinuum Helios is strongest (Guppy, real-time control flow); IBM supports `if` only; IQM via Braket is experimental; IonQ has no branching.
   - KLVY-style compiled games need the prover to hold its post-measurement state while it waits for the verifier's next message.
   - The only described route to microsecond verifier-in-the-loop interaction is NVIDIA NVQLink / `cudaq-realtime`.
   - **What to do:** pursue a hardware design partner (Quantinuum, or an NVQLink partner).

2. **Fault tolerance is required, and chemistry advantage is years out.**
   - IBM Starling (2029): 200 logical qubits, 10⁸ operations.
   - FeMoco needs about 2,142 logical qubits; P450 needs about 4,900.
   - Narrow chemistry advantage is plausible around 2029–2032; industrially relevant chemistry around 2033–2036.
   - The compiled-game protocol adds prover overhead on top of that. **Reducing that overhead is the core R&D moat.** This is where the team's research background is a real advantage.

3. **Demand has to be created.**
   - The research found no pharma or chemicals buyer publicly asking for independent or cryptographic verification of quantum outputs.
   - Pharma commentary currently treats quantum as the thing that *validates* AI, not as something that needs validating.
   - Strongest current signals:
     - vendors competing on "verifiable" claims;
     - funders paying for independent evaluation (DARPA QBI, Wellcome Leap Q4Bio);
     - a steady stream of overstated claims: IBM's 2023 utility result classically matched, D-Wave 2025 disputed, Majorana 1 editor's note, HSBC–IBM "34%".

4. **Public verifiability.**
   - These protocols are designated-verifier: verification needs secret keys, so an EVM contract can't verify on its own.
   - Our commit-reveal design matches a recent paper: Mohammed–Abadi–Mahdi, *"Time-Delayed Publicly Verifiable Quantum Computation for Classical Verifiers"*, accepted at ACM CCS 2026 ✔ (arXiv:2604.23516). It uses time-lock puzzles plus commitments under post-quantum assumptions.
   - **Cite it, and add a drand timelock fallback** so the keys reveal even if the verifier disappears.

5. **The market is small before fault tolerance.**
   - Quantum computing revenue was over $1B in 2025 and is projected at $4.4B by 2028 (McKinsey Quantum Technology Monitor 2026 ✔, via PostQuantum).
   - BCG puts near-term chemistry and materials value at $100–500M per year.
   - A verification slice before fault tolerance is low single-digit $M, so the near-term business must be **assurance and attestation**, not only cryptographic proofs.

---

## 4. How to position Bellproof as the leader

### 4.1 Be the neutral auditor of quantum compute
Position like an auditor, a certificate authority or a credit-rating agency: provider-agnostic, independent, and portable across clouds. Sit **on top of** Braket, IBM, qBraid and Quantinuum rather than competing with them as a marketplace. That is how Boundless and Succinct position across chains.

### 4.2 Productize assurance levels (be first now, honestly)

| Level | What it proves | Technique | Works today? |
|---|---|---|---|
| **L1 Attested** | This exact circuit ran on the claimed backend, with this calibration, at this time | Signed, hash-chained job logs plus calibration snapshot; catches silent backend downgrades (cf. QCIVET, arXiv:2605.13109) | Yes |
| **L2 Accredited** | The output distribution is close to ideal, under noise assumptions | Trap / accreditation circuits interleaved (Ferracin–Kapourniotis–Datta 2019; noise-robust trap verification in the Kashefi line, open-source `ocvqc-py`), cross-platform randomized-measurement checks, classical-baseline check | Yes, about 10–50 qubits |
| **L3 Verified** | The result is correct even against a malicious provider (LWE) | Compiled nonlocal games (KLVY → Natarajan–Zhang → Holler–Natarajan) | Fault-tolerant era; needs a hardware design partner |

All three levels share **one certificate format** (an EAS schema): job ID, circuit hash, backend, level, verdict, error bound, transcript CID. This gives the customer a reason to adopt now, and gives us an upgrade path to sell.

### 4.3 Own the standard
- No standard covers verification of *individual* quantum results. ISO/IEC JTC 3 WG2 and IEEE P7131 cover device benchmarking only.
- Publish an **open Quantum Result Certificate spec** and an **open-source verifier** (trust requires auditable code).
- Get involved in JTC 3 / P7131. Whoever writes the standard leads the category.

### 4.4 Win developers
- Make verification a one-line change:
  - a `BellproofSampler` / `BellproofEstimator` Qiskit primitive wrapper;
  - a PennyLane device, a pytket/Nexus backend, and a qBraid device ID;
  - a Qiskit Functions catalog listing;
  - a REST API for orchestrators (QIDO, Microsoft Discovery).
- Chemistry tools would then route through Bellproof unchanged. Examples: Kvantify Qrunch, Qunova HI-VQE, QunaSys, InQuanto.
- PySCF → active-space Hamiltonian → quantum solver is the common entry point.

### 4.5 Research moat
- Ship the first public reference implementation of compiled-game verification (CHSH / Magic Square → BQP), with benchmarks of prover overhead.
- Publish overhead-reduction results. Every factor cut moves level 3 closer, and no competitor's team can do this.

### 4.6 Crypto design that fits this market
Quantum supply is about a dozen large vendors, not hobbyist miners, and the buyers are enterprises. So:
- **Stablecoin escrow and collateral; no token early**, if ever.
- **Slash for liveness and provable misbehaviour only**, and use noise-tolerant pass thresholds so honest-but-noisy runs aren't punished (the Succinct / Lagrange pattern).
- **Account abstraction plus a paymaster**, so a pharma team pays without touching a wallet. Crypto stays as plumbing.

---

## 5. Integrations

### Hackathon MVP
1. **Prover:** Qiskit Aer or CUDA-Q simulator. Optionally, IBM Open Plan jobs with `if_test` in-circuit test rounds (free).
2. **Contracts on Base Sepolia:** USDC escrow, stake/slash, keccak commit-reveal, plus a **drand timelock** fallback (verifiable on-chain since EIP-2537).
3. **Certificate:** **EAS** attestation plus IPFS CID of the transcript.
4. **Payments UX:** smart wallet plus Coinbase CDP paymaster, to demo "pay without a wallet".
5. **Optional:** SP1 or RISC Zero proof of a toy verifier (CHSH score plus one LWE decryption) to show SNARK-wrapping.

### First 6 months
1. **IBM** Flex/Premium plan (sessions require a paid plan; pay-as-you-go is $96/min ✔) plus a **Qiskit Functions** listing.
2. **Amazon Braket** (program sets, reservations) and **qBraid** for multi-vendor coverage.
3. **Quantinuum Helios design partnership:** the best real-time control available, so the best shot at real interactive rounds.
4. **Qiskit / PennyLane / pytket plugins** plus one chemistry app partner (Kvantify, Qunova or QunaSys).
5. **Production rails:**
   - Base mainnet, USDC + CCTP V2.
   - **Chainlink CRE** for relaying verdicts. Chainlink Functions is deprecated ✔; Chainlink's migration docs give a mainnet shutdown of 30 June 2026.
   - Filecoin or Arweave transcript archive.

### 12+ months
1. **EigenLayer / Symbiotic verifier network (AVS)** with slashing, to decentralize the verifier.
2. **NVQLink / `cudaq-realtime` verifier** co-located with the controller (in a TEE), for microsecond interactive rounds.
3. **QIR + OpenQASM 3** as the canonical job format; Azure Adaptive RI; Google if access opens.

---

## 6. Go-to-market

### Beachhead buyers, in order of readiness
1. **Research funders and challenge prizes.** They already pay for independent evaluation. Examples: Wellcome Leap Q4Bio ($40M funding pool; a $2M prize awarded April 2026) and Novo Nordisk Foundation / EIFO QuNorth (€80M "Magne" machine).
2. **DARPA QBI IV&V.** Open solicitation DARPA-PA-26-02-01, deadline **30 Dec 2026** ✔. It verifies hardware roadmaps, not jobs, but it is a credibility and funding route.
3. **Second-tier quantum vendors** wanting third-party proof against IBM and Google: a "Bellproof Verified" badge.
4. **Pharma and materials innovation teams** benchmarking vendors (AstraZeneca, Boehringer, Merck KGaA, Amgen, Moderna, JSR).
5. **DeSci as a crypto-native showcase.** Molecule IP-NFT data rooms, BIO Protocol, Quantum Biology DAO. Note: no DeSci player was found funding quantum chemistry yet.

### Partnerships to pursue
- **Quantinuum:** real-time control, plus Nexus as a distribution channel.
- **qBraid:** an aggregator channel with an API.
- **A chemistry app vendor:** Kvantify, Qunova or QunaSys.
- **NVIDIA NVQLink ecosystem.**
- **VeriQloud:** for licensing, or as a long-term rival to watch.

### Revenue ideas (to test, not validated)
- Per-job verification fee, priced by assurance level.
- Protocol fee on escrow.
- Vendor certification subscription (the badge).
- Enterprise or on-prem verifier licence.

---

## 7. IP watch (get a freedom-to-operate review before fundraising)
- **NTT + Mitsubishi Electric, US12395326B2** ✔ (granted 2025-08-19; priority 2021-06-04). A classical verifier uses a public key and trapdoor (lattice-based assumption) to estimate whether a quantum device prepared a CCZ magic state and performed Pauli measurements correctly. **This is the closest to computational self-testing, so get an FTO review.**
- **JPMorgan:** US20260037965A1 (blockchain certified random function), US20250315704A1, US20250315212A1.
- **VeriQloud:** US20240160992A1. **University of Edinburgh:** WO2015121619A2.
- **Dell:** US12265841B2, a quantum-as-a-service broker that computes a confidence score that a job ran on the expected processor.
- **Also:** Quandela EP4500315B1 (nonlocal-game certification on photonic chips); UT Austin US20250362877A1 (certified randomness); CAS CN120654843A.
- **Gaps (possible filing opportunities):** no filings found on compiled nonlocal games for general verification, or on escrow + collateral settlement of verified quantum jobs. The patent search was limited.

---

## 8. Implications for the pitch deck
- Make the "first" claim precise (§1). Add a short competition slide covering VeriQloud, provider self-certification and Quip/DQPU, and saying why buyer-side, cryptographic and on-chain is different.
- Add a **roadmap slide** with the three assurance levels. It answers the judge question "does this work today?"
- Cite the CCS 2026 time-delayed public verifiability paper on the contract-flow slide.
- Holler–Natarajan is confirmed on arXiv ✔. One research pass couldn't find it, so keep the arXiv number on the slide.
- Correction: the noisy-device accreditation work is Ferracin–Kapourniotis–Datta, not Kashefi. It isn't in the deck yet; keep it right if it's added.

---

## 9. Open items / not verified
- Funding figures for VeriQloud and Quip.
- Whether Quantinuum's certified-randomness product is generally available.
- Native feed-forward on Rigetti and IQM Resonance.
- Any hardware demonstration of a KLVY-*compiled* game. The closest found is an uncompiled game on trapped ions, arXiv:2603.18323.
- IDC market figures.
- Battery-maker quantum deals.
- Phasecraft, Riverlane, Quantum Rings, SupertechLabs and QED-C were not checked.

---

## Sources (key)

**Verified directly**
- VeriQloud VQCP: https://www.veriqloud.com/vqcp
- Quip Network: https://thequantuminsider.com/2026/04/02/quip-network-launches-quantum-classical-blockchain-testnet-built-in-consultation-with-d-wave/ and https://crypto.news/a-shared-quantum-computer-for-web3-is-here-but-it-doesnt-run-on-aws/
- DQPU: https://github.com/dakk/dqpu
- NTT/Mitsubishi patent: https://patents.google.com/patent/US12395326B2/en
- Holler–Natarajan: https://arxiv.org/abs/2609.38060
- Time-delayed public verifiability (CCS 2026): https://arxiv.org/abs/2604.23516
- IBM/UChicago trusted computation: https://newsroom.ibm.com/2026-07-30-ibm-and-the-university-of-chicago-demonstrate-quantum-advantage,-establishing-trusted-quantum-computation-on-logical-circuits
- IBM pricing: https://www.ibm.com/quantum/pricing
- Chainlink Functions → CRE: https://docs.chain.link/cre/reference/clf-migration-ts
- McKinsey QTM 2026 (summary): https://postquantum.com/industry-news/mckinsey-quantum-monitor-2026/
- DARPA QBI: https://www.darpa.mil/research/programs/quantum-benchmarking-initiative

**From the research passes**
- Competitors:
  - IBM Quantum Advantage Tracker: https://www.ibm.com/quantum/blog/quantum-advantage-tracker
  - Quantinuum certified randomness: https://www.quantinuum.com/blog/quantinuum-introduces-first-commercial-application-for-quantum-computers
  - Google Quantum Echoes: https://blog.google/technology/research/quantum-echoes-willow-verifiable-quantum-advantage/
  - BlueQubit challenge: https://thequantuminsider.com/2026/02/02/bluequbit-launches-a-quantum-advantage-challenge-with-a-20000-bitcoin-prize/
  - Qedma Series A: https://techcrunch.com/2025/07/03/israeli-quantum-startup-qedma-just-raised-26-million-with-ibm-joining-in
  - QCIVET: https://arxiv.org/abs/2605.13109
  - Logical accreditation: https://arxiv.org/abs/2603.08680
- Quantum×Web3:
  - D-Wave proof of quantum work: https://arxiv.org/abs/2503.14462
  - BTQ QPoW: https://thequantuminsider.com/2025/07/08/btq-launches-quantum-proof-of-work-simulator-delivering-demonstration-of-quantum-advantage-in-blockchain-consensus/
  - Boundless: https://boundless.network/blog/mainnet-is-live
  - Succinct staking: https://docs.succinct.xyz/docs/protocol/prove/staking
  - Hyperbolic proof of sampling: https://www.hyperbolic.xyz/blog/deep-dive-into-hyperbolic-proof-of-sampling
  - DeSci 2026 overview: https://blockeden.xyz/blog/2026/04/10/desci-2026-bio-protocol-bioagents-sei-65m-fund-decentralized-science/
- Integrations:
  - IBM execution modes: https://quantum.cloud.ibm.com/docs/en/guides/execution-modes
  - IBM feed-forward and control flow: https://eu-de.quantum.cloud.ibm.com/docs/guides/classical-feedforward-and-control-flow
  - Braket experimental capabilities: https://docs.aws.amazon.com/braket/latest/developerguide/braket-experimental-capabilities.html
  - Quantinuum Helios data sheet: https://docs.quantinuum.com/systems/data_sheets/Quantinuum%20Helios%20Product%20Data%20Sheet.pdf
  - NVQLink: https://nvidia.github.io/cuda-quantum/blogs/blog/category/nvqlink/
  - qBraid docs: https://docs.qbraid.com/home/
  - drand on Ethereum: https://docs.drand.love/blog/2025/08/26/verifying-bls12-on-ethereum
  - Base paymasters: https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters.md
  - EigenLayer slashing: https://www.eigenlabs.org/blog/slashing-goes-live/
- Demand & timing:
  - IBM roadmap: https://ibm.com/roadmaps/quantum
  - Quantinuum fault-tolerance roadmap: https://www.quantinuum.com/press-releases/quantinuum-unveils-accelerated-roadmap-to-achieve-universal-fault-tolerant-quantum-computing-by-2030
  - BCG quantum value: https://bcg.com/press/18july2024-quantum-computing-create-up-to-850-billion-of-economic-value-2040
  - Wellcome Leap Q4Bio prize: https://thequantuminsider.com/2026/04/16/wellcome-leap-quantum-for-bio-challenge-prize/
  - QuNorth Magne: https://quantumcomputingreport.com/denmarks-qunorth-to-acquire-50-logical-qubit-magne-quantum-computer-from-atom-computing-and-microsoft/
  - ICH M15: https://www.raps.org/resource/ich-adopts-m15-guideline-on-model-informed-drug-de.html
  - Accreditation (Ferracin–Kapourniotis–Datta): https://arxiv.org/abs/1811.09709
