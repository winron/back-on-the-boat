#!/usr/bin/env python3
"""Audit HSK sentence JSON data files for pinyin and structural errors."""

import json
import re
import unicodedata
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path("/home/user/back-on-the-boat/public/data")

# ---------------------------------------------------------------------------
# Pinyin utilities
# ---------------------------------------------------------------------------

# Vowels with tone marks → tone number
TONE_MAP = {
    'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4),
    'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
    'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4),
    'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
    'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4),
    'ǖ': ('ü', 1), 'ǘ': ('ü', 2), 'ǚ': ('ü', 3), 'ǜ': ('ü', 4),
    'ü': ('ü', 5),  # neutral/base
}

TONE4_CHARS = set('àèìòùǜ')
TONE1_CHARS = set('āēīōūǖ')
TONE2_CHARS = set('áéíóúǘ')
TONE3_CHARS = set('ǎěǐǒǔǚ')
NEUTRAL_CHARS = set('aeiouü')  # no diacritic = neutral or base

def get_syllable_tone(syllable: str) -> int:
    """Return the tone number (1-4, 5=neutral) of a pinyin syllable."""
    for ch in syllable:
        if ch in TONE4_CHARS:
            return 4
        if ch in TONE1_CHARS:
            return 1
        if ch in TONE2_CHARS:
            return 2
        if ch in TONE3_CHARS:
            return 3
    return 5  # neutral / no diacritic

def normalize_syllable(syllable: str) -> str:
    """Strip tone marks to get base pinyin."""
    result = []
    for ch in syllable:
        if ch in TONE_MAP:
            result.append(TONE_MAP[ch][0])
        else:
            result.append(ch)
    return ''.join(result)

def is_chinese_char(ch: str) -> bool:
    """Return True if ch is a CJK character."""
    cp = ord(ch)
    return (
        0x4E00 <= cp <= 0x9FFF or
        0x3400 <= cp <= 0x4DBF or
        0x20000 <= cp <= 0x2A6DF or
        0xF900 <= cp <= 0xFAFF
    )

def count_chinese_chars(text: str) -> int:
    return sum(1 for ch in text if is_chinese_char(ch))

# Punctuation tokens to exclude from syllable count
PUNCT_RE = re.compile(r'^[。，！？；：、,.!?;:\(\)\[\]【】「」『』""''…—～·]+$')

def tokenize_pinyin(pinyin_str: str) -> list:
    """Split pinyin string into syllable tokens, stripping punctuation."""
    tokens = pinyin_str.split()
    return [t for t in tokens if not PUNCT_RE.match(t)]

# ---------------------------------------------------------------------------
# Check 1: 一 tone sandhi
# ---------------------------------------------------------------------------
# Expected: yī (base) or consistent sandhi (yí before 4th tone, yì before 1st/2nd/3rd)
# We check for inconsistency within each file.

YI_FORMS = {'yī', 'yí', 'yì', 'yi'}  # yi without mark = neutral (unlikely for 一)

def check_yi_sandhi(entries):
    """
    Returns list of (id, pinyin, following_syllable, yi_used, yi_expected) issues.
    Strategy: if the file uses base tone yī throughout, that's intentional.
    Only flag genuine tone sandhi violations where yí/yì is used but wrong.
    """
    issues = []
    for entry in entries:
        py = entry['targetPinyin']
        tokens = tokenize_pinyin(py)
        for i, tok in enumerate(tokens):
            base = normalize_syllable(tok.lower().strip('，。！？；：、'))
            if base != 'yi':
                continue
            # Check what form is used
            tone = get_syllable_tone(tok)
            if tone == 1 and tok.lower() in ('yī',):
                # base form — skip if next is 4th tone (sandhi violation)
                if i + 1 < len(tokens):
                    next_tone = get_syllable_tone(tokens[i+1])
                    # yī before 4th tone should be yí
                    if next_tone == 4:
                        issues.append({
                            'type': 'yi_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'yī before 4th-tone "{tokens[i+1]}" should be yí'
                        })
                    # yī before 1st/2nd/3rd should be yì
                    elif next_tone in (1, 2, 3):
                        issues.append({
                            'type': 'yi_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'yī before {next_tone}rd/th-tone "{tokens[i+1]}" should be yì'
                        })
            elif tone == 2:
                # yí — should only be before 4th tone
                if i + 1 < len(tokens):
                    next_tone = get_syllable_tone(tokens[i+1])
                    if next_tone != 4:
                        issues.append({
                            'type': 'yi_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'yí before {next_tone}th-tone "{tokens[i+1]}" — yí is correct only before 4th tone'
                        })
            elif tone == 3:
                # yì — should only be before 1st/2nd/3rd tone OR at end
                if i + 1 < len(tokens):
                    next_tone = get_syllable_tone(tokens[i+1])
                    if next_tone == 4:
                        issues.append({
                            'type': 'yi_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'yì before 4th-tone "{tokens[i+1]}" should be yí'
                        })
    return issues

# ---------------------------------------------------------------------------
# Check 2: 不 tone sandhi
# ---------------------------------------------------------------------------

BU_FORMS = {'bū', 'bú', 'bǔ', 'bù', 'bu'}

def check_bu_sandhi(entries):
    issues = []
    for entry in entries:
        py = entry['targetPinyin']
        tokens = tokenize_pinyin(py)
        for i, tok in enumerate(tokens):
            base = normalize_syllable(tok.lower().strip('，。！？'))
            if base != 'bu':
                continue
            tone = get_syllable_tone(tok)
            if tone == 4:
                # bù — correct unless before another 4th-tone
                if i + 1 < len(tokens):
                    next_tone = get_syllable_tone(tokens[i+1])
                    if next_tone == 4:
                        issues.append({
                            'type': 'bu_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'bù before 4th-tone "{tokens[i+1]}" should be bú'
                        })
            elif tone == 2:
                # bú — should only be before 4th tone
                if i + 1 < len(tokens):
                    next_tone = get_syllable_tone(tokens[i+1])
                    if next_tone != 4:
                        issues.append({
                            'type': 'bu_sandhi',
                            'id': entry['id'],
                            'pinyin': py,
                            'detail': f'bú before {next_tone}th-tone "{tokens[i+1]}" — bú is only correct before 4th-tone'
                        })
    return issues

# ---------------------------------------------------------------------------
# Check 3: Syllable count vs character count
# ---------------------------------------------------------------------------

def check_syllable_count(entries):
    issues = []
    for entry in entries:
        py = entry['targetPinyin']
        sentence = entry['targetSentence']
        char_count = count_chinese_chars(sentence)
        syl_count = len(tokenize_pinyin(py))
        diff = abs(char_count - syl_count)
        # Allow small differences (e.g. compound pinyin sometimes written as one)
        if diff > 2 and (diff / max(char_count, 1)) > 0.15:
            issues.append({
                'type': 'count_mismatch',
                'id': entry['id'],
                'sentence': sentence,
                'pinyin': py,
                'detail': f'{char_count} Chinese chars vs {syl_count} pinyin syllables (diff={diff})'
            })
    return issues

# ---------------------------------------------------------------------------
# Check 4: Obviously wrong pinyin for common characters
# ---------------------------------------------------------------------------

# Map of Chinese character → expected base pinyin (base, no tone mark) + expected tone
# Only checking characters where tone is always fixed
KNOWN_PINYIN = {
    '我': ('wo', 3),
    '你': ('ni', 3),
    '他': ('ta', 1),
    '她': ('ta', 1),
    '它': ('ta', 1),
    '们': ('men', 5),  # neutral
    '是': ('shi', 4),
    '不': ('bu', 4),   # base; sandhi checked separately
    '的': ('de', 5),   # structural particle, usually neutral
    '了': ('le', 5),   # aspect particle, neutral
    '在': ('zai', 4),
    '有': ('you', 3),
    '没': ('mei', 2),
    '很': ('hen', 3),
    '都': ('dou', 1),
    '也': ('ye', 3),
    '吗': ('ma', 5),
    '吧': ('ba', 5),
    '呢': ('ne', 5),
    '啊': ('a', 5),
    '这': ('zhe', 4),
    '那': ('na', 4),
    '什': ('shen', 2),
    '么': ('me', 5),
    '哪': ('na', 3),
    '谁': ('shei', 2),
    '哪': ('na', 3),
    '怎': ('zen', 3),
    '为': ('wei', 4),
    '和': ('he', 2),
    '来': ('lai', 2),
    '去': ('qu', 4),
    '说': ('shuo', 1),
    '要': ('yao', 4),
    '想': ('xiang', 3),
    '会': ('hui', 4),
    '可': ('ke', 3),
    '以': ('yi', 3),
    '就': ('jiu', 4),
    '对': ('dui', 4),
    '从': ('cong', 2),
    '到': ('dao', 4),
    '比': ('bi', 3),
    '让': ('rang', 4),
    '把': ('ba', 3),
    '给': ('gei', 3),
    '被': ('bei', 4),
    '只': ('zhi', 3),
    '还': ('hai', 2),
    '再': ('zai', 4),
    '又': ('you', 4),
    '已': ('yi', 3),
    '经': ('jing', 1),
    '太': ('tai', 4),
    '非': ('fei', 1),
    '常': ('chang', 2),
    '更': ('geng', 4),
    '最': ('zui', 4),
    '真': ('zhen', 1),
    '好': ('hao', 3),
    '大': ('da', 4),
    '小': ('xiao', 3),
    '多': ('duo', 1),
    '少': ('shao', 3),
    '高': ('gao', 1),
    '新': ('xin', 1),
    '年': ('nian', 2),
    '月': ('yue', 4),
    '日': ('ri', 4),
    '时': ('shi', 2),
    '今': ('jin', 1),
    '明': ('ming', 2),
    '昨': ('zuo', 2),
    '上': ('shang', 4),
    '下': ('xia', 4),
    '前': ('qian', 2),
    '后': ('hou', 4),
    '左': ('zuo', 3),
    '右': ('you', 4),
    '里': ('li', 3),
    '外': ('wai', 4),
    '中': ('zhong', 1),
    '国': ('guo', 2),
    '人': ('ren', 2),
    '们': ('men', 5),
    '字': ('zi', 4),
    '书': ('shu', 1),
    '学': ('xue', 2),
    '校': ('xiao', 4),
    '老': ('lao', 3),
    '师': ('shi', 1),
    '工': ('gong', 1),
    '作': ('zuo', 4),
    '家': ('jia', 1),
    '钱': ('qian', 2),
    '吃': ('chi', 1),
    '喝': ('he', 1),
    '买': ('mai', 3),
    '卖': ('mai', 4),
    '看': ('kan', 4),
    '听': ('ting', 1),
    '写': ('xie', 3),
    '读': ('du', 2),
    '走': ('zou', 3),
    '跑': ('pao', 3),
    '坐': ('zuo', 4),
    '站': ('zhan', 4),
    '睡': ('shui', 4),
    '起': ('qi', 3),
    '开': ('kai', 1),
    '关': ('guan', 1),
    '打': ('da', 3),
    '用': ('yong', 4),
    '问': ('wen', 4),
    '答': ('da', 2),
    '告': ('gao', 4),
    '知': ('zhi', 1),
    '道': ('dao', 4),
    '觉': ('jue', 2),
    '得': ('de', 2),  # structural de is neutral, but verb 得 is dé
    '过': ('guo', 4),
    '着': ('zhe', 5),  # aspect particle neutral
    '啊': ('a', 5),
    '嗯': ('en', 5),
}

# Some chars have multiple legitimate readings; skip those
MULTI_READING = {'还', '得', '着', '啊', '嗯', '了', '的', '地', '过', '好', '大', '长', '都', '为', '说', '看', '想', '要', '会', '去', '来', '让', '把', '给', '就', '再', '又', '只', '以', '和', '比'}


def check_common_pinyin(entries):
    """Check that common characters have correct pinyin."""
    issues = []

    for entry in entries:
        sentence = entry['targetSentence']
        py = entry['targetPinyin']
        tokens = tokenize_pinyin(py)
        chars = [ch for ch in sentence if is_chinese_char(ch)]

        if len(chars) != len(tokens):
            # Count mismatch — skip detailed check for this entry
            continue

        for char, tok in zip(chars, tokens):
            if char in MULTI_READING:
                continue
            if char not in KNOWN_PINYIN:
                continue
            expected_base, expected_tone = KNOWN_PINYIN[char]
            actual_base = normalize_syllable(tok.lower())
            actual_tone = get_syllable_tone(tok)

            # Check base pinyin first
            if actual_base != expected_base:
                # Some chars have alternate romanizations
                issues.append({
                    'type': 'wrong_pinyin_base',
                    'id': entry['id'],
                    'sentence': sentence,
                    'pinyin': py,
                    'detail': f'Char "{char}": expected base "{expected_base}", got "{tok}" (base: "{actual_base}")'
                })
            elif expected_tone != 5 and actual_tone != 5 and actual_tone != expected_tone:
                # Tone mismatch (ignore neutral tone)
                issues.append({
                    'type': 'wrong_pinyin_tone',
                    'id': entry['id'],
                    'sentence': sentence,
                    'pinyin': py,
                    'detail': f'Char "{char}": expected tone {expected_tone}, got tone {actual_tone} in "{tok}"'
                })

    return issues


# ---------------------------------------------------------------------------
# Additional check: 谁 pinyin (shéi vs shuí)
# ---------------------------------------------------------------------------
def check_shei(entries):
    """谁 can be shéi or shuí — both are correct. Check for wrong tones only."""
    issues = []
    for entry in entries:
        sentence = entry['targetSentence']
        py = entry['targetPinyin']
        tokens = tokenize_pinyin(py)
        chars = [ch for ch in sentence if is_chinese_char(ch)]
        if len(chars) != len(tokens):
            continue
        for char, tok in zip(chars, tokens):
            if char == '谁':
                base = normalize_syllable(tok.lower())
                tone = get_syllable_tone(tok)
                if base not in ('shei', 'shui'):
                    issues.append({
                        'type': 'wrong_pinyin_base',
                        'id': entry['id'],
                        'sentence': sentence,
                        'pinyin': py,
                        'detail': f'谁 should be shéi or shuí, got "{tok}"'
                    })
                elif tone != 2:
                    issues.append({
                        'type': 'wrong_pinyin_tone',
                        'id': entry['id'],
                        'sentence': sentence,
                        'pinyin': py,
                        'detail': f'谁 should be 2nd tone (shéi/shuí), got tone {tone} in "{tok}"'
                    })
    return issues


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------

def load_file(level: int):
    path = DATA_DIR / f"hsk{level}-sentences.json"
    with open(path) as f:
        return json.load(f)

def run_audit():
    all_issues = defaultdict(list)

    for level in range(1, 7):
        entries = load_file(level)
        print(f"\n=== HSK {level} ({len(entries)} entries) ===")

        yi_issues = check_yi_sandhi(entries)
        bu_issues = check_bu_sandhi(entries)
        count_issues = check_syllable_count(entries)
        pinyin_issues = check_common_pinyin(entries)
        shei_issues = check_shei(entries)

        level_issues = yi_issues + bu_issues + count_issues + pinyin_issues + shei_issues
        all_issues[level] = level_issues

        # Summary
        print(f"  yi sandhi:      {len(yi_issues)} issues")
        print(f"  bu sandhi:      {len(bu_issues)} issues")
        print(f"  count mismatch: {len(count_issues)} issues")
        print(f"  pinyin errors:  {len(pinyin_issues) + len(shei_issues)} issues")
        print(f"  TOTAL:          {len(level_issues)} issues")

        # Print each issue
        for iss in level_issues:
            print(f"\n  [{iss['type']}] {iss['id']}")
            if 'sentence' in iss:
                print(f"    sentence: {iss['sentence']}")
            print(f"    pinyin:   {iss.get('pinyin', '')}")
            print(f"    detail:   {iss['detail']}")

    # Overall summary
    total = sum(len(v) for v in all_issues.values())
    print(f"\n\n{'='*60}")
    print(f"TOTAL ISSUES ACROSS ALL FILES: {total}")
    type_counts = defaultdict(int)
    for issues in all_issues.values():
        for iss in issues:
            type_counts[iss['type']] += 1
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")

if __name__ == '__main__':
    run_audit()
