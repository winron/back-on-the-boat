/**
 * Data preparation script
 *
 * Downloads HSK vocabulary from open-source repositories and transforms
 * it into the JSON format expected by the app.
 *
 * Usage: npx tsx scripts/prepare-data.ts
 *
 * Data sources:
 * - Vocabulary: https://github.com/drkameleon/complete-hsk-vocabulary
 * - Grammar: https://github.com/infinyte7/Chinese-Grammar (AllSet Learning)
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { thematicUnits } from "./thematic-units";
import { RADICALS } from "./radicals-data";

const OUTPUT_DIR = join(__dirname, "..", "public", "data");

interface RawCompleteEntry {
  simplified: string;
  radical?: string;
  level: string[]; // e.g. ["new-4", "old-3"]
  frequency: number;
  pos?: string[];
  forms: {
    traditional?: string;
    transcriptions?: {
      pinyin?: string;
    };
    meanings?: string[];
    classifiers?: string[];
  }[];
}

interface OutputWord {
  id: string;
  simplified: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  partOfSpeech?: string;
  frequency?: number;
  unitIndex: number;
  unitName: string;
  radical?: string;
}

interface OutputGrammar {
  id: string;
  hskLevel: number;
  title: string;
  structure: string;
  explanation: string;
  examples: { chinese: string; pinyin: string; english: string }[];
}

interface OutputSentence {
  id: string;
  hskLevel: number;
  targetSentence: string;
  targetPinyin: string;
  targetMeaning: string;
  wordBank: string[];
}

interface OutputDialogue {
  id: string;
  hskLevel: number;
  title: string;
  context: string;
  lines: { speaker: string; chinese: string; pinyin: string; english: string }[];
}

async function fetchJson(url: string): Promise<unknown> {
  console.log(`Fetching ${url}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function getOldHskLevel(entry: RawCompleteEntry): number | null {
  // Look for "old-N" pattern in level array (HSK 2.0 levels 1-6)
  for (const l of entry.level) {
    const match = l.match(/^old-(\d)$/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

async function prepareVocabulary(): Promise<void> {
  const url =
    "https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json";

  try {
    const raw = (await fetchJson(url)) as RawCompleteEntry[];
    console.log(`Fetched ${raw.length} total entries from complete.json`);

    // Build a lookup: simplified -> raw entry data
    const rawLookup = new Map<string, { level: number; entry: RawCompleteEntry }>();
    for (const entry of raw) {
      const level = getOldHskLevel(entry);
      if (!level || level < 1 || level > 6) continue;
      rawLookup.set(`${level}:${entry.simplified}`, { level, entry });
    }

    // Build vocab ordered by thematic units, frequency within each unit
    for (let level = 1; level <= 6; level++) {
      const units = thematicUnits[level] || [];
      const words: OutputWord[] = [];

      // Build a word-to-unit lookup
      const wordToUnit = new Map<string, { unitIndex: number; unitName: string }>();
      for (const unit of units) {
        for (const w of unit.words) {
          wordToUnit.set(w, { unitIndex: unit.index, unitName: unit.name });
        }
      }

      // Collect all words for this level from raw data
      const levelEntries: { entry: RawCompleteEntry; unitIndex: number; unitName: string }[] = [];
      for (const entry of raw) {
        const entryLevel = getOldHskLevel(entry);
        if (entryLevel !== level) continue;
        const unitInfo = wordToUnit.get(entry.simplified) || { unitIndex: 999, unitName: "Miscellaneous" };
        levelEntries.push({ entry, ...unitInfo });
      }

      // Sort by unitIndex first, then by frequency within each unit (lower = more common)
      levelEntries.sort((a, b) => {
        if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
        return (a.entry.frequency || 99999) - (b.entry.frequency || 99999);
      });

      // Build output
      for (let i = 0; i < levelEntries.length; i++) {
        const { entry, unitIndex, unitName } = levelEntries[i];
        const form = entry.forms?.[0];
        const pinyin = form?.transcriptions?.pinyin || "";
        const meaning = form?.meanings?.join("; ") || "";

        words.push({
          id: `hsk${level}-${String(i + 1).padStart(3, "0")}`,
          simplified: entry.simplified,
          pinyin,
          meaning,
          hskLevel: level,
          partOfSpeech: entry.pos?.join(", "),
          frequency: entry.frequency,
          unitIndex,
          unitName,
          radical: entry.radical,
        });
      }

      writeFileSync(
        join(OUTPUT_DIR, `hsk${level}-vocab.json`),
        JSON.stringify(words, null, 2)
      );
      console.log(`HSK ${level}: ${words.length} words in ${units.length} thematic units`);
    }
  } catch (err) {
    console.error("Failed to fetch vocabulary:", err);
    // Write empty arrays as fallback
    for (let level = 1; level <= 6; level++) {
      writeFileSync(
        join(OUTPUT_DIR, `hsk${level}-vocab.json`),
        JSON.stringify([])
      );
    }
  }
}

function generateSampleGrammar(): void {
  // Grammar patterns for HSK 1-6
  const grammarData: Record<number, OutputGrammar[]> = {
    1: [
      {
        id: "g1-001",
        hskLevel: 1,
        title: "Basic sentence with 是 (shì)",
        structure: "A + 是 + B",
        explanation:
          'The verb 是 (shì) means "to be" and is used to link a subject to a noun or noun phrase.',
        examples: [
          {
            chinese: "我是学生。",
            pinyin: "Wǒ shì xuéshēng.",
            english: "I am a student.",
          },
          {
            chinese: "他是老师。",
            pinyin: "Tā shì lǎoshī.",
            english: "He is a teacher.",
          },
        ],
      },
      {
        id: "g1-002",
        hskLevel: 1,
        title: "Negation with 不 (bù)",
        structure: "Subject + 不 + Verb/Adj",
        explanation:
          "不 (bù) is placed before a verb or adjective to negate it. It changes to bú before a 4th tone.",
        examples: [
          {
            chinese: "我不喝咖啡。",
            pinyin: "Wǒ bù hē kāfēi.",
            english: "I don't drink coffee.",
          },
          {
            chinese: "她不是中国人。",
            pinyin: "Tā bú shì Zhōngguó rén.",
            english: "She is not Chinese.",
          },
        ],
      },
      {
        id: "g1-003",
        hskLevel: 1,
        title: "Questions with 吗 (ma)",
        structure: "Statement + 吗？",
        explanation:
          "Adding 吗 to the end of a statement turns it into a yes/no question.",
        examples: [
          {
            chinese: "你好吗？",
            pinyin: "Nǐ hǎo ma?",
            english: "How are you?",
          },
          {
            chinese: "你是中国人吗？",
            pinyin: "Nǐ shì Zhōngguó rén ma?",
            english: "Are you Chinese?",
          },
        ],
      },
      {
        id: "g1-004",
        hskLevel: 1,
        title: "Subject + 很 + Adjective",
        structure: "Subject + 很 + Adj",
        explanation:
          'In Chinese, adjectives can act as verbs. 很 (hěn, "very") is often used before adjectives, but sometimes it just serves as a grammatical filler with a weakened meaning.',
        examples: [
          {
            chinese: "她很漂亮。",
            pinyin: "Tā hěn piàoliang.",
            english: "She is very pretty.",
          },
          {
            chinese: "中文很难。",
            pinyin: "Zhōngwén hěn nán.",
            english: "Chinese is (very) hard.",
          },
        ],
      },
      {
        id: "g1-005",
        hskLevel: 1,
        title: "Possessive with 的 (de)",
        structure: "Noun/Pronoun + 的 + Noun",
        explanation:
          "的 indicates possession, similar to 's in English or the word \"of\".",
        examples: [
          {
            chinese: "我的书。",
            pinyin: "Wǒ de shū.",
            english: "My book.",
          },
          {
            chinese: "这是谁的电脑？",
            pinyin: "Zhè shì shéi de diànnǎo?",
            english: "Whose computer is this?",
          },
        ],
      },
      {
        id: "g1-006",
        hskLevel: 1,
        title: "Measure words with 个 (gè)",
        structure: "Number + 个 + Noun",
        explanation:
          "In Chinese, you need a measure word between a number and a noun. 个 (gè) is the most common and general-purpose measure word.",
        examples: [
          {
            chinese: "三个人。",
            pinyin: "Sān gè rén.",
            english: "Three people.",
          },
          {
            chinese: "我有两个朋友。",
            pinyin: "Wǒ yǒu liǎng gè péngyǒu.",
            english: "I have two friends.",
          },
        ],
      },
      {
        id: "g1-007",
        hskLevel: 1,
        title: "Asking questions with 什么 (shénme)",
        structure: "Subject + Verb + 什么？",
        explanation:
          '什么 means "what" and replaces the unknown thing in the sentence.',
        examples: [
          {
            chinese: "你叫什么名字？",
            pinyin: "Nǐ jiào shénme míngzì?",
            english: "What is your name?",
          },
          {
            chinese: "你喜欢吃什么？",
            pinyin: "Nǐ xǐhuān chī shénme?",
            english: "What do you like to eat?",
          },
        ],
      },
      {
        id: "g1-008",
        hskLevel: 1,
        title: "Expressing existence with 有 (yǒu)",
        structure: "Subject + 有 + Object",
        explanation:
          '有 (yǒu) means "to have" or "there is/are". It is negated with 没 (méi), not 不.',
        examples: [
          {
            chinese: "我有一本书。",
            pinyin: "Wǒ yǒu yì běn shū.",
            english: "I have a book.",
          },
          {
            chinese: "我没有钱。",
            pinyin: "Wǒ méiyǒu qián.",
            english: "I don't have money.",
          },
        ],
      },
      {
        id: "g1-009",
        hskLevel: 1,
        title: "Time words in sentences",
        structure: "Subject + Time + Verb + Object",
        explanation:
          "Time words come before the verb in Chinese, typically after the subject.",
        examples: [
          {
            chinese: "我今天很忙。",
            pinyin: "Wǒ jīntiān hěn máng.",
            english: "I am very busy today.",
          },
          {
            chinese: "他明天去北京。",
            pinyin: "Tā míngtiān qù Běijīng.",
            english: "He is going to Beijing tomorrow.",
          },
        ],
      },
      {
        id: "g1-010",
        hskLevel: 1,
        title: "Location with 在 (zài)",
        structure: "Subject + 在 + Place",
        explanation:
          '在 (zài) means "to be at/in" and indicates location.',
        examples: [
          {
            chinese: "他在家。",
            pinyin: "Tā zài jiā.",
            english: "He is at home.",
          },
          {
            chinese: "书在桌子上。",
            pinyin: "Shū zài zhuōzi shàng.",
            english: "The book is on the table.",
          },
        ],
      },
    ],
    2: [
      {
        id: "g2-001",
        hskLevel: 2,
        title: "Completed action with 了 (le)",
        structure: "Subject + Verb + 了 + Object",
        explanation:
          "了 (le) placed after a verb indicates a completed action. It focuses on the fact that something has been done.",
        examples: [
          {
            chinese: "我吃了早饭。",
            pinyin: "Wǒ chī le zǎofàn.",
            english: "I ate breakfast.",
          },
          {
            chinese: "他买了一本书。",
            pinyin: "Tā mǎi le yì běn shū.",
            english: "He bought a book.",
          },
        ],
      },
      {
        id: "g2-002",
        hskLevel: 2,
        title: "Experience with 过 (guò)",
        structure: "Subject + Verb + 过 + Object",
        explanation:
          "过 (guò) after a verb indicates that someone has had the experience of doing something at some point in the past.",
        examples: [
          {
            chinese: "我去过中国。",
            pinyin: "Wǒ qù guò Zhōngguó.",
            english: "I have been to China.",
          },
          {
            chinese: "你吃过北京烤鸭吗？",
            pinyin: "Nǐ chī guò Běijīng kǎoyā ma?",
            english: "Have you ever eaten Peking duck?",
          },
        ],
      },
      {
        id: "g2-003",
        hskLevel: 2,
        title: "Progressive with 正在 (zhèngzài)",
        structure: "Subject + 正在 + Verb + (Object)",
        explanation:
          "正在 (zhèngzài) indicates an action is in progress right now, similar to the English present continuous tense.",
        examples: [
          {
            chinese: "他正在看书。",
            pinyin: "Tā zhèngzài kàn shū.",
            english: "He is reading a book right now.",
          },
          {
            chinese: "妈妈正在做饭。",
            pinyin: "Māma zhèngzài zuò fàn.",
            english: "Mom is cooking right now.",
          },
        ],
      },
      {
        id: "g2-004",
        hskLevel: 2,
        title: "Comparison with 比 (bǐ)",
        structure: "A + 比 + B + Adj",
        explanation:
          "比 (bǐ) is used to compare two things. A is [more adjective] than B.",
        examples: [
          {
            chinese: "他比我高。",
            pinyin: "Tā bǐ wǒ gāo.",
            english: "He is taller than me.",
          },
          {
            chinese: "今天比昨天冷。",
            pinyin: "Jīntiān bǐ zuótiān lěng.",
            english: "Today is colder than yesterday.",
          },
        ],
      },
      {
        id: "g2-005",
        hskLevel: 2,
        title: "From...to with 从...到 (cóng...dào)",
        structure: "从 + Start + 到 + End",
        explanation:
          "从...到 expresses a range of time or place, meaning \"from...to\".",
        examples: [
          {
            chinese: "从北京到上海要五个小时。",
            pinyin: "Cóng Běijīng dào Shànghǎi yào wǔ gè xiǎoshí.",
            english: "It takes five hours from Beijing to Shanghai.",
          },
          {
            chinese: "我从九点到十二点上课。",
            pinyin: "Wǒ cóng jiǔ diǎn dào shí'èr diǎn shàng kè.",
            english: "I have class from 9 to 12.",
          },
        ],
      },
      {
        id: "g2-006",
        hskLevel: 2,
        title: "About to happen with 要...了 (yào...le)",
        structure: "Subject + 要 + Verb + 了",
        explanation:
          "要...了 indicates something is about to happen soon.",
        examples: [
          {
            chinese: "火车要开了。",
            pinyin: "Huǒchē yào kāi le.",
            english: "The train is about to depart.",
          },
          {
            chinese: "要下雨了。",
            pinyin: "Yào xià yǔ le.",
            english: "It's about to rain.",
          },
        ],
      },
      {
        id: "g2-007",
        hskLevel: 2,
        title: "Ability with 可以, 能, 会",
        structure: "Subject + 可以/能/会 + Verb",
        explanation:
          "可以 expresses permission, 能 expresses ability or possibility, and 会 expresses a learned skill. All translate roughly to \"can\".",
        examples: [
          {
            chinese: "我会说中文。",
            pinyin: "Wǒ huì shuō Zhōngwén.",
            english: "I can speak Chinese. (learned skill)",
          },
          {
            chinese: "这里不能抽烟。",
            pinyin: "Zhèlǐ bù néng chōuyān.",
            english: "You can't smoke here. (not allowed/possible)",
          },
        ],
      },
      {
        id: "g2-008",
        hskLevel: 2,
        title: "Complement of degree with 得 (de)",
        structure: "Verb + 得 + Adj/Description",
        explanation:
          "得 (de) links a verb to a description of how the action is performed.",
        examples: [
          {
            chinese: "她唱得很好。",
            pinyin: "Tā chàng de hěn hǎo.",
            english: "She sings very well.",
          },
          {
            chinese: "他跑得很快。",
            pinyin: "Tā pǎo de hěn kuài.",
            english: "He runs very fast.",
          },
        ],
      },
      {
        id: "g2-009",
        hskLevel: 2,
        title: "还是 vs 或者 (háishi vs huòzhě)",
        structure: "A + 还是/或者 + B",
        explanation:
          "还是 is used in questions offering a choice. 或者 is used in statements meaning \"or\".",
        examples: [
          {
            chinese: "你喝咖啡还是茶？",
            pinyin: "Nǐ hē kāfēi háishi chá?",
            english: "Do you drink coffee or tea? (question)",
          },
          {
            chinese: "周末我看书或者看电影。",
            pinyin: "Zhōumò wǒ kàn shū huòzhě kàn diànyǐng.",
            english: "On weekends I read or watch movies. (statement)",
          },
        ],
      },
      {
        id: "g2-010",
        hskLevel: 2,
        title: "一点儿 vs 有点儿 (yìdiǎnr vs yǒudiǎnr)",
        structure: "Verb + 一点儿 / 有点儿 + Adj",
        explanation:
          "一点儿 means \"a little\" and modifies nouns or follows adjectives in comparisons. 有点儿 means \"somewhat\" and is used before adjectives, often with a negative nuance.",
        examples: [
          {
            chinese: "请说慢一点儿。",
            pinyin: "Qǐng shuō màn yìdiǎnr.",
            english: "Please speak a little slower.",
          },
          {
            chinese: "今天有点儿冷。",
            pinyin: "Jīntiān yǒudiǎnr lěng.",
            english: "It's a bit cold today.",
          },
        ],
      },
    ],
    3: [
      {
        id: "g3-001",
        hskLevel: 3,
        title: "把 construction (bǎ)",
        structure: "Subject + 把 + Object + Verb + Complement",
        explanation:
          "The 把 construction moves the object before the verb to emphasize what happens to it. The verb usually needs a complement or other element after it.",
        examples: [
          {
            chinese: "请把门关上。",
            pinyin: "Qǐng bǎ mén guān shàng.",
            english: "Please close the door.",
          },
          {
            chinese: "他把作业做完了。",
            pinyin: "Tā bǎ zuòyè zuò wán le.",
            english: "He finished the homework.",
          },
        ],
      },
      {
        id: "g3-002",
        hskLevel: 3,
        title: "Passive with 被 (bèi)",
        structure: "Subject + 被 + (Agent) + Verb + Complement",
        explanation:
          "被 (bèi) marks the passive voice. The subject receives the action. Often used for unpleasant or unexpected events.",
        examples: [
          {
            chinese: "我的手机被偷了。",
            pinyin: "Wǒ de shǒujī bèi tōu le.",
            english: "My phone was stolen.",
          },
          {
            chinese: "蛋糕被弟弟吃了。",
            pinyin: "Dàngāo bèi dìdi chī le.",
            english: "The cake was eaten by my younger brother.",
          },
        ],
      },
      {
        id: "g3-003",
        hskLevel: 3,
        title: "More and more with 越来越 (yuèláiyuè)",
        structure: "Subject + 越来越 + Adj/Verb",
        explanation:
          "越来越 expresses that something is becoming more and more of a quality over time.",
        examples: [
          {
            chinese: "天气越来越冷了。",
            pinyin: "Tiānqì yuèláiyuè lěng le.",
            english: "The weather is getting colder and colder.",
          },
          {
            chinese: "他的中文越来越好。",
            pinyin: "Tā de Zhōngwén yuèláiyuè hǎo.",
            english: "His Chinese is getting better and better.",
          },
        ],
      },
      {
        id: "g3-004",
        hskLevel: 3,
        title: "除了...以外 (chúle...yǐwài) - Besides/Except",
        structure: "除了 + A + 以外，(都/也) + ...",
        explanation:
          "除了...以外 means \"besides\" (with 也/还) or \"except\" (with 都). It sets apart one item from the rest.",
        examples: [
          {
            chinese: "除了中文以外，我也学日语。",
            pinyin: "Chúle Zhōngwén yǐwài, wǒ yě xué Rìyǔ.",
            english: "Besides Chinese, I also study Japanese.",
          },
          {
            chinese: "除了他以外，大家都来了。",
            pinyin: "Chúle tā yǐwài, dàjiā dōu lái le.",
            english: "Except for him, everyone came.",
          },
        ],
      },
      {
        id: "g3-005",
        hskLevel: 3,
        title: "不但...而且 (búdàn...érqiě) - Not only...but also",
        structure: "不但 + A，而且 + B",
        explanation:
          "不但...而且 is used to add information, meaning \"not only A, but also B.\"",
        examples: [
          {
            chinese: "她不但聪明，而且很努力。",
            pinyin: "Tā búdàn cōngmíng, érqiě hěn nǔlì.",
            english: "She is not only smart, but also very hardworking.",
          },
          {
            chinese: "这个菜不但好吃，而且便宜。",
            pinyin: "Zhège cài búdàn hǎochī, érqiě piányi.",
            english: "This dish is not only delicious, but also cheap.",
          },
        ],
      },
      {
        id: "g3-006",
        hskLevel: 3,
        title: "虽然...但是 (suīrán...dànshì) - Although...but",
        structure: "虽然 + A，但是 + B",
        explanation:
          "虽然...但是 means \"although A, but B.\" Unlike English, Chinese uses both \"although\" and \"but\" together.",
        examples: [
          {
            chinese: "虽然很累，但是我很开心。",
            pinyin: "Suīrán hěn lèi, dànshì wǒ hěn kāixīn.",
            english: "Although I'm tired, I'm very happy.",
          },
          {
            chinese: "虽然下雨了，但是我们还是去了。",
            pinyin: "Suīrán xià yǔ le, dànshì wǒmen háishi qù le.",
            english: "Although it rained, we still went.",
          },
        ],
      },
      {
        id: "g3-007",
        hskLevel: 3,
        title: "如果...就 (rúguǒ...jiù) - If...then",
        structure: "如果 + Condition，就 + Result",
        explanation:
          "如果...就 expresses a conditional relationship: \"if A, then B.\"",
        examples: [
          {
            chinese: "如果明天下雨，我们就不去了。",
            pinyin: "Rúguǒ míngtiān xià yǔ, wǒmen jiù bú qù le.",
            english: "If it rains tomorrow, we won't go.",
          },
          {
            chinese: "如果你有问题，就问老师。",
            pinyin: "Rúguǒ nǐ yǒu wèntí, jiù wèn lǎoshī.",
            english: "If you have questions, ask the teacher.",
          },
        ],
      },
      {
        id: "g3-008",
        hskLevel: 3,
        title: "一边...一边 (yìbiān...yìbiān) - While doing...also doing",
        structure: "Subject + 一边 + V1 + 一边 + V2",
        explanation:
          "一边...一边 indicates two actions happening simultaneously.",
        examples: [
          {
            chinese: "他一边吃饭一边看电视。",
            pinyin: "Tā yìbiān chī fàn yìbiān kàn diànshì.",
            english: "He eats while watching TV.",
          },
          {
            chinese: "她一边走一边听音乐。",
            pinyin: "Tā yìbiān zǒu yìbiān tīng yīnyuè.",
            english: "She listens to music while walking.",
          },
        ],
      },
      {
        id: "g3-009",
        hskLevel: 3,
        title: "对...来说 (duì...lái shuō) - For/To someone",
        structure: "对 + Person + 来说，...",
        explanation:
          "对...来说 means \"for someone\" or \"as far as someone is concerned.\"",
        examples: [
          {
            chinese: "对我来说，学中文很有意思。",
            pinyin: "Duì wǒ lái shuō, xué Zhōngwén hěn yǒu yìsi.",
            english: "For me, learning Chinese is very interesting.",
          },
          {
            chinese: "对外国人来说，汉字很难。",
            pinyin: "Duì wàiguó rén lái shuō, hànzì hěn nán.",
            english: "For foreigners, Chinese characters are very difficult.",
          },
        ],
      },
      {
        id: "g3-010",
        hskLevel: 3,
        title: "连...都/也 (lián...dōu/yě) - Even",
        structure: "连 + Noun/Verb + 都/也 + ...",
        explanation:
          "连...都/也 emphasizes something surprising or extreme, meaning \"even.\"",
        examples: [
          {
            chinese: "他连自己的名字都不会写。",
            pinyin: "Tā lián zìjǐ de míngzì dōu bú huì xiě.",
            english: "He can't even write his own name.",
          },
          {
            chinese: "我忙得连饭都没吃。",
            pinyin: "Wǒ máng de lián fàn dōu méi chī.",
            english: "I was so busy that I didn't even eat.",
          },
        ],
      },
    ],
    4: [
      {
        id: "g4-001",
        hskLevel: 4,
        title: "不仅...而且 (bùjǐn...érqiě) - Not only...but also",
        structure: "不仅 + A，而且 + B",
        explanation:
          "不仅...而且 is a more formal version of 不但...而且, used to add emphasis in written and spoken Chinese.",
        examples: [
          {
            chinese: "他不仅会说英语，而且会说法语。",
            pinyin: "Tā bùjǐn huì shuō Yīngyǔ, érqiě huì shuō Fǎyǔ.",
            english: "He not only speaks English, but also speaks French.",
          },
          {
            chinese: "这个城市不仅漂亮，而且很安全。",
            pinyin: "Zhège chéngshì bùjǐn piàoliang, érqiě hěn ānquán.",
            english: "This city is not only beautiful, but also very safe.",
          },
        ],
      },
      {
        id: "g4-002",
        hskLevel: 4,
        title: "即使...也 (jíshǐ...yě) - Even if...still",
        structure: "即使 + Condition，也 + Result",
        explanation:
          "即使...也 expresses that even if a condition is true, the result remains unchanged.",
        examples: [
          {
            chinese: "即使下雨，我也要去。",
            pinyin: "Jíshǐ xià yǔ, wǒ yě yào qù.",
            english: "Even if it rains, I will still go.",
          },
          {
            chinese: "即使很难，他也不放弃。",
            pinyin: "Jíshǐ hěn nán, tā yě bú fàngqì.",
            english: "Even if it's hard, he won't give up.",
          },
        ],
      },
      {
        id: "g4-003",
        hskLevel: 4,
        title: "无论...都 (wúlùn...dōu) - No matter...all",
        structure: "无论 + Question Word/Choice，都 + ...",
        explanation:
          "无论...都 means \"no matter what/how/when, the result is always the same.\"",
        examples: [
          {
            chinese: "无论多忙，他都坚持锻炼。",
            pinyin: "Wúlùn duō máng, tā dōu jiānchí duànliàn.",
            english: "No matter how busy, he always keeps exercising.",
          },
          {
            chinese: "无论你去哪儿，我都跟你去。",
            pinyin: "Wúlùn nǐ qù nǎr, wǒ dōu gēn nǐ qù.",
            english: "No matter where you go, I'll go with you.",
          },
        ],
      },
      {
        id: "g4-004",
        hskLevel: 4,
        title: "既...又 (jì...yòu) - Both...and",
        structure: "既 + A + 又 + B",
        explanation:
          "既...又 indicates two qualities or states coexist at the same time.",
        examples: [
          {
            chinese: "这个餐厅既便宜又好吃。",
            pinyin: "Zhège cāntīng jì piányi yòu hǎochī.",
            english: "This restaurant is both cheap and delicious.",
          },
          {
            chinese: "她既聪明又漂亮。",
            pinyin: "Tā jì cōngmíng yòu piàoliang.",
            english: "She is both smart and pretty.",
          },
        ],
      },
      {
        id: "g4-005",
        hskLevel: 4,
        title: "之所以...是因为 (zhīsuǒyǐ...shì yīnwèi)",
        structure: "之所以 + Result，是因为 + Reason",
        explanation:
          "之所以...是因为 states a result first and then explains the reason, meaning \"the reason why...is because.\"",
        examples: [
          {
            chinese: "他之所以成功，是因为他很努力。",
            pinyin: "Tā zhīsuǒyǐ chénggōng, shì yīnwèi tā hěn nǔlì.",
            english: "The reason he succeeded is because he worked very hard.",
          },
          {
            chinese: "我之所以迟到，是因为路上堵车了。",
            pinyin: "Wǒ zhīsuǒyǐ chídào, shì yīnwèi lùshang dǔchē le.",
            english: "The reason I was late is because there was a traffic jam.",
          },
        ],
      },
      {
        id: "g4-006",
        hskLevel: 4,
        title: "以...为 (yǐ...wéi) - Take...as",
        structure: "以 + A + 为 + B",
        explanation:
          "以...为 means \"to take A as B\" or \"to regard A as B.\" It is commonly used in formal contexts.",
        examples: [
          {
            chinese: "我们以北京为中心开展工作。",
            pinyin: "Wǒmen yǐ Běijīng wéi zhōngxīn kāizhǎn gōngzuò.",
            english: "We carry out work with Beijing as the center.",
          },
          {
            chinese: "他以教书为乐。",
            pinyin: "Tā yǐ jiāo shū wéi lè.",
            english: "He takes pleasure in teaching.",
          },
        ],
      },
      {
        id: "g4-007",
        hskLevel: 4,
        title: "Result complement with 得 (de)",
        structure: "Verb + 得 + Result Description",
        explanation:
          "得 (de) connects a verb to a more detailed result complement describing the extent or outcome of the action.",
        examples: [
          {
            chinese: "他高兴得跳了起来。",
            pinyin: "Tā gāoxìng de tiào le qǐlái.",
            english: "He was so happy that he jumped up.",
          },
          {
            chinese: "她累得说不出话来。",
            pinyin: "Tā lèi de shuō bù chū huà lái.",
            english: "She was so tired she couldn't speak.",
          },
        ],
      },
      {
        id: "g4-008",
        hskLevel: 4,
        title: "Extended passive with 被 (bèi)",
        structure: "Subject + 被 + Agent + Verb + Other Elements",
        explanation:
          "The extended 被 passive can include more complex verb phrases with complements, 了, and other elements.",
        examples: [
          {
            chinese: "那棵树被风吹倒了。",
            pinyin: "Nà kē shù bèi fēng chuī dǎo le.",
            english: "That tree was blown down by the wind.",
          },
          {
            chinese: "他的建议被大家接受了。",
            pinyin: "Tā de jiànyì bèi dàjiā jiēshòu le.",
            english: "His suggestion was accepted by everyone.",
          },
        ],
      },
      {
        id: "g4-009",
        hskLevel: 4,
        title: "Nominalizer 所 (suǒ)",
        structure: "所 + Verb → Noun Phrase",
        explanation:
          "所 (suǒ) is placed before a verb to nominalize it, creating a noun phrase. Often used in formal or written Chinese.",
        examples: [
          {
            chinese: "这是我所知道的。",
            pinyin: "Zhè shì wǒ suǒ zhīdào de.",
            english: "This is what I know.",
          },
          {
            chinese: "他所说的话很有道理。",
            pinyin: "Tā suǒ shuō de huà hěn yǒu dàolǐ.",
            english: "What he said makes a lot of sense.",
          },
        ],
      },
      {
        id: "g4-010",
        hskLevel: 4,
        title: "Continuous state with 着 (zhe)",
        structure: "Verb + 着",
        explanation:
          "着 (zhe) indicates a continuous or ongoing state resulting from an action, rather than an action in progress.",
        examples: [
          {
            chinese: "门开着。",
            pinyin: "Mén kāi zhe.",
            english: "The door is open. (state)",
          },
          {
            chinese: "墙上挂着一幅画。",
            pinyin: "Qiáng shàng guà zhe yì fú huà.",
            english: "A painting is hanging on the wall.",
          },
        ],
      },
    ],
    5: [
      {
        id: "g5-001",
        hskLevel: 5,
        title: "以...为主 (yǐ...wéi zhǔ) - Mainly/Primarily",
        structure: "以 + Noun + 为主",
        explanation:
          "以...为主 means \"to take something as the main focus\" or \"primarily.\"",
        examples: [
          {
            chinese: "这个地区以农业为主。",
            pinyin: "Zhège dìqū yǐ nóngyè wéi zhǔ.",
            english: "This area is primarily focused on agriculture.",
          },
          {
            chinese: "我们的饮食以米饭为主。",
            pinyin: "Wǒmen de yǐnshí yǐ mǐfàn wéi zhǔ.",
            english: "Our diet is mainly rice-based.",
          },
        ],
      },
      {
        id: "g5-002",
        hskLevel: 5,
        title: "不得不 (bùdébù) - Have no choice but to",
        structure: "Subject + 不得不 + Verb",
        explanation:
          "不得不 expresses that someone has no choice but to do something, implying reluctance.",
        examples: [
          {
            chinese: "因为堵车，我不得不走路去。",
            pinyin: "Yīnwèi dǔchē, wǒ bùdébù zǒulù qù.",
            english: "Because of the traffic jam, I had no choice but to walk.",
          },
          {
            chinese: "他不得不接受这个事实。",
            pinyin: "Tā bùdébù jiēshòu zhège shìshí.",
            english: "He had no choice but to accept this fact.",
          },
        ],
      },
      {
        id: "g5-003",
        hskLevel: 5,
        title: "难免 (nánmiǎn) - Hard to avoid/Inevitable",
        structure: "难免 + (会) + Verb/Adj",
        explanation:
          "难免 indicates that something is hard to avoid or inevitable.",
        examples: [
          {
            chinese: "刚开始学，难免会犯错。",
            pinyin: "Gāng kāishǐ xué, nánmiǎn huì fàn cuò.",
            english: "When you first start learning, mistakes are inevitable.",
          },
          {
            chinese: "一个人在外面，难免会想家。",
            pinyin: "Yí gè rén zài wàimiàn, nánmiǎn huì xiǎng jiā.",
            english: "Being alone away from home, it's hard not to feel homesick.",
          },
        ],
      },
      {
        id: "g5-004",
        hskLevel: 5,
        title: "未必 (wèibì) - Not necessarily",
        structure: "未必 + Verb/Adj",
        explanation:
          "未必 means \"not necessarily\" and is used to express doubt about an assumption.",
        examples: [
          {
            chinese: "贵的东西未必好。",
            pinyin: "Guì de dōngxi wèibì hǎo.",
            english: "Expensive things are not necessarily good.",
          },
          {
            chinese: "他说的未必是真的。",
            pinyin: "Tā shuō de wèibì shì zhēn de.",
            english: "What he said is not necessarily true.",
          },
        ],
      },
      {
        id: "g5-005",
        hskLevel: 5,
        title: "何况 (hékuàng) - Let alone/Not to mention",
        structure: "..., 何况 + ...",
        explanation:
          "何况 means \"let alone\" or \"not to mention,\" used to emphasize that if the first point is true, the second is even more so.",
        examples: [
          {
            chinese: "大人都觉得难，何况小孩子。",
            pinyin: "Dàrén dōu juéde nán, hékuàng xiǎo háizi.",
            english: "Even adults find it hard, let alone children.",
          },
          {
            chinese: "我连中文都不会，何况日文。",
            pinyin: "Wǒ lián Zhōngwén dōu bú huì, hékuàng Rìwén.",
            english: "I can't even speak Chinese, let alone Japanese.",
          },
        ],
      },
      {
        id: "g5-006",
        hskLevel: 5,
        title: "尽管...还是 (jǐnguǎn...háishi) - Despite...still",
        structure: "尽管 + A，还是 + B",
        explanation:
          "尽管...还是 means \"despite A, B still happens,\" expressing a concession.",
        examples: [
          {
            chinese: "尽管很辛苦，他还是坚持了下来。",
            pinyin: "Jǐnguǎn hěn xīnkǔ, tā háishi jiānchí le xiàlái.",
            english: "Despite the hardship, he still persevered.",
          },
          {
            chinese: "尽管医生不建议，她还是去上班了。",
            pinyin: "Jǐnguǎn yīshēng bú jiànyì, tā háishi qù shàngbān le.",
            english: "Despite the doctor's advice, she still went to work.",
          },
        ],
      },
      {
        id: "g5-007",
        hskLevel: 5,
        title: "与其...不如 (yǔqí...bùrú) - Rather than...better to",
        structure: "与其 + A，不如 + B",
        explanation:
          "与其...不如 means \"rather than A, it would be better to B.\"",
        examples: [
          {
            chinese: "与其抱怨，不如行动。",
            pinyin: "Yǔqí bàoyuàn, bùrú xíngdòng.",
            english: "Rather than complaining, it's better to take action.",
          },
          {
            chinese: "与其在家等着，不如出去找。",
            pinyin: "Yǔqí zài jiā děng zhe, bùrú chūqù zhǎo.",
            english: "Rather than waiting at home, it's better to go out and look.",
          },
        ],
      },
      {
        id: "g5-008",
        hskLevel: 5,
        title: "宁可...也不 (nìngkě...yě bù) - Would rather...than",
        structure: "宁可 + A，也不 + B",
        explanation:
          "宁可...也不 means \"would rather A than B,\" expressing a strong preference.",
        examples: [
          {
            chinese: "他宁可走路，也不坐公交车。",
            pinyin: "Tā nìngkě zǒulù, yě bú zuò gōngjiāochē.",
            english: "He would rather walk than take the bus.",
          },
          {
            chinese: "我宁可少吃一顿，也不浪费食物。",
            pinyin: "Wǒ nìngkě shǎo chī yí dùn, yě bù làngfèi shíwù.",
            english: "I would rather skip a meal than waste food.",
          },
        ],
      },
      {
        id: "g5-009",
        hskLevel: 5,
        title: "一旦...就 (yídàn...jiù) - Once...then",
        structure: "一旦 + Condition，就 + Result",
        explanation:
          "一旦...就 means \"once something happens, then...\" It implies that once the condition occurs, the result follows quickly or inevitably.",
        examples: [
          {
            chinese: "一旦决定了，就不要后悔。",
            pinyin: "Yídàn juédìng le, jiù búyào hòuhuǐ.",
            english: "Once you've decided, don't regret it.",
          },
          {
            chinese: "一旦发现问题，就要马上解决。",
            pinyin: "Yídàn fāxiàn wèntí, jiù yào mǎshàng jiějué.",
            english: "Once a problem is found, it must be solved immediately.",
          },
        ],
      },
      {
        id: "g5-010",
        hskLevel: 5,
        title: "凡是...都 (fánshì...dōu) - All/Every...without exception",
        structure: "凡是 + Noun/Condition + 都 + ...",
        explanation:
          "凡是...都 means \"every\" or \"all without exception,\" emphasizing universality.",
        examples: [
          {
            chinese: "凡是去过那里的人都说好。",
            pinyin: "Fánshì qù guò nàlǐ de rén dōu shuō hǎo.",
            english: "Everyone who has been there says it's great.",
          },
          {
            chinese: "凡是认识他的人都喜欢他。",
            pinyin: "Fánshì rènshi tā de rén dōu xǐhuān tā.",
            english: "Everyone who knows him likes him.",
          },
        ],
      },
    ],
    6: [
      {
        id: "g6-001",
        hskLevel: 6,
        title: "以至于 (yǐzhìyú) - So much so that",
        structure: "..., 以至于 + Result",
        explanation:
          "以至于 introduces an extreme result or consequence of a preceding situation, meaning \"so much so that\" or \"to the extent that.\"",
        examples: [
          {
            chinese: "他太忙了，以至于忘了吃饭。",
            pinyin: "Tā tài máng le, yǐzhìyú wàng le chī fàn.",
            english: "He was so busy that he forgot to eat.",
          },
          {
            chinese: "污染严重，以至于河里的鱼都死了。",
            pinyin: "Wūrǎn yánzhòng, yǐzhìyú hé lǐ de yú dōu sǐ le.",
            english: "The pollution was so severe that all the fish in the river died.",
          },
        ],
      },
      {
        id: "g6-002",
        hskLevel: 6,
        title: "有鉴于此 (yǒu jiàn yú cǐ) - In view of this",
        structure: "有鉴于此，...",
        explanation:
          "有鉴于此 is a formal expression meaning \"in view of this\" or \"given these circumstances,\" used to introduce a conclusion or action based on prior reasoning.",
        examples: [
          {
            chinese: "近年来事故频发。有鉴于此，我们加强了安全管理。",
            pinyin: "Jìnnián lái shìgù pín fā. Yǒu jiàn yú cǐ, wǒmen jiāqiáng le ānquán guǎnlǐ.",
            english: "Accidents have been frequent in recent years. In view of this, we have strengthened safety management.",
          },
          {
            chinese: "成本不断上升。有鉴于此，公司决定调整价格。",
            pinyin: "Chéngběn búduàn shàngshēng. Yǒu jiàn yú cǐ, gōngsī juédìng tiáozhěng jiàgé.",
            english: "Costs keep rising. In view of this, the company decided to adjust prices.",
          },
        ],
      },
      {
        id: "g6-003",
        hskLevel: 6,
        title: "归根结底 (guīgēnjiédǐ) - In the final analysis",
        structure: "归根结底，...",
        explanation:
          "归根结底 means \"in the final analysis\" or \"when all is said and done.\" It introduces the fundamental reason or conclusion.",
        examples: [
          {
            chinese: "归根结底，教育是最重要的投资。",
            pinyin: "Guīgēnjiédǐ, jiàoyù shì zuì zhòngyào de tóuzī.",
            english: "In the final analysis, education is the most important investment.",
          },
          {
            chinese: "归根结底，问题出在管理上。",
            pinyin: "Guīgēnjiédǐ, wèntí chū zài guǎnlǐ shàng.",
            english: "Ultimately, the problem lies in management.",
          },
        ],
      },
      {
        id: "g6-004",
        hskLevel: 6,
        title: "迫不得已 (pòbùdéyǐ) - Have no alternative",
        structure: "迫不得已 + (才) + Verb",
        explanation:
          "迫不得已 means one is forced by circumstances with absolutely no alternative. Stronger than 不得不.",
        examples: [
          {
            chinese: "他迫不得已才卖掉了房子。",
            pinyin: "Tā pòbùdéyǐ cái mài diào le fángzi.",
            english: "He had absolutely no choice but to sell the house.",
          },
          {
            chinese: "迫不得已的情况下，我们只能推迟计划。",
            pinyin: "Pòbùdéyǐ de qíngkuàng xià, wǒmen zhǐ néng tuīchí jìhuà.",
            english: "Under unavoidable circumstances, we can only postpone the plan.",
          },
        ],
      },
      {
        id: "g6-005",
        hskLevel: 6,
        title: "出于 (chūyú) - Out of/Due to",
        structure: "出于 + Reason/Motive",
        explanation:
          "出于 means \"out of\" or \"due to\" and is used to state the reason or motive behind an action.",
        examples: [
          {
            chinese: "他出于好奇打开了那扇门。",
            pinyin: "Tā chūyú hàoqí dǎkāi le nà shàn mén.",
            english: "He opened that door out of curiosity.",
          },
          {
            chinese: "出于安全考虑，这条路已经封闭。",
            pinyin: "Chūyú ānquán kǎolǜ, zhè tiáo lù yǐjīng fēngbì.",
            english: "Due to safety concerns, this road has been closed.",
          },
        ],
      },
      {
        id: "g6-006",
        hskLevel: 6,
        title: "鉴于 (jiànyú) - In light of/Given that",
        structure: "鉴于 + Situation，...",
        explanation:
          "鉴于 means \"in light of\" or \"given that\" and is used in formal contexts to state a reason before a decision or suggestion.",
        examples: [
          {
            chinese: "鉴于目前的情况，会议推迟到下周。",
            pinyin: "Jiànyú mùqián de qíngkuàng, huìyì tuīchí dào xià zhōu.",
            english: "Given the current situation, the meeting is postponed to next week.",
          },
          {
            chinese: "鉴于他的表现，公司决定给他升职。",
            pinyin: "Jiànyú tā de biǎoxiàn, gōngsī juédìng gěi tā shēng zhí.",
            english: "In light of his performance, the company decided to promote him.",
          },
        ],
      },
      {
        id: "g6-007",
        hskLevel: 6,
        title: "就...而言 (jiù...éryán) - As far as...is concerned",
        structure: "就 + Topic + 而言，...",
        explanation:
          "就...而言 means \"as far as...is concerned\" or \"in terms of,\" used to limit the scope of a statement.",
        examples: [
          {
            chinese: "就质量而言，这个产品是最好的。",
            pinyin: "Jiù zhìliàng éryán, zhège chǎnpǐn shì zuì hǎo de.",
            english: "In terms of quality, this product is the best.",
          },
          {
            chinese: "就目前而言，计划进展顺利。",
            pinyin: "Jiù mùqián éryán, jìhuà jìnzhǎn shùnlì.",
            english: "As far as the current situation goes, the plan is progressing smoothly.",
          },
        ],
      },
      {
        id: "g6-008",
        hskLevel: 6,
        title: "乃至 (nǎizhì) - And even/Up to",
        structure: "A，乃至 + B",
        explanation:
          "乃至 means \"and even\" or \"up to and including,\" indicating an escalation from A to B.",
        examples: [
          {
            chinese: "这件事影响了整个城市，乃至全国。",
            pinyin: "Zhè jiàn shì yǐngxiǎng le zhěnggè chéngshì, nǎizhì quánguó.",
            english: "This matter affected the entire city, and even the whole country.",
          },
          {
            chinese: "他的研究影响了学术界，乃至社会各界。",
            pinyin: "Tā de yánjiū yǐngxiǎng le xuéshù jiè, nǎizhì shèhuì gè jiè.",
            english: "His research influenced academia, and even all sectors of society.",
          },
        ],
      },
      {
        id: "g6-009",
        hskLevel: 6,
        title: "以免 (yǐmiǎn) - In order to avoid/Lest",
        structure: "..., 以免 + Undesired Result",
        explanation:
          "以免 means \"in order to avoid\" or \"so as not to.\" It introduces something one wants to prevent.",
        examples: [
          {
            chinese: "你早点出发，以免迟到。",
            pinyin: "Nǐ zǎo diǎn chūfā, yǐmiǎn chídào.",
            english: "Leave early so as not to be late.",
          },
          {
            chinese: "请仔细检查，以免出错。",
            pinyin: "Qǐng zǐxì jiǎnchá, yǐmiǎn chū cuò.",
            english: "Please check carefully to avoid making mistakes.",
          },
        ],
      },
      {
        id: "g6-010",
        hskLevel: 6,
        title: "不可避免地 (bùkě bìmiǎn de) - Inevitably",
        structure: "不可避免地 + Verb",
        explanation:
          "不可避免地 is an adverb meaning \"inevitably\" or \"unavoidably,\" used in formal writing to indicate something cannot be prevented.",
        examples: [
          {
            chinese: "全球化不可避免地改变了人们的生活方式。",
            pinyin: "Quánqiúhuà bùkě bìmiǎn de gǎibiàn le rénmen de shēnghuó fāngshì.",
            english: "Globalization has inevitably changed people's way of life.",
          },
          {
            chinese: "技术进步不可避免地带来了新的挑战。",
            pinyin: "Jìshù jìnbù bùkě bìmiǎn de dàilái le xīn de tiǎozhàn.",
            english: "Technological progress inevitably brings new challenges.",
          },
        ],
      },
    ],
  };

  for (let level = 1; level <= 6; level++) {
    const data = grammarData[level] || [];
    writeFileSync(
      join(OUTPUT_DIR, `hsk${level}-grammar.json`),
      JSON.stringify(data, null, 2)
    );
    console.log(`HSK ${level} grammar: ${data.length} patterns`);
  }
}

function generateSampleSentences(): void {
  const sentenceData: Record<number, OutputSentence[]> = {
    1: [
      {
        id: "s1-001",
        hskLevel: 1,
        targetSentence: "我是学生。",
        targetPinyin: "Wǒ shì xuéshēng.",
        targetMeaning: "I am a student.",
        wordBank: ["我", "是", "学生", "。"],
      },
      {
        id: "s1-002",
        hskLevel: 1,
        targetSentence: "他不喝茶。",
        targetPinyin: "Tā bù hē chá.",
        targetMeaning: "He doesn't drink tea.",
        wordBank: ["他", "不", "喝", "茶", "。"],
      },
      {
        id: "s1-003",
        hskLevel: 1,
        targetSentence: "你叫什么名字？",
        targetPinyin: "Nǐ jiào shénme míngzì?",
        targetMeaning: "What is your name?",
        wordBank: ["你", "叫", "什么", "名字", "？"],
      },
      {
        id: "s1-004",
        hskLevel: 1,
        targetSentence: "我有两个朋友。",
        targetPinyin: "Wǒ yǒu liǎng gè péngyǒu.",
        targetMeaning: "I have two friends.",
        wordBank: ["我", "有", "两个", "朋友", "。"],
      },
      {
        id: "s1-005",
        hskLevel: 1,
        targetSentence: "她很漂亮。",
        targetPinyin: "Tā hěn piàoliang.",
        targetMeaning: "She is very pretty.",
        wordBank: ["她", "很", "漂亮", "。"],
      },
      {
        id: "s1-006",
        hskLevel: 1,
        targetSentence: "今天天气很好。",
        targetPinyin: "Jīntiān tiānqì hěn hǎo.",
        targetMeaning: "The weather is very good today.",
        wordBank: ["今天", "天气", "很", "好", "。"],
      },
      {
        id: "s1-007",
        hskLevel: 1,
        targetSentence: "你喜欢吃什么？",
        targetPinyin: "Nǐ xǐhuān chī shénme?",
        targetMeaning: "What do you like to eat?",
        wordBank: ["你", "喜欢", "吃", "什么", "？"],
      },
      {
        id: "s1-008",
        hskLevel: 1,
        targetSentence: "我的书在桌子上。",
        targetPinyin: "Wǒ de shū zài zhuōzi shàng.",
        targetMeaning: "My book is on the table.",
        wordBank: ["我的", "书", "在", "桌子", "上", "。"],
      },
    ],
    2: [
      {
        id: "s2-001",
        hskLevel: 2,
        targetSentence: "我吃了早饭。",
        targetPinyin: "Wǒ chī le zǎofàn.",
        targetMeaning: "I ate breakfast.",
        wordBank: ["我", "吃", "了", "早饭", "。"],
      },
      {
        id: "s2-002",
        hskLevel: 2,
        targetSentence: "他比我高。",
        targetPinyin: "Tā bǐ wǒ gāo.",
        targetMeaning: "He is taller than me.",
        wordBank: ["他", "比", "我", "高", "。"],
      },
      {
        id: "s2-003",
        hskLevel: 2,
        targetSentence: "你去过中国吗？",
        targetPinyin: "Nǐ qù guò Zhōngguó ma?",
        targetMeaning: "Have you been to China?",
        wordBank: ["你", "去", "过", "中国", "吗", "？"],
      },
      {
        id: "s2-004",
        hskLevel: 2,
        targetSentence: "妈妈正在做饭。",
        targetPinyin: "Māma zhèngzài zuò fàn.",
        targetMeaning: "Mom is cooking right now.",
        wordBank: ["妈妈", "正在", "做饭", "。"],
      },
      {
        id: "s2-005",
        hskLevel: 2,
        targetSentence: "火车要开了。",
        targetPinyin: "Huǒchē yào kāi le.",
        targetMeaning: "The train is about to depart.",
        wordBank: ["火车", "要", "开", "了", "。"],
      },
      {
        id: "s2-006",
        hskLevel: 2,
        targetSentence: "她唱得很好。",
        targetPinyin: "Tā chàng de hěn hǎo.",
        targetMeaning: "She sings very well.",
        wordBank: ["她", "唱", "得", "很好", "。"],
      },
      {
        id: "s2-007",
        hskLevel: 2,
        targetSentence: "你喝咖啡还是茶？",
        targetPinyin: "Nǐ hē kāfēi háishi chá?",
        targetMeaning: "Do you drink coffee or tea?",
        wordBank: ["你", "喝", "咖啡", "还是", "茶", "？"],
      },
      {
        id: "s2-008",
        hskLevel: 2,
        targetSentence: "今天有点儿冷。",
        targetPinyin: "Jīntiān yǒudiǎnr lěng.",
        targetMeaning: "It's a bit cold today.",
        wordBank: ["今天", "有点儿", "冷", "。"],
      },
    ],
    3: [
      {
        id: "s3-001",
        hskLevel: 3,
        targetSentence: "请把门关上。",
        targetPinyin: "Qǐng bǎ mén guān shàng.",
        targetMeaning: "Please close the door.",
        wordBank: ["请", "把", "门", "关上", "。"],
      },
      {
        id: "s3-002",
        hskLevel: 3,
        targetSentence: "我的手机被偷了。",
        targetPinyin: "Wǒ de shǒujī bèi tōu le.",
        targetMeaning: "My phone was stolen.",
        wordBank: ["我的", "手机", "被", "偷", "了", "。"],
      },
      {
        id: "s3-003",
        hskLevel: 3,
        targetSentence: "天气越来越冷了。",
        targetPinyin: "Tiānqì yuèláiyuè lěng le.",
        targetMeaning: "The weather is getting colder and colder.",
        wordBank: ["天气", "越来越", "冷", "了", "。"],
      },
      {
        id: "s3-004",
        hskLevel: 3,
        targetSentence: "虽然很累，但是我很开心。",
        targetPinyin: "Suīrán hěn lèi, dànshì wǒ hěn kāixīn.",
        targetMeaning: "Although I'm tired, I'm very happy.",
        wordBank: ["虽然", "很累", "，", "但是", "我", "很", "开心", "。"],
      },
      {
        id: "s3-005",
        hskLevel: 3,
        targetSentence: "如果明天下雨，我们就不去了。",
        targetPinyin: "Rúguǒ míngtiān xià yǔ, wǒmen jiù bú qù le.",
        targetMeaning: "If it rains tomorrow, we won't go.",
        wordBank: ["如果", "明天", "下雨", "，", "我们", "就", "不去", "了", "。"],
      },
      {
        id: "s3-006",
        hskLevel: 3,
        targetSentence: "他一边吃饭一边看电视。",
        targetPinyin: "Tā yìbiān chī fàn yìbiān kàn diànshì.",
        targetMeaning: "He eats while watching TV.",
        wordBank: ["他", "一边", "吃饭", "一边", "看电视", "。"],
      },
      {
        id: "s3-007",
        hskLevel: 3,
        targetSentence: "除了中文以外，我也学日语。",
        targetPinyin: "Chúle Zhōngwén yǐwài, wǒ yě xué Rìyǔ.",
        targetMeaning: "Besides Chinese, I also study Japanese.",
        wordBank: ["除了", "中文", "以外", "，", "我", "也", "学", "日语", "。"],
      },
      {
        id: "s3-008",
        hskLevel: 3,
        targetSentence: "对我来说，学中文很有意思。",
        targetPinyin: "Duì wǒ lái shuō, xué Zhōngwén hěn yǒu yìsi.",
        targetMeaning: "For me, learning Chinese is very interesting.",
        wordBank: ["对", "我", "来说", "，", "学中文", "很", "有意思", "。"],
      },
    ],
    4: [
      {
        id: "s4-001",
        hskLevel: 4,
        targetSentence: "即使下雨，我也要去。",
        targetPinyin: "Jíshǐ xià yǔ, wǒ yě yào qù.",
        targetMeaning: "Even if it rains, I will still go.",
        wordBank: ["即使", "下雨", "，", "我", "也", "要去", "。"],
      },
      {
        id: "s4-002",
        hskLevel: 4,
        targetSentence: "无论多忙，他都坚持锻炼。",
        targetPinyin: "Wúlùn duō máng, tā dōu jiānchí duànliàn.",
        targetMeaning: "No matter how busy, he always keeps exercising.",
        wordBank: ["无论", "多忙", "，", "他", "都", "坚持", "锻炼", "。"],
      },
      {
        id: "s4-003",
        hskLevel: 4,
        targetSentence: "这个餐厅既便宜又好吃。",
        targetPinyin: "Zhège cāntīng jì piányi yòu hǎochī.",
        targetMeaning: "This restaurant is both cheap and delicious.",
        wordBank: ["这个", "餐厅", "既", "便宜", "又", "好吃", "。"],
      },
      {
        id: "s4-004",
        hskLevel: 4,
        targetSentence: "门开着。",
        targetPinyin: "Mén kāi zhe.",
        targetMeaning: "The door is open.",
        wordBank: ["门", "开", "着", "。"],
      },
      {
        id: "s4-005",
        hskLevel: 4,
        targetSentence: "那棵树被风吹倒了。",
        targetPinyin: "Nà kē shù bèi fēng chuī dǎo le.",
        targetMeaning: "That tree was blown down by the wind.",
        wordBank: ["那棵", "树", "被", "风", "吹倒", "了", "。"],
      },
      {
        id: "s4-006",
        hskLevel: 4,
        targetSentence: "他高兴得跳了起来。",
        targetPinyin: "Tā gāoxìng de tiào le qǐlái.",
        targetMeaning: "He was so happy that he jumped up.",
        wordBank: ["他", "高兴", "得", "跳了", "起来", "。"],
      },
      {
        id: "s4-007",
        hskLevel: 4,
        targetSentence: "这是我所知道的。",
        targetPinyin: "Zhè shì wǒ suǒ zhīdào de.",
        targetMeaning: "This is what I know.",
        wordBank: ["这", "是", "我", "所", "知道", "的", "。"],
      },
      {
        id: "s4-008",
        hskLevel: 4,
        targetSentence: "墙上挂着一幅画。",
        targetPinyin: "Qiáng shàng guà zhe yì fú huà.",
        targetMeaning: "A painting is hanging on the wall.",
        wordBank: ["墙上", "挂", "着", "一幅", "画", "。"],
      },
    ],
    5: [
      {
        id: "s5-001",
        hskLevel: 5,
        targetSentence: "与其抱怨，不如行动。",
        targetPinyin: "Yǔqí bàoyuàn, bùrú xíngdòng.",
        targetMeaning: "Rather than complaining, it's better to take action.",
        wordBank: ["与其", "抱怨", "，", "不如", "行动", "。"],
      },
      {
        id: "s5-002",
        hskLevel: 5,
        targetSentence: "贵的东西未必好。",
        targetPinyin: "Guì de dōngxi wèibì hǎo.",
        targetMeaning: "Expensive things are not necessarily good.",
        wordBank: ["贵的", "东西", "未必", "好", "。"],
      },
      {
        id: "s5-003",
        hskLevel: 5,
        targetSentence: "一旦决定了，就不要后悔。",
        targetPinyin: "Yídàn juédìng le, jiù búyào hòuhuǐ.",
        targetMeaning: "Once you've decided, don't regret it.",
        wordBank: ["一旦", "决定", "了", "，", "就", "不要", "后悔", "。"],
      },
      {
        id: "s5-004",
        hskLevel: 5,
        targetSentence: "因为堵车，我不得不走路去。",
        targetPinyin: "Yīnwèi dǔchē, wǒ bùdébù zǒulù qù.",
        targetMeaning: "Because of the traffic jam, I had no choice but to walk.",
        wordBank: ["因为", "堵车", "，", "我", "不得不", "走路", "去", "。"],
      },
      {
        id: "s5-005",
        hskLevel: 5,
        targetSentence: "凡是去过那里的人都说好。",
        targetPinyin: "Fánshì qù guò nàlǐ de rén dōu shuō hǎo.",
        targetMeaning: "Everyone who has been there says it's great.",
        wordBank: ["凡是", "去过", "那里", "的人", "都", "说好", "。"],
      },
      {
        id: "s5-006",
        hskLevel: 5,
        targetSentence: "尽管很辛苦，他还是坚持了下来。",
        targetPinyin: "Jǐnguǎn hěn xīnkǔ, tā háishi jiānchí le xiàlái.",
        targetMeaning: "Despite the hardship, he still persevered.",
        wordBank: ["尽管", "很", "辛苦", "，", "他", "还是", "坚持", "了", "下来", "。"],
      },
      {
        id: "s5-007",
        hskLevel: 5,
        targetSentence: "这个地区以农业为主。",
        targetPinyin: "Zhège dìqū yǐ nóngyè wéi zhǔ.",
        targetMeaning: "This area is primarily focused on agriculture.",
        wordBank: ["这个", "地区", "以", "农业", "为主", "。"],
      },
      {
        id: "s5-008",
        hskLevel: 5,
        targetSentence: "大人都觉得难，何况小孩子。",
        targetPinyin: "Dàrén dōu juéde nán, hékuàng xiǎo háizi.",
        targetMeaning: "Even adults find it hard, let alone children.",
        wordBank: ["大人", "都", "觉得", "难", "，", "何况", "小孩子", "。"],
      },
    ],
    6: [
      {
        id: "s6-001",
        hskLevel: 6,
        targetSentence: "他太忙了，以至于忘了吃饭。",
        targetPinyin: "Tā tài máng le, yǐzhìyú wàng le chī fàn.",
        targetMeaning: "He was so busy that he forgot to eat.",
        wordBank: ["他", "太忙", "了", "，", "以至于", "忘了", "吃饭", "。"],
      },
      {
        id: "s6-002",
        hskLevel: 6,
        targetSentence: "归根结底，教育是最重要的投资。",
        targetPinyin: "Guīgēnjiédǐ, jiàoyù shì zuì zhòngyào de tóuzī.",
        targetMeaning: "In the final analysis, education is the most important investment.",
        wordBank: ["归根结底", "，", "教育", "是", "最重要的", "投资", "。"],
      },
      {
        id: "s6-003",
        hskLevel: 6,
        targetSentence: "你早点出发，以免迟到。",
        targetPinyin: "Nǐ zǎo diǎn chūfā, yǐmiǎn chídào.",
        targetMeaning: "Leave early so as not to be late.",
        wordBank: ["你", "早点", "出发", "，", "以免", "迟到", "。"],
      },
      {
        id: "s6-004",
        hskLevel: 6,
        targetSentence: "出于安全考虑，这条路已经封闭。",
        targetPinyin: "Chūyú ānquán kǎolǜ, zhè tiáo lù yǐjīng fēngbì.",
        targetMeaning: "Due to safety concerns, this road has been closed.",
        wordBank: ["出于", "安全", "考虑", "，", "这条", "路", "已经", "封闭", "。"],
      },
      {
        id: "s6-005",
        hskLevel: 6,
        targetSentence: "就质量而言，这个产品是最好的。",
        targetPinyin: "Jiù zhìliàng éryán, zhège chǎnpǐn shì zuì hǎo de.",
        targetMeaning: "In terms of quality, this product is the best.",
        wordBank: ["就", "质量", "而言", "，", "这个", "产品", "是", "最好的", "。"],
      },
      {
        id: "s6-006",
        hskLevel: 6,
        targetSentence: "他迫不得已才卖掉了房子。",
        targetPinyin: "Tā pòbùdéyǐ cái mài diào le fángzi.",
        targetMeaning: "He had absolutely no choice but to sell the house.",
        wordBank: ["他", "迫不得已", "才", "卖掉", "了", "房子", "。"],
      },
      {
        id: "s6-007",
        hskLevel: 6,
        targetSentence: "这件事影响了整个城市，乃至全国。",
        targetPinyin: "Zhè jiàn shì yǐngxiǎng le zhěnggè chéngshì, nǎizhì quánguó.",
        targetMeaning: "This matter affected the entire city, and even the whole country.",
        wordBank: ["这件事", "影响", "了", "整个", "城市", "，", "乃至", "全国", "。"],
      },
      {
        id: "s6-008",
        hskLevel: 6,
        targetSentence: "请仔细检查，以免出错。",
        targetPinyin: "Qǐng zǐxì jiǎnchá, yǐmiǎn chū cuò.",
        targetMeaning: "Please check carefully to avoid making mistakes.",
        wordBank: ["请", "仔细", "检查", "，", "以免", "出错", "。"],
      },
    ],
  };

  for (let level = 1; level <= 6; level++) {
    const data = sentenceData[level] || [];
    writeFileSync(
      join(OUTPUT_DIR, `hsk${level}-sentences.json`),
      JSON.stringify(data, null, 2)
    );
    console.log(`HSK ${level} sentences: ${data.length} exercises`);
  }
}

function generateSampleDialogues(): void {
  const dialogueData: Record<number, OutputDialogue[]> = {
    1: [
      {
        id: "d1-001",
        hskLevel: 1,
        title: "Meeting Someone New",
        context: "At school",
        lines: [
          { speaker: "A", chinese: "你好！", pinyin: "Nǐ hǎo!", english: "Hello!" },
          { speaker: "B", chinese: "你好！你叫什么名字？", pinyin: "Nǐ hǎo! Nǐ jiào shénme míngzì?", english: "Hello! What's your name?" },
          { speaker: "A", chinese: "我叫李明。你呢？", pinyin: "Wǒ jiào Lǐ Míng. Nǐ ne?", english: "My name is Li Ming. And you?" },
          { speaker: "B", chinese: "我叫王小红。认识你很高兴！", pinyin: "Wǒ jiào Wáng Xiǎohóng. Rènshí nǐ hěn gāoxìng!", english: "My name is Wang Xiaohong. Nice to meet you!" },
          { speaker: "A", chinese: "认识你我也很高兴！", pinyin: "Rènshí nǐ wǒ yě hěn gāoxìng!", english: "Nice to meet you too!" },
        ],
      },
      {
        id: "d1-002",
        hskLevel: 1,
        title: "At a Restaurant",
        context: "Ordering food",
        lines: [
          { speaker: "A", chinese: "你好，请问你想吃什么？", pinyin: "Nǐ hǎo, qǐngwèn nǐ xiǎng chī shénme?", english: "Hello, what would you like to eat?" },
          { speaker: "B", chinese: "我想吃米饭。", pinyin: "Wǒ xiǎng chī mǐfàn.", english: "I'd like to eat rice." },
          { speaker: "A", chinese: "好的。你想喝什么？", pinyin: "Hǎo de. Nǐ xiǎng hē shénme?", english: "OK. What would you like to drink?" },
          { speaker: "B", chinese: "我喝水，谢谢。", pinyin: "Wǒ hē shuǐ, xièxiè.", english: "I'll have water, thank you." },
          { speaker: "A", chinese: "好的，请等一下。", pinyin: "Hǎo de, qǐng děng yíxià.", english: "OK, please wait a moment." },
        ],
      },
      {
        id: "d1-003",
        hskLevel: 1,
        title: "What Day Is It?",
        context: "Asking about the date",
        lines: [
          { speaker: "A", chinese: "今天星期几？", pinyin: "Jīntiān xīngqī jǐ?", english: "What day is it today?" },
          { speaker: "B", chinese: "今天星期三。", pinyin: "Jīntiān xīngqī sān.", english: "Today is Wednesday." },
          { speaker: "A", chinese: "明天你有时间吗？", pinyin: "Míngtiān nǐ yǒu shíjiān ma?", english: "Do you have time tomorrow?" },
          { speaker: "B", chinese: "有，你想做什么？", pinyin: "Yǒu, nǐ xiǎng zuò shénme?", english: "Yes, what do you want to do?" },
          { speaker: "A", chinese: "我们去看电影吧！", pinyin: "Wǒmen qù kàn diànyǐng ba!", english: "Let's go see a movie!" },
          { speaker: "B", chinese: "好的！几点？", pinyin: "Hǎo de! Jǐ diǎn?", english: "OK! What time?" },
        ],
      },
      {
        id: "d1-004",
        hskLevel: 1,
        title: "Shopping",
        context: "At a store",
        lines: [
          { speaker: "A", chinese: "这个多少钱？", pinyin: "Zhège duōshǎo qián?", english: "How much is this?" },
          { speaker: "B", chinese: "五十块。", pinyin: "Wǔshí kuài.", english: "50 yuan." },
          { speaker: "A", chinese: "太贵了！便宜一点吧。", pinyin: "Tài guì le! Piányi yìdiǎn ba.", english: "Too expensive! Make it cheaper." },
          { speaker: "B", chinese: "四十块，可以吗？", pinyin: "Sìshí kuài, kěyǐ ma?", english: "40 yuan, OK?" },
          { speaker: "A", chinese: "好的，我买了。", pinyin: "Hǎo de, wǒ mǎi le.", english: "OK, I'll buy it." },
        ],
      },
      {
        id: "d1-005",
        hskLevel: 1,
        title: "Where Are You From?",
        context: "Getting to know each other",
        lines: [
          { speaker: "A", chinese: "你是哪国人？", pinyin: "Nǐ shì nǎ guó rén?", english: "What country are you from?" },
          { speaker: "B", chinese: "我是美国人。你呢？", pinyin: "Wǒ shì Měiguó rén. Nǐ ne?", english: "I'm American. And you?" },
          { speaker: "A", chinese: "我是中国人。你会说中文吗？", pinyin: "Wǒ shì Zhōngguó rén. Nǐ huì shuō Zhōngwén ma?", english: "I'm Chinese. Can you speak Chinese?" },
          { speaker: "B", chinese: "我会说一点。", pinyin: "Wǒ huì shuō yìdiǎn.", english: "I can speak a little." },
          { speaker: "A", chinese: "你说得很好！", pinyin: "Nǐ shuō de hěn hǎo!", english: "You speak very well!" },
        ],
      },
    ],
    2: [
      {
        id: "d2-001",
        hskLevel: 2,
        title: "Taking the Bus",
        context: "Asking for directions on public transport",
        lines: [
          { speaker: "A", chinese: "请问，去火车站坐几路车？", pinyin: "Qǐngwèn, qù huǒchēzhàn zuò jǐ lù chē?", english: "Excuse me, which bus goes to the train station?" },
          { speaker: "B", chinese: "你可以坐三路车。", pinyin: "Nǐ kěyǐ zuò sān lù chē.", english: "You can take bus number 3." },
          { speaker: "A", chinese: "从这里到火车站要多长时间？", pinyin: "Cóng zhèlǐ dào huǒchēzhàn yào duō cháng shíjiān?", english: "How long does it take from here to the train station?" },
          { speaker: "B", chinese: "大概二十分钟。", pinyin: "Dàgài èrshí fēnzhōng.", english: "About twenty minutes." },
          { speaker: "A", chinese: "谢谢你！", pinyin: "Xièxiè nǐ!", english: "Thank you!" },
        ],
      },
      {
        id: "d2-002",
        hskLevel: 2,
        title: "Talking About the Weather",
        context: "Daily conversation between friends",
        lines: [
          { speaker: "A", chinese: "今天比昨天冷多了。", pinyin: "Jīntiān bǐ zuótiān lěng duō le.", english: "Today is much colder than yesterday." },
          { speaker: "B", chinese: "是啊，要下雨了。", pinyin: "Shì a, yào xià yǔ le.", english: "Yeah, it's about to rain." },
          { speaker: "A", chinese: "你带伞了吗？", pinyin: "Nǐ dài sǎn le ma?", english: "Did you bring an umbrella?" },
          { speaker: "B", chinese: "没有，我忘了。", pinyin: "Méiyǒu, wǒ wàng le.", english: "No, I forgot." },
          { speaker: "A", chinese: "我有两把，给你一把吧。", pinyin: "Wǒ yǒu liǎng bǎ, gěi nǐ yì bǎ ba.", english: "I have two, let me give you one." },
        ],
      },
      {
        id: "d2-003",
        hskLevel: 2,
        title: "At the Doctor's Office",
        context: "Describing symptoms",
        lines: [
          { speaker: "A", chinese: "你哪儿不舒服？", pinyin: "Nǐ nǎr bù shūfu?", english: "Where do you feel uncomfortable?" },
          { speaker: "B", chinese: "我头疼，还有点儿发烧。", pinyin: "Wǒ tóu téng, hái yǒudiǎnr fāshāo.", english: "I have a headache, and I have a slight fever." },
          { speaker: "A", chinese: "你是什么时候开始不舒服的？", pinyin: "Nǐ shì shénme shíhòu kāishǐ bù shūfu de?", english: "When did you start feeling unwell?" },
          { speaker: "B", chinese: "昨天晚上开始的。", pinyin: "Zuótiān wǎnshang kāishǐ de.", english: "It started last night." },
          { speaker: "A", chinese: "你要多喝水，多休息。", pinyin: "Nǐ yào duō hē shuǐ, duō xiūxi.", english: "You should drink more water and rest more." },
        ],
      },
      {
        id: "d2-004",
        hskLevel: 2,
        title: "Weekend Plans",
        context: "Making plans with a friend",
        lines: [
          { speaker: "A", chinese: "周末你想做什么？", pinyin: "Zhōumò nǐ xiǎng zuò shénme?", english: "What do you want to do this weekend?" },
          { speaker: "B", chinese: "我正在想去爬山还是去游泳。", pinyin: "Wǒ zhèngzài xiǎng qù pá shān háishi qù yóuyǒng.", english: "I'm thinking about whether to go hiking or swimming." },
          { speaker: "A", chinese: "我觉得爬山比游泳有意思。", pinyin: "Wǒ juéde pá shān bǐ yóuyǒng yǒu yìsi.", english: "I think hiking is more fun than swimming." },
          { speaker: "B", chinese: "好的，那我们一起去吧！", pinyin: "Hǎo de, nà wǒmen yìqǐ qù ba!", english: "OK, let's go together then!" },
        ],
      },
    ],
    3: [
      {
        id: "d3-001",
        hskLevel: 3,
        title: "Renting an Apartment",
        context: "Discussing housing options",
        lines: [
          { speaker: "A", chinese: "你找到房子了吗？", pinyin: "Nǐ zhǎo dào fángzi le ma?", english: "Have you found an apartment?" },
          { speaker: "B", chinese: "还没有。虽然看了很多，但是都太贵了。", pinyin: "Hái méiyǒu. Suīrán kàn le hěn duō, dànshì dōu tài guì le.", english: "Not yet. Although I've looked at many, they're all too expensive." },
          { speaker: "A", chinese: "如果你想便宜一点，就住远一点吧。", pinyin: "Rúguǒ nǐ xiǎng piányi yìdiǎn, jiù zhù yuǎn yìdiǎn ba.", english: "If you want cheaper, then live a bit farther away." },
          { speaker: "B", chinese: "对我来说，上班方便比较重要。", pinyin: "Duì wǒ lái shuō, shàngbān fāngbiàn bǐjiào zhòngyào.", english: "For me, a convenient commute is more important." },
          { speaker: "A", chinese: "那你可以一边找房子一边住我这儿。", pinyin: "Nà nǐ kěyǐ yìbiān zhǎo fángzi yìbiān zhù wǒ zhèr.", english: "Then you can stay at my place while you keep looking." },
        ],
      },
      {
        id: "d3-002",
        hskLevel: 3,
        title: "Learning Chinese",
        context: "Discussing study experiences",
        lines: [
          { speaker: "A", chinese: "你的中文越来越好了！", pinyin: "Nǐ de Zhōngwén yuèláiyuè hǎo le!", english: "Your Chinese is getting better and better!" },
          { speaker: "B", chinese: "谢谢！不过汉字太难了，我连简单的都记不住。", pinyin: "Xièxiè! Búguò hànzì tài nán le, wǒ lián jiǎndān de dōu jì bú zhù.", english: "Thanks! But characters are too hard, I can't even remember the simple ones." },
          { speaker: "A", chinese: "除了多写以外，你也可以用手机软件学。", pinyin: "Chúle duō xiě yǐwài, nǐ yě kěyǐ yòng shǒujī ruǎnjiàn xué.", english: "Besides writing more, you can also use phone apps to study." },
          { speaker: "B", chinese: "好主意！你能不能推荐一个？", pinyin: "Hǎo zhǔyi! Nǐ néng bù néng tuījiàn yí gè?", english: "Good idea! Can you recommend one?" },
          { speaker: "A", chinese: "当然可以，我把链接发给你。", pinyin: "Dāngrán kěyǐ, wǒ bǎ liànjiē fā gěi nǐ.", english: "Of course, I'll send you the link." },
        ],
      },
      {
        id: "d3-003",
        hskLevel: 3,
        title: "A Bad Day",
        context: "Sharing daily frustrations",
        lines: [
          { speaker: "A", chinese: "你今天怎么了？看起来不太高兴。", pinyin: "Nǐ jīntiān zěnme le? Kàn qǐlái bú tài gāoxìng.", english: "What happened today? You don't look very happy." },
          { speaker: "B", chinese: "别提了。我的钱包被人偷了。", pinyin: "Bié tí le. Wǒ de qiánbāo bèi rén tōu le.", english: "Don't even mention it. My wallet was stolen." },
          { speaker: "A", chinese: "真的吗？你报警了吗？", pinyin: "Zhēn de ma? Nǐ bào jǐng le ma?", english: "Really? Did you call the police?" },
          { speaker: "B", chinese: "报了，但是他们说很难找回来。", pinyin: "Bào le, dànshì tāmen shuō hěn nán zhǎo huílái.", english: "Yes, but they said it would be hard to get it back." },
          { speaker: "A", chinese: "虽然很倒霉，但是人没事就好。", pinyin: "Suīrán hěn dǎoméi, dànshì rén méi shì jiù hǎo.", english: "Although it's unlucky, as long as you're OK, that's what matters." },
        ],
      },
    ],
    4: [
      {
        id: "d4-001",
        hskLevel: 4,
        title: "Job Interview",
        context: "Discussing career goals",
        lines: [
          { speaker: "A", chinese: "请你简单介绍一下自己。", pinyin: "Qǐng nǐ jiǎndān jièshào yíxià zìjǐ.", english: "Please briefly introduce yourself." },
          { speaker: "B", chinese: "我大学学的是计算机，毕业后在一家公司工作了三年。", pinyin: "Wǒ dàxué xué de shì jìsuànjī, bìyè hòu zài yì jiā gōngsī gōngzuò le sān nián.", english: "I studied computer science in college and worked at a company for three years after graduation." },
          { speaker: "A", chinese: "你之所以想换工作，是因为什么？", pinyin: "Nǐ zhīsuǒyǐ xiǎng huàn gōngzuò, shì yīnwèi shénme?", english: "What is the reason you want to change jobs?" },
          { speaker: "B", chinese: "我希望找一个既有挑战性又有发展空间的工作。", pinyin: "Wǒ xīwàng zhǎo yí gè jì yǒu tiǎozhànxìng yòu yǒu fāzhǎn kōngjiān de gōngzuò.", english: "I hope to find a job that is both challenging and has room for growth." },
          { speaker: "A", chinese: "无论遇到什么困难，你都能坚持吗？", pinyin: "Wúlùn yù dào shénme kùnnán, nǐ dōu néng jiānchí ma?", english: "No matter what difficulties you face, can you persevere?" },
          { speaker: "B", chinese: "当然。即使任务很难，我也不会放弃。", pinyin: "Dāngrán. Jíshǐ rènwù hěn nán, wǒ yě bú huì fàngqì.", english: "Of course. Even if the task is difficult, I won't give up." },
        ],
      },
      {
        id: "d4-002",
        hskLevel: 4,
        title: "Environmental Issues",
        context: "Discussing pollution and solutions",
        lines: [
          { speaker: "A", chinese: "你觉得我们城市的空气质量怎么样？", pinyin: "Nǐ juéde wǒmen chéngshì de kōngqì zhìliàng zěnmeyàng?", english: "What do you think about the air quality in our city?" },
          { speaker: "B", chinese: "不太好。空气污染越来越严重了。", pinyin: "Bú tài hǎo. Kōngqì wūrǎn yuèláiyuè yánzhòng le.", english: "Not great. Air pollution is getting worse and worse." },
          { speaker: "A", chinese: "他所说的话很有道理：保护环境是大家的责任。", pinyin: "Tā suǒ shuō de huà hěn yǒu dàolǐ: bǎohù huánjìng shì dàjiā de zérèn.", english: "What he said makes sense: protecting the environment is everyone's responsibility." },
          { speaker: "B", chinese: "不仅政府要采取措施，而且每个人都应该行动。", pinyin: "Bùjǐn zhèngfǔ yào cǎiqǔ cuòshī, érqiě měi gè rén dōu yīnggāi xíngdòng.", english: "Not only should the government take measures, but everyone should act." },
          { speaker: "A", chinese: "说得对。门口挂着一个环保标语呢。", pinyin: "Shuō de duì. Ménkǒu guà zhe yí gè huánbǎo biāoyǔ ne.", english: "Well said. There's an environmental slogan hanging at the entrance." },
        ],
      },
      {
        id: "d4-003",
        hskLevel: 4,
        title: "A Traditional Festival",
        context: "Discussing Chinese Mid-Autumn Festival",
        lines: [
          { speaker: "A", chinese: "你吃过月饼吗？", pinyin: "Nǐ chī guò yuèbǐng ma?", english: "Have you ever eaten mooncakes?" },
          { speaker: "B", chinese: "吃过。中秋节的时候，大家都吃月饼。", pinyin: "Chī guò. Zhōngqiūjié de shíhòu, dàjiā dōu chī yuèbǐng.", english: "Yes. During the Mid-Autumn Festival, everyone eats mooncakes." },
          { speaker: "A", chinese: "这个节日以赏月为主要活动，对吧？", pinyin: "Zhège jiérì yǐ shǎng yuè wéi zhǔyào huódòng, duì ba?", english: "The main activity of this festival is moon-gazing, right?" },
          { speaker: "B", chinese: "对，一家人坐着一边赏月一边聊天。", pinyin: "Duì, yì jiā rén zuò zhe yìbiān shǎng yuè yìbiān liáo tiān.", english: "Right, the family sits together gazing at the moon and chatting." },
        ],
      },
    ],
    5: [
      {
        id: "d5-001",
        hskLevel: 5,
        title: "Work-Life Balance",
        context: "Colleagues discussing overwork",
        lines: [
          { speaker: "A", chinese: "你最近看起来很累，怎么回事？", pinyin: "Nǐ zuìjìn kàn qǐlái hěn lèi, zěnme huí shì?", english: "You look really tired lately, what's going on?" },
          { speaker: "B", chinese: "尽管已经很累了，我还是每天加班到很晚。", pinyin: "Jǐnguǎn yǐjīng hěn lèi le, wǒ háishi měitiān jiābān dào hěn wǎn.", english: "Despite being very tired already, I still work overtime until late every day." },
          { speaker: "A", chinese: "与其这样拼命工作，不如注意一下身体。", pinyin: "Yǔqí zhèyàng pīnmìng gōngzuò, bùrú zhùyì yíxià shēntǐ.", english: "Rather than working yourself to death like this, you should take care of your health." },
          { speaker: "B", chinese: "我也知道，但是不得不这样做，项目下周就要交了。", pinyin: "Wǒ yě zhīdào, dànshì bùdébù zhèyàng zuò, xiàngmù xià zhōu jiù yào jiāo le.", english: "I know, but I have no choice. The project is due next week." },
          { speaker: "A", chinese: "一旦交了项目，你就好好休息吧。", pinyin: "Yídàn jiāo le xiàngmù, nǐ jiù hǎohǎo xiūxi ba.", english: "Once you submit the project, take a good rest." },
        ],
      },
      {
        id: "d5-002",
        hskLevel: 5,
        title: "Choosing a University",
        context: "Parent and child discussing education",
        lines: [
          { speaker: "A", chinese: "你想学什么专业？", pinyin: "Nǐ xiǎng xué shénme zhuānyè?", english: "What major do you want to study?" },
          { speaker: "B", chinese: "我想学艺术，但是大家都说未必能找到好工作。", pinyin: "Wǒ xiǎng xué yìshù, dànshì dàjiā dōu shuō wèibì néng zhǎo dào hǎo gōngzuò.", english: "I want to study art, but everyone says you may not find a good job." },
          { speaker: "A", chinese: "凡是热爱自己专业的人，都会做得很好。", pinyin: "Fánshì rè'ài zìjǐ zhuānyè de rén, dōu huì zuò de hěn hǎo.", english: "Everyone who loves their field will do well." },
          { speaker: "B", chinese: "宁可做自己喜欢的事，我也不想为了钱选一个不喜欢的专业。", pinyin: "Nìngkě zuò zìjǐ xǐhuān de shì, wǒ yě bù xiǎng wèile qián xuǎn yí gè bù xǐhuān de zhuānyè.", english: "I would rather do what I love than choose a major I don't like just for money." },
          { speaker: "A", chinese: "刚开始工作，难免会辛苦一些，但是值得。", pinyin: "Gāng kāishǐ gōngzuò, nánmiǎn huì xīnkǔ yìxiē, dànshì zhíde.", english: "Starting out will inevitably be harder, but it's worth it." },
        ],
      },
      {
        id: "d5-003",
        hskLevel: 5,
        title: "Regional Cuisine",
        context: "Friends discussing food culture",
        lines: [
          { speaker: "A", chinese: "四川菜以辣为主，你吃得惯吗？", pinyin: "Sìchuān cài yǐ là wéi zhǔ, nǐ chī de guàn ma?", english: "Sichuan food is mainly spicy. Can you handle it?" },
          { speaker: "B", chinese: "我连不太辣的都受不了，何况正宗的四川菜。", pinyin: "Wǒ lián bú tài là de dōu shòu bù liǎo, hékuàng zhèngzōng de Sìchuān cài.", english: "I can't even handle mildly spicy food, let alone authentic Sichuan cuisine." },
          { speaker: "A", chinese: "不过尽管很辣，味道还是非常好的。", pinyin: "Búguò jǐnguǎn hěn là, wèidào háishi fēicháng hǎo de.", english: "But despite being very spicy, the flavor is really excellent." },
          { speaker: "B", chinese: "那我试试吧。与其怕辣不敢吃，不如大胆尝一尝。", pinyin: "Nà wǒ shìshi ba. Yǔqí pà là bù gǎn chī, bùrú dàdǎn cháng yì cháng.", english: "Then let me try. Rather than being afraid of spice and not daring to eat, I should be bold and give it a taste." },
        ],
      },
    ],
    6: [
      {
        id: "d6-001",
        hskLevel: 6,
        title: "Urban Development",
        context: "Discussing city planning and modernization",
        lines: [
          { speaker: "A", chinese: "这座城市的发展速度太快了，以至于很多老建筑都消失了。", pinyin: "Zhè zuò chéngshì de fāzhǎn sùdù tài kuài le, yǐzhìyú hěn duō lǎo jiànzhù dōu xiāoshī le.", english: "This city has developed so fast that many old buildings have disappeared." },
          { speaker: "B", chinese: "归根结底，是因为经济利益和文化保护之间的矛盾。", pinyin: "Guīgēnjiédǐ, shì yīnwèi jīngjì lìyì hé wénhuà bǎohù zhījiān de máodùn.", english: "Ultimately, it's due to the contradiction between economic interests and cultural preservation." },
          { speaker: "A", chinese: "鉴于目前的情况，政府已经出台了新的保护政策。", pinyin: "Jiànyú mùqián de qíngkuàng, zhèngfǔ yǐjīng chūtái le xīn de bǎohù zhèngcè.", english: "Given the current situation, the government has issued new protection policies." },
          { speaker: "B", chinese: "就长远而言，我们需要在发展和保护之间找到平衡。", pinyin: "Jiù chángyuǎn éryán, wǒmen xūyào zài fāzhǎn hé bǎohù zhījiān zhǎo dào pínghéng.", english: "In the long run, we need to find a balance between development and preservation." },
          { speaker: "A", chinese: "必须仔细规划，以免将来后悔。", pinyin: "Bìxū zǐxì guīhuà, yǐmiǎn jiānglái hòuhuǐ.", english: "We must plan carefully to avoid regrets in the future." },
        ],
      },
      {
        id: "d6-002",
        hskLevel: 6,
        title: "Technology and Society",
        context: "Debating the impact of AI on employment",
        lines: [
          { speaker: "A", chinese: "人工智能的发展不可避免地改变了就业市场。", pinyin: "Réngōng zhìnéng de fāzhǎn bùkě bìmiǎn de gǎibiàn le jiùyè shìchǎng.", english: "The development of artificial intelligence has inevitably changed the job market." },
          { speaker: "B", chinese: "这件事不仅影响了制造业，乃至服务行业也受到了冲击。", pinyin: "Zhè jiàn shì bùjǐn yǐngxiǎng le zhìzàoyè, nǎizhì fúwù hángyè yě shòu dào le chōngjī.", english: "This has not only affected manufacturing, but even the service industry has been impacted." },
          { speaker: "A", chinese: "出于对未来的担忧，很多人开始学习新技能。", pinyin: "Chūyú duì wèilái de dānyōu, hěn duō rén kāishǐ xuéxí xīn jìnéng.", english: "Out of concern for the future, many people are starting to learn new skills." },
          { speaker: "B", chinese: "有鉴于此，教育体系也应该做出相应的调整。", pinyin: "Yǒu jiàn yú cǐ, jiàoyù tǐxì yě yīnggāi zuò chū xiāngyìng de tiáozhěng.", english: "In view of this, the education system should also make corresponding adjustments." },
          { speaker: "A", chinese: "迫不得已的时候，转行也是一种选择。", pinyin: "Pòbùdéyǐ de shíhòu, zhuǎnháng yě shì yì zhǒng xuǎnzé.", english: "When there's absolutely no alternative, changing careers is also an option." },
        ],
      },
      {
        id: "d6-003",
        hskLevel: 6,
        title: "Healthcare Reform",
        context: "Discussing public health policy",
        lines: [
          { speaker: "A", chinese: "就医疗水平而言，城市和农村的差距还是很大。", pinyin: "Jiù yīliáo shuǐpíng éryán, chéngshì hé nóngcūn de chājù háishi hěn dà.", english: "In terms of medical standards, the gap between urban and rural areas is still very large." },
          { speaker: "B", chinese: "归根结底，这是资源分配不均的问题。", pinyin: "Guīgēnjiédǐ, zhè shì zīyuán fēnpèi bù jūn de wèntí.", english: "Ultimately, this is a problem of unequal resource distribution." },
          { speaker: "A", chinese: "鉴于农村地区医生严重不足，政府鼓励年轻医生去基层工作。", pinyin: "Jiànyú nóngcūn dìqū yīshēng yánzhòng bùzú, zhèngfǔ gǔlì niánqīng yīshēng qù jīcéng gōngzuò.", english: "Given the severe shortage of doctors in rural areas, the government encourages young doctors to work at the grassroots level." },
          { speaker: "B", chinese: "这个政策的效果如何，还有待观察，以免过早下结论。", pinyin: "Zhège zhèngcè de xiàoguǒ rúhé, hái yǒu dài guānchá, yǐmiǎn guò zǎo xià jiélùn.", english: "The effectiveness of this policy remains to be seen, to avoid drawing conclusions too early." },
        ],
      },
    ],
  };

  for (let level = 1; level <= 6; level++) {
    const data = dialogueData[level] || [];
    writeFileSync(
      join(OUTPUT_DIR, `hsk${level}-dialogues.json`),
      JSON.stringify(data, null, 2)
    );
    console.log(`HSK ${level} dialogues: ${data.length} dialogues`);
  }
}

async function prepareRadicals(): Promise<void> {
  try {
    // Read all vocabulary files to collect example words for each radical
    const allWords: (OutputWord & { wordId: string })[] = [];

    for (let level = 1; level <= 6; level++) {
      const vocabPath = join(OUTPUT_DIR, `hsk${level}-vocab.json`);
      const content = require("fs").readFileSync(vocabPath, "utf-8");
      const words = JSON.parse(content) as OutputWord[];
      allWords.push(
        ...words.map((w) => ({
          ...w,
          wordId: w.id,
        }))
      );
    }

    // Build radicals with example words
    const radicalData = RADICALS.map((radical) => ({
      ...radical,
      exampleWords: allWords
        .filter((w) => w.radical === radical.character)
        .slice(0, 6) // Limit to 6 example words per radical
        .map((w) => w.wordId),
    }));

    writeFileSync(
      join(OUTPUT_DIR, "radicals.json"),
      JSON.stringify(radicalData, null, 2)
    );
    console.log(`Radicals: ${radicalData.length} radicals with examples`);
  } catch (err) {
    console.error("Failed to prepare radicals:", err);
    // Write empty array as fallback
    writeFileSync(
      join(OUTPUT_DIR, "radicals.json"),
      JSON.stringify([])
    );
  }
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Preparing HSK data...\n");

  await prepareVocabulary();
  await prepareRadicals();
  generateSampleGrammar();
  generateSampleSentences();
  generateSampleDialogues();

  console.log("\nDone! Data files written to public/data/");
}

main().catch(console.error);
