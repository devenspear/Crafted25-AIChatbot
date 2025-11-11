#!/usr/bin/env node

/**
 * Data Transformation Script
 * Combines CRAFTED event data with Alys Beach venue data
 */

const fs = require('fs');
const path = require('path');

// Load source data files
const craftedData = require('../lib/crafted_data.json');
const alysBeachData = require('../lib/alysbeach_data.json');

console.log('🔄 Starting data transformation...\n');

// Category mapping for better organization
const categoryMapping = {
  // Alys Beach categories
  'home': 'venue-overview',
  'real-estate': 'venue-accommodations',
  'about': 'venue-amenities',
  'merchants': 'venue-dining',
  'news': 'venue-info',
  'weddings': 'venue-events',
  'careers': 'venue-info',
  'legal': 'venue-policies',
  'directory': 'venue-info',
  'beachcam': 'venue-amenities',
  'journals': 'venue-info',
  'photography': 'venue-policies',
  'film': 'venue-info',
};

// Transform CRAFTED event pages
const transformCraftedPages = () => {
  console.log('📅 Transforming CRAFTED event data...');

  const pages = craftedData.pages.map(page => {
    // Determine category from content
    let category = 'event-general';
    const content = (page.content || '').toLowerCase();
    const title = (page.title || '').toLowerCase();

    if (content.includes('workshop') || title.includes('workshop')) {
      category = 'event-workshops';
    } else if (content.includes('schedule') || content.includes('november')) {
      category = 'event-schedule';
    } else if (content.includes('ticket') || content.includes('register')) {
      category = 'event-tickets';
    } else if (content.includes('speaker') || content.includes('chef') || content.includes('maker')) {
      category = 'event-speakers';
    } else if (content.includes('firkin') || content.includes('soirée') || content.includes('soiree')) {
      category = 'event-signature';
    }

    // Extract keywords for better search
    const keywords = extractKeywords(page);

    return {
      source: 'event',
      category,
      url: page.url,
      title: page.title,
      content: page.content,
      keywords,
      meta_description: page.meta_description || ''
    };
  });

  console.log(`✅ Transformed ${pages.length} CRAFTED pages\n`);
  return pages;
};

// Transform Alys Beach venue pages
const transformAlysBeachPages = () => {
  console.log('🏖️  Transforming Alys Beach venue data...');

  const pages = alysBeachData.map(page => {
    // Map original category to new unified category
    const category = categoryMapping[page.category] || 'venue-general';

    // Extract keywords for better search
    const keywords = extractKeywords(page);

    return {
      source: 'venue',
      category,
      url: page.url,
      title: page.title,
      content: page.content,
      keywords,
      meta_description: ''
    };
  });

  console.log(`✅ Transformed ${pages.length} Alys Beach pages\n`);
  return pages;
};

// Extract keywords from page content
const extractKeywords = (page) => {
  const keywords = new Set();
  const text = `${page.title} ${page.content}`.toLowerCase();

  // Event keywords
  const eventKeywords = [
    'firkin', 'fête', 'soirée', 'soiree', 'pickleball', 'picklebacks',
    'workshop', 'maker', 'market', 'schedule', 'ticket', 'register',
    'speaker', 'chef', 'distiller', 'artisan', 'craftspeople',
    'november', 'saturday', 'sunday', 'friday', 'thursday', 'wednesday'
  ];

  // Venue keywords
  const venueKeywords = [
    'beach', 'pool', 'caliza', 'zuma', 'wellness', 'racquet', 'tennis',
    'restaurant', 'dining', 'food', 'bar', 'merchant', 'shop',
    "george's", 'o-ku', 'citizen', 'fonville', 'neat',
    'architecture', 'design', 'courtyard', 'villa',
    'real estate', 'rental', 'vacation', 'homeowner'
  ];

  [...eventKeywords, ...venueKeywords].forEach(keyword => {
    if (text.includes(keyword)) {
      keywords.add(keyword);
    }
  });

  return Array.from(keywords);
};

// Main transformation function
const generateCombinedData = () => {
  console.log('='.repeat(50));
  console.log('CRAFTED + Alys Beach Data Integration');
  console.log('='.repeat(50));
  console.log('');

  // Transform both datasets
  const craftedPages = transformCraftedPages();
  const alysBeachPages = transformAlysBeachPages();

  // Combine into unified structure
  const combinedData = {
    metadata: {
      generated: new Date().toISOString(),
      event_name: 'CRAFTED 2025',
      event_dates: 'November 12-16, 2025',
      event_location: 'Alys Beach, Florida',
      sources: {
        event: craftedPages.length,
        venue: alysBeachPages.length,
        total: craftedPages.length + alysBeachPages.length
      },
      categories: {
        event: [
          'event-general',
          'event-schedule',
          'event-workshops',
          'event-tickets',
          'event-speakers',
          'event-signature'
        ],
        venue: [
          'venue-overview',
          'venue-amenities',
          'venue-dining',
          'venue-accommodations',
          'venue-policies',
          'venue-info'
        ]
      }
    },
    pages: [
      ...craftedPages,
      ...alysBeachPages
    ]
  };

  // Write to file
  const outputPath = path.join(__dirname, '../lib/combined_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(combinedData, null, 2));

  console.log('📊 Combined Data Statistics:');
  console.log(`   Event pages: ${craftedPages.length}`);
  console.log(`   Venue pages: ${alysBeachPages.length}`);
  console.log(`   Total pages: ${combinedData.pages.length}`);
  console.log('');

  // Calculate file sizes
  const craftedSize = (JSON.stringify(craftedData).length / 1024).toFixed(2);
  const alysBeachSize = (JSON.stringify(alysBeachData).length / 1024).toFixed(2);
  const combinedSize = (JSON.stringify(combinedData).length / 1024).toFixed(2);

  console.log('📦 File Sizes:');
  console.log(`   CRAFTED data: ${craftedSize} KB`);
  console.log(`   Alys Beach data: ${alysBeachSize} KB`);
  console.log(`   Combined data: ${combinedSize} KB`);
  console.log('');

  console.log(`✅ Combined data saved to: ${outputPath}`);
  console.log('');
  console.log('='.repeat(50));
  console.log('✨ Data transformation complete!');
  console.log('='.repeat(50));
};

// Run the transformation
try {
  generateCombinedData();
  process.exit(0);
} catch (error) {
  console.error('❌ Error during transformation:', error);
  process.exit(1);
}
