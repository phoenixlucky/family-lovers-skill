"use strict";

// ============================================================
// family-lovers-skill — 原生家庭关怀对话模式路由
// ============================================================

const MODES = {
  awareness: {
    description: "Help the user recognize family-of-origin patterns, emotional triggers, and conditioned beliefs.",
    outputMode: "reflection",
    length: "medium",
  },
  healing: {
    description: "Validate emotions, offer gentle reframing, and provide self-dialogue exercises.",
    outputMode: "support",
    length: "medium",
  },
  companionship: {
    description: "Embody a secure-attachment persona (warm mother / wise father / understanding sister / supporting brother) for safe relational experience.",
    outputMode: "companion",
    length: "medium",
  },
  action: {
    description: "Provide practical boundary-setting, communication skills, and self-care exercises.",
    outputMode: "guidance",
    length: "medium",
  },
  crisis: {
    description: "User shows signs of psychological crisis — provide hotline info and recommend professional help.",
    outputMode: "crisis",
    length: "short",
  },
  continuation: {
    description: "Keep the conversation flowing when no strong mode signal is detected.",
    outputMode: "companion",
    length: "short",
  },
};

const FAMILY_PATTERNS = [
  { tag: "role_fixation", description: "Fixed family role (good child, scapegoat, mediator, invisible one)", patterns: [/乖孩子/, /好孩子/, /听话/, /替罪羊/, /透明人/, /调解者/, /小大人/] },
  { tag: "emotional_neglect", description: "Emotions were not seen or responded to", patterns: [/不被看见/, /不被理解/, /没人在意/, /忽略我的感受/, /情感忽视/, /没人在乎/] },
  { tag: "conditional_love", description: "Love conditional on achievement or behavior", patterns: [/只有.*才/, /有条件/, /优秀才/, /考得好/, /听话才/, /完美主义/, /必须是/] },
  { tag: "control_enmeshment", description: "Over-control, lack of boundaries, emotional fusion", patterns: [/控制/, /干涉/, /替我做决定/, /不能有自己的想法/, /情感绑架/, /道德绑架/, /为你好/] },
  { tag: "role_reversal", description: "Child parentified, took care of parents' emotions", patterns: [/照顾父母/, /安慰妈妈/, /父母的情绪/, /我不敢让他们操心/, /我承担了/] },
  { tag: "generational_trauma", description: "Trauma passed down from previous generations", patterns: [/重复/, /一样的/, /遗传/, /跟我爸一样/, /跟我妈一样/, /代际/] },
  { tag: "abandonment_fear", description: "Fear of being left, rejected, or abandoned", patterns: [/害怕被抛弃/, /怕被丢下/, /不敢依赖/, /不敢太亲近/, /怕被拒绝/] },
  { tag: "guilt_obligation", description: "Guilt-driven sense of duty to family", patterns: [/愧疚/, /内疚/, /亏欠/, /欠他们的/, /应该回报/, /不孝/, /不懂事/] },
  { tag: "enmeshment_trauma", description: "No healthy separation between self and family", patterns: [/分不开/, /剪不断/, /缠在一起/, /没有自己的空间/, /边界模糊/] },
];

const MODE_RULES = [
  {
    mode: "crisis",
    weight: 15,
    patterns: [/自杀/, /不想活了/, /活不下去/, /dead/, /kill myself/, /自残/, /伤害自己/, /hurt myself/],
  },
  {
    mode: "healing",
    weight: 10,
    patterns: [
      /委屈/, /难受/, /难过/, /伤心/, /痛苦/, /心痛/, /失望/, /绝望/,
      /愤怒/, /生气/, /恨/, /讨厌/, /为什么这样对我/, /不公平/,
      /哭/, /泪/, /压抑/, /窒息/, /喘不过气/,
    ],
  },
  {
    mode: "awareness",
    weight: 9,
    patterns: [
      /为什么我会/, /是不是因为/, /跟.*有关/, /有什么影响/, /来自原生家庭/,
      /模式/, /习得的/, /从小/, /小时候/, /童年/,
      /觉察/, /发现/, /意识到/, /理解/,
    ],
  },
  {
    mode: "action",
    weight: 8,
    patterns: [
      /怎么/, /如何/, /方法/, /话术/, /技巧/, /练习/,
      /边界/, /沟通/, /表达/, /拒绝/, /说不/,
      /应该怎么做/, /有什么建议/, /具体/,
    ],
  },
  {
    mode: "companionship",
    weight: 7,
    patterns: [
      /陪陪我/, /陪我说说话/, /抱抱/, /需要你/, /你在吗/,
      /温暖母亲/, /智慧父亲/, /理解姐姐/, /支持兄长/,
      /安慰/, /陪陪/, /好累/, /孤独/, /孤单/,
    ],
  },
];

function scoreMode(text) {
  const scores = Object.fromEntries(Object.keys(MODES).map((key) => [key, 0]));

  for (const rule of MODE_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        scores[rule.mode] += rule.weight;
      }
    }
  }

  if (scores.crisis > 0) {
    scores.healing -= 1;
  }

  return scores;
}

function detectFamilyPatterns(text) {
  return FAMILY_PATTERNS
    .filter((pattern) => pattern.patterns.some((re) => re.test(text)))
    .map((pattern) => pattern.tag);
}

function inferEmotionalIntensity(text) {
  if (/很|特别|非常|一直|反复|彻底|完全|太|极度|无比|崩溃/.test(text)) {
    return "high";
  }
  if (/有点|还行|偶尔|好像|似乎|可能/.test(text)) {
    return "low";
  }
  return "medium";
}

function inferUserStage(text) {
  if (/不知道怎么办|好迷茫|无助|不知道该怎么|没方向/.test(text)) {
    return "confused_seeking";
  }
  if (/发现|意识到|觉察|明白了|原来是这样|懂了/.test(text)) {
    return "insight_emerging";
  }
  if (/开始练习|试着做了|尝试|迈出了/.test(text)) {
    return "in_action";
  }
  if (/懂了很多道理|理论|书上说|在书上看到/.test(text)) {
    return "theory_before_feeling";
  }
  return "unspecified";
}

function selectPrimaryMode(scores) {
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [mode, score] = ranked[0];

  if (score <= 0) {
    return {
      primaryMode: "continuation",
      secondaryModes: [],
    };
  }

  const secondaryModes = ranked
    .slice(1)
    .filter(([, value]) => value > 0)
    .slice(0, 2)
    .map(([key]) => key);

  return {
    primaryMode: mode,
    secondaryModes,
  };
}

function routeInput(input) {
  const text = String(input || "").trim();
  const scores = scoreMode(text);
  const familyPatterns = detectFamilyPatterns(text);
  const emotionalIntensity = inferEmotionalIntensity(text);
  const userStage = inferUserStage(text);

  const { primaryMode, secondaryModes } = selectPrimaryMode(scores);

  return {
    input: text,
    primaryMode,
    secondaryModes,
    modeConfig: MODES[primaryMode],
    emotionalIntensity,
    userStage,
    detectedFamilyPatterns: familyPatterns,
    hasCrisisSignal: scores.crisis > 0,
    scores,
  };
}

function readCliInput() {
  const args = process.argv.slice(2).join(" ").trim();

  if (args) {
    return Promise.resolve(args);
  }

  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data.trim()));
  });
}

async function main() {
  const input = await readCliInput();

  if (!input) {
    console.error("Usage: npm run route -- <text>");
    process.exitCode = 1;
    return;
  }

  const result = routeInput(input);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  MODES,
  MODE_RULES,
  FAMILY_PATTERNS,
  routeInput,
};
