import { RULES_BY_KEYWORD, RuleDefinition } from '../data/rules';

interface TextFragment {
  type: 'text' | 'rule-link';
  content: string;
  rule?: RuleDefinition;
}

/**
 * Process text to identify and link rule keywords
 */
export const processTextForRuleLinks = (text: string): TextFragment[] => {
  const fragments: TextFragment[] = [];
  const words = text.split(/(\s+|[^\w\s-]+)/); // Split on whitespace and punctuation, keeping delimiters
  
  let i = 0;
  while (i < words.length) {
    const word = words[i];
    
    // Skip whitespace and punctuation
    if (/^\s+$/.test(word) || /^[^\w\s-]+$/.test(word)) {
      fragments.push({ type: 'text', content: word });
      i++;
      continue;
    }
    
    // Try to match increasingly longer phrases (up to 4 words)
    let bestMatch: RuleDefinition | null = null;
    let bestMatchLength = 0;
    
    for (let length = 1; length <= Math.min(4, words.length - i); length++) {
      // Build phrase from current position
      const phraseWords = [];
      let phraseEndIndex = i;
      let wordCount = 0;
      
      while (wordCount < length && phraseEndIndex < words.length) {
        const currentWord = words[phraseEndIndex];
        if (!/^\s+$/.test(currentWord) && !/^[^\w\s-]+$/.test(currentWord)) {
          phraseWords.push(currentWord);
          wordCount++;
        }
        phraseEndIndex++;
      }
      
      if (phraseWords.length === length) {
        const phrase = phraseWords.join(' ').toLowerCase();
        const rules = RULES_BY_KEYWORD.get(phrase);
        
        if (rules && rules.length > 0) {
          // Prefer exact name matches over keyword matches
          const exactNameMatch = rules.find(rule => 
            rule.name.toLowerCase() === phrase
          );
          const ruleToUse = exactNameMatch || rules[0];
          
          if (length > bestMatchLength) {
            bestMatch = ruleToUse;
            bestMatchLength = length;
          }
        }
      }
    }
    
    if (bestMatch) {
      // Add any leading whitespace/punctuation before the match
      let leadingText = '';
      let currentIndex = i;
      let wordsToSkip = 0;
      let wordCount = 0;
      
      while (wordCount < bestMatchLength && currentIndex < words.length) {
        const currentWord = words[currentIndex];
        if (!/^\s+$/.test(currentWord) && !/^[^\w\s-]+$/.test(currentWord)) {
          if (wordCount === 0) {
            // First word of match - don't include leading content in the match
          } else {
            leadingText += currentWord;
          }
          wordCount++;
        } else {
          if (wordCount === 0) {
            // Whitespace before match
            fragments.push({ type: 'text', content: currentWord });
          } else {
            // Whitespace within match
            leadingText += currentWord;
          }
        }
        wordsToSkip++;
        currentIndex++;
      }
      
      // Create the rule link
      const matchText = words.slice(i, i + wordsToSkip)
        .filter(w => !/^\s+$/.test(w) && !/^[^\w\s-]+$/.test(w))
        .join(' ');
      
      fragments.push({ 
        type: 'rule-link', 
        content: matchText, 
        rule: bestMatch 
      });
      
      i += wordsToSkip;
    } else {
      // No match found, add as regular text
      fragments.push({ type: 'text', content: word });
      i++;
    }
  }
  
  return fragments;
};

/**
 * Check if text contains any rule keywords
 */
export const containsRuleKeywords = (text: string): boolean => {
  const normalizedText = text.toLowerCase();
  
  for (const keyword of RULES_BY_KEYWORD.keys()) {
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Extract all rule references from text
 */
export const extractRuleReferences = (text: string): RuleDefinition[] => {
  const fragments = processTextForRuleLinks(text);
  const rules = new Set<RuleDefinition>();
  
  fragments.forEach(fragment => {
    if (fragment.type === 'rule-link' && fragment.rule) {
      rules.add(fragment.rule);
    }
  });
  
  return Array.from(rules);
};
