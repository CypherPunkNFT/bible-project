"""Bounded document quality metrics; flags do not diagnose transcription errors."""
import hashlib
import re
import unicodedata
from collections import Counter

VERSION = 'la02-quality-v1'
MAX_LINES = 50000


class Quality:
    def __init__(self):
        self.characters = Counter()
        self.lines = {}
        self.line_count = self.repeated_lines = self.blocks = self.capped_lines = 0
        self.block_hashes = set()
        self.repeated_blocks = self.capped_blocks = 0

    def add(self,text,text_hash=None):
        self.blocks += 1
        block_hash = text_hash or hashlib.sha256(text.encode('utf-8')).hexdigest()
        if block_hash in self.block_hashes: self.repeated_blocks += 1
        elif len(self.block_hashes)<MAX_LINES: self.block_hashes.add(block_hash)
        else: self.capped_blocks += 1
        self.characters.update(text)
        for line in text.splitlines():
            line = line.strip()
            if not line: continue
            self.line_count += 1
            key = hashlib.sha256(line.encode('utf-8')).digest()
            if key in self.lines:
                self.repeated_lines += 1
            elif len(self.lines) < MAX_LINES:
                self.lines[key] = True
            else:
                self.capped_lines += 1

    def result(self):
        total = sum(self.characters.values())
        scripts = Counter()
        controls = letters = 0
        for char,count in self.characters.items():
            cat = unicodedata.category(char)
            if cat == 'Cc' and char not in '\t\r\n': controls += count
            if cat.startswith('L'):
                letters += count
                name = unicodedata.name(char,'')
                script = next((s for s in ('LATIN','GREEK','CYRILLIC','HEBREW','ARABIC','CJK','HANGUL') if s in name),'OTHER')
                scripts[script] += count
        replacement = self.characters['\ufffd']
        flags = []
        if not total: flags.append('empty-analysed-text')
        if total and replacement/total > .001: flags.append('replacement-character-rate-over-0.1-percent')
        if total and controls/total > .001: flags.append('control-character-rate-over-0.1-percent')
        if self.line_count > 20 and self.repeated_lines/self.line_count > .2: flags.append('repeated-line-rate-over-20-percent')
        return dict(characters=total,blocks=self.blocks,nonempty_lines=self.line_count,letters=letters,
                    replacement_characters=replacement,control_characters=controls,
                    replacement_rate=replacement/max(1,total),control_rate=controls/max(1,total),
                    repeated_lines=self.repeated_lines,repeated_line_rate=self.repeated_lines/max(1,self.line_count),
                    repeated_line_metric='lower-bound' if self.capped_lines else 'complete',
                    repeated_blocks=self.repeated_blocks,repeated_block_rate=self.repeated_blocks/max(1,self.blocks),
                    repeated_block_metric='lower-bound' if self.capped_blocks else 'complete',
                    untracked_unique_lines=self.capped_lines,scripts=dict(scripts),flags=flags)
