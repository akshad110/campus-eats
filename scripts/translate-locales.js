import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import translate from 'translate-google';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Language codes mapping
const languageCodes = {
  'ar': 'ar', // Arabic
  'de': 'de', // German
  'es': 'es', // Spanish
  'fr': 'fr', // French
  'gu': 'gu', // Gujarati
  'hi': 'hi', // Hindi (already translated manually)
  'it': 'it', // Italian
  'ja': 'ja', // Japanese
  'mr': 'mr', // Marathi
  'pt': 'pt', // Portuguese
  'ru': 'ru', // Russian
  'zh': 'zh'  // Chinese
};

// Translation function using translate-google package
async function translateText(text, targetLang) {
  if (!text || text.trim() === '') return text;
  
  // Preserve interpolation variables like {{name}}, {{minutes}}, etc.
  const interpolationVars = text.match(/\{\{[^}]+\}\}/g) || [];
  let textToTranslate = text;
  
  // Replace interpolation variables with placeholders
  const placeholders = {};
  interpolationVars.forEach((var_, index) => {
    const placeholder = `__VAR_${index}__`;
    placeholders[placeholder] = var_;
    textToTranslate = textToTranslate.replace(var_, placeholder);
  });
  
  try {
    // Translate using translate-google
    const translated = await translate(textToTranslate, { to: targetLang });
    
    // Restore interpolation variables
    let result = translated;
    Object.entries(placeholders).forEach(([placeholder, var_]) => {
      result = result.replace(placeholder, var_);
    });
    
    return result;
  } catch (error) {
    console.warn(`Translation error for "${text.substring(0, 30)}...": ${error.message}`);
    return text; // Return original on error
  }
}

async function translateJSON(obj, targetLang, sourceLang = 'en', delay = 100) {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Translate the text, preserving interpolation variables
      translated[key] = await translateText(value, targetLang);
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, delay));
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      translated[key] = await translateJSON(value, targetLang, sourceLang, delay);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

async function translateLocaleFile(sourceFile, targetFile, targetLang) {
  try {
    console.log(`Translating ${targetFile}...`);
    
    const sourceContent = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
    const translated = await translateJSON(sourceContent, targetLang);
    
    fs.writeFileSync(targetFile, JSON.stringify(translated, null, 2) + '\n', 'utf8');
    console.log(`✓ Translated ${targetFile}`);
  } catch (error) {
    console.error(`Error translating ${targetFile}:`, error.message);
  }
}

// Main function
async function main() {
  const localesDir = path.join(__dirname, '../src/i18n/locales');
  const enFile = path.join(localesDir, 'en.json');
  
  console.log('Starting translation process...');
  console.log('This will translate all locale files from English.\n');
  console.log('Note: This uses Google Translate web API (free, no key required)');
  console.log('Translation may take some time due to rate limiting...\n');
  
  // Get language code from command line argument, or translate all
  const targetLang = process.argv[2];
  
  if (targetLang && languageCodes[targetLang]) {
    // Translate single language
    const targetFile = path.join(localesDir, `${targetLang}.json`);
    if (targetLang === 'hi') {
      console.log('Skipping Hindi - already manually translated');
    } else {
      await translateLocaleFile(enFile, targetFile, targetLang);
    }
  } else {
    // Translate all languages
    for (const [langCode, langName] of Object.entries(languageCodes)) {
      if (langCode === 'en' || langCode === 'hi') continue; // Skip English and Hindi (already done)
      
      const targetFile = path.join(localesDir, `${langCode}.json`);
      await translateLocaleFile(enFile, targetFile, langCode);
      
      // Add delay between languages
      console.log(`Waiting 2 seconds before next language...\n`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✓ Translation process completed!');
}

main().catch(console.error);

