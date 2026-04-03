#!/usr/bin/env python3
"""
Collect all unique first characters from HSK 1-6 vocab files.
This is a preparatory step for adding radical data to each entry.
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'data')

def main():
    all_first_chars = set()
    level_counts = {}

    for level in range(1, 7):
        filepath = os.path.join(DATA_DIR, f'hsk{level}-vocab.json')
        with open(filepath, 'r', encoding='utf-8') as f:
            vocab = json.load(f)

        first_chars = set()
        for entry in vocab:
            simplified = entry['simplified']
            if simplified:
                first_chars.add(simplified[0])

        level_counts[level] = {
            'words': len(vocab),
            'unique_first_chars': len(first_chars),
        }
        all_first_chars.update(first_chars)

    print(f"Total unique first characters across HSK 1-6: {len(all_first_chars)}")
    print()

    for level, counts in level_counts.items():
        print(f"HSK {level}: {counts['words']} words, {counts['unique_first_chars']} unique first chars")

    print()
    print("All unique first characters:")
    # Sort by Unicode code point for readability
    sorted_chars = sorted(all_first_chars)
    # Print in rows of 40
    for i in range(0, len(sorted_chars), 40):
        print(''.join(sorted_chars[i:i+40]))

    print()
    print(f"Total: {len(all_first_chars)} unique first characters")


if __name__ == '__main__':
    main()
