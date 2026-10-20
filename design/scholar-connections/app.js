(() => {
  // content/teachers/knowledge-connections/index.json
  var knowledge_connections_default = {
    schemaVersion: 1,
    researchedOn: "2026-10-16",
    purpose: "Research backend for Knowledge, handed on; no UI integration or publication.",
    reviewer: "Codex, AI-assisted research; no human review recorded",
    fields: {
      history: "History",
      texts: "Languages & texts",
      places: "Archaeology & places",
      reference: "Reference works",
      theology: "Theology & philosophy"
    },
    directionConvention: "Earlier/source work -> responding/derivative work. co-publishes is undirected. Sequence in workIds is for display only; edgeIds define actual relationships.",
    authors: [
      {
        id: "author-a9ea0fdf269bb5cd",
        name: "Julius Africanus",
        entityType: "person",
        profileId: null,
        populationId: "field-e2f1ff4f92f6eb9c79bc",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Existing landing/lineage-population.ts editorial mapping"
      },
      {
        id: "author-8b7c728ff6117492",
        name: "Eusebius of Caesarea",
        entityType: "person",
        profileId: "eusebius",
        populationId: "eusebius",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-84c0d888491a2dc9",
        name: "Jerome",
        entityType: "person",
        profileId: "jerome",
        populationId: "jerome",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-24d55f41b8458288",
        name: "Prosper of Aquitaine",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-563340e71b8d0296",
        name: "Victor of Tunnuna",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-1b8c49371d308a5b",
        name: "John of Biclar",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-9a8e158285763a3c",
        name: "Desiderius Erasmus",
        entityType: "person",
        profileId: "erasmus",
        populationId: "erasmus",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-55497d26971913d2",
        name: "William Tyndale",
        entityType: "person",
        profileId: "tyndale",
        populationId: "tyndale",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-c61bf4c561d6fec0",
        name: "John Rogers",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-aef2d3a347da174b",
        name: "Miles Coverdale",
        entityType: "person",
        profileId: null,
        populationId: "field-cc1b266d20d653098521",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Existing landing/lineage-population.ts editorial mapping"
      },
      {
        id: "author-1302c0a0ac304df5",
        name: "Matthew Parker & team",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-7e751d0ce2e517a0",
        name: "King James translators",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-c678fe571b6c877b",
        name: "Revision committees",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-d5aa58bc60781043",
        name: "Sellin & Watzinger",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-25454064f2ad0bcf",
        name: "John Garstang",
        entityType: "person",
        profileId: "john-garstang",
        populationId: "john-garstang",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-baec2b4af18f173f",
        name: "Kathleen Kenyon",
        entityType: "person",
        profileId: "kenyon",
        populationId: "kenyon",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-691d003fe5b71375",
        name: "Bryant G. Wood",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-57354a1521f33cc6",
        name: "Piotr Bienkowski",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "site-credit-2c0a76bb3657107b74ac",
            name: "Piotr Bienkowski"
          }
        ]
      },
      {
        id: "author-1b3cf4d779ea4961",
        name: "Bruins & van der Plicht",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "site-credit-ee18fb949c5e2ac8dedf",
            name: "Bruins & van der Plicht"
          }
        ]
      },
      {
        id: "author-f5f4ed820b4d623a",
        name: "Wilhelm Gesenius",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-147e16592338e351",
        name: "Edward Robinson",
        entityType: "person",
        profileId: "robinson",
        populationId: "robinson",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-89ae77e63de54cb8",
        name: "Brown, Driver & Briggs",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-529b72dbe4048078",
        name: "Hendrickson edition",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-43d715ab3a80904a",
        name: "Anselm of Canterbury",
        entityType: "person",
        profileId: "anselm",
        populationId: "anselm",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-3628a4771b152b31",
        name: "Gaunilo",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-efc742b049c1c315",
        name: "Ren\xE9 Descartes",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-7a3d6fdfa4ab91d8",
        name: "Immanuel Kant",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-2f404eb151868e6e",
        name: "Norman Malcolm",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-e283a528a7d6379d",
        name: "Alvin Plantinga",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-19416e9fd75996f0",
        name: "Socrates Scholasticus",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-3911a076637923d533bf",
            name: "Socrates Scholasticus"
          }
        ]
      },
      {
        id: "author-ccb617a6a5c64a44",
        name: "Rufinus of Aquileia",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-3a2859dbee01d40154e6",
            name: "Rufinus of Aquileia"
          }
        ]
      },
      {
        id: "author-856f01cd9e363e68",
        name: "Sozomen",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-65dc74ebf80d23232d90",
            name: "Sozomen"
          }
        ]
      },
      {
        id: "author-081f1aaf305b29b1",
        name: "Suetonius",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-bb5309e3e76a4a27",
        name: "John Stevens",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-392b1dc81978c172",
        name: "J. A. Giles",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-fc092d25673cbf4f",
        name: "A. M. Sellar",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-30717eb24682381a",
        name: "Flavius Josephus",
        entityType: "person",
        profileId: "josephus",
        populationId: "josephus",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-a76581b61b7c24f1",
        name: "Hegesippus",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-b329e0ac2479f3ea",
        name: "Irenaeus of Lyons",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-4874964b193f82ed",
        name: "Pseudo-Hegesippus",
        entityType: "pseudonymous-credit",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-6951a2a42099781a",
        name: "Lorenzo Valla",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-c535d4bf7bfc1b4c",
        name: "Origen of Alexandria",
        entityType: "person",
        profileId: "origen",
        populationId: "origen",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-accc1434b6e774ac",
        name: "Augustine of Hippo",
        entityType: "person",
        profileId: "augustine",
        populationId: "augustine",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-acbb6740c68c1de6",
        name: "British revision committees",
        entityType: "committee",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-a9f0f07f998038f2",
        name: "American revision committee",
        entityType: "committee",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-f0e0ded5085324cd",
        name: "RSV revision committee",
        entityType: "committee",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-1edf579106420e1d",
        name: "NRSV revision committee",
        entityType: "committee",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-3831061a8c8311fe",
        name: "Douay-Rheims translators",
        entityType: "committee",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-13b0d24d8a62f99f",
        name: "Richard Challoner",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-7efe3b9d1eccbc18",
        name: "Constantin von Tischendorf",
        entityType: "person",
        profileId: "tischendorf",
        populationId: "tischendorf",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-8532197bb0563886",
        name: "B. F. Westcott and F. J. A. Hort",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-661025a9a6fdc0e6",
        name: "Richard Francis Weymouth",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-10a8a38c3d710af5",
        name: "Eberhard Nestle",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-4a2647e2f93df750",
        name: "Didymus the Blind",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-7041867ebdcb962d",
        name: "Flinders Petrie",
        entityType: "person",
        profileId: "flinders-petrie",
        populationId: "flinders-petrie",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-dac9451dce27ad8a",
        name: "Frederick Jones Bliss",
        entityType: "person",
        profileId: "frederick-jones-bliss",
        populationId: "frederick-jones-bliss",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-f8ea13000cc0ac25",
        name: "James Leslie Starkey",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-3a29e218ae82fffb",
        name: "Olga Tufnell",
        entityType: "person",
        profileId: "olga-tufnell",
        populationId: "olga-tufnell",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-1c1cfd678890dc7f",
        name: "David Ussishkin",
        entityType: "person",
        profileId: "david-ussishkin",
        populationId: "david-ussishkin",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-265453e73ea6a082",
        name: "Yigael Yadin and expedition",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-31d9d09db81c1d2f",
        name: "Amnon Ben-Tor and expedition",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-140cf987217e1277",
        name: "Roland de Vaux",
        entityType: "person",
        profileId: "roland-de-vaux",
        populationId: "roland-de-vaux",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-e3e12c7c4f533010",
        name: "Jodi Magness",
        entityType: "person",
        profileId: "jodi-magness",
        populationId: "jodi-magness",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-baec23c8d66e784d",
        name: "Israel Finkelstein",
        entityType: "person",
        profileId: "israel-finkelstein",
        populationId: "israel-finkelstein",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-d9e33fd379829ea3",
        name: "Amihai Mazar",
        entityType: "person",
        profileId: "amihai-mazar",
        populationId: "amihai-mazar",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-76750af3fd0c80cd",
        name: "R. A. S. Macalister and J. Garrow Duncan",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-f734781ad3bba9a2",
        name: "Garth Gilmour",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-c7404dc5d7aac84b",
        name: "Hormuzd Rassam",
        entityType: "person",
        profileId: "hormuzd-rassam",
        populationId: "hormuzd-rassam",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-39c9d8f60de0d29a",
        name: "George Smith",
        entityType: "person",
        profileId: "george-smith-assyriologist",
        populationId: "george-smith-assyriologist",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-aaaea8730e7a75d8",
        name: "Amos Frumkin, Aryeh Shimron and Jeff Rosenbaum",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-e5bddf1afa80fdea",
        name: "Amos Frumkin and Aryeh Shimron",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-7f6e567dfa955170",
        name: "Christian Gottlob Wilke",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-8db3cb97281f26dc",
        name: "Carl Ludwig Wilibald Grimm",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-2c5dc0bee3aae520",
        name: "Joseph Henry Thayer",
        entityType: "person",
        profileId: "thayer",
        populationId: "thayer",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-083d021a581da091",
        name: "Emil Kautzsch",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-ce5e2d4b03b07213",
        name: "A. E. Cowley",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-99f2b598c15ed570",
        name: "Franz Passow",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-22ce953c155c7738",
        name: "Henry George Liddell and Robert Scott",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-1cc5c9e82be7de6f",
        name: "Henry Stuart Jones and Roderick McKenzie",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-e4a3fc047a6633cc",
        name: "Walter Bauer",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-6e961774987dd721",
        name: "W. F. Arndt and F. W. Gingrich",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-96703718537110a0",
        name: "Frederick William Danker",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-f8755953cf156851",
        name: "William Smith and contributors",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-e5066472043f1628",
        name: "H. B. Hackett and Ezra Abbot",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-e9807ba5cd26e43d",
        name: "William Smith, editor",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-a2fb2df66ededcd5",
        name: "John Kitto and contributors",
        entityType: "credited-group",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-6ceef1444155655c",
        name: "William Lindsay Alexander, editor",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-1d9a6918eedc68a2",
        name: "Edwin W. Rice",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-307f1ea11f9a3ade3e67",
            name: "Edwin W Rice"
          }
        ]
      },
      {
        id: "author-24564f442e3b02ad",
        name: "A. R. Fausset",
        entityType: "person",
        profileId: "fausset",
        populationId: "fausset",
        identityStatus: "linked-existing-editorial-identity",
        identityBasis: "Exact curated profile name / explicit editorial alias; existing population profile membership"
      },
      {
        id: "author-2baa1a05d56cece4",
        name: "Celsus",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-6bc613394fd38e9c",
        name: "Pelagius",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-3d7a6d1e02bde232",
        name: "Petilian of Constantine",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-75bbf840c2473828",
        name: "Arius",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-cec87167e73396f0",
        name: "Athanasius of Alexandria",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-20c4bf2eb957d5ad0c6b",
            name: "Athanasius of Alexandria"
          }
        ]
      },
      {
        id: "author-b354309341f8baf9",
        name: "Marcion of Sinope",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-fd6659361bc5633f",
        name: "Tertullian",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-d3b4db3da2e5b0c107c2",
            name: "Tertullian"
          }
        ]
      },
      {
        id: "author-d38f5d24a396e36b",
        name: "Martin Luther",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-0af35b5eb1b3a28516e9",
            name: "Martin Luther"
          }
        ]
      },
      {
        id: "author-6c7e52f36772bd5e",
        name: "Daniel Whitby",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-1ebedfedc2d1edeecd69",
            name: "Daniel Whitby"
          }
        ]
      },
      {
        id: "author-f25f6777a23f3e38",
        name: "Jonathan Edwards",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-f1f9ee4a502006e0a2ca",
            name: "Jonathan Edwards"
          }
        ]
      },
      {
        id: "author-4f858f2f03ee9562",
        name: "Jacopo Sadoleto",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-46e0812614474ca1",
        name: "John Calvin",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: [
          {
            id: "field-1f15dd26064c7c89459f",
            name: "John Calvin"
          }
        ]
      },
      {
        id: "author-db1748fbbf0a4575",
        name: "Antoine Arnauld",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      },
      {
        id: "author-52ac2fcff7bde26b",
        name: "Pierre Gassendi",
        entityType: "person",
        profileId: null,
        populationId: null,
        identityStatus: "unresolved",
        identityBasis: null,
        populationCandidates: []
      }
    ],
    works: [
      {
        id: "work-2e20c3332f38a6fb",
        title: "Chronographiae",
        dateLabel: "c. 221",
        authorIds: [
          "author-a9ea0fdf269bb5cd"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-dcb10ea7742fda39",
        title: "Chronicle",
        dateLabel: "c. 325",
        authorIds: [
          "author-8b7c728ff6117492"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f78d22c37c3d372c",
        title: "Latin Chronicle",
        dateLabel: "c. 380",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-a6f696399d7e6c51",
        title: "Epitome of the Chronicle",
        dateLabel: "c. 455",
        authorIds: [
          "author-24d55f41b8458288"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-aa30841b5d11b04c",
        title: "Chronicle",
        dateLabel: "c. 567",
        authorIds: [
          "author-563340e71b8d0296"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-80e7a320366abab9",
        title: "Chronicle",
        dateLabel: "c. 590",
        authorIds: [
          "author-1b8c49371d308a5b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f507fb5842477fe6",
        title: "Greek New Testament",
        dateLabel: "1516",
        authorIds: [
          "author-9a8e158285763a3c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-96a90e1c5ee80ffe",
        title: "English New Testament",
        dateLabel: "1526",
        authorIds: [
          "author-55497d26971913d2"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-338b6c83f1faba20",
        title: "Matthew's Bible",
        dateLabel: "1537",
        authorIds: [
          "author-c61bf4c561d6fec0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f4eefac2df35c7a8",
        title: "The Great Bible",
        dateLabel: "1539",
        authorIds: [
          "author-aef2d3a347da174b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-296e2268c2f82dea",
        title: "Bishops' Bible",
        dateLabel: "1568",
        authorIds: [
          "author-1302c0a0ac304df5"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-dfaf1be7d6ed1556",
        title: "King James Bible",
        dateLabel: "1611",
        authorIds: [
          "author-7e751d0ce2e517a0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-0155ca28dcde8a2c",
        title: "Revised New Testament",
        dateLabel: "1881",
        authorIds: [
          "author-c678fe571b6c877b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-b19944f4bbb324cc",
        title: "Early excavations",
        dateLabel: "1907-1909",
        authorIds: [
          "author-d5aa58bc60781043"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-711903491337ec29",
        title: "City and necropolis",
        dateLabel: "1930-1936",
        authorIds: [
          "author-25454064f2ad0bcf"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-22966771fbf19303",
        title: "New stratigraphic study",
        dateLabel: "1952-1958",
        authorIds: [
          "author-baec2b4af18f173f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c9cf92c9b23d17e2",
        title: "Did the Israelites Conquer Jericho?",
        dateLabel: "1990",
        authorIds: [
          "author-691d003fe5b71375"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-d2387859fd6705ba",
        title: "A Middle Bronze destruction",
        dateLabel: "1990",
        authorIds: [
          "author-57354a1521f33cc6"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-48bb008adf05d4e4",
        title: "Reply to Bienkowski",
        dateLabel: "1990",
        authorIds: [
          "author-691d003fe5b71375"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7fba94d84b46ea89",
        title: "Radiocarbon results",
        dateLabel: "1995",
        authorIds: [
          "author-1b3cf4d779ea4961"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-e78f0fe09c46661a",
        title: "Hebrew-German lexicon",
        dateLabel: "1810-1812",
        authorIds: [
          "author-f5f4ed820b4d623a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-efbbd81af18f647a",
        title: "Latin Lexicon Manuale",
        dateLabel: "1833",
        authorIds: [
          "author-f5f4ed820b4d623a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-037343216ee3b192",
        title: "English translation",
        dateLabel: "1836",
        authorIds: [
          "author-147e16592338e351"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-9325f69ca2b5c8fc",
        title: "Revised English lexicon",
        dateLabel: "1854",
        authorIds: [
          "author-147e16592338e351"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-bbb1e68f8a1ee3c6",
        title: "Hebrew & English Lexicon",
        dateLabel: "1906",
        authorIds: [
          "author-89ae77e63de54cb8"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-09c57988a3929b29",
        title: "BDB with Strong's numbers",
        dateLabel: "1996",
        authorIds: [
          "author-529b72dbe4048078"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-e5dd1dac1e27781b",
        title: "Proslogion",
        dateLabel: "1077-1078",
        authorIds: [
          "author-43d715ab3a80904a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3165c2e4fa335039",
        title: "On Behalf of the Fool",
        dateLabel: "c. 1079",
        authorIds: [
          "author-3628a4771b152b31"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-866b85d962dab651",
        title: "Reply to Gaunilo",
        dateLabel: "c. 1080",
        authorIds: [
          "author-43d715ab3a80904a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c75d8623a9cefcd1",
        title: "Fifth Meditation",
        dateLabel: "1641",
        authorIds: [
          "author-efc742b049c1c315"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4994d18cc4d0657a",
        title: "Critique of Pure Reason",
        dateLabel: "1781",
        authorIds: [
          "author-7a3d6fdfa4ab91d8"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-28e89b68dfbd3ff8",
        title: "Anselm's Ontological Arguments",
        dateLabel: "1960",
        authorIds: [
          "author-2f404eb151868e6e"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-6cc99d0074a7f7a1",
        title: "The Nature of Necessity",
        dateLabel: "1974",
        authorIds: [
          "author-e283a528a7d6379d"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-eafafc4ebed9de3a",
        title: "Church History",
        dateLabel: "c. 325",
        authorIds: [
          "author-8b7c728ff6117492"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "site-source-c61e15cb6d613686",
            canonicalWorkId: null,
            title: "Church History",
            matchBasis: "exact-title-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-c61e15cb6d613686",
                title: "Church History",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-e8ce85c7652d8b94",
            canonicalWorkId: null,
            title: "Church History",
            matchBasis: "exact-title-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-e8ce85c7652d8b94",
                title: "Church History",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-4c2d85237dc5da89",
            canonicalWorkId: null,
            title: "Church History (Nicene and Post-Nicene Fathers, series 2, vol. 1)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-4c2d85237dc5da89",
                title: "Church History (Nicene and Post-Nicene Fathers, series 2, vol. 1)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-8c4f8ce95ccaec49",
            canonicalWorkId: null,
            title: "Church History (Nicene and Post-Nicene Fathers, series 2, vol. 1)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-8c4f8ce95ccaec49",
                title: "Church History (Nicene and Post-Nicene Fathers, series 2, vol. 1)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-29bb8c970df1b466",
            canonicalWorkId: null,
            title: "Church History, Book 3",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-29bb8c970df1b466",
                title: "Church History, Book 3",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-bc2e27e922c6bf34",
            canonicalWorkId: null,
            title: "Church History, Book 6",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-bc2e27e922c6bf34",
                title: "Church History, Book 6",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-79d7f8833cb7e41f",
            canonicalWorkId: null,
            title: "Church History, Book 7",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-79d7f8833cb7e41f",
                title: "Church History, Book 7",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-94ae3d77c4020551",
            canonicalWorkId: null,
            title: "Church History, Book III",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-94ae3d77c4020551",
                title: "Church History, Book III",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-20bf222c84acafea",
            canonicalWorkId: null,
            title: "Church History, Book V",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-20bf222c84acafea",
                title: "Church History, Book V",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-aeea4f68e84a62b8",
            canonicalWorkId: null,
            title: "Church History, Book VI",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-aeea4f68e84a62b8",
                title: "Church History, Book VI",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-411e124202016819",
            canonicalWorkId: null,
            title: "Church History, book 1 (NPNF Second Series, vol. 1)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-411e124202016819",
                title: "Church History, book 1 (NPNF Second Series, vol. 1)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-8f510d5d7b4018ed",
            canonicalWorkId: null,
            title: "Church History, book 2 (NPNF Second Series, vol. 1)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-8f510d5d7b4018ed",
                title: "Church History, book 2 (NPNF Second Series, vol. 1)",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c7d17abf2a5f2b71",
        title: "Ecclesiastical History",
        dateLabel: "c. 439",
        authorIds: [
          "author-19416e9fd75996f0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7809a438de70288f",
        title: "Ecclesiastical History",
        dateLabel: "c. 402",
        authorIds: [
          "author-ccb617a6a5c64a44"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-a8f78e88d30b2d2b",
        title: "Ecclesiastical History, revised books I-II",
        dateLabel: "c. 439",
        authorIds: [
          "author-19416e9fd75996f0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-a2c87ded5d46df8b",
        title: "Ecclesiastical History",
        dateLabel: "fifth century",
        authorIds: [
          "author-856f01cd9e363e68"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-596f880e70973cc1",
        title: "On Illustrious Men",
        dateLabel: "second century",
        authorIds: [
          "author-081f1aaf305b29b1"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-e9c64212d3bec0c6",
        title: "On Illustrious Men",
        dateLabel: "392-393",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "site-source-2d23ca70fe05cc01",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-2d23ca70fe05cc01",
                title: "Lives of Illustrious Men",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-7903376afe5608d8",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-7903376afe5608d8",
                title: "Lives of Illustrious Men",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-a6a1261aef3ef57c",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-a6a1261aef3ef57c",
                title: "Lives of Illustrious Men",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-8425c9302f183108",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men (De Viris Illustribus)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-8425c9302f183108",
                title: "Lives of Illustrious Men (De Viris Illustribus)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-91c24df46fc5fedc",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men (NPNF Second Series, vol. 3)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-91c24df46fc5fedc",
                title: "Lives of Illustrious Men (NPNF Second Series, vol. 3)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-e932d34ecfc4d542",
            canonicalWorkId: null,
            title: "Lives of Illustrious Men (NPNF Second Series, vol. 3)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-e932d34ecfc4d542",
                title: "Lives of Illustrious Men (NPNF Second Series, vol. 3)",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c95813891bb09a24",
        title: "Bede: Ecclesiastical History, English translation",
        dateLabel: "1723",
        authorIds: [
          "author-bb5309e3e76a4a27"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4f3ab2b9ddaa8a6b",
        title: "Bede: Ecclesiastical History, revised translation",
        dateLabel: "1842",
        authorIds: [
          "author-392b1dc81978c172"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7d1c58f8ed5a7770",
        title: "Bede: Ecclesiastical History, revised translation",
        dateLabel: "1907",
        authorIds: [
          "author-fc092d25673cbf4f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c57cf8bf769ec535",
        title: "Antiquities of the Jews, book XVIII",
        dateLabel: "93-94",
        authorIds: [
          "author-30717eb24682381a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "held-0be72072850277fd962361db53da9914",
            canonicalWorkId: null,
            title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-0be72072850277fd962361db53da9914",
                title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-477dee365e327911945cfd9692251ea4",
            canonicalWorkId: null,
            title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-477dee365e327911945cfd9692251ea4",
                title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-92643e9ce36031db90f2da92900ed6c8",
            canonicalWorkId: null,
            title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-92643e9ce36031db90f2da92900ed6c8",
                title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-c9b01a1e4db493c0a0195ed55fd5e57a",
            canonicalWorkId: null,
            title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-c9b01a1e4db493c0a0195ed55fd5e57a",
                title: "Complete works of Josephus. Antiquities of the Jews; The wars of the Jews against Apion, etc., ..",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-02f1622dc426266a097abb347369fbb8",
            canonicalWorkId: null,
            title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-02f1622dc426266a097abb347369fbb8",
                title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-25a1f4f8c81bc3d3b4bf6252d6838826",
            canonicalWorkId: null,
            title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-25a1f4f8c81bc3d3b4bf6252d6838826",
                title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-e7ea378aa0accc978a0a376e069de63f",
            canonicalWorkId: null,
            title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-e7ea378aa0accc978a0a376e069de63f",
                title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-f7dde39a006298c2780e85ac67cc9ff1",
            canonicalWorkId: null,
            title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-f7dde39a006298c2780e85ac67cc9ff1",
                title: "Complete works of Josephus; Antiquities of the Jews, The wars of the Jews, Against Apion, etc. etc",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-daad9e503594f9c33bdf4af9e8561c29",
            canonicalWorkId: null,
            title: "Our young folks' Josephus. The Antiquities of the Jews and the Jewish Wars of Flavius Josephus",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-daad9e503594f9c33bdf4af9e8561c29",
                title: "Our young folks' Josephus. The Antiquities of the Jews and the Jewish Wars of Flavius Josephus",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-47a015a3a0844b58976a25a2876080f9",
            canonicalWorkId: null,
            title: "The complete works of Flavius-Josephus : the celebrated Jewish historian ; comprising the history and antiquities of the Jews, with the destruction of Jerusalem by the Romans, and dissertations concerning Jesus Christ, John the Baptist, James the Just, and the sacrifice of Isaac, together with a discourse on Hades, or Hell, with his autobiography",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-47a015a3a0844b58976a25a2876080f9",
                title: "The complete works of Flavius-Josephus : the celebrated Jewish historian ; comprising the history and antiquities of the Jews, with the destruction of Jerusalem by the Romans, and dissertations concerning Jesus Christ, John the Baptist, James the Just, and the sacrifice of Isaac, together with a discourse on Hades, or Hell, with his autobiography",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-8add18edeef518a8afe0bb31ee799de7",
            canonicalWorkId: null,
            title: "The complete works of Flavius-Josephus: comprising the antiquities of the Jews, a history of Jewish wars, and life of Flavius Josephus, written by himself",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-8add18edeef518a8afe0bb31ee799de7",
                title: "The complete works of Flavius-Josephus: comprising the antiquities of the Jews, a history of Jewish wars, and life of Flavius Josephus, written by himself",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-01b861c67e23b43b58c2585168ebfde4",
            canonicalWorkId: null,
            title: "The complete works of the learned and authentic Jewish historian, Flavius Josephus: comprising The antiquities of the Jews, A history of the Jewish wars, three dissertations concerning Jesus Christ, John the Baptist, &c., &c., and The life of Josephus written by himself",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-01b861c67e23b43b58c2585168ebfde4",
                title: "The complete works of the learned and authentic Jewish historian, Flavius Josephus: comprising The antiquities of the Jews, A history of the Jewish wars, three dissertations concerning Jesus Christ, John the Baptist, &c., &c., and The life of Josephus written by himself",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-29e81cad240d44e9",
        title: "Memoirs",
        dateLabel: "second century",
        authorIds: [
          "author-a76581b61b7c24f1"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-8fb3dc447d5e2c70",
        title: "Letter to Florinus",
        dateLabel: "second century",
        authorIds: [
          "author-b329e0ac2479f3ea"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3c773443ebc0b0e1",
        title: "The Jewish War",
        dateLabel: "c. 75",
        authorIds: [
          "author-30717eb24682381a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "held-15b1ae6b7aea53c738e43fa6538b9f16",
            canonicalWorkId: null,
            title: "The Jewish war of Flavius Josephus : with his autobiography",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-15b1ae6b7aea53c738e43fa6538b9f16",
                title: "The Jewish war of Flavius Josephus : with his autobiography",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-65de211e7d15bb7925c9be92f9ea5baa",
            canonicalWorkId: null,
            title: "The genuine works of Flavius Josephus ... containing twenty books of the Jewish antiquities, seven books of the Jewish war, two books in answer to Apion, the martyrdom of the Maccabees, and the Life of Josephus, written by himself",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-65de211e7d15bb7925c9be92f9ea5baa",
                title: "The genuine works of Flavius Josephus ... containing twenty books of the Jewish antiquities, seven books of the Jewish war, two books in answer to Apion, the martyrdom of the Maccabees, and the Life of Josephus, written by himself",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-73d79f47c294159e1c1ad6a11eb4f7c9",
            canonicalWorkId: null,
            title: "The genuine works of Flavius Josephus, the Jewish historian : containing twenty books of the Jewish antiquities, seven books of the Jewish war, and the life of Josephus",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-73d79f47c294159e1c1ad6a11eb4f7c9",
                title: "The genuine works of Flavius Josephus, the Jewish historian : containing twenty books of the Jewish antiquities, seven books of the Jewish war, and the life of Josephus",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-2d3730cdb4d5d9990dfd688af1cf851c",
            canonicalWorkId: null,
            title: "The genuine works of Flavius Josephus, the Jewish historian : containing twenty books of the Jewish antiquities, seven books of the Jewish war, two books in answer to Apion, the martyrdom of the Maccabees, and the life of Josephus, written by himself",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-2d3730cdb4d5d9990dfd688af1cf851c",
                title: "The genuine works of Flavius Josephus, the Jewish historian : containing twenty books of the Jewish antiquities, seven books of the Jewish war, two books in answer to Apion, the martyrdom of the Maccabees, and the life of Josephus, written by himself",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-0eb57463fc414d14365e3f3e414c0305",
            canonicalWorkId: null,
            title: "The genuine works of Flavius Josephus, the Jewish historian: containing the twenty books of the Jewish antiquities, seven books of the Jewish war, and the life of Josephus, written by himself. Translated from the original Greek, according to Havercamp's accurate edition. Together with explanatory notes and observations",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-0eb57463fc414d14365e3f3e414c0305",
                title: "The genuine works of Flavius Josephus, the Jewish historian: containing the twenty books of the Jewish antiquities, seven books of the Jewish war, and the life of Josephus, written by himself. Translated from the original Greek, according to Havercamp's accurate edition. Together with explanatory notes and observations",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-17f1a236a9986a7161f9f78333ea8152",
            canonicalWorkId: null,
            title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-17f1a236a9986a7161f9f78333ea8152",
                title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-432ddf1f2751c7a00e30f3893c351ef5",
            canonicalWorkId: null,
            title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-432ddf1f2751c7a00e30f3893c351ef5",
                title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-64f9e783475e4bab82b83d387763b185",
            canonicalWorkId: null,
            title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-64f9e783475e4bab82b83d387763b185",
                title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-aeeae6cbe3b0812c00cbd7ade9f87db8",
            canonicalWorkId: null,
            title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-aeeae6cbe3b0812c00cbd7ade9f87db8",
                title: "The whole genuine works of Flavius Josephus, the learned and authentic Jewish historian, and celebrated warrior. : Translated from the original Greek, according to Havercamp's accurate edition Containing: I. Twenty books of the Jewsih antiquites; with the life of Josephus, written by himself. II. Seven books of the Jewish war. III. Two books against Apion. IV. An extract out of Josephus' Exhortation to the Greeks, concerning Hades and the resurrection of the dead, Together with large notes, proper observations, and an index. To which are added, three dissertations, concerning, I. The testimonies of Josephus vindicated. II. God's command to Abraham to offer up Isaac, his son, for a sacrifice. III. Tacitus' accounts of the Jewish nation and of the particulars of the last Jewish war. With a complete table of the Jewish coins, weights, and measures",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-47f99b8e0ec2a8c6df16f1963141acac",
            canonicalWorkId: null,
            title: "The works of Flavius Josephus ... : containing ... the Jewish antiquities ... the Jewish war, and the Life of Josephus ...",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-47f99b8e0ec2a8c6df16f1963141acac",
                title: "The works of Flavius Josephus ... : containing ... the Jewish antiquities ... the Jewish war, and the Life of Josephus ...",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-dc6d946269874b08fe0c657ac862dfee",
            canonicalWorkId: null,
            title: "The works of Flavius Josephus ... : containing ... the Jewish antiquities ... the Jewish war, and the Life of Josephus ...",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-dc6d946269874b08fe0c657ac862dfee",
                title: "The works of Flavius Josephus ... : containing ... the Jewish antiquities ... the Jewish war, and the Life of Josephus ...",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-3eab90ff1b6214d84fd24d595fbd7497",
            canonicalWorkId: null,
            title: "The works of Flavius Josephus ... containing twenty books of the Jewish antiquities, seven books of the Jewish war, and the Life of Josephus",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-3eab90ff1b6214d84fd24d595fbd7497",
                title: "The works of Flavius Josephus ... containing twenty books of the Jewish antiquities, seven books of the Jewish war, and the Life of Josephus",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-490e3f1e706ba885",
        title: "On the Destruction of Jerusalem",
        dateLabel: "c. 370-375",
        authorIds: [
          "author-4874964b193f82ed"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-458198bf6efcfd28",
        title: "Annotations on the New Testament",
        dateLabel: "fifteenth century",
        authorIds: [
          "author-6951a2a42099781a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-0fc92e1207526e65",
        title: "Annotations on the New Testament",
        dateLabel: "1516",
        authorIds: [
          "author-9a8e158285763a3c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-71988cfb9af66732",
        title: "Homilies on Luke",
        dateLabel: "third century",
        authorIds: [
          "author-c535d4bf7bfc1b4c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-51d8ea4c74d19bc1",
        title: "Latin translation of Origen Homilies on Luke",
        dateLabel: "c. 389",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-b2b5f14d246e6453",
        title: "On First Principles",
        dateLabel: "third century",
        authorIds: [
          "author-c535d4bf7bfc1b4c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "site-source-c0cc952a2246450a",
            canonicalWorkId: null,
            title: "De Principiis (On First Principles), book 3 (Ante-Nicene Fathers, vol. 4)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-c0cc952a2246450a",
                title: "De Principiis (On First Principles), book 3 (Ante-Nicene Fathers, vol. 4)",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-50a897a2f2c1d334",
        title: "On First Principles, Latin translation",
        dateLabel: "398",
        authorIds: [
          "author-ccb617a6a5c64a44"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c6da76c1e4272530",
        title: "Apology Against Rufinus",
        dateLabel: "c. 402",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-897c6a7ad5977e00",
        title: "Jonah, Latin translation from Hebrew",
        dateLabel: "late fourth century",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-fbb47e4f4854be4c",
        title: "Letter 71 to Jerome",
        dateLabel: "403",
        authorIds: [
          "author-accc1434b6e774ac"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-88bf27fcd3c0ab0d",
        title: "Letter 112 to Augustine",
        dateLabel: "404",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7001e7533c226fe9",
        title: "Revised Version",
        dateLabel: "1881-1885",
        authorIds: [
          "author-acbb6740c68c1de6"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7ad164c16e8b8f75",
        title: "American Standard Version",
        dateLabel: "1901",
        authorIds: [
          "author-a9f0f07f998038f2"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-1c069d3f3bd5e8c9",
        title: "Revised Standard Version",
        dateLabel: "1946-1952",
        authorIds: [
          "author-f0e0ded5085324cd"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-0a1f8d48d5f1bf20",
        title: "New Revised Standard Version",
        dateLabel: "1989",
        authorIds: [
          "author-1edf579106420e1d"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-1829420b581fa77d",
        title: "Douay-Rheims Bible",
        dateLabel: "1582; 1609-1610",
        authorIds: [
          "author-3831061a8c8311fe"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-fece6d95d62510b3",
        title: "Douay-Rheims revision",
        dateLabel: "1749-1752",
        authorIds: [
          "author-13b0d24d8a62f99f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-648b904fca989042",
        title: "Novum Testamentum Graece, eighth edition",
        dateLabel: "1869-1872",
        authorIds: [
          "author-7efe3b9d1eccbc18"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-2fef99cd0a116e7e",
        title: "New Testament in the Original Greek",
        dateLabel: "1881",
        authorIds: [
          "author-8532197bb0563886"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f32456a5547d551f",
        title: "Resultant Greek Testament",
        dateLabel: "1886",
        authorIds: [
          "author-661025a9a6fdc0e6"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c358f2f33e0ee74b",
        title: "Novum Testamentum Graece",
        dateLabel: "1898",
        authorIds: [
          "author-10a8a38c3d710af5"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-554b70d2a08ec4fc",
        title: "On the Holy Spirit",
        dateLabel: "fourth century",
        authorIds: [
          "author-4a2647e2f93df750"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-5a0571ec9c48f9f0",
        title: "On the Holy Spirit, Latin translation",
        dateLabel: "fourth century",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4b5a5f476049be88",
        title: "Church History, Latin translation and continuation",
        dateLabel: "c. 402",
        authorIds: [
          "author-ccb617a6a5c64a44"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f4be53ed63dc0e8b",
        title: "Tell el-Hesy",
        dateLabel: "1891",
        authorIds: [
          "author-7041867ebdcb962d"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-304b5cb44b79bfd9",
        title: "A Mound of Many Cities",
        dateLabel: "1894",
        authorIds: [
          "author-dac9451dce27ad8a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-ce4430be1163ea6b",
        title: "Lachish excavation records",
        dateLabel: "1932-1938",
        authorIds: [
          "author-f8ea13000cc0ac25"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-d8e9d732e56053b9",
        title: "Lachish final reports",
        dateLabel: "1940-1958",
        authorIds: [
          "author-3a29e218ae82fffb"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-series",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f0b637fea48f2f29",
        title: "Renewed Archaeological Excavations at Lachish",
        dateLabel: "2004",
        authorIds: [
          "author-1c1cfd678890dc7f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3b6628f903a382ee",
        title: "Hazor excavation reports",
        dateLabel: "1958-1961",
        authorIds: [
          "author-265453e73ea6a082"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-series",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-5250a84a750b88d0",
        title: "Hazor renewed excavation reports",
        dateLabel: "1997 onward",
        authorIds: [
          "author-31d9d09db81c1d2f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-series",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c39dce90c9488d72",
        title: "Archaeology and the Dead Sea Scrolls",
        dateLabel: "1973",
        authorIds: [
          "author-140cf987217e1277"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3f4bf291dfae4131",
        title: "The Archaeology of Qumran and the Dead Sea Scrolls, second edition",
        dateLabel: "2021",
        authorIds: [
          "author-e3e12c7c4f533010"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-5eef4f9ac415aaab",
        title: "Low Chronology proposals",
        dateLabel: "1995-1996",
        authorIds: [
          "author-baec23c8d66e784d"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-series",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3747107d4a3ac823",
        title: "Responses and modified chronology",
        dateLabel: "1997-2005",
        authorIds: [
          "author-d9e33fd379829ea3"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-series",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-9220a903ad9a9c04",
        title: "Ophel excavation report",
        dateLabel: "1926",
        authorIds: [
          "author-76750af3fd0c80cd"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-8ab328425ca07abe",
        title: "Final Report of Excavations on the Hill of the Ophel, 1923-1925",
        dateLabel: "2024",
        authorIds: [
          "author-f734781ad3bba9a2"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-fbd11bfe98ba87cc",
        title: "Nineveh excavation: tablet K.3375",
        dateLabel: "1853",
        authorIds: [
          "author-c7404dc5d7aac84b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "excavation-record",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4aeb91e014e8534b",
        title: "The Chaldean Account of the Deluge",
        dateLabel: "1873",
        authorIds: [
          "author-39c9d8f60de0d29a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-8cfe721fdfb899ad",
        title: "Onomasticon",
        dateLabel: "fourth century",
        authorIds: [
          "author-8b7c728ff6117492"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "held-5aebdf2b9c83c4d8c570e11bc84fdd04",
            canonicalWorkId: null,
            title: "Onomasticon",
            matchBasis: "exact-title-candidate",
            editionIds: [],
            records: [
              {
                id: "held-5aebdf2b9c83c4d8c570e11bc84fdd04",
                title: "Onomasticon",
                publicReadable: true,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "held-7a02be14a707e4becf782da0ba07f5cb",
            canonicalWorkId: null,
            title: "Onomasticon",
            matchBasis: "exact-title-candidate",
            editionIds: [],
            records: [
              {
                id: "held-7a02be14a707e4becf782da0ba07f5cb",
                title: "Onomasticon",
                publicReadable: true,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-bf139d3c05d2c562",
        title: "Book on the Sites and Names of Hebrew Places",
        dateLabel: "c. 388",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-6f8de51416dc3d17",
        title: "Radiometric dating of the Siloam Tunnel, Jerusalem",
        dateLabel: "2003",
        authorIds: [
          "author-aaaea8730e7a75d8"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-1a805f6351c78162",
        title: "Tunnel engineering in the Iron Age",
        dateLabel: "2006",
        authorIds: [
          "author-e5bddf1afa80fdea"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-b7fb8d9339e07f00",
        title: "Clavis Novi Testamenti",
        dateLabel: "1841",
        authorIds: [
          "author-7f6e567dfa955170"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-6a8073ba2cf0d84e",
        title: "Clavis Novi Testamenti, revised lexicon",
        dateLabel: "1868",
        authorIds: [
          "author-8db3cb97281f26dc"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3ba3566c0df38b10",
        title: "Greek-English Lexicon of the New Testament",
        dateLabel: "1889",
        authorIds: [
          "author-2c5dc0bee3aae520"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-00e8d237d68e3e19",
        title: "Hebrew Grammar",
        dateLabel: "nineteenth century",
        authorIds: [
          "author-f5f4ed820b4d623a"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-ec107d6d116065a5",
        title: "Gesenius Hebrew Grammar, German revision",
        dateLabel: "1909",
        authorIds: [
          "author-083d021a581da091"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-9249d56566c085d3",
        title: "Gesenius Hebrew Grammar, English edition",
        dateLabel: "1910",
        authorIds: [
          "author-ce5e2d4b03b07213"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-00e4878d60509f28",
        title: "Greek-German lexicon",
        dateLabel: "nineteenth century",
        authorIds: [
          "author-99f2b598c15ed570"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-102f5488c54b1859",
        title: "A Greek-English Lexicon",
        dateLabel: "1843",
        authorIds: [
          "author-22ce953c155c7738"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-e70e914684e90c05",
        title: "A Greek-English Lexicon, ninth-edition revision",
        dateLabel: "1925-1940",
        authorIds: [
          "author-1cc5c9e82be7de6f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-64ecf0dbf7df0ec5",
        title: "Greek-German New Testament dictionary",
        dateLabel: "twentieth century",
        authorIds: [
          "author-e4a3fc047a6633cc"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-d4ac277c0eb17a8e",
        title: "A Greek-English Lexicon of the New Testament",
        dateLabel: "1957",
        authorIds: [
          "author-6e961774987dd721"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-ce8c1503dc859443",
        title: "A Greek-English Lexicon of the New Testament, third edition",
        dateLabel: "2000",
        authorIds: [
          "author-96703718537110a0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-135fb63c64ae1504",
        title: "A Dictionary of the Bible",
        dateLabel: "1860-1863",
        authorIds: [
          "author-f8755953cf156851"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3176c3b6f7a8d4c7",
        title: "Dictionary of the Bible, American revision",
        dateLabel: "1868-1870",
        authorIds: [
          "author-e5066472043f1628"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-f53e6c3536ffc874",
        title: "A Concise Dictionary of the Bible",
        dateLabel: "1865",
        authorIds: [
          "author-e9807ba5cd26e43d"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-2aa9ccdfa770791d",
        title: "Cyclopaedia of Biblical Literature",
        dateLabel: "1845",
        authorIds: [
          "author-a2fb2df66ededcd5"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4224420ef2b5747c",
        title: "Cyclopaedia of Biblical Literature, later edition",
        dateLabel: "1866",
        authorIds: [
          "author-6ceef1444155655c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-16ab10feacfa9aa2",
        title: "Peoples Dictionary of the Bible",
        dateLabel: "1893",
        authorIds: [
          "author-1d9a6918eedc68a2"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c6433633269f4396",
        title: "Bible dictionary",
        dateLabel: "nineteenth century",
        authorIds: [
          "author-24564f442e3b02ad"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4ae0796baade6892",
        title: "Book of Hebrew Names",
        dateLabel: "third century",
        authorIds: [
          "author-c535d4bf7bfc1b4c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7f085937d26aca66",
        title: "Book of Hebrew Names",
        dateLabel: "c. 388",
        authorIds: [
          "author-84c0d888491a2dc9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-3f354fcbc8085577",
        title: "A True Discourse",
        dateLabel: "second century",
        authorIds: [
          "author-2baa1a05d56cece4"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c0a61d5c25a7597d",
        title: "Against Celsus",
        dateLabel: "c. 248",
        authorIds: [
          "author-c535d4bf7bfc1b4c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "site-source-a95166acb1e50a71",
            canonicalWorkId: null,
            title: "Against Celsus, book 1 (Ante-Nicene Fathers, vol. 4)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-a95166acb1e50a71",
                title: "Against Celsus, book 1 (Ante-Nicene Fathers, vol. 4)",
                publicReadable: false,
                localReadable: false
              }
            ]
          },
          {
            populationWorkId: "site-source-d770b375a7741af6",
            canonicalWorkId: null,
            title: "Against Celsus, book 1 (Ante-Nicene Fathers, vol. 4)",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "site-source-d770b375a7741af6",
                title: "Against Celsus, book 1 (Ante-Nicene Fathers, vol. 4)",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-21f3f6ab3f7cdb97",
        title: "On Nature",
        dateLabel: "c. 414",
        authorIds: [
          "author-6bc613394fd38e9c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-a698e62c3fd3ce46",
        title: "On Nature and Grace",
        dateLabel: "415",
        authorIds: [
          "author-accc1434b6e774ac"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "candidates-need-edition-review",
        recordKind: "work-or-edition",
        libraryCandidates: [
          {
            populationWorkId: "held-5137eb4aad739d8511332a7bef79e3de",
            canonicalWorkId: null,
            title: "A Treatise on Nature and Grace, Against Pelagius",
            matchBasis: "title-token-candidate",
            editionIds: [],
            records: [
              {
                id: "held-5137eb4aad739d8511332a7bef79e3de",
                title: "A Treatise on Nature and Grace, Against Pelagius",
                publicReadable: false,
                localReadable: false
              }
            ]
          }
        ],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-7baf5a0722e5da21",
        title: "Letter against the Catholics",
        dateLabel: "c. 400",
        authorIds: [
          "author-3d7a6d1e02bde232"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-2acb2a6cecf8513a",
        title: "Answer to Petilian, book I",
        dateLabel: "c. 400",
        authorIds: [
          "author-accc1434b6e774ac"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-8dbfe03be65e2bf2",
        title: "Answer to Petilian, book II",
        dateLabel: "c. 401",
        authorIds: [
          "author-accc1434b6e774ac"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-6eb4e5db13a2a701",
        title: "Thalia",
        dateLabel: "fourth century",
        authorIds: [
          "author-75bbf840c2473828"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c6a383533150ddec",
        title: "Discourses Against the Arians, I",
        dateLabel: "fourth century",
        authorIds: [
          "author-cec87167e73396f0"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-9bab64f1632deab9",
        title: "Antitheses",
        dateLabel: "second century",
        authorIds: [
          "author-b354309341f8baf9"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-0697c54ba12d98a4",
        title: "Against Marcion, book IV",
        dateLabel: "early third century",
        authorIds: [
          "author-fd6659361bc5633f"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-78bb0f06a99d7c36",
        title: "On Free Will (Diatribe)",
        dateLabel: "1524",
        authorIds: [
          "author-9a8e158285763a3c"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4affb7c66533df45",
        title: "On the Bondage of the Will",
        dateLabel: "1525",
        authorIds: [
          "author-d38f5d24a396e36b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-b163b16a52915dd3",
        title: "Discourse on the Five Points",
        dateLabel: "1710",
        authorIds: [
          "author-6c7e52f36772bd5e"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-c8fa0ec8f97519ef",
        title: "Freedom of the Will",
        dateLabel: "1754",
        authorIds: [
          "author-f25f6777a23f3e38"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-87e3d10e6f071e53",
        title: "Letter to the Genevans",
        dateLabel: "1539",
        authorIds: [
          "author-4f858f2f03ee9562"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-5d31d7e23fc8a2a4",
        title: "Reply to Sadoleto",
        dateLabel: "1539",
        authorIds: [
          "author-46e0812614474ca1"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-4423bf6c4bc99cf1",
        title: "Meditations on First Philosophy",
        dateLabel: "1641",
        authorIds: [
          "author-efc742b049c1c315"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-d87190d278a9ac25",
        title: "Fourth Set of Objections",
        dateLabel: "1641",
        authorIds: [
          "author-db1748fbbf0a4575"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-1a5393ecad5516b0",
        title: "Replies to the Fourth Set of Objections",
        dateLabel: "1641",
        authorIds: [
          "author-efc742b049c1c315"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-24d5b0a29bfae6ff",
        title: "Fifth Set of Objections",
        dateLabel: "1641",
        authorIds: [
          "author-52ac2fcff7bde26b"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      },
      {
        id: "work-d43294147c7f9699",
        title: "Replies to the Fifth Set of Objections",
        dateLabel: "1641",
        authorIds: [
          "author-efc742b049c1c315"
        ],
        libraryRecordId: null,
        libraryMatchStatus: "no-candidate-in-linked-shelf",
        recordKind: "work-or-edition",
        libraryCandidates: [],
        dateReviewStatus: "display-label-not-independently-verified-for-every-edition"
      }
    ],
    connections: [
      {
        id: "edge-139f328f98de7818",
        fromWorkId: "work-2e20c3332f38a6fb",
        toWorkId: "work-dcb10ea7742fda39",
        relationship: "uses-source",
        claim: "Eusebius draws on Africanus and other predecessors, arranging the histories of different peoples into a comparative chronology. This is a documented use of sources, not a teacher-student relationship.",
        evidence: [
          {
            sourceId: "baseline-387e4a7755d7d7d8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-cc8581a50bc64992",
        fromWorkId: "work-dcb10ea7742fda39",
        toWorkId: "work-f78d22c37c3d372c",
        relationship: "translates-and-extends",
        claim: "Jerome translates Eusebius into Latin, adds material on Roman history and continues the account to 378. His preface explains his dual role as translator and author.",
        evidence: [
          {
            sourceId: "baseline-387e4a7755d7d7d8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-26051d9870c597b9",
        fromWorkId: "work-f78d22c37c3d372c",
        toWorkId: "work-a6f696399d7e6c51",
        relationship: "continues",
        claim: "Prosper abridges and continues the Eusebius-Jerome chronicle. Successive versions carry the account into his own century; the fullest reaches 455.",
        evidence: [
          {
            sourceId: "baseline-8fef7c47cad136e5",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-63388cc6501f3c84",
        fromWorkId: "work-a6f696399d7e6c51",
        toWorkId: "work-aa30841b5d11b04c",
        relationship: "continues",
        claim: "Victor continues Prosper's chronicle from 444 to 566/567, with particular attention to church politics. The overlapping years reflect the versions used by the continuators.",
        evidence: [
          {
            sourceId: "baseline-b1468e65b7804282",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-152f68ba15b0ded0",
        fromWorkId: "work-aa30841b5d11b04c",
        toWorkId: "work-80e7a320366abab9",
        relationship: "continues",
        claim: "John begins where Victor ends and carries the narrative to 590. His own preface names Eusebius, Jerome, Prosper and Victor as the predecessors whose chronological sequence he is continuing.",
        evidence: [
          {
            sourceId: "baseline-e7454bcb89b15005",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-1c4a8c44503ae1fb",
        fromWorkId: "work-f507fb5842477fe6",
        toWorkId: "work-96a90e1c5ee80ffe",
        relationship: "uses-source",
        claim: "Tyndale uses Erasmus's Greek text in producing his English New Testament. His later revisions and Old Testament work feed into subsequent English Bibles.",
        evidence: [
          {
            sourceId: "baseline-fceee923f9ecb94c",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-ecf6dc2cfc002b70",
        fromWorkId: "work-96a90e1c5ee80ffe",
        toWorkId: "work-338b6c83f1faba20",
        relationship: "combines-translations",
        claim: "Published under the name Thomas Matthew, this Bible combines Tyndale's work with Coverdale's. It brings together material from more than one translator, rather than simply reprinting Tyndale.",
        evidence: [
          {
            sourceId: "baseline-f225d5e78af38917",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-e2ff9affd3e9031d",
        fromWorkId: "work-338b6c83f1faba20",
        toWorkId: "work-f4eefac2df35c7a8",
        relationship: "revises",
        claim: "Coverdale revises Matthew's Bible for the Great Bible. The new edition becomes the basis for another official revision under Matthew Parker.",
        evidence: [
          {
            sourceId: "baseline-f225d5e78af38917",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-3976a5cf660979c8",
        fromWorkId: "work-f4eefac2df35c7a8",
        toWorkId: "work-296e2268c2f82dea",
        relationship: "revises",
        claim: "Parker oversees a revision of the Great Bible. The Bishops' Bible later serves as the prescribed base text for the King James translators.",
        evidence: [
          {
            sourceId: "baseline-a6ef06369a5fcdea",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-9c941bd032a543ac",
        fromWorkId: "work-296e2268c2f82dea",
        toWorkId: "work-dfaf1be7d6ed1556",
        relationship: "revises-and-compares",
        claim: "The translators use the Bishops' Bible as their base, consulting Tyndale, Matthew, Coverdale, the Great Bible and Geneva. This milestone brings several earlier streams together.",
        evidence: [
          {
            sourceId: "baseline-f225d5e78af38917",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-d282f1935424cf72",
        fromWorkId: "work-dfaf1be7d6ed1556",
        toWorkId: "work-0155ca28dcde8a2c",
        relationship: "revises",
        claim: "The Revised Version's preface explicitly describes its New Testament as a revision of the 1611 translation. Its Old Testament follows in 1885.",
        evidence: [
          {
            sourceId: "baseline-cd82d209b43bb487",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-d96287965278d29d",
        fromWorkId: "work-b19944f4bbb324cc",
        toWorkId: "work-711903491337ec29",
        relationship: "re-excavates",
        claim: "Garstang returns to Jericho and interprets the destruction of City IV in relation to Joshua, proposing a date around 1400 BCE. This is his interpretation of the evidence.",
        evidence: [
          {
            sourceId: "baseline-619a39c4e02c9179",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "renewed-fieldwork",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-bdd4f2643efb59ce",
        fromWorkId: "work-711903491337ec29",
        toWorkId: "work-22966771fbf19303",
        relationship: "reassesses",
        claim: "Kenyon re-excavates the site and places the destruction of the fortified Bronze Age city earlier, around the end of the Middle Bronze Age. Her conclusions challenge Garstang's identification.",
        evidence: [
          {
            sourceId: "baseline-619a39c4e02c9179",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-0415140912d1af95",
        fromWorkId: "work-22966771fbf19303",
        toWorkId: "work-c9cf92c9b23d17e2",
        relationship: "challenges",
        claim: "Wood re-examines the published evidence and argues for a later destruction date around 1400 BCE, challenging Kenyon's chronology. His proposal becomes the subject of a published exchange.",
        evidence: [
          {
            sourceId: "baseline-738b29c307775644",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-76e3ea57c1519555",
        fromWorkId: "work-c9cf92c9b23d17e2",
        toWorkId: "work-d2387859fd6705ba",
        relationship: "disputes",
        claim: "Bienkowski directly disputes Wood's reassessment and defends a Middle Bronze Age destruction. The disagreement concerns the interpretation and dating of archaeological material.",
        evidence: [
          {
            sourceId: "baseline-f9ad5d6cb3426960",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-f9855f184917b9e1",
        fromWorkId: "work-d2387859fd6705ba",
        toWorkId: "work-48bb008adf05d4e4",
        relationship: "replies",
        claim: "Wood answers Bienkowski's objections in the same journal issue. These are two opposing readings of the evidence, not successive stages of consensus.",
        evidence: [
          {
            sourceId: "baseline-311a8af385b7bd2b",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-f07a7983b778a0de",
        fromWorkId: "work-48bb008adf05d4e4",
        toWorkId: "work-7fba94d84b46ea89",
        relationship: "adds-independent-evidence",
        claim: "High-precision radiocarbon measurements of cereals and charcoal add an independent test of the destruction chronology. This is new evidence on the same question, rather than a personal reply to Wood.",
        evidence: [
          {
            sourceId: "baseline-aa0a5e8607f6a090",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "shared-question",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-5b44192711765653",
        fromWorkId: "work-e78f0fe09c46661a",
        toWorkId: "work-efbbd81af18f647a",
        relationship: "reworks",
        claim: "The Latin manual carries Gesenius's lexicographical work to an international readership. This is the edition Robinson subsequently translates into English.",
        evidence: [
          {
            sourceId: "baseline-d7752c7cd48c3e83",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-43b206c10f28c529",
        fromWorkId: "work-efbbd81af18f647a",
        toWorkId: "work-037343216ee3b192",
        relationship: "translates",
        claim: "Robinson publishes an English translation of the 1833 Latin manual. BDB's preface identifies this translation as an earlier foundation for English-language Hebrew study.",
        evidence: [
          {
            sourceId: "baseline-d7752c7cd48c3e83",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-719488d6d1c33df5",
        fromWorkId: "work-037343216ee3b192",
        toWorkId: "work-9325f69ca2b5c8fc",
        relationship: "revises",
        claim: "Robinson revises his English Gesenius. The later BDB editors identify 1854 as the last revision, explaining why a new lexicon had become necessary.",
        evidence: [
          {
            sourceId: "baseline-c8e35437d20dbf47",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-28a094df33a5290b",
        fromWorkId: "work-9325f69ca2b5c8fc",
        toWorkId: "work-bbb1e68f8a1ee3c6",
        relationship: "rebuilds-and-expands",
        claim: "The three editors build a new lexicon on Gesenius as translated by Robinson, also consulting the larger thesaurus and later scholarship. Their names belong together at this collaborative milestone.",
        evidence: [
          {
            sourceId: "baseline-39cd86f31010ae52",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-2cedd3923087b017",
        fromWorkId: "work-bbb1e68f8a1ee3c6",
        toWorkId: "work-09c57988a3929b29",
        relationship: "adds-cross-reference-system",
        claim: "A later edition codes BDB to the numbering system of Strong's concordance. It links two reference tools; it does not mean Strong authored or revised the original BDB.",
        evidence: [
          {
            sourceId: "baseline-de35ba6a403dacf5",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-8d2403dd3c942c9e",
        fromWorkId: "work-e5dd1dac1e27781b",
        toWorkId: "work-3165c2e4fa335039",
        relationship: "challenges",
        claim: "Gaunilo challenges the inference from a conceived object to its existence, using the example of an excellent island. His reply directly addresses Anselm's argument.",
        evidence: [
          {
            sourceId: "baseline-fab0847eea687af5",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-e8952533f6ec3c83",
        fromWorkId: "work-3165c2e4fa335039",
        toWorkId: "work-866b85d962dab651",
        relationship: "replies",
        claim: "Anselm answers Gaunilo and defends the distinctive reasoning of the Proslogion. The reply is preserved alongside the original argument and objection; the exact dates of this exchange are approximate.",
        evidence: [
          {
            sourceId: "baseline-fab0847eea687af5",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-94e55976e535f494",
        fromWorkId: "work-866b85d962dab651",
        toWorkId: "work-c75d8623a9cefcd1",
        relationship: "thematic-reformulation",
        claim: "Centuries later, Descartes presents a different ontological argument based on perfection and necessary existence. This is a later formulation of the question, not a claim that he derived it from Anselm's reply.",
        evidence: [
          {
            sourceId: "baseline-2b8b21a67a51add8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "shared-question",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-6b27732691027d06",
        fromWorkId: "work-c75d8623a9cefcd1",
        toWorkId: "work-4994d18cc4d0657a",
        relationship: "criticises",
        claim: "Kant attacks ontological proofs, including the Cartesian approach, arguing that existence is not a real predicate that adds a property to a thing's concept.",
        evidence: [
          {
            sourceId: "baseline-2b8b21a67a51add8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-1f387df2f2ea9da4",
        fromWorkId: "work-4994d18cc4d0657a",
        toWorkId: "work-28e89b68dfbd3ff8",
        relationship: "reassesses",
        claim: "Malcolm accepts the force of the existence-as-perfection objection but distinguishes another argument in Anselm involving necessary existence. He reopens the discussion in modal terms.",
        evidence: [
          {
            sourceId: "baseline-2b8b21a67a51add8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-8b0e8bdc2cf5bd87",
        fromWorkId: "work-28e89b68dfbd3ff8",
        toWorkId: "work-6cc99d0074a7f7a1",
        relationship: "thematic-reformulation",
        claim: "Plantinga examines modern modal arguments and develops a version using possible worlds and maximal greatness. The crucial possibility premise remains part of the philosophical debate.",
        evidence: [
          {
            sourceId: "baseline-2b8b21a67a51add8",
            locator: "Existing IDEA_CHAINS citation; precise passage review remains open"
          }
        ],
        reviewStatus: "carried-forward",
        caveat: "Preserved existing editorial chain; not newly verified in this research pass. A sequence on one question does not itself establish direct dependence.",
        relationshipFamily: "shared-question",
        assertsDirectTextualDependence: false,
        evidenceScope: "Inherited editorial citation awaiting passage review"
      },
      {
        id: "edge-0f1e265dfbd50f02",
        fromWorkId: "work-eafafc4ebed9de3a",
        toWorkId: "work-c7d17abf2a5f2b71",
        relationship: "continues",
        claim: "Socrates resumes the historical narrative after Eusebius and explains the limits of the earlier account.",
        evidence: [
          {
            sourceId: "socrates-opening",
            locator: "Book I, chapter 1"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-bf20f0a09e0a57f2",
        fromWorkId: "work-7809a438de70288f",
        toWorkId: "work-a8f78e88d30b2d2b",
        relationship: "uses-and-corrects",
        claim: "Socrates names Rufinus as an initial source, then revises chronology after consulting other evidence.",
        evidence: [
          {
            sourceId: "socrates-revision",
            locator: "Book II, chapter 1"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-fafa2758677511be",
        fromWorkId: "work-c7d17abf2a5f2b71",
        toWorkId: "work-a2c87ded5d46df8b",
        relationship: "uses-source",
        claim: "The edition introduction identifies Socrates among the sources used by Sozomen.",
        evidence: [
          {
            sourceId: "sozomen-sources",
            locator: "Introduction, The Sources; author quotation on earlier histories"
          }
        ],
        reviewStatus: "supported",
        caveat: "Evidence is the scholarly edition introduction; a specific parallel passage still needs selecting for display.",
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-d8d988b910dbbaa8",
        fromWorkId: "work-596f880e70973cc1",
        toWorkId: "work-e9c64212d3bec0c6",
        relationship: "adapts-model",
        claim: "Jerome explicitly names Suetonius as his model for a catalogue of Christian writers.",
        evidence: [
          {
            sourceId: "illustrious",
            locator: "Prologue"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-728eb7ace6f6ba3f",
        fromWorkId: "work-c95813891bb09a24",
        toWorkId: "work-4f3ab2b9ddaa8a6b",
        relationship: "revises",
        claim: "Giles revises the earlier English translation by Stevens.",
        evidence: [
          {
            sourceId: "bede-preface",
            locator: "Editor's preface, opening paragraph"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-25a061c59c9b710f",
        fromWorkId: "work-4f3ab2b9ddaa8a6b",
        toWorkId: "work-7d1c58f8ed5a7770",
        relationship: "revises",
        claim: "Sellar retains Giles as a base while substantially revising translation and notes.",
        evidence: [
          {
            sourceId: "bede-preface",
            locator: "Editor's preface, opening paragraph"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-c7b28c2ce30ceba1",
        fromWorkId: "work-c57cf8bf769ec535",
        toWorkId: "work-eafafc4ebed9de3a",
        relationship: "quotes",
        claim: "Eusebius quotes the account of John the Baptist from Josephus and names its book.",
        evidence: [
          {
            sourceId: "eusebius-josephus",
            locator: "I.11.4-6: Josephus on John the Baptist"
          }
        ],
        reviewStatus: "supported",
        caveat: "This connection concerns John the Baptist; it does not adjudicate the separate Testimonium Flavianum dispute.",
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-3a78a7c7d075ae8a",
        fromWorkId: "work-29e81cad240d44e9",
        toWorkId: "work-eafafc4ebed9de3a",
        relationship: "preserves-excerpts",
        claim: "Eusebius names the five-book Memoirs and reproduces passages about church communities.",
        evidence: [
          {
            sourceId: "eusebius-hegesippus",
            locator: "IV.22.1-8: Hegesippus and his Memoirs"
          }
        ],
        reviewStatus: "supported",
        caveat: "Hegesippus is distinct from the later anonymous author called Pseudo-Hegesippus.",
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-b642aa7eeabbfee7",
        fromWorkId: "work-8fb3dc447d5e2c70",
        toWorkId: "work-eafafc4ebed9de3a",
        relationship: "preserves-excerpts",
        claim: "Eusebius reproduces Irenaeus recollections of hearing Polycarp in the letter to Florinus.",
        evidence: [
          {
            sourceId: "eusebius-irenaeus",
            locator: "V.20.4-8: letter to Florinus"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-944036366292be72",
        fromWorkId: "work-3c773443ebc0b0e1",
        toWorkId: "work-490e3f1e706ba885",
        relationship: "adapts",
        claim: "The Latin work reworks Josephus rather than providing a simple translation.",
        evidence: [
          {
            sourceId: "pseudo-hegesippus",
            locator: "Introduction: relation to Josephus; distinction from Hegesippus"
          }
        ],
        reviewStatus: "supported",
        caveat: "Do not assign this work to the second-century Hegesippus or assume the debated attribution to Ambrose.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-21d0c5bcb482f26d",
        fromWorkId: "work-458198bf6efcfd28",
        toWorkId: "work-0fc92e1207526e65",
        relationship: "uses-and-reassesses",
        claim: "Erasmus cites Valla while applying and sometimes questioning his philological methods.",
        evidence: [
          {
            sourceId: "valla",
            locator: "Chapter introduction: Erasmus's use of Valla's Annotations"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-58daddab9366ce3a",
        fromWorkId: "work-71988cfb9af66732",
        toWorkId: "work-51d8ea4c74d19bc1",
        relationship: "translates",
        claim: "Jerome says he is translating thirty-nine Greek homilies on Luke.",
        evidence: [
          {
            sourceId: "jerome-luke",
            locator: "Preface to translation of Origen on St. Luke"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-893d08b26073e42e",
        fromWorkId: "work-b2b5f14d246e6453",
        toWorkId: "work-50a897a2f2c1d334",
        relationship: "translates-with-declared-interventions",
        claim: "Rufinus explains that he omits or adjusts passages he regards as corrupt.",
        evidence: [
          {
            sourceId: "rufinus-prefaces",
            locator: "Preface to On First Principles; preface to translation and completion of Eusebius"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-85f93551bf3c98be",
        fromWorkId: "work-50a897a2f2c1d334",
        toWorkId: "work-c6da76c1e4272530",
        relationship: "criticises-translation",
        claim: "Jerome attacks Rufinus handling of the text and contrasts it with his own translation.",
        evidence: [
          {
            sourceId: "jerome-rufinus",
            locator: "Opening editorial account; discussion of rival translations"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-336bebf2dcddaff6",
        fromWorkId: "work-897c6a7ad5977e00",
        toWorkId: "work-fbb47e4f4854be4c",
        relationship: "questions-translation",
        claim: "Augustine questions the reception of Jerome Hebrew-based translation in worship.",
        evidence: [
          {
            sourceId: "augustine-71",
            locator: "Sections 3-5: translation from Hebrew and Jonah"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-efa334675da77a32",
        fromWorkId: "work-fbb47e4f4854be4c",
        toWorkId: "work-88bf27fcd3c0ab0d",
        relationship: "replies",
        claim: "Jerome answers Augustine and explains the disputed plant terminology.",
        evidence: [
          {
            sourceId: "jerome-112",
            locator: "Reply to Letter 71; discussion of the plant in Jonah"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-df761093a781c515",
        fromWorkId: "work-7001e7533c226fe9",
        toWorkId: "work-7ad164c16e8b8f75",
        relationship: "revises",
        claim: "The American preface explains its origin in the shared revision and subsequent American changes.",
        evidence: [
          {
            sourceId: "asv",
            locator: "Preface to the American Edition, origin and additional variations"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-77270618f806afd9",
        fromWorkId: "work-7ad164c16e8b8f75",
        toWorkId: "work-1c069d3f3bd5e8c9",
        relationship: "revises",
        claim: "The RSV preface identifies the ASV as its revision base.",
        evidence: [
          {
            sourceId: "rsv",
            locator: "Opening history of the revision; edition identified as 1971"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-baebe32c93b5ca47",
        fromWorkId: "work-1c069d3f3bd5e8c9",
        toWorkId: "work-0a1f8d48d5f1bf20",
        relationship: "revises",
        claim: "The NRSV preface explains the renewed revision of the RSV.",
        evidence: [
          {
            sourceId: "nrsv",
            locator: "Opening history and mandates for revision"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-d2f4c31af267636c",
        fromWorkId: "work-1829420b581fa77d",
        toWorkId: "work-fece6d95d62510b3",
        relationship: "revises",
        claim: "The edition identifies itself as Challoner revision of the earlier Douay-Rheims translation.",
        evidence: [
          {
            sourceId: "challoner",
            locator: "Edition heading: Challoner revision 1749-1752"
          }
        ],
        reviewStatus: "bibliographic-only",
        caveat: "Edition-level evidence; individual verse changes have not been collated.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Edition/author credit only"
      },
      {
        id: "edge-ec001ef00b658db4",
        fromWorkId: "work-648b904fca989042",
        toWorkId: "work-c358f2f33e0ee74b",
        relationship: "compares-edition",
        claim: "Nestle uses Tischendorf as one of three reference editions.",
        evidence: [
          {
            sourceId: "nestle",
            locator: "PDF p.57, Introduction I.1, History of the Edition"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-fd4aabfdde7414de",
        fromWorkId: "work-2fef99cd0a116e7e",
        toWorkId: "work-c358f2f33e0ee74b",
        relationship: "compares-edition",
        claim: "Nestle uses Westcott and Hort as another reference edition.",
        evidence: [
          {
            sourceId: "nestle",
            locator: "PDF p.57, Introduction I.1, History of the Edition"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-66ae44bb64a5d0b7",
        fromWorkId: "work-f32456a5547d551f",
        toWorkId: "work-c358f2f33e0ee74b",
        relationship: "compares-edition",
        claim: "Nestle initially uses Weymouth; Weiss replaces it in later editions.",
        evidence: [
          {
            sourceId: "nestle",
            locator: "PDF p.57, Introduction I.1, History of the Edition"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-ce697a9979c6ce30",
        fromWorkId: "work-554b70d2a08ec4fc",
        toWorkId: "work-5a0571ec9c48f9f0",
        relationship: "translates",
        claim: "Jerome records his Latin translation of Didymus treatise.",
        evidence: [
          {
            sourceId: "didymus",
            locator: "Chapter 109: Didymus, On the Holy Spirit, Latin translation"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-c35dca1347de5088",
        fromWorkId: "work-eafafc4ebed9de3a",
        toWorkId: "work-4b5a5f476049be88",
        relationship: "translates-and-extends",
        claim: "Rufinus preface introduces his Latin translation and continuation of Eusebius.",
        evidence: [
          {
            sourceId: "rufinus-prefaces",
            locator: "Preface to the Two Books of Ecclesiastical History; translation, compression of book X, and two added books"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-b6369751a69c30ef",
        fromWorkId: "work-f4be53ed63dc0e8b",
        toWorkId: "work-304b5cb44b79bfd9",
        relationship: "continues-and-refines",
        claim: "Bliss continues the excavation and refines Petrie eight-city scheme with additional phases.",
        evidence: [
          {
            sourceId: "hesi",
            locator: "Tell el-Hesi: apprenticeship, continuation and refinement of stratigraphy"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-40423528704d4db3",
        fromWorkId: "work-ce4430be1163ea6b",
        toWorkId: "work-d8e9d732e56053b9",
        relationship: "completes-publication",
        claim: "Tufnell completes publication of the expedition after Starkey death.",
        evidence: [
          {
            sourceId: "lachish",
            locator: "First and Third Expeditions; inherited and modified stratigraphic sequence"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-16206f9057f79d99",
        fromWorkId: "work-d8e9d732e56053b9",
        toWorkId: "work-f0b637fea48f2f29",
        relationship: "re-excavates-and-refines",
        claim: "The renewed expedition follows and refines the earlier stratigraphic sequence.",
        evidence: [
          {
            sourceId: "lachish",
            locator: "First and Third Expeditions; inherited and modified stratigraphic sequence"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "renewed-fieldwork",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-311635f038ec4a20",
        fromWorkId: "work-3b6628f903a382ee",
        toWorkId: "work-5250a84a750b88d0",
        relationship: "continues-excavation",
        claim: "Ben-Tor describes renewed work at the site earlier excavated by Yadin.",
        evidence: [
          {
            sourceId: "hazor",
            locator: "Hazor I-VII report series"
          },
          {
            sourceId: "hazor-ben-tor",
            locator: "Renewed excavations, 1990-2004"
          }
        ],
        reviewStatus: "supported",
        caveat: "Report-series nodes, not single books; individual report editors remain to be reconciled.",
        relationshipFamily: "renewed-fieldwork",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-3d467200c793456c",
        fromWorkId: "work-c39dce90c9488d72",
        toWorkId: "work-3f4bf291dfae4131",
        relationship: "reassesses",
        claim: "Magness revisits published excavation evidence and incorporates additional data from de Vaux excavations.",
        evidence: [
          {
            sourceId: "qumran",
            locator: "Publisher description: reassessment of de Vaux and later excavation data"
          }
        ],
        reviewStatus: "supported",
        caveat: "Publisher summary establishes the relationship; individual arguments still need page-level locators.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-e64004a4f13a96d3",
        fromWorkId: "work-5eef4f9ac415aaab",
        toWorkId: "work-3747107d4a3ac823",
        relationship: "challenges",
        claim: "Finkelstein identifies Mazar responses and acknowledges their continuing disagreement.",
        evidence: [
          {
            sourceId: "low-chronology",
            locator: "Chapter 3, opening summary: proposal, Mazar responses and continuing disagreement"
          }
        ],
        reviewStatus: "supported",
        caveat: "The two nodes summarize identified paper families; this is disagreement, not a resolved consensus.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-801fe8b6a0ea18e5",
        fromWorkId: "work-9220a903ad9a9c04",
        toWorkId: "work-8ab328425ca07abe",
        relationship: "re-examines-archive",
        claim: "Gilmour reassesses the surviving PEF material to rehabilitate the earlier excavation record.",
        evidence: [
          {
            sourceId: "ophel",
            locator: "Book launch description: Garth Gilmour re-examines archived excavation material"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-e2878b6133f44c3e",
        fromWorkId: "work-fbd11bfe98ba87cc",
        toWorkId: "work-4aeb91e014e8534b",
        relationship: "deciphers-excavated-material",
        claim: "Smith identifies the flood narrative in the excavated Nineveh tablets.",
        evidence: [
          {
            sourceId: "flood-object",
            locator: "Object 16, K.3375: Rassam excavation under Layard"
          },
          {
            sourceId: "flood-smith",
            locator: "Transactions 2 (1873), opening of paper, printed p.213"
          }
        ],
        reviewStatus: "supported",
        caveat: "The first node is an excavation/documentary record, not an authored ancient text; Rassam did not compose the tablet.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-49a8726f15464c72",
        fromWorkId: "work-8cfe721fdfb899ad",
        toWorkId: "work-bf139d3c05d2c562",
        relationship: "translates-and-amends",
        claim: "Jerome describes translating Eusebius place-name work while omitting and changing entries.",
        evidence: [
          {
            sourceId: "jerome-prefaces",
            locator: "Preface to the Book on the Sites and Names of Hebrew Places"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-5c19d48adafec0ce",
        fromWorkId: "work-6f8de51416dc3d17",
        toWorkId: "work-1a805f6351c78162",
        relationship: "extends-analysis",
        claim: "The later paper integrates new observations with the earlier radiometric study.",
        evidence: [
          {
            sourceId: "siloam-2003",
            locator: "Nature 425 (2003), pp.169-171"
          },
          {
            sourceId: "siloam-2006",
            locator: "Abstract: integration of new data with earlier radiometric study"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-96eab32b2de65f96",
        fromWorkId: "work-b7fb8d9339e07f00",
        toWorkId: "work-6a8073ba2cf0d84e",
        relationship: "revises",
        claim: "Grimm revises the Wilke lexicon identified on Thayer title page.",
        evidence: [
          {
            sourceId: "thayer-preface",
            locator: "Title-page attribution and translator preface"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-09ae0c9256e06db8",
        fromWorkId: "work-6a8073ba2cf0d84e",
        toWorkId: "work-3ba3566c0df38b10",
        relationship: "translates-and-expands",
        claim: "Thayer translates, revises and enlarges Grimm lexicon.",
        evidence: [
          {
            sourceId: "thayer-preface",
            locator: "Title-page attribution and translator preface"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-921e33e5fda582d0",
        fromWorkId: "work-00e8d237d68e3e19",
        toWorkId: "work-ec107d6d116065a5",
        relationship: "edits-and-expands",
        claim: "Kautzsch edits successive German editions of Gesenius grammar.",
        evidence: [
          {
            sourceId: "gkc",
            locator: "Cowley preface: Kautzsch editions and translation"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-0fa66f6cd7000ded",
        fromWorkId: "work-ec107d6d116065a5",
        toWorkId: "work-9249d56566c085d3",
        relationship: "translates-and-revises",
        claim: "Cowley explains the English revision in relation to Kautzsch German editions.",
        evidence: [
          {
            sourceId: "gkc",
            locator: "Cowley preface: Kautzsch editions and translation"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-d8001c122efba75a",
        fromWorkId: "work-00e4878d60509f28",
        toWorkId: "work-102f5488c54b1859",
        relationship: "uses-lexical-foundation",
        claim: "The editors acknowledge Passow as a foundational resource.",
        evidence: [
          {
            sourceId: "lsj",
            locator: "Preface: indebtedness to Passow and earlier Schneider"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-508d5a93b69fd411",
        fromWorkId: "work-102f5488c54b1859",
        toWorkId: "work-e70e914684e90c05",
        relationship: "revises-and-expands",
        claim: "Jones preface explains the revision of the Liddell and Scott lexicon.",
        evidence: [
          {
            sourceId: "lsj-jones",
            locator: "1925 preface: Passow, Liddell/Scott and revision"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-ff99b50904bdac0f",
        fromWorkId: "work-64ecf0dbf7df0ec5",
        toWorkId: "work-d4ac277c0eb17a8e",
        relationship: "translates-and-adapts",
        claim: "The publisher identifies Arndt and Gingrich among the preceding English editions.",
        evidence: [
          {
            sourceId: "bauer",
            locator: "Description and edition basis: earlier German and English editions"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "translation",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-c577528878a9a4cb",
        fromWorkId: "work-d4ac277c0eb17a8e",
        toWorkId: "work-ce8c1503dc859443",
        relationship: "revises-and-expands",
        claim: "Danker builds on earlier English editions and the revised German dictionary, adding references and extended definitions.",
        evidence: [
          {
            sourceId: "bauer",
            locator: "Description and edition basis: earlier German and English editions"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-04dae1a39760e75c",
        fromWorkId: "work-135fb63c64ae1504",
        toWorkId: "work-3176c3b6f7a8d4c7",
        relationship: "revises-and-expands",
        claim: "The American edition credits Hackett and Abbot with revision of Smith dictionary.",
        evidence: [
          {
            sourceId: "smith-american",
            locator: "Title page: revised and edited by H. B. Hackett with Ezra Abbot"
          }
        ],
        reviewStatus: "bibliographic-only",
        caveat: "Title-page/catalogue attribution only; individual article changes remain uncollated.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Edition/author credit only"
      },
      {
        id: "edge-f6d8aa52ae37ed8c",
        fromWorkId: "work-135fb63c64ae1504",
        toWorkId: "work-f53e6c3536ffc874",
        relationship: "abridges",
        claim: "The concise edition identifies itself as a condensation of the larger dictionary.",
        evidence: [
          {
            sourceId: "smith-concise",
            locator: "1865 edition record"
          },
          {
            sourceId: "smith-condensation",
            locator: "Title: a condensation of the larger dictionary"
          }
        ],
        reviewStatus: "bibliographic-only",
        caveat: "Do not assign the entire abridgement personally to William Aldis Wright without a checked editorial passage.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Edition/author credit only"
      },
      {
        id: "edge-adf4ccbc8876d4a3",
        fromWorkId: "work-2aa9ccdfa770791d",
        toWorkId: "work-4224420ef2b5747c",
        relationship: "edits-new-edition",
        claim: "The library record identifies Kitto work in a later edition with Alexander as editor.",
        evidence: [
          {
            sourceId: "kitto",
            locator: "1866 Lippincott edition, edited with William Lindsay Alexander"
          }
        ],
        reviewStatus: "bibliographic-only",
        caveat: "Bibliographical evidence establishes the editorial connection; substantive revisions need preface comparison.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Edition/author credit only"
      },
      {
        id: "edge-e6ce9d2f8254390f",
        fromWorkId: "work-135fb63c64ae1504",
        toWorkId: "work-16ab10feacfa9aa2",
        relationship: "uses-source",
        claim: "Rice preface names Smith among reference sources used.",
        evidence: [
          {
            sourceId: "rice",
            locator: "Preface p.viii: named reference works drawn upon"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-ec6c8c52d261c738",
        fromWorkId: "work-2aa9ccdfa770791d",
        toWorkId: "work-16ab10feacfa9aa2",
        relationship: "uses-source",
        claim: "Rice preface names Kitto among reference sources used.",
        evidence: [
          {
            sourceId: "rice",
            locator: "Preface p.viii: named reference works drawn upon"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-781977561239c499",
        fromWorkId: "work-c6433633269f4396",
        toWorkId: "work-16ab10feacfa9aa2",
        relationship: "uses-source",
        claim: "Rice preface names Fausset among reference sources used.",
        evidence: [
          {
            sourceId: "rice",
            locator: "Preface p.viii: named reference works drawn upon"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "source-use",
        assertsDirectTextualDependence: true,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-50ef229e6297e477",
        fromWorkId: "work-4ae0796baade6892",
        toWorkId: "work-7f085937d26aca66",
        relationship: "reworks-and-extends",
        claim: "Jerome explains his relation to Origen and his additions covering New Testament names.",
        evidence: [
          {
            sourceId: "jerome-prefaces",
            locator: "Preface to the Book on Hebrew Names"
          }
        ],
        reviewStatus: "supported",
        caveat: "Jerome earlier attribution to Philo is reported as his claim, not adopted as a verified modern authorship finding.",
        relationshipFamily: "revision-or-extension",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-65b20350543d1f59",
        fromWorkId: "work-3f354fcbc8085577",
        toWorkId: "work-c0a61d5c25a7597d",
        relationship: "refutes-and-quotes",
        claim: "Origen answers the charges of Celsus and reproduces portions of his argument.",
        evidence: [
          {
            sourceId: "celsus",
            locator: "Preface and I.1: response to Celsus"
          }
        ],
        reviewStatus: "supported",
        caveat: "The earlier text is mediated through a hostile respondent, not an independently surviving complete original.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-41a7103246ec6cb6",
        fromWorkId: "work-21f3f6ab3f7cdb97",
        toWorkId: "work-a698e62c3fd3ce46",
        relationship: "refutes",
        claim: "Augustine identifies a book by Pelagius as the work he answers.",
        evidence: [
          {
            sourceId: "pelagius",
            locator: "Retractions excerpt II.42; chapter 1"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-72218e0f44dce98b",
        fromWorkId: "work-7baf5a0722e5da21",
        toWorkId: "work-2acb2a6cecf8513a",
        relationship: "refutes",
        claim: "Augustine first replies to the part of Petilian letter available to him.",
        evidence: [
          {
            sourceId: "petilian",
            locator: "Introduction and books I-II: progressive access to letter and response"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-227d37a017948992",
        fromWorkId: "work-7baf5a0722e5da21",
        toWorkId: "work-8dbfe03be65e2bf2",
        relationship: "refutes-with-fuller-text",
        claim: "After obtaining the whole letter, Augustine expands his reply in book II.",
        evidence: [
          {
            sourceId: "petilian",
            locator: "Introduction and books I-II: progressive access to letter and response"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-f95794c2a5089bd9",
        fromWorkId: "work-6eb4e5db13a2a701",
        toWorkId: "work-c6a383533150ddec",
        relationship: "refutes-and-quotes",
        claim: "Athanasius quotes and criticises statements from Arius Thalia.",
        evidence: [
          {
            sourceId: "arius",
            locator: "Sections 5-6: quotations and criticism of the Thalia"
          }
        ],
        reviewStatus: "supported",
        caveat: "Surviving text is mediated by an opponent; do not treat polemical characterization as neutral biography.",
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-968d6abbfdfcc8c9",
        fromWorkId: "work-9bab64f1632deab9",
        toWorkId: "work-0697c54ba12d98a4",
        relationship: "refutes",
        claim: "Tertullian identifies the Antitheses and argues against its separation of law and gospel.",
        evidence: [
          {
            sourceId: "marcion",
            locator: "Chapter 1: Antitheses and the relation between testaments"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-a9024c31e8b818f8",
        fromWorkId: "work-78bb0f06a99d7c36",
        toWorkId: "work-4affb7c66533df45",
        relationship: "replies-and-refutes",
        claim: "Luther directly addresses Erasmus and identifies the Diatribe as the object of his answer.",
        evidence: [
          {
            sourceId: "erasmus-luther",
            locator: "Introduction addressed to Erasmus; answer to the Diatribe"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-836d7018aa898b02",
        fromWorkId: "work-b163b16a52915dd3",
        toWorkId: "work-c8fa0ec8f97519ef",
        relationship: "criticises",
        claim: "Edwards cites Whitby on freedom and moral agency and argues against the stated account.",
        evidence: [
          {
            sourceId: "whitby-edwards",
            locator: "Part III, section 1: express criticism of Whitby"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-7ac2d375fabfe7ec",
        fromWorkId: "work-87e3d10e6f071e53",
        toWorkId: "work-5d31d7e23fc8a2a4",
        relationship: "replies",
        claim: "Calvin responds to Sadoleto appeal to the Genevans about returning to the Roman church.",
        evidence: [
          {
            sourceId: "sadolet-calvin",
            locator: "Paired translated letters, 1539"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-b6c88f94fd4c83c4",
        fromWorkId: "work-4423bf6c4bc99cf1",
        toWorkId: "work-d87190d278a9ac25",
        relationship: "objects",
        claim: "Arnauld contributes the fourth set of objections to the Meditations.",
        evidence: [
          {
            sourceId: "descartes",
            locator: "Fourth objections and fourth replies; fifth objections and fifth replies"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-27a1a34651be014f",
        fromWorkId: "work-d87190d278a9ac25",
        toWorkId: "work-1a5393ecad5516b0",
        relationship: "replies",
        claim: "Descartes answers Arnauld in the fourth replies.",
        evidence: [
          {
            sourceId: "descartes",
            locator: "Fourth objections and fourth replies; fifth objections and fifth replies"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-f597080cd4f59d7f",
        fromWorkId: "work-4423bf6c4bc99cf1",
        toWorkId: "work-24d5b0a29bfae6ff",
        relationship: "objects",
        claim: "Gassendi contributes the fifth set of objections.",
        evidence: [
          {
            sourceId: "descartes",
            locator: "Fourth objections and fourth replies; fifth objections and fifth replies"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      },
      {
        id: "edge-9c52cb1e8778b0d6",
        fromWorkId: "work-24d5b0a29bfae6ff",
        toWorkId: "work-d43294147c7f9699",
        relationship: "replies",
        claim: "Descartes answers Gassendi in the fifth replies.",
        evidence: [
          {
            sourceId: "descartes",
            locator: "Fourth objections and fourth replies; fifth objections and fifth replies"
          }
        ],
        reviewStatus: "supported",
        caveat: null,
        relationshipFamily: "dispute",
        assertsDirectTextualDependence: false,
        evidenceScope: "Relationship supported at the cited passage or source-summary level; not a full-work collation"
      }
    ],
    chains: [
      {
        id: "history-baseline",
        field: "history",
        title: "A history that others kept writing",
        origin: "existing-five",
        workIds: [
          "work-2e20c3332f38a6fb",
          "work-dcb10ea7742fda39",
          "work-f78d22c37c3d372c",
          "work-a6f696399d7e6c51",
          "work-aa30841b5d11b04c",
          "work-80e7a320366abab9"
        ],
        edgeIds: [
          "edge-139f328f98de7818",
          "edge-cc8581a50bc64992",
          "edge-26051d9870c597b9",
          "edge-63388cc6501f3c84",
          "edge-152f68ba15b0ded0"
        ],
        note: "Six historians carry a chronology from the ancient world into the early Middle Ages."
      },
      {
        id: "texts-baseline",
        field: "texts",
        title: "The English Bible, generation by generation",
        origin: "existing-five",
        workIds: [
          "work-f507fb5842477fe6",
          "work-96a90e1c5ee80ffe",
          "work-338b6c83f1faba20",
          "work-f4eefac2df35c7a8",
          "work-296e2268c2f82dea",
          "work-dfaf1be7d6ed1556",
          "work-0155ca28dcde8a2c"
        ],
        edgeIds: [
          "edge-1c4a8c44503ae1fb",
          "edge-ecf6dc2cfc002b70",
          "edge-e2ff9affd3e9031d",
          "edge-3976a5cf660979c8",
          "edge-9c941bd032a543ac",
          "edge-d282f1935424cf72"
        ],
        note: "A Greek edition becomes an English translation, then a succession of revisions."
      },
      {
        id: "places-baseline",
        field: "places",
        title: "Jericho: an interpretation tested and retested",
        origin: "existing-five",
        workIds: [
          "work-b19944f4bbb324cc",
          "work-711903491337ec29",
          "work-22966771fbf19303",
          "work-c9cf92c9b23d17e2",
          "work-d2387859fd6705ba",
          "work-48bb008adf05d4e4",
          "work-7fba94d84b46ea89"
        ],
        edgeIds: [
          "edge-d96287965278d29d",
          "edge-bdd4f2643efb59ce",
          "edge-0415140912d1af95",
          "edge-76e3ea57c1519555",
          "edge-f9855f184917b9e1",
          "edge-f07a7983b778a0de"
        ],
        note: "Excavation, disagreement and new measurements reshape the dating of one city's destruction."
      },
      {
        id: "reference-baseline",
        field: "reference",
        title: "A Hebrew lexicon, rebuilt across two centuries",
        origin: "existing-five",
        workIds: [
          "work-e78f0fe09c46661a",
          "work-efbbd81af18f647a",
          "work-037343216ee3b192",
          "work-9325f69ca2b5c8fc",
          "work-bbb1e68f8a1ee3c6",
          "work-09c57988a3929b29"
        ],
        edgeIds: [
          "edge-5b44192711765653",
          "edge-43b206c10f28c529",
          "edge-719488d6d1c33df5",
          "edge-28a094df33a5290b",
          "edge-2cedd3923087b017"
        ],
        note: "Follow a reference work through new languages, expanded editions and a new way to look up words."
      },
      {
        id: "theology-baseline",
        field: "theology",
        title: "Can an idea establish that God exists?",
        origin: "existing-five",
        workIds: [
          "work-e5dd1dac1e27781b",
          "work-3165c2e4fa335039",
          "work-866b85d962dab651",
          "work-c75d8623a9cefcd1",
          "work-4994d18cc4d0657a",
          "work-28e89b68dfbd3ff8",
          "work-6cc99d0074a7f7a1"
        ],
        edgeIds: [
          "edge-8d2403dd3c942c9e",
          "edge-e8952533f6ec3c83",
          "edge-94e55976e535f494",
          "edge-6b27732691027d06",
          "edge-1f387df2f2ea9da4",
          "edge-8b0e8bdc2cf5bd87"
        ],
        note: "An argument is challenged, answered and reformulated across nine centuries."
      },
      {
        id: "history-socrates-continuation",
        field: "history",
        title: "Continuing Eusebius into the fifth century",
        origin: "new-research",
        workIds: [
          "work-eafafc4ebed9de3a",
          "work-c7d17abf2a5f2b71"
        ],
        edgeIds: [
          "edge-0f1e265dfbd50f02"
        ],
        note: null
      },
      {
        id: "history-rufinus-corrected",
        field: "history",
        title: "A historian corrects his own source",
        origin: "new-research",
        workIds: [
          "work-7809a438de70288f",
          "work-a8f78e88d30b2d2b"
        ],
        edgeIds: [
          "edge-bf20f0a09e0a57f2"
        ],
        note: null
      },
      {
        id: "history-sozomen-sources",
        field: "history",
        title: "Sozomen reuses earlier church histories",
        origin: "new-research",
        workIds: [
          "work-c7d17abf2a5f2b71",
          "work-a2c87ded5d46df8b"
        ],
        edgeIds: [
          "edge-fafa2758677511be"
        ],
        note: null
      },
      {
        id: "history-illustrious-writers",
        field: "history",
        title: "A classical biographical model becomes Christian literary history",
        origin: "new-research",
        workIds: [
          "work-596f880e70973cc1",
          "work-e9c64212d3bec0c6"
        ],
        edgeIds: [
          "edge-d8d988b910dbbaa8"
        ],
        note: null
      },
      {
        id: "history-bede-translation",
        field: "history",
        title: "Bede reaches new readers through successive translations",
        origin: "new-research",
        workIds: [
          "work-c95813891bb09a24",
          "work-4f3ab2b9ddaa8a6b",
          "work-7d1c58f8ed5a7770"
        ],
        edgeIds: [
          "edge-728eb7ace6f6ba3f",
          "edge-25a061c59c9b710f"
        ],
        note: null
      },
      {
        id: "history-josephus-baptist",
        field: "history",
        title: "Josephus supplies a historical account of John the Baptist",
        origin: "new-research",
        workIds: [
          "work-c57cf8bf769ec535",
          "work-eafafc4ebed9de3a"
        ],
        edgeIds: [
          "edge-c7b28c2ce30ceba1"
        ],
        note: null
      },
      {
        id: "history-hegesippus-preserved",
        field: "history",
        title: "A lost memoir survives in another historian",
        origin: "new-research",
        workIds: [
          "work-29e81cad240d44e9",
          "work-eafafc4ebed9de3a"
        ],
        edgeIds: [
          "edge-3a78a7c7d075ae8a"
        ],
        note: null
      },
      {
        id: "history-irenaeus-florinus",
        field: "history",
        title: "Irenaeus memories of Polycarp are preserved",
        origin: "new-research",
        workIds: [
          "work-8fb3dc447d5e2c70",
          "work-eafafc4ebed9de3a"
        ],
        edgeIds: [
          "edge-b642aa7eeabbfee7"
        ],
        note: null
      },
      {
        id: "history-josephus-recast",
        field: "history",
        title: "Josephus is reworked by a later anonymous writer",
        origin: "new-research",
        workIds: [
          "work-3c773443ebc0b0e1",
          "work-490e3f1e706ba885"
        ],
        edgeIds: [
          "edge-944036366292be72"
        ],
        note: null
      },
      {
        id: "texts-valla-erasmus",
        field: "texts",
        title: "Philological annotations pass from Valla to Erasmus",
        origin: "new-research",
        workIds: [
          "work-458198bf6efcfd28",
          "work-0fc92e1207526e65"
        ],
        edgeIds: [
          "edge-21d0c5bcb482f26d"
        ],
        note: null
      },
      {
        id: "texts-origen-luke",
        field: "texts",
        title: "Origen homilies on Luke become Latin",
        origin: "new-research",
        workIds: [
          "work-71988cfb9af66732",
          "work-51d8ea4c74d19bc1"
        ],
        edgeIds: [
          "edge-58daddab9366ce3a"
        ],
        note: null
      },
      {
        id: "texts-origen-translation-dispute",
        field: "texts",
        title: "A translation prompts a dispute about fidelity",
        origin: "new-research",
        workIds: [
          "work-b2b5f14d246e6453",
          "work-50a897a2f2c1d334",
          "work-c6da76c1e4272530"
        ],
        edgeIds: [
          "edge-893d08b26073e42e",
          "edge-85f93551bf3c98be"
        ],
        note: "Rufinus interventions are declared; neither Latin version should be presented as an unmediated Greek original."
      },
      {
        id: "texts-jonah-correspondence",
        field: "texts",
        title: "The plant in Jonah opens a translation debate",
        origin: "new-research",
        workIds: [
          "work-897c6a7ad5977e00",
          "work-fbb47e4f4854be4c",
          "work-88bf27fcd3c0ab0d"
        ],
        edgeIds: [
          "edge-336bebf2dcddaff6",
          "edge-efa334675da77a32"
        ],
        note: null
      },
      {
        id: "texts-modern-english-revisions",
        field: "texts",
        title: "British and American revision projects continue",
        origin: "new-research",
        workIds: [
          "work-7001e7533c226fe9",
          "work-7ad164c16e8b8f75",
          "work-1c069d3f3bd5e8c9",
          "work-0a1f8d48d5f1bf20"
        ],
        edgeIds: [
          "edge-df761093a781c515",
          "edge-77270618f806afd9",
          "edge-baebe32c93b5ca47"
        ],
        note: "Committees remain corporate contributors; no single translator receives authorship of the whole edition."
      },
      {
        id: "texts-douay-challoner",
        field: "texts",
        title: "Challoner revises the Douay-Rheims translation",
        origin: "new-research",
        workIds: [
          "work-1829420b581fa77d",
          "work-fece6d95d62510b3"
        ],
        edgeIds: [
          "edge-d2f4c31af267636c"
        ],
        note: null
      },
      {
        id: "texts-nestle-comparison",
        field: "texts",
        title: "Nestle combines the decisions of three critical editions",
        origin: "new-research",
        workIds: [
          "work-648b904fca989042",
          "work-2fef99cd0a116e7e",
          "work-f32456a5547d551f",
          "work-c358f2f33e0ee74b"
        ],
        edgeIds: [
          "edge-ec001ef00b658db4",
          "edge-fd4aabfdde7414de",
          "edge-66ae44bb64a5d0b7"
        ],
        note: "Three parallel inputs, not a Tischendorf-to-Hort-to-Weymouth personal influence chain."
      },
      {
        id: "texts-didymus-latin",
        field: "texts",
        title: "Didymus treatise is translated by Jerome",
        origin: "new-research",
        workIds: [
          "work-554b70d2a08ec4fc",
          "work-5a0571ec9c48f9f0"
        ],
        edgeIds: [
          "edge-ce697a9979c6ce30"
        ],
        note: null
      },
      {
        id: "texts-eusebius-rufinus",
        field: "texts",
        title: "Rufinus translates and extends Eusebius",
        origin: "new-research",
        workIds: [
          "work-eafafc4ebed9de3a",
          "work-4b5a5f476049be88"
        ],
        edgeIds: [
          "edge-c35dca1347de5088"
        ],
        note: null
      },
      {
        id: "places-hesi-stratigraphy",
        field: "places",
        title: "Petrie methods and stratigraphy are refined by Bliss",
        origin: "new-research",
        workIds: [
          "work-f4be53ed63dc0e8b",
          "work-304b5cb44b79bfd9"
        ],
        edgeIds: [
          "edge-b6369751a69c30ef"
        ],
        note: null
      },
      {
        id: "places-lachish-records",
        field: "places",
        title: "Excavation records become reports and a renewed investigation",
        origin: "new-research",
        workIds: [
          "work-ce4430be1163ea6b",
          "work-d8e9d732e56053b9",
          "work-f0b637fea48f2f29"
        ],
        edgeIds: [
          "edge-40423528704d4db3",
          "edge-16206f9057f79d99"
        ],
        note: "The later excavation is not an endorsement of every earlier interpretation."
      },
      {
        id: "places-hazor-renewal",
        field: "places",
        title: "Hazor excavation continues across generations",
        origin: "new-research",
        workIds: [
          "work-3b6628f903a382ee",
          "work-5250a84a750b88d0"
        ],
        edgeIds: [
          "edge-311635f038ec4a20"
        ],
        note: null
      },
      {
        id: "places-qumran-reassessment",
        field: "places",
        title: "Magness reassesses de Vaux excavation evidence",
        origin: "new-research",
        workIds: [
          "work-c39dce90c9488d72",
          "work-3f4bf291dfae4131"
        ],
        edgeIds: [
          "edge-3d467200c793456c"
        ],
        note: null
      },
      {
        id: "places-iron-age-chronology",
        field: "places",
        title: "A chronology proposal produces a documented debate",
        origin: "new-research",
        workIds: [
          "work-5eef4f9ac415aaab",
          "work-3747107d4a3ac823"
        ],
        edgeIds: [
          "edge-e64004a4f13a96d3"
        ],
        note: null
      },
      {
        id: "places-ophel-archives",
        field: "places",
        title: "Old excavation archives receive a new final report",
        origin: "new-research",
        workIds: [
          "work-9220a903ad9a9c04",
          "work-8ab328425ca07abe"
        ],
        edgeIds: [
          "edge-801fe8b6a0ea18e5"
        ],
        note: null
      },
      {
        id: "places-flood-tablet",
        field: "places",
        title: "An excavated tablet becomes a translated flood account",
        origin: "new-research",
        workIds: [
          "work-fbd11bfe98ba87cc",
          "work-4aeb91e014e8534b"
        ],
        edgeIds: [
          "edge-e2878b6133f44c3e"
        ],
        note: null
      },
      {
        id: "places-onomasticon",
        field: "places",
        title: "An ancient place-name gazetteer is translated and amended",
        origin: "new-research",
        workIds: [
          "work-8cfe721fdfb899ad",
          "work-bf139d3c05d2c562"
        ],
        edgeIds: [
          "edge-49a8726f15464c72"
        ],
        note: null
      },
      {
        id: "places-siloam-engineering",
        field: "places",
        title: "Radiometric work is extended into tunnel engineering",
        origin: "new-research",
        workIds: [
          "work-6f8de51416dc3d17",
          "work-1a805f6351c78162"
        ],
        edgeIds: [
          "edge-5c19d48adafec0ce"
        ],
        note: null
      },
      {
        id: "reference-wilke-grimm-thayer",
        field: "reference",
        title: "A Greek lexicon is revised and translated",
        origin: "new-research",
        workIds: [
          "work-b7fb8d9339e07f00",
          "work-6a8073ba2cf0d84e",
          "work-3ba3566c0df38b10"
        ],
        edgeIds: [
          "edge-96eab32b2de65f96",
          "edge-09ae0c9256e06db8"
        ],
        note: null
      },
      {
        id: "reference-gesenius-grammar",
        field: "reference",
        title: "A Hebrew grammar receives German and English revisions",
        origin: "new-research",
        workIds: [
          "work-00e8d237d68e3e19",
          "work-ec107d6d116065a5",
          "work-9249d56566c085d3"
        ],
        edgeIds: [
          "edge-921e33e5fda582d0",
          "edge-0fa66f6cd7000ded"
        ],
        note: null
      },
      {
        id: "reference-liddell-scott-jones",
        field: "reference",
        title: "Passow lexicography becomes Liddell-Scott-Jones",
        origin: "new-research",
        workIds: [
          "work-00e4878d60509f28",
          "work-102f5488c54b1859",
          "work-e70e914684e90c05"
        ],
        edgeIds: [
          "edge-d8001c122efba75a",
          "edge-508d5a93b69fd411"
        ],
        note: null
      },
      {
        id: "reference-bauer-danker",
        field: "reference",
        title: "Bauer lexicon is adapted and expanded in English",
        origin: "new-research",
        workIds: [
          "work-64ecf0dbf7df0ec5",
          "work-d4ac277c0eb17a8e",
          "work-ce8c1503dc859443"
        ],
        edgeIds: [
          "edge-ff99b50904bdac0f",
          "edge-c577528878a9a4cb"
        ],
        note: null
      },
      {
        id: "reference-smith-american",
        field: "reference",
        title: "An American editorial team revises Smith dictionary",
        origin: "new-research",
        workIds: [
          "work-135fb63c64ae1504",
          "work-3176c3b6f7a8d4c7"
        ],
        edgeIds: [
          "edge-04dae1a39760e75c"
        ],
        note: null
      },
      {
        id: "reference-smith-concise",
        field: "reference",
        title: "Smith dictionary is condensed for a wider readership",
        origin: "new-research",
        workIds: [
          "work-135fb63c64ae1504",
          "work-f53e6c3536ffc874"
        ],
        edgeIds: [
          "edge-f6d8aa52ae37ed8c"
        ],
        note: null
      },
      {
        id: "reference-kitto-alexander",
        field: "reference",
        title: "Alexander edits a later edition of Kitto cyclopaedia",
        origin: "new-research",
        workIds: [
          "work-2aa9ccdfa770791d",
          "work-4224420ef2b5747c"
        ],
        edgeIds: [
          "edge-adf4ccbc8876d4a3"
        ],
        note: null
      },
      {
        id: "reference-rice-acknowledged-sources",
        field: "reference",
        title: "Rice names the reference works he draws upon",
        origin: "new-research",
        workIds: [
          "work-135fb63c64ae1504",
          "work-2aa9ccdfa770791d",
          "work-c6433633269f4396",
          "work-16ab10feacfa9aa2"
        ],
        edgeIds: [
          "edge-e6ce9d2f8254390f",
          "edge-ec6c8c52d261c738",
          "edge-781977561239c499"
        ],
        note: "Parallel sources, not a chronological Smith-to-Kitto-to-Fausset chain."
      },
      {
        id: "reference-hebrew-names",
        field: "reference",
        title: "Jerome extends an earlier Hebrew-name reference tradition",
        origin: "new-research",
        workIds: [
          "work-4ae0796baade6892",
          "work-7f085937d26aca66"
        ],
        edgeIds: [
          "edge-50ef229e6297e477"
        ],
        note: null
      },
      {
        id: "theology-celsus-origen",
        field: "theology",
        title: "An opponent text is preserved through a reply",
        origin: "new-research",
        workIds: [
          "work-3f354fcbc8085577",
          "work-c0a61d5c25a7597d"
        ],
        edgeIds: [
          "edge-65b20350543d1f59"
        ],
        note: null
      },
      {
        id: "theology-pelagius-augustine",
        field: "theology",
        title: "A book about human nature provokes a reply on grace",
        origin: "new-research",
        workIds: [
          "work-21f3f6ab3f7cdb97",
          "work-a698e62c3fd3ce46"
        ],
        edgeIds: [
          "edge-41a7103246ec6cb6"
        ],
        note: null
      },
      {
        id: "theology-petilian-exchange",
        field: "theology",
        title: "A partial letter and a fuller copy produce successive replies",
        origin: "new-research",
        workIds: [
          "work-7baf5a0722e5da21",
          "work-2acb2a6cecf8513a",
          "work-8dbfe03be65e2bf2"
        ],
        edgeIds: [
          "edge-72218e0f44dce98b",
          "edge-227d37a017948992"
        ],
        note: "The first and second books are separate response milestones, not evidence that Petilian accepted the reply."
      },
      {
        id: "theology-arius-athanasius",
        field: "theology",
        title: "Arius verses are quoted and contested",
        origin: "new-research",
        workIds: [
          "work-6eb4e5db13a2a701",
          "work-c6a383533150ddec"
        ],
        edgeIds: [
          "edge-f95794c2a5089bd9"
        ],
        note: null
      },
      {
        id: "theology-marcion-tertullian",
        field: "theology",
        title: "The Antitheses prompt a defence of continuity",
        origin: "new-research",
        workIds: [
          "work-9bab64f1632deab9",
          "work-0697c54ba12d98a4"
        ],
        edgeIds: [
          "edge-968d6abbfdfcc8c9"
        ],
        note: null
      },
      {
        id: "theology-erasmus-luther",
        field: "theology",
        title: "Erasmus free-will argument receives Luther reply",
        origin: "new-research",
        workIds: [
          "work-78bb0f06a99d7c36",
          "work-4affb7c66533df45"
        ],
        edgeIds: [
          "edge-a9024c31e8b818f8"
        ],
        note: null
      },
      {
        id: "theology-whitby-edwards",
        field: "theology",
        title: "Edwards contests Whitby account of freedom",
        origin: "new-research",
        workIds: [
          "work-b163b16a52915dd3",
          "work-c8fa0ec8f97519ef"
        ],
        edgeIds: [
          "edge-836d7018aa898b02"
        ],
        note: null
      },
      {
        id: "theology-sadolet-calvin",
        field: "theology",
        title: "A letter to Geneva receives Calvin response",
        origin: "new-research",
        workIds: [
          "work-87e3d10e6f071e53",
          "work-5d31d7e23fc8a2a4"
        ],
        edgeIds: [
          "edge-7ac2d375fabfe7ec"
        ],
        note: null
      },
      {
        id: "theology-descartes-objections",
        field: "theology",
        title: "The Meditations circulates among objectors and receives replies",
        origin: "new-research",
        workIds: [
          "work-4423bf6c4bc99cf1",
          "work-d87190d278a9ac25",
          "work-1a5393ecad5516b0",
          "work-24d5b0a29bfae6ff",
          "work-d43294147c7f9699"
        ],
        edgeIds: [
          "edge-b6c88f94fd4c83c4",
          "edge-27a1a34651be014f",
          "edge-f597080cd4f59d7f",
          "edge-9c52cb1e8778b0d6"
        ],
        note: "Two branches of one exchange; do not animate a fictitious Arnauld-to-Gassendi dependency."
      }
    ],
    sources: [
      {
        id: "socrates-opening",
        title: "Socrates: Ecclesiastical History I.1",
        url: "https://ccel.org/ccel/schaff/npnf202/npnf202.ii.iv.i.html",
        locator: "Book I, chapter 1",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "socrates-revision",
        title: "Socrates: Ecclesiastical History II.1",
        url: "https://ccel.org/ccel/schaff/npnf202/npnf202.ii.v.i.html",
        locator: "Book II, chapter 1",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "sozomen-sources",
        title: "Sozomen: sources and plan",
        url: "https://ccel.org/ccel/schaff/npnf202/npnf202.iii.ii.ii.html",
        locator: "Introduction, The Sources; author quotation on earlier histories",
        kind: "edition-introduction",
        consultedOn: "2026-10-16",
        access: "opened-edition-introduction"
      },
      {
        id: "illustrious",
        title: "Jerome: On Illustrious Men",
        url: "https://www.newadvent.org/fathers/2708.htm",
        locator: "Prologue; chapter 135",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "bede-preface",
        title: "A. M. Sellar: editorial preface to Bede",
        url: "https://ccel.org/ccel/bede/history.ii.html",
        locator: "Editor's preface, opening paragraph",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "eusebius-josephus",
        title: "Eusebius: Church History I",
        url: "https://www.newadvent.org/fathers/250101.htm",
        locator: "I.11.4-6: Josephus on John the Baptist",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "eusebius-hegesippus",
        title: "Eusebius: Church History IV",
        url: "https://www.newadvent.org/fathers/250104.htm",
        locator: "IV.22.1-8: Hegesippus and his Memoirs",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "eusebius-irenaeus",
        title: "Eusebius: Church History V",
        url: "https://www.newadvent.org/fathers/250105.htm",
        locator: "V.20.4-8: letter to Florinus",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "pseudo-hegesippus",
        title: "Pseudo-Hegesippus: translation introduction",
        url: "https://www.ccel.org/ccel/pearse/morefathers/files/hegesippus_00_eintro.htm",
        locator: "Introduction: relation to Josephus; distinction from Hegesippus",
        kind: "edition-introduction",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "valla",
        title: "Latin Translation in the Renaissance: publisher excerpt",
        url: "https://assets.cambridge.org/052183/7170/excerpt/0521837170_excerpt.htm",
        locator: "Chapter introduction: Erasmus's use of Valla's Annotations",
        kind: "scholarly-publisher-excerpt",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "jerome-prefaces",
        title: "Jerome: Prefaces",
        url: "https://www.newadvent.org/fathers/3002.htm",
        locator: "Prefaces to Origen translations, Hebrew Names and Hebrew Places",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "jerome-luke",
        title: "Jerome: preface to translation of Origen on Luke",
        url: "https://www.catholicculture.org/culture/library/fathers/view.cfm?recnum=2320",
        locator: "Preface to translation of Origen on St. Luke",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "rufinus-prefaces",
        title: "Rufinus: Prefaces",
        url: "https://www.newadvent.org/fathers/2712.htm",
        locator: "Preface to On First Principles; preface to translation and completion of Eusebius",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "jerome-rufinus",
        title: "Jerome: Apology Against Rufinus I",
        url: "https://www.newadvent.org/fathers/27101.htm",
        locator: "Opening editorial account; discussion of rival translations",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "augustine-71",
        title: "Augustine: Letter 71 (Jerome 104)",
        url: "https://www.newadvent.org/fathers/1102071.htm",
        locator: "Sections 3-5: translation from Hebrew and Jonah",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "jerome-112",
        title: "Jerome: Letter 112 (Augustine 75)",
        url: "https://www.newadvent.org/fathers/1102075.htm",
        locator: "Reply to Letter 71; discussion of the plant in Jonah",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "asv",
        title: "American Standard Version: 1901 prefaces",
        url: "https://www.bible-researcher.com/asvpreface.html",
        locator: "Preface to the American Edition, origin and additional variations",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "rsv",
        title: "Revised Standard Version: preface",
        url: "https://www.bible-researcher.com/rsvpreface.html",
        locator: "Opening history of the revision; edition identified as 1971",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "nrsv",
        title: "New Revised Standard Version: preface",
        url: "https://www.bible-researcher.com/nrsvpreface.html",
        locator: "Opening history and mandates for revision",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "challoner",
        title: "Douay-Rheims-Challoner Bible",
        url: "https://www.ccel.org/c/challoner/douayrheims/dr.html",
        locator: "Edition heading: Challoner revision 1749-1752",
        kind: "edition-heading",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "nestle",
        title: "Nestle-Aland 28: introduction",
        url: "https://api.pageplace.de/preview/DT0400.9783438072399_A33839551/preview-9783438072399_A33839551.pdf",
        locator: "PDF p.57, Introduction I.1, History of the Edition",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "didymus",
        title: "Jerome: On Illustrious Men, chapter 109",
        url: "https://www.newadvent.org/fathers/2708.htm",
        locator: "Chapter 109: Didymus, On the Holy Spirit, Latin translation",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "opened-text"
      },
      {
        id: "hesi",
        title: "PEF: Frederick Jones Bliss",
        url: "https://www.pef.org.uk/about/history/frederick-jones-bliss/",
        locator: "Tell el-Hesi: apprenticeship, continuation and refinement of stratigraphy",
        kind: "holding-institution",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "lachish",
        title: "Fourth Expedition to Lachish: history of research",
        url: "https://discover.e.southern.edu/administration/archaeology/lachish/project-overview/history-of-research.html",
        locator: "First and Third Expeditions; inherited and modified stratigraphic sequence",
        kind: "excavation-project",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "hazor",
        title: "Hazor excavation reports",
        url: "https://www.hazor-excavations.org/copy-of-publications",
        locator: "Hazor I-VII report series",
        kind: "excavation-project",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "hazor-ben-tor",
        title: "Amnon Ben-Tor: Hazor",
        url: "https://library.biblicalarchaeology.org/book/the-new-encyclopedia-of-archaeological-excavations-in-the-holy-land/hazor/",
        locator: "Renewed excavations, 1990-2004",
        kind: "author-account",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "qumran",
        title: "Magness: Archaeology of Qumran, second edition",
        url: "https://www.eerdmans.com/9780802879080/the-archaeology-of-qumran-and-the-dead-sea-scrolls-2nd-ed/",
        locator: "Publisher description: reassessment of de Vaux and later excavation data",
        kind: "publisher",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "low-chronology",
        title: "Finkelstein: A Low Chronology Update",
        url: "https://www.cambridge.org/core/books/abs/bible-and-radiocarbon-dating/low-chronology-update-archaeology-history-and-bible/A9DF4A1EB229351B871089A9E875BEEF",
        locator: "Chapter 3, opening summary: proposal, Mazar responses and continuing disagreement",
        kind: "primary-paper",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "ophel",
        title: "PEF: final report on Macalister and Duncan excavations",
        url: "https://www.pef.org.uk/wp-content/uploads/2025/01/Flyer-16.1.25.pdf",
        locator: "Book launch description: Garth Gilmour re-examines archived excavation material",
        kind: "holding-institution",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "flood-object",
        title: "British Museum loan provenance: Flood Tablet",
        url: "https://museum.wa.gov.au/sites/default/files/100Objects_ProvenanceList_MASTER%20COPY_0.pdf",
        locator: "Object 16, K.3375: Rassam excavation under Layard",
        kind: "holding-institution",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "flood-smith",
        title: "George Smith: The Chaldean Account of the Deluge",
        url: "https://en.wikisource.org/wiki/Page:Transactions_of_the_Society_of_Biblical_Archaeology,_Vol_2_(1873).pdf/238",
        locator: "Transactions 2 (1873), opening of paper, printed p.213",
        kind: "primary-paper",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "siloam-2003",
        title: "Frumkin, Shimron and Rosenbaum: Siloam dating",
        url: "https://www.nature.com/articles/nature01875",
        locator: "Nature 425 (2003), pp.169-171",
        kind: "primary-paper",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "siloam-2006",
        title: "Frumkin and Shimron: tunnel engineering",
        url: "https://www.sciencedirect.com/science/article/pii/S0305440305001688",
        locator: "Abstract: integration of new data with earlier radiometric study",
        kind: "primary-paper",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "thayer-preface",
        title: "Thayer lexicon: digitized preface",
        url: "https://campus.wts.edu/~vpoythress/nt123/pdfs/ThayerGreekLexicon1896.pdf",
        locator: "Preface: predecessor lexicons and translation/revision",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "gkc",
        title: "Gesenius Hebrew Grammar: translator preface",
        url: "https://en.wikisource.org/wiki/Gesenius%27_Hebrew_Grammar/Translator%27s_Preface",
        locator: "Cowley preface: Kautzsch editions and translation",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "lsj",
        title: "Liddell and Scott: preface",
        url: "https://en.wikisource.org/wiki/Liddell_and_Scott",
        locator: "Preface: indebtedness to Passow and earlier Schneider",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "lsj-jones",
        title: "Liddell-Scott-Jones: 1925 preface",
        url: "https://www.perseus.tufts.edu/hopper/text?doc=Perseus%3Atext%3A1999.04.0057%3Afrontmatter%3Dpref.",
        locator: "1925 preface: Passow, Liddell/Scott and revision",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "bauer",
        title: "Bauer-Danker lexicon: publisher record",
        url: "https://press.uchicago.edu/ucp/books/book/chicago/G/bo3622223.html",
        locator: "Description and edition basis: earlier German and English editions",
        kind: "publisher",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "smith-american",
        title: "Smith dictionary: American edition title credits",
        url: "https://archive.org/details/dictionaryofbibl04smituoft",
        locator: "Title page: revised and edited by H. B. Hackett with Ezra Abbot",
        kind: "primary-scan",
        consultedOn: "2026-10-16",
        access: "catalogue-excerpt"
      },
      {
        id: "smith-concise",
        title: "Smith: A Concise Dictionary of the Bible",
        url: "https://platforma.bk.pan.pl/en/search_results/1020763?q%5Bsort_attributes%5D%5Bfield_name%5D=title.sort&q%5Bsort_attributes%5D%5Border%5D=asc",
        locator: "1865 edition record",
        kind: "holding-institution",
        consultedOn: "2026-10-16",
        access: "catalogue-excerpt"
      },
      {
        id: "smith-condensation",
        title: "Smith: concise edition title-page description",
        url: "https://openlibrary.org/books/OL23290294M/A_concise_dictionary_of_the_Bible_...",
        locator: "Title: a condensation of the larger dictionary",
        kind: "library-catalogue",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "kitto",
        title: "Kitto and Alexander: Cyclopaedia of Biblical Literature",
        url: "https://onlinebooks.library.upenn.edu/webbin/who/Kitto%2C%20John%2C%201804-1854",
        locator: "1866 Lippincott edition, edited with William Lindsay Alexander",
        kind: "holding-institution",
        consultedOn: "2026-10-16",
        access: "catalogue-excerpt"
      },
      {
        id: "rice",
        title: "Rice: Peoples Dictionary of the Bible, preface",
        url: "https://upload.wikimedia.org/wikipedia/commons/f/fd/People%27s_dictionary_of_the_Bible_.._%28IA_peoplesdictionar02rice%29.pdf",
        locator: "Preface p.viii: named reference works drawn upon",
        kind: "primary-scan",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "celsus",
        title: "Origen: Against Celsus I",
        url: "https://www.newadvent.org/fathers/04161.htm",
        locator: "Preface and I.1: response to Celsus",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "pelagius",
        title: "Augustine: On Nature and Grace",
        url: "https://www.newadvent.org/fathers/1503.htm",
        locator: "Retractions excerpt II.42; chapter 1",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "petilian",
        title: "Augustine: Answer to Petilian",
        url: "https://www.newadvent.org/fathers/1409.htm",
        locator: "Introduction and books I-II: progressive access to letter and response",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "arius",
        title: "Athanasius: First Discourse Against the Arians",
        url: "https://www.newadvent.org/fathers/28161.htm",
        locator: "Sections 5-6: quotations and criticism of the Thalia",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "marcion",
        title: "Tertullian: Against Marcion IV",
        url: "https://www.newadvent.org/fathers/03124.htm",
        locator: "Chapter 1: Antitheses and the relation between testaments",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "erasmus-luther",
        title: "Luther: Bondage of the Will",
        url: "https://ccel.org/ccel/luther/bondage.v.html",
        locator: "Introduction addressed to Erasmus; answer to the Diatribe",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "whitby-edwards",
        title: "Edwards: Freedom of the Will III.1",
        url: "https://www.ccel.org/ccel/edwards/will.iv.i.html",
        locator: "Part III, section 1: express criticism of Whitby",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "sadolet-calvin",
        title: "Sadolet letter and Calvin reply",
        url: "https://www.bhmc.org.uk/uploads/9/1/7/7/91773502/calvin_-_sadolets_letter_and_calvins_reply.pdf",
        locator: "Paired translated letters, 1539",
        kind: "primary-text",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "descartes",
        title: "Descartes: Objections and Replies",
        url: "https://www.cambridge.org/highereducation/books/the-philosophical-writings-of-descartes/618B16C4C0116CBB0B39211F93E2BCB3/objections-and-replies/9349B32454D36E5E405418ECB74DA911",
        locator: "Fourth objections and fourth replies; fifth objections and fifth replies",
        kind: "primary-edition",
        consultedOn: "2026-10-16",
        access: "text-or-catalogue-excerpt"
      },
      {
        id: "baseline-387e4a7755d7d7d8",
        title: "Eusebius: preface to the Chronicle",
        url: "https://www.ccel.org/ccel/pearse/morefathers/files/jerome_chronicle_01_prefaces.htm",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-8fef7c47cad136e5",
        title: "Manuscript: Eusebius, Jerome and Prosper",
        url: "https://www.e-codices.ch/en/description/bge/lat0049/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-b1468e65b7804282",
        title: "Critical edition: Victor and John",
        url: "https://www.brepols.net/products/IS-9782503017334-1",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-e7454bcb89b15005",
        title: "John of Biclar: translated preface",
        url: "https://www.aymennaltamimi.com/p/the-chronicle-of-john-of-biclaro",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-fceee923f9ecb94c",
        title: "Tyndale's use of Erasmus",
        url: "https://www.tyndale.org/journals/tsj22/hooker.html",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-f225d5e78af38917",
        title: "Cambridge: the English Bible editions",
        url: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/captions.html",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-a6ef06369a5fcdea",
        title: "Cambridge: the Bishops' Bible",
        url: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/forchurch.html",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-cd82d209b43bb487",
        title: "Revised Version: 1881 preface",
        url: "https://bibleversion.org/bible/versions/modern-english/revised-version/english-revised-version-new-testament-preface-1881/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-619a39c4e02c9179",
        title: "UCL: Jericho's excavation history",
        url: "https://discovery.ucl.ac.uk/id/eprint/10081915/1/Sparks_Jericho%20in%20the%20Media_pre-publication.pdf",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-738b29c307775644",
        title: "BAR: the 1990 debate",
        url: "https://library.biblicalarchaeology.org/issue/september-october-1990/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-f9ad5d6cb3426960",
        title: "Bienkowski's published response",
        url: "https://library.biblicalarchaeology.org/article/jericho-was-destroyed-in-the-middle-bronze-age-not-the-late-bronze-age/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-311a8af385b7bd2b",
        title: "Wood's published reply",
        url: "https://library.biblicalarchaeology.org/article/dating-jerichos-destruction-bienkowski-is-wrong-on-all-counts/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-aa0a5e8607f6a090",
        title: "1995 radiocarbon study",
        url: "https://research.rug.nl/en/publications/tell-es-sultan-jericho-radiocarbon-results-of-short-lived-cereal-/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-d7752c7cd48c3e83",
        title: "BDB: historical preface",
        url: "https://www.hebraisztika.hu/downloads/BDB.pdf",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-c8e35437d20dbf47",
        title: "Library of Congress: 1854 edition",
        url: "https://www.loc.gov/resource/gdcmassbookdig.hebrewenglishlex00gese/?st=gallery",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-39cd86f31010ae52",
        title: "1906 edition: title and attribution",
        url: "https://books.google.com/books/about/A_Hebrew_and_English_Lexicon_of_the_Old.html?id=u0ATAAAAYAAJ",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-de35ba6a403dacf5",
        title: "Library catalogue: 1996 coded edition",
        url: "https://catalogue.library.ucu.ac.ug/cgi-bin/koha/opac-detail.pl?biblionumber=55731&shelfbrowse_itemnumber=142115",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-fab0847eea687af5",
        title: "Gaunilo: objection to Anselm",
        url: "https://ccel.org/ccel/anselm/basic_works.all.html",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      },
      {
        id: "baseline-2b8b21a67a51add8",
        title: "Stanford: Cartesian ontological arguments",
        url: "https://plato.stanford.edu/entries/ontological-arguments/",
        locator: "Existing IDEA_CHAINS citation; precise passage review remains open",
        kind: "inherited-citation",
        consultedOn: "2026-10-16",
        access: "carried-forward-not-rechecked"
      }
    ],
    baselineSnapshot: [
      {
        field: "history",
        label: "History",
        title: "A history that others kept writing",
        description: "Six historians carry a chronology from the ancient world into the early Middle Ages.",
        nodes: [
          {
            name: "Julius Africanus",
            work: "Chronographiae",
            date: "c. 221",
            initials: "JA",
            link: "Begins the thread",
            detail: "Africanus brought biblical and other chronologies into a universal history. His work survives in fragments; Eusebius names him among the earlier Christian chronographers he consulted.",
            source: "https://www.ccel.org/ccel/pearse/morefathers/files/jerome_chronicle_01_prefaces.htm",
            sourceLabel: "Eusebius and Jerome: prefaces"
          },
          {
            name: "Eusebius",
            work: "Chronicle",
            date: "c. 325",
            initials: "E",
            link: "Uses earlier chronology",
            detail: "Eusebius draws on Africanus and other predecessors, arranging the histories of different peoples into a comparative chronology. This is a documented use of sources, not a teacher-student relationship.",
            source: "https://www.ccel.org/ccel/pearse/morefathers/files/jerome_chronicle_01_prefaces.htm",
            sourceLabel: "Eusebius: preface to the Chronicle"
          },
          {
            name: "Jerome",
            work: "Latin Chronicle",
            date: "c. 380",
            initials: "J",
            link: "Translates & extends",
            detail: "Jerome translates Eusebius into Latin, adds material on Roman history and continues the account to 378. His preface explains his dual role as translator and author.",
            source: "https://www.ccel.org/ccel/pearse/morefathers/files/jerome_chronicle_01_prefaces.htm",
            sourceLabel: "Jerome: translator's preface"
          },
          {
            name: "Prosper of Aquitaine",
            work: "Epitome of the Chronicle",
            date: "c. 455",
            initials: "PA",
            link: "Continues",
            detail: "Prosper abridges and continues the Eusebius-Jerome chronicle. Successive versions carry the account into his own century; the fullest reaches 455.",
            source: "https://www.e-codices.ch/en/description/bge/lat0049/",
            sourceLabel: "Manuscript: Eusebius, Jerome and Prosper"
          },
          {
            name: "Victor of Tunnuna",
            work: "Chronicle",
            date: "c. 567",
            initials: "VT",
            link: "Continues",
            detail: "Victor continues Prosper's chronicle from 444 to 566/567, with particular attention to church politics. The overlapping years reflect the versions used by the continuators.",
            source: "https://www.brepols.net/products/IS-9782503017334-1",
            sourceLabel: "Critical edition: Victor and John"
          },
          {
            name: "John of Biclar",
            work: "Chronicle",
            date: "c. 590",
            initials: "JB",
            link: "Picks up the account",
            detail: "John begins where Victor ends and carries the narrative to 590. His own preface names Eusebius, Jerome, Prosper and Victor as the predecessors whose chronological sequence he is continuing.",
            source: "https://www.aymennaltamimi.com/p/the-chronicle-of-john-of-biclaro",
            sourceLabel: "John of Biclar: translated preface"
          }
        ]
      },
      {
        field: "texts",
        label: "Languages & texts",
        title: "The English Bible, generation by generation",
        description: "A Greek edition becomes an English translation, then a succession of revisions.",
        nodes: [
          {
            name: "Desiderius Erasmus",
            work: "Greek New Testament",
            date: "1516",
            initials: "DE",
            link: "Begins the thread",
            detail: "Erasmus publishes a printed Greek New Testament with a Latin translation. Tyndale later consults its revised editions of 1519 and 1522.",
            source: "https://www.tyndale.org/journals/tsj22/hooker.html",
            sourceLabel: "Tyndale as Translator"
          },
          {
            name: "William Tyndale",
            work: "English New Testament",
            date: "1526",
            initials: "WT",
            link: "Translates from Greek",
            detail: "Tyndale uses Erasmus's Greek text in producing his English New Testament. His later revisions and Old Testament work feed into subsequent English Bibles.",
            source: "https://www.tyndale.org/journals/tsj22/hooker.html",
            sourceLabel: "Tyndale's use of Erasmus"
          },
          {
            name: "John Rogers",
            work: "Matthew's Bible",
            date: "1537",
            initials: "JR",
            link: "Combines translations",
            detail: "Published under the name Thomas Matthew, this Bible combines Tyndale's work with Coverdale's. It brings together material from more than one translator, rather than simply reprinting Tyndale.",
            source: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/captions.html",
            sourceLabel: "Cambridge: the English Bible editions"
          },
          {
            name: "Miles Coverdale",
            work: "The Great Bible",
            date: "1539",
            initials: "MC",
            link: "Revises",
            detail: "Coverdale revises Matthew's Bible for the Great Bible. The new edition becomes the basis for another official revision under Matthew Parker.",
            source: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/captions.html",
            sourceLabel: "Cambridge: the Great Bible"
          },
          {
            name: "Matthew Parker & team",
            work: "Bishops' Bible",
            date: "1568",
            initials: "MP",
            link: "Revises",
            detail: "Parker oversees a revision of the Great Bible. The Bishops' Bible later serves as the prescribed base text for the King James translators.",
            source: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/forchurch.html",
            sourceLabel: "Cambridge: the Bishops' Bible"
          },
          {
            name: "King James translators",
            work: "King James Bible",
            date: "1611",
            initials: "KJ",
            link: "Revises & compares",
            detail: "The translators use the Bishops' Bible as their base, consulting Tyndale, Matthew, Coverdale, the Great Bible and Geneva. This milestone brings several earlier streams together.",
            source: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/captions.html",
            sourceLabel: "Cambridge: the translators' sources"
          },
          {
            name: "Revision committees",
            work: "Revised New Testament",
            date: "1881",
            initials: "RV",
            link: "Revises again",
            detail: "The Revised Version's preface explicitly describes its New Testament as a revision of the 1611 translation. Its Old Testament follows in 1885.",
            source: "https://bibleversion.org/bible/versions/modern-english/revised-version/english-revised-version-new-testament-preface-1881/",
            sourceLabel: "Revised Version: 1881 preface"
          }
        ]
      },
      {
        field: "places",
        label: "Archaeology & places",
        title: "Jericho: an interpretation tested and retested",
        description: "Excavation, disagreement and new measurements reshape the dating of one city's destruction.",
        nodes: [
          {
            name: "Sellin & Watzinger",
            work: "Early excavations",
            date: "1907-1909",
            initials: "SW",
            link: "Begins the thread",
            detail: "Ernst Sellin and Carl Watzinger undertake an early major excavation at Tell es-Sultan. Later teams return to the same site with new methods and questions.",
            source: "https://discovery.ucl.ac.uk/id/eprint/1349382/1/343298.pdf",
            sourceLabel: "UCL: history of excavation at Jericho"
          },
          {
            name: "John Garstang",
            work: "City and necropolis",
            date: "1930-1936",
            initials: "JG",
            link: "Re-excavates",
            detail: "Garstang returns to Jericho and interprets the destruction of City IV in relation to Joshua, proposing a date around 1400 BCE. This is his interpretation of the evidence.",
            source: "https://discovery.ucl.ac.uk/id/eprint/10081915/1/Sparks_Jericho%20in%20the%20Media_pre-publication.pdf",
            sourceLabel: "UCL: Jericho's excavation history"
          },
          {
            name: "Kathleen Kenyon",
            work: "New stratigraphic study",
            date: "1952-1958",
            initials: "KK",
            link: "Revises the dating",
            detail: "Kenyon re-excavates the site and places the destruction of the fortified Bronze Age city earlier, around the end of the Middle Bronze Age. Her conclusions challenge Garstang's identification.",
            source: "https://discovery.ucl.ac.uk/id/eprint/10081915/1/Sparks_Jericho%20in%20the%20Media_pre-publication.pdf",
            sourceLabel: "UCL: Kenyon's reassessment"
          },
          {
            name: "Bryant G. Wood",
            work: "Did the Israelites Conquer Jericho?",
            date: "1990",
            initials: "BW",
            link: "Challenges",
            detail: "Wood re-examines the published evidence and argues for a later destruction date around 1400 BCE, challenging Kenyon's chronology. His proposal becomes the subject of a published exchange.",
            source: "https://library.biblicalarchaeology.org/issue/september-october-1990/",
            sourceLabel: "BAR: the 1990 debate"
          },
          {
            name: "Piotr Bienkowski",
            work: "A Middle Bronze destruction",
            date: "1990",
            initials: "PB",
            link: "Disputes",
            detail: "Bienkowski directly disputes Wood's reassessment and defends a Middle Bronze Age destruction. The disagreement concerns the interpretation and dating of archaeological material.",
            source: "https://library.biblicalarchaeology.org/article/jericho-was-destroyed-in-the-middle-bronze-age-not-the-late-bronze-age/",
            sourceLabel: "Bienkowski's published response"
          },
          {
            name: "Bryant G. Wood",
            work: "Reply to Bienkowski",
            date: "1990",
            initials: "BW",
            link: "Replies",
            detail: "Wood answers Bienkowski's objections in the same journal issue. These are two opposing readings of the evidence, not successive stages of consensus.",
            source: "https://library.biblicalarchaeology.org/article/dating-jerichos-destruction-bienkowski-is-wrong-on-all-counts/",
            sourceLabel: "Wood's published reply"
          },
          {
            name: "Bruins & van der Plicht",
            work: "Radiocarbon results",
            date: "1995",
            initials: "BP",
            link: "Adds a new test",
            detail: "High-precision radiocarbon measurements of cereals and charcoal add an independent test of the destruction chronology. This is new evidence on the same question, rather than a personal reply to Wood.",
            source: "https://research.rug.nl/en/publications/tell-es-sultan-jericho-radiocarbon-results-of-short-lived-cereal-/",
            sourceLabel: "1995 radiocarbon study"
          }
        ]
      },
      {
        field: "reference",
        label: "Reference works",
        title: "A Hebrew lexicon, rebuilt across two centuries",
        description: "Follow a reference work through new languages, expanded editions and a new way to look up words.",
        nodes: [
          {
            name: "Wilhelm Gesenius",
            work: "Hebrew-German lexicon",
            date: "1810-1812",
            initials: "WG",
            link: "Begins the thread",
            detail: "Gesenius publishes his Hebrew-German lexicon. His continuing lexicographical work produces revised manuals and a larger thesaurus, rather than a single unchanging dictionary.",
            source: "https://www.loc.gov/resource/gdcmassbookdig.hebrewenglishlex00gese/?st=gallery",
            sourceLabel: "Robinson's preface: Gesenius's editions"
          },
          {
            name: "Wilhelm Gesenius",
            work: "Latin Lexicon Manuale",
            date: "1833",
            initials: "WG",
            link: "Reworks in Latin",
            detail: "The Latin manual carries Gesenius's lexicographical work to an international readership. This is the edition Robinson subsequently translates into English.",
            source: "https://www.hebraisztika.hu/downloads/BDB.pdf",
            sourceLabel: "BDB: historical preface"
          },
          {
            name: "Edward Robinson",
            work: "English translation",
            date: "1836",
            initials: "ER",
            link: "Translates",
            detail: "Robinson publishes an English translation of the 1833 Latin manual. BDB's preface identifies this translation as an earlier foundation for English-language Hebrew study.",
            source: "https://www.hebraisztika.hu/downloads/BDB.pdf",
            sourceLabel: "BDB: the 1836 translation"
          },
          {
            name: "Edward Robinson",
            work: "Revised English lexicon",
            date: "1854",
            initials: "ER",
            link: "Revises",
            detail: "Robinson revises his English Gesenius. The later BDB editors identify 1854 as the last revision, explaining why a new lexicon had become necessary.",
            source: "https://www.loc.gov/resource/gdcmassbookdig.hebrewenglishlex00gese/?st=gallery",
            sourceLabel: "Library of Congress: 1854 edition"
          },
          {
            name: "Brown, Driver & Briggs",
            work: "Hebrew & English Lexicon",
            date: "1906",
            initials: "BDB",
            link: "Rebuilds & expands",
            detail: "The three editors build a new lexicon on Gesenius as translated by Robinson, also consulting the larger thesaurus and later scholarship. Their names belong together at this collaborative milestone.",
            source: "https://books.google.com/books/about/A_Hebrew_and_English_Lexicon_of_the_Old.html?id=u0ATAAAAYAAJ",
            sourceLabel: "1906 edition: title and attribution"
          },
          {
            name: "Hendrickson edition",
            work: "BDB with Strong's numbers",
            date: "1996",
            initials: "BDB",
            link: "Adds lookup numbers",
            detail: "A later edition codes BDB to the numbering system of Strong's concordance. It links two reference tools; it does not mean Strong authored or revised the original BDB.",
            source: "https://catalogue.library.ucu.ac.ug/cgi-bin/koha/opac-detail.pl?biblionumber=55731&shelfbrowse_itemnumber=142115",
            sourceLabel: "Library catalogue: 1996 coded edition"
          }
        ]
      },
      {
        field: "theology",
        label: "Theology & philosophy",
        title: "Can an idea establish that God exists?",
        description: "An argument is challenged, answered and reformulated across nine centuries.",
        nodes: [
          {
            name: "Anselm of Canterbury",
            work: "Proslogion",
            date: "1077-1078",
            initials: "A",
            link: "Begins the thread",
            detail: "Anselm reasons from the idea of a being than which none greater can be conceived. His argument prompts an objection from another monk, Gaunilo.",
            source: "https://ccel.org/ccel/anselm/basic_works.all.html",
            sourceLabel: "Anselm: Proslogion"
          },
          {
            name: "Gaunilo",
            work: "On Behalf of the Fool",
            date: "c. 1079",
            initials: "G",
            link: "Challenges",
            detail: "Gaunilo challenges the inference from a conceived object to its existence, using the example of an excellent island. His reply directly addresses Anselm's argument.",
            source: "https://ccel.org/ccel/anselm/basic_works.all.html",
            sourceLabel: "Gaunilo: objection to Anselm"
          },
          {
            name: "Anselm of Canterbury",
            work: "Reply to Gaunilo",
            date: "c. 1080",
            initials: "A",
            link: "Answers",
            detail: "Anselm answers Gaunilo and defends the distinctive reasoning of the Proslogion. The reply is preserved alongside the original argument and objection; the exact dates of this exchange are approximate.",
            source: "https://ccel.org/ccel/anselm/basic_works.all.html",
            sourceLabel: "Anselm: reply to Gaunilo"
          },
          {
            name: "Ren\xE9 Descartes",
            work: "Fifth Meditation",
            date: "1641",
            initials: "RD",
            link: "Recasts the question",
            detail: "Centuries later, Descartes presents a different ontological argument based on perfection and necessary existence. This is a later formulation of the question, not a claim that he derived it from Anselm's reply.",
            source: "https://plato.stanford.edu/entries/ontological-arguments/",
            sourceLabel: "Stanford: Cartesian ontological arguments"
          },
          {
            name: "Immanuel Kant",
            work: "Critique of Pure Reason",
            date: "1781",
            initials: "IK",
            link: "Criticises the proof",
            detail: "Kant attacks ontological proofs, including the Cartesian approach, arguing that existence is not a real predicate that adds a property to a thing's concept.",
            source: "https://plato.stanford.edu/entries/ontological-arguments/",
            sourceLabel: "Stanford: objections to ontological arguments"
          },
          {
            name: "Norman Malcolm",
            work: "Anselm's Ontological Arguments",
            date: "1960",
            initials: "NM",
            link: "Reopens the argument",
            detail: "Malcolm accepts the force of the existence-as-perfection objection but distinguishes another argument in Anselm involving necessary existence. He reopens the discussion in modal terms.",
            source: "https://plato.stanford.edu/entries/ontological-arguments/",
            sourceLabel: "Stanford: modal versions of the argument"
          },
          {
            name: "Alvin Plantinga",
            work: "The Nature of Necessity",
            date: "1974",
            initials: "AP",
            link: "Reformulates",
            detail: "Plantinga examines modern modal arguments and develops a version using possible worlds and maximal greatness. The crucial possibility premise remains part of the philosophical debate.",
            source: "https://plato.stanford.edu/entries/ontological-arguments/",
            sourceLabel: "Stanford: Plantinga's modal argument"
          }
        ]
      }
    ],
    scopeNotes: [
      "Fifty editorial research threads, not fifty disjoint networks: authors and works may recur across fields.",
      "A two-work documented relationship is a valid short thread. Longer chains and branched inputs are retained where supported.",
      "Selection develops the existing five examples using library authors, cited reference works and external interlocutors. It is not a comprehensive mining of all held texts.",
      "Field membership classifies the thread, not an author credential, belief or recommendation.",
      "Author and work IDs here belong to this research dataset. Existing canonical IDs appear only in explicitly linked identity fields.",
      "Absence of a library match does not establish absence from the full private collection."
    ],
    inputFingerprints: {
      research: "1b1bf5c1f0615a5a7a5a249ef21dfd07492a0b53959cafa130ecb09e330f7841",
      population: "d05898a0887d0885368e83e75a87e704a191f9363aaf43f8f7c7f6fc1a0fd77c",
      profiles: "116899387fdac2089ffe5d5ad28be56bb4b877c298c2dac77a844f355c1723cc"
    }
  };

  // src/pages/teachers/scholars/landing/idea-chains.ts
  var chronicle = "https://www.ccel.org/ccel/pearse/morefathers/files/jerome_chronicle_01_prefaces.htm";
  var biclar = "https://www.aymennaltamimi.com/p/the-chronicle-of-john-of-biclaro";
  var bible = "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/captions.html";
  var jericho = "https://discovery.ucl.ac.uk/id/eprint/10081915/1/Sparks_Jericho%20in%20the%20Media_pre-publication.pdf";
  var lexicon = "https://www.loc.gov/resource/gdcmassbookdig.hebrewenglishlex00gese/?st=gallery";
  var anselm = "https://ccel.org/ccel/anselm/basic_works.all.html";
  var philosophy = "https://plato.stanford.edu/entries/ontological-arguments/";
  var IDEA_CHAINS = [
    { field: "history", label: "History", title: "A history that others kept writing", description: "Six historians carry a chronology from the ancient world into the early Middle Ages.", nodes: [
      { name: "Julius Africanus", work: "Chronographiae", date: "c. 221", initials: "JA", link: "Begins the thread", detail: "Africanus brought biblical and other chronologies into a universal history. His work survives in fragments; Eusebius names him among the earlier Christian chronographers he consulted.", source: chronicle, sourceLabel: "Eusebius and Jerome: prefaces" },
      { name: "Eusebius", work: "Chronicle", date: "c. 325", initials: "E", link: "Uses earlier chronology", detail: "Eusebius draws on Africanus and other predecessors, arranging the histories of different peoples into a comparative chronology. This is a documented use of sources, not a teacher-student relationship.", source: chronicle, sourceLabel: "Eusebius: preface to the Chronicle" },
      { name: "Jerome", work: "Latin Chronicle", date: "c. 380", initials: "J", link: "Translates & extends", detail: "Jerome translates Eusebius into Latin, adds material on Roman history and continues the account to 378. His preface explains his dual role as translator and author.", source: chronicle, sourceLabel: "Jerome: translator's preface" },
      { name: "Prosper of Aquitaine", work: "Epitome of the Chronicle", date: "c. 455", initials: "PA", link: "Continues", detail: "Prosper abridges and continues the Eusebius-Jerome chronicle. Successive versions carry the account into his own century; the fullest reaches 455.", source: "https://www.e-codices.ch/en/description/bge/lat0049/", sourceLabel: "Manuscript: Eusebius, Jerome and Prosper" },
      { name: "Victor of Tunnuna", work: "Chronicle", date: "c. 567", initials: "VT", link: "Continues", detail: "Victor continues Prosper's chronicle from 444 to 566/567, with particular attention to church politics. The overlapping years reflect the versions used by the continuators.", source: "https://www.brepols.net/products/IS-9782503017334-1", sourceLabel: "Critical edition: Victor and John" },
      { name: "John of Biclar", work: "Chronicle", date: "c. 590", initials: "JB", link: "Picks up the account", detail: "John begins where Victor ends and carries the narrative to 590. His own preface names Eusebius, Jerome, Prosper and Victor as the predecessors whose chronological sequence he is continuing.", source: biclar, sourceLabel: "John of Biclar: translated preface" }
    ] },
    { field: "texts", label: "Languages & texts", title: "The English Bible, generation by generation", description: "A Greek edition becomes an English translation, then a succession of revisions.", nodes: [
      { name: "Desiderius Erasmus", work: "Greek New Testament", date: "1516", initials: "DE", link: "Begins the thread", detail: "Erasmus publishes a printed Greek New Testament with a Latin translation. Tyndale later consults its revised editions of 1519 and 1522.", source: "https://www.tyndale.org/journals/tsj22/hooker.html", sourceLabel: "Tyndale as Translator" },
      { name: "William Tyndale", work: "English New Testament", date: "1526", initials: "WT", link: "Translates from Greek", detail: "Tyndale uses Erasmus's Greek text in producing his English New Testament. His later revisions and Old Testament work feed into subsequent English Bibles.", source: "https://www.tyndale.org/journals/tsj22/hooker.html", sourceLabel: "Tyndale's use of Erasmus" },
      { name: "John Rogers", work: "Matthew's Bible", date: "1537", initials: "JR", link: "Combines translations", detail: "Published under the name Thomas Matthew, this Bible combines Tyndale's work with Coverdale's. It brings together material from more than one translator, rather than simply reprinting Tyndale.", source: bible, sourceLabel: "Cambridge: the English Bible editions" },
      { name: "Miles Coverdale", work: "The Great Bible", date: "1539", initials: "MC", link: "Revises", detail: "Coverdale revises Matthew's Bible for the Great Bible. The new edition becomes the basis for another official revision under Matthew Parker.", source: bible, sourceLabel: "Cambridge: the Great Bible" },
      { name: "Matthew Parker & team", work: "Bishops' Bible", date: "1568", initials: "MP", link: "Revises", detail: "Parker oversees a revision of the Great Bible. The Bishops' Bible later serves as the prescribed base text for the King James translators.", source: "https://wwwe.lib.cam.ac.uk/CUL/exhibitions/KJV/forchurch.html", sourceLabel: "Cambridge: the Bishops' Bible" },
      { name: "King James translators", work: "King James Bible", date: "1611", initials: "KJ", link: "Revises & compares", detail: "The translators use the Bishops' Bible as their base, consulting Tyndale, Matthew, Coverdale, the Great Bible and Geneva. This milestone brings several earlier streams together.", source: bible, sourceLabel: "Cambridge: the translators' sources" },
      { name: "Revision committees", work: "Revised New Testament", date: "1881", initials: "RV", link: "Revises again", detail: "The Revised Version's preface explicitly describes its New Testament as a revision of the 1611 translation. Its Old Testament follows in 1885.", source: "https://bibleversion.org/bible/versions/modern-english/revised-version/english-revised-version-new-testament-preface-1881/", sourceLabel: "Revised Version: 1881 preface" }
    ] },
    { field: "places", label: "Archaeology & places", title: "Jericho: an interpretation tested and retested", description: "Excavation, disagreement and new measurements reshape the dating of one city's destruction.", nodes: [
      { name: "Sellin & Watzinger", work: "Early excavations", date: "1907-1909", initials: "SW", link: "Begins the thread", detail: "Ernst Sellin and Carl Watzinger undertake an early major excavation at Tell es-Sultan. Later teams return to the same site with new methods and questions.", source: "https://discovery.ucl.ac.uk/id/eprint/1349382/1/343298.pdf", sourceLabel: "UCL: history of excavation at Jericho" },
      { name: "John Garstang", work: "City and necropolis", date: "1930-1936", initials: "JG", link: "Re-excavates", detail: "Garstang returns to Jericho and interprets the destruction of City IV in relation to Joshua, proposing a date around 1400 BCE. This is his interpretation of the evidence.", source: jericho, sourceLabel: "UCL: Jericho's excavation history" },
      { name: "Kathleen Kenyon", work: "New stratigraphic study", date: "1952-1958", initials: "KK", link: "Revises the dating", detail: "Kenyon re-excavates the site and places the destruction of the fortified Bronze Age city earlier, around the end of the Middle Bronze Age. Her conclusions challenge Garstang's identification.", source: jericho, sourceLabel: "UCL: Kenyon's reassessment" },
      { name: "Bryant G. Wood", work: "Did the Israelites Conquer Jericho?", date: "1990", initials: "BW", link: "Challenges", detail: "Wood re-examines the published evidence and argues for a later destruction date around 1400 BCE, challenging Kenyon's chronology. His proposal becomes the subject of a published exchange.", source: "https://library.biblicalarchaeology.org/issue/september-october-1990/", sourceLabel: "BAR: the 1990 debate" },
      { name: "Piotr Bienkowski", work: "A Middle Bronze destruction", date: "1990", initials: "PB", link: "Disputes", detail: "Bienkowski directly disputes Wood's reassessment and defends a Middle Bronze Age destruction. The disagreement concerns the interpretation and dating of archaeological material.", source: "https://library.biblicalarchaeology.org/article/jericho-was-destroyed-in-the-middle-bronze-age-not-the-late-bronze-age/", sourceLabel: "Bienkowski's published response" },
      { name: "Bryant G. Wood", work: "Reply to Bienkowski", date: "1990", initials: "BW", link: "Replies", detail: "Wood answers Bienkowski's objections in the same journal issue. These are two opposing readings of the evidence, not successive stages of consensus.", source: "https://library.biblicalarchaeology.org/article/dating-jerichos-destruction-bienkowski-is-wrong-on-all-counts/", sourceLabel: "Wood's published reply" },
      { name: "Bruins & van der Plicht", work: "Radiocarbon results", date: "1995", initials: "BP", link: "Adds a new test", detail: "High-precision radiocarbon measurements of cereals and charcoal add an independent test of the destruction chronology. This is new evidence on the same question, rather than a personal reply to Wood.", source: "https://research.rug.nl/en/publications/tell-es-sultan-jericho-radiocarbon-results-of-short-lived-cereal-/", sourceLabel: "1995 radiocarbon study" }
    ] },
    { field: "reference", label: "Reference works", title: "A Hebrew lexicon, rebuilt across two centuries", description: "Follow a reference work through new languages, expanded editions and a new way to look up words.", nodes: [
      { name: "Wilhelm Gesenius", work: "Hebrew-German lexicon", date: "1810-1812", initials: "WG", link: "Begins the thread", detail: "Gesenius publishes his Hebrew-German lexicon. His continuing lexicographical work produces revised manuals and a larger thesaurus, rather than a single unchanging dictionary.", source: lexicon, sourceLabel: "Robinson's preface: Gesenius's editions" },
      { name: "Wilhelm Gesenius", work: "Latin Lexicon Manuale", date: "1833", initials: "WG", link: "Reworks in Latin", detail: "The Latin manual carries Gesenius's lexicographical work to an international readership. This is the edition Robinson subsequently translates into English.", source: "https://www.hebraisztika.hu/downloads/BDB.pdf", sourceLabel: "BDB: historical preface" },
      { name: "Edward Robinson", work: "English translation", date: "1836", initials: "ER", link: "Translates", detail: "Robinson publishes an English translation of the 1833 Latin manual. BDB's preface identifies this translation as an earlier foundation for English-language Hebrew study.", source: "https://www.hebraisztika.hu/downloads/BDB.pdf", sourceLabel: "BDB: the 1836 translation" },
      { name: "Edward Robinson", work: "Revised English lexicon", date: "1854", initials: "ER", link: "Revises", detail: "Robinson revises his English Gesenius. The later BDB editors identify 1854 as the last revision, explaining why a new lexicon had become necessary.", source: lexicon, sourceLabel: "Library of Congress: 1854 edition" },
      { name: "Brown, Driver & Briggs", work: "Hebrew & English Lexicon", date: "1906", initials: "BDB", link: "Rebuilds & expands", detail: "The three editors build a new lexicon on Gesenius as translated by Robinson, also consulting the larger thesaurus and later scholarship. Their names belong together at this collaborative milestone.", source: "https://books.google.com/books/about/A_Hebrew_and_English_Lexicon_of_the_Old.html?id=u0ATAAAAYAAJ", sourceLabel: "1906 edition: title and attribution" },
      { name: "Hendrickson edition", work: "BDB with Strong's numbers", date: "1996", initials: "BDB", link: "Adds lookup numbers", detail: "A later edition codes BDB to the numbering system of Strong's concordance. It links two reference tools; it does not mean Strong authored or revised the original BDB.", source: "https://catalogue.library.ucu.ac.ug/cgi-bin/koha/opac-detail.pl?biblionumber=55731&shelfbrowse_itemnumber=142115", sourceLabel: "Library catalogue: 1996 coded edition" }
    ] },
    { field: "theology", label: "Theology & philosophy", title: "Can an idea establish that God exists?", description: "An argument is challenged, answered and reformulated across nine centuries.", nodes: [
      { name: "Anselm of Canterbury", work: "Proslogion", date: "1077-1078", initials: "A", link: "Begins the thread", detail: "Anselm reasons from the idea of a being than which none greater can be conceived. His argument prompts an objection from another monk, Gaunilo.", source: anselm, sourceLabel: "Anselm: Proslogion" },
      { name: "Gaunilo", work: "On Behalf of the Fool", date: "c. 1079", initials: "G", link: "Challenges", detail: "Gaunilo challenges the inference from a conceived object to its existence, using the example of an excellent island. His reply directly addresses Anselm's argument.", source: anselm, sourceLabel: "Gaunilo: objection to Anselm" },
      { name: "Anselm of Canterbury", work: "Reply to Gaunilo", date: "c. 1080", initials: "A", link: "Answers", detail: "Anselm answers Gaunilo and defends the distinctive reasoning of the Proslogion. The reply is preserved alongside the original argument and objection; the exact dates of this exchange are approximate.", source: anselm, sourceLabel: "Anselm: reply to Gaunilo" },
      { name: "Ren\xE9 Descartes", work: "Fifth Meditation", date: "1641", initials: "RD", link: "Recasts the question", detail: "Centuries later, Descartes presents a different ontological argument based on perfection and necessary existence. This is a later formulation of the question, not a claim that he derived it from Anselm's reply.", source: philosophy, sourceLabel: "Stanford: Cartesian ontological arguments" },
      { name: "Immanuel Kant", work: "Critique of Pure Reason", date: "1781", initials: "IK", link: "Criticises the proof", detail: "Kant attacks ontological proofs, including the Cartesian approach, arguing that existence is not a real predicate that adds a property to a thing's concept.", source: philosophy, sourceLabel: "Stanford: objections to ontological arguments" },
      { name: "Norman Malcolm", work: "Anselm's Ontological Arguments", date: "1960", initials: "NM", link: "Reopens the argument", detail: "Malcolm accepts the force of the existence-as-perfection objection but distinguishes another argument in Anselm involving necessary existence. He reopens the discussion in modal terms.", source: philosophy, sourceLabel: "Stanford: modal versions of the argument" },
      { name: "Alvin Plantinga", work: "The Nature of Necessity", date: "1974", initials: "AP", link: "Reformulates", detail: "Plantinga examines modern modal arguments and develops a version using possible worlds and maximal greatness. The crucial possibility premise remains part of the philosophical debate.", source: philosophy, sourceLabel: "Stanford: Plantinga's modal argument" }
    ] }
  ];

  // design/scholar-connections/app.ts
  var data = knowledge_connections_default;
  var fields = Object.entries(data.fields);
  var tones = ["#9b7040", "#557b88", "#927052", "#768650", "#8a6c92"];
  var works = new Map(data.works.map((w) => [w.id, w]));
  var edges = new Map(data.connections.map((e) => [e.id, e]));
  var authors = new Map(data.authors.map((a) => [a.id, a]));
  var sources = new Map(data.sources.map((s) => [s.id, s]));
  var esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var human = (s) => s.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase());
  var authorName = (w) => w.authorIds.map((id) => authors.get(id).name).join(" \xB7 ");
  var initials = (w) => {
    const names = w.authorIds.map((id) => authors.get(id).name);
    if (names.length > 1) return names.map((n) => n.split(" ")[0][0]).join("").slice(0, 3);
    return names[0].split(/\s+/).filter((s) => !["of", "the", "and", "&"].includes(s.toLowerCase())).map((s) => s[0]).slice(0, 3).join("");
  };
  var relationTop = (a, b, fromBranches) => a.y === b.y ? a.y + 23 : (fromBranches ? b.y < a.y : a.y < b.y) ? Math.min(a.y, b.y) - 120 : Math.max(a.y, b.y) + 23;
  var params = new URLSearchParams(location.search);
  var active = Number(params.get("field") ?? 4);
  if (!fields[active]) active = 4;
  var selected = data.chains.find((c) => c.id === params.get("topic") && c.field === fields[active][0]) ?? null;
  var iconPaths = { book: "M4 3h6c2 0 2 2 2 2s0-2 2-2h6v16h-6c-2 0-2 2-2 2s0-2-2-2H4z M12 5v16", pen: "m4 20 4-1L20 7l-3-3L5 16z M14 7l3 3", branch: "M5 5v14 M5 12h9a5 5 0 0 0 5-5 M5 12h9a5 5 0 0 1 5 5 M2 3h6v4H2z M16 3h6v4h-6z M16 17h6v4h-6z", translation: "M3 5h11 M8 3v2 M5 8c1 4 4 7 8 9 M12 5c0 5-4 9-9 12 M14 21l4-11 4 11 M15 18h6", layers: "m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 17l10 5 10-5", archive: "M3 4h18v5H3z M5 9v12h14V9 M9 13h6", compass: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M16 8l-3 5-5 3 3-5z", quote: "M4 7h6v6H6c0 3 2 4 3 4 M14 7h6v6h-4c0 3 2 4 3 4", scale: "M12 3v18 M6 21h12 M3 7h18 M6 7l-4 7h8z M18 7l-4 7h8z", scroll: "M6 3h13v16c0 3-5 3-5 0H4c-3 0-3-5 0-5h2V5c0-3-4-3-4 0 M9 7h7 M9 11h7" };
  function icon(chain) {
    const title = chain.title.toLowerCase();
    const key = /compar|parallel|source|objection/.test(title) ? "branch" : /translat|latin|english|plant in jonah/.test(title) ? "translation" : /revis|edit|correct|rework/.test(title) ? "pen" : /excavat|archaeol|chronolog|radiometric/.test(title) ? "compass" : /preserv|quot|memori/.test(title) ? "quote" : /argument|reply|response|debate|freedom|grace/.test(title) ? "scale" : /lexic|diction|grammar|reference/.test(title) ? "book" : /report|archive/.test(title) ? "archive" : "scroll";
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[key]}"/></svg>`;
  }
  var approvedCaptions = {
    "history-baseline": ["Uses Africanus among earlier chronological sources", "Translates the chronology and extends it to 378", "Abridges the account and continues to 455", "Continues Prosper\u2019s account into the sixth century", "Takes up the sequence and carries it to 590"],
    "texts-baseline": ["Uses Erasmus\u2019s Greek editions to translate into English", "Combines Tyndale\u2019s translations with Coverdale\u2019s work", "Revises Matthew\u2019s Bible for an official edition", "Revises the Great Bible under Parker\u2019s oversight", "Uses the Bishops\u2019 Bible as a base; compares earlier translations", "Revises the 1611 translation with renewed textual study"],
    "places-baseline": ["Returns to the same site with a new excavation", "Reassesses the layers and dates the destruction earlier", "Challenges Kenyon\u2019s chronology with a later date", "Disputes Wood\u2019s reading of the archaeological evidence", "Answers Bienkowski\u2019s objections in a published reply", "Adds independent radiocarbon evidence on the same question"],
    "reference-baseline": ["Reworks his lexicography into a Latin manual", "Translates the Latin manual for English readers", "Revises and expands the English Gesenius", "Rebuilds the lexicon using Gesenius, Robinson and later scholarship", "Adds Strong\u2019s lookup numbers to a later BDB edition"],
    "theology-baseline": ["Challenges the move from an idea to actual existence", "Answers Gaunilo and defends the original reasoning", "Recasts the question through perfection and necessary existence", "Criticises the proof: existence adds no property to a concept", "Returns to Anselm through the idea of necessary existence", "Develops a modal argument using possible worlds"]
  };
  var iframe = document.querySelector("#preview");
  function mount() {
    const doc = iframe.contentDocument, win = iframe.contentWindow;
    const original = doc.querySelector("#connections .idea-lineage");
    if (!original) return false;
    if (doc.querySelector(".connections-mock")) return true;
    const css = doc.createElement("link");
    css.rel = "stylesheet";
    css.href = "/mockups/scholar-connections/mock.css";
    doc.head.append(css);
    const graph = doc.createElement("section");
    graph.className = "connections-mock";
    graph.setAttribute("aria-label", "Connections between works");
    original.hidden = true;
    original.style.display = "none";
    original.after(graph);
    let observer, revision = 0;
    const reduced = () => win.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const address = () => history.replaceState(null, "", `?field=${active}${selected ? `&topic=${selected.id}` : ""}`);
    async function change(next, focus) {
      const token = ++revision, old = graph.querySelector(".mock-content");
      if (old && !reduced()) {
        await old.animate([{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-10px)" }], { duration: 150, easing: "ease-in", fill: "forwards" }).finished.catch(() => {
        });
      }
      if (token !== revision) return;
      next();
      address();
      render();
      if (focus) graph.querySelector(focus)?.focus({ preventScroll: true });
      const content = graph.querySelector(".mock-content");
      if (content && !reduced()) content.animate([{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 380, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
    function render() {
      observer?.disconnect();
      const list = data.chains.filter((c) => c.field === fields[active][0]);
      graph.style.setProperty("--tone", tones[active]);
      graph.innerHTML = `<div class="mock-tabs" role="tablist" aria-label="Choose a field">${fields.map(([key, label], i) => `<button role="tab" type="button" data-field="${i}" aria-selected="${active === i}" aria-controls="topic-panel" tabindex="${active === i ? 0 : -1}">${esc(label)}<span class="tab-count">${data.chains.filter((c) => c.field === key).length}</span></button>`).join("")}</div><div class="mock-content" id="topic-panel" role="tabpanel" aria-label="${esc(fields[active][1])}"></div>`;
      graph.querySelectorAll("[data-field]").forEach((b) => {
        const i = Number(b.dataset.field);
        const choose = (n) => change(() => {
          active = n;
          selected = null;
        }, `[data-field="${n}"]`);
        b.onclick = () => void choose(i);
        b.onkeydown = (e) => {
          const n = e.key === "ArrowRight" ? (i + 1) % fields.length : e.key === "ArrowLeft" ? (i + fields.length - 1) % fields.length : e.key === "Home" ? 0 : e.key === "End" ? fields.length - 1 : -1;
          if (n >= 0) {
            e.preventDefault();
            void choose(n);
          }
        };
      });
      const content = graph.querySelector(".mock-content");
      if (!selected) {
        content.innerHTML = `<div class="chooser-head"><h4>Choose a thread to follow.</h4><p>${list.length} topics \xB7 Select one to unfold its works and connections.</p></div><div class="topic-grid">${list.map((c, i) => `<button type="button" class="topic-card" data-topic="${c.id}" aria-label="${esc(c.title)}"><span class="topic-icon">${icon(c)}</span><strong>${esc(c.title)}</strong><span class="topic-count">${c.workIds.length} works <span>\xB7</span> ${c.edgeIds.length} ${c.edgeIds.length === 1 ? "connection" : "connections"}</span><span class="topic-open" aria-hidden="true">\u2197</span></button>`).join("")}</div>`;
        content.querySelectorAll("[data-topic]").forEach((b) => b.onclick = () => void change(() => {
          selected = data.chains.find((c) => c.id === b.dataset.topic);
        }, "[data-back]"));
        return;
      }
      const chain = selected, chainEdges = chain.edgeIds.map((id) => edges.get(id));
      const linear = chainEdges.length === chain.workIds.length - 1 && chainEdges.every((e) => chain.workIds.indexOf(e.toWorkId) === chain.workIds.indexOf(e.fromWorkId) + 1);
      content.innerHTML = `<div class="thread-head"><button type="button" data-back>${icon({ title: "parallel", id: "", field: "", workIds: [], edgeIds: [] })}<span>All ${list.length} topics</span></button><div><h4>${esc(chain.title)}</h4><p>${chain.workIds.length} works \xB7 ${chain.edgeIds.length} connections${linear ? "" : " \xB7 Branching thread"}</p></div></div><div class="plot"><div class="viewport" tabindex="0" role="region" aria-label="Drag to explore connections sideways"><div class="canvas"><div class="drawing"></div></div></div><div class="pill-space"><div class="pill" role="scrollbar" tabindex="0" aria-label="Scroll connections" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div></div></div><div class="detail" hidden></div>`;
      content.querySelector("[data-back]").onclick = () => void change(() => {
        selected = null;
      }, `[data-topic="${chain.id}"]`);
      const viewport = content.querySelector(".viewport"), canvas = content.querySelector(".canvas"), drawing = content.querySelector(".drawing");
      let width;
      const positions = /* @__PURE__ */ new Map();
      if (linear) {
        width = Math.max(viewport.clientWidth, 760, (chain.workIds.length - 1) * 288 + 220);
        chain.workIds.forEach((id, i) => positions.set(id, { x: 110 + i * (width - 220) / (chain.workIds.length - 1), y: 148 }));
      } else {
        const ranks = new Map(chain.workIds.map((id) => [id, 0]));
        for (let pass = 0; pass < chain.workIds.length; pass++) for (const e of chainEdges) ranks.set(e.toWorkId, Math.max(ranks.get(e.toWorkId), ranks.get(e.fromWorkId) + 1));
        const maxRank = Math.max(...ranks.values()), maxRows = Math.max(...Array.from({ length: maxRank + 1 }, (_, r) => chain.workIds.filter((id) => ranks.get(id) === r).length));
        width = Math.max(viewport.clientWidth, maxRank * 620 + 220);
        for (let rank = 0; rank <= maxRank; rank++) {
          const group = chain.workIds.filter((id) => ranks.get(id) === rank);
          group.forEach((id, i) => positions.set(id, { x: 110 + rank * (width - 220) / maxRank, y: 148 + (maxRows - 1) * 150 + (i - (group.length - 1) / 2) * 300 }));
        }
      }
      canvas.style.width = width + "px";
      canvas.style.height = (linear ? 345 : 1e3) + "px";
      const edgeMarkup = chainEdges.map((e, i) => {
        const a = positions.get(e.fromWorkId), b = positions.get(e.toWorkId), mid = (a.x + b.x) / 2;
        const path = `M${a.x + 22},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x - 24},${b.y}`;
        return `<path data-edge="${e.id}" d="${path}" pathLength="1" marker-end="url(#connection-arrow)" style="--delay:${i * 95}ms"/>`;
      }).join("");
      drawing.innerHTML = `<svg class="edge-lines" width="${width}" height="1000" aria-hidden="true"><defs><marker id="connection-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 5 3 0 6" fill="none"/></marker></defs>${edgeMarkup}</svg>${chain.workIds.map((id, i) => {
        const w = works.get(id), p = positions.get(id);
        return `<div class="node" data-work="${id}" style="left:${p.x}px;top:${p.y}px;--delay:${i * 85}ms"><div class="identity"><small>${esc(w.dateLabel)}</small><strong>${esc(authorName(w))}</strong><em>${esc(w.title)}</em></div><button type="button" class="dot" data-node="${id}" aria-label="${esc(authorName(w) + ": " + w.title)}" aria-expanded="false">${esc(initials(w))}</button></div>`;
      }).join("")}${chainEdges.map((e, i) => {
        const a = positions.get(e.fromWorkId), b = positions.get(e.toWorkId), flat = a.y === b.y;
        return `<button type="button" class="relation" data-connection="${e.id}" style="left:${(a.x + b.x) / 2}px;top:${relationTop(a, b, chainEdges.filter((other) => other.fromWorkId === e.fromWorkId).length > 1)}px;width:${Math.min(360, b.x - a.x - 54)}px;--delay:${i * 95 + 140}ms" aria-label="${esc(human(e.relationship))}: view evidence"><strong>${esc(chain.id.endsWith("-baseline") ? IDEA_CHAINS.find((c) => c.field === chain.field)?.nodes[i + 1]?.link ?? human(e.relationship) : human(e.relationship))}</strong><p>${esc(approvedCaptions[chain.id]?.[i] ?? e.claim)}</p></button>`;
      }).join("")}`;
      function fit() {
        drawing.style.transform = "";
        const top = viewport.getBoundingClientRect().top;
        const first = Math.min(...Array.from(drawing.querySelectorAll(".identity")).map((n) => n.getBoundingClientRect().top - top));
        const offset = Math.max(0, 20 - first);
        drawing.style.transform = `translateY(${offset}px)`;
        const bottom = Math.max(...Array.from(drawing.querySelectorAll(".relation,.dot")).map((n) => n.getBoundingClientRect().bottom - top));
        canvas.style.height = Math.max(345, bottom + 48) + "px";
      }
      fit();
      void doc.fonts.ready.then(() => {
        if (canvas.isConnected) fit();
      });
      const rail = content.querySelector(".pill-space"), pill = content.querySelector(".pill");
      const update = () => {
        const max = viewport.scrollWidth - viewport.clientWidth, w = rail.clientWidth, thumb = Math.min(w, Math.max(44, w * viewport.clientWidth / viewport.scrollWidth));
        pill.style.width = thumb + "px";
        pill.style.left = (max > 0 ? (w - thumb) * viewport.scrollLeft / max : 0) + "px";
        pill.setAttribute("aria-valuenow", String(Math.round(max > 0 ? 100 * viewport.scrollLeft / max : 0)));
        rail.hidden = max <= 0;
      };
      viewport.onscroll = update;
      observer = new ResizeObserver(() => {
        fit();
        update();
      });
      observer.observe(viewport);
      drawing.querySelectorAll(".identity,.relation").forEach((n) => observer.observe(n));
      requestAnimationFrame(() => {
        fit();
        update();
      });
      const keys = (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          viewport.scrollLeft += e.key === "ArrowRight" ? 180 : -180;
        }
        if (e.key === "Home") {
          e.preventDefault();
          viewport.scrollLeft = 0;
        }
        if (e.key === "End") {
          e.preventDefault();
          viewport.scrollLeft = viewport.scrollWidth;
        }
      };
      viewport.onkeydown = (e) => {
        if (e.target === viewport) keys(e);
        if (e.key === "Escape") content.querySelector("[data-back]")?.click();
      };
      pill.onkeydown = keys;
      let drag = null;
      viewport.onpointerdown = (e) => {
        if (e.button !== 0 || e.target.closest("button,a")) return;
        drag = { x: e.clientX, left: viewport.scrollLeft };
        viewport.setPointerCapture(e.pointerId);
        viewport.classList.add("dragging");
      };
      viewport.onpointermove = (e) => {
        if (drag) viewport.scrollLeft = drag.left + drag.x - e.clientX;
      };
      const end = () => {
        drag = null;
        viewport.classList.remove("dragging");
      };
      viewport.onpointerup = end;
      viewport.onpointercancel = end;
      viewport.onlostpointercapture = end;
      let thumbStart = null;
      pill.onpointerdown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        thumbStart = { x: e.clientX, left: viewport.scrollLeft };
        pill.setPointerCapture(e.pointerId);
      };
      pill.onpointermove = (e) => {
        if (thumbStart) {
          const travel = rail.clientWidth - pill.offsetWidth;
          if (travel > 0) viewport.scrollLeft = thumbStart.left + (e.clientX - thumbStart.x) * (viewport.scrollWidth - viewport.clientWidth) / travel;
        }
      };
      const stop = () => thumbStart = null;
      pill.onpointerup = stop;
      pill.onpointercancel = stop;
      pill.onlostpointercapture = stop;
      rail.onpointerdown = (e) => {
        if (e.target === pill) return;
        const r = rail.getBoundingClientRect(), travel = rail.clientWidth - pill.offsetWidth;
        viewport.scrollLeft = Math.max(0, Math.min(1, (e.clientX - r.left - pill.offsetWidth / 2) / travel)) * (viewport.scrollWidth - viewport.clientWidth);
      };
      const evidence = (e) => `<article class="evidence"><small>${esc(human(e.relationship))} \xB7 ${esc(e.reviewStatus === "carried-forward" ? "Passage review pending" : human(e.reviewStatus))}</small><p>${esc(e.claim)}</p>${e.evidence.map((ref) => {
        const s = sources.get(ref.sourceId);
        return `<a href="${esc(s.url)}" target="_blank" rel="noreferrer">${esc(s.title)} \u2197</a><p class="evidence-locator">${esc(ref.locator)} \xB7 ${esc(human(s.access))}</p>`;
      }).join("")}<p class="evidence-note">${esc(e.caveat)} ${esc(e.evidenceScope)}</p></article>`;
      function detail(title, html, origin) {
        const panel = content.querySelector(".detail");
        const was = origin.getAttribute("aria-expanded") === "true";
        content.querySelectorAll("[aria-expanded]").forEach((n) => n.setAttribute("aria-expanded", "false"));
        panel.hidden = was;
        if (was) return;
        origin.setAttribute("aria-expanded", "true");
        panel.innerHTML = `<div><h4>${esc(title)}</h4>${html}</div><button type="button" aria-label="Close details">\xD7</button>`;
        panel.querySelector("button").onclick = () => {
          panel.hidden = true;
          origin.setAttribute("aria-expanded", "false");
          origin.focus({ preventScroll: true });
        };
      }
      content.querySelectorAll("[data-node]").forEach((b) => b.onclick = () => {
        const w = works.get(b.dataset.node), related = chainEdges.filter((e) => e.fromWorkId === w.id || e.toWorkId === w.id);
        detail(w.title, `<p>${esc(authorName(w))} \xB7 ${esc(w.dateLabel)}</p><p class="evidence-note">${esc(human(w.recordKind))} \xB7 Exact library edition not confirmed.</p>${related.map(evidence).join("")}`, b);
      });
      content.querySelectorAll("[data-connection]").forEach((b) => b.onclick = () => {
        const e = edges.get(b.dataset.connection);
        detail(`${works.get(e.fromWorkId).title} \u2192 ${works.get(e.toWorkId).title}`, evidence(e), b);
      });
    }
    css.addEventListener("load", () => render());
    render();
    doc.querySelector("#connections")?.scrollIntoView({ block: "start" });
    let resizeFrame = 0;
    win.addEventListener("resize", () => {
      win.cancelAnimationFrame(resizeFrame);
      resizeFrame = win.requestAnimationFrame(() => render());
    });
    return true;
  }
  iframe.addEventListener("load", () => {
    const doc = iframe.contentDocument;
    if (mount()) return;
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(doc, { subtree: true, childList: true });
  });
})();
