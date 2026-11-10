/* agent-run-data.js — the one run agent-run.html steps through: FIN-T1-003, qwen3.7-max in Claude
 * Code 2.1.114 (trial FIN-T1-003__EUsH44A). Commands, outputs, timings, token counts and scores come
 * from that run's records (video-demo/sources/finance, data/fin.json and fin.requests.jsonl); the
 * outputs are excerpts, in the source's own language.
 *
 * Each step is one click.
 *   beat      which set plays it: 0 is agent-run-stage.js, 1 is film-grading.js.
 *   dur       how long the step's animation plays, in seconds.
 *   lp        for film-grading.js, the local progress its set reaches. Staging only.
 *   from  the first request a step covers, when it covers several.
 *   req, tok, calls, files, t  after this step: model requests, prompt size in thousands of tokens,
 *             tool calls, files named in commands so far, seconds since the run began.
 *   facts     [label, value or lines]: what the step found, in the reader's terms.
 *   log       [label, text]: the original record behind it, shown on request and left as recorded. */

// The configuration that was actually run, as indices into arena-data.js.
export const RECORDED = Object.freeze({ model: 5, variant: 1, harness: 2, effort: 2 });
export const RECORDED_LABEL = Object.freeze({ model: 'Qwen 3.7 Max', harness: 'Claude Code' });
export const TOTALS = Object.freeze({ requests: 28, calls: 54, files: 55 });

export const GROUPS = Object.freeze(['Brief', 'Gather evidence', 'Measure and build', 'Failure and repair', 'Independent check']);

export const STEPS = Object.freeze([
  {
    group: 0, beat: 0, dur: 3, req: 0, tok: 26.6, calls: 0, files: 0, t: 0, tag: 'Brief',
    title: 'The task enters the sandbox; the rubric does not.',
    body: 'The July books lock at 18:00 on 5 August. Six draft entries, D01 to D06, remain unposted, and each must be accepted, replaced or rejected, with its statement effect. A full check is estimated at 18 hours; the one independent reviewer has 12.',
    facts: [
      ["Received", "55 documents: ledgers, valuations, policies and letters"],
      ["Required", "One Word report and one Excel workbook"],
    ],
    note: 'The agent works without seeing how it will be judged.',
  },
  {
    group: 1, beat: 0, dur: 4, req: 1, tok: 26.6, calls: 2, files: 0, t: 6.2, tag: 'Survey',
    title: 'It surveys the folder before reading anything.',
    body: 'The first response carries two tool calls: list the inputs and create the output folder.',
    say: 'I\'ll start by exploring the input files and understanding the pending accounting entries, then systematically work through the deliverables.',
    facts: [
      ["In the folder", "18 data tables, 28 Word documents, 8 PDF and web pages, 1 log"],
      ["Output folder", "Created and empty"],
    ],
    log: [
      ['Bash', 'ls -la /app/input_files/ | head -80\nmkdir -p /app/output && ls -la /app/output/'],
      ['Returned', '-r--r--r-- 1 root root 5423891 10_逐日利率与汇率因子序列_20210802_20260731.csv\n-r--r--r-- 1 root root 5300200 12_衍生品交易与逐日估值明细_20250401_20260731.csv\n…'],
    ],
    note: 'The model chooses the action, the harness turns it into a tool call, the command runs in the sandbox, and the output returns to the model.',
  },
  {
    group: 1, beat: 0, dur: 6, req: 2, tok: 29.9, calls: 4, files: 2, t: 10.4, tag: 'Read',
    title: 'The register opens; the engagement letter does not.',
    body: 'The register of pending entries returns six rows, all unposted. The Word letter, read as plain text, returns raw binary.',
    facts: [
      ["Register of draft entries", ["D01 · Swap change to the hedge reserve · 3,118,484.29 yuan", "D02 · Dollar loan FX loss to the hedge reserve · 4,480,000.00 yuan", "D03 · Opening reserve released to profit or loss · 283,416.56 yuan", "D04 · HKSub comparatives · no amount stated", "D05 · USSub disposal gain accrued · 6,000,000.00 yuan", "D06 · Counterparty gap as a credit adjustment · 35,371.91 yuan"]],
      ["Engagement letter", "Unreadable: the file came back as raw binary"],
    ],
    log: [
      ['Bash', 'cat "/app/input_files/61_七月待入账意见登记_20260803.csv"\ncat "/app/input_files/60_七月结账专项复核委托_20260803.docx" | head -200'],
      ['Returned', 'D01,HR-01,2026-07,互换继续按原关系计入现金流量套期储备,…,3118484.29,未过账\nD06,IRS-2026-0031,2026-07-31,以17号对手方估值替换16号采用值,…,35371.91,未过账\n.w�W3�����SZ�j���ok�&����W�n;  PK…'],
    ],
  },
  {
    group: 1, beat: 0, dur: 4.2, req: 3, tok: 31.7, calls: 7, files: 4, t: 14.9, tag: 'Adapt',
    title: 'The failed read changes the next action.',
    body: 'The agent rereads the letter through a Word library, and this time the text comes through. The same response also opens the opening balances and the review-hour schedule.',
    facts: [
      ["Engagement letter, now readable", "Decide each of D01 to D06: replace, keep or reject, and give the correct proposed entry."],
      ["Also opened", "Opening balances and the independent reviewer's hour schedule"],
    ],
    log: [
      ['Bash', 'python3 -c "\nfrom docx import Document\ndoc = Document(\'/app/input_files/60_七月结账专项复核委托_20260803.docx\')\n…"'],
      ['Returned', '61号D01至D06均为编制人的待入账意见，全部尚未过账。\n请逐项决定替换、保留或拒绝，给出正确拟入账分录。'],
    ],
  },
  {
    group: 1, beat: 0, dur: 3.8, req: 4, tok: 34.3, calls: 11, files: 8, t: 27.2, tag: 'Read',
    title: 'Four files, one response.',
    body: 'One response can carry several tool calls. The harness runs all four and returns the results together.',
    say: 'Now let me read the detailed valuation and hedge files to understand the numbers for each entry.',
    facts: [
      ["Opened together", ["Back-office valuation worksheet", "Counterparty valuation statement", "Hedge designation and rebalancing ledger", "FX rate source check for overseas subsidiaries"]],
    ],
    log: [
      ['Bash × 4', 'head -5 "16_中后台估值底稿_20260731.csv"\nhead -5 "17_对手方估值单_20260731.csv"\nhead -5 "15_套期指定与再平衡台账_20260731.csv"\nhead -5 "24_境外子公司汇率来源核对单_20260731.csv"'],
      ['Returned', '79 16_中后台估值底稿_20260731.csv\n79 17_对手方估值单_20260731.csv\n1704 15_套期指定与再平衡台账_20260731.csv'],
    ],
  },
  {
    group: 1, beat: 0, dur: 4.5, req: 5, tok: 38.2, calls: 12, files: 8, t: 33.8, tag: 'Plan',
    title: 'It writes its own plan.',
    body: 'Nine items: read the sources, analyse each of the six entries, build the workbook, write the report.',
    facts: [
      ["The plan", ["Read the source files for each entry", "Analyse D01 to D06, one item each", "Build the five-sheet Excel workbook", "Write the Word report"]],
    ],
    log: [
      ['TodoWrite', '▸ Read all critical source files for each pending entry (D01-D06)\n· Analyze D01: HR-01 swap CF hedge reserve treatment\n· Analyze D02: HR-03 USD loan FX loss treatment\n· Analyze D03 … D06\n· Create Excel workbook with all 5 required sheets\n· Create Word report with all required sections'],
    ],
  },
  {
    group: 1, beat: 0, dur: 7.5, req: 12, from: 6, tok: 54.8, calls: 32, files: 27, t: 73.1, tag: 'Read',
    title: 'Seven requests later, the conflicts are on the table.',
    body: 'Twenty further tool calls open designations, policies, standards and letters: 27 of the 55 files by request 12. A risk-committee resolution cuts the hedge objective to 70%, the designation still records a full hedge, and a treasury memo post-dates the 3 August fact cutoff.',
    facts: [
      ["Risk committee resolution · No. 40", "Hedge 70% of notional from 30 June 2026. Passed by seven votes."],
      ["Hedge designation · No. 32", "Objective: hedge the full notional of loan L-001."],
      ["Treasury memo · No. 42 · 4 August", "Treat the change as rebalancing; no new designation needed."],
    ],
    log: [
      ['40 号决议', '…按名义金额的 70% 对冲，自 2026-06-30 起执行。表决结果：7 票同意。'],
      ['32 号指定文档', '本套期关系的风险管理目标为：对 L-001 的全部名义金额进行全额对冲。'],
      ['42 号备忘稿 · 8 月 4 日', '司库部初步意见认为，本次调整属于对套期关系中数量的调整，可按再平衡处理，原套期关系视为延续，不需重新指定…'],
    ],
  },
  {
    group: 2, beat: 0, dur: 5, req: 13, tok: 56.8, calls: 33, files: 27, t: 103.4, tag: 'Plan',
    title: 'It marks all six analyses complete.',
    body: 'After a pause of about 30 seconds, the plan is updated: reading and all six analyses are ticked, and the workbook is in progress.',
    say: 'Now I\'ll analyze each pending entry and create the deliverables.',
    facts: [
      ["Marked complete", "Reading the sources and the six analyses, D01 to D06"],
      ["In progress", "The Excel workbook"],
    ],
    log: [
      ['TodoWrite', '✓ Analyze D01: HR-01 swap CF hedge reserve treatment\n✓ Analyze D02 … D06\n▸ Create Excel workbook with all 5 required sheets\n· Create Word report with all required sections'],
    ],
    note: 'That status is the agent\'s own claim, not a check. The swap\'s daily valuations have not yet been queried.',
  },
  {
    group: 2, beat: 0, dur: 7, req: 15, from: 14, tok: 61.7, calls: 38, files: 29, t: 121, tag: 'Measure',
    title: 'It measures the swap\'s July change.',
    body: 'A query of the daily valuation file gives −3,118,484.29 yuan for July, the amount the draft carries. With the hedge ended on 30 June, the agent moves it from the reserve to profit or loss.',
    facts: [
      ["Swap value, 30 June", "−1,277,351.45 yuan"],
      ["Swap value, 31 July", "−4,395,835.74 yuan"],
      ["July change", "−3,118,484.29 yuan"],
    ],
    log: [
      ['Bash', 'python3 -c "import csv\nopen(\'…/12_衍生品交易与逐日估值明细_20250401_20260731.csv\')\nif row[\'交易编号\'] == \'IRS-2026-0031\' …"'],
      ['Returned', '06-30   −1,277,351.45\n07-31   −4,395,835.74'],
    ],
  },
  {
    group: 2, beat: 0, dur: 5.5, req: 17, from: 16, tok: 70.5, calls: 40, files: 29, t: 205.4, tag: 'Build',
    title: 'Two long scripts produce the workbook.',
    body: 'Each response writes a complete script for the spreadsheet. Three sheets appear, then two more.',
    say: 'Now I\'ll create the comprehensive Excel workbook with all calculations and analysis.',
    facts: [
      ["Five sheets", "Hedge designations, effectiveness assessment, translation and reserves, adjusting entries, review schedule"],
    ],
    log: [
      ['Bash', 'python3 << \'PYEOF\'\nimport openpyxl\n…'],
      ['Returned', 'Sheet 5 created: 复核排程\nWorkbook completed and saved to /app/output/FIN-T1-003_月结调整与复核底稿.xlsx\nTotal sheets: 5'],
    ],
  },
  {
    group: 3, beat: 0, dur: 4.5, req: 19, tok: 74.9, calls: 42, files: 29, t: 240.3, tag: 'Failure', tone: 'fail',
    title: 'A misspelled variable stops the script.',
    body: 'A script to enrich two sheets prints “enhanced” twice, then halts before it saves. Neither edit reaches the file.',
    facts: [
      ["Cause", "The variable ussub_headers was misspelled as usub_headers."],
      ["Effect", "Sheets 1 and 2 were left as they were."],
    ],
    log: [
      ['Bash · exit 1', 'Sheet 1 enhanced\nSheet 2 enhanced\nTraceback (most recent call last):\n  File "<stdin>", line 212, in <module>\nNameError: name \'usub_headers\' is not defined. Did you mean: \'ussub_headers\'?'],
    ],
  },
  {
    group: 3, beat: 0, dur: 6.5, req: 22, from: 20, tok: 83.6, calls: 45, files: 29, t: 338.3, tag: 'Build', tone: 'fail',
    title: 'The agent carries on, unaware.',
    body: 'It enriches sheets three and four, then writes the Word report, one section for each entry. Sheet one still holds three rows.',
    facts: [
      ["Completed", ["Sheets 3 and 4 enriched and saved", "Word report written"]],
      ["Still missing", "The additions to sheets 1 and 2"],
    ],
    log: [
      ['Returned', 'Sheet 3 enhanced\nAll enhancements saved\n\nSheet 4 enhanced\nAll enhancements saved\n\nWord document saved to /app/output/FIN-T1-003_七月结账整改与复核安排.docx'],
    ],
  },
  {
    group: 3, beat: 0, dur: 5, req: 24, from: 23, tok: 94.8, calls: 49, files: 29, t: 371.4, tag: 'Read-back', tone: 'fail',
    title: 'Reading its own files back exposes the gap.',
    body: 'The agent lists the deliverables, opens the workbook, and looks once more. The first sheet has three rows.',
    say: 'Let me verify the Sheet 1 data was properly enhanced with the IRS and LOAN details.',
    facts: [
      ["Hedge designations sheet", "3 rows"],
      ["Effectiveness assessment sheet", "21 rows"],
    ],
    log: [
      ['Returned', '=== 套期关系指定 ===\nDimensions: 3 rows x 13 cols\nNon-empty cells in col A: 3'],
    ],
  },
  {
    group: 3, beat: 0, dur: 4.5, req: 25, tok: 95.4, calls: 50, files: 29, t: 394, tag: 'Repair', tone: 'fix',
    title: 'It states the cause and repairs the file.',
    body: 'The edits are applied again, and this time they are saved. File integrity is restored; the professional conclusions are unchanged.',
    say: 'The Sheet 1 and Sheet 2 enhancements weren\'t saved due to the earlier error. Let me reapply them.',
    facts: [
      ["Sheets 1 and 2", "Additions applied again and saved"],
    ],
    log: [
      ['Returned', 'Sheet 1 enhanced\nSheet 2 enhanced\nAll enhancements saved'],
    ],
  },
  {
    group: 3, beat: 0, dur: 6.5, req: 28, from: 26, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Stop',
    title: 'A final check, and the agent stops.',
    body: 'Both sheets now hold 39 rows and the plan is ticked off. The run ends after 28 model requests and 54 tool calls: 50 commands and 4 plan updates.',
    facts: [
      ["Excel workbook", ["Hedge designations · 39 rows", "Effectiveness assessment · 39 rows", "Translation and reserves · 50 rows", "Adjusting entries · 47 rows", "Review schedule · 23 rows"]],
      ["Word report", "188 paragraphs, 6 tables, 52 headings"],
    ],
    log: [
      ['Returned', 'Sheets: 5\n  套期关系指定: 39 rows x 13 cols\n  有效性评估: 39 rows x 6 cols\n  折算与储备: 50 rows x 7 cols\n  调整分录: 47 rows x 10 cols\n  复核排程: 23 rows x 9 cols'],
    ],
    note: 'Every result stays in the model\'s context: the prompt grew from about 27 thousand to about 100 thousand tokens.',
  },
  {
    group: 4, beat: 1, dur: 3, lp: .09, req: 28, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Verify',
    title: 'Only now do the tests enter the container.',
    body: 'Harbor copies the tests in after the agent has stopped. RewardKit then opens a separate judge session for each of the 27 criteria, on another model. Nothing flows back to the agent.',
    facts: [
      ["Judge", "A separate model, one session for each of the 27 criteria"],
      ["Scored", "The Word report and the Excel workbook only"],
      ["Duration", "59 min 17 s across 280 model requests"],
    ],
  },
  {
    group: 4, beat: 1, dur: 3.2, lp: .26, req: 28, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Criterion R11', tone: 'fix',
    title: 'One figure holds, though it was copied.',
    body: 'The workbook\'s DV01 matches the judge\'s recomputation from the ±5 basis-point scenarios. The agent took the figure from the valuation sheet rather than deriving it.',
    facts: [
      ["Criterion R11 · met · +7 points", "DV01 of −132,480.55 yuan per basis point, within the ±0.01 tolerance"],
    ],
  },
  {
    group: 4, beat: 1, dur: 2.8, lp: .42, req: 28, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Criterion R19', tone: 'fail',
    title: 'Every amount is a typed value.',
    body: 'None of the five sheets contains a formula, so the swap\'s change, the loan\'s FX loss and the translation difference cannot be traced to their source fields.',
    facts: [
      ["Criterion R19 · not met · 0 of 3 points", "No formula in any of the five sheets"],
    ],
  },
  {
    group: 4, beat: 1, dur: 3.5, lp: .64, req: 28, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Red line G2',
    title: 'The red line holds; the treatment earns half.',
    body: 'Draft D02 books the loan\'s 4,480,000 yuan FX loss to the cash-flow hedge reserve, which is itself a red line. The agent avoids it, but accepting the loss as a provisional net-investment hedge reaches only level 3 of 5.',
    facts: [
      ["Red line G2 · held", "The FX loss was not booked to the cash-flow hedge reserve"],
      ["Criterion R51 · level 3 of 5 · +5 points", "D02 treated provisionally while the designation papers remain incomplete"],
    ],
  },
  {
    group: 4, beat: 1, dur: 3.2, lp: .84, req: 28, tok: 99.8, calls: 54, files: 29, t: 414.7, tag: 'Result',
    title: 'The recorded reward is 0.333.',
    body: 'Of 20 positive criteria, 3 are met, 6 partly met and 11 not met. No penalties were triggered and both red lines held: 57.25 of 172 weighted points.',
    facts: [
      ["Points by dimension", ["Conclusions · 22.5 of 50", "Calculations · 19.5 of 41", "Analysis · 7.5 of 27", "Professional standards · 2.5 of 44", "Source fidelity · 5.25 of 7", "Instruction following · 0 of 3"]],
    ],
    note: 'This is one pilot run\'s rubric score on synthetic business records. It is not an accuracy figure or a ranking.',
  },
]);
