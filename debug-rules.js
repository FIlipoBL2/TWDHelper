// Debug script to test rule search functionality
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read and parse the TypeScript file (simplified approach)
const rulesPath = path.join(__dirname, 'data', 'rules.ts');
const rulesContent = fs.readFileSync(rulesPath, 'utf8');

// Extract the GENERAL_CONCEPTS_DATA
const generalMatch = rulesContent.match(/const GENERAL_CONCEPTS_DATA = \[([\s\S]*?)\];/);
const rulesMatch = rulesContent.match(/const RULES_AND_MECHANICS_DATA = \[([\s\S]*?)\];/);
const combatMatch = rulesContent.match(/const COMBAT_RULES_DATA = \[([\s\S]*?)\];/);

console.log('=== DEBUG RULES SYSTEM ===');
console.log('General concepts found:', !!generalMatch);
console.log('Rules and mechanics found:', !!rulesMatch);
console.log('Combat rules found:', !!combatMatch);

if (generalMatch) {
  console.log('\nFirst general concept (partial):');
  console.log(generalMatch[1].substring(0, 200) + '...');
}

if (rulesMatch) {
  console.log('\nFirst rule/mechanic (partial):');
  console.log(rulesMatch[1].substring(0, 200) + '...');
}

console.log('\n=== Searching for "stress" keyword ===');
// Simple search simulation
const allData = [];

// Parse general concepts
if (generalMatch) {
  const items = generalMatch[1].split('},');
  items.forEach((item, index) => {
    const termMatch = item.match(/term: ["'](.*?)["']/);
    const descMatch = item.match(/description: ["'](.*?)["']/s);
    if (termMatch && descMatch) {
      allData.push({
        id: `general-${index}`,
        name: termMatch[1],
        category: 'general',
        description: descMatch[1],
        keywords: [termMatch[1].toLowerCase()]
      });
    }
  });
}

// Parse rules and mechanics
if (rulesMatch) {
  const items = rulesMatch[1].split('},');
  items.forEach((item, index) => {
    const termMatch = item.match(/term: ["'](.*?)["']/);
    const descMatch = item.match(/description: ["'](.*?)["']/s);
    if (termMatch && descMatch) {
      allData.push({
        id: `rules-${index}`,
        name: termMatch[1],
        category: 'rules',
        description: descMatch[1],
        keywords: [termMatch[1].toLowerCase()]
      });
    }
  });
}

console.log(`Total rules parsed: ${allData.length}`);

// Search for stress
const stressResults = allData.filter(rule => 
  rule.name.toLowerCase().includes('stress') || 
  rule.keywords.some(k => k.includes('stress'))
);

console.log(`\nStress search results: ${stressResults.length}`);
stressResults.forEach(rule => {
  console.log(`\n- ${rule.name} (${rule.category})`);
  console.log(`  Description: ${rule.description.substring(0, 100)}...`);
});
