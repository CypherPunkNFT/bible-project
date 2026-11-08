"""Odd one out: building sets around a near-miss odd item (design 5.4), with the seed sets and the veto list."""
import hashlib
import itertools
import random
from collections import Counter

from ooo_check import also_phrases, check_set
from ooo_model import DIFFICULTIES, Candidate, Item, Prop, Rule

TARGETS = {"person": {"easy": 80, "medium": 80, "hard": 80}, "place": {"easy": 40, "medium": 40, "hard": 40},
           "book": {"easy": 25, "medium": 25, "hard": 10}}
NEAR_MISS = {"easy": 0.5, "medium": 0.25, "hard": 0.10}  # share of the closest outsiders an odd item comes from
MAX_ITEM_USES = 6
MAX_RULE_SHARE = 0.15
MEMBER_POOL = 16  # members most like the odd item that the three are chosen from
MAX_TRIES = 120  # combinations of three tried per odd item
SAMPLE = 30  # members an outsider is compared with when ranking near misses
MIN_SETS = 20  # a kind and difficulty with fewer is not offered (design 5.4)
SEED = 23


class BuildError(Exception):
    """The build must stop: a seed set fails, a veto is stale, or the data contradicts the curated files."""


def set_id(rule: str, polarity: str, items: list[str]) -> str:
    digest = hashlib.sha1(f"{rule}|{polarity}|{','.join(sorted(items))}".encode()).hexdigest()
    return f"ooo-{digest[:6]}"


class Builder:
    """Builds every set of one kind, keeping the variety limits across its difficulties."""

    def __init__(self, kind: str, items: list[Item], props: dict[str, Prop], rules: list[Rule],
                 book_words: set[str], veto: dict[str, str]):
        self.kind, self.props, self.book_words, self.veto = kind, props, book_words, veto
        self.items = {item.id: item for item in items}
        self.rules = {rule.id: rule for rule in rules if rule.kind == kind}
        self.similar = [p.id for p in props.values() if p.use == "rule" and p.tier <= 2]
        # The variety limits count within one difficulty, the pool a round is drawn from (design 5.4 step 4).
        self.uses: Counter = Counter()  # (difficulty, item id) -> sets
        self.rule_counts: Counter = Counter()  # (difficulty, rule id) -> sets
        self.quads: set[frozenset] = set()
        self.odd_for_rule: set[tuple[str, str]] = set()  # an item is the odd one for a given rule only once
        self.passed: set[str] = set()  # every id that passed the checks, vetoed or not (stale-veto check)
        self.sets: list[Candidate] = []

    def judge(self, candidate: Candidate):
        members = [self.items[i] for i in candidate.items]
        return check_set(members, candidate.odd, self.rules[candidate.rule], candidate.polarity,
                         candidate.difficulty, self.props, self.book_words, candidate.labels)

    def keep(self, candidate: Candidate, also: list[str]) -> None:
        candidate.also = also
        self.sets.append(candidate)
        self.uses.update((candidate.difficulty, i) for i in candidate.items)
        self.rule_counts[(candidate.difficulty, candidate.rule)] += 1
        self.quads.add(frozenset(candidate.items))
        self.odd_for_rule.add((candidate.rule, candidate.odd))

    def add_seed(self, seed: dict) -> None:
        missing = [i for i in seed["items"] if i not in self.items]
        if missing or seed["rule"] not in self.rules:
            raise BuildError(f"seed set {seed['items']}: unknown items {missing} or rule {seed['rule']!r}")
        candidate = Candidate(self.kind, seed["difficulty"], list(seed["items"]), seed["odd"], seed["rule"],
                              seed["polarity"], dict(seed.get("labels", {})), seed=True)
        verdict = self.judge(candidate)
        if not verdict.ok:
            raise BuildError(f"seed set {seed['items']} fails its checks: {verdict.reason}")
        self.keep(candidate, also_phrases(verdict.also))

    def agreement(self, a: Item, b: Item, rule: str) -> int:
        return sum(1 for p in self.similar if p != rule and a.value(p) is True and b.value(p) is True)

    def attempts(self, rule: Rule, polarity: str, difficulty: str, rng: random.Random):
        """Candidates for one rule and polarity, closest near misses first (design 5.4 steps 1-3)."""
        share = polarity == "members-share"
        pool = sorted((i for i in self.items.values() if i.fame.get(difficulty)), key=lambda i: i.id)
        members = [i for i in pool if i.value(rule.id) is share]
        outsiders = [i for i in pool if i.value(rule.id) is (not share)]
        if len(members) < 3 or not outsiders:
            return
        sample = members[:: max(1, len(members) // SAMPLE)][:SAMPLE]
        ranked = sorted(outsiders, key=lambda o: (-sum(self.agreement(o, m, rule.id) for m in sample), o.id))
        window = ranked[: max(3, round(len(ranked) * NEAR_MISS[difficulty]))]
        rng.shuffle(window)
        for odd in window:
            closest = sorted(members, key=lambda m: (-self.agreement(odd, m, rule.id), m.id))[:MEMBER_POOL]
            combos = list(itertools.combinations(closest, 3))
            rng.shuffle(combos)
            for three in combos[:MAX_TRIES]:
                ids = [m.id for m in three] + [odd.id]
                yield Candidate(self.kind, difficulty, ids, odd.id, rule.id, polarity)

    def acceptable(self, candidate: Candidate) -> bool:
        if frozenset(candidate.items) in self.quads or self.capped(candidate):
            return False
        if (candidate.rule, candidate.odd) in self.odd_for_rule:
            return False
        return all(self.uses[(candidate.difficulty, i)] < MAX_ITEM_USES for i in candidate.items)

    def capped(self, candidate: Candidate) -> bool:
        """No rule supplies more than its share of a kind's sets (design 5.4 step 4), nor of one difficulty's."""
        whole = sum(count for (_, rule), count in self.rule_counts.items() if rule == candidate.rule)
        here = self.rule_counts[(candidate.difficulty, candidate.rule)]
        share = sum(TARGETS[self.kind].values()) * MAX_RULE_SHARE
        return whole >= share or here >= max(3, share / 2)

    def build(self, difficulty: str) -> None:
        """Round-robin over the rules, one accepted set each turn, until the target is met (design 5.4 step 4)."""
        rng = random.Random(f"{SEED}:{self.kind}:{difficulty}")
        target = TARGETS[self.kind][difficulty]
        streams = [self.attempts(rule, polarity, difficulty, rng) for rule in self.rules.values()
                   if rule.allowed(difficulty) for polarity in rule.polarities()]
        made = sum(1 for s in self.sets if s.difficulty == difficulty)
        while streams and made < target:
            for stream in list(streams):
                if made >= target:
                    break
                if self.next_from(stream):
                    made += 1
                else:
                    streams.remove(stream)

    def next_from(self, stream) -> bool:
        """Pull candidates from one stream until one is kept (True) or the stream runs dry (False)."""
        for candidate in stream:
            if not self.acceptable(candidate):
                if self.capped(candidate):
                    return False
                continue
            verdict = self.judge(candidate)
            if not verdict.ok:
                continue
            identity = set_id(candidate.rule, candidate.polarity, candidate.items)
            self.passed.add(identity)
            if identity in self.veto:
                continue
            self.keep(candidate, also_phrases(verdict.also))
            return True
        return False


def build_kind(kind: str, items: list[Item], props: dict[str, Prop], rules: list[Rule], book_words: set[str],
               seeds: list[dict], veto: dict[str, str]) -> Builder:
    builder = Builder(kind, items, props, rules, book_words, veto)
    for seed in seeds:
        if seed["kind"] == kind:
            builder.add_seed(seed)
    for difficulty in reversed(DIFFICULTIES):  # the scarcest first, so Easy cannot use up the rule caps
        builder.build(difficulty)
    return builder


def check_veto(veto: dict[str, str], builders: list[Builder]) -> None:
    passed = set().union(*(b.passed for b in builders)) | {set_id(s.rule, s.polarity, s.items) for b in builders for s in b.sets}
    stale = sorted(set(veto) - passed)
    if stale:
        raise BuildError(f"veto.json names sets the build no longer makes: {', '.join(stale)}; remove them")
