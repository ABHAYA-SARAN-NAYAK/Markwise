const Engine = require('./public/js/engine.js');
const fs = require('fs');
const path = require('path');

const keycardsPath = path.join(__dirname, 'public/data/keycards.json');
const keycards = JSON.parse(fs.readFileSync(keycardsPath, 'utf8'));

console.log(`Checking ${keycards.cards.length} cards in ${keycardsPath}...`);

let failureCount = 0;
const failures = [];

keycards.cards.forEach((card) => {
  const cardFailures = [];

  // Check 1: Engine.evaluate(card, card.model) scores full marks
  const fullEval = Engine.evaluate(card, card.model);
  if (fullEval.total !== card.marks) {
    cardFailures.push(`Model score mismatch: got ${fullEval.total}/${card.marks}. Leaks: ${JSON.stringify(fullEval.leaks)}`);
  }

  // Check 2: Engine.evaluate(card, "I do not know this answer at all sorry") scores 0
  const zeroEval = Engine.evaluate(card, 'I do not know this answer at all sorry');
  if (zeroEval.total !== 0) {
    cardFailures.push(`Zero answer scored > 0: got ${zeroEval.total}`);
  }

  // Check 3: A "half answer" (first half of the model text) scores less than full
  const words = (card.model || '').trim().split(/\s+/);
  const halfWords = words.slice(0, Math.max(1, Math.floor(words.length / 2))).join(' ');
  const halfEval = Engine.evaluate(card, halfWords);
  if (halfEval.total >= card.marks) {
    cardFailures.push(`Half answer scored full marks (${halfEval.total}/${card.marks})`);
  }

  // Check 4: sum(item marks) == card.marks
  const itemSum = (card.items || []).reduce((sum, item) => sum + item.marks, 0);
  if (itemSum !== card.marks) {
    cardFailures.push(`Item marks sum (${itemSum}) != card.marks (${card.marks})`);
  }

  // Check 5: card.boards and card.partByBoard exist and are consistent
  if (!card.boards || !Array.isArray(card.boards) || card.boards.length === 0) {
    cardFailures.push('Missing or invalid boards array');
  } else {
    if (!card.partByBoard || typeof card.partByBoard !== 'object') {
      cardFailures.push('Missing partByBoard object');
    } else {
      card.boards.forEach((board) => {
        if (!card.partByBoard[board]) {
          cardFailures.push(`partByBoard missing label for board: ${board}`);
        }
      });
    }
  }

  // Check 6: card.reveal exists; Maths cards contain a "steps" block; Accountancy cards contain a "table" block; Biology cards contain a "diagram" or "points" block
  if (!card.reveal || !card.reveal.blocks || !Array.isArray(card.reveal.blocks) || card.reveal.blocks.length === 0) {
    cardFailures.push('Missing or empty reveal blocks');
  } else {
    const blockTypes = card.reveal.blocks.map(b => b.type);
    if (card.subject === 'Maths') {
      if (!blockTypes.includes('steps')) {
        cardFailures.push('Maths card must contain a "steps" block');
      }
    } else if (card.subject === 'Accountancy') {
      if (!blockTypes.includes('table')) {
        cardFailures.push('Accountancy card must contain a "table" block');
      }
    } else if (card.subject === 'Biology') {
      if (!blockTypes.includes('diagram') && !blockTypes.includes('points')) {
        cardFailures.push('Biology card must contain a "diagram" or "points" block');
      }
    }
  }

  if (cardFailures.length > 0) {
    failureCount++;
    failures.push({ id: card.id, subject: card.subject, errors: cardFailures });
  }
});

if (failures.length > 0) {
  console.error(`\n❌ FAILURES FOUND: ${failures.length} card(s) failed validation:\n`);
  failures.forEach(f => {
    console.error(`[${f.id}] (${f.subject}):`);
    f.errors.forEach(e => console.error(`  - ${e}`));
  });
  process.exit(1);
} else {
  console.log(`\n✅ ALL CARDS PASS (Tested all ${keycards.cards.length} cards across all 6 criteria)`);
}

// Old test cases for PHY-01
console.log('\n--- Re-running PHY-01 Legacy Regression Tests ---');
const phy01 = keycards.cards.find(c => c.id === 'PHY-01');

const test1 = Engine.evaluate(phy01, 'Lenz law: the induced current opposes the change in magnetic flux that produces it.');
console.log('PHY-01 Test 1 (Full): Score =', test1.total, '/', phy01.marks, test1.total === 2 ? '✅ PASS' : '❌ FAIL');
if (test1.total !== 2) process.exit(1);

const test2 = Engine.evaluate(phy01, 'The induced emf is opposite to the magnetic field.');
console.log('PHY-01 Test 2 (Trap): Score =', test2.total, '/', phy01.marks, 'Traps =', test2.traps, (test2.total === 1 && test2.traps.length > 0) ? '✅ PASS' : '❌ FAIL');
if (test2.total !== 1 || test2.traps.length === 0) process.exit(1);

console.log('\n--- Regression Tests Complete: ALL PASSED ---');
