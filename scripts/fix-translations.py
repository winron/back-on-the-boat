#!/usr/bin/env python3
"""Fix bad English translations in HSK vocab JSON files."""

import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data")

# ── Corrections for obviously wrong entries ──────────────────────────────
# Format: "simplified": ("meaning", "partOfSpeech")
# Only entries that need fixing — correct ones are left alone.

CORRECTIONS = {
    # ── HSK 1 ──
    "的": ("possessive/descriptive particle (like 's or of)", "particle"),
    "我": ("I; me", "pronoun"),
    "是": ("to be; is; am; are", "verb"),
    "你": ("you", "pronoun"),
    "不": ("no; not", "adverb"),
    "他": ("he; him", "pronoun"),
    "这": ("this; these", "pronoun"),
    "和": ("and; with", "conjunction / preposition"),
    "我们": ("we; us", "pronoun"),
    "好": ("good; well; okay", "adjective / adverb"),
    "她": ("she; her", "pronoun"),
    "那": ("that; those", "pronoun"),
    "喂": ("hello (on the phone); hey", "exclamation"),
    "再见": ("goodbye; see you later", "phrase"),
    "请": ("please; to invite; to treat", "adverb / verb"),
    "谢谢": ("thank you; thanks", "verb"),
    "对不起": ("sorry; excuse me", "phrase"),
    "没关系": ("it's okay; no problem", "phrase"),
    "不客气": ("you're welcome", "phrase"),
    "什么": ("what; something; anything", "pronoun"),
    "吗": ("question particle (makes a yes/no question)", "particle"),
    "呢": ("question particle (what about...?); indicates ongoing action", "particle"),
    "谁": ("who; whom", "pronoun"),
    "叫": ("to call; to be called; to shout", "verb"),
    "认识": ("to know (a person); to recognize", "verb"),
    "名字": ("name", "noun"),
    "家": ("home; family; house", "noun / measure word"),
    "妈妈": ("mom; mother", "noun"),
    "儿子": ("son", "noun"),
    "女儿": ("daughter", "noun"),
    "爸爸": ("dad; father", "noun"),
    "人": ("person; people", "noun"),
    "朋友": ("friend", "noun"),
    "先生": ("Mr.; sir; gentleman; husband", "noun"),
    "学生": ("student", "noun"),
    "老师": ("teacher", "noun"),
    "医生": ("doctor", "noun"),
    "小姐": ("Miss; young lady", "noun"),
    "同学": ("classmate; fellow student", "noun"),
    "个": ("general measure word (most common)", "measure word"),
    "一": ("one; a; an", "numeral"),
    "几": ("how many; several; a few", "numeral / pronoun"),
    "三": ("three; 3", "numeral"),
    "岁": ("years old; age", "measure word"),
    "四": ("four; 4", "numeral"),
    "多少": ("how many; how much", "pronoun"),
    "五": ("five; 5", "numeral"),
    "些": ("some; a few", "measure word"),
    "二": ("two; 2", "numeral"),
    "六": ("six; 6", "numeral"),
    "十": ("ten; 10", "numeral"),
    "八": ("eight; 8", "numeral"),
    "七": ("seven; 7", "numeral"),
    "九": ("nine; 9", "numeral"),
    "零": ("zero; 0", "numeral"),
    "点": ("o'clock; dot; point; a little", "noun / measure word"),
    "现在": ("now; at present", "noun"),
    "年": ("year", "noun"),
    "时候": ("time; moment; when", "noun"),
    "今天": ("today", "noun"),
    "月": ("month; moon", "noun"),
    "日": ("day; date; sun", "noun"),
    "分钟": ("minute", "noun"),
    "明天": ("tomorrow", "noun"),
    "昨天": ("yesterday", "noun"),
    "下午": ("afternoon", "noun"),
    "星期": ("week; day of the week", "noun"),
    "上午": ("morning", "noun"),
    "中午": ("noon; midday", "noun"),
    "来": ("to come; to arrive", "verb"),
    "去": ("to go; to leave", "verb"),
    "看": ("to look; to watch; to read; to visit", "verb"),
    "做": ("to do; to make", "verb"),
    "工作": ("to work; job; work", "verb / noun"),
    "吃": ("to eat", "verb"),
    "听": ("to listen; to hear", "verb"),
    "开": ("to open; to turn on; to drive; to start", "verb"),
    "回": ("to return; to go back; measure word for times", "verb / measure word"),
    "买": ("to buy", "verb"),
    "住": ("to live; to stay; to reside", "verb"),
    "写": ("to write", "verb"),
    "喝": ("to drink", "verb"),
    "坐": ("to sit; to take (a bus, train)", "verb"),
    "学习": ("to learn; to study", "verb"),
    "看见": ("to see; to catch sight of", "verb"),
    "说话": ("to speak; to talk", "verb"),
    "睡觉": ("to sleep; to go to bed", "verb"),
    "读": ("to read; to study", "verb"),
    "打电话": ("to make a phone call", "verb"),
    "了": ("indicates completed action; indicates change of state", "particle"),
    "有": ("to have; there is; there are", "verb"),
    "会": ("can; to know how to; will", "verb"),
    "想": ("to think; to want; to miss", "verb"),
    "能": ("can; to be able to", "verb"),
    "没": ("have not; not (before a verb)", "adverb"),
    "爱": ("to love; to like", "verb"),
    "喜欢": ("to like; to be fond of", "verb"),
    "东西": ("thing; stuff", "noun"),
    "水": ("water", "noun"),
    "菜": ("dish; vegetable; food", "noun"),
    "茶": ("tea", "noun"),
    "苹果": ("apple", "noun"),
    "水果": ("fruit", "noun"),
    "杯子": ("cup; glass", "noun"),
    "米饭": ("cooked rice", "noun"),
    "饭馆": ("restaurant", "noun"),
    "都": ("all; both; already", "adverb"),
    "很": ("very; quite", "adverb"),
    "大": ("big; large; great", "adjective"),
    "多": ("many; much; more", "adjective / adverb"),
    "太": ("too; very; extremely", "adverb"),
    "小": ("small; little; young", "adjective"),
    "少": ("few; little; less", "adjective"),
    "漂亮": ("pretty; beautiful", "adjective"),
    "高兴": ("happy; glad", "adjective"),
    "热": ("hot; warm; popular", "adjective"),
    "冷": ("cold", "adjective"),
    "学校": ("school", "noun"),
    "医院": ("hospital", "noun"),
    "中国": ("China", "noun"),
    "商店": ("store; shop", "noun"),
    "北京": ("Beijing", "noun"),
    "火车站": ("train station", "noun"),
    "钱": ("money", "noun"),
    "本": ("measure word for books; this; root", "measure word"),
    "块": ("measure word for money (yuan); piece; chunk", "measure word"),
    "电影": ("movie; film", "noun"),
    "书": ("book", "noun"),
    "电视": ("television; TV", "noun"),
    "字": ("character; word; letter", "noun"),
    "电脑": ("computer", "noun"),
    "衣服": ("clothes; clothing", "noun"),
    "桌子": ("table; desk", "noun"),
    "椅子": ("chair", "noun"),
    "汉语": ("Chinese (language)", "noun"),
    "在": ("at; in; to be at; to exist", "preposition / verb"),
    "上": ("up; above; on; to go up", "verb / noun"),
    "下": ("down; below; under; next", "verb / noun"),
    "里": ("inside; in; within", "noun"),
    "怎么": ("how; why; what", "pronoun"),
    "哪": ("which; where", "pronoun"),
    "后面": ("behind; at the back", "noun"),
    "怎么样": ("how; how about; how is it", "pronoun"),
    "前面": ("in front; ahead", "noun"),
    "狗": ("dog", "noun"),
    "飞机": ("airplane; plane", "noun"),
    "猫": ("cat", "noun"),
    "天气": ("weather", "noun"),
    "出租车": ("taxi", "noun"),
    "下雨": ("to rain", "verb"),
    # ── HSK 2 ──
    "妻子": ("wife", "noun"),
    "累": ("tired; exhausted", "adjective"),
    "两": ("two; both; a couple of", "numeral"),
    "次": ("time (occurrence); measure word for times; next", "measure word"),
    "号": ("number; date (of the month); size", "noun / measure word"),
    "药": ("medicine; drug", "noun"),
    "元": ("yuan (currency unit); dollar", "measure word"),
    "百": ("hundred; 100", "numeral"),
    "鱼": ("fish", "noun"),
    "给": ("to give; for; to let", "verb / preposition"),
    "好吃": ("delicious; tasty", "adjective"),
    "便宜": ("cheap; inexpensive", "adjective"),
    "牛奶": ("milk", "noun"),
    "鸡蛋": ("egg; chicken egg", "noun"),
    "向": ("toward; to face; direction", "preposition"),
    "路": ("road; path; way", "noun"),
    "门": ("door; gate; entrance", "noun / measure word"),
    "离": ("from; away from; to leave", "preposition / verb"),
    "外": ("outside; foreign; other", "noun"),
    "题": ("question; problem; topic; title", "noun"),
    "问": ("to ask; to inquire", "verb"),
    "告诉": ("to tell; to inform; to let know", "verb"),
    "您": ("you (polite/formal)", "pronoun"),
    "姓": ("surname; family name; to be surnamed", "noun / verb"),
    "最": ("most; the most; -est", "adverb"),
    "新": ("new; fresh; recent", "adjective"),
    "高": ("tall; high", "adjective"),
    "黑": ("black; dark", "adjective"),
    "红": ("red", "adjective"),
    "白": ("white; blank; in vain", "adjective"),
    "长": ("long; to grow", "adjective / verb"),
    "雪": ("snow", "noun"),
    "阴": ("cloudy; overcast; shady", "adjective"),
    "知道": ("to know; to be aware of", "verb"),
    "别": ("don't; do not; other", "adverb"),
    "笑": ("to laugh; to smile", "verb"),
    "船": ("boat; ship", "noun"),
    "也": ("also; too; as well", "adverb"),
    "还": ("still; yet; also; even more", "adverb"),
    "着": ("particle indicating ongoing action or state", "particle"),
    "吧": ("suggestion particle (let's...); right? (seeking agreement)", "particle"),
    "得": ("structural particle (after verb, before complement); to get; to obtain", "particle / verb"),
    "为": ("for; because of; for the sake of", "preposition"),
    "从": ("from; since", "preposition"),
    "因为": ("because; since", "conjunction"),
    "比": ("compared to; than; to compare", "preposition / verb"),
    "所以": ("so; therefore", "conjunction"),
    "一起": ("together; at the same time", "adverb"),
    "大家": ("everyone; everybody", "pronoun"),
    "事情": ("thing; matter; affair", "noun"),
    "件": ("measure word for clothing, events, or matters", "measure word"),
    "张": ("measure word for flat things (paper, tables, etc.)", "measure word"),
    "完": ("to finish; to be over; complete", "verb"),
    "帮助": ("to help; help; assistance", "verb / noun"),
    "错": ("wrong; mistaken; mistake", "adjective / noun"),
    "到": ("to arrive; to reach; to go to; until", "verb / preposition"),
    "出": ("to go out; to come out; to appear", "verb"),
    "走": ("to walk; to go; to leave", "verb"),
    "找": ("to look for; to find; to give change", "verb"),
    "进": ("to enter; to go in; to advance", "verb"),
    "送": ("to send; to deliver; to give (as a gift)", "verb"),
    "就": ("then; at once; right away; only; just", "adverb"),
    "但是": ("but; however", "conjunction"),
    "开始": ("to begin; to start; beginning", "verb / noun"),
    "课": ("class; lesson; course", "noun"),
    "考试": ("exam; test; to take an exam", "noun / verb"),
    # ── HSK 3 (additional) ──
    "叔叔": ("uncle (father's younger brother); used to address men of father's age", "noun"),
    "啤酒": ("beer", "noun"),
    "它": ("it", "pronoun"),
    "又": ("again; also; both... and...", "adverb"),
    "才": ("just; only; not until", "adverb"),
    "把": ("to hold; to grasp; measure word for things with handles; particle (marks the object before the verb)", "verb / particle"),
    "被": ("by (in passive sentences); quilt", "preposition / noun"),
    "除了": ("besides; except for; apart from", "preposition"),
    "根据": ("according to; based on; basis", "preposition / noun"),
    "其实": ("actually; in fact", "adverb"),
    "几乎": ("almost; nearly", "adverb"),
    "终于": ("finally; at last", "adverb"),
    "或者": ("or; perhaps", "conjunction"),
    # ── HSK 3 ──
    "碗": ("bowl; measure word for bowls of food", "noun / measure word"),
    "包": ("bag; package; to wrap", "noun / verb"),
    "裤子": ("pants; trousers", "noun"),
    "楼": ("building; floor; story", "noun"),
    "西": ("west; western", "noun"),
    "东": ("east; eastern", "noun"),
    "南": ("south; southern", "noun"),
    "超市": ("supermarket", "noun"),
    "花": ("flower; to spend (money/time)", "noun / verb"),
    "马": ("horse", "noun"),
    "鸟": ("bird", "noun"),
    "太阳": ("sun; sunshine", "noun"),
    "草": ("grass; straw", "noun"),
    "夏": ("summer", "noun"),
    "春": ("spring (season)", "noun"),
    "秋": ("autumn; fall", "noun"),
    "教": ("to teach; to instruct", "verb"),
    "班": ("class; team; shift; scheduled (bus, train)", "noun / measure word"),
    "拿": ("to take; to hold; to carry", "verb"),
    "关": ("to close; to turn off; to concern", "verb"),
    "蓝": ("blue", "adjective"),
    "黄": ("yellow", "adjective"),
    "越": ("to exceed; the more... the more...", "adverb / verb"),
    "老": ("old; always; prefix for seniority", "adjective"),
    "万": ("ten thousand; 10,000", "numeral"),
    "双": ("pair; both; double", "measure word / adjective"),
    "段": ("section; paragraph; measure word for sections", "noun / measure word"),
    "米": ("meter; rice", "noun / measure word"),
    "祝": ("to wish; to express good wishes", "verb"),
    "角": ("corner; angle; horn; jiao (1/10 of a yuan)", "noun / measure word"),
    # ── HSK 4 (additional) ──
    "血": ("blood", "noun"),
    "沙发": ("sofa; couch", "noun"),
    "幽默": ("humorous; humor", "adjective / noun"),
    "巧克力": ("chocolate", "noun"),
    "积累": ("to accumulate; to build up", "verb"),
    # ── HSK 4 ──
    "懒": ("lazy", "adjective"),
    "父亲": ("father", "noun"),
    "母亲": ("mother", "noun"),
    "汤": ("soup; broth", "noun"),
    "辣": ("spicy; hot", "adjective"),
    "咸": ("salty", "adjective"),
    "词典": ("dictionary", "noun"),
    "深": ("deep; dark (color); profound", "adjective"),
    "暗": ("dark; dim; secret", "adjective"),
    "富": ("rich; wealthy; abundant", "adjective"),
    "宽": ("wide; broad; spacious", "adjective"),
    "亚洲": ("Asia", "noun"),
    "谈": ("to talk; to chat; to discuss", "verb"),
    "戴": ("to wear (hat, glasses, gloves); to put on", "verb"),
    "过": ("to pass; to cross; to spend (time); (indicates experience)", "verb / particle"),
    "与": ("and; with; to give", "conjunction / preposition"),
    "以": ("with; by; in order to", "preposition / conjunction"),
    "起来": ("to get up; to rise; (indicates beginning of action)", "verb"),
    "却": ("but; yet; however", "adverb"),
    "连": ("even; to connect; in a row", "adverb / verb"),
    "干": ("to do; dry; clean", "verb / adjective"),
    "份": ("portion; share; measure word for copies, servings", "measure word"),
    "联系": ("to contact; to connect; connection", "verb / noun"),
    "台": ("platform; stage; measure word for machines", "noun / measure word"),
    "留": ("to stay; to remain; to keep; to leave behind", "verb"),
    "假": ("vacation; holiday; fake; false", "noun / adjective"),
    "群": ("group; crowd; flock; measure word for groups", "noun / measure word"),
    "火": ("fire; flame", "noun"),
    "刀": ("knife; blade", "noun"),
    "遍": ("measure word for times (occurrences); everywhere", "measure word / adverb"),
    "帅": ("handsome; cool; commander", "adjective"),
    "墙": ("wall", "noun"),
    "修": ("to repair; to fix; to build; to study", "verb"),
    "趟": ("measure word for trips; to wade through", "measure word"),
    # ── HSK 5 (additional) ──
    "尾巴": ("tail", "noun"),
    "着凉": ("to catch a cold", "verb"),
    "吨": ("ton (unit of weight)", "measure word"),
    "似的": ("as if; like; seems", "particle"),
    "俱乐部": ("club (organization)", "noun"),
    "摩托车": ("motorcycle; motorbike", "noun"),
    "逻辑": ("logic", "noun"),
    "麦克风": ("microphone", "noun"),
    "象棋": ("Chinese chess", "noun"),
    # ── HSK 5 ──
    "老板": ("boss; owner; shopkeeper", "noun"),
    "胸": ("chest; breast; heart; mind", "noun"),
    "桔子": ("tangerine; mandarin orange", "noun"),
    "龙": ("dragon", "noun"),
    "岛": ("island", "noun"),
    "蛇": ("snake", "noun"),
    "岸": ("shore; bank; coast", "noun"),
    "下载": ("to download", "verb"),
    "煮": ("to boil; to cook", "verb"),
    "踩": ("to step on; to trample", "verb"),
    "晒": ("to dry in the sun; to sunbathe; to show off", "verb"),
    "纪录": ("record; achievement; to record", "noun / verb"),
    "高速": ("high-speed; expressway", "adjective / noun"),
    "丑": ("ugly; shameful; clown", "adjective / noun"),
    "薄": ("thin; slight; weak", "adjective"),
    "克": ("gram; to overcome; to restrain", "measure word / verb"),
    "立方": ("cube; cubic", "noun / adjective"),
    "哈": ("ha (laughter); to exhale; to bend at the waist", "exclamation / verb"),
    "项": ("item; measure word for items or tasks", "noun / measure word"),
    "支": ("measure word for stick-like things; to support; branch", "measure word / verb"),
    "提": ("to carry; to lift; to raise; to mention", "verb"),
    "非": ("not; non-; wrong", "adverb / adjective"),
    "方": ("square; direction; side; method", "noun / adjective"),
    "夜": ("night; evening", "noun"),
    "救": ("to save; to rescue", "verb"),
    "毛": ("hair; fur; feather; mao (1/10 yuan); rough", "noun"),
    "朝": ("toward; facing; dynasty; morning", "preposition / noun"),
    "直": ("straight; direct; continuously", "adjective / adverb"),
    "枪": ("gun; rifle; spear", "noun"),
    "雷": ("thunder; mine (explosive)", "noun"),
    "背": ("back (body part); to carry on one's back; to memorize", "noun / verb"),
    "布": ("cloth; fabric; to spread; to announce", "noun / verb"),
    "平": ("flat; level; even; calm; ordinary", "adjective"),
    "钟": ("clock; bell; o'clock", "noun"),
    "官": ("official; government officer", "noun"),
    "盖": ("lid; cover; to cover; to build", "noun / verb"),
    "凭": ("to rely on; based on; proof", "preposition / verb"),
    "举": ("to lift; to raise; to hold up; to cite", "verb"),
    "念": ("to read aloud; to study; to miss (someone)", "verb"),
    "闻": ("to smell; to hear; news", "verb / noun"),
    "诗": ("poem; poetry; verse", "noun"),
    "露": ("dew; to reveal; to show", "noun / verb"),
    "青": ("green; blue; young", "adjective"),
    "乘": ("to ride; to take (bus, train); to multiply", "verb"),
    "摇": ("to shake; to wave; to rock; to sway", "verb"),
    "丁": ("a person; cube (of food); fourth (in a sequence)", "noun"),
    "收获": ("harvest; gains; to gain; to reap", "noun / verb"),
    "仿佛": ("as if; seemingly", "adverb"),
    "反复": ("repeatedly; over and over; to relapse", "adverb / verb"),
    "飘": ("to float; to flutter; to drift", "verb"),
    "阳台": ("balcony", "noun"),
    "痒": ("itchy; to itch", "adjective"),
    "柜台": ("counter; service desk", "noun"),
    "夸": ("to praise; to boast; to exaggerate", "verb"),
    "结账": ("to pay the bill; to settle accounts", "verb"),
    "干活儿": ("to work; to do manual labor", "verb"),
    "使劲儿": ("to exert effort; to use all one's strength", "verb"),
    # ── HSK 6 (additional) ──
    "膝盖": ("knee", "noun"),
    "携带": ("to carry; to bring", "verb"),
    "艘": ("measure word for ships and boats", "measure word"),
    "眯": ("to squint; to narrow one's eyes; to nap", "verb"),
    "城堡": ("castle", "noun"),
    "嗨": ("hey; hi", "exclamation"),
    "扎": ("to prick; to pierce; to tie up", "verb"),
    "基因": ("gene", "noun"),
    "引擎": ("engine", "noun"),
    "雷达": ("radar", "noun"),
    "卡通": ("cartoon", "noun"),
    "磅": ("pound (unit of weight); scale", "measure word / noun"),
    # ── HSK 6 ──
    "嘛": ("particle (used for emphasis or persuasion)", "particle"),
    "大伙儿": ("everybody; everyone", "pronoun"),
    "粥": ("porridge; congee; rice gruel", "noun"),
    "铺": ("shop; store; to spread; to lay", "noun / verb"),
    "墨水儿": ("ink", "noun"),
    "纽扣儿": ("button (on clothing)", "noun"),
    "霸道": ("domineering; overbearing; unreasonable", "adjective"),
    "党": ("political party; the Party", "noun"),
    "动荡": ("turbulent; unstable; upheaval", "adjective / noun"),
    "啥": ("what (colloquial)", "pronoun"),
    "答复": ("to reply; to answer; response", "verb / noun"),
    "词汇": ("vocabulary; words", "noun"),
    "啰唆": ("wordy; long-winded; nagging", "adjective"),
    "着想": ("to consider (for someone's sake)", "verb"),
    "井": ("well (water well); mine shaft", "noun"),
    "冲击": ("to impact; to hit; shock", "verb / noun"),
    "高考": ("college entrance examination (in China)", "noun"),
    "泰斗": ("leading authority; great master", "noun"),
    "翼": ("wing; flank", "noun"),
    "合并": ("to merge; to combine; to unite", "verb"),
    "回避": ("to avoid; to evade; to dodge", "verb"),
    "局限": ("to limit; to confine; limitation", "verb / noun"),
    "耍": ("to play; to fool around; to show off", "verb"),
    "番": ("measure word for occurrences; foreign", "measure word / adjective"),
    "盛": ("flourishing; grand; abundant; to hold (contain)", "adjective / verb"),
    "泄露": ("to leak; to divulge; to reveal", "verb"),
    "竖": ("vertical; upright; to erect", "adjective / verb"),
    "绣": ("to embroider; embroidery", "verb / noun"),
    "污蔑": ("to slander; to smear; to vilify", "verb"),
    "家伙": ("guy; fellow; tool; weapon", "noun"),
    "孔": ("hole; opening; Kong (Confucius)", "noun"),
    "组": ("group; team; to form; to organize", "noun / verb"),
    "欧洲": ("Europe", "noun"),
    "秤": ("scale; balance (for weighing)", "noun"),
    "馅儿": ("filling; stuffing (in food)", "noun"),
    "颇": ("quite; rather; considerably", "adverb"),
    "恶心": ("disgusting; nauseous; to feel sick", "adjective / verb"),
    "扁": ("flat; thin", "adjective"),
    "贤惠": ("virtuous and capable (of a woman)", "adjective"),
    "枚": ("measure word for small objects (coins, stamps, etc.)", "measure word"),
    "呵": ("ah; oh (exclamation)", "exclamation"),
    "束": ("bundle; measure word for bundles or bouquets", "noun / measure word"),
    "玩意儿": ("thing; toy; gadget", "noun"),
    "纳闷儿": ("puzzled; bewildered; confused", "adjective"),
    "摊儿": ("stall; vendor's stand", "noun"),
}


def is_bad_meaning(meaning):
    """Check if a meaning is clearly wrong/unhelpful."""
    m = meaning.lower()
    patterns = [
        "surname ",
        "variant of ",
        "old variant of ",
        "abbr. for ",
        "also pr. [",
        "also written ",
        "used in ",
        "erhua variant of ",
    ]
    for p in patterns:
        if m.startswith(p) or f"; {p}" in m or f"({p}" in m:
            return True
    # Check if starts with these
    if m.startswith("used in "):
        return True
    return False


def clean_meaning(meaning):
    """Remove dictionary artifacts from a meaning string."""
    # Remove "also pr. [xxx]" references
    meaning = re.sub(r';\s*also pr\.\s*\[[^\]]+\]', '', meaning)
    meaning = re.sub(r'\s*\(also pr\.\s*\[[^\]]+\]\)', '', meaning)
    # Remove "variant of X" type phrases
    meaning = re.sub(r';\s*variant of [^;]+', '', meaning)
    # Remove "also written X" references
    meaning = re.sub(r';\s*also written [^;]+', '', meaning)
    # Remove "abbr. for X" when it's a parenthetical
    meaning = re.sub(r'\s*\(abbr\. for [^)]+\)', '', meaning)
    # Remove "(coll.)" and "(Tw)" and similar parenthetical markers
    meaning = re.sub(r'\(coll\.\)\s*', '', meaning)
    meaning = re.sub(r'\(Tw\)\s*', '', meaning)
    meaning = re.sub(r'\(archaic\)\s*', '', meaning)
    meaning = re.sub(r'\(dialect\)\s*[^;]*;?\s*', '', meaning)
    meaning = re.sub(r'\(slang\)\s*[^;]*;?\s*', '', meaning)
    meaning = re.sub(r'\(loanword\)\s*', '', meaning)
    meaning = re.sub(r'\(Internet slang\)\s*[^;]*;?\s*', '', meaning)
    # Remove "adverb of degree" and similar jargon in parens
    meaning = re.sub(r'\(adverb of degree\);?\s*', '', meaning)
    # Remove Taiwan/colloquial pronunciation references
    meaning = re.sub(r';\s*Taiwan pr\.\s*\[[^\]]+\]', '', meaning)
    meaning = re.sub(r';\s*colloquial pr\.\s*\[[^\]]+\]', '', meaning)
    meaning = re.sub(r';\s*also pr\.\s*\[[^\]]+\]', '', meaning)
    # Clean up extra whitespace and trailing semicolons
    meaning = re.sub(r'\s+', ' ', meaning).strip()
    meaning = meaning.rstrip(';').strip()
    # Remove leading semicolons
    meaning = meaning.lstrip('; ').strip()
    return meaning


def simplify_pos(pos):
    """Clean up overly complex POS labels."""
    if not pos:
        return pos

    # Map of verbose/abbreviated POS to clean labels
    pos_map = {
        "modal particle": "particle",
        "time word": "noun",
        "time measure word": "measure word",
        "verbal measure word": "measure word",
        "coordinating conjunction": "conjunction",
        "distinguishing word": "adjective",
        "directional word": "noun",
        "morpheme": "",
        "suffix": "",
        "verb + noun": "verb / noun",
        "adverb + adjective": "adjective",
        "adjective + noun": "adjective / noun",
        "proper noun (person)": "noun",
        "proper noun (place)": "noun",
        "proper noun (other)": "noun",
    }

    parts = [p.strip() for p in pos.replace("/", ",").split(",") if p.strip()]
    cleaned = []
    seen = set()
    for p in parts:
        mapped = pos_map.get(p, p)
        if mapped and mapped not in seen:
            seen.add(mapped)
            cleaned.append(mapped)

    # Limit to 2 labels max
    if len(cleaned) > 2:
        cleaned = cleaned[:2]

    return " / ".join(cleaned) if cleaned else pos


def fix_level(level):
    path = os.path.join(DATA_DIR, f"hsk{level}-vocab.json")
    with open(path) as f:
        words = json.load(f)

    fixed_count = 0
    for w in words:
        char = w["simplified"]

        # Remove improvedMeaning flag
        if "improvedMeaning" in w:
            del w["improvedMeaning"]

        # Apply manual corrections first
        if char in CORRECTIONS:
            meaning, pos = CORRECTIONS[char]
            if w["meaning"] != meaning:
                w["meaning"] = meaning
                fixed_count += 1
            w["partOfSpeech"] = pos
        else:
            # Auto-clean remaining meanings
            old = w["meaning"]
            cleaned = clean_meaning(old)
            if cleaned != old:
                w["meaning"] = cleaned
                fixed_count += 1

            # Simplify POS
            if w.get("partOfSpeech"):
                w["partOfSpeech"] = simplify_pos(w["partOfSpeech"])

    with open(path, "w") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)

    print(f"HSK {level}: {fixed_count} meanings fixed out of {len(words)} words")


if __name__ == "__main__":
    for level in range(1, 7):
        fix_level(level)
    print("\nDone!")
