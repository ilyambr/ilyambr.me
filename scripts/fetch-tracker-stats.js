#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

function ensureUsername(rawUsername) {
  const username = (rawUsername || '').trim();
  if (!username) {
    throw new Error('TRACKER_USERNAME is required. Set it to the RIOT username, e.g. "ilyambr#ttb".');
  }
  return username;
}

function buildTrackerUrl(username) {
  return `https://api.tracker.gg/api/v2/valorant/standard/profile/riot/${encodeURIComponent(username)}`;
}

function buildPublicProfileUrl(username) {
  return `https://tracker.gg/valorant/profile/riot/${encodeURIComponent(username)}?`;
}

function sanitizeStat(stat = {}) {
  if (!stat || typeof stat !== 'object') return null;
  return {
    displayName: stat.displayName || null,
    displayCategory: stat.displayCategory || null,
    category: stat.category || null,
    metadata: stat.metadata || {},
    value: typeof stat.value === 'number' ? stat.value : null,
    displayValue: stat.displayValue || null,
    displayType: stat.displayType || null,
    percentile: typeof stat.percentile === 'number' ? stat.percentile : null
  };
}

function extractStats(apiPayload) {
  if (!apiPayload || typeof apiPayload !== 'object') {
    throw new Error('Tracker payload missing or malformed.');
  }
  const segments = apiPayload?.data?.segments;
  if (!Array.isArray(segments) || !segments.length) {
    throw new Error('Tracker payload does not contain any segments.');
  }
  const overview = segments.find(segment => segment.type === 'overview' || segment.type === 'lifetime') || segments[0];
  const stats = overview?.stats || {};
  return {
    timePlayed: sanitizeStat(stats.timePlayed),
    kDRatio: sanitizeStat(stats.kDRatio || stats.kdRatio)
  };
}

async function writeOutputFile(outputDir, filename, data) {
  await fs.mkdir(outputDir, { recursive: true });
  const dest = path.join(outputDir, filename);
  await fs.writeFile(dest, JSON.stringify(data, null, 2));
  return dest;
}

async function main() {
  const username = ensureUsername(process.env.TRACKER_USERNAME);
  const response = await fetch(buildTrackerUrl(username), {
    headers: {
      'accept': 'application/json',
      'user-agent': 'tracker-cache-script/1.0 (+https://ilyambr.me)'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tracker request failed (${response.status} ${response.statusText}): ${body}`);
  }

  const payload = await response.json();
  const stats = extractStats(payload);
  const now = new Date().toISOString();
  const output = {
    username,
    profileUrl: buildPublicProfileUrl(username),
    updatedAt: now,
    source: {
      endpoint: buildTrackerUrl(username)
    },
    stats
  };

  const slug = username.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'profile';
  const filePath = await writeOutputFile(path.join(process.cwd(), 'data'), `${slug}-tracker.json`, output);
  console.log(`✅ Tracker stats cached to ${filePath}`);
}

main().catch(error => {
  console.error('❌ Failed to fetch tracker stats');
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
