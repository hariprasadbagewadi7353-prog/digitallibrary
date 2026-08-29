import { GoogleGenAI } from '@google/genai';
import { ExtractedMemberData, ExtractedBookData } from '../src/types';

export function parseMemberRecordFromText(text: string): ExtractedMemberData {
  const result: ExtractedMemberData = {
    student_name: '',
    registration_number: '',
    village: '',
    pincode: '',
    mobile: '',
    email: '',
    confidence: {},
    raw_text: text
  };

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Registration Number regex (e.g. LIB-2026-00125, REG-12345, MEM/2026/01, etc.)
  const regMatch = text.match(/(?:Registration\s*(?:No|Number|#)?|Reg\s*No|ID|ನೋಂದಣಿ\s*ಸಂಖ್ಯೆ)[\s.:=-]*([A-Z0-9\-\/]{4,20})/i) ||
                   text.match(/\b(LIB-\d{4}-\d{4,6})\b/i) ||
                   text.match(/\b(REG-[\w\-]{4,15})\b/i);
  if (regMatch) {
    result.registration_number = regMatch[1].trim();
    result.confidence!.registration_number = 0.9;
  }

  // 2. Email regex
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    result.email = emailMatch[1].trim();
    result.confidence!.email = 0.95;
  }

  // 3. Mobile number regex (Indian 10-digit starting with 6,7,8,9)
  const mobileMatch = text.match(/(?:Mobile|Phone|Cell|Contact|ಮೊಬೈಲ್|ದೂರವಾಣಿ)[\s.:=-]*(\+?91[\s-]?)?([6-9]\d{9})\b/i) ||
                      text.match(/\b([6-9]\d{4}\s*\d{5})\b/) ||
                      text.match(/\b([6-9]\d{9})\b/);
  if (mobileMatch) {
    const rawDigits = (mobileMatch[2] || mobileMatch[1] || mobileMatch[0]).replace(/\D/g, '');
    if (rawDigits.length === 10) {
      result.mobile = rawDigits;
      result.confidence!.mobile = 0.9;
    }
  }

  // 4. Pincode regex (6 digits, especially 5xxxxx for Karnataka/South India)
  const pinMatch = text.match(/(?:Pincode|Pin|Postal\s*Code|ಪಿನ್‌ಕೋಡ್|ಪಿನ್)[\s.:=-]*(\d{6})\b/i) ||
                   text.match(/\b(5[6-9]\d{4})\b/) ||
                   text.match(/\b(\d{6})\b/);
  if (pinMatch) {
    result.pincode = pinMatch[1].trim();
    result.confidence!.pincode = 0.85;
  }

  // 5. Student Name
  const nameMatch = text.match(/(?:Student\s*Name|Member\s*Name|Name|Full\s*Name|ಹೆಸರು|ವಿಧ್ಯಾರ್ಥಿ\s*ಹೆಸರು)[\s.:=-]*([A-Za-z\s.'\u0C80-\u0CFF]{3,40})/i);
  if (nameMatch && !nameMatch[1].toLowerCase().includes('registration') && !nameMatch[1].toLowerCase().includes('village')) {
    result.student_name = nameMatch[1].trim();
    result.confidence!.student_name = 0.85;
  } else {
    // If not explicitly labeled, search top lines for probable human name
    for (const line of lines.slice(0, 4)) {
      if (/^[A-Za-z\s.'\u0C80-\u0CFF]{3,35}$/.test(line) && !line.includes('LIBRARY') && !line.includes('GOVERNMENT') && !line.includes('REGISTER')) {
        result.student_name = line;
        result.confidence!.student_name = 0.7;
        break;
      }
    }
  }

  // 6. Village / City
  const villageMatch = text.match(/(?:Village|Town|City|Native|Place|Address|ಗ್ರಾಮ|ಹಳ್ಳಿ|ಸ್ಥಳ)[\s.:=-]*([A-Za-z\s\u0C80-\u0CFF]{3,30})/i);
  if (villageMatch) {
    result.village = villageMatch[1].trim();
    result.confidence!.village = 0.8;
  }

  return result;
}

export function parseBookRecordFromText(text: string): ExtractedBookData {
  const result: ExtractedBookData = {
    book_number: '',
    book_name: '',
    author: '',
    publisher: '',
    category: '',
    language: 'English',
    publication_year: '',
    isbn: '',
    description: '',
    confidence: {},
    raw_text: text
  };

  // 1. Book Number (e.g. B-001549, BOOK-0012, ACC-992, etc.)
  const bkNumMatch = text.match(/(?:Book\s*(?:No|Number|#)|Acc\s*(?:No|Number)|Accession\s*No|ಪುಸ್ತಕ\s*ಸಂಖ್ಯೆ)[\s.:=-]*([A-Z0-9\-\/]{3,20})/i) ||
                     text.match(/\b(B-\d{4,6})\b/i) ||
                     text.match(/\b(BOOK-\d{4,6})\b/i);
  if (bkNumMatch) {
    result.book_number = bkNumMatch[1].trim();
    result.confidence!.book_number = 0.9;
  }

  // 2. ISBN
  const isbnMatch = text.match(/(?:ISBN(?:-1[03])?)[\s.:=-]*([0-9Xx\-]{10,17})/i) ||
                    text.match(/\b(978[-0-9]{11,16})\b/);
  if (isbnMatch) {
    result.isbn = isbnMatch[1].trim();
    result.confidence!.isbn = 0.95;
  }

  // 3. Title / Book Name
  const titleMatch = text.match(/(?:Book\s*Name|Title|Book\s*Title|ಪುಸ್ತಕದ\s*ಹೆಸರು|ಶೀರ್ಷಿಕೆ)[\s.:=-]*([A-Za-z0-9\s.,'()\-:\u0C80-\u0CFF]{3,60})/i);
  if (titleMatch) {
    result.book_name = titleMatch[1].trim();
    result.confidence!.book_name = 0.85;
  }

  // 4. Author
  const authorMatch = text.match(/(?:Author|Written\s*By|By|ಲೇಖಕರು|ಕರ್ತೃ)[\s.:=-]*([A-Za-z\s.'\u0C80-\u0CFF]{3,40})/i);
  if (authorMatch) {
    result.author = authorMatch[1].trim();
    result.confidence!.author = 0.85;
  }

  // 5. Publisher
  const pubMatch = text.match(/(?:Publisher|Published\s*By|Press|ಪ್ರಕಾಶಕರು|ಪ್ರಕಾಶನ)[\s.:=-]*([A-Za-z\s.'\u0C80-\u0CFF]{3,50})/i);
  if (pubMatch) {
    result.publisher = pubMatch[1].trim();
    result.confidence!.publisher = 0.8;
  }

  // 6. Year
  const yearMatch = text.match(/(?:Publication\s*Year|Year|Edition|ವರ್ಷ|ಮುದ್ರಣ\s*ವರ್ಷ)[\s.:=-]*(19\d{2}|20[0-2]\d)\b/i) ||
                    text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  if (yearMatch) {
    result.publication_year = yearMatch[1].trim();
    result.confidence!.publication_year = 0.85;
  }

  // 7. Language
  if (/[\u0C80-\u0CFF]/.test(text) || /kannada|ಕನ್ನಡ/i.test(text)) {
    result.language = 'Kannada';
  } else if (/english/i.test(text)) {
    result.language = 'English';
  }

  return result;
}

// Optional Gemini fallback for advanced handwritten or complex unstructured records
export async function enhanceOCRWithGemini(rawText: string, documentType: 'MEMBER' | 'BOOK') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = documentType === 'MEMBER'
      ? `You are an OCR assistant for a Government Library in Karnataka, India. Analyze the following OCR extracted text from a physical member register card and output a strict JSON object with these exact keys:
{
  "student_name": string (full name of the student/patron, or empty string if not found),
  "registration_number": string (e.g. LIB-2026-00125 or existing registration code, or empty string),
  "village": string (village, town, or city in Karnataka, or empty string),
  "pincode": string (6-digit Indian pincode e.g. 591307, or empty string),
  "mobile": string (10-digit mobile number, or empty string),
  "email": string (valid email address, or empty string)
}
OCR Text:
${rawText}

Only return valid JSON without markdown wrapping if possible.`
      : `You are an OCR assistant for a Government Library. Analyze this OCR extracted text from a book cover or catalog card and output a strict JSON object:
{
  "book_number": string (e.g. B-001549, or empty string),
  "book_name": string (title of the book),
  "author": string (author name),
  "publisher": string (publisher name),
  "category": string (e.g. Competitive Exams, Kannada Literature, History, Science, etc.),
  "language": string ("Kannada" or "English"),
  "publication_year": string (e.g. 2024),
  "isbn": string (ISBN number or empty string),
  "description": string (short summary or blank)
}
OCR Text:
${rawText}

Only return valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Gemini OCR assist fallback error (will use regex parser):', err);
    return null;
  }
}
