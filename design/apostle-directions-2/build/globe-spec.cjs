// The globe's arcs (carried over from the first apostle round, where they were reviewed) and its camera views.
// Scripture arcs carry the verses that make the journey; tradition arcs point at the ending.tradition record that
// tells it (trad = index), so the page can show who said it and when. Views: "all" is the opening view; p1..p4 are
// the four periods of the ring (used by "see the map" in the chapters).
const arc = (id, from, to, kind, label, extra = {}) => ({ id, from, to, kind, label, ...extra });
module.exports = {
  "peter-mat-4-18": {
    arcs: [
      arc("s1", "a562fcc", "ab7bf48", "scripture", "Into the coasts of Caesarea Philippi", { refs: [[40016013, 40016013]], period: 2 }),
      arc("s2", "ab7bf48", "a15257a", "scripture", "With Jesus to Jerusalem", { refs: [[41011020, 41011021], [41011027, 41011027]], period: 2 }),
      arc("s3", "a15257a", "a562fcc", "scripture", "Back to the sea of Tiberias", { refs: [[43021001, 43021003]], period: 2 }),
      arc("s4", "a562fcc", "a15257a", "scripture", "Jerusalem, at Pentecost", { refs: [[44002014, 44002014]], period: 3 }),
      arc("s5", "a15257a", "a282dce", "scripture", "Sent with John to Samaria", { refs: [[44008014, 44008014]], period: 3 }),
      arc("s6", "a282dce", "a15257a", "scripture", "Returned to Jerusalem", { refs: [[44008025, 44008025]], period: 3 }),
      arc("s7", "a15257a", "a2c5cc7", "scripture", "Down to the saints at Lydda", { refs: [[44009032, 44009032]], period: 3 }),
      arc("s8", "a2c5cc7", "ae023a9", "scripture", "Sent for to Joppa", { refs: [[44009038, 44009038]], period: 3 }),
      arc("s9", "ae023a9", "a58735e", "scripture", "To Cornelius at Caesarea", { refs: [[44010024, 44010024]], period: 3 }),
      arc("s10", "a58735e", "a15257a", "scripture", "Up to Jerusalem to answer for it", { refs: [[44011002, 44011002]], period: 3 }),
      arc("s11", "a15257a", "ae41ab4", "scripture", "Peter at Antioch (Galatians 2:11)", { refs: [[48002011, 48002011]], period: 3 }),
      arc("t1", "ae41ab4", "a83a43e", "tradition", "Preached in Pontus, Galatia, Bithynia, Cappadocia and Asia", { trad: 8, period: 4 }),
      arc("t2", "a83a43e", "afc8e7a", "tradition", "“At last, having come to Rome”", { trad: 8, period: 4 }),
      arc("t3", "ae41ab4", "afc8e7a", "tradition", "Bishop of Antioch, then Rome “in the second year of Claudius”", { trad: 10, period: 4 }),
    ],
    views: { all: { center: [24, 37], zoom: 1 }, p1: { center: [35.6, 32.85], zoom: 14 }, p2: { center: [35.4, 32.4], zoom: 9 }, p3: { center: [35.4, 33.6], zoom: 5.5 }, p4: { center: [25, 39], zoom: 2 } },
  },
  "paul-act-7-58": {
    arcs: [
      arc("s1", "a666ea0", "a15257a", "scripture", "Brought up in Jerusalem “at the feet of Gamaliel”", { refs: [[44022003, 44022003]], period: 1 }),
      arc("s2", "a15257a", "a69c1d4", "scripture", "To Damascus with letters from the high priest", { refs: [[44009001, 44009003]], period: 2 }),
      arc("s3", "a69c1d4", "a0f4ea8", "scripture", "Into Arabia", { refs: [[48001017, 48001017]], period: 2 }),
      arc("s4", "a0f4ea8", "a69c1d4", "scripture", "Returned again unto Damascus", { refs: [[48001017, 48001017]], period: 2 }),
      arc("s5", "a69c1d4", "a15257a", "scripture", "Up to Jerusalem to see Peter", { refs: [[48001018, 48001018], [44009026, 44009026]], period: 2 }),
      arc("s6", "a15257a", "a666ea0", "scripture", "Sent forth to Tarsus", { refs: [[44009030, 44009030]], period: 2 }),
      arc("s7", "a666ea0", "ae41ab4", "scripture", "Barnabas brings him to Antioch", { refs: [[44011025, 44011026]], period: 3 }),
      arc("s8", "ae41ab4", "a15257a", "scripture", "Up to Jerusalem for the council", { refs: [[44015002, 44015004]], period: 3 }),
      arc("t1", "afc8e7a", "a3f0f69", "tradition", "“The farthest bounds of the West”; the journey to Spain", { trad: 0, also: [2], period: 4 }),
    ],
    journeys: ["journey-1", "journey-2", "journey-3", "voyage-rome"],
    views: { all: { center: [22, 37], zoom: 1 }, p1: { center: [35, 34.2], zoom: 5 }, p2: { center: [35.6, 33.2], zoom: 4.2 }, p3: { center: [25, 37.5], zoom: 2.4 }, p4: { center: [6, 40], zoom: 2.2 } },
  },
  "judas-mat-10-3": {
    arcs: [arc("t1", "a15257a", "ab9696f", "tradition", "Preached with Simon in Persia, where both were killed", { trad: 2, period: 4 })],
    views: { all: { center: [40, 33], zoom: 1 }, p1: { center: [35.3, 31.8], zoom: 6 }, p2: { center: [35.4, 32.4], zoom: 8 }, p3: { center: [35.23, 31.78], zoom: 10 }, p4: { center: [42, 33.5], zoom: 3 } },
  },
};
