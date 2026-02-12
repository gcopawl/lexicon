import React, { useState, useEffect, useMemo } from 'react';
import { Moon, Sun, Search, RefreshCw, Volume2 } from 'lucide-react';
import { getGeminiExplanation } from './services/geminiService';

// --- Hooks ---

const useTheme = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDark(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return { isDark, setIsDark };
};

// --- Components ---

interface TypewriterTextProps {
  text: string;
  className?: string;
  onComplete?: () => void;
  speed?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, className = "", onComplete, speed = 15 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete, speed]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};

// --- Main Component ---

const EnglishLearningTool = () => {
  const [word, setWord] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fade, setFade] = useState(false);
  const [error, setError] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // Track if a search has ever been performed to lock layout to the top
  const [hasSearched, setHasSearched] = useState(false);
  
  const { isDark, setIsDark } = useTheme();

  const getWordExplanation = async () => {
    if (!word.trim() || isLoading) return;

    // Lock the layout to the top once search begins
    setHasSearched(true);
    setIsLoading(true);
    setFade(true);
    setError(false);
    setResult('');

    try {
      const text = await getGeminiExplanation(word);
      setResult(text);
      setIsTyping(true);
    } catch (error) {
      console.error('Error:', error);
      setError(true);
    } finally {
      setIsLoading(false);
      setFade(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWord(e.target.value);
    setError(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      getWordExplanation();
    }
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Parsing Logic
  const parsedContent = useMemo(() => {
    if (!result) return null;

    const lines = result.split('\n').filter(line => line.trim());
    const wordLine = lines[0] || '';

    let pronunciationLine = '';
    let examples: string[] = [];
    let synonymsLine = '';
    let antonymsLine = '';
    let translationLine = '';
    let idiomsLine = '';

    lines.forEach((line) => {
      if (line.includes('PRONUNCIATION:')) pronunciationLine = line;
      else if (line.includes('SYNONYMS:')) synonymsLine = line;
      else if (line.includes('ANTONYMS:')) antonymsLine = line;
      else if (line.includes('Перевод:')) translationLine = line;
      else if (line.includes('ИДИОМЫ:')) idiomsLine = line;
      else if (/^\d\./.test(line)) examples.push(line);
    });

    const cleanWordLine = wordLine.replace(/\*\*/g, '');
    const splitIndex = cleanWordLine.indexOf(' - ');
    
    let wordPart = cleanWordLine;
    let explanation = '';

    if (splitIndex !== -1) {
        wordPart = cleanWordLine.substring(0, splitIndex).trim();
        explanation = cleanWordLine.substring(splitIndex + 3).trim();
    } else {
        // Fallback if formatting is loose
        wordPart = word; 
        explanation = cleanWordLine;
    }

    const pronunciation = pronunciationLine.replace('PRONUNCIATION:', '').trim().replace(/\[|\]/g, '').trim();
    const synonyms = synonymsLine.replace('SYNONYMS:', '').replace(/\*\*/g, '').split(',').map(s => s.trim()).filter(s => s);
    const antonyms = antonymsLine.replace('ANTONYMS:', '').replace(/\*\*/g, '').split(',').map(s => s.trim()).filter(s => s);
    const translation = translationLine.replace('Перевод:', '').replace(/\*\*/g, '').trim();
    const idioms = idiomsLine.replace('ИДИОМЫ:', '').replace(/\*\*/g, '').trim();

    return {
        wordPart,
        explanation,
        pronunciation: pronunciation ? `[${pronunciation}]` : '',
        synonyms,
        antonyms,
        translation,
        idioms,
        examples
    };
  }, [result, word]);

  const accentColor = '#A8A29D';
  const textColor = isDark ? '#ffffff' : '#1B1917';
  const subTextColor = isDark ? '#E5E5E4' : '#44403C';

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: isDark ? '#1B1917' : '#FAFAF9',
        color: textColor
      }}
    >
      {/* Header */}
      <header className="absolute top-0 w-full pt-6 z-10">
        <div className="w-full max-w-3xl mx-auto px-6 flex justify-between items-center">
            <h1 
            className="text-2xl font-serif italic font-light"
            style={{ color: accentColor }}
            >
            English Learning Assistant
            </h1>
            <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
            aria-label="Toggle theme"
            >
            {isDark ? <Sun className="w-5 h-5" style={{ color: accentColor }} /> : <Moon className="w-5 h-5" style={{ color: accentColor }} />}
            </button>
        </div>
      </header>

      {/* Main content */}
      <main 
        className={`min-h-screen w-full flex flex-col items-center transition-all duration-700 ease-out ${
          hasSearched ? 'pt-24' : 'pt-[35vh]'
        }`}
      >
        <div className="w-full max-w-3xl px-6 space-y-8">
          
          {/* Input section */}
          <div className="flex justify-center">
            <div className="relative flex items-baseline gap-2 w-full">
              <input
                type="text"
                value={word}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="serendipity"
                className="border-b transition-colors duration-300 bg-transparent outline-none text-center text-4xl font-serif pt-2 pb-2 leading-[0.9] w-full"
                style={{
                  borderColor: accentColor,
                  color: textColor,
                  borderBottomWidth: '1px'
                }}
              />
              <button
                onClick={getWordExplanation}
                className={`p-2 transition-all absolute right-0 bottom-2 ${
                  !word || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                }`}
                style={{ color: accentColor }}
                disabled={!word || isLoading}
                aria-label="Search word"
              >
                {isLoading ? (
                  <div className="animate-spin">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Result section */}
          {parsedContent && !error && (
            <div 
              className={`transition-opacity duration-500 ${
                fade ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="relative w-full space-y-6">
                
                {/* Word and explanation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-5xl font-serif">
                      {isTyping ? (
                        <TypewriterText 
                          text={parsedContent.wordPart}
                          speed={30}
                          onComplete={() => setTimeout(() => setIsTyping(false), 200)}
                        />
                      ) : (
                        parsedContent.wordPart
                      )}
                    </h2>
                    <button
                      onClick={() => speakWord(parsedContent.wordPart)}
                      className={`p-2 rounded-full transition-all hover:scale-110 ${
                        isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" style={{ color: accentColor }} />
                    </button>
                  </div>
                  
                  {parsedContent.pronunciation && (
                    <p 
                      className="text-lg font-serif animate-fadeIn"
                      style={{ color: accentColor, animationDelay: '100ms' }}
                    >
                      {parsedContent.pronunciation}
                    </p>
                  )}
                  
                  <p 
                    className="text-xl font-serif italic animate-fadeIn"
                    style={{ color: accentColor, animationDelay: '200ms' }}
                  >
                    {parsedContent.explanation}
                  </p>
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  {parsedContent.examples.map((example, index) => (
                    <div 
                      key={index}
                      className="font-serif text-lg animate-fadeIn"
                      style={{ color: subTextColor, animationDelay: `${400 + index * 150}ms` }}
                    >
                      {example}
                    </div>
                  ))}
                </div>

                {/* Synonyms and Antonyms */}
                {(parsedContent.synonyms.length > 0 || parsedContent.antonyms.length > 0) && (
                  <div className="space-y-4 pt-2">
                    {parsedContent.synonyms.length > 0 && (
                      <div className="animate-fadeIn" style={{ animationDelay: '700ms' }}>
                        <div className="text-lg font-serif italic mb-1" style={{ color: accentColor }}>
                          Synonyms:
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {parsedContent.synonyms.map((syn, idx) => (
                            <span 
                              key={idx}
                              className="font-serif text-xl leading-relaxed"
                              style={{ color: subTextColor }}
                            >
                              {syn}{idx < parsedContent.synonyms.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {parsedContent.antonyms.length > 0 && (
                      <div className="animate-fadeIn" style={{ animationDelay: '800ms' }}>
                        <div className="text-lg font-serif italic mb-1" style={{ color: accentColor }}>
                          Antonyms:
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {parsedContent.antonyms.map((ant, idx) => (
                            <span 
                              key={idx}
                              className="font-serif text-xl leading-relaxed"
                              style={{ color: subTextColor }}
                            >
                              {ant}{idx < parsedContent.antonyms.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Translation */}
                <div 
                  className="pt-6 border-t font-serif text-xl animate-fadeIn"
                  style={{ 
                    borderColor: '#A8A29D33',
                    color: accentColor,
                    animationDelay: '900ms'
                  }}
                >
                  Translation: <span style={{ color: textColor }}>
                    {parsedContent.translation}
                  </span>
                </div>

                {/* Idioms */}
                {parsedContent.idioms && (
                  <div 
                    className="font-serif animate-fadeIn"
                    style={{ color: subTextColor, animationDelay: '1000ms' }}
                  >
                    <div className="text-sm mb-2" style={{ color: accentColor }}>
                      Idioms:
                    </div>
                    {parsedContent.idioms}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="text-center animate-fadeIn">
              <p className="text-xl font-serif italic" style={{ color: '#EF4444' }}>
                Let's try again
              </p>
            </div>
          )}

          {/* Hint */}
          {!result && !error && !isLoading && (
            <div className="text-center animate-fadeIn">
              <p className="text-sm" style={{ color: accentColor }}>
                Try: ephemeral, resilient, sublime, ubiquitous
              </p>
            </div>
          )}

        </div>
      </main>
      
      {/* Fallback Global Styles for Input Placeholder which Tailwind cannot style inline easily with dynamic colors */}
      <style>{`
        input::placeholder {
          color: #A8A29D;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
};

export default EnglishLearningTool;