// Simple test to verify Anthropic API key
// Load from .env.local: ANTHROPIC_API_KEY=your-key-here
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment');
  console.error('Please set ANTHROPIC_API_KEY in .env.local file');
  process.exit(1);
}

console.log('Testing Anthropic API...');
console.log('API Key:', apiKey.substring(0, 20) + '...');

fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Say hello in one word' }
    ]
  })
})
.then(async response => {
  console.log('\nResponse status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const text = await response.text();
  console.log('\nResponse body:', text);

  if (!response.ok) {
    console.error('\n❌ API ERROR');
    try {
      const json = JSON.parse(text);
      console.error('Error type:', json.error?.type);
      console.error('Error message:', json.error?.message);
    } catch (e) {
      console.error('Could not parse error:', text);
    }
  } else {
    console.log('\n✅ API KEY WORKS!');
  }
})
.catch(error => {
  console.error('\n❌ FETCH ERROR:', error.message);
});
