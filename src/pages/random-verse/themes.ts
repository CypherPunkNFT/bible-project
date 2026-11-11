// The themes a random verse can be drawn from: well-known single verses on each, chosen by hand and quoted from the
// Berean Standard Bible at run time. Each verse reads on its own (none starts mid-sentence); pick.test.ts checks every
// one exists in the BSB, starts a sentence and is listed once per theme. A verse may sit in more than one theme.
export interface Theme {
  /** Its name in the address (?theme=hope): lower case, words joined by hyphens. */
  id: string;
  title: string;
  /** Verses as BOOK.CHAPTER.VERSE, the BSB's book codes. */
  verses: readonly string[];
}

export const THEMES: readonly Theme[] = [
  { id: "love", title: "Love", verses: ["JHN.3.16", "ROM.5.8", "1CO.13.4", "1CO.13.7", "1CO.13.13", "1JN.4.7", "1JN.4.8", "1JN.4.16", "1JN.4.19", "1JN.3.1", "JHN.15.12", "JHN.15.13", "JHN.13.34", "DEU.6.5", "PSA.136.1", "ZEP.3.17", "JER.31.3", "1PE.4.8", "COL.3.14", "MRK.12.31"] },
  { id: "faith", title: "Faith", verses: ["HEB.11.1", "HEB.11.6", "EPH.2.8", "ROM.10.17", "ROM.1.17", "2CO.5.7", "GAL.2.20", "MRK.11.22", "MAT.17.20", "JAS.2.17", "ROM.5.1", "LUK.17.5", "PRO.3.5"] },
  { id: "hope", title: "Hope", verses: ["ROM.15.13", "JER.29.11", "ROM.5.5", "ROM.8.24", "HEB.6.19", "PSA.42.11", "LAM.3.21", "LAM.3.24", "ISA.40.31", "1PE.1.3", "PSA.62.5", "PSA.130.5", "ROM.12.12", "HEB.10.23", "PSA.33.22"] },
  { id: "peace", title: "Peace", verses: ["JHN.14.27", "PHP.4.7", "ISA.26.3", "JHN.16.33", "ROM.5.1", "PSA.4.8", "COL.3.15", "ROM.8.6", "2TH.3.16", "ISA.9.6", "MAT.5.9", "PSA.29.11", "ROM.12.18", "PSA.119.165"] },
  { id: "joy", title: "Joy", verses: ["NEH.8.10", "PSA.16.11", "PHP.4.4", "PSA.118.24", "JHN.15.11", "ROM.15.13", "GAL.5.22", "PSA.30.5", "1TH.5.16", "JAS.1.2", "PSA.126.3", "ISA.12.3", "LUK.2.10", "PSA.51.12"] },
  { id: "strength", title: "Strength", verses: ["ISA.40.31", "PHP.4.13", "ISA.41.10", "PSA.46.1", "2CO.12.9", "PSA.28.7", "EXO.15.2", "PSA.18.2", "PSA.73.26", "NEH.8.10", "EPH.6.10", "ISA.40.29", "HAB.3.19", "PSA.27.1"] },
  { id: "comfort", title: "Comfort", verses: ["MAT.11.28", "PSA.23.4", "2CO.1.3", "PSA.34.18", "MAT.5.4", "PSA.147.3", "REV.21.4", "ISA.66.13", "JHN.14.1", "ROM.8.28", "PSA.119.50", "ISA.43.2", "DEU.31.8", "PSA.55.22", "1PE.5.7"] },
  { id: "courage", title: "Courage", verses: ["JOS.1.9", "DEU.31.6", "PSA.27.14", "1CO.16.13", "2TI.1.7", "ISA.41.13", "PSA.56.3", "PSA.118.6", "HEB.13.6", "1CH.28.20", "PSA.31.24", "JHN.16.33", "MAT.14.27", "ISA.43.1"] },
  { id: "forgiveness", title: "Forgiveness", verses: ["1JN.1.9", "EPH.4.32", "COL.3.13", "PSA.103.12", "ISA.1.18", "MAT.6.14", "MIC.7.18", "ACT.3.19", "PSA.32.1", "PSA.86.5", "EPH.1.7", "LUK.6.37", "MAT.18.22", "ISA.43.25", "HEB.8.12", "MRK.11.25"] },
  { id: "grace", title: "Grace", verses: ["EPH.2.8", "2CO.12.9", "HEB.4.16", "JHN.1.16", "ROM.6.14", "TIT.2.11", "2CO.8.9", "JAS.4.6", "2PE.3.18", "ROM.5.20", "1PE.5.10", "2TI.1.9"] },
  { id: "wisdom", title: "Wisdom", verses: ["JAS.1.5", "PRO.1.7", "PRO.9.10", "PRO.2.6", "PSA.111.10", "PSA.90.12", "COL.3.16", "JAS.3.17", "PRO.4.7", "PRO.16.16", "ECC.12.13", "MAT.7.24", "1CO.1.25", "PSA.119.105"] },
  { id: "prayer", title: "Prayer", verses: ["PHP.4.6", "1TH.5.17", "MAT.6.6", "MAT.7.7", "JER.33.3", "JAS.5.16", "1JN.5.14", "MRK.11.24", "ROM.8.26", "PSA.145.18", "MAT.6.9", "COL.4.2", "PSA.5.3", "EPH.6.18", "JHN.14.13"] },
  { id: "thankfulness", title: "Thankfulness", verses: ["1TH.5.18", "PSA.100.4", "PSA.107.1", "COL.3.17", "PSA.118.1", "PSA.9.1", "2CO.9.15", "HEB.12.28", "PSA.95.2", "1CH.16.34", "PSA.136.1"] },
  { id: "salvation", title: "Salvation", verses: ["JHN.3.16", "ROM.10.10", "ACT.4.12", "ROM.6.23", "JHN.14.6", "TIT.3.5", "2CO.5.17", "JHN.3.36", "JHN.1.12", "1TI.1.15", "JHN.5.24", "ACT.16.31", "REV.3.20", "JHN.10.28", "1JN.5.13"] },
  { id: "trust", title: "Trust", verses: ["PRO.3.5", "PSA.37.5", "PSA.32.8", "ISA.30.21", "PSA.9.10", "JER.17.7", "PSA.20.7", "PRO.16.9", "ISA.26.4", "NAM.1.7", "PSA.62.8", "PSA.37.3", "PSA.112.7"] },
  { id: "faithfulness", title: "God’s faithfulness", verses: ["LAM.3.22", "LAM.3.23", "DEU.7.9", "1CO.10.13", "PSA.36.5", "1TH.5.24", "PSA.89.1", "NUM.23.19", "HEB.13.8", "ISA.40.8", "JOS.21.45", "PSA.100.5", "2TH.3.3"] },
  { id: "jesus", title: "Who Jesus is", verses: ["JHN.1.1", "JHN.1.14", "JHN.8.12", "JHN.10.11", "JHN.11.25", "COL.1.15", "HEB.1.3", "PHP.2.9", "MAT.16.16", "ISA.53.5", "JHN.10.30", "REV.22.13", "COL.2.9", "1TI.2.5", "MAT.1.21", "LUK.19.10"] },
];
