import type { Span } from "@/lib/study";

export const APOLOGETICS_ANCHOR: Span = [60003015, 60003016];

/** Christian starting points; historical arguments and interfaith comparisons require their own sourced studies. */
export const FOUNDATIONS: {
  id: string; label: string; title: string; claim: string; question: string; response: string; ask: string;
  refs: { span: Span; note: string }[];
}[] = [
  { id: "god", label: "God", title: "One God. Father, Son and Holy Spirit.",
    claim: "Historic Christian faith confesses one God, eternally Father, Son and Holy Spirit. The doctrine of the Trinity holds together the oneness of God and the biblical witness to the Father, the Son and the Spirit.",
    question: "Does the Trinity mean three gods?",
    response: "Christians distinguish who God is from what God is: three persons, one divine being. Begin with that actual claim, then read the passages together. An analogy can help a conversation, but it cannot carry the whole doctrine.",
    ask: "When you hear the word Trinity, what do you understand Christians to mean?",
    refs: [{ span: [5006004, 5006005], note: "The Lord is one" }, { span: [40028018, 40028020], note: "Father, Son and Holy Spirit" }, { span: [43001001, 43001003], note: "The Word and God" }] },
  { id: "jesus", label: "Jesus Christ", title: "Who do you say that I am?",
    claim: "The Christian confession centres on Jesus Christ: the eternal Son who became human, revealed the Father, and calls people to follow him. His identity gives his teaching and saving work their significance.",
    question: "Was Jesus simply a great teacher?",
    response: "Start with what the Gospel accounts actually say about him. John presents the Word becoming flesh and records Thomas addressing the risen Jesus as Lord and God. The next question is how to understand and assess that testimony.",
    ask: "Which account of Jesus have you read, and what do you think its author is claiming about him?",
    refs: [{ span: [43001014, 43001018], note: "The Word became flesh" }, { span: [43020024, 43020031], note: "Thomas and the purpose of John's Gospel" }, { span: [51001015, 51001020], note: "Christ and the whole creation" }] },
  { id: "cross", label: "The cross", title: "Love that bears the cost.",
    claim: "At the centre of the gospel is Christ's death for sins. Christian Scripture presents the cross as God's action to reconcile people to himself, with Jesus giving his life willingly.",
    question: "Why would forgiveness involve the cross?",
    response: "Explain the Christian account of sin, justice, mercy and reconciliation before moving to an analogy. Read the cross through Jesus' own language of giving his life and Paul's language of reconciliation. Christian traditions develop these images in different ways.",
    ask: "What do you think forgiveness must do with the harm and guilt of wrongdoing?",
    refs: [{ span: [41010042, 41010045], note: "The Son of man gives his life" }, { span: [45005006, 45005011], note: "God's love and reconciliation" }, { span: [47005018, 47005021], note: "Reconciled through Christ" }] },
  { id: "resurrection", label: "Resurrection", title: "The claim on which everything turns.",
    claim: "Christianity proclaims that Jesus was raised bodily from the dead. Paul treats the resurrection as essential to the gospel and the believer's hope, rather than a decorative addition to Jesus' moral teaching.",
    question: "Does the resurrection really matter?",
    response: "Paul makes the stakes explicit: if Christ has not been raised, faith is vain. Begin with the testimony and the claim being made. A historical case then needs careful work on the sources, alternative explanations and the strength of each inference.",
    ask: "What would count as a good reason for you to take a claim about the resurrection seriously?",
    refs: [{ span: [46015003, 46015008], note: "The message Paul received and passed on" }, { span: [46015012, 46015022], note: "Why the resurrection matters" }, { span: [42024036, 42024043], note: "The risen Jesus among his disciples" }] },
  { id: "scripture", label: "Scripture", title: "Read closely. Ask good questions.",
    claim: "Christians receive Scripture as God's word and read it in context. Questions about inspiration, manuscript transmission, translation and interpretation are related, but each asks for a different kind of evidence.",
    question: "What does it mean to say the Bible is trustworthy?",
    response: "First identify the question. A translation difference, a manuscript variant, an alleged contradiction and a dispute over meaning need different answers. Show the passage and its context, then bring sources suited to the specific objection.",
    ask: "Is there a particular verse, manuscript claim or translation difference you would like to examine together?",
    refs: [{ span: [55003014, 55003017], note: "Scripture's place in teaching and formation" }, { span: [42001001, 42001004], note: "Luke explains his purpose and method" }, { span: [44017010, 44017012], note: "Examining the Scriptures" }] },
  { id: "grace", label: "Grace & new life", title: "A gift that changes a life.",
    claim: "The gospel announces salvation as God's gift through Jesus Christ. Ephesians places grace before boasting and then speaks of a life created for good works; Christian witness joins the message to a transformed way of living.",
    question: "If salvation is a gift, why do good works matter?",
    response: "Read Ephesians 2:8–10 as a whole. God's grace grounds salvation, and the passage goes on to describe good works as part of the life God gives. Explain both the gift and its fruit without collapsing one into the other.",
    ask: "How do you understand the relationship between God's mercy and the way a person lives?",
    refs: [{ span: [49002008, 49002010], note: "Grace, faith and good works" }, { span: [56003003, 56003008], note: "Mercy and a renewed life" }, { span: [43013034, 43013035], note: "Love as the mark of discipleship" }] },
];

export const CONVERSATION_STEPS = [
  { title: "Listen", line: "Understand the person before answering the position.", detail: "Invite them to explain what they believe and why it matters to them. Reflect it back in words they recognise.", prompt: "What has most shaped your understanding of God?", span: [59001019, 59001020] as Span },
  { title: "Clarify", line: "Find the question you are actually discussing.", detail: "Define the important terms, distinguish a claim from its evidence, and take one question at a time.", prompt: "When you say that, what exactly do you mean?", span: [20018013, 20018017] as Span },
  { title: "Give a reason", line: "Connect a clear Christian claim to its grounds.", detail: "Read the passage in context, explain the reasoning, and address the strongest version of the objection. Say when a question needs more study.", prompt: "Could we read the passage together and examine the claim?", span: APOLOGETICS_ANCHOR },
  { title: "Invite", line: "Leave room for a next conversation and a lived response.", detail: "Offer to read a Gospel together, continue investigating a question, or pray if they welcome it. Let patient love accompany the words.", prompt: "Would you like to keep exploring this with me?", span: [51004005, 51004006] as Span },
];

export const ISLAM_STUDY_QUESTIONS = [
  "Who is Jesus?", "God's oneness and the Trinity", "The crucifixion and resurrection",
  "Scripture and its transmission", "Revelation and prophethood", "Sin, grace and salvation",
];
