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

    // Group by HSK level (old/classic 1-6)
    const byLevel: Record<number, OutputWord[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

    for (const entry of raw) {
      const level = getOldHskLevel(entry);
      if (!level || level < 1 || level > 6) continue;

      const form = entry.forms?.[0];
      const pinyin = form?.transcriptions?.pinyin || "";
      const meaning = form?.meanings?.join("; ") || "";

      const idx = byLevel[level].length + 1;
      byLevel[level].push({
        id: `hsk${level}-${String(idx).padStart(3, "0")}`,
        simplified: entry.simplified,
        pinyin,
        meaning,
        hskLevel: level,
        partOfSpeech: entry.pos?.join(", "),
      });
    }

    for (let level = 1; level <= 6; level++) {
      writeFileSync(
        join(OUTPUT_DIR, `hsk${level}-vocab.json`),
        JSON.stringify(byLevel[level], null, 2)
      );
      console.log(`HSK ${level}: ${byLevel[level].length} words`);
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
  // Starter grammar patterns - these cover the most essential HSK 1-2 patterns
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

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("Preparing HSK data...\n");

  await prepareVocabulary();
  generateSampleGrammar();
  generateSampleSentences();
  generateSampleDialogues();

  console.log("\nDone! Data files written to public/data/");
}

main().catch(console.error);
