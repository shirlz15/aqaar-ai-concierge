# Retrieval Quality Report

Generated: 2026-06-24
Version: 2.0

## Scope

Retrieval tests use only the Aqaar KB RAG chunks generated from AQAAR-KB-ACQ-FINAL. No PalmX content, external sources, or fake projects are included.

## Results

- Test queries: 194
- Passed lexical entity checks: 194/194
- Review required: 0

## Method

Each query is matched against Aqaar RAG chunk titles and text using lexical coverage over the top 60 candidate chunks. This V2 suite keeps only deterministic Aqaar project, official published-price, location, and FAQ checks whose expected entities resolve in the KB retrieval corpus. Production retrieval should use embeddings/reranking while preserving these expected-entity checks.

## Query Results

- RQ-V2-0001: PASS | top_chunk=60b8dd4b_0ad1_e811_a2b8_00155d119707_98 | score=5
- RQ-V2-0002: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=6
- RQ-V2-0003: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=5
- RQ-V2-0004: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=5
- RQ-V2-0005: PASS | top_chunk=7f307ab5_a6a9_ea11_a2c3_00155d119619_117 | score=5
- RQ-V2-0006: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=5
- RQ-V2-0007: PASS | top_chunk=2a565476_ed0f_ee11_a2be_00155d119f33_48 | score=5
- RQ-V2-0008: PASS | top_chunk=f6b7dd4b_0ad1_e811_a2b8_00155d119707_211 | score=4
- RQ-V2-0009: PASS | top_chunk=96b8dd4b_0ad1_e811_a2b8_00155d119707_140 | score=5
- RQ-V2-0010: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=4
- RQ-V2-0011: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=4
- RQ-V2-0012: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=4
- RQ-V2-0013: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=4
- RQ-V2-0014: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=4
- RQ-V2-0015: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=5
- RQ-V2-0016: PASS | top_chunk=e6b7dd4b_0ad1_e811_a2b8_00155d119707_190 | score=4
- RQ-V2-0017: PASS | top_chunk=feb7dd4b_0ad1_e811_a2b8_00155d119707_218 | score=4
- RQ-V2-0018: PASS | top_chunk=b0b8dd4b_0ad1_e811_a2b8_00155d119707_167 | score=4
- RQ-V2-0019: PASS | top_chunk=f4502104_adbf_ec11_a2bf_00155d119927_208 | score=4
- RQ-V2-0020: PASS | top_chunk=00b8dd4b_0ad1_e811_a2b8_00155d119707_1 | score=4
- RQ-V2-0021: PASS | top_chunk=76b8dd4b_0ad1_e811_a2b8_00155d119707_109 | score=5
- RQ-V2-0022: PASS | top_chunk=76b8dd4b_0ad1_e811_a2b8_00155d119707_109 | score=5
- RQ-V2-0023: PASS | top_chunk=e8b7dd4b_0ad1_e811_a2b8_00155d119707_192 | score=4
- RQ-V2-0024: PASS | top_chunk=a6b8dd4b_0ad1_e811_a2b8_00155d119707_156 | score=4
- RQ-V2-0025: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=4
- RQ-V2-0026: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=4
- RQ-V2-0027: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=4
- RQ-V2-0028: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0029: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0030: PASS | top_chunk=2ab8dd4b_0ad1_e811_a2b8_00155d119707_50 | score=5
- RQ-V2-0031: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=6
- RQ-V2-0032: PASS | top_chunk=a2b8dd4b_0ad1_e811_a2b8_00155d119707_152 | score=6
- RQ-V2-0033: PASS | top_chunk=a2b8dd4b_0ad1_e811_a2b8_00155d119707_152 | score=6
- RQ-V2-0034: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0035: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0036: PASS | top_chunk=8aed16b5_4982_ec11_a2bf_00155d119927_129 | score=4
- RQ-V2-0037: PASS | top_chunk=44b8dd4b_0ad1_e811_a2b8_00155d119707_75 | score=6
- RQ-V2-0038: PASS | top_chunk=9cb8dd4b_0ad1_e811_a2b8_00155d119707_146 | score=5
- RQ-V2-0039: PASS | top_chunk=7cb8dd4b_0ad1_e811_a2b8_00155d119707_114 | score=5
- RQ-V2-0040: PASS | top_chunk=6eb8dd4b_0ad1_e811_a2b8_00155d119707_105 | score=6
- RQ-V2-0041: PASS | top_chunk=48b8dd4b_0ad1_e811_a2b8_00155d119707_81 | score=6
- RQ-V2-0042: PASS | top_chunk=0ab8dd4b_0ad1_e811_a2b8_00155d119707_11 | score=4
- RQ-V2-0043: PASS | top_chunk=94b8dd4b_0ad1_e811_a2b8_00155d119707_138 | score=6
- RQ-V2-0044: PASS | top_chunk=12b8dd4b_0ad1_e811_a2b8_00155d119707_20 | score=4
- RQ-V2-0045: PASS | top_chunk=b2b8dd4b_0ad1_e811_a2b8_00155d119707_169 | score=6
- RQ-V2-0046: PASS | top_chunk=00b8dd4b_0ad1_e811_a2b8_00155d119707_1 | score=4
- RQ-V2-0047: PASS | top_chunk=29eb4220_c77d_ec11_a2ca_00155d119619_45 | score=4
- RQ-V2-0048: PASS | top_chunk=29eb4220_c77d_ec11_a2ca_00155d119619_45 | score=4
- RQ-V2-0049: PASS | top_chunk=06b8dd4b_0ad1_e811_a2b8_00155d119707_7 | score=4
- RQ-V2-0050: PASS | top_chunk=28b8dd4b_0ad1_e811_a2b8_00155d119707_43 | score=5
- RQ-V2-0051: PASS | top_chunk=9eb8dd4b_0ad1_e811_a2b8_00155d119707_148 | score=5
- RQ-V2-0052: PASS | top_chunk=98b8dd4b_0ad1_e811_a2b8_00155d119707_142 | score=5
- RQ-V2-0053: PASS | top_chunk=cc16b230_d81e_ee11_a2be_00155d119f33_182 | score=4
- RQ-V2-0054: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=4
- RQ-V2-0055: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=4
- RQ-V2-0056: PASS | top_chunk=86b8dd4b_0ad1_e811_a2b8_00155d119707_124 | score=6
- RQ-V2-0057: PASS | top_chunk=11f6f9c7_d27d_ec11_a2ca_00155d119619_18 | score=4
- RQ-V2-0058: PASS | top_chunk=32b8dd4b_0ad1_e811_a2b8_00155d119707_59 | score=4
- RQ-V2-0059: PASS | top_chunk=90b8dd4b_0ad1_e811_a2b8_00155d119707_135 | score=8
- RQ-V2-0060: PASS | top_chunk=b4b8dd4b_0ad1_e811_a2b8_00155d119707_171 | score=8
- RQ-V2-0061: PASS | top_chunk=44f00817_9e49_eb11_a2c6_00155d119619_77 | score=4
- RQ-V2-0062: PASS | top_chunk=0eb8dd4b_0ad1_e811_a2b8_00155d119707_14 | score=4
- RQ-V2-0063: PASS | top_chunk=10b8dd4b_0ad1_e811_a2b8_00155d119707_16 | score=4
- RQ-V2-0064: PASS | top_chunk=a8b8dd4b_0ad1_e811_a2b8_00155d119707_160 | score=4
- RQ-V2-0065: PASS | top_chunk=a8b8dd4b_0ad1_e811_a2b8_00155d119707_160 | score=4
- RQ-V2-0066: PASS | top_chunk=a8b8dd4b_0ad1_e811_a2b8_00155d119707_160 | score=4
- RQ-V2-0067: PASS | top_chunk=42b8dd4b_0ad1_e811_a2b8_00155d119707_73 | score=5
- RQ-V2-0068: PASS | top_chunk=beabdf96_e122_e911_a2b8_00155d119707_178 | score=4
- RQ-V2-0069: PASS | top_chunk=02b8dd4b_0ad1_e811_a2b8_00155d119707_3 | score=5
- RQ-V2-0070: PASS | top_chunk=6c1c103f_f0f0_ea11_a2c4_00155d119619_102 | score=5
- RQ-V2-0071: PASS | top_chunk=eeb7dd4b_0ad1_e811_a2b8_00155d119707_201 | score=5
- RQ-V2-0072: PASS | top_chunk=1ab8dd4b_0ad1_e811_a2b8_00155d119707_27 | score=4
- RQ-V2-0073: PASS | top_chunk=1ab8dd4b_0ad1_e811_a2b8_00155d119707_27 | score=4
- RQ-V2-0074: PASS | top_chunk=64b8dd4b_0ad1_e811_a2b8_00155d119707_100 | score=4
- RQ-V2-0075: PASS | top_chunk=34b8dd4b_0ad1_e811_a2b8_00155d119707_61 | score=4
- RQ-V2-0076: PASS | top_chunk=14b8dd4b_0ad1_e811_a2b8_00155d119707_22 | score=5
- RQ-V2-0077: PASS | top_chunk=02b8dd4b_0ad1_e811_a2b8_00155d119707_3 | score=5
- RQ-V2-0078: PASS | top_chunk=16b8dd4b_0ad1_e811_a2b8_00155d119707_23 | score=5
- RQ-V2-0079: PASS | top_chunk=00b8dd4b_0ad1_e811_a2b8_00155d119707_1 | score=3
- RQ-V2-0080: PASS | top_chunk=38b8dd4b_0ad1_e811_a2b8_00155d119707_64 | score=4
- RQ-V2-0081: PASS | top_chunk=38b8dd4b_0ad1_e811_a2b8_00155d119707_64 | score=4
- RQ-V2-0082: PASS | top_chunk=eab7dd4b_0ad1_e811_a2b8_00155d119707_196 | score=5
- RQ-V2-0083: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=7
- RQ-V2-0084: PASS | top_chunk=14b8dd4b_0ad1_e811_a2b8_00155d119707_22 | score=5
- RQ-V2-0085: PASS | top_chunk=34b8dd4b_0ad1_e811_a2b8_00155d119707_61 | score=5
- RQ-V2-0086: PASS | top_chunk=36b8dd4b_0ad1_e811_a2b8_00155d119707_63 | score=5
- RQ-V2-0087: PASS | top_chunk=7d307ab5_a6a9_ea11_a2c3_00155d119619_116 | score=5
- RQ-V2-0088: PASS | top_chunk=e4b7dd4b_0ad1_e811_a2b8_00155d119707_189 | score=4
- RQ-V2-0089: PASS | top_chunk=f4b7dd4b_0ad1_e811_a2b8_00155d119707_210 | score=5
- RQ-V2-0090: PASS | top_chunk=50b8dd4b_0ad1_e811_a2b8_00155d119707_87 | score=7
- RQ-V2-0091: PASS | top_chunk=5ab8dd4b_0ad1_e811_a2b8_00155d119707_94 | score=4
- RQ-V2-0092: PASS | top_chunk=14b8dd4b_0ad1_e811_a2b8_00155d119707_22 | score=4
- RQ-V2-0093: PASS | top_chunk=9ab8dd4b_0ad1_e811_a2b8_00155d119707_145 | score=4
- RQ-V2-0094: PASS | top_chunk=4cb8dd4b_0ad1_e811_a2b8_00155d119707_85 | score=5
- RQ-V2-0095: PASS | top_chunk=4eb8dd4b_0ad1_e811_a2b8_00155d119707_86 | score=5
- RQ-V2-0096: PASS | top_chunk=7ab8dd4b_0ad1_e811_a2b8_00155d119707_113 | score=6
- RQ-V2-0097: PASS | top_chunk=84b8dd4b_0ad1_e811_a2b8_00155d119707_122 | score=5
- RQ-V2-0098: PASS | top_chunk=a736c16e_313f_e911_a2b9_00155d119910_158 | score=5
- RQ-V2-0099: PASS | top_chunk=fcb24d18_ff7d_ee11_a2bf_00155d119f33_215 | score=6
- RQ-V2-0100: PASS | top_chunk=52b8dd4b_0ad1_e811_a2b8_00155d119707_89 | score=5
- RQ-V2-0101: PASS | top_chunk=b514b2db_08f8_ea11_a2c5_00155d119619_173 | score=5
- RQ-V2-0102: PASS | top_chunk=f8b7dd4b_0ad1_e811_a2b8_00155d119707_213 | score=5
- RQ-V2-0103: PASS | top_chunk=e9afbd0c_b405_ee11_a2bc_00155d119841_194 | score=6
- RQ-V2-0104: PASS | top_chunk=bb57baca_fa02_ef11_a2c0_00155d119841_175 | score=5
- RQ-V2-0105: PASS | top_chunk=f0b7dd4b_0ad1_e811_a2b8_00155d119707_203 | score=5
- RQ-V2-0106: PASS | top_chunk=ea381dec_0c0f_ed11_a2bb_00155d119f33_195 | score=4
- RQ-V2-0107: PASS | top_chunk=70b8dd4b_0ad1_e811_a2b8_00155d119707_107 | score=6
- RQ-V2-0108: PASS | top_chunk=f8b7dd4b_0ad1_e811_a2b8_00155d119707_213 | score=5
- RQ-V2-0109: PASS | top_chunk=0cb8dd4b_0ad1_e811_a2b8_00155d119707_13 | score=5
- RQ-V2-0110: PASS | top_chunk=bd8bd1e6_0420_e911_a2b8_00155d119707_177 | score=5
- RQ-V2-0111: PASS | top_chunk=f2b7dd4b_0ad1_e811_a2b8_00155d119707_207 | score=4
- RQ-V2-0112: PASS | top_chunk=f2b7dd4b_0ad1_e811_a2b8_00155d119707_207 | score=5
- RQ-V2-0113: PASS | top_chunk=46b8dd4b_0ad1_e811_a2b8_00155d119707_79 | score=7
- RQ-V2-0114: PASS | top_chunk=5eb8dd4b_0ad1_e811_a2b8_00155d119707_97 | score=4
- RQ-V2-0115: PASS | top_chunk=4ab8dd4b_0ad1_e811_a2b8_00155d119707_83 | score=6
- RQ-V2-0116: PASS | top_chunk=2a3a3b61_bd9f_ee11_a2bf_00155d119841_47 | score=7
- RQ-V2-0117: PASS | top_chunk=cab8dd4b_0ad1_e811_a2b8_00155d119707_181 | score=6
- RQ-V2-0118: PASS | top_chunk=5a6d07a8_f7e1_ea11_a2c4_00155d119619_93 | score=4
- RQ-V2-0119: PASS | top_chunk=62b8dd4b_0ad1_e811_a2b8_00155d119707_99 | score=5
- RQ-V2-0120: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=9
- RQ-V2-0121: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=8
- RQ-V2-0122: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=8
- RQ-V2-0123: PASS | top_chunk=7f307ab5_a6a9_ea11_a2c3_00155d119619_117 | score=8
- RQ-V2-0124: PASS | top_chunk=2a565476_ed0f_ee11_a2be_00155d119f33_48 | score=8
- RQ-V2-0125: PASS | top_chunk=f6b7dd4b_0ad1_e811_a2b8_00155d119707_211 | score=7
- RQ-V2-0126: PASS | top_chunk=96b8dd4b_0ad1_e811_a2b8_00155d119707_140 | score=8
- RQ-V2-0127: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=7
- RQ-V2-0128: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=7
- RQ-V2-0129: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=7
- RQ-V2-0130: PASS | top_chunk=3ab8dd4b_0ad1_e811_a2b8_00155d119707_65 | score=7
- RQ-V2-0131: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=7
- RQ-V2-0132: PASS | top_chunk=e6b7dd4b_0ad1_e811_a2b8_00155d119707_190 | score=7
- RQ-V2-0133: PASS | top_chunk=feb7dd4b_0ad1_e811_a2b8_00155d119707_218 | score=7
- RQ-V2-0134: PASS | top_chunk=b0b8dd4b_0ad1_e811_a2b8_00155d119707_167 | score=7
- RQ-V2-0135: PASS | top_chunk=f4502104_adbf_ec11_a2bf_00155d119927_208 | score=7
- RQ-V2-0136: PASS | top_chunk=76b8dd4b_0ad1_e811_a2b8_00155d119707_109 | score=8
- RQ-V2-0137: PASS | top_chunk=76b8dd4b_0ad1_e811_a2b8_00155d119707_109 | score=8
- RQ-V2-0138: PASS | top_chunk=e8b7dd4b_0ad1_e811_a2b8_00155d119707_192 | score=7
- RQ-V2-0139: PASS | top_chunk=a6b8dd4b_0ad1_e811_a2b8_00155d119707_156 | score=7
- RQ-V2-0140: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=7
- RQ-V2-0141: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=7
- RQ-V2-0142: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=7
- RQ-V2-0143: PASS | top_chunk=2ab8dd4b_0ad1_e811_a2b8_00155d119707_50 | score=8
- RQ-V2-0144: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=9
- RQ-V2-0145: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=8
- RQ-V2-0146: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=8
- RQ-V2-0147: PASS | top_chunk=8aed16b5_4982_ec11_a2bf_00155d119927_129 | score=7
- RQ-V2-0148: PASS | top_chunk=44b8dd4b_0ad1_e811_a2b8_00155d119707_75 | score=9
- RQ-V2-0149: PASS | top_chunk=9cb8dd4b_0ad1_e811_a2b8_00155d119707_146 | score=8
- RQ-V2-0150: PASS | top_chunk=7cb8dd4b_0ad1_e811_a2b8_00155d119707_114 | score=8
- RQ-V2-0151: PASS | top_chunk=48b8dd4b_0ad1_e811_a2b8_00155d119707_81 | score=9
- RQ-V2-0152: PASS | top_chunk=0ab8dd4b_0ad1_e811_a2b8_00155d119707_11 | score=7
- RQ-V2-0153: PASS | top_chunk=12b8dd4b_0ad1_e811_a2b8_00155d119707_20 | score=7
- RQ-V2-0154: PASS | top_chunk=b2b8dd4b_0ad1_e811_a2b8_00155d119707_169 | score=9
- RQ-V2-0155: PASS | top_chunk=60b8dd4b_0ad1_e811_a2b8_00155d119707_98 | score=6
- RQ-V2-0156: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=7
- RQ-V2-0157: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=6
- RQ-V2-0158: PASS | top_chunk=08b8dd4b_0ad1_e811_a2b8_00155d119707_9 | score=6
- RQ-V2-0159: PASS | top_chunk=7f307ab5_a6a9_ea11_a2c3_00155d119619_117 | score=6
- RQ-V2-0160: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=6
- RQ-V2-0161: PASS | top_chunk=2a565476_ed0f_ee11_a2be_00155d119f33_48 | score=6
- RQ-V2-0162: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0163: PASS | top_chunk=1cb8dd4b_0ad1_e811_a2b8_00155d119707_30 | score=5
- RQ-V2-0164: PASS | top_chunk=29eb4220_c77d_ec11_a2ca_00155d119619_45 | score=5
- RQ-V2-0165: PASS | top_chunk=29eb4220_c77d_ec11_a2ca_00155d119619_45 | score=5
- RQ-V2-0166: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=5
- RQ-V2-0167: PASS | top_chunk=18b8dd4b_0ad1_e811_a2b8_00155d119707_25 | score=5
- RQ-V2-0168: PASS | top_chunk=86b8dd4b_0ad1_e811_a2b8_00155d119707_124 | score=7
- RQ-V2-0169: PASS | top_chunk=16b8dd4b_0ad1_e811_a2b8_00155d119707_23 | score=6
- RQ-V2-0170: PASS | top_chunk=836256dc_a305_f111_8407_70a8a5232028_121 | score=8
- RQ-V2-0171: PASS | top_chunk=50b8dd4b_0ad1_e811_a2b8_00155d119707_87 | score=8
- RQ-V2-0172: PASS | top_chunk=9ab8dd4b_0ad1_e811_a2b8_00155d119707_145 | score=5
- RQ-V2-0173: PASS | top_chunk=7ab8dd4b_0ad1_e811_a2b8_00155d119707_113 | score=7
- RQ-V2-0174: PASS | top_chunk=84b8dd4b_0ad1_e811_a2b8_00155d119707_122 | score=6
- RQ-V2-0175: PASS | top_chunk=a736c16e_313f_e911_a2b9_00155d119910_158 | score=6
- RQ-V2-0176: PASS | top_chunk=b514b2db_08f8_ea11_a2c5_00155d119619_173 | score=6
- RQ-V2-0177: PASS | top_chunk=faq_001_220 | score=12
- RQ-V2-0178: PASS | top_chunk=faq_002_221 | score=9
- RQ-V2-0179: PASS | top_chunk=faq_003_222 | score=9
- RQ-V2-0180: PASS | top_chunk=faq_004_223 | score=8
- RQ-V2-0181: PASS | top_chunk=faq_005_224 | score=12
- RQ-V2-0182: PASS | top_chunk=faq_006_225 | score=12
- RQ-V2-0183: PASS | top_chunk=faq_007_226 | score=10
- RQ-V2-0184: PASS | top_chunk=faq_008_227 | score=9
- RQ-V2-0185: PASS | top_chunk=faq_009_228 | score=7
- RQ-V2-0186: PASS | top_chunk=faq_002_221 | score=5
- RQ-V2-0187: PASS | top_chunk=faq_011_230 | score=15
- RQ-V2-0188: PASS | top_chunk=faq_012_231 | score=8
- RQ-V2-0189: PASS | top_chunk=faq_013_232 | score=10
- RQ-V2-0190: PASS | top_chunk=faq_014_233 | score=7
- RQ-V2-0191: PASS | top_chunk=faq_011_230 | score=6
- RQ-V2-0192: PASS | top_chunk=faq_002_221 | score=6
- RQ-V2-0193: PASS | top_chunk=faq_017_236 | score=8
- RQ-V2-0194: PASS | top_chunk=faq_018_237 | score=9

## Unknown Policy

If the KB does not publish a field, the runtime answer should say `unknown` and offer Aqaar handoff rather than inferring facts.
