/* playground-runs-data.js — the recorded runs of FIN-T1-003 that playground.html compares: one run per
 * pairing of 11 models and 6 harnesses (66 runs), 13, 14 and 17 November 2026, judged by deepseek-v4.1-flash-1017. Generated
 * from the runs' replay records; do not edit by hand. Rewards, counts and points per dimension are
 * the records' own. The three notes per run (how it worked, along the way, where the score came from)
 * were drafted from each run's steps and the judge's verdicts, then checked against them. */
export const MODELS = [
 {
  "key": "anthropic-claude-opus-5-5",
  "name": "Claude Opus 5.5",
  "vendor": 1
 },
 {
  "key": "anthropic-claude-fable-5-1",
  "name": "Claude Fable 5.1",
  "vendor": 1
 },
 {
  "key": "openai-gpt-6-astra",
  "name": "GPT-6 Astra",
  "vendor": 0
 },
 {
  "key": "openai-gpt-6-1-sol",
  "name": "GPT-6.1 Sol",
  "vendor": 0
 },
 {
  "key": "google-gemini-3-8-flash",
  "name": "Gemini 3.8 Flash",
  "vendor": 2
 },
 {
  "key": "moonshotai-kimi-k3-1-pro",
  "name": "Kimi K3.1 Pro",
  "vendor": 3
 },
 {
  "key": "kimi-k3",
  "name": "Kimi K3",
  "vendor": 3
 },
 {
  "key": "deepseek-v4-1-flash-1017",
  "name": "DeepSeek V4.1 Flash",
  "vendor": 4
 },
 {
  "key": "deepseek-v4-pro-0813",
  "name": "DeepSeek V4 Pro",
  "vendor": 4
 },
 {
  "key": "qwen3-8-max",
  "name": "Qwen 3.8 Max",
  "vendor": 5
 },
 {
  "key": "qwen3-7-max",
  "name": "Qwen 3.7 Max",
  "vendor": 5
 }
];
export const HARNESSES = [
 {
  "key": "dsh",
  "name": "DeepSeek Harness",
  "slot": 0
 },
 {
  "key": "deepagents",
  "name": "DeepAgents",
  "slot": 1
 },
 {
  "key": "codex",
  "name": "Codex CLI",
  "slot": 3
 },
 {
  "key": "terminus-2",
  "name": "Terminus-2",
  "slot": 4
 },
 {
  "key": "opencode",
  "name": "OpenCode",
  "slot": 5
 },
 {
  "key": "claude-code",
  "name": "Claude Code",
  "slot": 2
 }
];
export const DIMENSIONS = ["Conclusions", "Calculations", "Analysis", "Professional standards", "Source fidelity", "Instruction following"];
// The pairing the page replays in full. That replay is an earlier pilot run with its own reward.
export const REPLAYED = 'claude-code__qwen3-7-max';
export const PILOT_REWARD = 0.333;
export const RUNS = {
 "dsh__anthropic-claude-opus-5-5": {
  "reward": 0.609,
  "graded": 0.609,
  "requests": 37,
  "calls": 39,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 11,
  "partial": 3,
  "missed": 6,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    31.5,
    41.0
   ],
   [
    12.0,
    27.0
   ],
   [
    30.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 7028
  },
  "workbook": {
   "formulas": 223
  },
  "points": [
   "It converted the Word files to text and tested on a small file that formulas could be recalculated. Then it built the workbook and wrote the report from the recalculated figures.",
   "It tried to view the report pages as images, but image input was not available. It checked the extracted page text and widened the table columns.",
   "Credited for its review of the dollar loan and the swap's rate sensitivity. It kept 70% of the old hedge running and drew a penalty for back-calculating past ineffectiveness."
  ]
 },
 "dsh__anthropic-claude-fable-5-1": {
  "reward": 0.695,
  "graded": 0.695,
  "requests": 26,
  "calls": 25,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 12,
  "partial": 3,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 7338
  },
  "workbook": {
   "formulas": 207
  },
  "points": [
   "It exported the documents in batches, wrote one script each for the workbook and the report, then recalculated the workbook and checked the figures.",
   "It noticed that the swap's month-end value had moved far more than its rate sensitivity implied. It checked the system log and the frozen re-run before using the figure.",
   "Full marks for keeping the opening reserve in place and for its review of the dollar loan. Points were lost for calling the counterparty valuation gap a curve difference."
  ]
 },
 "dsh__openai-gpt-6-astra": {
  "reward": 0.762,
  "graded": 0.762,
  "requests": 40,
  "calls": 73,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 15,
  "partial": 0,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5441
  },
  "workbook": {
   "formulas": 101
  },
  "points": [
   "It set a goal and a plan, converted the Word files to text, ran two helper agents side by side, built both files from one script and recalculated the formulas separately.",
   "Three attempts to view the report pages as images failed because image input was not available. It checked the page flow from the extracted text.",
   "Full marks on HKSub's June comparatives. The workbook showed neither the amount the 70% plan covers nor the amount left outside it."
  ]
 },
 "dsh__openai-gpt-6-1-sol": {
  "reward": 0.843,
  "graded": 0.843,
  "requests": 57,
  "calls": 86,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 17,
  "partial": 0,
  "missed": 3,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5294
  },
  "workbook": {
   "formulas": 110
  },
  "points": [
   "It set a goal, converted 28 documents to text, started two helper agents as reviewers, and built both files from one script whose formulas it recalculated.",
   "Its final check failed on the report's page count. It read the pages that overflowed, tightened the layout and rebuilt the report at seven pages.",
   "It kept the part of the swap outside the 70% plan clearly separate. Points were lost for not setting the swap's change since 29 June apart from its change in July alone."
  ]
 },
 "dsh__google-gemini-3-8-flash": {
  "reward": 0.603,
  "graded": 0.603,
  "requests": 65,
  "calls": 64,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 8,
  "partial": 5,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    19.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 14786
  },
  "workbook": {
   "formulas": 92
  },
  "points": [
   "It wrote a plan first, read the inputs with scripts, built a workbook with formulas on all five sheets, wrote the report in parts, and checked the formulas for errors.",
   "An error while building the report showed that its first section had not been saved. It rebuilt the first two sections and added the other six separately.",
   "Credited for the swap's rate sensitivity, a corrected valuation total, and leaving one subsidiary's accounting currency for that subsidiary to decide. It never separated the 70% target from the hedge ratio."
  ]
 },
 "dsh__moonshotai-kimi-k3-1-pro": {
  "reward": 0.696,
  "graded": 0.696,
  "requests": 69,
  "calls": 107,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 12,
  "partial": 2,
  "missed": 6,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    47.5,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6935
  },
  "workbook": {
   "formulas": 137
  },
  "points": [
   "It read the tables directly and the Word files through scripts, handed four recalculations to helper agents, and built both files with two scripts.",
   "A check after recalculating found three formula errors caused by one wrong row reference. It fixed the reference and the recheck came back clean.",
   "It booked the dollar loan's loss to finance expense, not the hedge reserve. Points were lost for leaving out the swap's rate sensitivity and the amount the 70% plan covers."
  ]
 },
 "dsh__kimi-k3": {
  "reward": 0.548,
  "graded": 0.548,
  "requests": 29,
  "calls": 33,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "kimi-k3",
  "redlines": [],
  "met": 7,
  "partial": 5,
  "missed": 8,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6970
  },
  "workbook": {
   "formulas": 10
  },
  "points": [
   "It converted the Word files to text, compared two sources of exchange rates before choosing one, and built the workbook and the report with scripts.",
   "The first workbook build stopped because two things in its script shared one name. It renamed one and rebuilt.",
   "Credited for ending the old hedge on 30 June and restating HKSub in full. Points were lost for keeping the dollar loan's loss in equity."
  ]
 },
 "dsh__deepseek-v4-1-flash-1017": {
  "reward": 0.51,
  "graded": 0.51,
  "requests": 135,
  "calls": 145,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 7,
  "partial": 4,
  "missed": 9,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    24.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 15777
  },
  "workbook": {
   "formulas": 2
  },
  "points": [
   "It converted the Word files to text, worked out the figures in scripts, and generated both files with typed values, then checked them as PDFs.",
   "It went through many rounds of patching and rechecking. It moved a misplaced table, turned amounts stored as text into numbers and widened the report's columns.",
   "Credited for the swap's July loss, the opening reserve and HKSub's comparatives. A penalty applied for presenting a back-calculated figure as past hedge ineffectiveness."
  ]
 },
 "dsh__deepseek-v4-pro-0813": {
  "reward": 0.416,
  "graded": 0.416,
  "requests": 28,
  "calls": 38,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 4,
  "partial": 6,
  "missed": 10,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5482
  },
  "workbook": {
   "formulas": 12
  },
  "points": [
   "It set a goal and a to-do list, verified all the amounts in one script, then generated both files from a single script and read them back.",
   "It scanned its own files for restricted identifiers, found two such terms in its own wording, and edited the script twice until the scan came back clean.",
   "Full marks on the USSub sale. A penalty applied for misreading what the opening reserve represents and back-calculating past hedge ineffectiveness from it."
  ]
 },
 "dsh__qwen3-8-max": {
  "reward": 0.642,
  "graded": 0.642,
  "requests": 60,
  "calls": 83,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 10,
  "partial": 3,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 11073
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It converted every Word file to text, calculated all the figures in one script, and built both files with two scripts holding typed values. It rechecked and rebuilt them several times.",
   "Its calculation script failed twice, the second time on its own built-in check. It traced that to a sign error in one HKSub calculation and reran the script.",
   "Credited for the USSub sale and HKSub's comparatives. Points were lost for leaving out the amount the 70% plan covers and for a workbook without formulas."
  ]
 },
 "dsh__qwen3-7-max": {
  "reward": 0.307,
  "graded": 0.307,
  "requests": 18,
  "calls": 29,
  "harness": "DeepSeek Harness (dsh) 0.2.2-rc.1",
  "model": "qwen3.7-max",
  "redlines": [],
  "met": 0,
  "partial": 8,
  "missed": 12,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    12.5,
    50.0
   ],
   [
    12.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5788
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It pulled the Word text out with scripts, calculated the amounts in one script, and wrote the workbook and the report in two more, without formulas. It then compared the amounts between them.",
   "It said it would use helper agents for the analysis, but the record shows no such call. Its next step was a plan entry.",
   "Credited for its analysis of the dollar loan as a hedging instrument. Zero on the USSub question, where it tested the hedge against all of USSub's net assets, not the parent's share."
  ]
 },
 "deepagents__anthropic-claude-opus-5-5": {
  "reward": 0.701,
  "graded": 0.701,
  "requests": 40,
  "calls": 46,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 13,
  "partial": 2,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    22.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6017
  },
  "workbook": {
   "formulas": 187
  },
  "points": [
   "It converted all the Word files to text first, then wrote one script for the workbook and another for the report, and recalculated the workbook.",
   "It rendered the report as page images, saw that the table widths had not been applied, fixed the layout and looked at the pages again.",
   "Credited for showing both the amount the 70% plan covers and the amount left outside it. Points were lost for putting the whole counterparty valuation gap down to curves."
  ]
 },
 "deepagents__anthropic-claude-fable-5-1": {
  "reward": 0.686,
  "graded": 0.686,
  "requests": 47,
  "calls": 45,
  "harness": "LangChain DeepAgents 1.2.22",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 12,
  "partial": 3,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 7447
  },
  "workbook": {
   "formulas": 159
  },
  "points": [
   "It read the documents and data tables in batches, wrote one script each for the workbook and the report, then recalculated the workbook and checked every sheet.",
   "Two reads of data tables stopped on a text-encoding error and were rerun another way. Twice it also wrote out a full summary of the task for itself.",
   "The judge credited the review schedule and showing the 70% plan as a future step. Points were lost for not separating the 70% risk target from the accounting hedge ratio."
  ]
 },
 "deepagents__openai-gpt-6-astra": {
  "reward": 0.843,
  "graded": 0.843,
  "requests": 45,
  "calls": 83,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 17,
  "partial": 0,
  "missed": 3,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5767
  },
  "workbook": {
   "formulas": 221
  },
  "points": [
   "It read the files with its file tool and scripts, gave two read-only research tasks to helper agents, generated both files from one script and recalculated every formula.",
   "The first run of its build script stopped on an error in a print-layout setting. It replaced five occurrences in the script and the rerun was clean.",
   "Full marks for keeping the opening reserve and not releasing it. Points were lost for not separating the 70% risk target from the accounting hedge ratio."
  ]
 },
 "deepagents__openai-gpt-6-1-sol": {
  "reward": 0.802,
  "graded": 0.802,
  "requests": 51,
  "calls": 97,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 16,
  "partial": 0,
  "missed": 4,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6053
  },
  "workbook": {
   "formulas": 149
  },
  "points": [
   "It sent two helper agents to research three parts of the task, then built both files from one script and recalculated the formulas without finding differences.",
   "It had a third helper agent review the finished files. The review found an approval step left open and amounts typed in by hand, so it edited the script and rebuilt.",
   "It kept the opening reserve in place. Points were lost because the workbook did not show the part of the swap left outside the 70% plan."
  ]
 },
 "deepagents__google-gemini-3-8-flash": {
  "reward": 0.453,
  "graded": 0.453,
  "requests": 57,
  "calls": 56,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 5,
  "partial": 5,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    25.0,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 8017
  },
  "workbook": {
   "formulas": 22
  },
  "points": [
   "It wrote no plan. It checked the key amounts one by one in short scripts, then wrote build scripts for the workbook and the report.",
   "The report script failed on its first run. It patched some lines, then rewrote the script, and the report was saved soon after.",
   "Full marks for HKSub's comparatives. Points were lost for keeping the old hedge running in July and parking the swap's loss in a receivable instead of profit or loss."
  ]
 },
 "deepagents__moonshotai-kimi-k3-1-pro": {
  "reward": 0.619,
  "graded": 0.619,
  "requests": 31,
  "calls": 71,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 10,
  "partial": 3,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5527
  },
  "workbook": {
   "formulas": 191
  },
  "points": [
   "It read the tables with its file tool and the other files through scripts, and built each deliverable with one script. Recalculating exposed two misplaced formula references, which it fixed.",
   "Its first nine attempts to open Word files with the file tool returned decoding errors. Later it asked for four file names that did not exist before finding the right ones.",
   "Top marks for keeping the opening reserve and for the USSub sale. Points were lost for the exchange rates used in HKSub's equity and for having no rate sensitivity for the swap."
  ]
 },
 "deepagents__kimi-k3": {
  "reward": 0.545,
  "graded": 0.545,
  "requests": 28,
  "calls": 41,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "kimi-k3",
  "redlines": [],
  "met": 6,
  "partial": 6,
  "missed": 8,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    25.0,
    50.0
   ],
   [
    29.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6483
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It converted all the Word files to text in one batch, built the workbook and the report with two scripts, and validated both. The workbook has no formulas.",
   "Its first attempt to create a working folder inside the task folder was refused. It reran the extraction in a temporary folder and carried on.",
   "Credited for booking the dollar loan's loss to finance expense. Points were lost for not treating the old hedge as ended on 30 June."
  ]
 },
 "deepagents__deepseek-v4-1-flash-1017": {
  "reward": 0.634,
  "graded": 0.634,
  "requests": 142,
  "calls": 146,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 11,
  "partial": 2,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 7784
  },
  "workbook": {
   "formulas": 154
  },
  "points": [
   "It read the Word files through scripts, tested that formulas could be recalculated before building, and at the end compared key amounts between the report and the workbook.",
   "It rewrote the workbook script three times, once to change its calculation method. Two of the rebuilds stopped on errors and were patched.",
   "Credited for treating a 0.02 yuan mismatch in a valuation total as an input error. Points were lost because the workbook left out the amount the 70% plan covers."
  ]
 },
 "deepagents__deepseek-v4-pro-0813": {
  "reward": 0.34,
  "graded": 0.34,
  "requests": 31,
  "calls": 44,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 2,
  "partial": 6,
  "missed": 12,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    22.5,
    50.0
   ],
   [
    10.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 3257
  },
  "workbook": {
   "formulas": 16
  },
  "points": [
   "It read the data tables page by page, pulled the text out of the Word and PDF files with scripts, built each deliverable with one script, and read both back before patching.",
   "Its file reader could not open the first Word file and returned a decoding error. Later its report script failed once and worked on the rerun.",
   "Full marks for HKSub's comparatives and the review schedule. Points were lost for treating the old hedge as still running and putting the swap's July loss in the hedge reserve."
  ]
 },
 "deepagents__qwen3-8-max": {
  "reward": 0.573,
  "graded": 0.573,
  "requests": 194,
  "calls": 209,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 8,
  "partial": 5,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    25.0,
    50.0
   ],
   [
    31.5,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 8489
  },
  "workbook": {
   "formulas": 114
  },
  "points": [
   "It read the inputs with short scripts, built the workbook from four scripts with live formulas and the report from five, then audited both files.",
   "This was the longest path in the grid, at 209 tool calls. Along the way it restated its own summary of the task four times and re-read the brief three more times.",
   "Credited for HKSub's June comparatives and the USSub sale. Points were lost for proposing to send 70% of the swap's July loss to the hedge reserve."
  ]
 },
 "deepagents__qwen3-7-max": {
  "reward": 0.438,
  "graded": 0.438,
  "requests": 34,
  "calls": 62,
  "harness": "LangChain DeepAgents 1.2.21",
  "model": "qwen3.7-max",
  "redlines": [],
  "met": 3,
  "partial": 7,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    12.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6503
  },
  "workbook": {
   "formulas": 7
  },
  "points": [
   "It sent five helper tasks to read the tables and Word files in parallel, then built both deliverables in one script and checked the list of sheets.",
   "After the reading was done it made only two small tool calls for a long stretch, then created both files in a single script run.",
   "Credited for ending the old hedge on 30 June and for the hedge limit after the USSub sale. The workbook never showed the amount the 70% plan covers."
  ]
 },
 "codex__anthropic-claude-opus-5-5": {
  "reward": 0.645,
  "graded": 0.645,
  "requests": 33,
  "calls": 37,
  "harness": "Codex 0.169.0",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 11,
  "partial": 3,
  "missed": 6,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    22.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5767
  },
  "workbook": {
   "formulas": 154
  },
  "points": [
   "It converted the Word files to text, built the workbook and the report with two scripts, and recalculated the workbook to check its values.",
   "Its first command to recalculate the workbook was rejected before it ran. It reran the step with a simpler command.",
   "Credited for moving the whole of the swap's July loss to profit or loss. Points were lost for leaving out the swap's rate sensitivity and the amount the 70% plan covers."
  ]
 },
 "codex__anthropic-claude-fable-5-1": {
  "reward": 0.631,
  "graded": 0.631,
  "requests": 39,
  "calls": 38,
  "harness": "Codex 0.169.0",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 10,
  "partial": 4,
  "missed": 6,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6798
  },
  "workbook": {
   "formulas": 194
  },
  "points": [
   "It converted the documents to text, then wrote one script for the workbook and one for the report. The workbook keeps live formulas.",
   "Its first attempt to recalculate the workbook was rejected and the retry hit an error in its own checker. It wrote a second checker and confirmed the workbook had no errors.",
   "The judge credited putting the swap's July loss in profit or loss and restating HKSub's June comparatives. Points were lost for showing the 70% plan as already in force."
  ]
 },
 "codex__openai-gpt-6-astra": {
  "reward": 0.843,
  "graded": 0.843,
  "requests": 19,
  "calls": 18,
  "harness": "Codex 0.169.0",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 17,
  "partial": 0,
  "missed": 3,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5579
  },
  "workbook": {
   "formulas": 95
  },
  "points": [
   "It read the inputs with short scripts, built both files from one script, then rendered the report and recalculated every workbook formula.",
   "No call failed in this run, which used the fewest tool calls in the grid, 18. It deleted its temporary check files so the output folder held only the two deliverables.",
   "Full marks for booking the dollar loan's loss as an ordinary exchange loss. Points were lost for leaving out the swap's change since 29 June."
  ]
 },
 "codex__openai-gpt-6-1-sol": {
  "reward": 0.828,
  "graded": 0.828,
  "requests": 24,
  "calls": 23,
  "harness": "Codex 0.169.0",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 16,
  "partial": 1,
  "missed": 3,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    47.5,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5974
  },
  "workbook": {
   "formulas": 87
  },
  "points": [
   "It read the inputs with short scripts, built both files from one script that it patched three times, and recalculated the workbook.",
   "Nothing failed in this run. It is one of the shortest paths in the grid: 23 tool calls in under nine minutes.",
   "It booked the dollar loan's loss to profit or loss. Among the few points it lost: it never said that each subsidiary formally decides its own accounting currency."
  ]
 },
 "codex__google-gemini-3-8-flash": {
  "reward": 0.497,
  "graded": 0.497,
  "requests": 69,
  "calls": 68,
  "harness": "Codex 0.169.0",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 5,
  "partial": 6,
  "missed": 9,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 8182
  },
  "workbook": {
   "formulas": 88
  },
  "points": [
   "It read the inputs with short scripts and no written plan, built each of the five sheets with its own script, assembled the workbook, then generated the report.",
   "One sheet's script stopped on a font error. A later check of formula references led it to update three sheet scripts and assemble the workbook again.",
   "Credited for the swap's rate sensitivity and for keeping the dollar loan's loss out of the hedge reserve. Points were lost where a total's formula pointed at June's row."
  ]
 },
 "codex__moonshotai-kimi-k3-1-pro": {
  "reward": 0.624,
  "graded": 0.624,
  "requests": 34,
  "calls": 30,
  "harness": "Codex 0.169.0",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 10,
  "partial": 3,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4200
  },
  "workbook": {
   "formulas": 146
  },
  "points": [
   "It read the inputs with scripts, wrote separate scripts for the workbook and the report, then recalculated the workbook and rendered both files to check them.",
   "In its final review it found that one intermediate HKSub figure had been taken in the wrong currency, and corrected it.",
   "Full marks for HKSub's June comparatives and the swap's July loss. The workbook had neither the swap's rate sensitivity nor the amount the 70% plan covers."
  ]
 },
 "codex__kimi-k3": {
  "reward": 0.0,
  "graded": 0.461,
  "requests": 20,
  "calls": 29,
  "harness": "Codex 0.169.0",
  "model": "kimi-k3",
  "redlines": [
   "G2"
  ],
  "met": 5,
  "partial": 5,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    17.5,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6158
  },
  "workbook": {
   "formulas": 25
  },
  "points": [
   "It read the inputs through shell commands, built the workbook and the report with one script each, and test-converted the report to PDF. All the workbook's formulas sit on one sheet.",
   "Nothing failed in this run. One valuation file looked oddly formatted, so it searched it again and confirmed how far the swap's value had fallen in July.",
   "It booked the dollar loan's exchange loss to the cash-flow hedge reserve. That is red line G2, so the reward is 0 despite credit for the valuation adjustments and HKSub's comparatives."
  ]
 },
 "codex__deepseek-v4-1-flash-1017": {
  "reward": 0.458,
  "graded": 0.458,
  "requests": 117,
  "calls": 138,
  "harness": "Codex 0.169.0",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 6,
  "partial": 5,
  "missed": 9,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 11734
  },
  "workbook": {
   "formulas": 187
  },
  "points": [
   "It exported the Word text to files, built the workbook with three scripts and live formulas, and checked both files by rendering their pages as images.",
   "Late in the run the harness compressed the conversation history once. The agent wrote a handoff summary, picked up from its saved build files and finished the checks.",
   "Credited for refusing to replace the group's swap value with the counterparty's. A penalty applied for using 95.24% as the accounting hedge ratio of the dollar loan."
  ]
 },
 "codex__deepseek-v4-pro-0813": {
  "reward": 0.438,
  "graded": 0.438,
  "requests": 41,
  "calls": 55,
  "harness": "Codex 0.169.0",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 3,
  "partial": 7,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    12.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4747
  },
  "workbook": {
   "formulas": 56
  },
  "points": [
   "It converted every Word file to text, queried the data tables with scripts, built the workbook in two scripts and the report in a third, and recalculated the workbook.",
   "Its last recalculation showed errors in three text cells that began with an equals sign and had been read as formulas. It fixed them and rechecked.",
   "Full marks for HKSub's June comparatives and the swap's July loss. Points were lost for never stating the amount the 70% plan covers or separating the 70% target from the hedge ratio."
  ]
 },
 "codex__qwen3-8-max": {
  "reward": 0.58,
  "graded": 0.58,
  "requests": 58,
  "calls": 70,
  "harness": "Codex 0.169.0",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 11,
  "partial": 2,
  "missed": 7,
  "penalties": 2,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 9730
  },
  "workbook": {
   "formulas": 52
  },
  "points": [
   "It converted every Word file to text, pulled rows from the tables with scripts, and built the workbook and the report with one script each. Its own numeric check caught three arithmetic slips.",
   "Two of its commands were blocked: creating a working folder inside the task folder, and later a delete. It kept its scratch files elsewhere and dropped the delete.",
   "Credited for ending the old hedge on 30 June and rebuilding HKSub's June comparatives. Two penalties applied, one of them for back-calculating past hedge ineffectiveness."
  ]
 },
 "codex__qwen3-7-max": {
  "reward": 0.34,
  "graded": 0.34,
  "requests": 26,
  "calls": 50,
  "harness": "Codex 0.169.0",
  "model": "qwen3.7-max",
  "redlines": [],
  "met": 2,
  "partial": 7,
  "missed": 11,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    15.0,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    12.5,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4123
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read the tables with shell commands and the Word files through scripts, then built the workbook and the report with separate scripts. Every value was typed in, with no formulas.",
   "While checking, it found that one of HKSub's figures was off by about ten thousand, and rebuilt both files with the corrected number.",
   "Full marks for putting the swap's July loss in profit or loss and for HKSub's comparatives. Points were lost for keeping the dollar loan's loss in a reserve."
  ]
 },
 "terminus-2__anthropic-claude-opus-5-5": {
  "reward": 0.635,
  "graded": 0.635,
  "requests": 27,
  "calls": 28,
  "harness": "Terminus-2 2.0.0",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 9,
  "partial": 5,
  "missed": 6,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4464
  },
  "workbook": {
   "formulas": 128
  },
  "points": [
   "It wrote a small script to export the Word text, read the inputs in batches by topic, and built the workbook and the report with two scripts.",
   "Its first reply was too long for the harness to accept, so no command ran. Its first command started several minutes into the run.",
   "Credited for keeping the opening reserve and restating HKSub's June comparatives. Points were lost for leaving out the swap's rate sensitivity and not separating the 70% target from the hedge ratio."
  ]
 },
 "terminus-2__anthropic-claude-fable-5-1": {
  "reward": 0.577,
  "graded": 0.577,
  "requests": 43,
  "calls": 44,
  "harness": "Terminus-2 2.0.0",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 8,
  "partial": 5,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    25.0,
    50.0
   ],
   [
    31.5,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6205
  },
  "workbook": {
   "formulas": 117
  },
  "points": [
   "It wrote a helper to turn the documents into text and read it in small pieces, then used separate scripts for the calculations, the workbook and the report.",
   "While checking recalculated values it found a reconciliation formula pointing one row too high, and corrected it.",
   "It sent 70% of the swap's July loss to the hedge reserve. The judge held that the old hedge had ended on 30 June, so that treatment lost points."
  ]
 },
 "terminus-2__openai-gpt-6-astra": {
  "reward": 0.802,
  "graded": 0.802,
  "requests": 24,
  "calls": 28,
  "harness": "Terminus-2 2.0.0",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 16,
  "partial": 0,
  "missed": 4,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5569
  },
  "workbook": {
   "formulas": 112
  },
  "points": [
   "It read the inputs in batches through the terminal and generated both files in a single command. It recalculated every formula and re-paged the report after finding a blank page.",
   "Its first batch of reading produced too much output, and two PDF tools were missing. It read smaller batches and opened the PDF with a third tool.",
   "Full marks for its split of the review hours. Points were lost for leaving out the part of the swap outside the 70% plan and who formally decides a subsidiary's accounting currency."
  ]
 },
 "terminus-2__openai-gpt-6-1-sol": {
  "reward": 0.778,
  "graded": 0.778,
  "requests": 19,
  "calls": 25,
  "harness": "Terminus-2 2.0.0",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 14,
  "partial": 2,
  "missed": 4,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    47.5,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5520
  },
  "workbook": {
   "formulas": 77
  },
  "points": [
   "It read the inputs with scripts in the terminal, wrote one build script, and checked the workbook's formulas against a recalculation.",
   "A PDF tool was missing when it went to read a paragraph of an accounting standard. It read the PDF with a script and confirmed the rule on minority interests.",
   "Its formulas traced the swap, loan and HKSub figures to their sources. Points were lost because the workbook did not show the part of the swap left outside the 70% plan."
  ]
 },
 "terminus-2__google-gemini-3-8-flash": {
  "reward": 0.512,
  "graded": 0.512,
  "requests": 47,
  "calls": 33,
  "harness": "Terminus-2 2.0.0",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 5,
  "partial": 6,
  "missed": 9,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    24.5,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 13033
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read the inputs through terminal commands and scripts, wrote long analysis notes, and built each deliverable with one script. Every workbook value was typed in, with no formulas.",
   "Many of its replies could not be parsed by the harness because of how it escaped text. At the end it marked the task complete twice.",
   "Credited for ending the old hedge on 30 June. Points were lost where the workbook copied a valuation total from the source that was 0.02 yuan off."
  ]
 },
 "terminus-2__moonshotai-kimi-k3-1-pro": {
  "reward": 0.594,
  "graded": 0.594,
  "requests": 25,
  "calls": 72,
  "harness": "Terminus-2 2.0.0",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 9,
  "partial": 4,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    22.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 3970
  },
  "workbook": {
   "formulas": 116
  },
  "points": [
   "It saved the Word text into files by topic and read them piece by piece, then built both deliverables from one script, with an extra sheet for parameters.",
   "Its first extraction failed because it could not write in the task folder, and long outputs kept being cut off on screen. It moved to a scratch folder and printed shorter pieces.",
   "Credited for leaving one subsidiary's accounting currency for its management to decide and for booking the dollar loan's loss to finance expense. It never said the counterparty valuation gap still needed explaining."
  ]
 },
 "terminus-2__kimi-k3": {
  "reward": 0.504,
  "graded": 0.504,
  "requests": 23,
  "calls": 39,
  "harness": "Terminus-2 2.0.0",
  "model": "kimi-k3",
  "redlines": [],
  "met": 5,
  "partial": 7,
  "missed": 8,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    30.0,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    10.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6314
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read the files through terminal commands and a small helper script, built the workbook and the report with one script each, without formulas, and checked both at the end.",
   "It could not write a helper script in the task folder, which was read-only, so it moved its working files to a temporary folder.",
   "Credited for rejecting the counterparty's value without pinning the gap on a single cause. Points were lost for keeping the swap's July loss in the hedge reserve."
  ]
 },
 "terminus-2__deepseek-v4-1-flash-1017": {
  "reward": 0.529,
  "graded": 0.529,
  "requests": 53,
  "calls": 98,
  "harness": "Terminus-2 2.0.0",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 8,
  "partial": 4,
  "missed": 8,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    19.5,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4484
  },
  "workbook": {
   "formulas": 58
  },
  "points": [
   "It converted the Word files to text, wrote an analysis and a plan on every turn, and built the workbook before the report.",
   "Its last spot check found one block of the workbook out of line with its rows. It rewrote those formulas twice and recalculated before finishing.",
   "It held the dollar loan's exchange loss in profit or loss for now and treated the old hedge as ended. It scored low on the loan's eligibility as a hedge and on the 70% plan's amounts."
  ]
 },
 "terminus-2__deepseek-v4-pro-0813": {
  "reward": 0.276,
  "graded": 0.276,
  "requests": 33,
  "calls": 64,
  "harness": "Terminus-2 2.0.0",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 2,
  "partial": 5,
  "missed": 13,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    17.5,
    50.0
   ],
   [
    12.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    10.0,
    44.0
   ],
   [
    0.0,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 2571
  },
  "workbook": {
   "formulas": 6
  },
  "points": [
   "It worked through terminal commands, printing the tables and Word text in small pieces, built both files in one script, and ran several validation passes.",
   "During validation it changed its mind on the dollar loan's loss and moved it into the hedge reserve. After first declaring the task done, it rebuilt one sheet.",
   "Credited for ending the old hedge on 30 June. Zero for sending the dollar loan's loss to the hedge reserve, and only its tentative label kept the red line from triggering."
  ]
 },
 "terminus-2__qwen3-8-max": {
  "reward": 0.632,
  "graded": 0.632,
  "requests": 95,
  "calls": 106,
  "harness": "Terminus-2 2.0.0",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 10,
  "partial": 3,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    22.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 16263
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It converted every Word file to text and read the files one at a time on screen. It built both files from scripts written in chunks, with typed values, and scanned them for balance and wording.",
   "It noticed that one journal entry had no credit side. It cut the workbook script back to the first three sheets and rewrote the other two before saving anything.",
   "Credited for holding the dollar loan's loss in finance expense for now and for the review schedule. It had no rate sensitivity for the swap, no formulas and no 70% plan."
  ]
 },
 "terminus-2__qwen3-7-max": {
  "reward": 0.292,
  "graded": 0.292,
  "requests": 25,
  "calls": 35,
  "harness": "Terminus-2 2.0.0",
  "model": "qwen3.7-max",
  "redlines": [],
  "met": 1,
  "partial": 7,
  "missed": 12,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    12.5,
    50.0
   ],
   [
    12.5,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    10.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6602
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read the sources in batches with scripts, wrote an analysis and a plan on every turn, and built both files from one script without formulas.",
   "It was refused permission to save its build script in the task folder, and two more attempts saved nothing. A script in a writable folder then produced both files.",
   "Full marks for keeping the opening reserve in place. Points were lost for treating the 70% target as a hedge designation already in force."
  ]
 },
 "opencode__anthropic-claude-opus-5-5": {
  "reward": 0.73,
  "graded": 0.73,
  "requests": 43,
  "calls": 43,
  "harness": "OpenCode 1.19.5",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 14,
  "partial": 1,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    40.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    14.5,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 7644
  },
  "workbook": {
   "formulas": 211
  },
  "points": [
   "It exported the Word text with one script, updated a written plan six times, and built the workbook and the report with two scripts.",
   "The first recalculation left two cells showing errors. It fixed them in the next step, before copying the workbook to the output folder.",
   "Credited for the swap's rate sensitivity and for leaving one subsidiary's accounting currency for that subsidiary to decide. Points were lost for calling the whole counterparty valuation gap a curve difference."
  ]
 },
 "opencode__anthropic-claude-fable-5-1": {
  "reward": 0.65,
  "graded": 0.65,
  "requests": 30,
  "calls": 29,
  "harness": "OpenCode 1.19.5",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 10,
  "partial": 4,
  "missed": 6,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    35.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6253
  },
  "workbook": {
   "formulas": 171
  },
  "points": [
   "It put all the documents into one text file and read from that, updated its plan four times, and built the workbook and the report with one script each.",
   "Nothing failed in this run. After both files were written it changed one sentence in its build script, rebuilt them and checked the formulas again.",
   "Top marks for holding the dollar loan's exchange loss in finance expense for now. Points were lost because the workbook never showed the amount the 70% plan covers."
  ]
 },
 "opencode__openai-gpt-6-astra": {
  "reward": 0.802,
  "graded": 0.802,
  "requests": 35,
  "calls": 46,
  "harness": "OpenCode 1.19.5",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 16,
  "partial": 0,
  "missed": 4,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5559
  },
  "workbook": {
   "formulas": 179
  },
  "points": [
   "It read the inputs with its file tool and short scripts, wrote one build script, viewed the rendered report pages and checked the workbook's formulas.",
   "Four calls failed, among them a missing PDF library and an error reading a data table. A final check also failed once before a revised check passed.",
   "The workbook showed the 70% plan as a future amount. Points were lost for leaving out the part of the swap outside the plan."
  ]
 },
 "opencode__openai-gpt-6-1-sol": {
  "reward": 0.887,
  "graded": 0.887,
  "requests": 35,
  "calls": 45,
  "harness": "OpenCode 1.19.5",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 17,
  "partial": 1,
  "missed": 2,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    47.5,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    37.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4966
  },
  "workbook": {
   "formulas": 140
  },
  "points": [
   "It read the tables with its file tool and the Word files through scripts, wrote one build script, and recalculated the workbook's formulas without a mismatch.",
   "The first two runs of its build script stopped on errors. It patched the script each time, and the third run produced both files.",
   "Credited for separating the 70% risk target from the accounting hedge ratio. Points were lost for not setting the swap's change since 29 June apart from its change in July alone."
  ]
 },
 "opencode__google-gemini-3-8-flash": {
  "reward": 0.471,
  "graded": 0.471,
  "requests": 61,
  "calls": 60,
  "harness": "OpenCode 1.19.5",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 5,
  "partial": 6,
  "missed": 9,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    22.5,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 10435
  },
  "workbook": {
   "formulas": 45
  },
  "points": [
   "It checked each draft amount against the source files with short scripts, kept a plan, wrote one build script per deliverable, and scanned both files for restricted identifiers.",
   "Its first attempt to save the workbook script returned an error and the second succeeded. The whole run took under ten minutes.",
   "The formulas traced all three key amounts to their sources. Points were lost for treating the old hedge as still running and sending most of the swap's July loss to the hedge reserve."
  ]
 },
 "opencode__moonshotai-kimi-k3-1-pro": {
  "reward": 0.751,
  "graded": 0.751,
  "requests": 37,
  "calls": 69,
  "harness": "OpenCode 1.19.5",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 14,
  "partial": 1,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    34.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5154
  },
  "workbook": {
   "formulas": 117
  },
  "points": [
   "It read the tables directly, pulled the Word text out with scripts, used three helper agents for recalculations, and built both files with two scripts before checking the recalculated formulas.",
   "Its scan for restricted identifiers failed three times because it flagged ordinary trade and loan codes. A revised search pattern passed.",
   "It showed the 70% plan as a future step and booked the dollar loan's loss to finance expense. It left out the swap's rate sensitivity and the amount remaining outside the plan."
  ]
 },
 "opencode__kimi-k3": {
  "reward": 0.328,
  "graded": 0.328,
  "requests": 20,
  "calls": 24,
  "harness": "OpenCode 1.19.5",
  "model": "kimi-k3",
  "redlines": [],
  "met": 4,
  "partial": 5,
  "missed": 11,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    10.0,
    50.0
   ],
   [
    15.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6358
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read the tables with shell commands and the Word files with short scripts, then wrote one script that produced both deliverables with typed values and no formulas.",
   "A misspelled variable stopped its build script. After fixing it, it corrected three of HKSub's comparative figures and generated the files again.",
   "It kept the opening reserve in place. Points were lost for splitting the swap's loss 70/30 as if the hedge continued, and a penalty applied for relying on a designation paper supplied after the fact."
  ]
 },
 "opencode__deepseek-v4-1-flash-1017": {
  "reward": 0.44,
  "graded": 0.44,
  "requests": 155,
  "calls": 153,
  "harness": "OpenCode 1.19.5",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 5,
  "partial": 5,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    22.5,
    50.0
   ],
   [
    17.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6821
  },
  "workbook": {
   "formulas": 286
  },
  "points": [
   "It read the documents and data tables with short scripts and built a workbook with live formulas, recalculating it until no formula errors remained.",
   "Most of this five-hour run went on rendering the workbook's pages as images and reworking the sheet layouts, before it copied the files to the output folder.",
   "Credited for HKSub's comparatives, the USSub sale and traceable formulas. Points were lost for treating the old hedge as still running and sending part of the swap's loss to equity."
  ]
 },
 "opencode__deepseek-v4-pro-0813": {
  "reward": 0.326,
  "graded": 0.326,
  "requests": 19,
  "calls": 33,
  "harness": "OpenCode 1.19.5",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 2,
  "partial": 6,
  "missed": 12,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    20.0,
    50.0
   ],
   [
    10.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    3.5,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 3883
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It read twelve data tables in one batch, converted the Word files to text, calculated the amounts in scripts, and wrote a workbook without formulas and the report.",
   "A tool it called for reading PDFs was not installed. After one early calculation, the record shows no further tool call for about 25 minutes.",
   "Full marks on the USSub sale and HKSub's comparatives. Points were lost for sending the swap's July loss to the hedge reserve as if the old hedge still held."
  ]
 },
 "opencode__qwen3-8-max": {
  "reward": 0.481,
  "graded": 0.481,
  "requests": 34,
  "calls": 39,
  "harness": "OpenCode 1.19.5",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 7,
  "partial": 5,
  "missed": 8,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    22.5,
    50.0
   ],
   [
    24.5,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 8443
  },
  "workbook": {
   "formulas": 101
  },
  "points": [
   "It read the documents through a small conversion script, analysed the tables with scripts, then built a workbook with live formulas, recalculated it and checked both files.",
   "After the first build it found broken references between sheets and text cells being read as formulas. Two attempts at a fix failed before the workbook reached zero errors.",
   "Its formulas traced back to source values. A penalty applied for presenting a back-calculated figure as recognised ineffectiveness, and it set USSub's hedge limit at the full net assets."
  ]
 },
 "opencode__qwen3-7-max": {
  "reward": 0.0,
  "graded": 0.234,
  "requests": 32,
  "calls": 46,
  "harness": "OpenCode 1.19.5",
  "model": "qwen3.7-max",
  "redlines": [
   "G2"
  ],
  "met": 0,
  "partial": 7,
  "missed": 13,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    10.0,
    50.0
   ],
   [
    12.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    5.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 3882
  },
  "workbook": {
   "formulas": 0
  },
  "points": [
   "It began with a plan, had four helper tasks read the Word files, and built both deliverables from one script with typed values and no formulas.",
   "Its script hit quoting errors twice. After checking the output it rewrote the script two more times, trying to correct two of the six entries.",
   "It accepted the draft entry that books the dollar loan's exchange loss to the cash-flow hedge reserve. That is red line G2, so the reward is 0."
  ]
 },
 "claude-code__anthropic-claude-opus-5-5": {
  "reward": 0.648,
  "graded": 0.648,
  "requests": 32,
  "calls": 33,
  "harness": "Claude Code 2.1.280",
  "model": "claude-opus-5.5",
  "redlines": [],
  "met": 12,
  "partial": 1,
  "missed": 7,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    27.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5719
  },
  "workbook": {
   "formulas": 162
  },
  "points": [
   "It converted the documents to text and read them in batches, then wrote one script for the workbook and one for the report. It recalculated the workbook, which keeps 162 formulas.",
   "The first two tools it tried for reading the PDF standards were not installed, and the third one worked. After the first build it patched the workbook script and built the workbook again.",
   "Full marks for the swap's July loss and HKSub's June comparatives. Points were lost for calling the whole counterparty valuation gap a curve difference and for leaving out the swap's rate sensitivity."
  ]
 },
 "claude-code__anthropic-claude-fable-5-1": {
  "reward": 0.73,
  "graded": 0.73,
  "requests": 32,
  "calls": 31,
  "harness": "Claude Code 2.1.280",
  "model": "claude-fable-5.1",
  "redlines": [],
  "met": 14,
  "partial": 1,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    37.5,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 9962
  },
  "workbook": {
   "formulas": 175
  },
  "points": [
   "It read the brief and the small tables first, converted the Word documents to text and read them in batches, then wrote one script for the workbook and one for the report. The workbook keeps 175 formulas.",
   "After recalculating the workbook it found that notes beginning with an equals sign had been read as formulas. It fixed the script, rebuilt the workbook and checked it again.",
   "Full marks for the swap's July loss, the dollar loan's loss and HKSub's June comparatives. Points were lost for calling the counterparty valuation gap a curve difference and for not separating the 70% risk target from the accounting hedge ratio."
  ]
 },
 "claude-code__openai-gpt-6-astra": {
  "reward": 0.802,
  "graded": 0.802,
  "requests": 46,
  "calls": 54,
  "harness": "Claude Code 2.1.114",
  "model": "gpt-6-astra",
  "redlines": [],
  "met": 16,
  "partial": 0,
  "missed": 4,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5251
  },
  "workbook": {
   "formulas": 188
  },
  "points": [
   "It read the brief first, sent a helper agent to check the questions on the overseas subsidiaries, then wrote one script that built both files. The workbook keeps 188 formulas.",
   "After both files were written it sent a second helper agent to review them. The review found only a wrong creation date in the report's file properties, which it then corrected.",
   "Full marks on every conclusion and every calculation. Points were lost for not separating the 70% risk target from the accounting hedge ratio and for leaving out the part of the swap outside the 70% plan."
  ]
 },
 "claude-code__openai-gpt-6-1-sol": {
  "reward": 0.843,
  "graded": 0.843,
  "requests": 53,
  "calls": 85,
  "harness": "Claude Code 2.1.114",
  "model": "gpt-6.1-sol",
  "redlines": [],
  "met": 17,
  "partial": 0,
  "missed": 3,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    50.0,
    50.0
   ],
   [
    41.0,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    27.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 6235
  },
  "workbook": {
   "formulas": 151
  },
  "points": [
   "It read the files directly, gave two research questions to helper agents, built both files from one script, and recalculated the workbook without finding differences.",
   "Two attempts to read an accounting-standard PDF failed because the usual PDF tools were missing. It checked what else was installed and extracted the paragraphs another way.",
   "Full marks on rebuilding HKSub's June comparatives. Most of the points it lost were for not separating the 70% risk target from the accounting hedge ratio."
  ]
 },
 "claude-code__google-gemini-3-8-flash": {
  "reward": 0.382,
  "graded": 0.382,
  "requests": 34,
  "calls": 33,
  "harness": "Claude Code 2.1.114",
  "model": "gemini-3.8-flash",
  "redlines": [],
  "met": 3,
  "partial": 7,
  "missed": 10,
  "penalties": 1,
  "penaltyTotal": 5,
  "dims": [
   [
    27.5,
    50.0
   ],
   [
    17.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 9161
  },
  "workbook": {
   "formulas": 16
  },
  "points": [
   "It read the documents and tables with shell commands, kept a task list, and built each deliverable with one script followed by a structure check.",
   "Nothing failed in this run. Before writing either file, it checked how the draft entries and the corrected ones would each change net profit.",
   "Credited for rejecting the early USSub gain and assigning the amount to minority interests. A penalty applied for describing reviews planned for August as already done."
  ]
 },
 "claude-code__moonshotai-kimi-k3-1-pro": {
  "reward": 0.703,
  "graded": 0.703,
  "requests": 55,
  "calls": 163,
  "harness": "Claude Code 2.1.114",
  "model": "kimi-k3.1-pro",
  "redlines": [],
  "met": 11,
  "partial": 4,
  "missed": 5,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    45.0,
    50.0
   ],
   [
    31.5,
    41.0
   ],
   [
    17.0,
    27.0
   ],
   [
    17.5,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5813
  },
  "workbook": {
   "formulas": 208
  },
  "points": [
   "It read the tables with its file tool and the Word and PDF files through scripts, built both files from one script that it edited eleven times, and recalculated the workbook.",
   "Its first two attempts to start helper agents failed. It started them again with different settings and got back two research summaries.",
   "Credited for the swap's rate sensitivity and for refusing the counterparty's value. Points were lost for leaving out the amount the 70% plan covers."
  ]
 },
 "claude-code__kimi-k3": {
  "reward": 0.481,
  "graded": 0.481,
  "requests": 24,
  "calls": 31,
  "harness": "Claude Code 2.1.114",
  "model": "kimi-k3",
  "redlines": [],
  "met": 5,
  "partial": 5,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    10.0,
    27.0
   ],
   [
    15.0,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 5983
  },
  "workbook": {
   "formulas": 23
  },
  "points": [
   "It read the inputs through shell commands and scripts, built the workbook and the report with one script each, and scanned both files for restricted identifiers.",
   "It was not allowed to save its workbook script in the task folder, so it ran the build directly from the command line.",
   "Credited for ending the old hedge and restating HKSub's June comparatives. Points were lost for leaving out the 70% plan's amount, the swap's rate sensitivity and the valuation adjustments."
  ]
 },
 "claude-code__deepseek-v4-1-flash-1017": {
  "reward": 0.523,
  "graded": 0.523,
  "requests": 51,
  "calls": 53,
  "harness": "Claude Code 2.1.114",
  "model": "deepseek-v4.1-flash-1017",
  "redlines": [],
  "met": 8,
  "partial": 3,
  "missed": 9,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    32.5,
    50.0
   ],
   [
    20.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    20.0,
    44.0
   ],
   [
    7.0,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 10800
  },
  "workbook": {
   "formulas": 138
  },
  "points": [
   "It exported all the Word text to one file, wrote a task list, calculated every amount in one shared script, and built the workbook and the report from it.",
   "A late check showed the workbook held no formulas at all. It added formula checks to all five sheets and recalculated them.",
   "Full marks for treating the USSub sale as a reallocation within equity, not a gain. Points were lost for calling the counterparty valuation gap a curve difference."
  ]
 },
 "claude-code__deepseek-v4-pro-0813": {
  "reward": 0.362,
  "graded": 0.362,
  "requests": 23,
  "calls": 36,
  "harness": "Claude Code 2.1.114",
  "model": "deepseek-v4-pro-0813",
  "redlines": [],
  "met": 3,
  "partial": 7,
  "missed": 10,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    22.5,
    50.0
   ],
   [
    17.5,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    10.0,
    44.0
   ],
   [
    1.75,
    7.0
   ],
   [
    3.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4681
  },
  "workbook": {
   "formulas": 7
  },
  "points": [
   "It read the data tables directly, pooled the Word text into one file, kept a to-do list, and wrote one script per deliverable. It read both files back at the end.",
   "One ledger was too large for its file tool, so it pulled the rows it needed with a shell command. Later it fixed a syntax error in its workbook script.",
   "Full marks for putting the swap's July loss in profit or loss. Zero on the USSub question, where it measured the hedge limit against all of USSub's net assets."
  ]
 },
 "claude-code__qwen3-8-max": {
  "reward": 0.0,
  "graded": 0.0,
  "requests": 20,
  "calls": 19,
  "harness": "Claude Code 2.1.114",
  "model": "qwen3.8-max",
  "redlines": [],
  "met": 0,
  "partial": 0,
  "missed": 20,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    0.0,
    50.0
   ],
   [
    0.0,
    41.0
   ],
   [
    0.0,
    27.0
   ],
   [
    0.0,
    44.0
   ],
   [
    0.0,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": null,
  "workbook": null,
  "points": [
   "It read the brief first, converted every Word file to text with a helper script and cross-checked the swap's values. All 19 of its tool calls went on reading the inputs.",
   "It stopped about twelve minutes in, right after saying it would set up a task list, without writing either deliverable.",
   "The judge found the output folder empty, so no criterion earned any credit and the reward is 0."
  ]
 },
 "claude-code__qwen3-7-max": {
  "reward": 0.307,
  "graded": 0.307,
  "requests": 37,
  "calls": 55,
  "harness": "Claude Code 2.1.114",
  "model": "qwen3.7-max",
  "redlines": [],
  "met": 0,
  "partial": 8,
  "missed": 12,
  "penalties": 0,
  "penaltyTotal": 5,
  "dims": [
   [
    12.5,
    50.0
   ],
   [
    15.0,
    41.0
   ],
   [
    7.5,
    27.0
   ],
   [
    12.5,
    44.0
   ],
   [
    5.25,
    7.0
   ],
   [
    0.0,
    3.0
   ]
  ],
  "report": {
   "chars": 4585
  },
  "workbook": {
   "formulas": 12
  },
  "points": [
   "It pulled the Word text out with scripts, read the tables directly, kept a task list, built each file with its own script and compared key amounts afterwards.",
   "It was not allowed to save a build script in the task folder. It put its scripts in the output folder and deleted them once both files were built.",
   "Credited for keeping the opening reserve and for a balanced HKSub restatement. Points were lost for sending 70% of the swap's July loss to the hedge reserve as if the hedge continued."
  ]
 }
};
