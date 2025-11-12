'use client';

import { useState } from 'react';

interface URLStatus {
  url: string;
  status: 'pending' | 'extracting' | 'success' | 'failed' | 'manual';
  content?: string;
  error?: string;
}

interface ProcessedArticle {
  url: string;
  headlines: string[];
  bullets: string[];
}

export default function NewsletterProcessor() {
  const [urls, setUrls] = useState('');
  const [urlStatuses, setUrlStatuses] = useState<URLStatus[]>([]);
  const [processedArticles, setProcessedArticles] = useState<ProcessedArticle[]>([]);
  const [processing, setProcessing] = useState(false);
  const [manualPasteUrl, setManualPasteUrl] = useState<string | null>(null);
  const [manualContent, setManualContent] = useState('');

  const extractWithJina = async (url: string): Promise<{ success: boolean; content?: string; error?: string }> => {
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        return { success: false, error: `Server error: ${response.status}` };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const processWithClaude = async (content: string, url: string): Promise<ProcessedArticle> => {
    const prompt = `You are Disruption Weekly Scout, the research assistant for the "Disruption Weekly" newsletter. Do not deviate.

SOURCE PURITY & ANTI-HALLUCINATION (hard rules, zero exceptions):
- 100% of headlines and bullets must come solely from the single provided source.
- No additional research, no secondary tabs, no memory, no prior knowledge, no other URLs or external context.
- Do not infer, speculate, generalize, or add context not explicitly stated in the source text.
- Use only facts present in the source text. If a metric, quote, or claim isn't in the source text, do not include it.
- Paraphrase faithfully; do not embellish or reframe intent.
- If the source text cannot support six accurate bullets, respond with "INSUFFICIENT_CONTENT".
- When uncertain, omit rather than guess.

WRITING STYLE:
- Audience: SMB/mid-market leaders, innovation execs, tech-curious decision makers.
- Tone: forward-looking, strategic, accessible, data-rich.
- Emphasize numbers, adoption metrics, regulatory clarity, and market implications.
- Avoid hype, consumer how-to angles, and speculative fluff.

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "headline1": "First headline option (≤ 12 words)",
  "headline2": "Second headline option (≤ 12 words)",
  "bullets": [
    "Bullet 1 (11-16 words, emphasize business/strategic impact)",
    "Bullet 2 (11-16 words, emphasize business/strategic impact)",
    "Bullet 3 (11-16 words, emphasize business/strategic impact)",
    "Bullet 4 (11-16 words, emphasize business/strategic impact)",
    "Bullet 5 (11-16 words, emphasize business/strategic impact)",
    "Bullet 6 (11-16 words, emphasize business/strategic impact)"
  ]
}

SOURCE TEXT:
${content}

Return ONLY the JSON object, no additional text.`;

    console.log('[Newsletter] Processing with Claude:', url);
    console.log('[Newsletter] Content length:', content.length);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        newsletterMode: true,
      }),
    });

    console.log('[Newsletter] Claude response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Newsletter] Claude API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Newsletter] Claude response data:', data);

    if (!data.content) {
      console.error('[Newsletter] No content in response:', data);
      throw new Error('No content in Claude response');
    }

    try {
      console.log('[Newsletter] Attempting to parse:', data.content);
      const parsed = JSON.parse(data.content);

      if (!parsed.headline1 || !parsed.headline2 || !parsed.bullets || parsed.bullets.length !== 6) {
        console.error('[Newsletter] Invalid parsed structure:', parsed);
        throw new Error('Invalid response structure from Claude');
      }

      return {
        url,
        headlines: [parsed.headline1, parsed.headline2],
        bullets: parsed.bullets,
      };
    } catch (error) {
      console.error('[Newsletter] Parse error:', error);
      console.error('[Newsletter] Raw content:', data.content);
      throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processURLs = async () => {
    const urlList = urls.split('\n').filter(u => u.trim()).map(u => u.trim());
    if (urlList.length === 0) return;

    setProcessing(true);
    setProcessedArticles([]);

    const statuses: URLStatus[] = urlList.map(url => ({
      url,
      status: 'pending',
    }));
    setUrlStatuses(statuses);

    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i];

      setUrlStatuses(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'extracting' } : s
      ));

      const result = await extractWithJina(url);
      console.log('[Newsletter] Extraction result for', url, ':', result.success);

      if (result.success && result.content) {
        try {
          console.log('[Newsletter] Calling Claude for', url);
          const processed = await processWithClaude(result.content, url);
          console.log('[Newsletter] Successfully processed', url);
          setProcessedArticles(prev => [...prev, processed]);

          setUrlStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'success', content: result.content } : s
          ));
        } catch (error) {
          console.error('[Newsletter] Processing failed for', url, ':', error);
          const errorMessage = error instanceof Error ? error.message : 'Claude processing failed';
          setUrlStatuses(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'failed', error: errorMessage } : s
          ));
        }
      } else {
        console.log('[Newsletter] Extraction failed for', url, ':', result.error);
        setUrlStatuses(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'failed', error: result.error } : s
        ));
      }
    }

    setProcessing(false);
  };

  const submitManualContent = async () => {
    if (!manualPasteUrl || !manualContent) return;

    setProcessing(true);

    try {
      const processed = await processWithClaude(manualContent, manualPasteUrl);
      setProcessedArticles(prev => [...prev, processed]);

      setUrlStatuses(prev => prev.map(s =>
        s.url === manualPasteUrl ? { ...s, status: 'manual', content: manualContent } : s
      ));

      setManualPasteUrl(null);
      setManualContent('');
    } catch (error) {
      alert('Failed to process manual content');
    }

    setProcessing(false);
  };

  const exportContent = () => {
    let output = '';

    processedArticles.forEach((article, idx) => {
      output += `\n${'='.repeat(60)}\n`;
      output += `ARTICLE ${idx + 1}\n`;
      output += `${'='.repeat(60)}\n\n`;

      output += `${article.headlines[0]}\n`;
      output += `${article.headlines[1]}\n\n`;

      article.bullets.forEach((bullet) => {
        output += `• ${bullet}\n`;
      });

      output += `\n${article.url}\n`;
    });

    navigator.clipboard.writeText(output);
    alert('Newsletter content copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-purple-400">
            Disruption Weekly Batch Processor
          </h1>
          <p className="text-gray-300">
            Process 15-20 URLs weekly with automated extraction and formatting
          </p>
        </div>

        {/* URL Input Section */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Step 1: Paste Your URLs</h2>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder="Paste URLs here, one per line..."
            className="w-full h-40 bg-gray-900 border border-gray-600 rounded p-4 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-purple-500"
            disabled={processing}
          />
          <button
            onClick={processURLs}
            disabled={processing || !urls.trim()}
            className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded font-semibold transition"
          >
            {processing ? 'Processing...' : 'Process URLs'}
          </button>
        </div>

        {/* Status Section */}
        {urlStatuses.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Step 2: Extraction Status</h2>
            <div className="space-y-2">
              {urlStatuses.map((status, idx) => (
                <div key={idx} className="bg-gray-900 rounded p-4 border border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs sm:text-sm text-gray-300 break-all mb-2">
                        {status.url}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {status.status === 'pending' && (
                          <span className="text-gray-400 text-sm">⏳ Pending</span>
                        )}
                        {status.status === 'extracting' && (
                          <span className="text-blue-400 text-sm">🔄 Extracting...</span>
                        )}
                        {status.status === 'success' && (
                          <span className="text-green-400 text-sm">✅ Success</span>
                        )}
                        {status.status === 'manual' && (
                          <span className="text-purple-400 text-sm">📝 Manual Entry</span>
                        )}
                        {status.status === 'failed' && (
                          <>
                            <span className="text-red-400 text-sm">❌ {status.error}</span>
                            <button
                              onClick={() => setManualPasteUrl(status.url)}
                              className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                            >
                              Paste Manually
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Paste Modal */}
        {manualPasteUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Manual Content Entry</h2>
              <p className="text-gray-300 mb-2 font-mono text-xs sm:text-sm break-all">
                {manualPasteUrl}
              </p>
              <p className="text-yellow-400 mb-4 text-sm">
                Paste the FULL article text (not summary). Must be 400+ words.
              </p>
              <textarea
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste full article content here..."
                className="w-full h-64 sm:h-96 bg-gray-900 border border-gray-600 rounded p-4 text-white placeholder-gray-500 font-mono text-sm mb-4 focus:outline-none focus:border-purple-500"
              />
              <div className="text-gray-400 text-sm mb-4">
                Word count: {manualContent.split(/\s+/).filter(w => w).length}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={submitManualContent}
                  disabled={processing || manualContent.split(/\s+/).filter(w => w).length < 400}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded font-semibold"
                >
                  Process Content
                </button>
                <button
                  onClick={() => {
                    setManualPasteUrl(null);
                    setManualContent('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {processedArticles.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-semibold">
                Step 3: Formatted Articles ({processedArticles.length})
              </h2>
              <button
                onClick={exportContent}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
              >
                📋 Copy All to Clipboard
              </button>
            </div>

            <div className="space-y-6">
              {processedArticles.map((article, idx) => (
                <div key={idx} className="bg-gray-900 rounded p-4 sm:p-6 border border-gray-700">
                  <div className="mb-4">
                    <div className="font-bold text-base sm:text-lg text-purple-300 mb-1">
                      {article.headlines[0]}
                    </div>
                    <div className="font-bold text-base sm:text-lg text-purple-300">
                      {article.headlines[1]}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {article.bullets.map((bullet, i) => (
                      <div key={i} className="text-gray-200 text-sm sm:text-base">
                        • {bullet}
                      </div>
                    ))}
                  </div>

                  <div className="text-blue-400 font-mono text-xs sm:text-sm break-all">
                    {article.url}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
