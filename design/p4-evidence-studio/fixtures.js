window.FIXTURES = {
  "synthetic": true,
  "claims": {
    "fixture:claim-1": "[Editorial response placeholder. A reviewed answer would be written here after claim-specific review.]",
    "fixture:claim-2": "[Alternative interpretation placeholder. No position is attributed to a real author.]"
  },
  "evidence": {
    "fixture:evidence-1": {
      "claimId": "fixture:claim-1",
      "author": "Example Author A (fictional)",
      "translator": "Example Translator (fictional)",
      "editor": null,
      "editionDate": null,
      "quote": "[Synthetic excerpt placeholder. No acquired source text is reproduced.]",
      "locator": "Demonstration section A; no real page or timestamp asserted",
      "sourceUrl": "https://example.org/fixture-source-a"
    },
    "fixture:evidence-2": {
      "claimId": "fixture:claim-2",
      "author": "Example Author B (fictional)",
      "translator": null,
      "editor": null,
      "editionDate": null,
      "quote": "[Second synthetic excerpt placeholder. It does not establish an opposing doctrine.]",
      "locator": null,
      "sourceUrl": null
    }
  },
  "products": [
    {
      "templateId": "answer",
      "evidenceIds": [
        "fixture:evidence-1"
      ],
      "claimIds": [
        "fixture:claim-1"
      ]
    },
    {
      "templateId": "passage",
      "evidenceIds": [
        "fixture:evidence-1"
      ],
      "claimIds": [
        "fixture:claim-1"
      ]
    },
    {
      "templateId": "comparison",
      "evidenceIds": [
        "fixture:evidence-1",
        "fixture:evidence-2"
      ],
      "claimIds": [
        "fixture:claim-1"
      ]
    },
    {
      "templateId": "dossier",
      "evidenceIds": [
        "fixture:evidence-1"
      ],
      "claimIds": [
        "fixture:claim-1"
      ]
    },
    {
      "templateId": "lesson",
      "evidenceIds": [
        "fixture:evidence-1"
      ],
      "claimIds": [
        "fixture:claim-1"
      ]
    }
  ]
};
