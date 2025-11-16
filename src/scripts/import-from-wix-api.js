#!/usr/bin/env node
/**
 * Import Russell Concept House Wix blog posts into Sanity.
 *
 * Usage:
 *   node src/scripts/import-from-wix-api.js          # import everything
 *   node src/scripts/import-from-wix-api.js --slug lighting-by-olivia-bossy
 */
require('dotenv').config();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@sanity/client');

const REQUIRED_ENV = [
  'WIX_API_KEY',
  'WIX_ACCOUNT_ID',
  'WIX_SITE_ID',
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_TOKEN'
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Please update your .env file and re-run the script.');
  process.exit(1);
}

const SITE_ORIGIN = process.env.WIX_SITE_ORIGIN || 'https://www.russellconcept.com';
const POSTS_ENDPOINT = 'https://www.wixapis.com/blog/v3/posts';
const DEFAULT_CATEGORY = process.env.DEFAULT_CATEGORY || 'design';
const DEFAULT_AUTHOR = process.env.DEFAULT_AUTHOR || 'Russell Concept House';

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .map((arg) => arg.replace(/^--/, ''))
    .map((arg) => {
      const [key, value = true] = arg.split('=');
      return [key, value];
    })
);

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const wixHeaders = {
  Authorization: process.env.WIX_API_KEY,
  'wix-account-id': process.env.WIX_ACCOUNT_ID,
  'wix-site-id': process.env.WIX_SITE_ID,
  'Content-Type': 'application/json'
};

const fetchJson = async (url) => {
  const res = await fetch(url, { headers: wixHeaders });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wix API error ${res.status} for ${url}: ${text}`);
  }
  return res.json();
};

async function fetchAllPostsFromApi() {
  const posts = [];
  let cursor = null;
  do {
    const url = new URL(POSTS_ENDPOINT);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const data = await fetchJson(url.toString());
    posts.push(...(data.posts || []));
    cursor = data.pagingMetadata?.nextCursor;
  } while (cursor);
  return posts;
}

function loadManifest() {
  const manifestPath = path.join(process.cwd(), 'src/data/wix-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const entries = JSON.parse(raw);
  return entries.map((item, idx) => ({
    title: item.title || item.slug,
    slug: item.slug || (item.link ? item.link.split('/').pop() : null),
    link: item.link,
    publishedAt: item.publishedAt || null,
    heroImage: item.heroImage || null,
    mediaType: item.mediaType,
    _order: idx
  })).filter((e) => e.slug);
}

async function fetchPostHtml(slug) {
  const url = `${SITE_ORIGIN.replace(/\/$/, '')}/post/${slug}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36' }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.text();
}

function toAbsoluteUrl(src) {
  if (!src) return null;
  if (src.startsWith('http')) return src;
  return `${SITE_ORIGIN.replace(/\/$/, '')}${src.startsWith('/') ? '' : '/'}${src}`;
}

function buildPortableText(paragraphs = [], slug = '') {
  return paragraphs.map((text, idx) => ({
    _type: 'block',
    _key: `${slug}-p-${idx}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', marks: [], text }]
  }));
}

function extractArticleFromHtml(html, fallback = {}) {
  const $ = cheerio.load(html);
  const title = $('h1').first().text().trim() || $('meta[property="og:title"]').attr('content') || fallback.title;
  const published = $('time').first().attr('datetime') || $('meta[property="article:published_time"]').attr('content') || fallback.publishedAt;
  const heroFromMeta = $('meta[property="og:image"]').attr('content');
  const iframe = $('iframe[src*="youtube.com"]').first();
  let videoUrl = null;
  if (iframe && iframe.attr('src')) {
    const embed = iframe.attr('src');
    const match = embed.match(/embed\/([^?&]+)/);
    videoUrl = match ? `https://www.youtube.com/watch?v=${match[1]}` : embed;
  }

  const paragraphs = [];
  $('article p').each((_, p) => {
    const text = $(p).text().replace(/\s+/g, ' ').trim();
    if (text) paragraphs.push(text);
  });
  if (!paragraphs.length) {
    const fallbackText = $('article').text().replace(/\s+/g, ' ').trim();
    if (fallbackText) paragraphs.push(fallbackText);
  }
  const blocks = buildPortableText(paragraphs, fallback.slug || fallback.title || 'article');

  const images = [];
  $('article img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src');
    if (!src || src.startsWith('data:')) return;
    const absolute = toAbsoluteUrl(src);
    if (!absolute) return;
    images.push({ src: absolute, alt: $(img).attr('alt') || title });
  });

  const heroImage = heroFromMeta ? { src: toAbsoluteUrl(heroFromMeta), alt: title } : images[0] || null;
  const filteredImages = images.filter((img) => heroImage ? img.src !== heroImage.src : true);

  return {
    title,
    publishedAt: published ? new Date(published).toISOString() : null,
    bodyBlocks: blocks,
    images: filteredImages,
    heroImage,
    videoUrl
  };
}

function getExtensionFromUrl(url) {
  try {
    const { pathname } = new URL(url);
    const ext = path.extname(pathname);
    return ext || '.jpg';
  } catch (error) {
    return '.jpg';
  }
}

async function extractArticleWithBrowser(slug, browser) {
  const page = await browser.newPage();
  const url = `${SITE_ORIGIN.replace(/\/$/, '')}/post/${slug}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const data = await page.evaluate(() => {
    const getText = (selector) => document.querySelector(selector)?.textContent?.trim() || null;
    const title =
      getText('[data-hook="post-title"]') ||
      getText('h1') ||
      document.title;
    const published =
      document.querySelector('[data-hook="post-publish-date"] time')?.getAttribute('datetime') ||
      document.querySelector('time')?.getAttribute('datetime') ||
      null;
    const articleRoot =
      document.querySelector('[data-hook="post-description"]') ||
      document.querySelector('article');
    const paragraphs = [];
    articleRoot?.querySelectorAll('p').forEach((p) => {
      const text = p.innerText?.trim();
      if (text) paragraphs.push(text);
    });
    const heroCandidates = [
      document.querySelector('[data-hook="cover-image"] img'),
      document.querySelector('[data-hook="post-cover"] img'),
      document.querySelector('[data-hook="post-media-cover"] img'),
      document.querySelector('article img')
    ];
    const heroSrc =
      heroCandidates.map((img) => img && (img.currentSrc || img.src)).find(Boolean) ||
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      null;
    const images = [];
    articleRoot?.querySelectorAll('img').forEach((img) => {
      const src = img.currentSrc || img.src;
      if (!src) return;
      images.push({ src, alt: img.alt || title });
    });
    const iframe = document.querySelector('iframe[src*="youtube.com"]');
    let videoUrl = null;
    if (iframe) {
      const match = iframe.src.match(/embed\/([^?&]+)/);
      videoUrl = match ? `https://www.youtube.com/watch?v=${match[1]}` : iframe.src;
    }
    return {
      title,
      publishedAt: published,
      heroImage: heroSrc ? { src: heroSrc, alt: title } : null,
      images,
      bodyBlocks: paragraphs,
      videoUrl,
      excerpt: paragraphs[0] || null
    };
  });
  await page.close();
  if (data.bodyBlocks && data.bodyBlocks.length) {
    data.bodyBlocks = buildPortableText(data.bodyBlocks, slug);
  } else {
    data.bodyBlocks = [];
  }
  if (data.images) {
    data.images = data.images.map((img) => ({
      ...img,
      src: img.src?.includes('http') ? img.src : null
    })).filter((img) => !!img.src);
  }
  return data;
}

async function uploadImageFromUrl(url, slug, index) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.buffer();
    const filename = `${slug}-${index}${getExtensionFromUrl(url)}`;
    const asset = await sanity.assets.upload('image', buffer, { filename });
    return {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id }
    };
  } catch (error) {
    console.warn(`      ⚠️  Failed to upload image ${url}: ${error.message}`);
    return null;
  }
}

async function getExistingDocId(slug) {
  const existing = await sanity.fetch('*[_type == "article" && slug.current == $slug][0]{_id}', { slug });
  return existing?._id;
}

async function getArticleData(post, browser) {
  if (browser) {
    return extractArticleWithBrowser(post.slug, browser);
  }
  try {
    const html = await fetchPostHtml(post.slug);
    const data = extractArticleFromHtml(html, {
      title: post.title,
      publishedAt: post.firstPublishedDate,
      slug: post.slug
    });
    if (data.bodyBlocks.length) {
      return data;
    }
  } catch (error) {
    console.warn(`   ⚠️  Static fetch failed for ${post.slug}: ${error.message}`);
  }
  console.log('   ↪️  Falling back to headless browser for', post.slug);
  const tempBrowser = browser || await puppeteer.launch({ headless: 'new' });
  const data = await extractArticleWithBrowser(post.slug, tempBrowser);
  if (!browser) await tempBrowser.close();
  return data;
}

async function syncPost(post, options = {}) {
  const articleData = await getArticleData(post, options.browser);

  if (!articleData.bodyBlocks.length) {
    console.warn(`   ⚠️  No body content for ${post.slug}, skipping.`);
    return;
  }

  const injectedHero = post.heroImage ? toAbsoluteUrl(post.heroImage) : null;
  const heroSrc = injectedHero || (articleData.heroImage?.src ? toAbsoluteUrl(articleData.heroImage.src) : null);
  const heroImage = heroSrc ? await uploadImageFromUrl(heroSrc, post.slug, 0) : null;

  const gallery = [];
  (articleData.images || []).forEach((image, idx) => {
    const absolute = toAbsoluteUrl(image.src);
    if (!absolute || (heroSrc && absolute === heroSrc)) return;
    gallery.push({ src: absolute, alt: image.alt || articleData.title, index: idx });
  });

  const uploadedGallery = [];
  for (const [index, img] of gallery.entries()) {
    const uploaded = await uploadImageFromUrl(img.src, post.slug, index + 1);
    if (uploaded) {
      uploaded._key = `${post.slug}-${index}`;
      uploadedGallery.push(uploaded);
    }
  }

  const excerptSource = articleData.excerpt || articleData.bodyBlocks[0]?.children[0]?.text || post.excerpt;
  const excerpt = excerptSource ? excerptSource.replace(/\s+/g, ' ').trim().slice(0, 160) : '';
  const publishedAt =
    options.normalizedDate ||
    articleData.publishedAt ||
    post.firstPublishedDate ||
    new Date().toISOString();
  const existingId = await getExistingDocId(post.slug);

  const doc = {
    _type: 'article',
    _id: existingId || undefined,
    title: articleData.title || post.title || post.slug,
    slug: { _type: 'slug', current: post.slug },
    category: DEFAULT_CATEGORY,
    mainImage: heroImage || undefined,
    excerpt,
    publishedAt,
    author: DEFAULT_AUTHOR,
    body: articleData.bodyBlocks,
    mediaType: (post.mediaType === 'video' || articleData.videoUrl || post.slug.startsWith('a-conversation-with')) ? 'video' : 'images',
    videoUrl: articleData.videoUrl || post.videoUrl || undefined,
    gallery: uploadedGallery,
    tags: []
  };

  if (existingId) {
    await sanity.createOrReplace(doc);
  } else {
    const { _id, ...rest } = doc;
    await sanity.create(rest);
  }
}

async function run() {
  const useHeadless = flags.headless && flags.headless !== 'false';
  const redistributeDates = flags.redistributeDates && flags.redistributeDates !== 'false';
  const headlessOptions = {};
  let browser = null;

  try {
    const manifest = loadManifest();
    const apiPosts = manifest ? [] : await fetchAllPostsFromApi();
    const grouped = manifest && manifest.length
      ? manifest
      : apiPosts.map(p => ({ ...p, publishedAt: p.firstPublishedDate, heroImage: null }));

    const slugMap = grouped.reduce((acc, post) => {
      acc[post.slug] = post;
      return acc;
    }, {});

    const targets = flags.slug
      ? [flags.slug]
      : Object.keys(slugMap);

    const queue = targets.map((slug) => {
      return slugMap[slug] || { slug };
    });

    if (!queue.length) {
      console.log('No Wix posts found.');
      return;
    }

    if (redistributeDates) {
      const start = new Date(process.env.REDATE_START || '2022-11-01T12:00:00Z');
      const end = new Date(process.env.REDATE_END || '2025-10-01T12:00:00Z');
      const sorted = [...queue].sort((a, b) => {
        const pa = new Date(a.publishedAt || a.firstPublishedDate || 0);
        const pb = new Date(b.publishedAt || b.firstPublishedDate || 0);
        return pa - pb;
      });
      const interval = sorted.length > 1 ? (end - start) / (sorted.length - 1) : 0;
      sorted.forEach((post, idx) => {
        post._normalizedPublishedAt = new Date(start.getTime() + idx * interval).toISOString();
      });
    }

    if (useHeadless) {
      browser = await puppeteer.launch({ headless: 'new' });
      headlessOptions.browser = browser;
    }

    console.log(`\n🚀 Importing ${queue.length} Wix posts into Sanity...\n`);

    for (let i = 0; i < queue.length; i++) {
      const post = queue[i];
      console.log(`(${i + 1}/${queue.length}) ${post.title || post.slug}`);
      try {
        await syncPost(post, {
          browser,
          normalizedDate: post._normalizedPublishedAt
        });
        console.log('   ✅ Imported');
      } catch (error) {
        console.error(`   ❌ Failed to import ${post.slug}:`, error.message);
      }
    }

    console.log('\n🎉 Import complete');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
