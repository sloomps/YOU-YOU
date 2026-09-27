// ══════════════════════════════════════════════════════════════
//  ⚡ ENHANCED EDITION — KEEP-ALIVE WEB SERVER + STATUS DASHBOARD
//  Works on Replit / Railway / Render / any platform.
//  Keeps the bot awake (pair with UptimeRobot pinging the URL).
// ══════════════════════════════════════════════════════════════
const BOT_NAME    = process.env.BOT_NAME || '⚡ NovaBot';
const BOT_VERSION = '3.0.0';

const express = require('express');
const http    = require('http');
const app     = express();
const PORT    = process.env.PORT || 3000;

// Live state holder (client gets attached after Discord client boots)
const LIVE = { client: null, startTime: Date.now() };

function fmtUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
        m = Math.floor(s % 3600 / 60), sec = s % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${sec}s`;
  if (m) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function botStats() {
  const c = LIVE.client;
  if (!c || !c.user) {
    return { online: false, name: BOT_NAME, version: BOT_VERSION,
             uptime: Date.now() - LIVE.startTime };
  }
  return {
    online:   true,
    name:     c.user.username,
    tag:      c.user.tag,
    id:       c.user.id,
    avatar:   c.user.displayAvatarURL({ size: 256 }),
    version:  BOT_VERSION,
    guilds:   c.guilds.cache.size,
    users:    c.guilds.cache.reduce((a, g) => a + (g.memberCount || 0), 0),
    ping:     c.ws.ping,
    uptime:   c.uptime || (Date.now() - LIVE.startTime),
    commands: c.commands ? c.commands.size : 0,
    aliases:  c.aliases ? c.aliases.size : 0,
    memory:   process.memoryUsage().heapUsed,
  };
}

const dashCSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0d1117; color:#e6edf3; font-family:'Segoe UI',Arial,sans-serif;
         min-height:100vh; display:flex; align-items:center; justify-content:center; }
  .card { background:#161b22; border:1px solid #30363d; border-radius:16px;
          padding:40px 48px; max-width:520px; width:92%; text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.5); }
  img.avatar { width:96px; height:96px; border-radius:50%; border:3px solid #5865F2; }
  h1 { font-size:26px; margin:14px 0 2px; }
  .sub { color:#8b949e; font-size:14px; margin-bottom:24px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; }
  .stat { background:#0d1117; border:1px solid #30363d; border-radius:10px; padding:14px 8px; }
  .stat b { display:block; font-size:20px; color:#58a6ff; }
  .stat span { font-size:12px; color:#8b949e; }
  .dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:6px; }
  .on  { background:#3fb950; box-shadow:0 0 8px #3fb950; }
  .off { background:#f85149; }
  footer { color:#484f58; font-size:12px; margin-top:8px; }
`;

app.get('/', (req, res) => {
  const s = botStats();
  const status = s.online
    ? '<span class="dot on"></span>Online'
    : '<span class="dot off"></span>Starting…';
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="30">
<title>${BOT_NAME} — Status</title>
<style>${dashCSS}</style>
</head>
<body>
  <div class="card">
    ${s.avatar ? `<img class="avatar" src="${s.avatar}" alt="avatar">` : ''}
    <h1>${s.name || BOT_NAME}</h1>
    <div class="sub">${status} &nbsp;•&nbsp; v${BOT_VERSION} &nbsp;•&nbsp; discord.js v14</div>
    <div class="grid">
      <div class="stat"><b>${s.guilds ?? '—'}</b><span>Servers</span></div>
      <div class="stat"><b>${s.users ? s.users.toLocaleString('en-US') : '—'}</b><span>Users</span></div>
      <div class="stat"><b>${s.ping != null ? s.ping + 'ms' : '—'}</b><span>Latency</span></div>
      <div class="stat"><b>${fmtUptime(s.uptime)}</b><span>Uptime</span></div>
      <div class="stat"><b>${s.commands ?? '—'}</b><span>Commands</span></div>
      <div class="stat"><b>${s.memory ? (s.memory / 1048576).toFixed(1) + ' MB' : '—'}</b><span>Memory</span></div>
    </div>
    <footer>${BOT_NAME} • Enhanced Edition • Auto-refresh every 30s</footer>
  </div>
</body>
</html>`);
});

app.get('/json', (req, res) => res.json(botStats()));
app.get('/ping', (req, res) => res.status(200).send('pong'));

app.listen(PORT, () =>
  console.log(`\x1b[36m[KEEP-ALIVE]\x1b[0m Dashboard running on port ${PORT}`));

// Self-ping every 4 minutes so the process never idles to sleep
setInterval(() => {
  http.get(`http://localhost:${PORT}/ping`, () => {}).on('error', () => {});
}, 240000);
// ============================================================
//  DISCORD BOT - FULL FEATURED - index.js
//  Created with discord.js v14
//  Features: Moderation, Economy, Leveling, Music, Fun,
//             Tickets, Giveaways, Auto-Mod, Polls, Reminders,
//             Mini-Games, Role Management, Logging, and more
// ============================================================
//
//  SETUP:
//  1. npm init -y
//  2. npm install discord.js @discordjs/voice @discordjs/rest
//     discord-api-types ytdl-core play-dl ffmpeg-static
//     sodium-native opusscript node-fetch canvas
//  3. Create .env file with:
//     TOKEN=your_bot_token
//     PREFIX=!
//     OWNER_ID=your_discord_id
//  4. node index.js
//
//  OPTIONAL ENV:
//     BOT_NAME=MyBot        (custom branding shown in embeds/dashboard)
//     PORT=3000             (keep-alive status dashboard port)
//
// ============================================================

'use strict';

// ── Core Node Modules ────────────────────────────────────────
const fs   = require('fs');
const path = require('path');

// ── Discord.js ───────────────────────────────────────────────
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  ActivityType,
  Colors,
  AuditLogEvent,
  InteractionType,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  UserSelectMenuBuilder,
  AttachmentBuilder,
  time,
  TimestampStyles,
  bold,
  italic,
  underline,
  strikethrough,
  spoiler,
  inlineCode,
  codeBlock,
  hyperlink,
  hideLinkEmbed,
  quote,
  blockQuote,
  roleMention,
  channelMention,
  userMention,
  heading,
  HeadingLevel,
  orderedList,
  unorderedList,
  formatEmoji,
  messageLink,
} = require('discord.js');

// ── Environment Variables ────────────────────────────────────
require('dotenv').config();

const TOKEN    = process.env.TOKEN    || 'YOUR_BOT_TOKEN_HERE';
const PREFIX   = process.env.PREFIX   || '!';
const OWNER_ID = process.env.OWNER_ID || '000000000000000000';

// ── In-Memory Databases (replace with real DB in production) ─
// These Maps act as simple in-memory stores for demonstration.
// For production, use MongoDB, SQLite, or PostgreSQL.

const db = {
  // Economy: { userId: { balance, bank, lastDaily, lastWork, inventory[] } }
  economy: new Map(),

  // Levels: { `${guildId}_${userId}`: { xp, level, messages } }
  levels: new Map(),

  // Warnings: { `${guildId}_${userId}`: [{ reason, mod, date, id }] }
  warnings: new Map(),

  // Mutes: { `${guildId}_${userId}`: { reason, mod, date, expires } }
  mutes: new Map(),

  // Guilds: { guildId: { prefix, welcome, goodbye, logs, automod, ... } }
  guilds: new Map(),

  // Tickets: { channelId: { userId, guildId, opened, closed, claimedBy, priority, category, transcript, rating, lastActivity, subject } }
  tickets: new Map(),

  // ✅ NEW: Ticket Panels: { messageId: { channelId, guildId, category, title, description, emoji, buttonLabel } }
  ticketPanels: new Map(),

  // ✅ NEW: Ticket Categories: { guildId: { categoryName: { label, emoji, description, pingRoles, parentCategory } } }
  ticketCategories: new Map(),

  // ✅ NEW: Ticket Counter: { guildId: nextNumber }
  ticketCounters: new Map(),

  // ✅ NEW: Ticket Feedback: { ticketId: { rating, comment, userId, date } }
  ticketFeedback: new Map(),

  // ✅ NEW: Ticket Blacklist: { `${guildId}_${userId}`: reason }
  ticketBlacklist: new Map(),

  // ✅ NEW: Ticket Staff Stats: { `${guildId}_${userId}`: { claimed, closed, ratingSum, ratingCount } }
  ticketStaffStats: new Map(),

  // Giveaways: { messageId: { channel, prize, host, ends, winners, entries[] } }
  giveaways: new Map(),

  // Reminders: { reminderId: { userId, channel, message, time } }
  reminders: new Map(),

  // Polls: { messageId: { question, options, votes: {}, creator, channel } }
  polls: new Map(),

  // Tags/Custom commands: { `${guildId}_${name}`: { content, author, uses } }
  tags: new Map(),

  // Starboard: { messageId: { count, boardMessageId } }
  stars: new Map(),

  // ReactionRoles: { `${guildId}_${messageId}`: [{ emoji, roleId }] }
  reactionRoles: new Map(),

  // AFK: { userId: { message, since } }
  afk: new Map(),

  // Reputation: { userId: { rep, lastGiven } }
  reputation: new Map(),

  // Marriages: { userId: marriedToId }
  marriages: new Map(),

  // Pets: { userId: { name, type, hunger, happiness, health, xp, level } }
  pets: new Map(),

  // Notes: { `${guildId}_${userId}`: [{ text, date, id }] }
  notes: new Map(),

  // Blacklist: { userId: reason }
  blacklist: new Map(),

  // CommandStats: { commandName: count }
  commandStats: new Map(),

  // GuildBans: { `${guildId}_${userId}`: { reason, mod, date } }
  guildBans: new Map(),

  // TempChannels: { channelId: { owner, guildId } }
  tempChannels: new Map(),

  // SuggestionChannels: { guildId: channelId }
  suggestionChannels: new Map(),

  // Suggestions: { messageId: { content, author, status, votes } }
  suggestions: new Map(),

  // Confessions: { guildId: channelId }
  confessChannels: new Map(),

  // Snipe: { channelId: { content, author, time, attachments } }
  snipe: new Map(),

  // EditSnipe: { channelId: { oldContent, newContent, author, time } }
  editSnipe: new Map(),

  // Autoroles: { guildId: [roleId] }
  autoroles: new Map(),

  // StickyMessages: { channelId: { content, messageId } }
  stickyMessages: new Map(),

  // Countdowns: { messageId: { target, channel, label } }
  countdowns: new Map(),

  // Statistics: { guildId: { commands, messages, joins, leaves } }
  statistics: new Map(),
};

// ── Helper: Get or create guild config ──────────────────────
function getGuildConfig(guildId) {
  if (!db.guilds.has(guildId)) {
    db.guilds.set(guildId, {
      prefix: PREFIX,
      welcomeChannel: null,
      goodbyeChannel:  null,
      logsChannel:     null,
      modLogsChannel:  null,
      ticketCategory:  null,
      ticketLogsChannel: null,
      ticketStaffRole: null,
      ticketAutoCloseHours: 48,
      starboardChannel: null,
      starboardMin:    3,
      suggestionChannel: null,
      confessChannel:  null,
      muteRole:        null,
      automod: {
        enabled:       false,
        antiSpam:      false,
        antiLinks:     false,
        antiCaps:      false,
        antiProfanity: false,
        maxMentions:   5,
        maxLines:      10,
        profanityList: [],
        whitelist:     [],
      },
      joinableRoles:  [],
      autoroles:      [],
      levelRewards:   {},
      levelMessages:  true,
      economyEnabled: true,
      musicVolume:    100,
      djRole:        null,
      statsChannels: {
        total:   null,
        members: null,
        bots:    null,
        online:  null,
      },
    });
  }
  return db.guilds.get(guildId);
}

// ── Helper: Get or create economy entry ──────────────────────
function getEconomy(userId) {
  if (!db.economy.has(userId)) {
    db.economy.set(userId, {
      balance:   0,
      bank:      0,
      lastDaily: null,
      lastWork:  null,
      lastRob:   null,
      inventory: [],
      transactions: [],
    });
  }
  return db.economy.get(userId);
}

// ── Helper: Get or create level entry ────────────────────────
function getLevelEntry(guildId, userId) {
  const key = `${guildId}_${userId}`;
  if (!db.levels.has(key)) {
    db.levels.set(key, { xp: 0, level: 0, messages: 0 });
  }
  return db.levels.get(key);
}

// ── Helper: Calculate level from XP ──────────────────────────
function calcLevel(xp) {
  // Level formula: level = floor( sqrt(xp / 100) )
  return Math.floor(Math.sqrt(xp / 100));
}

// ── Helper: Calculate XP needed for level ────────────────────
function xpForLevel(level) {
  return level * level * 100;
}

// ── Helper: Generate a random integer between min and max ─────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Helper: Format number with commas ────────────────────────
function formatNumber(n) {
  return n.toLocaleString('en-US');
}

// ── Helper: Format duration (ms → human readable) ────────────
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m ${s % 60}s`;
  if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ── Helper: Parse duration string (e.g. "1d2h3m4s") ─────────
function parseDuration(str) {
  const regex = /(\d+)\s*(d|h|m|s)/gi;
  let ms = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const val  = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'd') ms += val * 86400000;
    if (unit === 'h') ms += val * 3600000;
    if (unit === 'm') ms += val * 60000;
    if (unit === 's') ms += val * 1000;
  }
  return ms;
}

// ── Helper: Parse permission mention ────────────────────────
function hasPermission(member, perm) {
  return member.permissions.has(perm);
}

// ── Helper: Truncate string ──────────────────────────────────
function truncate(str, max = 1024) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 3) + '...' : str;
}

// ── Helper: Random choice from array ─────────────────────────
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Helper: Shuffle array ────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Helper: Paginate array ───────────────────────────────────
function paginate(arr, page = 1, perPage = 10) {
  const total   = Math.ceil(arr.length / perPage);
  const start   = (page - 1) * perPage;
  const end     = start + perPage;
  const items   = arr.slice(start, end);
  return { items, page, total, hasNext: page < total, hasPrev: page > 1 };
}

// ── Helper: Generate random ID ───────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── Helper: Safe delete message ──────────────────────────────
async function safeDelete(message, delay = 0) {
  if (delay > 0) await sleep(delay);
  try { await message.delete(); } catch (_) {}
}

// ── Helper: Sleep ─────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Helper: Colour from hex ───────────────────────────────────
function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// ── Helper: Random hex color ─────────────────────────────────
function randomColor() {
  return Math.floor(Math.random() * 0xFFFFFF);
}

// ── Helper: Check if URL ──────────────────────────────────────
function isUrl(str) {
  try { new URL(str); return true; } catch (_) { return false; }
}

// ── Helper: Ordinal number (1st, 2nd, etc.) ──────────────────
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Helper: Humanize bytes ────────────────────────────────────
function humanBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

// ── Helper: Progress bar ─────────────────────────────────────
function progressBar(current, max, length = 15) {
  const pct   = Math.min(current / max, 1);
  const filled = Math.round(pct * length);
  const empty  = length - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round(pct * 100)}%`;
}

// ── Helper: Log to console ────────────────────────────────────
function log(type, msg) {
  const ts = new Date().toISOString();
  const colors = { INFO: '\x1b[36m', WARN: '\x1b[33m', ERROR: '\x1b[31m', SUCCESS: '\x1b[32m' };
  const c = colors[type] || '\x1b[0m';
  console.log(`${c}[${ts}] [${type}]\x1b[0m ${msg}`);
}

// ── Helper: Update statistics ─────────────────────────────────
function incStat(guildId, key) {
  if (!db.statistics.has(guildId)) {
    db.statistics.set(guildId, { commands: 0, messages: 0, joins: 0, leaves: 0 });
  }
  const stats = db.statistics.get(guildId);
  stats[key] = (stats[key] || 0) + 1;
}

// ── Helper: Send log to mod-logs ──────────────────────────────
async function sendLog(guild, embed) {
  const config = getGuildConfig(guild.id);
  const channelId = config.modLogsChannel || config.logsChannel;
  if (!channelId) return;
  try {
    const ch = await guild.channels.fetch(channelId).catch(() => null);
    if (ch) await ch.send({ embeds: [embed] });
  } catch (_) {}
}

// ── Embed builders ────────────────────────────────────────────

// Consistent branding footer used across all embeds
function brandFooter() {
  const f = { text: `${BOT_NAME} • v${BOT_VERSION}` };
  if (LIVE.client?.user) f.iconURL = LIVE.client.user.displayAvatarURL();
  return f;
}

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`✅  ${title}`)
    .setDescription(description)
    .setColor(Colors.Green)
    .setFooter(brandFooter())
    .setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`❌  ${title}`)
    .setDescription(description)
    .setColor(Colors.Red)
    .setFooter(brandFooter())
    .setTimestamp();
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`ℹ️  ${title}`)
    .setDescription(description)
    .setColor(Colors.Blue)
    .setFooter(brandFooter())
    .setTimestamp();
}

function warnEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(`⚠️  ${title}`)
    .setDescription(description)
    .setColor(Colors.Yellow)
    .setFooter(brandFooter())
    .setTimestamp();
}

function modEmbed(action, target, moderator, reason, extra = {}) {
  const embed = new EmbedBuilder()
    .setTitle(`🔨 Moderation | ${action}`)
    .addFields(
      { name: 'User',        value: `${target.tag || target.user?.tag} (${target.id})`,      inline: true },
      { name: 'Moderator',   value: `${moderator.tag || moderator.user?.tag} (${moderator.id})`, inline: true },
      { name: 'Reason',      value: reason || 'No reason provided', inline: false },
    )
    .setColor(Colors.Orange)
    .setTimestamp()
    .setFooter(brandFooter())
    .setThumbnail(target.displayAvatarURL?.() || target.user?.displayAvatarURL());

  for (const [k, v] of Object.entries(extra)) {
    embed.addFields({ name: k, value: String(v), inline: true });
  }
  return embed;
}

// ──────────────────────────────────────────────────────────────
//  CLIENT SETUP
// ──────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.ThreadMember,
  ],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
});

// Raise the listener limit — this bot runs many concurrent collectors
client.setMaxListeners(60);
// Attach to keep-alive dashboard state
LIVE.client = client;

// ── Command collections ───────────────────────────────────────
client.commands     = new Collection(); // prefix commands
client.aliases      = new Collection(); // command aliases
client.slashCmds    = new Collection(); // slash commands
client.cooldowns    = new Collection(); // cooldown tracking
client.music        = new Collection(); // guild music queues

// ── Anti-spam tracking ────────────────────────────────────────
const spamTracker   = new Map(); // { userId: [timestamps] }
const antiRaidTracker = new Map(); // join timestamps

// ─────────────────────────────────────────────────────────────
//  COMMAND DEFINITIONS
//  Each command is an object with:
//   name, aliases, description, usage, category,
//   cooldown, permissions, ownerOnly, guildOnly,
//   execute(message, args, client)
// ─────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════
//  CATEGORY: MODERATION
// ══════════════════════════════════════════════════════════════

const commandKick = {
  name: 'kick',
  aliases: ['k'],
  description: 'Kick a member from the server',
  usage: '<@user> [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.kickable) return message.reply({ embeds: [errorEmbed('Cannot Kick', 'I cannot kick this member.')] });
    if (member.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Kick', 'You cannot kick yourself.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.send({ embeds: [warnEmbed('Kicked', `You have been kicked from **${message.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});
      await member.kick(reason);

      const embed = successEmbed('Member Kicked', `**${member.user.tag}** has been kicked.\n**Reason:** ${reason}`);
      message.reply({ embeds: [embed] });

      await sendLog(message.guild, modEmbed('Kick', member.user, message.member, reason));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandBan = {
  name: 'ban',
  aliases: ['b'],
  description: 'Ban a member from the server',
  usage: '<@user|id> [days] [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user or provide their ID.')] });

    let days = 0;
    let startIdx = 1;
    if (!isNaN(args[1])) { days = parseInt(args[1]); startIdx = 2; }

    const reason = args.slice(startIdx).join(' ') || 'No reason provided';
    const member = await message.guild.members.fetch(target.id).catch(() => null);

    if (member) {
      if (!member.bannable) return message.reply({ embeds: [errorEmbed('Cannot Ban', 'I cannot ban this member.')] });
      if (member.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Ban', 'You cannot ban yourself.')] });
    }

    try {
      await target.send({ embeds: [warnEmbed('Banned', `You have been banned from **${message.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});
      await message.guild.members.ban(target.id, { deleteMessageDays: Math.min(days, 7), reason });

      db.guildBans.set(`${message.guild.id}_${target.id}`, { reason, mod: message.author.id, date: new Date().toISOString() });

      const embed = successEmbed('Member Banned', `**${target.tag}** has been banned.\n**Reason:** ${reason}\n**Messages deleted:** ${days} days`);
      message.reply({ embeds: [embed] });

      await sendLog(message.guild, modEmbed('Ban', target, message.member, reason, { 'Messages Deleted': `${days} days` }));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandUnban = {
  name: 'unban',
  aliases: ['ub'],
  description: 'Unban a user from the server',
  usage: '<user_id> [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    if (!args[0]) return message.reply({ embeds: [errorEmbed('Missing Argument', 'Please provide a user ID.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      const bans = await message.guild.bans.fetch();
      const ban  = bans.find(b => b.user.id === args[0] || b.user.tag === args[0]);

      if (!ban) return message.reply({ embeds: [errorEmbed('Not Banned', 'This user is not banned from the server.')] });

      await message.guild.members.unban(ban.user.id, reason);
      db.guildBans.delete(`${message.guild.id}_${ban.user.id}`);

      const embed = successEmbed('User Unbanned', `**${ban.user.tag}** has been unbanned.\n**Reason:** ${reason}`);
      message.reply({ embeds: [embed] });

      await sendLog(message.guild, modEmbed('Unban', ban.user, message.member, reason));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandMute = {
  name: 'mute',
  aliases: ['silence', 'timeout'],
  description: 'Mute a member using Discord timeout',
  usage: '<@user> <duration> [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.moderatable) return message.reply({ embeds: [errorEmbed('Cannot Mute', 'I cannot mute this member.')] });

    const durationStr = args[1];
    if (!durationStr) return message.reply({ embeds: [errorEmbed('Missing Duration', 'Please provide a duration (e.g. 10m, 1h, 1d).')] });

    const ms = parseDuration(durationStr);
    if (ms < 5000 || ms > 2419200000) {
      return message.reply({ embeds: [errorEmbed('Invalid Duration', 'Duration must be between 5 seconds and 28 days.')] });
    }

    const reason = args.slice(2).join(' ') || 'No reason provided';

    try {
      await member.timeout(ms, reason);
      const until = new Date(Date.now() + ms);

      await member.send({ embeds: [warnEmbed('Muted', `You have been muted in **${message.guild.name}** until <t:${Math.floor(until.getTime()/1000)}:F>.\n**Reason:** ${reason}`)] }).catch(() => {});

      const embed = successEmbed('Member Muted', `**${member.user.tag}** has been muted.\n**Duration:** ${formatDuration(ms)}\n**Until:** <t:${Math.floor(until.getTime()/1000)}:F>\n**Reason:** ${reason}`);
      message.reply({ embeds: [embed] });

      await sendLog(message.guild, modEmbed('Mute', member.user, message.member, reason, {
        Duration: formatDuration(ms),
        Until: `<t:${Math.floor(until.getTime()/1000)}:F>`,
      }));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandUnmute = {
  name: 'unmute',
  aliases: ['untimeout', 'um'],
  description: 'Unmute a timed-out member',
  usage: '<@user> [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

    if (!member.isCommunicationDisabled()) {
      return message.reply({ embeds: [errorEmbed('Not Muted', 'This member is not currently muted.')] });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    try {
      await member.timeout(null, reason);
      await member.send({ embeds: [successEmbed('Unmuted', `You have been unmuted in **${message.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});

      const embed = successEmbed('Member Unmuted', `**${member.user.tag}** has been unmuted.\n**Reason:** ${reason}`);
      message.reply({ embeds: [embed] });

      await sendLog(message.guild, modEmbed('Unmute', member.user, message.member, reason));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandWarn = {
  name: 'warn',
  aliases: ['w'],
  description: 'Warn a member',
  usage: '<@user> <reason>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (member.user.bot) return message.reply({ embeds: [errorEmbed('Cannot Warn', 'You cannot warn a bot.')] });

    const reason = args.slice(1).join(' ');
    if (!reason) return message.reply({ embeds: [errorEmbed('Missing Reason', 'Please provide a reason for the warning.')] });

    const key = `${message.guild.id}_${member.id}`;
    if (!db.warnings.has(key)) db.warnings.set(key, []);
    const warnings = db.warnings.get(key);

    const warnId = genId();
    warnings.push({ id: warnId, reason, mod: message.author.id, date: new Date().toISOString() });

    await member.send({
      embeds: [warnEmbed('Warning Received', `You have been warned in **${message.guild.name}**.\n**Reason:** ${reason}\n**Warning #${warnings.length}** | ID: \`${warnId}\``)]
    }).catch(() => {});

    const embed = successEmbed('Member Warned', `**${member.user.tag}** has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warnings.length}\n**ID:** \`${warnId}\``);
    message.reply({ embeds: [embed] });

    await sendLog(message.guild, modEmbed('Warn', member.user, message.member, reason, {
      'Warning #': warnings.length,
      'Warning ID': warnId,
    }));

    // Auto-punish at warning thresholds
    if (warnings.length === 3) {
      await member.timeout(3600000, 'Auto-mute: 3 warnings').catch(() => {});
      await message.channel.send({ embeds: [warnEmbed('Auto-Mute', `${member} has been auto-muted for 1 hour (3 warnings).`)] });
    } else if (warnings.length === 5) {
      await member.kick('Auto-kick: 5 warnings').catch(() => {});
      await message.channel.send({ embeds: [warnEmbed('Auto-Kick', `${member.user.tag} has been auto-kicked (5 warnings).`)] });
    }
  },
};

const commandWarnings = {
  name: 'warnings',
  aliases: ['warns', 'infractions'],
  description: 'View warnings for a member',
  usage: '<@user>',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null)
      || message.member;

    const key = `${message.guild.id}_${member.id}`;
    const warnings = db.warnings.get(key) || [];

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warnings | ${member.user.tag}`)
      .setColor(Colors.Yellow)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    if (warnings.length === 0) {
      embed.setDescription('This member has no warnings.');
    } else {
      embed.setDescription(`Total: **${warnings.length}** warning(s)`);
      const recent = warnings.slice(-10);
      for (const w of recent) {
        const mod = await client.users.fetch(w.mod).catch(() => ({ tag: 'Unknown' }));
        embed.addFields({
          name: `#${warnings.indexOf(w) + 1} — ID: \`${w.id}\``,
          value: `**Reason:** ${w.reason}\n**By:** ${mod.tag}\n**Date:** <t:${Math.floor(new Date(w.date).getTime()/1000)}:R>`,
        });
      }
    }

    message.reply({ embeds: [embed] });
  },
};

const commandDelwarn = {
  name: 'delwarn',
  aliases: ['removewarn', 'clearwarn'],
  description: 'Remove a specific warning from a member',
  usage: '<@user> <warning_id>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

    const warnId = args[1];
    if (!warnId) return message.reply({ embeds: [errorEmbed('Missing ID', 'Please provide a warning ID.')] });

    const key = `${message.guild.id}_${member.id}`;
    const warnings = db.warnings.get(key) || [];

    const idx = warnings.findIndex(w => w.id === warnId);
    if (idx === -1) return message.reply({ embeds: [errorEmbed('Not Found', `No warning found with ID \`${warnId}\`.`)] });

    warnings.splice(idx, 1);

    message.reply({ embeds: [successEmbed('Warning Removed', `Warning \`${warnId}\` has been removed from **${member.user.tag}**.\n**Remaining warnings:** ${warnings.length}`)] });
  },
};

const commandClearwarns = {
  name: 'clearwarns',
  aliases: ['clearwarnings', 'resetwarns'],
  description: 'Clear all warnings for a member',
  usage: '<@user>',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

    const key = `${message.guild.id}_${member.id}`;
    const count = (db.warnings.get(key) || []).length;
    db.warnings.set(key, []);

    message.reply({ embeds: [successEmbed('Warnings Cleared', `All **${count}** warning(s) for **${member.user.tag}** have been cleared.`)] });
  },
};

const commandPurge = {
  name: 'purge',
  aliases: ['clear', 'prune', 'delete'],
  description: 'Delete multiple messages at once',
  usage: '<amount> [filter: @user|bots|links|images|embeds]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a number between 1 and 100.')] });
    }

    await message.delete().catch(() => {});
    let messages = await message.channel.messages.fetch({ limit: amount });

    // Filter messages older than 14 days
    const twoWeeks = Date.now() - 1209600000;
    messages = messages.filter(m => m.createdTimestamp > twoWeeks);

    // Apply sub-filters
    const filter = args[1]?.toLowerCase();
    if (filter) {
      if (filter.startsWith('<@')) {
        const uid = filter.replace(/[<@!>]/g, '');
        messages = messages.filter(m => m.author.id === uid);
      } else if (filter === 'bots') {
        messages = messages.filter(m => m.author.bot);
      } else if (filter === 'humans') {
        messages = messages.filter(m => !m.author.bot);
      } else if (filter === 'links') {
        messages = messages.filter(m => /https?:\/\//.test(m.content));
      } else if (filter === 'images') {
        messages = messages.filter(m => m.attachments.some(a => a.contentType?.startsWith('image/')));
      } else if (filter === 'embeds') {
        messages = messages.filter(m => m.embeds.length > 0);
      } else if (filter === 'mentions') {
        messages = messages.filter(m => m.mentions.users.size > 0);
      }
    }

    if (messages.size === 0) {
      return message.channel.send({ embeds: [infoEmbed('No Messages', 'No messages matched the filter or all messages are older than 14 days.')] }).then(m => safeDelete(m, 5000));
    }

    const deleted = await message.channel.bulkDelete(messages, true).catch(err => {
      message.channel.send({ embeds: [errorEmbed('Error', err.message)] });
      return null;
    });

    if (!deleted) return;

    const reply = await message.channel.send({
      embeds: [successEmbed('Messages Purged', `Successfully deleted **${deleted.size}** message(s).`)]
    });
    safeDelete(reply, 5000);

    await sendLog(message.guild, new EmbedBuilder()
      .setTitle('🗑️ Messages Purged')
      .addFields(
        { name: 'Channel',    value: `${message.channel}`,       inline: true },
        { name: 'Moderator',  value: `${message.author.tag}`,    inline: true },
        { name: 'Count',      value: `${deleted.size}`,          inline: true },
        { name: 'Filter',     value: filter || 'None',           inline: true },
      )
      .setColor(Colors.Orange)
      .setTimestamp()
    );
  },
};

const commandSoftban = {
  name: 'softban',
  aliases: ['sb'],
  description: 'Ban then immediately unban a member (removes messages)',
  usage: '<@user> [reason]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.bannable) return message.reply({ embeds: [errorEmbed('Cannot Softban', 'I cannot ban this member.')] });

    const reason = args.slice(1).join(' ') || 'Softban (message cleanup)';

    try {
      await member.send({ embeds: [warnEmbed('Softbanned', `You have been softbanned from **${message.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});
      await message.guild.members.ban(member.id, { deleteMessageDays: 7, reason });
      await message.guild.members.unban(member.id, 'Softban unban');

      message.reply({ embeds: [successEmbed('Softban Applied', `**${member.user.tag}** was softbanned (banned then unbanned, 7 days of messages removed).\n**Reason:** ${reason}`)] });
      await sendLog(message.guild, modEmbed('Softban', member.user, message.member, reason));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandLock = {
  name: 'lock',
  aliases: ['lockdown'],
  description: 'Lock a channel (prevent @everyone from sending messages)',
  usage: '[#channel] [reason]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const reason   = args.slice(message.mentions.channels.size ? 1 : 0).join(' ') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      }, { reason });

      message.reply({ embeds: [successEmbed('Channel Locked', `${channel} has been locked.\n**Reason:** ${reason}`)] });
      await channel.send({ embeds: [warnEmbed('🔒 Channel Locked', `This channel has been locked by a moderator.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandUnlock = {
  name: 'unlock',
  aliases: ['unlockdown'],
  description: 'Unlock a channel',
  usage: '[#channel] [reason]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const reason   = args.slice(message.mentions.channels.size ? 1 : 0).join(' ') || 'No reason provided';

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null,
      }, { reason });

      message.reply({ embeds: [successEmbed('Channel Unlocked', `${channel} has been unlocked.\n**Reason:** ${reason}`)] });
      await channel.send({ embeds: [successEmbed('🔓 Channel Unlocked', `This channel has been unlocked.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandSlowmode = {
  name: 'slowmode',
  aliases: ['slow', 'sm'],
  description: 'Set slowmode for a channel',
  usage: '<seconds|off> [#channel]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    let seconds = 0;
    if (args[0]?.toLowerCase() !== 'off') {
      seconds = parseInt(args[0]);
      if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return message.reply({ embeds: [errorEmbed('Invalid Value', 'Slowmode must be between 0 and 21600 seconds.')] });
      }
    }

    try {
      await channel.setRateLimitPerUser(seconds, `Slowmode set by ${message.author.tag}`);
      const desc = seconds === 0
        ? `Slowmode has been **disabled** in ${channel}.`
        : `Slowmode set to **${seconds}s** in ${channel}.`;
      message.reply({ embeds: [successEmbed('Slowmode Updated', desc)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandNick = {
  name: 'nick',
  aliases: ['nickname', 'setnick'],
  description: 'Change a member\'s nickname',
  usage: '<@user> [new_nickname]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageNicknames],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.manageable) return message.reply({ embeds: [errorEmbed('Cannot Change Nick', 'I cannot change this member\'s nickname.')] });

    const nick = args.slice(1).join(' ') || null;
    const old  = member.nickname || member.user.username;

    try {
      await member.setNickname(nick, `Nickname changed by ${message.author.tag}`);
      const desc = nick
        ? `**${old}** → **${nick}**`
        : `**${old}** → *(reset to username)*`;
      message.reply({ embeds: [successEmbed('Nickname Changed', desc)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandRole = {
  name: 'role',
  aliases: ['addrole', 'removerole'],
  description: 'Add or remove a role from a member',
  usage: '<add|remove> <@user> <@role>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    if (!['add', 'remove'].includes(action)) {
      return message.reply({ embeds: [errorEmbed('Invalid Action', 'Use `add` or `remove`.')] });
    }

    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[1]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

    const role = message.mentions.roles.first()
      || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(2).join(' ').toLowerCase())
      || message.guild.roles.cache.get(args[2]);

    if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a valid role.')] });
    if (role.managed) return message.reply({ embeds: [errorEmbed('Cannot Modify', 'This role is managed by an integration.')] });
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ embeds: [errorEmbed('Cannot Modify', 'This role is higher than or equal to my highest role.')] });
    }

    try {
      if (action === 'add') {
        await member.roles.add(role, `Role added by ${message.author.tag}`);
        message.reply({ embeds: [successEmbed('Role Added', `Added ${role} to **${member.user.tag}**.`)] });
      } else {
        await member.roles.remove(role, `Role removed by ${message.author.tag}`);
        message.reply({ embeds: [successEmbed('Role Removed', `Removed ${role} from **${member.user.tag}**.`)] });
      }
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandVoicekick = {
  name: 'voicekick',
  aliases: ['vk', 'forceleave'],
  description: 'Kick a member from a voice channel',
  usage: '<@user>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.MoveMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.voice.channel) return message.reply({ embeds: [errorEmbed('Not in Voice', 'This member is not in a voice channel.')] });

    try {
      await member.voice.setChannel(null, `Voice kick by ${message.author.tag}`);
      message.reply({ embeds: [successEmbed('Voice Kicked', `**${member.user.tag}** has been kicked from their voice channel.`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandVoicemove = {
  name: 'voicemove',
  aliases: ['vm', 'vcmove'],
  description: 'Move all members from one voice channel to another',
  usage: '<#source_channel> <#target_channel>',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.MoveMembers],
  guildOnly: true,
  async execute(message, args) {
    const channels = message.mentions.channels;
    const source   = channels.first();
    const target   = channels.at(1);

    if (!source || !target) return message.reply({ embeds: [errorEmbed('Invalid Channels', 'Please mention two voice channels.')] });
    if (source.type !== ChannelType.GuildVoice || target.type !== ChannelType.GuildVoice) {
      return message.reply({ embeds: [errorEmbed('Invalid Channels', 'Both channels must be voice channels.')] });
    }

    const members = source.members;
    if (members.size === 0) return message.reply({ embeds: [infoEmbed('Empty Channel', 'The source channel has no members.')] });

    let moved = 0;
    for (const [, m] of members) {
      await m.voice.setChannel(target).catch(() => {});
      moved++;
    }

    message.reply({ embeds: [successEmbed('Members Moved', `Moved **${moved}** member(s) from ${source} to ${target}.`)] });
  },
};

const commandDeafen = {
  name: 'deafen',
  aliases: ['deaf'],
  description: 'Server-deafen a member in voice',
  usage: '<@user> [reason]',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.DeafenMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.voice.channel) return message.reply({ embeds: [errorEmbed('Not in Voice', 'This member is not in a voice channel.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const state  = !member.voice.serverDeaf;

    try {
      await member.voice.setDeaf(state, reason);
      const action = state ? 'Deafened' : 'Undeafened';
      message.reply({ embeds: [successEmbed(action, `**${member.user.tag}** has been ${action.toLowerCase()}.\n**Reason:** ${reason}`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandHideChannel = {
  name: 'hidechannel',
  aliases: ['hide', 'hc'],
  description: 'Hide a channel from @everyone',
  usage: '[#channel]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: false });
      message.reply({ embeds: [successEmbed('Channel Hidden', `${channel} has been hidden from @everyone.`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandShowChannel = {
  name: 'showchannel',
  aliases: ['show', 'unhide', 'sc'],
  description: 'Make a hidden channel visible to @everyone',
  usage: '[#channel]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    try {
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, { ViewChannel: null });
      message.reply({ embeds: [successEmbed('Channel Visible', `${channel} is now visible to @everyone.`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandBanlist = {
  name: 'banlist',
  aliases: ['bans'],
  description: 'View the server ban list',
  usage: '[page]',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    const page = parseInt(args[0]) || 1;
    const bans  = await message.guild.bans.fetch();

    if (bans.size === 0) return message.reply({ embeds: [infoEmbed('No Bans', 'This server has no bans.')] });

    const { items, total } = paginate([...bans.values()], page, 10);

    const embed = new EmbedBuilder()
      .setTitle(`🔨 Ban List — ${message.guild.name}`)
      .setDescription(items.map((b, i) => `${(page-1)*10+i+1}. **${b.user.tag}** (\`${b.user.id}\`) — ${b.reason || 'No reason'}`).join('\n'))
      .setFooter({ text: `Page ${page}/${total} | Total: ${bans.size} bans` })
      .setColor(Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandMassban = {
  name: 'massban',
  aliases: ['mb'],
  description: 'Ban multiple users at once (IDs)',
  usage: '<id1> <id2> ... [reason]',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  ownerOnly: false,
  async execute(message, args) {
    if (args.length === 0) return message.reply({ embeds: [errorEmbed('Missing IDs', 'Please provide user IDs to ban.')] });

    const ids    = args.filter(a => /^\d{17,20}$/.test(a));
    const reason = args.filter(a => !/^\d{17,20}$/.test(a)).join(' ') || 'Mass ban';

    if (ids.length === 0) return message.reply({ embeds: [errorEmbed('No Valid IDs', 'No valid user IDs found.')] });

    let banned = 0, failed = 0;
    for (const id of ids) {
      try {
        await message.guild.members.ban(id, { reason });
        banned++;
      } catch (_) {
        failed++;
      }
    }

    message.reply({ embeds: [successEmbed('Mass Ban Complete', `**Banned:** ${banned}\n**Failed:** ${failed}\n**Reason:** ${reason}`)] });
    await sendLog(message.guild, new EmbedBuilder()
      .setTitle('🔨 Mass Ban')
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Banned',    value: `${banned}`,        inline: true },
        { name: 'Failed',    value: `${failed}`,        inline: true },
        { name: 'Reason',    value: reason },
        { name: 'IDs',       value: ids.join(', ').slice(0, 1000) },
      )
      .setColor(Colors.Red)
      .setTimestamp()
    );
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: UTILITY
// ══════════════════════════════════════════════════════════════

const commandPing = {
  name: 'ping',
  aliases: ['latency', 'pong'],
  description: 'Check the bot\'s latency',
  usage: '',
  category: 'Utility',
  cooldown: 3,
  async execute(message) {
    const start = Date.now();
    const msg = await message.reply({ content: '🏓 Pinging...' });
    const rtt = Date.now() - start;

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '🌐 API Latency',    value: `${client.ws.ping}ms`,   inline: true },
        { name: '⏱️ Round-Trip',    value: `${rtt}ms`,               inline: true },
        { name: '📡 WebSocket',     value: client.ws.status === 0 ? '🟢 Ready' : '🔴 Not Ready', inline: true },
      )
      .setColor(client.ws.ping < 100 ? Colors.Green : client.ws.ping < 200 ? Colors.Yellow : Colors.Red)
      .setTimestamp();

    msg.edit({ content: null, embeds: [embed] });
  },
};

const commandServerinfo = {
  name: 'serverinfo',
  aliases: ['si', 'server', 'guildinfo'],
  description: 'View information about the server',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const g = message.guild;
    await g.fetch();
    const members = await g.members.fetch();

    const bots   = members.filter(m => m.user.bot).size;
    const humans = members.filter(m => !m.user.bot).size;
    const online  = members.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;

    const channels = g.channels.cache;
    const text   = channels.filter(c => c.type === ChannelType.GuildText).size;
    const voice  = channels.filter(c => c.type === ChannelType.GuildVoice).size;
    const cats   = channels.filter(c => c.type === ChannelType.GuildCategory).size;

    const features = g.features.map(f => `\`${f}\``).join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${g.name}`)
      .setThumbnail(g.iconURL({ size: 512 }))
      .setImage(g.bannerURL({ size: 1024 }))
      .addFields(
        { name: '🆔 ID',           value: g.id,                    inline: true  },
        { name: '👑 Owner',        value: `<@${g.ownerId}>`,        inline: true  },
        { name: '📅 Created',      value: `<t:${Math.floor(g.createdTimestamp/1000)}:R>`, inline: true },
        { name: '👥 Members',      value: `Total: ${g.memberCount}\nHumans: ${humans}\nBots: ${bots}\nOnline: ${online}`, inline: true },
        { name: '💬 Channels',     value: `Text: ${text}\nVoice: ${voice}\nCategories: ${cats}`, inline: true },
        { name: '🎭 Roles',        value: `${g.roles.cache.size}`, inline: true  },
        { name: '✨ Boost Level',  value: `Level ${g.premiumTier} (${g.premiumSubscriptionCount} boosts)`, inline: true },
        { name: '😀 Emojis',      value: `${g.emojis.cache.size}`, inline: true  },
        { name: '🔒 Verification', value: ['None', 'Low', 'Medium', 'High', 'Very High'][g.verificationLevel], inline: true },
        { name: '🔥 Features',     value: truncate(features, 512) },
      )
      .setColor(Colors.Blue)
      .setTimestamp()
      .setFooter({ text: `${g.memberCount} members` });

    message.reply({ embeds: [embed] });
  },
};

const commandUserinfo = {
  name: 'userinfo',
  aliases: ['ui', 'whois', 'user'],
  description: 'View information about a user',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null)
      || message.member;

    const user = member.user;
    await user.fetch();

    const key  = `${message.guild.id}_${user.id}`;
    const warns = (db.warnings.get(key) || []).length;
    const roles  = member.roles.cache.filter(r => r.id !== message.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .setImage(user.bannerURL({ size: 1024 }))
      .addFields(
        { name: '🆔 User ID',       value: user.id,              inline: true },
        { name: '🤖 Bot?',          value: user.bot ? 'Yes' : 'No', inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp/1000)}:R>`, inline: true },
        { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp/1000)}:R>`, inline: true },
        { name: '🎭 Top Role',      value: `${member.roles.highest}`, inline: true },
        { name: '⚠️ Warnings',     value: `${warns}`,             inline: true },
        { name: '🌈 Roles',        value: roles.size > 0 ? roles.map(r => `${r}`).join(' ').slice(0, 1024) : 'None' },
        { name: '💎 Boost Since',  value: member.premiumSince ? `<t:${Math.floor(member.premiumSinceTimestamp/1000)}:R>` : 'Not Boosting', inline: true },
        { name: '🏷️ Nickname',    value: member.nickname || 'None', inline: true },
      )
      .setColor(member.displayColor || Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandAvatar = {
  name: 'avatar',
  aliases: ['av', 'pfp', 'icon'],
  description: 'Get a user\'s avatar',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author;

    await user.fetch();

    const formats = ['png', 'jpg', 'webp'];
    if (user.avatar?.startsWith('a_')) formats.push('gif');

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${user.tag}'s Avatar`)
      .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
      .setDescription(formats.map(f => `[${f.toUpperCase()}](${user.displayAvatarURL({ size: 4096, format: f })})`).join(' | '))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandBanner = {
  name: 'banner',
  aliases: ['userbanner'],
  description: 'Get a user\'s profile banner',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author;

    await user.fetch();

    if (!user.banner) {
      return message.reply({ embeds: [infoEmbed('No Banner', `**${user.tag}** does not have a profile banner.`)] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🖼️ ${user.tag}'s Banner`)
      .setImage(user.bannerURL({ size: 4096, dynamic: true }))
      .setColor(user.accentColor || Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandEmoji = {
  name: 'emoji',
  aliases: ['e', 'em'],
  description: 'Get information about an emoji',
  usage: '<emoji>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const input = args[0];
    if (!input) return message.reply({ embeds: [errorEmbed('Missing Emoji', 'Please provide an emoji.')] });

    const customMatch = input.match(/<?(a)?:?(\w+):(\d+)>?/);
    if (customMatch) {
      const animated = !!customMatch[1];
      const name     = customMatch[2];
      const id       = customMatch[3];
      const url      = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;

      const embed = new EmbedBuilder()
        .setTitle(`😀 Emoji: ${name}`)
        .setImage(url)
        .addFields(
          { name: 'ID',       value: id,          inline: true },
          { name: 'Name',     value: name,         inline: true },
          { name: 'Animated', value: animated ? 'Yes' : 'No', inline: true },
          { name: 'URL',      value: `[Open](${url})` },
          { name: 'Markdown', value: `\`${input}\`` },
        )
        .setColor(Colors.Blue)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    message.reply({ embeds: [infoEmbed('Unicode Emoji', `The emoji \`${input}\` is a standard Unicode emoji.`)] });
  },
};

const commandRoleinfo = {
  name: 'roleinfo',
  aliases: ['ri', 'role-info'],
  description: 'View information about a role',
  usage: '<@role>',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const role = message.mentions.roles.first()
      || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.join(' ').toLowerCase())
      || message.guild.roles.cache.get(args[0]);

    if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a valid role.')] });

    const permissions = role.permissions.toArray().map(p => `\`${p}\``).join(', ') || 'None';
    const members = message.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

    const embed = new EmbedBuilder()
      .setTitle(`🎭 Role: ${role.name}`)
      .addFields(
        { name: '🆔 ID',          value: role.id,              inline: true },
        { name: '🎨 Color',       value: role.hexColor,        inline: true },
        { name: '📍 Position',    value: `${role.position}`,   inline: true },
        { name: '👥 Members',     value: `${members}`,         inline: true },
        { name: '📌 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: '📌 Hoisted',     value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: '🤖 Managed',     value: role.managed ? 'Yes' : 'No', inline: true },
        { name: '📅 Created',     value: `<t:${Math.floor(role.createdTimestamp/1000)}:R>`, inline: true },
        { name: '🔑 Permissions', value: truncate(permissions, 1024) },
      )
      .setColor(role.color || Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandChannelinfo = {
  name: 'channelinfo',
  aliases: ['ci', 'channel-info'],
  description: 'View information about a channel',
  usage: '[#channel]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first()
      || message.guild.channels.cache.get(args[0])
      || message.channel;

    const typeMap = {
      [ChannelType.GuildText]:     'Text Channel',
      [ChannelType.GuildVoice]:    'Voice Channel',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildNews]:     'Announcement Channel',
      [ChannelType.GuildStageVoice]: 'Stage Channel',
      [ChannelType.GuildForum]:    'Forum Channel',
      [ChannelType.GuildThread]:   'Thread',
      [ChannelType.PublicThread]:  'Public Thread',
      [ChannelType.PrivateThread]: 'Private Thread',
    };

    const embed = new EmbedBuilder()
      .setTitle(`💬 Channel: #${channel.name}`)
      .addFields(
        { name: '🆔 ID',        value: channel.id,                        inline: true },
        { name: '📂 Type',      value: typeMap[channel.type] || 'Unknown', inline: true },
        { name: '📅 Created',   value: `<t:${Math.floor(channel.createdTimestamp/1000)}:R>`, inline: true },
        { name: '📁 Category',  value: channel.parent?.name || 'None',    inline: true },
        { name: '🐢 Slowmode',  value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser}s` : 'Off', inline: true },
        { name: '📌 NSFW',     value: channel.nsfw ? 'Yes' : 'No',        inline: true },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    if (channel.topic) embed.addFields({ name: '📝 Topic', value: channel.topic });
    if (channel.bitrate) embed.addFields({ name: '🎙️ Bitrate', value: `${channel.bitrate / 1000}kbps`, inline: true });
    if (channel.userLimit) embed.addFields({ name: '👥 User Limit', value: `${channel.userLimit}`, inline: true });

    message.reply({ embeds: [embed] });
  },
};

const commandInvite = {
  name: 'invite',
  aliases: ['inv', 'addbot'],
  description: 'Get the bot\'s invite link',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  async execute(message) {
    const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

    const embed = new EmbedBuilder()
      .setTitle('🔗 Invite Me!')
      .setDescription(`[Click here to invite me to your server](${link})`)
      .setColor(Colors.Blue)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(link)
        .setEmoji('🔗'),
    );

    message.reply({ embeds: [embed], components: [row] });
  },
};

const commandSnipe = {
  name: 'snipe',
  aliases: ['s'],
  description: 'View the last deleted message in this channel',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const snipe = db.snipe.get(message.channel.id);

    if (!snipe) {
      return message.reply({ embeds: [infoEmbed('Nothing to Snipe', 'There are no recently deleted messages in this channel.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎯 Sniped Message')
      .setDescription(snipe.content || '*[No text content]*')
      .setAuthor({ name: snipe.author, iconURL: snipe.avatar })
      .setFooter({ text: `Deleted ${formatDuration(Date.now() - snipe.time)} ago` })
      .setColor(Colors.Blue)
      .setTimestamp(snipe.time);

    if (snipe.attachments?.length > 0) {
      embed.setImage(snipe.attachments[0]);
    }

    message.reply({ embeds: [embed] });
  },
};

const commandEditsnipe = {
  name: 'editsnipe',
  aliases: ['es'],
  description: 'View the last edited message in this channel',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const snipe = db.editSnipe.get(message.channel.id);

    if (!snipe) {
      return message.reply({ embeds: [infoEmbed('Nothing to Snipe', 'There are no recently edited messages in this channel.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle('✏️ Edit Sniped Message')
      .addFields(
        { name: 'Before', value: truncate(snipe.oldContent, 512) || '*[Empty]*' },
        { name: 'After',  value: truncate(snipe.newContent, 512) || '*[Empty]*' },
      )
      .setAuthor({ name: snipe.author, iconURL: snipe.avatar })
      .setFooter({ text: `Edited ${formatDuration(Date.now() - snipe.time)} ago` })
      .setColor(Colors.Yellow)
      .setTimestamp(snipe.time);

    message.reply({ embeds: [embed] });
  },
};

const commandReminder = {
  name: 'reminder',
  aliases: ['remind', 'remindme'],
  description: 'Set a reminder',
  usage: '<duration> <message>',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const durationStr = args[0];
    const reminder    = args.slice(1).join(' ');

    if (!durationStr || !reminder) {
      return message.reply({ embeds: [errorEmbed('Missing Arguments', 'Usage: `!reminder <duration> <message>`\nExample: `!reminder 30m Take a break!`')] });
    }

    const ms = parseDuration(durationStr);
    if (ms < 60000) return message.reply({ embeds: [errorEmbed('Too Short', 'Reminder must be at least 1 minute.')] });
    if (ms > 2592000000) return message.reply({ embeds: [errorEmbed('Too Long', 'Reminder cannot be longer than 30 days.')] });

    const id   = genId();
    const fire = Date.now() + ms;

    db.reminders.set(id, {
      userId:    message.author.id,
      channelId: message.channel.id,
      message:   reminder,
      time:      fire,
      created:   Date.now(),
    });

    message.reply({ embeds: [successEmbed('Reminder Set', `I'll remind you in **${formatDuration(ms)}**!\n**Message:** ${reminder}\n**At:** <t:${Math.floor(fire/1000)}:F>\n**ID:** \`${id}\``)] });

    setTimeout(async () => {
      const rem = db.reminders.get(id);
      if (!rem) return;

      db.reminders.delete(id);
      const channel = await client.channels.fetch(rem.channelId).catch(() => null);
      if (channel) {
        await channel.send({
          content: `<@${rem.userId}>`,
          embeds: [new EmbedBuilder()
            .setTitle('⏰ Reminder!')
            .setDescription(rem.message)
            .setFooter({ text: `Set ${formatDuration(Date.now() - rem.created)} ago | ID: ${id}` })
            .setColor(Colors.Yellow)
            .setTimestamp()
          ],
        }).catch(() => {});
      }
    }, ms);
  },
};

const commandReminders = {
  name: 'reminders',
  aliases: ['myreminders', 'rlist'],
  description: 'View your active reminders',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  async execute(message) {
    const myReminders = [...db.reminders.entries()]
      .filter(([, r]) => r.userId === message.author.id);

    if (myReminders.length === 0) {
      return message.reply({ embeds: [infoEmbed('No Reminders', 'You have no active reminders.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle('⏰ Your Reminders')
      .setColor(Colors.Yellow)
      .setTimestamp();

    for (const [id, r] of myReminders.slice(0, 10)) {
      embed.addFields({
        name: `ID: \`${id}\``,
        value: `${r.message}\n**Fires:** <t:${Math.floor(r.time/1000)}:R>`,
      });
    }

    message.reply({ embeds: [embed] });
  },
};

const commandDelreminder = {
  name: 'delreminder',
  aliases: ['cancelreminder', 'dr'],
  description: 'Cancel a reminder',
  usage: '<reminder_id>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const id  = args[0];
    const rem = db.reminders.get(id);

    if (!rem) return message.reply({ embeds: [errorEmbed('Not Found', 'No reminder found with that ID.')] });
    if (rem.userId !== message.author.id && message.author.id !== OWNER_ID) {
      return message.reply({ embeds: [errorEmbed('Not Yours', 'This reminder does not belong to you.')] });
    }

    db.reminders.delete(id);
    message.reply({ embeds: [successEmbed('Reminder Cancelled', `Reminder \`${id}\` has been cancelled.`)] });
  },
};

const commandAFK = {
  name: 'afk',
  aliases: ['away'],
  description: 'Set or clear your AFK status',
  usage: '[message]',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const existing = db.afk.get(message.author.id);

    if (existing) {
      db.afk.delete(message.author.id);
      const gone = formatDuration(Date.now() - existing.since);
      return message.reply({ embeds: [successEmbed('AFK Cleared', `Welcome back! You were AFK for **${gone}**.`)] });
    }

    const msg = args.join(' ') || 'AFK';
    db.afk.set(message.author.id, { message: msg, since: Date.now() });

    message.reply({ embeds: [infoEmbed('AFK Set', `You are now AFK: **${msg}**`)] });
  },
};

const commandTag = {
  name: 'tag',
  aliases: ['t', 'tags'],
  description: 'Manage and use custom tags',
  usage: '<name|create|delete|list> [name] [content]',
  category: 'Utility',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'list') {
      const guildTags = [...db.tags.entries()]
        .filter(([k]) => k.startsWith(`${message.guild.id}_`))
        .map(([k, v]) => ({ name: k.replace(`${message.guild.id}_`, ''), ...v }));

      if (guildTags.length === 0) return message.reply({ embeds: [infoEmbed('No Tags', 'This server has no tags. Create one with `!tag create <name> <content>`.')] });

      const embed = new EmbedBuilder()
        .setTitle(`🏷️ Server Tags (${guildTags.length})`)
        .setDescription(guildTags.map((t, i) => `**${i+1}.** \`${t.name}\` — ${t.uses} uses`).join('\n'))
        .setColor(Colors.Blue)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === 'create') {
      const name    = args[1]?.toLowerCase();
      const content = args.slice(2).join(' ');

      if (!name || !content) return message.reply({ embeds: [errorEmbed('Missing Arguments', 'Usage: `!tag create <name> <content>`')] });

      const key = `${message.guild.id}_${name}`;
      if (db.tags.has(key)) return message.reply({ embeds: [errorEmbed('Tag Exists', `A tag named \`${name}\` already exists.`)] });
      if (name.length > 32) return message.reply({ embeds: [errorEmbed('Name Too Long', 'Tag name must be 32 characters or less.')] });

      db.tags.set(key, { content, author: message.author.id, uses: 0, created: Date.now() });
      return message.reply({ embeds: [successEmbed('Tag Created', `Tag \`${name}\` has been created.`)] });
    }

    if (sub === 'delete') {
      const name = args[1]?.toLowerCase();
      if (!name) return message.reply({ embeds: [errorEmbed('Missing Name', 'Please provide a tag name.')] });

      const key = `${message.guild.id}_${name}`;
      const tag = db.tags.get(key);

      if (!tag) return message.reply({ embeds: [errorEmbed('Not Found', `No tag named \`${name}\` exists.`)] });

      const isOwner   = tag.author === message.author.id;
      const isMod     = hasPermission(message.member, PermissionFlagsBits.ManageMessages);

      if (!isOwner && !isMod) return message.reply({ embeds: [errorEmbed('Cannot Delete', 'You can only delete your own tags.')] });

      db.tags.delete(key);
      return message.reply({ embeds: [successEmbed('Tag Deleted', `Tag \`${name}\` has been deleted.`)] });
    }

    if (sub === 'info') {
      const name = args[1]?.toLowerCase();
      if (!name) return message.reply({ embeds: [errorEmbed('Missing Name', 'Please provide a tag name.')] });

      const key = `${message.guild.id}_${name}`;
      const tag = db.tags.get(key);

      if (!tag) return message.reply({ embeds: [errorEmbed('Not Found', `No tag named \`${name}\` exists.`)] });

      const author = await client.users.fetch(tag.author).catch(() => ({ tag: 'Unknown' }));
      const embed = new EmbedBuilder()
        .setTitle(`🏷️ Tag: ${name}`)
        .addFields(
          { name: 'Author',  value: author.tag,              inline: true },
          { name: 'Uses',    value: `${tag.uses}`,           inline: true },
          { name: 'Created', value: `<t:${Math.floor(tag.created/1000)}:R>`, inline: true },
          { name: 'Content', value: truncate(tag.content, 512) },
        )
        .setColor(Colors.Blue)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Use tag
    const name = sub;
    const key  = `${message.guild.id}_${name}`;
    const tag  = db.tags.get(key);

    if (!tag) return message.reply({ embeds: [errorEmbed('Not Found', `No tag named \`${name}\` exists. Create one with \`!tag create ${name} <content>\`.`)] });

    tag.uses++;
    message.reply({ content: tag.content });
  },
};

const commandNote = {
  name: 'note',
  aliases: ['notes'],
  description: 'Add a moderator note to a user',
  usage: '<add|list|delete> <@user> [text]',
  category: 'Utility',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'add') {
      const member = message.mentions.members.first()
        || await message.guild.members.fetch(args[1]).catch(() => null);

      if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

      const text = args.slice(2).join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide note text.')] });

      const key = `${message.guild.id}_${member.id}`;
      if (!db.notes.has(key)) db.notes.set(key, []);

      const notes = db.notes.get(key);
      const id    = genId();
      notes.push({ text, date: new Date().toISOString(), id, mod: message.author.id });

      return message.reply({ embeds: [successEmbed('Note Added', `Note \`${id}\` added for **${member.user.tag}**.`)] });
    }

    if (sub === 'list') {
      const member = message.mentions.members.first()
        || await message.guild.members.fetch(args[1]).catch(() => null);

      if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

      const key   = `${message.guild.id}_${member.id}`;
      const notes = db.notes.get(key) || [];

      if (notes.length === 0) return message.reply({ embeds: [infoEmbed('No Notes', `No notes found for **${member.user.tag}**.`)] });

      const embed = new EmbedBuilder()
        .setTitle(`📝 Notes — ${member.user.tag}`)
        .setColor(Colors.Blue)
        .setTimestamp();

      for (const note of notes.slice(-10)) {
        const mod = await client.users.fetch(note.mod).catch(() => ({ tag: 'Unknown' }));
        embed.addFields({
          name: `ID: \`${note.id}\` — <t:${Math.floor(new Date(note.date).getTime()/1000)}:R>`,
          value: `${note.text}\n*By: ${mod.tag}*`,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    if (sub === 'delete') {
      const member = message.mentions.members.first()
        || await message.guild.members.fetch(args[1]).catch(() => null);

      if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

      const noteId = args[2];
      if (!noteId) return message.reply({ embeds: [errorEmbed('Missing ID', 'Please provide the note ID.')] });

      const key   = `${message.guild.id}_${member.id}`;
      const notes = db.notes.get(key) || [];
      const idx   = notes.findIndex(n => n.id === noteId);

      if (idx === -1) return message.reply({ embeds: [errorEmbed('Not Found', `No note found with ID \`${noteId}\`.`)] });

      notes.splice(idx, 1);
      return message.reply({ embeds: [successEmbed('Note Deleted', `Note \`${noteId}\` has been deleted.`)] });
    }

    message.reply({ embeds: [infoEmbed('Note Usage', '`!note add @user <text>` — Add a note\n`!note list @user` — View notes\n`!note delete @user <id>` — Delete a note')] });
  },
};

const commandCalculator = {
  name: 'calc',
  aliases: ['calculate', 'math'],
  description: 'Evaluate a mathematical expression',
  usage: '<expression>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const expr = args.join(' ');
    if (!expr) return message.reply({ embeds: [errorEmbed('Missing Expression', 'Please provide a mathematical expression.')] });

    // Safe math evaluation using Function constructor with restricted scope
    try {
      const safe = expr.replace(/[^0-9+\-*/().%\s]/g, '');
      if (!safe) throw new Error('Expression contains no valid characters.');

      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + safe + ')')();

      if (!isFinite(result)) throw new Error('Result is not finite.');

      const embed = new EmbedBuilder()
        .setTitle('🧮 Calculator')
        .addFields(
          { name: 'Expression', value: `\`${expr}\`` },
          { name: 'Result',     value: `\`${result}\`` },
        )
        .setColor(Colors.Blue)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Calculation Error', err.message)] });
    }
  },
};

const commandColor = {
  name: 'color',
  aliases: ['colour', 'hex'],
  description: 'View information about a color',
  usage: '<#hex|rgb(r,g,b)|colorname>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const input = args.join(' ');

    let r, g, b;

    if (/^#?[0-9A-Fa-f]{6}$/.test(input)) {
      const hex = input.replace('#', '');
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (/^rgb\(\d+,\s*\d+,\s*\d+\)$/.test(input)) {
      const m = input.match(/\d+/g);
      [r, g, b] = m.map(Number);
    } else {
      return message.reply({ embeds: [errorEmbed('Invalid Color', 'Please provide a valid hex color (#RRGGBB) or RGB value.')] });
    }

    const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase();
    const int = (r << 16) | (g << 8) | b;

    // HSL conversion
    const rn = r/255, gn = g/255, bn = b/255;
    const max = Math.max(rn,gn,bn), min = Math.min(rn,gn,bn);
    const l = (max+min)/2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch (max) {
        case rn: h = ((gn-bn)/d + (gn<bn?6:0))/6; break;
        case gn: h = ((bn-rn)/d + 2)/6; break;
        case bn: h = ((rn-gn)/d + 4)/6; break;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`🎨 Color Info`)
      .setColor(int)
      .setThumbnail(`https://singlecolorimage.com/get/${hex.replace('#','')}/200x200`)
      .addFields(
        { name: 'HEX',   value: hex,                        inline: true },
        { name: 'RGB',   value: `rgb(${r}, ${g}, ${b})`,   inline: true },
        { name: 'HSL',   value: `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`, inline: true },
        { name: 'Int',   value: `${int}`,                  inline: true },
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandPoll = {
  name: 'poll',
  aliases: ['vote'],
  description: 'Create a poll',
  usage: '<question> | <option1> | <option2> [| option3 ...]',
  category: 'Utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const parts = args.join(' ').split('|').map(p => p.trim());

    if (parts.length < 3) {
      return message.reply({ embeds: [errorEmbed('Invalid Format', 'Usage: `!poll <question> | <option1> | <option2> [| option3...]`')] });
    }

    const question = parts[0];
    const options   = parts.slice(1);

    if (options.length > 10) return message.reply({ embeds: [errorEmbed('Too Many Options', 'Maximum 10 options allowed.')] });

    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(options.map((o, i) => `${emojis[i]} — **${o}**`).join('\n\n'))
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setFooter({ text: 'Vote by reacting below!' })
      .setColor(Colors.Blue)
      .setTimestamp();

    await message.delete().catch(() => {});
    const pollMsg = await message.channel.send({ embeds: [embed] });

    for (let i = 0; i < options.length; i++) {
      await pollMsg.react(emojis[i]).catch(() => {});
    }

    db.polls.set(pollMsg.id, {
      question,
      options,
      votes:    {},
      creator:  message.author.id,
      channel:  message.channel.id,
      created:  Date.now(),
    });
  },
};

const commandEndpoll = {
  name: 'endpoll',
  aliases: ['closepoll'],
  description: 'End a poll and show results',
  usage: '<message_id>',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const id   = args[0];
    const poll = db.polls.get(id);

    if (!poll) return message.reply({ embeds: [errorEmbed('Not Found', 'No poll found with that message ID.')] });

    const pollMsg = await message.channel.messages.fetch(id).catch(() => null);
    if (!pollMsg) return message.reply({ embeds: [errorEmbed('Message Not Found', 'Cannot find the poll message.')] });

    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
    const results = [];

    for (let i = 0; i < poll.options.length; i++) {
      const reaction = pollMsg.reactions.cache.get(emojis[i]);
      results.push({ option: poll.options[i], votes: (reaction?.count || 1) - 1 });
    }

    results.sort((a, b) => b.votes - a.votes);
    const totalVotes = results.reduce((s, r) => s + r.votes, 0);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Poll Results: ${poll.question}`)
      .setDescription(results.map((r, i) => {
        const pct = totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0;
        return `${i+1}. **${r.option}** — ${r.votes} vote(s) (${pct}%)\n${progressBar(r.votes, Math.max(totalVotes, 1), 12)}`;
      }).join('\n\n'))
      .setFooter({ text: `Total votes: ${totalVotes}` })
      .setColor(Colors.Green)
      .setTimestamp();

    await pollMsg.edit({ embeds: [embed] });
    db.polls.delete(id);

    message.reply({ embeds: [successEmbed('Poll Ended', 'The poll has been ended and results shown.')] });
  },
};

const commandSuggest = {
  name: 'suggest',
  aliases: ['suggestion'],
  description: 'Submit a suggestion',
  usage: '<your suggestion>',
  category: 'Utility',
  cooldown: 30,
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const channelId = config.suggestionChannel;

    if (!channelId) return message.reply({ embeds: [errorEmbed('Not Configured', 'No suggestion channel has been set up. Ask an admin to use `!setsuggestionchannel`.')] });

    const content = args.join(' ');
    if (!content) return message.reply({ embeds: [errorEmbed('Missing Content', 'Please provide your suggestion.')] });
    if (content.length > 1000) return message.reply({ embeds: [errorEmbed('Too Long', 'Suggestions must be 1000 characters or less.')] });

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return message.reply({ embeds: [errorEmbed('Channel Not Found', 'The suggestion channel could not be found.')] });

    const id = genId();
    const embed = new EmbedBuilder()
      .setTitle('💡 New Suggestion')
      .setDescription(content)
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .addFields(
        { name: 'Status', value: '⏳ Pending', inline: true },
        { name: 'ID',     value: `\`${id}\``,  inline: true },
      )
      .setColor(Colors.Yellow)
      .setTimestamp();

    const sugMsg = await channel.send({ embeds: [embed] });
    await sugMsg.react('✅').catch(() => {});
    await sugMsg.react('❌').catch(() => {});

    db.suggestions.set(sugMsg.id, { content, author: message.author.id, status: 'pending', votes: { up: 0, down: 0 }, id });

    await message.delete().catch(() => {});
    const reply = await message.channel.send({ embeds: [successEmbed('Suggestion Submitted', `Your suggestion has been submitted! (ID: \`${id}\`)`)] });
    safeDelete(reply, 5000);
  },
};

const commandSteal = {
  name: 'steal',
  aliases: ['addemoji', 'clone'],
  description: 'Steal an emoji from another server',
  usage: '<emoji> [name]',
  category: 'Utility',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageEmojisAndStickers],
  guildOnly: true,
  async execute(message, args) {
    const input = args[0];
    const name  = args[1];

    if (!input) return message.reply({ embeds: [errorEmbed('Missing Emoji', 'Please provide an emoji to steal.')] });

    const match = input.match(/<?(a)?:?(\w+):(\d+)>?/);
    if (!match) return message.reply({ embeds: [errorEmbed('Invalid Emoji', 'Please provide a custom emoji to steal.')] });

    const animated = !!match[1];
    const emojiName = name || match[2];
    const emojiId   = match[3];
    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}`;

    try {
      const emoji = await message.guild.emojis.create({ attachment: url, name: emojiName });
      message.reply({ embeds: [successEmbed('Emoji Stolen', `Successfully added ${emoji} (\`:${emoji.name}:\`) to the server!`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

const commandTimer = {
  name: 'timer',
  aliases: ['countdown'],
  description: 'Start a countdown timer',
  usage: '<duration>',
  category: 'Utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const ms  = parseDuration(args[0] || '');
    if (ms < 1000 || ms > 3600000) {
      return message.reply({ embeds: [errorEmbed('Invalid Duration', 'Timer must be between 1 second and 1 hour.')] });
    }

    const end = Date.now() + ms;

    const embed = () => new EmbedBuilder()
      .setTitle('⏱️ Countdown Timer')
      .setDescription(`**${formatDuration(Math.max(end - Date.now(), 0))}** remaining`)
      .setColor(Colors.Yellow)
      .setFooter({ text: `Ends at ${new Date(end).toLocaleTimeString()}` });

    const msg = await message.channel.send({ embeds: [embed()] });

    const interval = setInterval(async () => {
      const remaining = end - Date.now();
      if (remaining <= 0) {
        clearInterval(interval);
        await msg.edit({ embeds: [new EmbedBuilder()
          .setTitle('⏱️ Time\'s Up!')
          .setDescription(`${message.author}, your timer has ended!`)
          .setColor(Colors.Green)
          .setTimestamp()
        ] }).catch(() => {});
        return;
      }
      await msg.edit({ embeds: [embed()] }).catch(() => {});
    }, 5000);
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: ECONOMY
// ══════════════════════════════════════════════════════════════

const commandBalance = {
  name: 'balance',
  aliases: ['bal', 'wallet', 'money'],
  description: 'Check your or another user\'s balance',
  usage: '[@user]',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author;

    const eco = getEconomy(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`💰 ${user.tag}'s Balance`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: '👛 Wallet',  value: `$${formatNumber(eco.balance)}`, inline: true },
        { name: '🏦 Bank',    value: `$${formatNumber(eco.bank)}`,    inline: true },
        { name: '💎 Total',  value: `$${formatNumber(eco.balance + eco.bank)}`, inline: true },
      )
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandDaily = {
  name: 'daily',
  aliases: ['claim', 'daily-reward'],
  description: 'Claim your daily reward',
  usage: '',
  category: 'Economy',
  cooldown: 3,
  async execute(message) {
    const eco      = getEconomy(message.author.id);
    const now      = Date.now();
    const cooldown = 86400000; // 24 hours

    if (eco.lastDaily && now - eco.lastDaily < cooldown) {
      const remaining = cooldown - (now - eco.lastDaily);
      return message.reply({ embeds: [errorEmbed('Already Claimed', `You already claimed your daily reward!\nCome back in **${formatDuration(remaining)}**.`)] });
    }

    // Streak system
    const yesterday = now - 86400000 * 2;
    const isStreak  = eco.lastDaily && eco.lastDaily > yesterday;

    eco.streak = isStreak ? (eco.streak || 0) + 1 : 1;
    const streakBonus = Math.min(eco.streak * 50, 500);
    const base  = randInt(100, 300);
    const total = base + streakBonus;

    eco.balance  += total;
    eco.lastDaily = now;

    const embed = new EmbedBuilder()
      .setTitle('🎁 Daily Reward')
      .setDescription(`You received **$${formatNumber(total)}**!`)
      .addFields(
        { name: '💵 Base',         value: `$${formatNumber(base)}`,        inline: true },
        { name: '🔥 Streak Bonus', value: `$${formatNumber(streakBonus)}`, inline: true },
        { name: '🔥 Streak',       value: `${eco.streak} days`,            inline: true },
        { name: '💰 New Balance',  value: `$${formatNumber(eco.balance)}`, inline: true },
      )
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandWork = {
  name: 'work',
  aliases: ['earn', 'job'],
  description: 'Work to earn money',
  usage: '',
  category: 'Economy',
  cooldown: 3,
  async execute(message) {
    const eco      = getEconomy(message.author.id);
    const cooldown = 3600000; // 1 hour
    const now      = Date.now();

    if (eco.lastWork && now - eco.lastWork < cooldown) {
      const remaining = cooldown - (now - eco.lastWork);
      return message.reply({ embeds: [errorEmbed('Too Tired', `You already worked recently!\nCome back in **${formatDuration(remaining)}**.`)] });
    }

    const jobs = [
      { name: 'Programmer',    pay: [200, 500] },
      { name: 'Chef',          pay: [150, 350] },
      { name: 'Doctor',        pay: [300, 700] },
      { name: 'Taxi Driver',   pay: [100, 250] },
      { name: 'Teacher',       pay: [150, 400] },
      { name: 'Barista',       pay: [80, 200]  },
      { name: 'Engineer',      pay: [250, 600] },
      { name: 'Musician',      pay: [100, 400] },
      { name: 'Security Guard',pay: [150, 300] },
      { name: 'Firefighter',   pay: [200, 450] },
    ];

    const job  = randomChoice(jobs);
    const pay  = randInt(job.pay[0], job.pay[1]);
    const msgs = [
      `You worked as a **${job.name}** and earned **$${formatNumber(pay)}**!`,
      `You spent the hour being a **${job.name}** and got paid **$${formatNumber(pay)}**!`,
      `A hard day's work as a **${job.name}** paid off — **$${formatNumber(pay)}** earned!`,
    ];

    eco.balance  += pay;
    eco.lastWork  = now;

    const embed = new EmbedBuilder()
      .setTitle('💼 Work Complete')
      .setDescription(randomChoice(msgs))
      .addFields({ name: '💰 New Balance', value: `$${formatNumber(eco.balance)}`, inline: true })
      .setColor(Colors.Green)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandCrime = {
  name: 'crime',
  aliases: ['steal2', 'heist-solo'],
  description: 'Commit a crime for a chance at big money',
  usage: '',
  category: 'Economy',
  cooldown: 3,
  async execute(message) {
    const eco      = getEconomy(message.author.id);
    const cooldown = 7200000; // 2 hours
    const now      = Date.now();

    if (eco.lastCrime && now - eco.lastCrime < cooldown) {
      const remaining = cooldown - (now - eco.lastCrime);
      return message.reply({ embeds: [errorEmbed('Too Hot', `You need to lay low for **${formatDuration(remaining)}**!`)] });
    }

    eco.lastCrime = now;
    const success = Math.random() < 0.5;

    if (success) {
      const amount = randInt(300, 900);
      eco.balance += amount;

      const crimes = [
        `You robbed a bank and got away with **$${formatNumber(amount)}**!`,
        `You hacked a corporation and transferred **$${formatNumber(amount)}**!`,
        `You picked pockets in a crowd and scored **$${formatNumber(amount)}**!`,
        `You sold some stolen goods for **$${formatNumber(amount)}**!`,
      ];

      message.reply({ embeds: [new EmbedBuilder()
        .setTitle('🦹 Crime Successful!')
        .setDescription(randomChoice(crimes))
        .addFields({ name: '💰 New Balance', value: `$${formatNumber(eco.balance)}` })
        .setColor(Colors.Green)
        .setTimestamp()
      ] });
    } else {
      const fine = randInt(100, 400);
      eco.balance = Math.max(0, eco.balance - fine);

      const fails = [
        `You got caught by the police and fined **$${formatNumber(fine)}**!`,
        `The security guard spotted you — you paid **$${formatNumber(fine)}** in damages!`,
        `You tripped the alarm and lost **$${formatNumber(fine)}** running away!`,
      ];

      message.reply({ embeds: [new EmbedBuilder()
        .setTitle('🚔 Crime Failed!')
        .setDescription(randomChoice(fails))
        .addFields({ name: '💰 New Balance', value: `$${formatNumber(eco.balance)}` })
        .setColor(Colors.Red)
        .setTimestamp()
      ] });
    }
  },
};

const commandRob = {
  name: 'rob',
  aliases: ['steal-from'],
  description: 'Try to rob another user',
  usage: '<@user>',
  category: 'Economy',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Rob', 'You cannot rob yourself.')] });
    if (target.bot) return message.reply({ embeds: [errorEmbed('Cannot Rob', 'You cannot rob a bot.')] });

    const robberEco = getEconomy(message.author.id);
    const victimEco = getEconomy(target.id);
    const cooldown  = 3600000;
    const now       = Date.now();

    if (robberEco.lastRob && now - robberEco.lastRob < cooldown) {
      const remaining = cooldown - (now - robberEco.lastRob);
      return message.reply({ embeds: [errorEmbed('Cooling Down', `You need to wait **${formatDuration(remaining)}** before robbing again.`)] });
    }

    if (victimEco.balance < 100) {
      return message.reply({ embeds: [errorEmbed('Not Worth It', `**${target.tag}** is too broke to rob! (Balance: $${formatNumber(victimEco.balance)})`)] });
    }

    robberEco.lastRob = now;

    const success = Math.random() < 0.45;

    if (success) {
      const maxSteal = Math.floor(victimEco.balance * 0.3);
      const stolen   = randInt(Math.floor(maxSteal * 0.3), maxSteal);

      victimEco.balance -= stolen;
      robberEco.balance += stolen;

      message.reply({ embeds: [successEmbed('Rob Successful!', `You stole **$${formatNumber(stolen)}** from **${target.tag}**!\n**Your balance:** $${formatNumber(robberEco.balance)}`)] });
    } else {
      const fine = randInt(50, 200);
      robberEco.balance = Math.max(0, robberEco.balance - fine);

      message.reply({ embeds: [errorEmbed('Rob Failed!', `You got caught trying to rob **${target.tag}** and paid a **$${formatNumber(fine)}** fine!\n**Your balance:** $${formatNumber(robberEco.balance)}`)] });
    }
  },
};

const commandDeposit = {
  name: 'deposit',
  aliases: ['dep'],
  description: 'Deposit money into your bank',
  usage: '<amount|all>',
  category: 'Economy',
  cooldown: 3,
  async execute(message, args) {
    const eco = getEconomy(message.author.id);

    let amount;
    if (args[0]?.toLowerCase() === 'all') {
      amount = eco.balance;
    } else {
      amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid amount.')] });
    }

    if (amount > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.balance)}** in your wallet.`)] });

    eco.balance -= amount;
    eco.bank    += amount;

    message.reply({ embeds: [successEmbed('Deposited', `Successfully deposited **$${formatNumber(amount)}** into your bank.\n**Wallet:** $${formatNumber(eco.balance)}\n**Bank:** $${formatNumber(eco.bank)}`)] });
  },
};

const commandWithdraw = {
  name: 'withdraw',
  aliases: ['with', 'wd'],
  description: 'Withdraw money from your bank',
  usage: '<amount|all>',
  category: 'Economy',
  cooldown: 3,
  async execute(message, args) {
    const eco = getEconomy(message.author.id);

    let amount;
    if (args[0]?.toLowerCase() === 'all') {
      amount = eco.bank;
    } else {
      amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid amount.')] });
    }

    if (amount > eco.bank) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.bank)}** in your bank.`)] });

    eco.bank    -= amount;
    eco.balance += amount;

    message.reply({ embeds: [successEmbed('Withdrawn', `Successfully withdrew **$${formatNumber(amount)}** from your bank.\n**Wallet:** $${formatNumber(eco.balance)}\n**Bank:** $${formatNumber(eco.bank)}`)] });
  },
};

const commandPay = {
  name: 'pay',
  aliases: ['give', 'transfer'],
  description: 'Transfer money to another user',
  usage: '<@user> <amount>',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Pay Yourself', 'You cannot transfer money to yourself.')] });
    if (target.bot) return message.reply({ embeds: [errorEmbed('Cannot Pay Bot', 'You cannot transfer money to a bot.')] });

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid amount.')] });

    const senderEco = getEconomy(message.author.id);
    const recvEco   = getEconomy(target.id);

    if (amount > senderEco.balance) {
      return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(senderEco.balance)}** in your wallet.`)] });
    }

    senderEco.balance -= amount;
    recvEco.balance   += amount;

    message.reply({ embeds: [successEmbed('Transfer Complete', `Successfully transferred **$${formatNumber(amount)}** to **${target.tag}**.\n**Your wallet:** $${formatNumber(senderEco.balance)}`)] });
  },
};

const commandLeaderboard = {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'rich'],
  description: 'View the economy leaderboard',
  usage: '[page]',
  category: 'Economy',
  cooldown: 10,
  async execute(message, args) {
    const page = parseInt(args[0]) || 1;

    const sorted = [...db.economy.entries()]
      .map(([uid, eco]) => ({ id: uid, total: eco.balance + eco.bank }))
      .sort((a, b) => b.total - a.total);

    const { items, total } = paginate(sorted, page, 10);

    const lines = await Promise.all(items.map(async (entry, i) => {
      const user  = await client.users.fetch(entry.id).catch(() => ({ tag: `Unknown (${entry.id})` }));
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${(page-1)*10+i+1}.`;
      return `${medal} **${user.tag}** — $${formatNumber(entry.total)}`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('💎 Economy Leaderboard')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Page ${page}/${total}` })
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandShop = {
  name: 'shop',
  aliases: ['store', 'market'],
  description: 'View the item shop',
  usage: '',
  category: 'Economy',
  cooldown: 5,
  async execute(message) {
    const items = [
      { id: 'fishing_rod',    name: '🎣 Fishing Rod',    price: 500,   desc: 'Needed for fishing'          },
      { id: 'pickaxe',        name: '⛏️ Pickaxe',         price: 750,   desc: 'Needed for mining'           },
      { id: 'hunting_rifle',  name: '🔫 Hunting Rifle',  price: 1000,  desc: 'Needed for hunting'          },
      { id: 'shield',         name: '🛡️ Shield',          price: 800,   desc: 'Protects 50% from robbery'   },
      { id: 'laptop',         name: '💻 Laptop',          price: 2000,  desc: '+50% work earnings'          },
      { id: 'bank_upgrade',   name: '🏦 Bank Upgrade',   price: 5000,  desc: 'Doubles bank capacity'       },
      { id: 'lucky_coin',     name: '🪙 Lucky Coin',     price: 1500,  desc: '+10% chance in gambling'     },
      { id: 'vip_pass',       name: '⭐ VIP Pass',       price: 10000, desc: 'VIP badge + perks'           },
    ];

    const embed = new EmbedBuilder()
      .setTitle('🏪 Item Shop')
      .setDescription('Use `!buy <item_id>` to purchase an item.')
      .addFields(items.map(item => ({
        name:  `${item.name} — $${formatNumber(item.price)}`,
        value: `ID: \`${item.id}\`\n${item.desc}`,
        inline: true,
      })))
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const SHOP_ITEMS = {
  fishing_rod:   { name: '🎣 Fishing Rod',   price: 500   },
  pickaxe:       { name: '⛏️ Pickaxe',        price: 750   },
  hunting_rifle: { name: '🔫 Hunting Rifle', price: 1000  },
  shield:        { name: '🛡️ Shield',         price: 800   },
  laptop:        { name: '💻 Laptop',         price: 2000  },
  bank_upgrade:  { name: '🏦 Bank Upgrade',  price: 5000  },
  lucky_coin:    { name: '🪙 Lucky Coin',    price: 1500  },
  vip_pass:      { name: '⭐ VIP Pass',      price: 10000 },
};

const commandBuy = {
  name: 'buy',
  aliases: ['purchase'],
  description: 'Buy an item from the shop',
  usage: '<item_id>',
  category: 'Economy',
  cooldown: 3,
  async execute(message, args) {
    const itemId = args[0]?.toLowerCase();
    const item   = SHOP_ITEMS[itemId];

    if (!item) return message.reply({ embeds: [errorEmbed('Invalid Item', `No item found with ID \`${itemId}\`. Check \`!shop\` for available items.`)] });

    const eco = getEconomy(message.author.id);

    if (eco.balance < item.price) {
      return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You need **$${formatNumber(item.price)}** but only have **$${formatNumber(eco.balance)}**!`)] });
    }

    if (eco.inventory.includes(itemId) && itemId !== 'lucky_coin') {
      return message.reply({ embeds: [errorEmbed('Already Owned', `You already own **${item.name}**!`)] });
    }

    eco.balance -= item.price;
    eco.inventory.push(itemId);

    message.reply({ embeds: [successEmbed('Purchase Complete', `You bought **${item.name}** for **$${formatNumber(item.price)}**!\n**New Balance:** $${formatNumber(eco.balance)}`)] });
  },
};

const commandInventory = {
  name: 'inventory',
  aliases: ['inv', 'items', 'bag'],
  description: 'View your inventory',
  usage: '[@user]',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author;

    const eco = getEconomy(user.id);

    if (eco.inventory.length === 0) {
      return message.reply({ embeds: [infoEmbed('Empty Inventory', `**${user.tag}** has no items. Visit \`!shop\` to buy some!`)] });
    }

    const items = eco.inventory.map(id => SHOP_ITEMS[id]?.name || id);

    const embed = new EmbedBuilder()
      .setTitle(`🎒 ${user.tag}'s Inventory`)
      .setDescription(items.map((item, i) => `${i+1}. ${item}`).join('\n'))
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandGamble = {
  name: 'gamble',
  aliases: ['bet', 'slots', 'casino'],
  description: 'Gamble your money',
  usage: '<amount>',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const eco    = getEconomy(message.author.id);
    let amount;

    if (args[0]?.toLowerCase() === 'all') {
      amount = eco.balance;
    } else {
      amount = parseInt(args[0]);
    }

    if (isNaN(amount) || amount < 10) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Minimum bet is $10.')] });
    if (amount > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.balance)}**.`)] });
    if (amount > 10000) return message.reply({ embeds: [errorEmbed('Too High', 'Maximum bet is $10,000.')] });

    const slots = ['🍒', '🍋', '🍊', '🍇', '⭐', '7️⃣', '💎'];
    const haslucky = eco.inventory.includes('lucky_coin');
    const win       = haslucky ? Math.random() < 0.48 : Math.random() < 0.45;

    const s1 = randomChoice(slots);
    const s2 = win ? s1 : (Math.random() < 0.4 ? s1 : randomChoice(slots));
    const s3 = win ? s1 : randomChoice(slots);

    const jackpot  = s1 === s2 && s2 === s3 && s1 === '💎';
    const bigWin   = s1 === s2 && s2 === s3 && s1 === '7️⃣';
    const matched  = s1 === s2 && s2 === s3;

    let mult, desc;
    if (jackpot)       { mult = 10; desc = '💎 **JACKPOT! 10x!**' }
    else if (bigWin)   { mult = 5;  desc = '7️⃣ **BIG WIN! 5x!**' }
    else if (matched)  { mult = 3;  desc = '🎉 **Winner! 3x!**' }
    else if (win)      { mult = 2;  desc = '✅ **You win! 2x!**' }
    else               { mult = 0;  desc = '❌ **You lost!**' }

    const change = mult > 0 ? amount * mult - amount : -amount;
    eco.balance += change;

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slot Machine')
      .setDescription(`**[ ${s1} | ${s2} | ${s3} ]**\n\n${desc}`)
      .addFields(
        { name: change >= 0 ? '💰 Won' : '💸 Lost', value: `$${formatNumber(Math.abs(change))}`, inline: true },
        { name: '💰 Balance', value: `$${formatNumber(eco.balance)}`,                           inline: true },
      )
      .setColor(mult > 0 ? Colors.Green : Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandBlackjack = {
  name: 'blackjack',
  aliases: ['bj', '21'],
  description: 'Play blackjack against the dealer',
  usage: '<amount>',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const eco = getEconomy(message.author.id);
    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet < 10) return message.reply({ embeds: [errorEmbed('Invalid Bet', 'Minimum bet is $10.')] });
    if (bet > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.balance)}**.`)] });

    const deck = [...Array(4).keys()].flatMap(() =>
      ['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map(v => ({ value: v }))
    );
    const shuffledDeck = shuffle(deck);
    let deckIdx = 0;

    const draw = () => shuffledDeck[deckIdx++];

    const cardValue = (card) => {
      if (['J','Q','K'].includes(card.value)) return 10;
      if (card.value === 'A') return 11;
      return parseInt(card.value);
    };

    const handValue = (hand) => {
      let val  = hand.reduce((s, c) => s + cardValue(c), 0);
      let aces = hand.filter(c => c.value === 'A').length;
      while (val > 21 && aces-- > 0) val -= 10;
      return val;
    };

    const handStr = (hand) => hand.map(c => `\`${c.value}\``).join(' ');

    let playerHand = [draw(), draw()];
    let dealerHand = [draw(), draw()];

    const buildEmbed = (status = 'playing') => {
      const pv = handValue(playerHand);
      const dv = handValue(dealerHand);
      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack')
        .addFields(
          { name: `Your Hand (${pv})`,   value: handStr(playerHand)                                         },
          { name: `Dealer Hand (${status === 'playing' ? '?' : dv})`, value: status === 'playing' ? `${handStr([dealerHand[0]])} \`?\`` : handStr(dealerHand) },
        )
        .setFooter({ text: `Bet: $${formatNumber(bet)}` })
        .setColor(status === 'playing' ? Colors.Blue : status === 'win' ? Colors.Green : Colors.Red)
        .setTimestamp();
      return embed;
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('bj_double').setLabel('Double Down').setStyle(ButtonStyle.Primary),
    );

    const msg = await message.reply({ embeds: [buildEmbed()], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000,
    });

    const endGame = async (status, reason) => {
      collector.stop();
      const pv = handValue(playerHand);
      const dv = handValue(dealerHand);
      let desc  = reason;
      let color = Colors.Blue;

      if (status === 'win') { eco.balance += bet; color = Colors.Green; }
      else if (status === 'lose') { eco.balance -= bet; color = Colors.Red; }
      else if (status === 'blackjack') { eco.balance += Math.floor(bet * 1.5); color = Colors.Gold; }

      const finalEmbed = buildEmbed(status);
      finalEmbed.setDescription(`**${desc}**\n**New Balance:** $${formatNumber(eco.balance)}`);
      finalEmbed.setColor(color);

      await msg.edit({ embeds: [finalEmbed], components: [] });
    };

    // Check for immediate blackjack
    if (handValue(playerHand) === 21) {
      await endGame('blackjack', '🎉 Blackjack! You win 1.5x your bet!');
      return;
    }

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'bj_hit') {
        playerHand.push(draw());
        if (handValue(playerHand) > 21) {
          await endGame('lose', '💥 Bust! You went over 21.');
        } else if (handValue(playerHand) === 21) {
          // Auto-stand on 21
          while (handValue(dealerHand) < 17) dealerHand.push(draw());
          const pv = handValue(playerHand), dv = handValue(dealerHand);
          if (dv > 21 || pv > dv) await endGame('win', '🎉 You win!');
          else if (pv === dv) await endGame('push', '🤝 Push! Tie game.');
          else await endGame('lose', '😔 Dealer wins!');
        } else {
          await msg.edit({ embeds: [buildEmbed()], components: [row] });
        }

      } else if (i.customId === 'bj_stand') {
        while (handValue(dealerHand) < 17) dealerHand.push(draw());
        const pv = handValue(playerHand), dv = handValue(dealerHand);
        if (dv > 21 || pv > dv) await endGame('win', '🎉 You win!');
        else if (pv === dv) await endGame('push', '🤝 Push! Tie game.');
        else await endGame('lose', '😔 Dealer wins!');

      } else if (i.customId === 'bj_double') {
        if (eco.balance < bet * 2) {
          await i.followUp({ content: 'Not enough money to double down!', ephemeral: true });
          return;
        }
        playerHand.push(draw());
        const doubledBet = bet;
        if (handValue(playerHand) > 21) {
          eco.balance -= doubledBet;
          await endGame('bust', `💥 Bust! Lost an extra $${formatNumber(doubledBet)}.`);
        } else {
          while (handValue(dealerHand) < 17) dealerHand.push(draw());
          const pv = handValue(playerHand), dv = handValue(dealerHand);
          if (dv > 21 || pv > dv) { eco.balance += doubledBet; await endGame('win', `🎉 Double win! +$${formatNumber(doubledBet * 2)}`); }
          else if (pv === dv) await endGame('push', '🤝 Push! Tie game.');
          else { eco.balance -= doubledBet; await endGame('lose', `😔 Dealer wins! -$${formatNumber(doubledBet * 2)}`); }
        }
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        eco.balance -= bet;
        await msg.edit({
          embeds: [errorEmbed('Time Out', `You took too long! Lost $${formatNumber(bet)}.\n**Balance:** $${formatNumber(eco.balance)}`)],
          components: [],
        });
      }
    });
  },
};

const commandCoinflip = {
  name: 'coinflip',
  aliases: ['cf', 'flip'],
  description: 'Flip a coin and bet money',
  usage: '<heads|tails> <amount>',
  category: 'Economy',
  cooldown: 3,
  async execute(message, args) {
    const choice = args[0]?.toLowerCase();
    if (!['heads', 'tails', 'h', 't'].includes(choice)) {
      return message.reply({ embeds: [errorEmbed('Invalid Choice', 'Choose `heads` or `tails`.')] });
    }

    const normalised = choice.startsWith('h') ? 'heads' : 'tails';
    const eco    = getEconomy(message.author.id);
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount < 1) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid bet.')] });
    if (amount > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.balance)}**.`)] });

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won    = result === normalised;

    eco.balance += won ? amount : -amount;

    const embed = new EmbedBuilder()
      .setTitle(`🪙 Coin Flip — ${result === 'heads' ? '🌕 Heads' : '🌑 Tails'}`)
      .setDescription(`You chose **${normalised}** and the coin landed on **${result}**!\n${won ? `🎉 You won **$${formatNumber(amount)}**!` : `😔 You lost **$${formatNumber(amount)}**!`}`)
      .addFields({ name: '💰 Balance', value: `$${formatNumber(eco.balance)}` })
      .setColor(won ? Colors.Green : Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandRoulette = {
  name: 'roulette',
  aliases: ['rou'],
  description: 'Play roulette',
  usage: '<red|black|green|number> <amount>',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const bet    = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);

    const eco = getEconomy(message.author.id);

    if (!bet) return message.reply({ embeds: [infoEmbed('Roulette Bets', '`red` (2x) | `black` (2x) | `green` (14x) | `0-36` (35x)')] });

    if (isNaN(amount) || amount < 10) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Minimum bet is $10.')] });
    if (amount > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You only have **$${formatNumber(eco.balance)}**.`)] });

    const number = Math.floor(Math.random() * 37); // 0-36
    const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const isRed   = redNums.includes(number);
    const isGreen = number === 0;
    const isBlack = !isRed && !isGreen;

    let mult = 0;
    if (bet === 'red'   && isRed)   mult = 2;
    if (bet === 'black' && isBlack) mult = 2;
    if (bet === 'green' && isGreen) mult = 14;
    if (!isNaN(parseInt(bet)) && parseInt(bet) === number) mult = 35;

    const change = mult > 0 ? amount * mult - amount : -amount;
    eco.balance += change;

    const color = isGreen ? '🟩' : isRed ? '🔴' : '⚫';

    const embed = new EmbedBuilder()
      .setTitle('🎡 Roulette')
      .setDescription(`The ball landed on **${color} ${number}**!`)
      .addFields(
        { name: 'Your Bet',  value: `${bet} for $${formatNumber(amount)}`,            inline: true },
        { name: 'Result',    value: mult > 0 ? `Won $${formatNumber(amount*mult-amount)}` : `Lost $${formatNumber(amount)}`, inline: true },
        { name: '💰 Balance',value: `$${formatNumber(eco.balance)}`,                  inline: true },
      )
      .setColor(isGreen ? Colors.Green : isRed ? Colors.Red : Colors.Default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandFish = {
  name: 'fish',
  aliases: ['fishing', 'cast'],
  description: 'Go fishing for money',
  usage: '',
  category: 'Economy',
  cooldown: 5,
  async execute(message) {
    const eco = getEconomy(message.author.id);

    if (!eco.inventory.includes('fishing_rod')) {
      return message.reply({ embeds: [errorEmbed('No Fishing Rod', 'You need a 🎣 Fishing Rod to fish! Buy one at `!shop`.')] });
    }

    const cooldown = 1800000; // 30 minutes
    if (eco.lastFish && Date.now() - eco.lastFish < cooldown) {
      const remaining = cooldown - (Date.now() - eco.lastFish);
      return message.reply({ embeds: [errorEmbed('Cooldown', `Wait **${formatDuration(remaining)}** before fishing again.`)] });
    }

    eco.lastFish = Date.now();

    const catches = [
      { name: '🐟 Common Fish',     chance: 0.35, value: [20, 60]    },
      { name: '🐠 Tropical Fish',   chance: 0.25, value: [60, 120]   },
      { name: '🐡 Puffer Fish',     chance: 0.15, value: [80, 160]   },
      { name: '🦈 Shark',           chance: 0.10, value: [200, 400]  },
      { name: '🦞 Lobster',         chance: 0.08, value: [150, 300]  },
      { name: '💎 Diamond Fish',    chance: 0.04, value: [500, 1000] },
      { name: '👢 Old Boot',        chance: 0.03, value: [0, 0]      },
    ];

    const rand  = Math.random();
    let cumulative = 0;
    let caught = catches[catches.length - 1];

    for (const c of catches) {
      cumulative += c.chance;
      if (rand < cumulative) { caught = c; break; }
    }

    const value = caught.value[0] === 0 ? 0 : randInt(caught.value[0], caught.value[1]);
    eco.balance += value;

    const embed = new EmbedBuilder()
      .setTitle('🎣 Fishing Results')
      .setDescription(value > 0
        ? `You caught a **${caught.name}** and sold it for **$${formatNumber(value)}**!`
        : `You caught a **${caught.name}**... That's useless.`)
      .addFields({ name: '💰 Balance', value: `$${formatNumber(eco.balance)}` })
      .setColor(value > 0 ? Colors.Blue : Colors.Grey)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandMine = {
  name: 'mine',
  aliases: ['mining'],
  description: 'Mine for resources and money',
  usage: '',
  category: 'Economy',
  cooldown: 5,
  async execute(message) {
    const eco = getEconomy(message.author.id);

    if (!eco.inventory.includes('pickaxe')) {
      return message.reply({ embeds: [errorEmbed('No Pickaxe', 'You need a ⛏️ Pickaxe to mine! Buy one at `!shop`.')] });
    }

    const cooldown = 3600000; // 1 hour
    if (eco.lastMine && Date.now() - eco.lastMine < cooldown) {
      const remaining = cooldown - (Date.now() - eco.lastMine);
      return message.reply({ embeds: [errorEmbed('Cooldown', `Wait **${formatDuration(remaining)}** before mining again.`)] });
    }

    eco.lastMine = Date.now();

    const ores = [
      { name: '🪨 Coal',     chance: 0.35, value: [30, 80]    },
      { name: '🔩 Iron',     chance: 0.25, value: [60, 140]   },
      { name: '🥇 Gold',     chance: 0.15, value: [120, 250]  },
      { name: '💎 Diamond',  chance: 0.10, value: [300, 600]  },
      { name: '💜 Amethyst', chance: 0.08, value: [200, 450]  },
      { name: '🔮 Crystal',  chance: 0.05, value: [400, 800]  },
      { name: '❓ Nothing',  chance: 0.02, value: [0, 0]      },
    ];

    const rand = Math.random();
    let cumulative = 0;
    let found = ores[ores.length - 1];

    for (const ore of ores) {
      cumulative += ore.chance;
      if (rand < cumulative) { found = ore; break; }
    }

    const value = found.value[0] === 0 ? 0 : randInt(found.value[0], found.value[1]);
    eco.balance += value;

    const embed = new EmbedBuilder()
      .setTitle('⛏️ Mining Results')
      .setDescription(value > 0
        ? `You mined **${found.name}** and sold it for **$${formatNumber(value)}**!`
        : `You mined but found **nothing**. Better luck next time!`)
      .addFields({ name: '💰 Balance', value: `$${formatNumber(eco.balance)}` })
      .setColor(value > 0 ? Colors.Yellow : Colors.Grey)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandHunt = {
  name: 'hunt',
  aliases: ['hunting'],
  description: 'Go hunting for animals',
  usage: '',
  category: 'Economy',
  cooldown: 5,
  async execute(message) {
    const eco = getEconomy(message.author.id);

    if (!eco.inventory.includes('hunting_rifle')) {
      return message.reply({ embeds: [errorEmbed('No Rifle', 'You need a 🔫 Hunting Rifle to hunt! Buy one at `!shop`.')] });
    }

    const cooldown = 2700000; // 45 minutes
    if (eco.lastHunt && Date.now() - eco.lastHunt < cooldown) {
      const remaining = cooldown - (Date.now() - eco.lastHunt);
      return message.reply({ embeds: [errorEmbed('Cooldown', `Wait **${formatDuration(remaining)}** before hunting again.`)] });
    }

    eco.lastHunt = Date.now();

    const animals = [
      { name: '🐇 Rabbit',  chance: 0.30, value: [50, 100]   },
      { name: '🦌 Deer',    chance: 0.25, value: [100, 200]  },
      { name: '🦊 Fox',     chance: 0.20, value: [150, 280]  },
      { name: '🐗 Boar',    chance: 0.12, value: [200, 350]  },
      { name: '🐻 Bear',    chance: 0.08, value: [300, 500]  },
      { name: '🦁 Lion',    chance: 0.03, value: [500, 900]  },
      { name: '💨 Missed',  chance: 0.02, value: [0, 0]      },
    ];

    const rand = Math.random();
    let cumulative = 0;
    let hunted = animals[animals.length - 1];

    for (const animal of animals) {
      cumulative += animal.chance;
      if (rand < cumulative) { hunted = animal; break; }
    }

    const value = hunted.value[0] === 0 ? 0 : randInt(hunted.value[0], hunted.value[1]);
    eco.balance += value;

    const embed = new EmbedBuilder()
      .setTitle('🔫 Hunting Results')
      .setDescription(value > 0
        ? `You hunted a **${hunted.name}** and earned **$${formatNumber(value)}**!`
        : `You shot but **missed** your target. Better luck next time!`)
      .addFields({ name: '💰 Balance', value: `$${formatNumber(eco.balance)}` })
      .setColor(value > 0 ? Colors.DarkGreen : Colors.Grey)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: LEVELS
// ══════════════════════════════════════════════════════════════

const commandRank = {
  name: 'rank',
  aliases: ['level', 'xp', 'lvl'],
  description: 'View your level and XP',
  usage: '[@user]',
  category: 'Levels',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null)
      || message.member;

    const entry = getLevelEntry(message.guild.id, member.id);
    const level = calcLevel(entry.xp);
    const xpForCurrent = xpForLevel(level);
    const xpForNext    = xpForLevel(level + 1);
    const progress     = entry.xp - xpForCurrent;
    const needed       = xpForNext - xpForCurrent;

    // Calculate leaderboard position
    const guildEntries = [...db.levels.entries()]
      .filter(([k]) => k.startsWith(message.guild.id))
      .sort(([,a], [,b]) => b.xp - a.xp);

    const rank = guildEntries.findIndex(([k]) => k === `${message.guild.id}_${member.id}`) + 1;

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${member.displayName}'s Rank`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '🏆 Rank',    value: `#${rank}`,              inline: true },
        { name: '⭐ Level',  value: `${level}`,               inline: true },
        { name: '✨ XP',     value: `${formatNumber(entry.xp)}`, inline: true },
        { name: '💬 Messages', value: `${formatNumber(entry.messages)}`, inline: true },
        { name: '📈 Progress', value: `${formatNumber(progress)} / ${formatNumber(needed)} XP\n${progressBar(progress, needed)}` },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandLevelLeaderboard = {
  name: 'leveltop',
  aliases: ['ltop', 'lboard', 'levels'],
  description: 'View the level leaderboard',
  usage: '[page]',
  category: 'Levels',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const page = parseInt(args[0]) || 1;

    const sorted = [...db.levels.entries()]
      .filter(([k]) => k.startsWith(message.guild.id))
      .sort(([,a], [,b]) => b.xp - a.xp);

    if (sorted.length === 0) return message.reply({ embeds: [infoEmbed('Empty Leaderboard', 'No one has earned XP in this server yet.')] });

    const { items, total } = paginate(sorted, page, 10);

    const lines = await Promise.all(items.map(async ([key, data], i) => {
      const uid    = key.split('_')[1];
      const user   = await client.users.fetch(uid).catch(() => ({ tag: 'Unknown' }));
      const level  = calcLevel(data.xp);
      const medals = ['🥇','🥈','🥉'];
      const pos    = (page-1)*10 + i;
      const label  = medals[pos] || `${pos+1}.`;
      return `${label} **${user.tag}** — Level ${level} (${formatNumber(data.xp)} XP)`;
    }));

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Level Leaderboard — ${message.guild.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Page ${page}/${total}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandResetxp = {
  name: 'resetxp',
  aliases: ['clearxp'],
  description: 'Reset a member\'s XP and level',
  usage: '<@user>',
  category: 'Levels',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });

    db.levels.delete(`${message.guild.id}_${member.id}`);
    message.reply({ embeds: [successEmbed('XP Reset', `All XP and level data for **${member.user.tag}** has been reset.`)] });
  },
};

const commandLevelrewards = {
  name: 'levelrewards',
  aliases: ['rewards', 'lvlrewards'],
  description: 'View level-up role rewards',
  usage: '',
  category: 'Levels',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const config  = getGuildConfig(message.guild.id);
    const rewards = config.levelRewards;

    if (Object.keys(rewards).length === 0) {
      return message.reply({ embeds: [infoEmbed('No Rewards', 'No level rewards have been configured.')] });
    }

    const lines = Object.entries(rewards)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([lvl, roleId]) => {
        const role = message.guild.roles.cache.get(roleId);
        return `Level **${lvl}** → ${role || `@deleted-role (${roleId})`}`;
      });

    const embed = new EmbedBuilder()
      .setTitle('🎁 Level Rewards')
      .setDescription(lines.join('\n'))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandSetlevelreward = {
  name: 'setlevelreward',
  aliases: ['slr', 'addreward'],
  description: 'Set a role reward for reaching a level',
  usage: '<level> <@role>',
  category: 'Levels',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const level = parseInt(args[0]);
    const role  = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);

    if (isNaN(level) || level < 1) return message.reply({ embeds: [errorEmbed('Invalid Level', 'Please provide a valid level number.')] });
    if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a valid role.')] });

    const config = getGuildConfig(message.guild.id);
    config.levelRewards[level] = role.id;

    message.reply({ embeds: [successEmbed('Reward Set', `At level **${level}**, members will receive ${role}.`)] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: FUN
// ══════════════════════════════════════════════════════════════

const commandMeme = {
  name: 'meme',
  aliases: ['m', 'dankmeme'],
  description: 'Get a random meme',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const subs = ['memes', 'dankmemes', 'me_irl', 'funny', 'comedyheaven', 'shitposting'];
    const sub  = randomChoice(subs);

    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/random/.json?limit=1`).catch(() => null);
      if (!res || !res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      const post = json[0]?.data?.children[0]?.data;

      if (!post || post.over_18) {
        return message.reply({ embeds: [infoEmbed('Meme Blocked', 'The fetched meme was NSFW. Try again!')] });
      }

      const embed = new EmbedBuilder()
        .setTitle(truncate(post.title, 256))
        .setImage(post.url)
        .setURL(`https://reddit.com${post.permalink}`)
        .setFooter({ text: `r/${post.subreddit} | 👍 ${post.ups} | 💬 ${post.num_comments}` })
        .setColor(Colors.Orange)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a meme. Try again later.')] });
    }
  },
};

const commandJoke = {
  name: 'joke',
  aliases: ['dadjoke', 'pun'],
  description: 'Get a random joke',
  usage: '',
  category: 'Fun',
  cooldown: 3,
  async execute(message) {
    const jokes = [
      { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
      { setup: "Did you hear about the mathematician who's afraid of negative numbers?", punchline: "He'll stop at nothing to avoid them!" },
      { setup: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field!" },
      { setup: "I'm on a seafood diet. I see food and I eat it.", punchline: null },
      { setup: "Why can't you give Elsa a balloon?", punchline: "Because she'll let it go!" },
      { setup: "I would tell you a construction joke...", punchline: "But I'm still working on it." },
      { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up." },
      { setup: "I used to hate facial hair...", punchline: "But then it grew on me." },
      { setup: "Did you hear about the guy who invented Lifesavers?", punchline: "He made a mint." },
      { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired!" },
      { setup: "I have a joke about construction...", punchline: "I'm still building up to it." },
      { setup: "Want to hear a joke about paper?", punchline: "Never mind... it's tearable." },
      { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved." },
      { setup: "Why did the coffee file a police report?", punchline: "It got mugged." },
      { setup: "I asked my dog what 2 minus 2 is.", punchline: "He said nothing." },
      { setup: "How do you make a tissue dance?", punchline: "Put a little boogie in it." },
    ];

    const joke = randomChoice(jokes);

    const embed = new EmbedBuilder()
      .setTitle('😂 Random Joke')
      .setDescription(joke.punchline
        ? `**${joke.setup}**\n\n||${joke.punchline}||`
        : `**${joke.setup}**`)
      .setColor(Colors.Yellow)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandEightball = {
  name: '8ball',
  aliases: ['8b', 'magic8'],
  description: 'Ask the magic 8-ball a question',
  usage: '<question>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const question = args.join(' ');
    if (!question) return message.reply({ embeds: [errorEmbed('Missing Question', 'Please ask a question!')] });

    const responses = {
      positive: [
        'It is certain.', 'It is decidedly so.', 'Without a doubt.', 'Yes, definitely.',
        'You may rely on it.', 'As I see it, yes.', 'Most likely.', 'Outlook good.',
        'Yes.', 'Signs point to yes.',
      ],
      neutral: [
        'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
        'Cannot predict now.', 'Concentrate and ask again.',
      ],
      negative: [
        "Don't count on it.", 'My reply is no.', 'My sources say no.',
        'Outlook not so good.', 'Very doubtful.',
      ],
    };

    const all     = [...responses.positive, ...responses.neutral, ...responses.negative];
    const answer  = randomChoice(all);
    const isPos   = responses.positive.includes(answer);
    const isNeg   = responses.negative.includes(answer);
    const color   = isPos ? Colors.Green : isNeg ? Colors.Red : Colors.Yellow;
    const emoji   = isPos ? '✅' : isNeg ? '❌' : '🤔';

    const embed = new EmbedBuilder()
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: '❓ Question', value: question },
        { name: `${emoji} Answer`, value: answer },
      )
      .setColor(color)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandShip = {
  name: 'ship',
  aliases: ['love', 'lovecalc'],
  description: 'Calculate love compatibility between two users',
  usage: '<@user1> [@user2]',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const user1 = message.mentions.users.first() || message.author;
    const user2 = message.mentions.users.at(1)
      || (message.mentions.users.size === 1 ? message.author : null)
      || await client.users.fetch(args[1]).catch(() => null)
      || message.author;

    if (user1.id === user2.id) {
      return message.reply({ embeds: [infoEmbed('Narcissist!', 'You can\'t ship someone with themselves... or can you? 💀')] });
    }

    // Deterministic compatibility based on user IDs for consistency
    const seed    = parseInt(user1.id.slice(-4)) + parseInt(user2.id.slice(-4));
    const percent = seed % 101;

    const bar    = progressBar(percent, 100);
    const hearts = ['💔', '❤️‍🔥', '💕', '❤️', '💞', '💖', '💘'][Math.floor(percent / 15)];
    const msgs   = [
      { min: 0,  max: 20, msg: 'Terrible match... 💔'          },
      { min: 21, max: 40, msg: 'Not great, not terrible... 😐'  },
      { min: 41, max: 60, msg: 'Could work with effort! 🤔'     },
      { min: 61, max: 75, msg: 'Good match! 💕'                 },
      { min: 76, max: 89, msg: 'Great match! ❤️'               },
      { min: 90, max: 100,msg: 'Perfect match! 💘'              },
    ];
    const verdict = msgs.find(m => percent >= m.min && percent <= m.max)?.msg || '❓';

    const name   = `${user1.username.slice(0, Math.floor(user1.username.length/2))}${user2.username.slice(Math.floor(user2.username.length/2))}`;

    const embed = new EmbedBuilder()
      .setTitle(`💘 Ship: ${name}`)
      .setDescription(`**${user1.username}** + **${user2.username}**\n\n${bar}\n**${percent}%** — ${verdict}`)
      .setColor(percent > 70 ? Colors.Red : Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandHug = {
  name: 'hug',
  aliases: ['cuddle'],
  description: 'Send a hug to someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone to hug!')] });

    const gifs = [
      'https://media.giphy.com/media/PHZ7v9tfT1En6/giphy.gif',
      'https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif',
      'https://media.giphy.com/media/wnsgren9NtITS/giphy.gif',
      'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
      'https://media.giphy.com/media/ZQN9jsRWp1M76/giphy.gif',
    ];

    const embed = new EmbedBuilder()
      .setTitle('🤗 Hug!')
      .setDescription(`**${message.author.username}** hugged **${target.username}**!`)
      .setImage(randomChoice(gifs))
      .setColor(Colors.Pink)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandSlap = {
  name: 'slap',
  aliases: ['smack'],
  description: 'Slap someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone to slap!')] });

    const gifs = [
      'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
      'https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif',
      'https://media.giphy.com/media/uqSU9IEYEKAbS/giphy.gif',
    ];

    const embed = new EmbedBuilder()
      .setTitle('👋 Slap!')
      .setDescription(`**${message.author.username}** slapped **${target.username}**!`)
      .setImage(randomChoice(gifs))
      .setColor(Colors.Orange)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandKiss = {
  name: 'kiss',
  aliases: ['smooch'],
  description: 'Kiss someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone to kiss!')] });

    if (target.id === message.author.id) {
      return message.reply({ embeds: [infoEmbed('Narcissist!', 'Kissing yourself? Bold move!')] });
    }

    const gifs = [
      'https://media.giphy.com/media/zkppEMFvRX5SC/giphy.gif',
      'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
      'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
    ];

    const embed = new EmbedBuilder()
      .setTitle('💋 Kiss!')
      .setDescription(`**${message.author.username}** kissed **${target.username}**!`)
      .setImage(randomChoice(gifs))
      .setColor(Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandPat = {
  name: 'pat',
  aliases: ['headpat', 'pet'],
  description: 'Pat someone on the head',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone to pat!')] });

    const gifs = [
      'https://media.giphy.com/media/4HP0ddZnNVvKU/giphy.gif',
      'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif',
      'https://media.giphy.com/media/109ltuoSQT212w/giphy.gif',
    ];

    const embed = new EmbedBuilder()
      .setTitle('✋ Pat!')
      .setDescription(`**${message.author.username}** patted **${target.username}**!`)
      .setImage(randomChoice(gifs))
      .setColor(Colors.Green)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandHighfive = {
  name: 'highfive',
  aliases: ['hi5'],
  description: 'High five someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone!')] });

    const embed = new EmbedBuilder()
      .setTitle('🙌 High Five!')
      .setDescription(`**${message.author.username}** high-fived **${target.username}**! ✋🏻`)
      .setColor(Colors.Yellow)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandBite = {
  name: 'bite',
  aliases: ['nom'],
  description: 'Bite someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Missing User', 'Please mention someone!')] });

    const msgs = [
      `**${message.author.username}** bit **${target.username}**! Ouch! 🦷`,
      `**${message.author.username}** nibbled on **${target.username}**! 😮`,
      `**${target.username}** got chomped by **${message.author.username}**! 🦷`,
    ];

    const embed = new EmbedBuilder()
      .setTitle('🦷 Bite!')
      .setDescription(randomChoice(msgs))
      .setColor(Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandRps = {
  name: 'rps',
  aliases: ['rockpaperscissors'],
  description: 'Play Rock, Paper, Scissors',
  usage: '<rock|paper|scissors>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const choices = ['rock', 'paper', 'scissors'];
    const emojis  = { rock: '🪨', paper: '📄', scissors: '✂️' };
    const player  = args[0]?.toLowerCase();

    if (!choices.includes(player)) {
      return message.reply({ embeds: [errorEmbed('Invalid Choice', 'Choose `rock`, `paper`, or `scissors`.')] });
    }

    const bot     = randomChoice(choices);
    const wins    = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const playerWin = wins[player] === bot;
    const tie       = player === bot;

    const result = tie ? '🤝 It\'s a tie!' : playerWin ? '🎉 You win!' : '😔 I win!';
    const color  = tie ? Colors.Yellow : playerWin ? Colors.Green : Colors.Red;

    const embed = new EmbedBuilder()
      .setTitle('✊ Rock Paper Scissors')
      .addFields(
        { name: '👤 You', value: `${emojis[player]} ${player}`, inline: true },
        { name: '🤖 Bot', value: `${emojis[bot]} ${bot}`,       inline: true },
        { name: '🏆 Result', value: result, inline: false },
      )
      .setColor(color)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandWould = {
  name: 'wouldyourather',
  aliases: ['wyr', 'rather'],
  description: 'Would you rather question',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const questions = [
      ['Be able to fly', 'Be able to be invisible'],
      ['Always be 10 minutes late', 'Always be 20 minutes early'],
      ['Have more time', 'Have more money'],
      ['Be able to speak all languages', 'Be able to talk to animals'],
      ['Live without music', 'Live without TV'],
      ['Never use social media again', 'Never watch another movie'],
      ['Be famous but unhappy', 'Be unknown but happy'],
      ['Have a rewind button for your life', 'Have a pause button'],
      ['Always be cold', 'Always be hot'],
      ['Know how you will die', 'Know when you will die'],
      ['Have super strength', 'Have super speed'],
      ['Live in the city', 'Live in the countryside'],
    ];

    const [a, b] = randomChoice(questions);

    const embed = new EmbedBuilder()
      .setTitle('🤔 Would You Rather...')
      .setDescription(`**A:** ${a}\n\n**OR**\n\n**B:** ${b}`)
      .setFooter({ text: 'React with 🅰️ or 🅱️!' })
      .setColor(Colors.Blue)
      .setTimestamp();

    const msg = await message.reply({ embeds: [embed] });
    await msg.react('🅰️').catch(() => {});
    await msg.react('🅱️').catch(() => {});
  },
};

const commandTruthordare = {
  name: 'truthordare',
  aliases: ['tod', 'td'],
  description: 'Truth or Dare',
  usage: '[truth|dare]',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const truths = [
      'What is your biggest fear?',
      'What is the most embarrassing thing you\'ve ever done?',
      'Have you ever lied to a friend to avoid hanging out with them?',
      'What\'s your most embarrassing moment?',
      'Have you ever cheated on a test?',
      'What is a secret you\'ve never told anyone?',
      'Who is your celebrity crush?',
      'What\'s the worst gift you\'ve ever received?',
      'Have you ever been caught lying?',
      'What\'s your biggest regret?',
    ];

    const dares = [
      'Do your best impression of a famous person.',
      'Speak in an accent for the next 3 messages.',
      'Write a poem about the person to your left.',
      'Post the 5th photo in your gallery.',
      'Change your nickname to something the group decides.',
      'Say something nice to every person in the chat.',
      'Type a message with your elbow.',
      'Talk in third person for the next 5 minutes.',
      'Share your last Google search.',
      'Do 10 pushups.',
    ];

    const choice = args[0]?.toLowerCase();
    const isTruth = !choice || choice === 'truth' || (choice !== 'dare' && Math.random() < 0.5);

    const text  = isTruth ? randomChoice(truths) : randomChoice(dares);
    const title = isTruth ? '🤔 Truth' : '🎲 Dare';
    const color = isTruth ? Colors.Blue : Colors.Red;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(text)
      .setColor(color)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('tod_truth').setLabel('Truth').setStyle(ButtonStyle.Primary).setEmoji('🤔'),
      new ButtonBuilder().setCustomId('tod_dare').setLabel('Dare').setStyle(ButtonStyle.Danger).setEmoji('🎲'),
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      await i.deferUpdate();
      const pick  = i.customId === 'tod_truth';
      const newText = pick ? randomChoice(truths) : randomChoice(dares);
      const newEmbed = new EmbedBuilder()
        .setTitle(pick ? '🤔 Truth' : '🎲 Dare')
        .setDescription(newText)
        .setColor(pick ? Colors.Blue : Colors.Red)
        .setTimestamp();
      await msg.edit({ embeds: [newEmbed], components: [row] });
    });
  },
};

const commandRandom = {
  name: 'random',
  aliases: ['rand', 'randomnumber'],
  description: 'Generate a random number',
  usage: '[min] [max]',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const min = parseInt(args[0]) || 1;
    const max = parseInt(args[1]) || 100;

    if (min >= max) return message.reply({ embeds: [errorEmbed('Invalid Range', 'Max must be greater than min.')] });

    const num = randInt(min, max);

    const embed = new EmbedBuilder()
      .setTitle('🎲 Random Number')
      .setDescription(`**${num}**`)
      .setFooter({ text: `Range: ${min}–${max}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandChoose = {
  name: 'choose',
  aliases: ['pick', 'decide'],
  description: 'Choose between multiple options',
  usage: '<option1> | <option2> [| option3...]',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const options = args.join(' ').split('|').map(o => o.trim()).filter(Boolean);

    if (options.length < 2) return message.reply({ embeds: [errorEmbed('Too Few Options', 'Please provide at least 2 options separated by `|`.')] });

    const chosen = randomChoice(options);

    const embed = new EmbedBuilder()
      .setTitle('🎯 Decision Made!')
      .setDescription(`I choose: **${chosen}**`)
      .addFields({ name: 'Options', value: options.map((o, i) => `${i+1}. ${o}`).join('\n') })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandRate = {
  name: 'rate',
  aliases: ['rateme', 'score'],
  description: 'Rate something out of 10',
  usage: '<thing>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const thing = args.join(' ');
    if (!thing) return message.reply({ embeds: [errorEmbed('Missing Input', 'What would you like rated?')] });

    // Pseudo-random but consistent for same input
    const hash = thing.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffffff, 0);
    const rate  = Math.abs(hash % 11);

    const msgs = [
      'Terrible! 💀',
      'Very poor.',
      'Not great.',
      'Below average.',
      'Average.',
      'Decent.',
      'Good.',
      'Pretty good! 👍',
      'Great! 🌟',
      'Excellent! ⭐',
      '**PERFECT!** 💯',
    ];

    const embed = new EmbedBuilder()
      .setTitle('⭐ Rating')
      .setDescription(`**${thing}**: **${rate}/10** — ${msgs[rate]}`)
      .setColor(rate >= 7 ? Colors.Green : rate >= 4 ? Colors.Yellow : Colors.Red)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandNsfw = {
  name: 'pp',
  aliases: ['ppsize', 'ppmeasure'],
  description: 'Measure pp size (joke command)',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const hash = parseInt(user.id.slice(-4)) % 21;
    const bar  = '=' .repeat(hash);

    const embed = new EmbedBuilder()
      .setTitle(`📏 PP Measurer`)
      .setDescription(`**${user.username}:**\n8${bar}D\n\n**Size:** ${hash} cm`)
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandTrivia = {
  name: 'trivia',
  aliases: ['quiz', 'question'],
  description: 'Answer a trivia question',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const questions = [
      { q: 'What is the capital of France?', a: 'paris',      options: ['London', 'Paris', 'Berlin', 'Madrid'] },
      { q: 'How many planets are in the solar system?', a: '8', options: ['7', '8', '9', '10'] },
      { q: 'What is 12 × 12?', a: '144',                       options: ['124', '132', '144', '148'] },
      { q: 'What is the chemical symbol for water?', a: 'h2o', options: ['H2O', 'CO2', 'NaCl', 'O2'] },
      { q: 'Who painted the Mona Lisa?', a: 'da vinci',        options: ['Picasso', 'Da Vinci', 'Rembrandt', 'Monet'] },
      { q: 'What is the largest planet in our solar system?', a: 'jupiter', options: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'] },
      { q: 'In what year did World War II end?', a: '1945',    options: ['1943', '1944', '1945', '1946'] },
      { q: 'What is the fastest land animal?', a: 'cheetah',  options: ['Lion', 'Cheetah', 'Horse', 'Jaguar'] },
      { q: 'What language does "Google" originally come from?', a: 'math', options: ['Math', 'Latin', 'German', 'English'] },
      { q: 'How many sides does a hexagon have?', a: '6',      options: ['5', '6', '7', '8'] },
    ];

    const item = randomChoice(questions);
    const shuffled = shuffle(item.options);
    const letters  = ['A', 'B', 'C', 'D'];

    const embed = new EmbedBuilder()
      .setTitle('🧠 Trivia Question')
      .setDescription(`**${item.q}**\n\n${shuffled.map((o, i) => `${letters[i]}. ${o}`).join('\n')}`)
      .setFooter({ text: 'You have 30 seconds! Type the letter of your answer.' })
      .setColor(Colors.Blue)
      .setTimestamp();

    const msg = await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && letters.includes(m.content.toUpperCase());
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });

    collector.on('collect', async m => {
      const chosen = shuffled[letters.indexOf(m.content.toUpperCase())].toLowerCase();
      const correct = chosen === item.a.toLowerCase() || shuffled[letters.indexOf(m.content.toUpperCase())] === item.a;

      if (correct) {
        await m.reply({ embeds: [successEmbed('Correct! ✅', `**${item.a}** is right! +50 XP`)] });
        const entry = getLevelEntry(message.guild?.id || 'dm', message.author.id);
        entry.xp += 50;
      } else {
        await m.reply({ embeds: [errorEmbed('Wrong! ❌', `The correct answer was **${item.a}**.`)] });
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time' && collected.size === 0) {
        await msg.reply({ embeds: [warnEmbed('Time\'s Up!', `The correct answer was **${item.a}**.`)] });
      }
    });
  },
};

const commandNeverhaveIever = {
  name: 'neverhaveiever',
  aliases: ['nhie', 'nhi'],
  description: 'Never Have I Ever statement',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const statements = [
      'Never have I ever lied to get out of trouble.',
      'Never have I ever pulled an all-nighter.',
      'Never have I ever gone a whole day without my phone.',
      'Never have I ever eaten an entire pizza by myself.',
      'Never have I ever accidentally sent a text to the wrong person.',
      'Never have I ever skipped class/work.',
      'Never have I ever cried during a movie.',
      'Never have I ever sung in the shower.',
      'Never have I ever fallen asleep during a meeting.',
      'Never have I ever been on a rollercoaster.',
      'Never have I ever stayed up all night gaming.',
      'Never have I ever drank coffee before sleeping and actually slept.',
    ];

    const embed = new EmbedBuilder()
      .setTitle('🤚 Never Have I Ever')
      .setDescription(`**${randomChoice(statements)}**`)
      .setFooter({ text: 'React with 🤚 if you HAVE done this!' })
      .setColor(Colors.Orange)
      .setTimestamp();

    const msg = await message.reply({ embeds: [embed] });
    await msg.react('🤚').catch(() => {});
  },
};

const commandSay = {
  name: 'say',
  aliases: ['echo', 'repeat'],
  description: 'Make the bot say something',
  usage: '<message>',
  category: 'Fun',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide a message.')] });

    await message.delete().catch(() => {});
    await message.channel.send({ content: text });
  },
};

const commandEmbed = {
  name: 'embed',
  aliases: ['embedsay'],
  description: 'Make the bot send an embed',
  usage: '<title> | <description> | [color]',
  category: 'Fun',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const parts = args.join(' ').split('|').map(p => p.trim());
    if (parts.length < 2) return message.reply({ embeds: [errorEmbed('Invalid Format', 'Usage: `!embed <title> | <description> [| color]`')] });

    const [title, description, colorStr] = parts;
    let color = Colors.Blue;

    if (colorStr) {
      const c = parseInt(colorStr.replace('#', ''), 16);
      if (!isNaN(c)) color = c;
    }

    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: `Posted by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    await message.channel.send({ embeds: [embed] });
  },
};

const commandReverse = {
  name: 'reverse',
  aliases: ['rev', 'backwards'],
  description: 'Reverse a string',
  usage: '<text>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide some text.')] });

    const reversed = text.split('').reverse().join('');
    message.reply({ embeds: [infoEmbed('Reversed', `Original: ${text}\nReversed: ${reversed}`)] });
  },
};

const commandMorse = {
  name: 'morse',
  aliases: ['morseCode'],
  description: 'Convert text to Morse code',
  usage: '<text>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const text = args.join(' ').toUpperCase();
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide some text.')] });

    const code = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
      H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
      O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
      V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
      '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
      '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
      ' ': '/',
    };

    const result = text.split('').map(c => code[c] || c).join(' ');

    if (result.length > 1024) return message.reply({ embeds: [errorEmbed('Too Long', 'Text is too long to convert.')] });

    message.reply({ embeds: [infoEmbed('Morse Code', `**Input:** ${text}\n**Morse:** \`${result}\``)] });
  },
};

const commandBinary = {
  name: 'binary',
  aliases: ['bin'],
  description: 'Convert text to binary',
  usage: '<text>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide some text.')] });

    const result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');

    if (result.length > 1024) return message.reply({ embeds: [errorEmbed('Too Long', 'Text is too long to convert.')] });

    message.reply({ embeds: [infoEmbed('Binary', `**Text:** ${text}\n**Binary:** \`${result}\``)] });
  },
};

const commandAscii = {
  name: 'ascii',
  aliases: ['letterize'],
  description: 'Convert text to ASCII art (block letters)',
  usage: '<text>',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const text = args.join(' ').toUpperCase().slice(0, 10);
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide some text.')] });

    // Simple block font
    const font = {
      A: ['█▀█','█▀█','▀ ▀'], B: ['█▀▄','█▀▄','▀▀ '],
      C: ['█▀▀','█  ','▀▀▀'], D: ['█▀▄','█ █','▀▀ '],
      E: ['█▀▀','█▀▀','▀▀▀'], F: ['█▀▀','█▀▀','▀  '],
      G: ['█▀▀','█ █','▀▀█'], H: ['█ █','█▀█','▀ ▀'],
      I: ['▀█▀','▄█▄','▀█▀'], J: ['  █',' ▄█','▀▀ '],
      K: ['█ █','██ ','▀ ▀'], L: ['█  ','█  ','▀▀▀'],
      M: ['█▄█','█ █','█ █'], N: ['█▄█','█ █','█ █'],
      O: ['█▀█','█ █','▀▀▀'], P: ['█▀█','█▀▀','▀  '],
      Q: ['█▀█','█ █','▀▀█'], R: ['█▀█','█▀▄','▀ ▀'],
      S: ['▀▀▀','▀▀█','▀▀▀'], T: ['▀█▀',' █ ',' █ '],
      U: ['█ █','█ █','▀▀▀'], V: ['█ █','█ █',' ▀ '],
      W: ['█ █','█ █','█▄█'], X: ['█ █',' █ ','█ █'],
      Y: ['█ █',' █ ',' █ '], Z: ['▀▀█',' █ ','█▀▀'],
      ' ': ['   ','   ','   '],
      '0': ['█▀█','█ █','▀▀▀'], '1': [' █ ','▄█ ',' █ '],
      '2': ['▀▀█','▄▀ ','▀▀▀'], '3': ['▀▀█',' ▀█','▀▀▀'],
      '4': ['█ █','▀▀█','  █'], '5': ['█▀▀','▀▀▀','▀▀▀'],
      '6': ['█  ','█▀█','▀▀▀'], '7': ['▀▀█',' █ ',' █ '],
      '8': ['█▀█','█▀█','▀▀▀'], '9': ['█▀█','▀▀█','  █'],
    };

    const rows = ['', '', ''];
    for (const char of text) {
      const glyph = font[char] || ['?','?','?'];
      rows[0] += glyph[0] + ' ';
      rows[1] += glyph[1] + ' ';
      rows[2] += glyph[2] + ' ';
    }

    const art = rows.join('\n');
    if (art.length > 1800) return message.reply({ embeds: [errorEmbed('Too Long', 'Text is too long.')] });

    message.reply({ content: `\`\`\`\n${art}\n\`\`\`` });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: GIVEAWAYS
// ══════════════════════════════════════════════════════════════

const commandGiveaway = {
  name: 'giveaway',
  aliases: ['gw'],
  description: 'Manage giveaways (start|end|reroll)',
  usage: 'start <duration> <winners> <prize> | end <message_id> | reroll <message_id>',
  category: 'Giveaways',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'start') {
      const duration = parseDuration(args[1] || '');
      const winners  = parseInt(args[2]);
      const prize    = args.slice(3).join(' ');

      if (!duration) return message.reply({ embeds: [errorEmbed('Invalid Duration', 'Provide a valid duration (e.g. 1h, 1d).')] });
      if (isNaN(winners) || winners < 1) return message.reply({ embeds: [errorEmbed('Invalid Winners', 'Provide a valid number of winners.')] });
      if (!prize) return message.reply({ embeds: [errorEmbed('Missing Prize', 'Please provide a prize.')] });

      const ends = Date.now() + duration;

      const embed = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**Prize:** ${prize}\n\nReact with 🎉 to enter!\n\n**Ends:** <t:${Math.floor(ends/1000)}:R>\n**Winners:** ${winners}`)
        .setColor(Colors.Blue)
        .setFooter({ text: `Hosted by ${message.author.tag} | Ends` })
        .setTimestamp(ends);

      await message.delete().catch(() => {});
      const gwMsg = await message.channel.send({ embeds: [embed] });
      await gwMsg.react('🎉');

      db.giveaways.set(gwMsg.id, {
        channelId: message.channel.id,
        guildId:   message.guild.id,
        prize,
        winners,
        host:      message.author.id,
        ends,
        ended:     false,
        entries:   [],
      });

      setTimeout(() => endGiveaway(gwMsg.id, message.channel), duration);

      return;
    }

    if (sub === 'end') {
      const id = args[1];
      const gw = db.giveaways.get(id);
      if (!gw) return message.reply({ embeds: [errorEmbed('Not Found', 'No giveaway found with that message ID.')] });

      const ch = await client.channels.fetch(gw.channelId).catch(() => null);
      await endGiveaway(id, ch);
      return;
    }

    if (sub === 'reroll') {
      const id   = args[1];
      const gw   = db.giveaways.get(id);
      if (!gw || !gw.ended) return message.reply({ embeds: [errorEmbed('Not Found', 'No ended giveaway found with that ID.')] });

      const count    = parseInt(args[2]) || 1;
      const winners  = shuffle(gw.entries).slice(0, count);
      const mentions = winners.map(id => `<@${id}>`).join(', ');

      const ch = await client.channels.fetch(gw.channelId).catch(() => null);
      if (ch) {
        await ch.send({ content: `🎉 **Rerolled winners!** Congratulations ${mentions}! You won **${gw.prize}**!` });
      }

      return;
    }

    message.reply({ embeds: [infoEmbed('Giveaway Usage', '`!giveaway start <duration> <winners> <prize>`\n`!giveaway end <message_id>`\n`!giveaway reroll <message_id> [count]`')] });
  },
};

async function endGiveaway(messageId, channel) {
  const gw = db.giveaways.get(messageId);
  if (!gw || gw.ended) return;

  gw.ended = true;

  let msg;
  try {
    msg = await channel.messages.fetch(messageId);
  } catch (_) {
    return;
  }

  const reaction = msg.reactions.cache.get('🎉');
  const users    = reaction ? await reaction.users.fetch().then(u => [...u.values()].filter(u => !u.bot)) : [];

  gw.entries = users.map(u => u.id);

  if (users.length === 0) {
    await msg.edit({ embeds: [new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY ENDED')
      .setDescription(`**Prize:** ${gw.prize}\n\nNo winners — nobody entered.`)
      .setColor(Colors.Red)
      .setTimestamp()
    ] });
    await channel.send({ content: '🎉 The giveaway ended but nobody entered!' });
    return;
  }

  const winners = shuffle(users).slice(0, gw.winners);
  const mentions = winners.map(u => `<@${u.id}>`).join(', ');

  await msg.edit({ embeds: [new EmbedBuilder()
    .setTitle('🎉 GIVEAWAY ENDED')
    .setDescription(`**Prize:** ${gw.prize}\n\n**Winners:** ${mentions}`)
    .setColor(Colors.Green)
    .setTimestamp()
  ] });

  await channel.send({ content: `🎉 Congratulations ${mentions}! You won **${gw.prize}**!\n**Message:** ${messageLink(channel.id, msg.id, channel.guildId)}` });
}

// ══════════════════════════════════════════════════════════════
//  CATEGORY: TICKETS
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  🎫 ADVANCED TICKET SYSTEM v3.0
//  Features: Panels, Categories, Priority, Claims, Transcripts,
//            Ratings, Staff Stats, Blacklist, Auto-Close, Notifications
// ══════════════════════════════════════════════════════════════

// ── Helper: Get next ticket number for a guild ───────────────
function getNextTicketNumber(guildId) {
  const current = db.ticketCounters.get(guildId) || 0;
  const next = current + 1;
  db.ticketCounters.set(guildId, next);
  return next;
}

// ── Helper: Priority emoji/color mapping ─────────────────────
const TICKET_PRIORITIES = {
  low:    { emoji: '🟢', color: Colors.Green,  label: 'Low',    sla: 24 * 3600000 },
  normal: { emoji: '🔵', color: Colors.Blue,   label: 'Normal', sla: 12 * 3600000 },
  high:   { emoji: '🟠', color: Colors.Orange, label: 'High',   sla: 4  * 3600000 },
  urgent: { emoji: '🔴', color: Colors.Red,    label: 'Urgent', sla: 1  * 3600000 },
};

// ── Helper: Get staff stats ──────────────────────────────────
function getStaffStats(guildId, userId) {
  const key = `${guildId}_${userId}`;
  if (!db.ticketStaffStats.has(key)) {
    db.ticketStaffStats.set(key, { claimed: 0, closed: 0, ratingSum: 0, ratingCount: 0 });
  }
  return db.ticketStaffStats.get(key);
}

// ── Helper: Build main ticket control row ────────────────────
function buildTicketControlRow(ticket) {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Close')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'),
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel(ticket?.claimedBy ? 'Unclaim' : 'Claim')
      .setStyle(ticket?.claimedBy ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('✋'),
    new ButtonBuilder()
      .setCustomId('ticket_priority')
      .setLabel('Priority')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⚡'),
    new ButtonBuilder()
      .setCustomId('ticket_transcript')
      .setLabel('Transcript')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📄'),
    new ButtonBuilder()
      .setCustomId('ticket_adduser')
      .setLabel('Add User')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('➕'),
  );
  return [row1];
}

// ── Helper: Build ticket info embed ──────────────────────────
function buildTicketEmbed(ticket, guild) {
  const priority = TICKET_PRIORITIES[ticket.priority || 'normal'];
  const user     = guild.members.cache.get(ticket.userId);
  const claimer  = ticket.claimedBy ? guild.members.cache.get(ticket.claimedBy) : null;

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket #${String(ticket.number).padStart(4, '0')} — ${ticket.subject || 'Support Request'}`)
    .setDescription(
      `**Opened by:** ${user ? user.toString() : `<@${ticket.userId}>`}\n` +
      `**Category:** ${ticket.category || 'General'}\n` +
      `**Priority:** ${priority.emoji} ${priority.label}\n` +
      `**Claimed by:** ${claimer ? claimer.toString() : '*Unclaimed*'}\n\n` +
      `**Reason:**\n> ${ticket.reason || '*No reason provided*'}`
    )
    .addFields(
      { name: '📅 Opened',    value: `<t:${Math.floor(ticket.opened / 1000)}:R>`, inline: true },
      { name: '⏱️ Last Activity', value: `<t:${Math.floor((ticket.lastActivity || ticket.opened) / 1000)}:R>`, inline: true },
      { name: '🆔 Ticket ID',  value: `\`${ticket.channelId}\``, inline: true },
    )
    .setColor(priority.color)
    .setFooter(brandFooter())
    .setTimestamp();

  if (user) embed.setThumbnail(user.user.displayAvatarURL());

  return embed;
}

// ── 🎫 MAIN TICKET COMMAND (Interactive Panel Creation) ──────
const commandTicket = {
  name: 'ticket',
  aliases: ['support', 'tickets'],
  description: 'Advanced ticket system — panels, categories, priority, transcripts',
  usage: 'setup | panel | close | claim | add | remove | priority | rename | transfer | stats | blacklist | list | info',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const sub    = args[0]?.toLowerCase();
    const config = getGuildConfig(message.guild.id);

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: setup — Quick interactive setup
    // ═══════════════════════════════════════════════════════
    if (sub === 'setup') {
      if (!hasPermission(message.member, PermissionFlagsBits.ManageGuild)) {
        return message.reply({ embeds: [errorEmbed('Permission Denied', 'You need **Manage Server** permission.')] });
      }

      const modal = new ModalBuilder()
        .setCustomId('ticket_setup_modal')
        .setTitle('🎫 Ticket Panel Setup');

      const titleInput = new TextInputBuilder()
        .setCustomId('panel_title')
        .setLabel('Panel Title')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('🎫 Support Tickets')
        .setMaxLength(100)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('panel_description')
        .setLabel('Panel Description')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Click the button below to open a ticket.\nOur staff will respond shortly.')
        .setMaxLength(1000)
        .setRequired(true);

      const categoryInput = new TextInputBuilder()
        .setCustomId('panel_category')
        .setLabel('Ticket Category ID (channel category)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Leave empty for no category')
        .setMaxLength(25)
        .setRequired(false);

      const staffRoleInput = new TextInputBuilder()
        .setCustomId('panel_staffrole')
        .setLabel('Staff Role ID (optional)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Role ID that can see all tickets')
        .setMaxLength(25)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(categoryInput),
        new ActionRowBuilder().addComponents(staffRoleInput),
      );

      return message.reply({ embeds: [infoEmbed('Setup Started', 'Fill the form below to configure the ticket panel.')] })
        .then(() => message.author.send({ content: '🎫 Ticket Setup:', components: [modal] }).catch(() => {}));
    }

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: panel — Send/create a ticket panel
    // ═══════════════════════════════════════════════════════
    if (sub === 'panel') {
      if (!hasPermission(message.member, PermissionFlagsBits.ManageGuild)) {
        return message.reply({ embeds: [errorEmbed('Permission Denied', 'You need **Manage Server** permission.')] });
      }

      const panelId = args[1]?.toLowerCase() || 'default';
      const panel   = db.ticketPanels.get(`${message.guild.id}_${panelId}`);

      const title       = panel?.title       || '🎫 Support Tickets';
      const description = panel?.description || '**Click the button below to open a ticket.**\n\n> 📋 Our staff team will assist you as soon as possible.\n> ⏱️ Average response time: **under 1 hour**.';
      const buttonLabel = panel?.buttonLabel || 'Open Ticket';
      const buttonEmoji = panel?.emoji       || '🎫';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(Colors.Blue)
        .setFooter(brandFooter())
        .setTimestamp();

      if (message.guild.iconURL()) embed.setThumbnail(message.guild.iconURL());

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_open_${panelId}`)
          .setLabel(buttonLabel)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(buttonEmoji),
      );

      const panelMsg = await message.channel.send({ embeds: [embed], components: [row] });

      db.ticketPanels.set(panelMsg.id, {
        messageId:   panelMsg.id,
        channelId:   message.channel.id,
        guildId:     message.guild.id,
        panelId,
        title,
        description,
        buttonLabel,
        emoji: buttonEmoji,
      });

      return message.reply({ embeds: [successEmbed('Panel Created', `Ticket panel posted in ${message.channel}!\n**Panel ID:** \`${panelId}\``)] })
        .then(m => safeDelete(m, 5000));
    }

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: list — List all open tickets
    // ═══════════════════════════════════════════════════════
    if (sub === 'list') {
      if (!hasPermission(message.member, PermissionFlagsBits.ManageChannels)) {
        return message.reply({ embeds: [errorEmbed('Permission Denied', 'You need **Manage Channels** permission.')] });
      }

      const openTickets = [...db.tickets.values()].filter(t => t.guildId === message.guild.id && !t.closed);

      if (openTickets.length === 0) {
        return message.reply({ embeds: [infoEmbed('No Open Tickets', 'There are currently no open tickets in this server.')] });
      }

      const page = parseInt(args[1]) || 1;
      const { items, total } = paginate(openTickets, page, 10);

      const lines = await Promise.all(items.map(async t => {
        const priority = TICKET_PRIORITIES[t.priority || 'normal'];
        const user     = await client.users.fetch(t.userId).catch(() => ({ tag: 'Unknown' }));
        const claimer  = t.claimedBy ? await client.users.fetch(t.claimedBy).catch(() => ({ tag: 'None' })) : { tag: 'None' };
        return `${priority.emoji} **#${String(t.number).padStart(4,'0')}** | <#${t.channelId}>\n> 👤 ${user.tag} | 👨‍💼 ${claimer.tag} | 📂 ${t.category || 'General'}`;
      }));

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Open Tickets (${openTickets.length})`)
        .setDescription(lines.join('\n\n'))
        .setFooter({ text: `Page ${page}/${total} • ${BOT_NAME}` })
        .setColor(Colors.Blue)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: info — Ticket details
    // ═══════════════════════════════════════════════════════
    if (sub === 'info') {
      const ticket = db.tickets.get(message.channel.id);
      if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This command only works in ticket channels.')] });

      const priority = TICKET_PRIORITIES[ticket.priority || 'normal'];
      const user     = await client.users.fetch(ticket.userId).catch(() => ({ tag: 'Unknown', id: ticket.userId }));
      const claimer  = ticket.claimedBy ? await client.users.fetch(ticket.claimedBy).catch(() => ({ tag: 'None' })) : null;

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket Info — #${String(ticket.number).padStart(4, '0')}`)
        .addFields(
          { name: '👤 Owner',     value: `${user.tag} (<@${user.id}>)`,                inline: true },
          { name: '👨‍💼 Claimed By', value: claimer ? `${claimer.tag} (<@${claimer.id}>)` : 'Unclaimed', inline: true },
          { name: '📂 Category',  value: ticket.category || 'General',                 inline: true },
          { name: '⚡ Priority',  value: `${priority.emoji} ${priority.label}`,       inline: true },
          { name: '📅 Opened',    value: `<t:${Math.floor(ticket.opened/1000)}:F>`,    inline: true },
          { name: '🔄 Last Active', value: `<t:${Math.floor((ticket.lastActivity || ticket.opened)/1000)}:R>`, inline: true },
          { name: '📝 Subject',   value: ticket.subject || '*No subject*' },
          { name: '💬 Reason',    value: ticket.reason || '*No reason*' },
          { name: '🆔 Channel ID', value: `\`${ticket.channelId}\``,                    inline: true },
        )
        .setColor(priority.color)
        .setFooter(brandFooter())
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: stats — Staff statistics
    // ═══════════════════════════════════════════════════════
    if (sub === 'stats') {
      const target = message.mentions.users.first()
        || await client.users.fetch(args[1]).catch(() => null)
        || message.author;

      const stats = getStaffStats(message.guild.id, target.id);
      const avgRating = stats.ratingCount > 0 ? (stats.ratingSum / stats.ratingCount).toFixed(2) : 'N/A';

      const embed = new EmbedBuilder()
        .setTitle(`📊 Staff Stats — ${target.tag}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '✋ Tickets Claimed', value: `${stats.claimed}`,              inline: true },
          { name: '🔒 Tickets Closed',  value: `${stats.closed}`,               inline: true },
          { name: '⭐ Average Rating', value: `${avgRating} / 5`,               inline: true },
          { name: '📝 Ratings Count',  value: `${stats.ratingCount}`,           inline: true },
        )
        .setColor(Colors.Blue)
        .setFooter(brandFooter())
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ═══════════════════════════════════════════════════════
    //  SUBCOMMAND: blacklist — Blacklist users from tickets
    // ═══════════════════════════════════════════════════════
    if (sub === 'blacklist') {
      if (!hasPermission(message.member, PermissionFlagsBits.ManageGuild)) {
        return message.reply({ embeds: [errorEmbed('Permission Denied', 'You need **Manage Server** permission.')] });
      }

      const action = args[1]?.toLowerCase();
      const target = message.mentions.users.first()
        || await client.users.fetch(args[2]).catch(() => null);
      const key = target ? `${message.guild.id}_${target.id}` : null;

      if (action === 'add' && target) {
        const reason = args.slice(3).join(' ') || 'No reason provided';
        db.ticketBlacklist.set(key, reason);
        return message.reply({ embeds: [successEmbed('Blacklisted', `${target.tag} has been blacklisted from creating tickets.\n**Reason:** ${reason}`)] });
      }

      if (action === 'remove' && target) {
        db.ticketBlacklist.delete(key);
        return message.reply({ embeds: [successEmbed('Removed', `${target.tag} has been removed from the ticket blacklist.`)] });
      }

      if (action === 'list') {
        const entries = [...db.ticketBlacklist.entries()].filter(([k]) => k.startsWith(`${message.guild.id}_`));
        if (entries.length === 0) return message.reply({ embeds: [infoEmbed('Blacklist', 'No users are blacklisted.')] });

        const lines = await Promise.all(entries.map(async ([k, r]) => {
          const uid  = k.split('_')[1];
          const user = await client.users.fetch(uid).catch(() => ({ tag: 'Unknown' }));
          return `• **${user.tag}** (\`${uid}\`) — ${r}`;
        }));

        return message.reply({ embeds: [infoEmbed('Ticket Blacklist', lines.join('\n'))] });
      }

      return message.reply({ embeds: [infoEmbed('Blacklist Usage', '`!ticket blacklist add @user [reason]`\n`!ticket blacklist remove @user`\n`!ticket blacklist list`')] });
    }

    // ═══════════════════════════════════════════════════════
    //  DEFAULT: Create ticket directly (legacy behavior + upgrade)
    // ═══════════════════════════════════════════════════════
    if (!sub || sub === 'open' || sub === 'create') {
      // Check blacklist
      if (db.ticketBlacklist.has(`${message.guild.id}_${message.author.id}`)) {
        return message.reply({ embeds: [errorEmbed('Blacklisted', 'You are blacklisted from creating tickets.')] });
      }

      // Check existing ticket
      const existingTicket = [...db.tickets.values()].find(
        t => t.userId === message.author.id && t.guildId === message.guild.id && !t.closed
      );

      if (existingTicket) {
        const ch = await message.guild.channels.fetch(existingTicket.channelId).catch(() => null);
        return message.reply({ embeds: [errorEmbed('Ticket Exists', `You already have an open ticket: ${ch || 'Unknown channel'}.`)] });
      }

      // ═══════════════════════════════════════════════════════
      //  ✅ CHECK FOR MULTIPLE PANEL CATEGORIES
      //  If ticket categories are set, show a select menu
      // ═══════════════════════════════════════════════════════
      const categories = db.ticketCategories.get(message.guild.id);

      if (categories && Object.keys(categories).length > 0) {
        const options = Object.entries(categories).slice(0, 25).map(([key, c]) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(c.label || key)
            .setValue(key)
            .setDescription(c.description || 'Open a ticket in this category')
            .setEmoji(c.emoji || '🎫')
        );

        const selectRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ticket_category_select')
            .setPlaceholder('📂 Select a ticket category...')
            .addOptions(options),
        );

        const embed = new EmbedBuilder()
          .setTitle('🎫 Open a Ticket')
          .setDescription('Please select the category that best fits your issue from the menu below.')
          .setColor(Colors.Blue)
          .setFooter(brandFooter())
          .setTimestamp();

        return message.reply({ embeds: [embed], components: [selectRow] });
      }

      // ═══════════════════════════════════════════════════════
      //  LEGACY: Create ticket directly with reason
      // ═══════════════════════════════════════════════════════
      const reason = args.slice(1).join(' ') || 'No reason provided';
      const ticket = await createTicketChannel(message.guild, message.author, {
        reason,
        subject: reason.slice(0, 100),
        category: 'General',
        priority: 'normal',
        sourceChannel: message.channel,
      });

      if (ticket.error) return message.reply({ embeds: [errorEmbed('Error', ticket.error)] });

      return message.reply({ embeds: [successEmbed('Ticket Created', `Your ticket has been created: <#${ticket.channelId}>`)] });
    }

    // Help menu
    return message.reply({ embeds: [infoEmbed('🎫 Ticket System', [
      '`!ticket setup` — Interactive panel setup',
      '`!ticket panel [id]` — Post ticket panel in channel',
      '`!ticket list [page]` — List all open tickets',
      '`!ticket info` — Info about current ticket',
      '`!ticket stats [@user]` — Staff statistics',
      '`!ticket blacklist add/remove/list` — Manage blacklist',
      '',
      '**Inside a ticket:**',
      '`!ticket close [reason]` — Close the ticket',
      '`!ticket claim` — Claim the ticket',
      '`!ticket add @user` — Add a user to the ticket',
      '`!ticket remove @user` — Remove a user',
      '`!ticket rename <name>` — Rename ticket channel',
      '`!ticket priority <low|normal|high|urgent>` — Set priority',
      '`!ticket transfer @user` — Transfer ticket ownership',
    ].join('\n'))] });
  },
};

// ── 🔧 Core function: Create ticket channel ──────────────────
async function createTicketChannel(guild, user, options = {}) {
  const config = getGuildConfig(guild.id);

  try {
    const number     = getNextTicketNumber(guild.id);
    const parentId   = options.parentCategory || config.ticketCategory;
    const parent     = parentId ? await guild.channels.fetch(parentId).catch(() => null) : null;

    // Collect permissions
    const overwrites = [
      {
        id:   guild.roles.everyone,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id:    user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
      {
        id:    client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
        ],
      },
    ];

    // Add staff roles from category config
    const categories = db.ticketCategories.get(guild.id) || {};
    const catConfig  = options.categoryKey ? categories[options.categoryKey] : null;

    if (catConfig?.pingRoles?.length) {
      for (const roleId of catConfig.pingRoles) {
        overwrites.push({
          id:    roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
      }
    }

    // Add mute role bypass
    if (config.muteRole) {
      overwrites.push({
        id:    config.muteRole,
        deny:  [PermissionFlagsBits.ViewChannel],
      });
    }

    const channel = await guild.channels.create({
      name:   `ticket-${String(number).padStart(4, '0')}-${user.username.toLowerCase().slice(0, 20)}`,
      type:   ChannelType.GuildText,
      parent,
      topic:  `🎫 Ticket #${number} • Owner: ${user.tag} (${user.id}) • ${options.category || 'General'}`,
      permissionOverwrites: overwrites,
    });

    const ticketData = {
      channelId:    channel.id,
      number,
      userId:       user.id,
      guildId:      guild.id,
      opened:       Date.now(),
      lastActivity: Date.now(),
      closed:       false,
      claimedBy:    null,
      priority:     options.priority || 'normal',
      category:     options.category || 'General',
      categoryKey:  options.categoryKey || null,
      subject:      options.subject || 'Support Request',
      reason:       options.reason || 'No reason provided',
      transcript:   [],
      sourceChannel: options.sourceChannel?.id || null,
    };

    db.tickets.set(channel.id, ticketData);

    // Build the initial ticket embed
    const embed = buildTicketEmbed(ticketData, guild);
    const rows  = buildTicketControlRow(ticketData);

    // Ping roles if configured
    const pingContent = catConfig?.pingRoles?.length
      ? catConfig.pingRoles.map(r => `<@&${r}>`).join(' ')
      : '';

    const initialMsg = await channel.send({
      content: `${user} ${pingContent}`.trim(),
      embeds:  [embed],
      components: rows,
    });

    await initialMsg.pin().catch(() => {});

    // Store the initial message id
    ticketData.initialMessageId = initialMsg.id;

    // Send guidelines
    const guideEmbed = new EmbedBuilder()
      .setTitle('📌 Ticket Guidelines')
      .setDescription([
        '**Please follow these guidelines:**',
        '• Be respectful to staff members',
        '• Provide as much detail as possible',
        '• Do not ping staff repeatedly — we will respond ASAP',
        '• Do not open duplicate tickets',
        '',
        '**Commands you can use:**',
        '`!ticket close [reason]` — Close your ticket',
        '`!ticket info` — View ticket details',
      ].join('\n'))
      .setColor(Colors.Gray)
      .setFooter(brandFooter())
      .setTimestamp();

    await channel.send({ embeds: [guideEmbed] });

    return { channelId: channel.id, number, success: true };
  } catch (err) {
    return { error: err.message };
  }
}

// ── 📥 Helper: Generate ticket transcript ────────────────────
async function generateTicketTranscript(channel, ticket) {
  try {
    const messages = await channel.messages.fetch({ limit: 500 });
    const sorted   = [...messages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const lines = [
      `═══════════════════════════════════════════════════`,
      `          🎫 TICKET TRANSCRIPT — #${String(ticket.number).padStart(4, '0')}`,
      `═══════════════════════════════════════════════════`,
      ``,
      `📋 Channel:     #${channel.name}`,
      `🆔 Channel ID:  ${channel.id}`,
      `👤 Owner:       ${ticket.userId}`,
      `📂 Category:    ${ticket.category || 'General'}`,
      `⚡ Priority:    ${(ticket.priority || 'normal').toUpperCase()}`,
      `👨‍💼 Claimed By:  ${ticket.claimedBy || 'Unclaimed'}`,
      `📅 Opened:      ${new Date(ticket.opened).toLocaleString()}`,
      `📅 Closed:      ${new Date().toLocaleString()}`,
      `💬 Messages:    ${sorted.length}`,
      ``,
      `═══════════════════════════════════════════════════`,
      `                    MESSAGE LOG`,
      `═══════════════════════════════════════════════════`,
      ``,
    ];

    for (const msg of sorted) {
      const ts = new Date(msg.createdTimestamp).toLocaleString();
      const author = msg.author ? `${msg.author.tag} (${msg.author.id})` : 'Unknown';
      lines.push(`[${ts}] ${author}`);
      if (msg.content) lines.push(`  ${msg.content.replace(/\n/g, '\n  ')}`);
      if (msg.attachments.size > 0) {
        lines.push(`  📎 Attachments:`);
        for (const [, att] of msg.attachments) lines.push(`     • ${att.url}`);
      }
      if (msg.embeds.length > 0) {
        for (const e of msg.embeds) {
          if (e.title)       lines.push(`  📋 Embed: ${e.title}`);
          if (e.description) lines.push(`  ${e.description.replace(/\n/g, '\n  ')}`);
        }
      }
      lines.push('');
    }

    lines.push(`═══════════════════════════════════════════════════`);
    lines.push(`Generated by ${BOT_NAME} v${BOT_VERSION}`);
    lines.push(`═══════════════════════════════════════════════════`);

    return lines.join('\n');
  } catch (err) {
    return `Transcript generation failed: ${err.message}`;
  }
}

// ── 📥 Helper: Send transcript to log channel ────────────────
async function sendTicketTranscript(guild, ticket, transcriptContent, closedBy) {
  const config = getGuildConfig(guild.id);
  const logChannelId = config.ticketLogsChannel || config.modLogsChannel || config.logsChannel;
  if (!logChannelId) return;

  const logCh = await guild.channels.fetch(logChannelId).catch(() => null);
  if (!logCh) return;

  const buffer = Buffer.from(transcriptContent, 'utf8');
  const attachment = new AttachmentBuilder(buffer, {
    name: `ticket-${String(ticket.number).padStart(4, '0')}-${ticket.channelId}.txt`,
  });

  const priority = TICKET_PRIORITIES[ticket.priority || 'normal'];

  const embed = new EmbedBuilder()
    .setTitle(`📄 Ticket Transcript — #${String(ticket.number).padStart(4, '0')}`)
    .addFields(
      { name: '👤 Opened By',  value: `<@${ticket.userId}>`,                        inline: true },
      { name: '🔒 Closed By',  value: closedBy ? `<@${closedBy}>` : 'Auto',         inline: true },
      { name: '👨‍💼 Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Nobody', inline: true },
      { name: '📂 Category',   value: ticket.category || 'General',                 inline: true },
      { name: '⚡ Priority',   value: `${priority.emoji} ${priority.label}`,       inline: true },
      { name: '📅 Duration',   value: formatDuration(Date.now() - ticket.opened),   inline: true },
    )
    .setColor(Colors.Blue)
    .setFooter(brandFooter())
    .setTimestamp();

  await logCh.send({ embeds: [embed], files: [attachment] }).catch(() => {});
}

// ── 📥 Helper: Send rating DM ────────────────────────────────
async function sendTicketRating(guild, ticket, closedBy) {
  try {
    const user = await client.users.fetch(ticket.userId);
    if (!user) return;

    const embed = new EmbedBuilder()
      .setTitle('⭐ Rate your support experience')
      .setDescription(
        `Your ticket **#${String(ticket.number).padStart(4, '0')}** in **${guild.name}** has been closed.\n\n` +
        `**Closed by:** ${closedBy ? `<@${closedBy}>` : 'System'}\n` +
        `**Duration:** ${formatDuration(Date.now() - ticket.opened)}\n\n` +
        `Please take a moment to rate the support you received:`
      )
      .setColor(Colors.Gold)
      .setFooter(brandFooter())
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      [1, 2, 3, 4, 5].map(n => new ButtonBuilder()
        .setCustomId(`ticket_rate_${ticket.channelId}_${n}`)
        .setLabel(`${n} ⭐`)
        .setStyle(n >= 4 ? ButtonStyle.Success : n === 3 ? ButtonStyle.Primary : ButtonStyle.Danger)
      )
    );

    await user.send({ embeds: [embed], components: [row] }).catch(() => {});
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════
//  🎫 ADVANCED CLOSE TICKET COMMAND
// ══════════════════════════════════════════════════════════════
const commandCloseticket = {
  name: 'closeticket',
  aliases: ['close', 'closeall', 'ct'],
  description: 'Close a support ticket (with transcript + rating)',
  usage: '[reason]',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);

    if (!ticket) {
      // Legacy behavior: allow closing by "close" alias anywhere if user has manage channels
      if (message.member.permissions.has(PermissionFlagsBits.ManageChannels) && message.channel.name?.startsWith('ticket-')) {
        return message.reply({ embeds: [warnEmbed('Unknown Ticket', 'This channel looks like a ticket but has no data. Delete it manually.')] });
      }
      return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This command can only be used in ticket channels.')] });
    }

    if (ticket.closed) return message.reply({ embeds: [errorEmbed('Already Closed', 'This ticket is already closed.')] });

    const reason = args.join(' ') || 'No reason provided';

    // Permission check
    const canClose = message.author.id === ticket.userId
      || ticket.claimedBy === message.author.id
      || hasPermission(message.member, PermissionFlagsBits.ManageChannels);

    if (!canClose) {
      return message.reply({ embeds: [errorEmbed('Cannot Close', 'You do not have permission to close this ticket.')] });
    }

    // Mark as closed
    ticket.closed     = true;
    ticket.closedAt   = Date.now();
    ticket.closedBy   = message.author.id;
    ticket.closeReason = reason;

    // Staff stats: increment closed count
    if (ticket.claimedBy) {
      const stats = getStaffStats(message.guild.id, ticket.claimedBy);
      stats.closed++;
    }

    const priority = TICKET_PRIORITIES[ticket.priority || 'normal'];

    const closingEmbed = new EmbedBuilder()
      .setTitle('🔒 Closing Ticket...')
      .setDescription(
        `**Closed by:** ${message.author}\n` +
        `**Reason:** ${reason}\n` +
        `**Duration:** ${formatDuration(Date.now() - ticket.opened)}\n\n` +
        `> Generating transcript and sending to log channel...\n` +
        `> Channel will be deleted in **10 seconds**.`
      )
      .setColor(Colors.Red)
      .setFooter(brandFooter())
      .setTimestamp();

    await message.channel.send({ embeds: [closingEmbed] });

    // Generate transcript
    const transcript = await generateTicketTranscript(message.channel, ticket);

    // Send to log channel
    await sendTicketTranscript(message.guild, ticket, transcript, message.author.id);

    // Send DM to ticket owner with transcript (if they aren't the closer)
    if (ticket.userId !== message.author.id) {
      try {
        const owner = await client.users.fetch(ticket.userId);
        const buf   = Buffer.from(transcript, 'utf8');
        const file  = new AttachmentBuilder(buf, { name: `ticket-${ticket.number}-transcript.txt` });

        await owner.send({
          embeds: [new EmbedBuilder()
            .setTitle('🎫 Your Ticket Has Been Closed')
            .setDescription(
              `Your ticket **#${String(ticket.number).padStart(4, '0')}** in **${message.guild.name}** has been closed.\n\n` +
              `**Closed by:** ${message.author.tag}\n` +
              `**Reason:** ${reason}\n` +
              `**Duration:** ${formatDuration(Date.now() - ticket.opened)}`
            )
            .setColor(Colors.Red)
            .setFooter(brandFooter())
            .setTimestamp()
          ],
          files: [file],
        }).catch(() => {});
      } catch (_) {}
    }

    // Send rating DM to ticket owner
    await sendTicketRating(message.guild, ticket, message.author.id);

    // Delete channel after delay
    await sleep(10000);
    await message.channel.delete(`Ticket closed by ${message.author.tag}: ${reason}`).catch(() => {});
  },
};

// ── !ticket-add — Add user to ticket ─────────────────────────
const commandTicketAdd = {
  name: 'ticket-add',
  aliases: ['tadd'],
  description: 'Add a user to the current ticket',
  usage: '<@user>',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });
    if (ticket.closed) return message.reply({ embeds: [errorEmbed('Closed', 'This ticket is closed.')] });

    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === ticket.userId) return message.reply({ embeds: [errorEmbed('Already Owner', 'This user already owns the ticket.')] });

    try {
      await message.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });

      const embed = new EmbedBuilder()
        .setTitle('➕ User Added')
        .setDescription(`${target} has been added to the ticket by ${message.author}.`)
        .setColor(Colors.Green)
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

// ── !ticket-remove — Remove user from ticket ─────────────────
const commandTicketRemove = {
  name: 'ticket-remove',
  aliases: ['tremove'],
  description: 'Remove a user from the current ticket',
  usage: '<@user>',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });

    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === ticket.userId) return message.reply({ embeds: [errorEmbed('Cannot Remove Owner', 'You cannot remove the ticket owner.')] });
    if (target.id === client.user.id) return message.reply({ embeds: [errorEmbed('Cannot Remove Bot', 'You cannot remove the bot.')] });

    try {
      await message.channel.permissionOverwrites.delete(target.id);

      const embed = new EmbedBuilder()
        .setTitle('➖ User Removed')
        .setDescription(`${target} has been removed from the ticket.`)
        .setColor(Colors.Red)
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

// ── !ticket-claim — Claim the ticket ─────────────────────────
const commandTicketClaim = {
  name: 'ticket-claim',
  aliases: ['tclaim', 'claim'],
  description: 'Claim the current ticket',
  usage: '',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });
    if (ticket.closed) return message.reply({ embeds: [errorEmbed('Closed', 'This ticket is closed.')] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can claim tickets.')] });
    }

    if (ticket.claimedBy) {
      if (ticket.claimedBy === message.author.id) {
        ticket.claimedBy = null;
        await message.channel.send({ embeds: [warnEmbed('Ticket Unclaimed', `${message.author} has unclaimed the ticket.`)] });
        return;
      }
      const claimer = await client.users.fetch(ticket.claimedBy).catch(() => ({ tag: 'Unknown' }));
      return message.reply({ embeds: [errorEmbed('Already Claimed', `This ticket is already claimed by **${claimer.tag}**.`)] });
    }

    ticket.claimedBy = message.author.id;

    // Staff stats
    const stats = getStaffStats(message.guild.id, message.author.id);
    stats.claimed++;

    const embed = new EmbedBuilder()
      .setTitle('✋ Ticket Claimed')
      .setDescription(`${message.author} has claimed this ticket and will assist you.`)
      .setColor(Colors.Green)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};

// ── !ticket-priority — Change priority ───────────────────────
const commandTicketPriority = {
  name: 'ticket-priority',
  aliases: ['tpriority', 'priority'],
  description: 'Change the ticket priority',
  usage: '<low|normal|high|urgent>',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can change priority.')] });
    }

    const level = args[0]?.toLowerCase();
    if (!level || !TICKET_PRIORITIES[level]) {
      return message.reply({ embeds: [infoEmbed('Priority Usage', `Valid priorities: ${Object.keys(TICKET_PRIORITIES).map(p => `\`${p}\``).join(', ')}`)] });
    }

    ticket.priority = level;
    const priority  = TICKET_PRIORITIES[level];

    const embed = new EmbedBuilder()
      .setTitle(`${priority.emoji} Priority Changed`)
      .setDescription(`Ticket priority set to **${priority.label}** by ${message.author}.\n\n*SLA target: ${formatDuration(priority.sla)}*`)
      .setColor(priority.color)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};

// ── !ticket-rename — Rename the ticket channel ───────────────
const commandTicketRename = {
  name: 'ticket-rename',
  aliases: ['trename'],
  description: 'Rename the ticket channel',
  usage: '<new_name>',
  category: 'Tickets',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can rename tickets.')] });
    }

    const newName = args.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90);
    if (!newName) return message.reply({ embeds: [errorEmbed('Missing Name', 'Please provide a new name.')] });

    try {
      await message.channel.setName(newName);
      message.reply({ embeds: [successEmbed('Renamed', `Ticket renamed to \`${newName}\`.`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

// ── !ticket-transfer — Transfer ticket ownership ─────────────
const commandTicketTransfer = {
  name: 'ticket-transfer',
  aliases: ['ttransfer'],
  description: 'Transfer ticket ownership to another user',
  usage: '<@user>',
  category: 'Tickets',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });

    if (message.author.id !== ticket.userId && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({ embeds: [errorEmbed('Permission Denied', 'Only the owner or staff can transfer tickets.')] });
    }

    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === ticket.userId) return message.reply({ embeds: [errorEmbed('Same Owner', 'This user already owns the ticket.')] });
    if (target.bot) return message.reply({ embeds: [errorEmbed('Cannot Transfer to Bot', 'You cannot transfer a ticket to a bot.')] });

    try {
      // Remove old owner's view permission
      await message.channel.permissionOverwrites.delete(ticket.userId).catch(() => {});

      // Add new owner permissions
      await message.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });

      const oldOwner = ticket.userId;
      ticket.userId  = target.id;

      await message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🔄 Ticket Transferred')
          .setDescription(`Ownership transferred from <@${oldOwner}> to ${target}.\n**By:** ${message.author}`)
          .setColor(Colors.Blue)
          .setTimestamp()
        ]
      });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

// ── !ticket-transcript — Manually generate transcript ────────
const commandTicketTranscript = {
  name: 'ticket-transcript',
  aliases: ['ttranscript', 'transcript'],
  description: 'Generate a transcript of the current ticket',
  usage: '',
  category: 'Tickets',
  cooldown: 10,
  guildOnly: true,
  async execute(message) {
    const ticket = db.tickets.get(message.channel.id);
    if (!ticket) return message.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')] });

    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && message.author.id !== ticket.userId) {
      return message.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff or the ticket owner can request a transcript.')] });
    }

    const loading = await message.reply({ embeds: [infoEmbed('Generating...', 'Creating transcript, please wait...')] });

    const content = await generateTicketTranscript(message.channel, ticket);
    const buffer  = Buffer.from(content, 'utf8');
    const file    = new AttachmentBuilder(buffer, { name: `ticket-${ticket.number}-transcript.txt` });

    await loading.edit({
      embeds: [successEmbed('Transcript Generated', `Here is your transcript (${content.length.toLocaleString()} bytes).`)],
      files:  [file],
    });
  },
};

// ── !set-ticket-category — Configure ticket categories ──────
const commandSetTicketCategory = {
  name: 'set-ticket-category',
  aliases: ['ticketcategory-add', 'tc-add'],
  description: 'Add a ticket category (subtype with its own staff roles)',
  usage: '<key> <label> <emoji> [ping_role_ids space-separated]',
  category: 'Tickets',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const key   = args[0]?.toLowerCase();
    const label = args[1];
    const emoji = args[2] || '🎫';
    const roleIds = args.slice(3).filter(a => /^\d{17,20}$/.test(a));

    if (!key || !label) {
      return message.reply({ embeds: [infoEmbed('Usage', '`!set-ticket-category <key> <label> <emoji> [role_ids...]`\n\n**Example:**\n`!set-ticket-category bug Bug Report 🐛 123456789 987654321`')] });
    }

    if (!db.ticketCategories.has(message.guild.id)) {
      db.ticketCategories.set(message.guild.id, {});
    }

    const categories = db.ticketCategories.get(message.guild.id);
    categories[key] = {
      label,
      emoji,
      description: `Open a ticket for ${label}`,
      pingRoles: roleIds,
      parentCategory: null,
    };

    const embed = new EmbedBuilder()
      .setTitle('✅ Ticket Category Added')
      .setDescription(
        `**Key:** \`${key}\`\n` +
        `**Label:** ${label}\n` +
        `**Emoji:** ${emoji}\n` +
        `**Staff Roles:** ${roleIds.length ? roleIds.map(r => `<@&${r}>`).join(', ') : 'None'}`
      )
      .setColor(Colors.Green)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ── !remove-ticket-category — Remove a ticket category ───────
const commandRemoveTicketCategory = {
  name: 'remove-ticket-category',
  aliases: ['ticketcategory-remove', 'tc-remove'],
  description: 'Remove a ticket category',
  usage: '<key>',
  category: 'Tickets',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const key = args[0]?.toLowerCase();
    if (!key) return message.reply({ embeds: [errorEmbed('Missing Key', 'Provide the category key to remove.')] });

    const categories = db.ticketCategories.get(message.guild.id);
    if (!categories || !categories[key]) {
      return message.reply({ embeds: [errorEmbed('Not Found', `No category found with key \`${key}\`.`)] });
    }

    delete categories[key];
    message.reply({ embeds: [successEmbed('Category Removed', `Category \`${key}\` has been removed.`)] });
  },
};

// ── !list-ticket-categories — List all categories ────────────
const commandListTicketCategories = {
  name: 'list-ticket-categories',
  aliases: ['ticketcategories', 'tc-list'],
  description: 'List all configured ticket categories',
  usage: '',
  category: 'Tickets',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const categories = db.ticketCategories.get(message.guild.id) || {};
    const keys = Object.keys(categories);

    if (keys.length === 0) {
      return message.reply({ embeds: [infoEmbed('No Categories', 'No ticket categories have been configured.\nUse `!set-ticket-category` to add one.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📂 Ticket Categories (${keys.length})`)
      .setDescription(keys.map(k => {
        const c = categories[k];
        return `${c.emoji} **${c.label}** (\`${k}\`)\n> Staff Roles: ${c.pingRoles?.length ? c.pingRoles.map(r => `<@&${r}>`).join(', ') : 'None'}`;
      }).join('\n\n'))
      .setColor(Colors.Blue)
      .setFooter(brandFooter())
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ── !set-ticket-logs — Set ticket logs channel ───────────────
const commandSetTicketLogs = {
  name: 'set-ticket-logs',
  aliases: ['ticketlogs', 'tlogs'],
  description: 'Set the channel where ticket transcripts are sent',
  usage: '<#channel|off>',
  category: 'Tickets',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.ticketLogsChannel = null;
      return message.reply({ embeds: [successEmbed('Ticket Logs Disabled', 'Ticket transcripts will no longer be logged.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.ticketLogsChannel = channel.id;

    message.reply({ embeds: [successEmbed('Ticket Logs Set', `Ticket transcripts will now be sent to ${channel}.`)] });
  },
};

// ── !auto-close — Configure auto-close for inactive tickets ──
const autoCloseTimers = new Map(); // channelId -> timeout

function scheduleAutoClose(channelId) {
  // Cancel existing timer
  if (autoCloseTimers.has(channelId)) {
    clearTimeout(autoCloseTimers.get(channelId));
  }

  const ticket = db.tickets.get(channelId);
  if (!ticket || ticket.closed) return;

  const config = getGuildConfig(ticket.guildId);
  const hours  = config.ticketAutoCloseHours || 48; // default 48 hours

  const timer = setTimeout(async () => {
    const t = db.tickets.get(channelId);
    if (!t || t.closed) return;

    const inactiveFor = Date.now() - (t.lastActivity || t.opened);
    if (inactiveFor < hours * 3600000) {
      // Activity happened, reschedule
      scheduleAutoClose(channelId);
      return;
    }

    // Auto-close
    const guild = client.guilds.cache.get(t.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
      const transcript = await generateTicketTranscript(channel, t);
      await sendTicketTranscript(guild, t, transcript, null);

      await channel.send({
        embeds: [warnEmbed('Auto-Closing', `This ticket has been inactive for **${hours} hours** and will be closed.`)]
      });

      t.closed   = true;
      t.closedAt = Date.now();
      t.closedBy = null;
      t.closeReason = 'Auto-closed (inactivity)';

      await sleep(5000);
      await channel.delete('Auto-closed for inactivity').catch(() => {});
    } catch (_) {}
  }, 60000); // Check every minute

  autoCloseTimers.set(channelId, timer);
}

const commandAutoClose = {
  name: 'auto-close',
  aliases: ['autoclose', 'ticket-autoclose'],
  description: 'Configure automatic closing of inactive tickets',
  usage: '<hours|off>',
  category: 'Tickets',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const input  = args[0]?.toLowerCase();

    if (input === 'off') {
      config.ticketAutoCloseHours = 0;
      return message.reply({ embeds: [successEmbed('Auto-Close Disabled', 'Tickets will no longer be auto-closed.')] });
    }

    const hours = parseInt(input);
    if (isNaN(hours) || hours < 1 || hours > 720) {
      return message.reply({ embeds: [errorEmbed('Invalid Hours', 'Please provide a number between 1 and 720 (30 days).')] });
    }

    config.ticketAutoCloseHours = hours;

    // Reschedule existing tickets
    for (const [, t] of db.tickets) {
      if (t.guildId === message.guild.id && !t.closed) {
        scheduleAutoClose(t.channelId);
      }
    }

    message.reply({ embeds: [successEmbed('Auto-Close Enabled', `Tickets inactive for **${hours} hours** will be auto-closed.`)] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: SERVER CONFIG
// ══════════════════════════════════════════════════════════════

const commandSetprefix = {
  name: 'setprefix',
  aliases: ['prefix'],
  description: 'Change the bot prefix for this server',
  usage: '<new_prefix>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const newPrefix = args[0];
    if (!newPrefix) return message.reply({ embeds: [errorEmbed('Missing Prefix', 'Please provide a new prefix.')] });
    if (newPrefix.length > 5) return message.reply({ embeds: [errorEmbed('Too Long', 'Prefix must be 5 characters or less.')] });

    const config = getGuildConfig(message.guild.id);
    config.prefix = newPrefix;

    message.reply({ embeds: [successEmbed('Prefix Updated', `Bot prefix is now \`${newPrefix}\``)] });
  },
};

const commandSetwelcome = {
  name: 'setwelcome',
  aliases: ['welcomechannel'],
  description: 'Set the welcome channel',
  usage: '<#channel|off>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.welcomeChannel = null;
      return message.reply({ embeds: [successEmbed('Welcome Disabled', 'Welcome messages have been disabled.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.welcomeChannel = channel.id;

    message.reply({ embeds: [successEmbed('Welcome Channel Set', `Welcome messages will be sent to ${channel}.`)] });
  },
};

const commandSetgoodbye = {
  name: 'setgoodbye',
  aliases: ['byechannel'],
  description: 'Set the goodbye channel',
  usage: '<#channel|off>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.goodbyeChannel = null;
      return message.reply({ embeds: [successEmbed('Goodbye Disabled', 'Goodbye messages have been disabled.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.goodbyeChannel = channel.id;

    message.reply({ embeds: [successEmbed('Goodbye Channel Set', `Goodbye messages will be sent to ${channel}.`)] });
  },
};

const commandSetlogs = {
  name: 'setlogs',
  aliases: ['logschannel', 'logging'],
  description: 'Set the moderation logs channel',
  usage: '<#channel|off>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.modLogsChannel = null;
      return message.reply({ embeds: [successEmbed('Logging Disabled', 'Mod logs have been disabled.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.modLogsChannel = channel.id;

    message.reply({ embeds: [successEmbed('Logs Channel Set', `Moderation logs will be sent to ${channel}.`)] });
  },
};

const commandSetmuterole = {
  name: 'setmuterole',
  aliases: ['muterole'],
  description: 'Set the mute role',
  usage: '<@role>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

    if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a valid role.')] });

    config.muteRole = role.id;
    message.reply({ embeds: [successEmbed('Mute Role Set', `The mute role is now ${role}.`)] });
  },
};

const commandAutomod = {
  name: 'automod',
  aliases: ['am'],
  description: 'Configure auto-moderation settings',
  usage: '<toggle|antispam|antilinks|anticaps|antiprofanity> [on|off]',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const sub    = args[0]?.toLowerCase();
    const state  = args[1]?.toLowerCase();
    const bool   = state === 'on' || state === 'enable' || state === 'true';

    const options = {
      toggle:       () => { config.automod.enabled       = bool; },
      antispam:     () => { config.automod.antiSpam       = bool; },
      antilinks:    () => { config.automod.antiLinks      = bool; },
      anticaps:     () => { config.automod.antiCaps       = bool; },
      antiprofanity:() => { config.automod.antiProfanity  = bool; },
    };

    if (!sub || sub === 'status') {
      const status = (key) => config.automod[key] ? '✅' : '❌';
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Auto-Mod Status')
        .addFields(
          { name: 'Enabled',         value: status('enabled'),       inline: true },
          { name: 'Anti-Spam',       value: status('antiSpam'),      inline: true },
          { name: 'Anti-Links',      value: status('antiLinks'),     inline: true },
          { name: 'Anti-Caps',       value: status('antiCaps'),      inline: true },
          { name: 'Anti-Profanity',  value: status('antiProfanity'), inline: true },
          { name: 'Max Mentions',    value: `${config.automod.maxMentions}`, inline: true },
        )
        .setColor(Colors.Blue)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (!options[sub]) return message.reply({ embeds: [errorEmbed('Invalid Option', 'Valid options: toggle, antispam, antilinks, anticaps, antiprofanity')] });
    if (!state) return message.reply({ embeds: [errorEmbed('Missing State', 'Please specify `on` or `off`.')] });

    options[sub]();
    message.reply({ embeds: [successEmbed('AutoMod Updated', `**${sub}** is now **${bool ? 'enabled' : 'disabled'}**.`)] });
  },
};

const commandSetsuggestionchannel = {
  name: 'setsuggestionchannel',
  aliases: ['suggestionchannel', 'suggestions'],
  description: 'Set the suggestions channel',
  usage: '<#channel|off>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.suggestionChannel = null;
      return message.reply({ embeds: [successEmbed('Suggestions Disabled', 'Suggestion channel has been cleared.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.suggestionChannel = channel.id;

    message.reply({ embeds: [successEmbed('Suggestion Channel Set', `Suggestions will be posted in ${channel}.`)] });
  },
};

const commandSetticketcategory = {
  name: 'setticketcategory',
  aliases: ['ticketcategory'],
  description: 'Set the category for ticket channels',
  usage: '<category_id>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config  = getGuildConfig(message.guild.id);
    const catId   = args[0];

    if (!catId) return message.reply({ embeds: [errorEmbed('Missing Category', 'Please provide a category ID.')] });

    const cat = await message.guild.channels.fetch(catId).catch(() => null);
    if (!cat || cat.type !== ChannelType.GuildCategory) {
      return message.reply({ embeds: [errorEmbed('Invalid Category', 'Please provide a valid category channel ID.')] });
    }

    config.ticketCategory = cat.id;
    message.reply({ embeds: [successEmbed('Ticket Category Set', `New tickets will be created in **${cat.name}**.`)] });
  },
};

const commandSetstarboard = {
  name: 'setstarboard',
  aliases: ['starboard'],
  description: 'Set the starboard channel and threshold',
  usage: '<#channel> [threshold]',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config   = getGuildConfig(message.guild.id);
    const channel  = message.mentions.channels.first();
    const threshold = parseInt(args[1]) || 3;

    if (!channel) return message.reply({ embeds: [errorEmbed('Missing Channel', 'Please mention a channel.')] });

    config.starboardChannel = channel.id;
    config.starboardMin     = threshold;

    message.reply({ embeds: [successEmbed('Starboard Set', `Starboard channel: ${channel}\nMinimum stars: **${threshold}**`)] });
  },
};

const commandAutorole = {
  name: 'autorole',
  aliases: ['joinrole'],
  description: 'Set roles to give to new members automatically',
  usage: 'add <@role> | remove <@role> | list | clear',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const sub    = args[0]?.toLowerCase();

    if (sub === 'add') {
      const role = message.mentions.roles.first();
      if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a role.')] });

      if (!config.autoroles.includes(role.id)) config.autoroles.push(role.id);
      return message.reply({ embeds: [successEmbed('Autorole Added', `${role} will now be given to new members.`)] });
    }

    if (sub === 'remove') {
      const role = message.mentions.roles.first();
      if (!role) return message.reply({ embeds: [errorEmbed('Invalid Role', 'Please mention a role.')] });

      config.autoroles = config.autoroles.filter(r => r !== role.id);
      return message.reply({ embeds: [successEmbed('Autorole Removed', `${role} will no longer be given to new members.`)] });
    }

    if (sub === 'clear') {
      config.autoroles = [];
      return message.reply({ embeds: [successEmbed('Autoroles Cleared', 'All autoroles have been removed.')] });
    }

    // List
    const roles = config.autoroles.map(id => `<@&${id}>`).join(', ') || 'None configured';
    message.reply({ embeds: [infoEmbed('Autoroles', roles)] });
  },
};

const commandServerconfig = {
  name: 'serverconfig',
  aliases: ['config', 'settings'],
  description: 'View the server configuration',
  usage: '',
  category: 'Config',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message) {
    const config = getGuildConfig(message.guild.id);

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ Server Config — ${message.guild.name}`)
      .addFields(
        { name: '📌 Prefix',           value: config.prefix,                              inline: true },
        { name: '🔐 Mute Role',         value: config.muteRole ? `<@&${config.muteRole}>` : 'Not set', inline: true },
        { name: '👋 Welcome Channel',   value: config.welcomeChannel ? `<#${config.welcomeChannel}>` : 'Not set', inline: true },
        { name: '👋 Goodbye Channel',   value: config.goodbyeChannel ? `<#${config.goodbyeChannel}>` : 'Not set', inline: true },
        { name: '📋 Mod Logs',          value: config.modLogsChannel ? `<#${config.modLogsChannel}>` : 'Not set', inline: true },
        { name: '🎫 Ticket Category',   value: config.ticketCategory ? `<#${config.ticketCategory}>` : 'Not set', inline: true },
        { name: '⭐ Starboard',         value: config.starboardChannel ? `<#${config.starboardChannel}> (${config.starboardMin}⭐)` : 'Not set', inline: true },
        { name: '💡 Suggestions',       value: config.suggestionChannel ? `<#${config.suggestionChannel}>` : 'Not set', inline: true },
        { name: '🛡️ AutoMod',           value: config.automod.enabled ? 'Enabled' : 'Disabled', inline: true },
        { name: '📈 Level Messages',    value: config.levelMessages ? 'On' : 'Off', inline: true },
        { name: '🎭 Autoroles',         value: config.autoroles.length ? config.autoroles.map(r => `<@&${r}>`).join(', ') : 'None', inline: false },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: INFORMATION / HELP
// ══════════════════════════════════════════════════════════════

const commandHelp = {
  name: 'help',
  aliases: ['h', 'commands', 'cmds'],
  description: 'View all commands or a specific command',
  usage: '[command|category]',
  category: 'Info',
  cooldown: 5,
  async execute(message, args) {
    const input = args[0]?.toLowerCase();

    // All commands grouped by category
    const categories = new Map();
    for (const [, cmd] of client.commands) {
      if (!categories.has(cmd.category)) categories.set(cmd.category, []);
      categories.get(cmd.category).push(cmd);
    }

    if (!input) {
      // Overview embed
      const embed = new EmbedBuilder()
        .setTitle(`📚 ${client.user.username} Help`)
        .setAuthor({ name: `${BOT_NAME} • Help Center`, iconURL: client.user.displayAvatarURL() })
        .setDescription(`Prefix: \`${getGuildConfig(message.guild?.id || '0').prefix}\`\n\nUse \`!help <category>\` or \`!help <command>\` for details.`)
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(Colors.Blue)
        .setTimestamp();

      for (const [cat, cmds] of categories) {
        embed.addFields({
          name:   `${categoryEmoji(cat)} ${cat} (${cmds.length})`,
          value:  cmds.map(c => `\`${c.name}\``).join(', '),
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    }

    // Specific command
    const cmd = client.commands.get(input) || client.commands.get(client.aliases.get(input));
    if (cmd) {
      const prefix = getGuildConfig(message.guild?.id || '0').prefix;
      const embed  = new EmbedBuilder()
        .setTitle(`📝 Command: ${cmd.name}`)
        .addFields(
          { name: '📋 Description', value: cmd.description || 'No description' },
          { name: '📌 Usage',       value: `\`${prefix}${cmd.name} ${cmd.usage || ''}\``.trim() },
          { name: '🏷️ Category',   value: cmd.category || 'Uncategorised',     inline: true },
          { name: '⏱️ Cooldown',   value: `${cmd.cooldown || 3}s`,             inline: true },
          { name: '🔑 Permissions', value: cmd.permissions?.length ? cmd.permissions.map(p => `\`${p}\``).join(', ') : 'None', inline: false },
        )
        .setColor(Colors.Blue)
        .setTimestamp();

      if (cmd.aliases?.length) {
        embed.addFields({ name: '🔄 Aliases', value: cmd.aliases.map(a => `\`${a}\``).join(', ') });
      }

      return message.reply({ embeds: [embed] });
    }

    // Specific category
    const catName = [...categories.keys()].find(c => c.toLowerCase() === input);
    if (catName) {
      const cmds   = categories.get(catName);
      const prefix = getGuildConfig(message.guild?.id || '0').prefix;
      const embed  = new EmbedBuilder()
        .setTitle(`${categoryEmoji(catName)} ${catName} Commands`)
        .setDescription(cmds.map(c => `\`${prefix}${c.name}\` — ${c.description}`).join('\n'))
        .setColor(Colors.Blue)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    message.reply({ embeds: [errorEmbed('Not Found', `No command or category found for \`${input}\`.`)] });
  },
};

function categoryEmoji(cat) {
  const map = {
    Moderation: '🔨', Utility: '🔧', Economy: '💰', Levels: '📈',
    Fun: '🎉', Giveaways: '🎁', Tickets: '🎫', Config: '⚙️', Info: '📚',
    Music: '🎵', Owner: '👑', NSFW: '🔞',
  };
  return map[cat] || '📌';
}

const commandBotinfo = {
  name: 'botinfo',
  aliases: ['bi', 'about', 'info'],
  description: 'View information about the bot',
  usage: '',
  category: 'Info',
  cooldown: 5,
  async execute(message) {
    const uptime = formatDuration(client.uptime);
    const mem    = process.memoryUsage();

    const embed = new EmbedBuilder()
      .setTitle(`🤖 ${client.user.username}`)
      .setThumbnail(client.user.displayAvatarURL({ size: 512 }))
      .addFields(
        { name: '🆔 Bot ID',         value: client.user.id,                    inline: true  },
        { name: '👑 Owner',          value: `<@${OWNER_ID}>`,                   inline: true  },
        { name: '⏱️ Uptime',        value: uptime,                             inline: true  },
        { name: '🌐 Servers',        value: `${client.guilds.cache.size}`,      inline: true  },
        { name: '👥 Users',          value: `${client.users.cache.size}`,       inline: true  },
        { name: '📡 Ping',           value: `${client.ws.ping}ms`,             inline: true  },
        { name: '💾 Memory',         value: humanBytes(mem.heapUsed),           inline: true  },
        { name: '📦 Commands',       value: `${client.commands.size}`,         inline: true  },
        { name: '🔧 Node.js',        value: process.version,                   inline: true  },
        { name: '📚 discord.js',     value: require('discord.js').version,     inline: true  },
      )
      .setColor(Colors.Blue)
      .setFooter({ text: 'Built with discord.js v14' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandStats = {
  name: 'stats',
  aliases: ['statistics', 'guilds'],
  description: 'View bot statistics',
  usage: '',
  category: 'Info',
  cooldown: 5,
  async execute(message) {
    const totalUsers   = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    const totalChannels = client.guilds.cache.reduce((a, g) => a + g.channels.cache.size, 0);

    const embed = new EmbedBuilder()
      .setTitle('📊 Bot Statistics')
      .addFields(
        { name: '🌐 Servers',   value: `${client.guilds.cache.size}`,  inline: true },
        { name: '👥 Users',     value: `${formatNumber(totalUsers)}`,   inline: true },
        { name: '💬 Channels',  value: `${formatNumber(totalChannels)}`, inline: true },
        { name: '📦 Commands',  value: `${client.commands.size}`,       inline: true },
        { name: '⏱️ Uptime',   value: formatDuration(client.uptime),   inline: true },
        { name: '📡 Ping',      value: `${client.ws.ping}ms`,          inline: true },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: OWNER ONLY
// ══════════════════════════════════════════════════════════════

const commandEval = {
  name: 'eval',
  aliases: ['exec', 'run'],
  description: '[OWNER] Evaluate JavaScript code',
  usage: '<code>',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const code = args.join(' ');
    if (!code) return message.reply({ embeds: [errorEmbed('Missing Code', 'Please provide code to evaluate.')] });

    try {
      let result = await eval(code); // eslint-disable-line no-eval
      if (typeof result !== 'string') result = require('util').inspect(result, { depth: 1 });

      // Redact token
      result = result.replace(TOKEN, '[REDACTED]');

      if (result.length > 1000) result = result.slice(0, 1000) + '\n...';

      const embed = new EmbedBuilder()
        .setTitle('✅ Eval Result')
        .addFields(
          { name: '📥 Input',  value: codeBlock('js', code.slice(0, 500)) },
          { name: '📤 Output', value: codeBlock('js', result) },
        )
        .setColor(Colors.Green)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (err) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Eval Error')
        .addFields(
          { name: '📥 Input', value: codeBlock('js', code.slice(0, 500)) },
          { name: '❌ Error', value: codeBlock('js', err.message) },
        )
        .setColor(Colors.Red)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    }
  },
};

const commandShell = {
  name: 'shell',
  aliases: ['sh', 'bash'],
  description: '[OWNER] Execute a shell command',
  usage: '<command>',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const cmd = args.join(' ');
    if (!cmd) return message.reply({ embeds: [errorEmbed('Missing Command', 'Please provide a shell command.')] });

    const { exec } = require('child_process');

    exec(cmd, { timeout: 10000 }, async (err, stdout, stderr) => {
      const output = (err ? stderr || err.message : stdout || 'No output').slice(0, 1900);

      const embed = new EmbedBuilder()
        .setTitle(err ? '❌ Shell Error' : '✅ Shell Output')
        .addFields(
          { name: '📥 Command', value: codeBlock('sh', cmd) },
          { name: '📤 Output',  value: codeBlock('sh', output) },
        )
        .setColor(err ? Colors.Red : Colors.Green)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    });
  },
};

const commandBlacklist = {
  name: 'blacklist',
  aliases: ['bl'],
  description: '[OWNER] Blacklist a user from using the bot',
  usage: '<add|remove|list> [user_id] [reason]',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'add') {
      const uid    = args[1];
      const reason = args.slice(2).join(' ') || 'No reason';
      if (!uid) return message.reply({ embeds: [errorEmbed('Missing ID', 'Please provide a user ID.')] });

      db.blacklist.set(uid, reason);
      return message.reply({ embeds: [successEmbed('Blacklisted', `User \`${uid}\` has been blacklisted.\n**Reason:** ${reason}`)] });
    }

    if (sub === 'remove') {
      const uid = args[1];
      if (!uid) return message.reply({ embeds: [errorEmbed('Missing ID', 'Please provide a user ID.')] });

      db.blacklist.delete(uid);
      return message.reply({ embeds: [successEmbed('Unblacklisted', `User \`${uid}\` has been removed from the blacklist.`)] });
    }

    if (sub === 'list') {
      if (db.blacklist.size === 0) return message.reply({ embeds: [infoEmbed('Blacklist', 'No users are blacklisted.')] });

      const lines = [...db.blacklist.entries()].map(([id, r]) => `\`${id}\` — ${r}`).join('\n');
      return message.reply({ embeds: [infoEmbed('Blacklisted Users', lines.slice(0, 2000))] });
    }

    message.reply({ embeds: [infoEmbed('Blacklist', '`!blacklist add <id> [reason]`\n`!blacklist remove <id>`\n`!blacklist list`')] });
  },
};

const commandGuildlist = {
  name: 'guildlist',
  aliases: ['serverlist', 'guilds'],
  description: '[OWNER] List all servers the bot is in',
  usage: '[page]',
  category: 'Owner',
  cooldown: 5,
  ownerOnly: true,
  async execute(message, args) {
    const page = parseInt(args[0]) || 1;
    const guilds = [...client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount);
    const { items, total } = paginate(guilds, page, 10);

    const embed = new EmbedBuilder()
      .setTitle(`🌐 Server List (${client.guilds.cache.size} total)`)
      .setDescription(items.map((g, i) => `${(page-1)*10+i+1}. **${g.name}** — ${g.memberCount} members (${g.id})`).join('\n'))
      .setFooter({ text: `Page ${page}/${total}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandSetcredits = {
  name: 'setmoney',
  aliases: ['givemoney', 'addmoney'],
  description: '[OWNER] Set a user\'s balance',
  usage: '<@user|id> <amount>',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);
    const amount = parseInt(args[1]);

    if (!user) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (isNaN(amount)) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid amount.')] });

    const eco    = getEconomy(user.id);
    eco.balance  = amount;

    message.reply({ embeds: [successEmbed('Balance Set', `Set **${user.tag}**'s balance to **$${formatNumber(amount)}**.`)] });
  },
};

const commandBroadcast = {
  name: 'broadcast',
  aliases: ['announce', 'global'],
  description: '[OWNER] Send a message to all servers',
  usage: '<message>',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Message', 'Please provide a message.')] });

    const embed = new EmbedBuilder()
      .setTitle(`📢 Global Announcement`)
      .setDescription(text)
      .setAuthor({ name: `${message.author.tag} (Bot Owner)`, iconURL: message.author.displayAvatarURL() })
      .setColor(Colors.Blue)
      .setTimestamp();

    let sent = 0, failed = 0;

    for (const guild of client.guilds.cache.values()) {
      try {
        const config   = getGuildConfig(guild.id);
        const channel  = guild.systemChannel || guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages));
        if (channel) { await channel.send({ embeds: [embed] }); sent++; }
      } catch (_) { failed++; }
    }

    message.reply({ embeds: [successEmbed('Broadcast Sent', `**Sent:** ${sent}\n**Failed:** ${failed}`)] });
  },
};

const commandRestartbot = {
  name: 'restart',
  aliases: ['reboot'],
  description: '[OWNER] Restart the bot process',
  usage: '',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message) {
    await message.reply({ embeds: [infoEmbed('Restarting...', 'Bot is restarting. This may take a moment.')] });
    process.exit(0); // Process manager (pm2) will restart
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: REPUTATION
// ══════════════════════════════════════════════════════════════

const commandRep = {
  name: 'rep',
  aliases: ['reputation', '+rep'],
  description: 'Give reputation to a user',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a user.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Rep Yourself', 'You cannot give rep to yourself!')] });
    if (target.bot) return message.reply({ embeds: [errorEmbed('Cannot Rep Bot', 'You cannot give rep to a bot.')] });

    const giverRep = db.reputation.get(message.author.id) || { rep: 0, lastGiven: 0 };
    const cooldown = 86400000; // 24 hours

    if (Date.now() - giverRep.lastGiven < cooldown) {
      const remaining = cooldown - (Date.now() - giverRep.lastGiven);
      return message.reply({ embeds: [errorEmbed('Cooldown', `You can give rep again in **${formatDuration(remaining)}**.`)] });
    }

    const targetRep = db.reputation.get(target.id) || { rep: 0, lastGiven: 0 };
    targetRep.rep += 1;
    db.reputation.set(target.id, targetRep);

    giverRep.lastGiven = Date.now();
    db.reputation.set(message.author.id, giverRep);

    message.reply({ embeds: [successEmbed('Rep Given!', `You gave **+1 rep** to **${target.tag}**!\nThey now have **${targetRep.rep} rep**.`)] });
  },
};

const commandRepboard = {
  name: 'repboard',
  aliases: ['replb', 'replist'],
  description: 'View the reputation leaderboard',
  usage: '',
  category: 'Fun',
  cooldown: 10,
  async execute(message) {
    const sorted = [...db.reputation.entries()]
      .sort(([,a], [,b]) => b.rep - a.rep)
      .slice(0, 10);

    if (sorted.length === 0) return message.reply({ embeds: [infoEmbed('Empty', 'No reputation data yet.')] });

    const lines = await Promise.all(sorted.map(async ([uid, data], i) => {
      const user  = await client.users.fetch(uid).catch(() => ({ tag: 'Unknown' }));
      const medals = ['🥇','🥈','🥉'];
      return `${medals[i] || `${i+1}.`} **${user.tag}** — **${data.rep}** rep`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('⭐ Reputation Leaderboard')
      .setDescription(lines.join('\n'))
      .setColor(Colors.Gold)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

const commandRepcheck = {
  name: 'repcheck',
  aliases: ['myRep'],
  description: 'Check your or another user\'s reputation',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author;

    const data = db.reputation.get(user.id) || { rep: 0 };
    message.reply({ embeds: [infoEmbed(`⭐ Reputation`, `**${user.tag}** has **${data.rep}** reputation points.`)] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: MARRIAGE
// ══════════════════════════════════════════════════════════════

const commandMarry = {
  name: 'marry',
  aliases: ['propose', 'marriage'],
  description: 'Propose to another user',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 10,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid user.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Marry Yourself', 'You cannot marry yourself!')] });
    if (target.bot) return message.reply({ embeds: [errorEmbed('Cannot Marry Bot', 'You cannot marry a bot!')] });
    if (db.marriages.has(message.author.id)) {
      const partnerUser = await client.users.fetch(db.marriages.get(message.author.id)).catch(() => ({ tag: 'Unknown' }));
      return message.reply({ embeds: [errorEmbed('Already Married', `You are already married to **${partnerUser.tag}**!`)] });
    }
    if (db.marriages.has(target.id)) {
      return message.reply({ embeds: [errorEmbed('Already Married', `**${target.tag}** is already married to someone else!`)] });
    }

    const embed = new EmbedBuilder()
      .setTitle('💍 Marriage Proposal')
      .setDescription(`**${message.author.username}** is proposing to **${target.username}**!\n\n${target}, will you accept? (60 seconds)`)
      .setColor(Colors.Pink)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('marry_yes').setLabel('Accept 💍').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('marry_no').setLabel('Decline 💔').setStyle(ButtonStyle.Danger),
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === target.id,
      time: 60000,
      max: 1,
    });

    collector.on('collect', async i => {
      if (i.customId === 'marry_yes') {
        db.marriages.set(message.author.id, target.id);
        db.marriages.set(target.id, message.author.id);

        await i.update({ embeds: [new EmbedBuilder()
          .setTitle('💒 Congratulations!')
          .setDescription(`**${message.author.username}** and **${target.username}** are now married! 💍\n\nMay your love last forever! 🎉`)
          .setColor(Colors.Pink)
          .setTimestamp()
        ], components: [] });
      } else {
        await i.update({ embeds: [new EmbedBuilder()
          .setTitle('💔 Proposal Declined')
          .setDescription(`**${target.username}** declined the marriage proposal from **${message.author.username}**. Better luck next time! 💔`)
          .setColor(Colors.Red)
          .setTimestamp()
        ], components: [] });
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        await msg.edit({ embeds: [errorEmbed('Proposal Expired', `${target.username} did not respond in time.`)], components: [] });
      }
    });
  },
};

const commandDivorce = {
  name: 'divorce',
  aliases: ['breakup'],
  description: 'Divorce your partner',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    if (!db.marriages.has(message.author.id)) {
      return message.reply({ embeds: [errorEmbed('Not Married', 'You are not currently married.')] });
    }

    const partnerId = db.marriages.get(message.author.id);
    const partner   = await client.users.fetch(partnerId).catch(() => ({ tag: 'Unknown' }));

    db.marriages.delete(message.author.id);
    db.marriages.delete(partnerId);

    message.reply({ embeds: [warnEmbed('Divorced 💔', `**${message.author.username}** and **${partner.tag}** are now divorced. 💔`)] });
  },
};

const commandPartner = {
  name: 'partner',
  aliases: ['spouse', 'married'],
  description: 'Check who you\'re married to',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;

    if (!db.marriages.has(user.id)) {
      return message.reply({ embeds: [infoEmbed('Not Married', `**${user.tag}** is not currently married.`)] });
    }

    const partnerId = db.marriages.get(user.id);
    const partner   = await client.users.fetch(partnerId).catch(() => ({ tag: 'Unknown' }));

    message.reply({ embeds: [infoEmbed('💍 Partner', `**${user.tag}** is married to **${partner.tag}**!`)] });
  },
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY: MUSIC (Placeholder - requires @discordjs/voice, ytdl-core)
//  Note: Full music with queue management is included below.
//        Install deps: npm install @discordjs/voice ytdl-core
// ══════════════════════════════════════════════════════════════

// Music Queue structure per guild
// client.music: Map<guildId, { queue: [], playing: boolean, volume: number, loop: boolean, loopQueue: boolean, channel, voiceChannel, connection, audioPlayer, currentSong }>

function getMusicQueue(guildId) {
  if (!client.music.has(guildId)) {
    client.music.set(guildId, {
      queue:       [],
      playing:     false,
      volume:      100,
      loop:        false,
      loopQueue:   false,
      channel:     null,
      voiceChannel: null,
      connection:  null,
      audioPlayer: null,
      currentSong: null,
    });
  }
  return client.music.get(guildId);
}

const commandPlay = {
  name: 'play',
  aliases: ['p', 'music', 'song'],
  description: 'Play a song (requires @discordjs/voice setup)',
  usage: '<song name or URL>',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.voice.channel) {
      return message.reply({ embeds: [errorEmbed('Not in Voice', 'You need to be in a voice channel!')] });
    }

    const query = args.join(' ');
    if (!query) return message.reply({ embeds: [errorEmbed('Missing Query', 'Please provide a song name or URL.')] });

    const queue = getMusicQueue(message.guild.id);

    message.reply({ embeds: [infoEmbed('🎵 Music', `Added **${query}** to the queue!\n\n⚠️ Full music playback requires \`@discordjs/voice\` and \`ytdl-core\` to be installed and configured.\n\nThe queue system is ready — connect your audio backend!`)] });

    // Example song object
    const song = {
      title:       query,
      url:         query,
      duration:    '?',
      thumbnail:   null,
      requestedBy: message.author.id,
    };

    queue.queue.push(song);
    queue.channel     = message.channel;
    queue.voiceChannel = message.member.voice.channel;
  },
};

const commandStop = {
  name: 'stop',
  aliases: ['leave', 'dc', 'disconnect'],
  description: 'Stop music and disconnect the bot',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    queue.queue     = [];
    queue.playing   = false;
    queue.currentSong = null;

    if (queue.connection) {
      try { queue.connection.destroy(); } catch (_) {}
      queue.connection = null;
    }

    client.music.delete(message.guild.id);
    message.reply({ embeds: [successEmbed('Stopped', 'Music stopped and bot disconnected.')] });
  },
};

const commandSkip = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skip the current song',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    if (!queue.playing) return message.reply({ embeds: [errorEmbed('Not Playing', 'Nothing is currently playing.')] });
    if (!message.member.voice.channel) return message.reply({ embeds: [errorEmbed('Not in Voice', 'You need to be in the voice channel.')] });

    if (queue.audioPlayer) {
      try { queue.audioPlayer.stop(); } catch (_) {}
    }

    message.reply({ embeds: [successEmbed('Skipped', `Skipped **${queue.currentSong?.title || 'current song'}**.`)] });
  },
};

const commandQueue = {
  name: 'queue',
  aliases: ['q', 'playlist'],
  description: 'View the music queue',
  usage: '[page]',
  category: 'Music',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const queue = getMusicQueue(message.guild.id);
    const page  = parseInt(args[0]) || 1;

    if (!queue.currentSong && queue.queue.length === 0) {
      return message.reply({ embeds: [infoEmbed('Empty Queue', 'Nothing is in the queue.')] });
    }

    const { items, total } = paginate(queue.queue, page, 10);

    const embed = new EmbedBuilder()
      .setTitle('🎵 Music Queue')
      .setColor(Colors.Blue)
      .setTimestamp();

    if (queue.currentSong) {
      embed.addFields({ name: '▶️ Now Playing', value: `**${queue.currentSong.title}** [${queue.currentSong.duration}]` });
    }

    if (items.length > 0) {
      embed.addFields({
        name: '📋 Up Next',
        value: items.map((s, i) => `${(page-1)*10+i+1}. **${s.title}** [${s.duration}]`).join('\n'),
      });
    }

    embed.setFooter({ text: `Page ${page}/${total} | Total: ${queue.queue.length} songs | Loop: ${queue.loop ? 'On' : 'Off'} | Loop Queue: ${queue.loopQueue ? 'On' : 'Off'}` });

    message.reply({ embeds: [embed] });
  },
};

const commandNowplaying = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  description: 'View the currently playing song',
  usage: '',
  category: 'Music',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    if (!queue.currentSong) {
      return message.reply({ embeds: [infoEmbed('Not Playing', 'Nothing is currently playing.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle('▶️ Now Playing')
      .setDescription(`**${queue.currentSong.title}**`)
      .addFields(
        { name: '⏱️ Duration', value: queue.currentSong.duration, inline: true },
        { name: '🔊 Volume',   value: `${queue.volume}%`,          inline: true },
        { name: '🔁 Loop',     value: queue.loop ? 'On' : 'Off',  inline: true },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    if (queue.currentSong.thumbnail) embed.setThumbnail(queue.currentSong.thumbnail);

    message.reply({ embeds: [embed] });
  },
};

const commandVolume = {
  name: 'volume',
  aliases: ['vol', 'v'],
  description: 'Set the music volume',
  usage: '<1-200>',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const vol = parseInt(args[0]);

    if (isNaN(vol) || vol < 1 || vol > 200) {
      return message.reply({ embeds: [errorEmbed('Invalid Volume', 'Volume must be between 1 and 200.')] });
    }

    const queue = getMusicQueue(message.guild.id);
    queue.volume = vol;

    if (queue.audioPlayer) {
      // Adjust actual audio player volume here when connected
    }

    message.reply({ embeds: [successEmbed('Volume Updated', `Volume set to **${vol}%**.`)] });
  },
};

const commandLoop = {
  name: 'loop',
  aliases: ['repeat'],
  description: 'Toggle loop for current song',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue   = getMusicQueue(message.guild.id);
    queue.loop    = !queue.loop;

    message.reply({ embeds: [successEmbed('Loop', `Song loop is now **${queue.loop ? 'enabled' : 'disabled'}**.`)] });
  },
};

const commandLoopqueue = {
  name: 'loopqueue',
  aliases: ['lq', 'queueloop'],
  description: 'Toggle loop for entire queue',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue        = getMusicQueue(message.guild.id);
    queue.loopQueue    = !queue.loopQueue;

    message.reply({ embeds: [successEmbed('Queue Loop', `Queue loop is now **${queue.loopQueue ? 'enabled' : 'disabled'}**.`)] });
  },
};

const commandShuffle = {
  name: 'shuffle',
  aliases: ['mix'],
  description: 'Shuffle the music queue',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    if (queue.queue.length < 2) {
      return message.reply({ embeds: [errorEmbed('Not Enough Songs', 'Need at least 2 songs in queue to shuffle.')] });
    }

    queue.queue = shuffle(queue.queue);
    message.reply({ embeds: [successEmbed('Shuffled', `Queue has been shuffled! (${queue.queue.length} songs)`)] });
  },
};

const commandRemovesong = {
  name: 'remove',
  aliases: ['rm', 'removesong'],
  description: 'Remove a song from the queue',
  usage: '<position>',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const queue = getMusicQueue(message.guild.id);
    const pos   = parseInt(args[0]) - 1;

    if (isNaN(pos) || pos < 0 || pos >= queue.queue.length) {
      return message.reply({ embeds: [errorEmbed('Invalid Position', `Please provide a position between 1 and ${queue.queue.length}.`)] });
    }

    const removed = queue.queue.splice(pos, 1)[0];
    message.reply({ embeds: [successEmbed('Removed', `Removed **${removed.title}** from the queue.`)] });
  },
};

const commandPause = {
  name: 'pause',
  aliases: ['hold'],
  description: 'Pause the current song',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    if (!queue.audioPlayer) return message.reply({ embeds: [errorEmbed('Not Playing', 'Nothing is currently playing.')] });

    try { queue.audioPlayer.pause(); } catch (_) {}
    message.reply({ embeds: [successEmbed('Paused', 'Music paused. Use `!resume` to continue.')] });
  },
};

const commandResume = {
  name: 'resume',
  aliases: ['unpause', 'continue'],
  description: 'Resume the paused song',
  usage: '',
  category: 'Music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = getMusicQueue(message.guild.id);

    if (!queue.audioPlayer) return message.reply({ embeds: [errorEmbed('Not Playing', 'Nothing is currently playing.')] });

    try { queue.audioPlayer.unpause(); } catch (_) {}
    message.reply({ embeds: [successEmbed('Resumed', 'Music resumed!')] });
  },
};

const commandSeek = {
  name: 'seek',
  aliases: ['jumpto'],
  description: 'Jump to a position in the current song',
  usage: '<time (e.g. 1:30)>',
  category: 'Music',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const timeStr = args[0];
    if (!timeStr) return message.reply({ embeds: [errorEmbed('Missing Time', 'Please provide a time (e.g. `1:30`).')] });

    message.reply({ embeds: [infoEmbed('Seek', `Seeking to **${timeStr}** — requires audio backend integration.`)] });
  },
};

const commandClearqueue = {
  name: 'clearqueue',
  aliases: ['cq', 'emptyqueue'],
  description: 'Clear the music queue',
  usage: '',
  category: 'Music',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const queue    = getMusicQueue(message.guild.id);
    const count    = queue.queue.length;
    queue.queue    = [];

    message.reply({ embeds: [successEmbed('Queue Cleared', `Removed **${count}** song(s) from the queue.`)] });
  },
};

// ══════════════════════════════════════════════════════════════
//  REGISTER ALL COMMANDS
// ══════════════════════════════════════════════════════════════

const ALL_COMMANDS = [
  // Moderation
  commandKick, commandBan, commandUnban, commandMute, commandUnmute,
  commandWarn, commandWarnings, commandDelwarn, commandClearwarns,
  commandPurge, commandSoftban, commandLock, commandUnlock,
  commandSlowmode, commandNick, commandRole, commandVoicekick,
  commandVoicemove, commandDeafen, commandHideChannel, commandShowChannel,
  commandBanlist, commandMassban,

  // Utility
  commandPing, commandServerinfo, commandUserinfo, commandAvatar, commandBanner,
  commandEmoji, commandRoleinfo, commandChannelinfo, commandInvite,
  commandSnipe, commandEditsnipe, commandReminder, commandReminders, commandDelreminder,
  commandAFK, commandTag, commandNote, commandCalculator, commandColor,
  commandPoll, commandEndpoll, commandSuggest, commandSteal, commandTimer,

  // Economy
  commandBalance, commandDaily, commandWork, commandCrime, commandRob,
  commandDeposit, commandWithdraw, commandPay, commandLeaderboard,
  commandShop, commandBuy, commandInventory,
  commandGamble, commandBlackjack, commandCoinflip, commandRoulette,
  commandFish, commandMine, commandHunt,

  // Levels
  commandRank, commandLevelLeaderboard, commandResetxp,
  commandLevelrewards, commandSetlevelreward,

  // Fun
  commandMeme, commandJoke, commandEightball, commandShip,
  commandHug, commandSlap, commandKiss, commandPat, commandHighfive, commandBite,
  commandRps, commandWould, commandTruthordare, commandRandom, commandChoose,
  commandRate, commandNsfw, commandTrivia, commandNeverhaveIever,
  commandSay, commandEmbed, commandReverse, commandMorse, commandBinary, commandAscii,

  // Giveaways
  commandGiveaway,

  // Tickets
  commandTicket, commandCloseticket,
  commandTicketAdd, commandTicketRemove, commandTicketClaim,
  commandTicketPriority, commandTicketRename, commandTicketTransfer,
  commandTicketTranscript, commandSetTicketCategory, commandRemoveTicketCategory,
  commandListTicketCategories, commandSetTicketLogs, commandAutoClose,

  // Config
  commandSetprefix, commandSetwelcome, commandSetgoodbye, commandSetlogs,
  commandSetmuterole, commandAutomod, commandSetsuggestionchannel,
  commandSetticketcategory, commandSetstarboard, commandAutorole, commandServerconfig,

  // Info
  commandHelp, commandBotinfo, commandStats,

  // Reputation
  commandRep, commandRepboard, commandRepcheck,

  // Marriage
  commandMarry, commandDivorce, commandPartner,

  // Music
  commandPlay, commandStop, commandSkip, commandQueue, commandNowplaying,
  commandVolume, commandLoop, commandLoopqueue, commandShuffle,
  commandRemovesong, commandPause, commandResume, commandSeek, commandClearqueue,

  // Owner
  commandEval, commandShell, commandBlacklist, commandGuildlist,
  commandSetcredits, commandBroadcast, commandRestartbot,
];

for (const cmd of ALL_COMMANDS) {
  client.commands.set(cmd.name, cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      client.aliases.set(alias, cmd.name);
    }
  }
}

log('INFO', `Registered ${client.commands.size} commands with ${client.aliases.size} aliases.`);

// ──────────────────────────────────────────────────────────────
//  SLASH COMMANDS REGISTRATION
// ──────────────────────────────────────────────────────────────

const slashCommands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all commands')
    .addStringOption(opt => opt.setName('command').setDescription('Command name').setRequired(false)),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View information about a user')
    .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View information about the server'),

  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get a user\'s avatar')
    .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance')
    .addUserOption(opt => opt.setName('user').setDescription('Another user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn money'),

  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your level and XP')
    .addUserOption(opt => opt.setName('user').setDescription('Another user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin')
    .addStringOption(opt => opt.setName('choice').setDescription('Heads or tails').setRequired(true).addChoices(
      { name: 'Heads', value: 'heads' },
      { name: 'Tails', value: 'tails' },
    ))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Bet amount').setRequired(true).setMinValue(1)),

  new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble your money')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to gamble').setRequired(true).setMinValue(10)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt => opt.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt => opt.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false))
    .addIntegerOption(opt => opt.setName('days').setDescription('Delete message days (0-7)').setMinValue(0).setMaxValue(7)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(true)),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt => opt.setName('amount').setDescription('Messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt => opt.setName('user').setDescription('The user').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 10m, 1h)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
    .addStringOption(opt => opt.setName('options').setDescription('Options separated by | (e.g. Yes | No | Maybe)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Submit a suggestion')
    .addStringOption(opt => opt.setName('suggestion').setDescription('Your suggestion').setRequired(true)),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Create a support ticket')
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ticket').setRequired(false)),

  new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock Paper Scissors')
    .addStringOption(opt => opt.setName('choice').setDescription('Your choice').setRequired(true).addChoices(
      { name: '🪨 Rock',    value: 'rock'     },
      { name: '📄 Paper',  value: 'paper'    },
      { name: '✂️ Scissors', value: 'scissors' },
    )),

  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a trivia question'),

  new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Calculate love compatibility')
    .addUserOption(opt => opt.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(opt => opt.setName('user2').setDescription('Second user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('hug')
    .setDescription('Send a hug')
    .addUserOption(opt => opt.setName('user').setDescription('Who to hug').setRequired(true)),

  new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('View information about the bot'),

  new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 30m, 1h)').setRequired(true))
    .addStringOption(opt => opt.setName('message').setDescription('Reminder message').setRequired(true)),

].map(cmd => cmd.toJSON());

// Register slash commands
async function registerSlashCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    log('INFO', `Registering ${slashCommands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands });
    log('SUCCESS', 'Slash commands registered globally.');
  } catch (err) {
    log('ERROR', `Failed to register slash commands: ${err.message}`);
  }
}

// ──────────────────────────────────────────────────────────────
//  EVENT HANDLERS
// ──────────────────────────────────────────────────────────────

// ── Ready ─────────────────────────────────────────────────────
client.once('ready', async () => {
  log('SUCCESS', `Logged in as ${client.user.tag} (${client.user.id})`);
  log('INFO', `Serving ${client.guilds.cache.size} guilds`);

  // ── Fancy boot banner ──
  console.log('\x1b[35m%s\x1b[0m', `
  ╔══════════════════════════════════════════════════════╗
  ║   ⚡  ${BOT_NAME}  —  ENHANCED EDITION v${BOT_VERSION}  ║
  ╚══════════════════════════════════════════════════════╝`);
  log('INFO', `📦 Commands: ${client.commands.size} | Aliases: ${client.aliases.size}`);
  log('INFO', `👥 Users cached: ${client.users.cache.size} | 🌐 Guilds: ${client.guilds.cache.size}`);
  log('INFO', `🖥️  Dashboard: http://localhost:${PORT} (keep-alive active)`);

  await registerSlashCommands();

  // Set bot activity cycling
  const activities = [
    { name: `${PREFIX}help | ${client.guilds.cache.size} servers`,          type: ActivityType.Watching   },
    { name: '🎵 Music | Economy | Moderation',                              type: ActivityType.Playing    },
    { name: `${client.users.cache.size} users`,                             type: ActivityType.Watching   },
    { name: `${PREFIX}help for commands`,                                   type: ActivityType.Listening  },
    { name: 'Guarding your server 🛡️',                                      type: ActivityType.Competing  },
  ];

  let actIdx = 0;
  const cycleActivity = () => {
    const act = activities[actIdx++ % activities.length];
    client.user.setPresence({ activities: [act], status: 'online' });
  };

  cycleActivity();
  setInterval(cycleActivity, 30000);
});

// ── Message Create ─────────────────────────────────────────────
client.on('messageCreate', async message => {
  // Ignore bots and webhooks
  if (message.author.bot || message.webhookId) return;

  // Store snipe data
  if (message.guild) {
    db.snipe.delete(message.channel.id); // Clear old snipe when new message comes
  }

  // ✅ NEW: Update ticket last activity
  if (message.guild) {
    const ticket = db.tickets.get(message.channel.id);
    if (ticket && !ticket.closed) {
      ticket.lastActivity = Date.now();
    }
  }

  // ── AFK check ───────────────────────────────────────────────
  if (db.afk.has(message.author.id)) {
    const afkData = db.afk.get(message.author.id);
    if (Date.now() - afkData.since > 10000) { // 10s grace period
      db.afk.delete(message.author.id);
      const gone = formatDuration(Date.now() - afkData.since);
      message.channel.send({ embeds: [successEmbed('Welcome Back!', `Your AFK status has been removed. You were gone for **${gone}**.`)] })
        .then(m => safeDelete(m, 8000)).catch(() => {});
    }
  }

  // Check for AFK pings
  if (message.mentions.users.size > 0) {
    for (const [uid, user] of message.mentions.users) {
      const afkData = db.afk.get(uid);
      if (afkData && uid !== message.author.id) {
        const gone = formatDuration(Date.now() - afkData.since);
        message.channel.send({ embeds: [infoEmbed('User AFK', `**${user.tag}** is AFK: ${afkData.message}\n*(${gone} ago)*`)] })
          .then(m => safeDelete(m, 8000)).catch(() => {});
      }
    }
  }

  // ── XP/Level system ─────────────────────────────────────────
  if (message.guild) {
    const config = getGuildConfig(message.guild.id);
    const entry  = getLevelEntry(message.guild.id, message.author.id);
    const xpCd   = 60000; // 1 minute cooldown

    if (!entry.lastXp || Date.now() - entry.lastXp > xpCd) {
      const xpGained = randInt(15, 40);
      const oldLevel = calcLevel(entry.xp);
      entry.xp      += xpGained;
      entry.messages += 1;
      entry.lastXp   = Date.now();

      const newLevel = calcLevel(entry.xp);

      if (newLevel > oldLevel) {
        // Level up!
        if (config.levelMessages) {
          message.channel.send({ embeds: [new EmbedBuilder()
            .setTitle('⬆️ Level Up!')
            .setDescription(`🎉 **${message.author}** has reached **Level ${newLevel}**!`)
            .setColor(Colors.Gold)
            .setTimestamp()
          ] }).then(m => safeDelete(m, 10000)).catch(() => {});
        }

        // Check level rewards
        const rewardRole = config.levelRewards[newLevel];
        if (rewardRole) {
          const role = message.guild.roles.cache.get(rewardRole);
          if (role) {
            await message.member.roles.add(role).catch(() => {});
          }
        }
      }

      // Statistics
      incStat(message.guild.id, 'messages');
    }
  }

  // ── Auto-mod ─────────────────────────────────────────────────
  if (message.guild) {
    await runAutomod(message);
  }

  // ── Command parsing ──────────────────────────────────────────
  const config = getGuildConfig(message.guild?.id || '0');
  const prefix  = config.prefix;

  if (!message.content.startsWith(prefix)) return;

  const args    = message.content.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName)
    || client.commands.get(client.aliases.get(cmdName));

  if (!command) return;

  // ── Blacklist check ──────────────────────────────────────────
  if (db.blacklist.has(message.author.id)) {
    return message.reply({ embeds: [errorEmbed('Blacklisted', 'You have been blacklisted from using this bot.')] });
  }

  // ── Owner check ───────────────────────────────────────────────
  if (command.ownerOnly && message.author.id !== OWNER_ID) {
    return message.reply({ embeds: [errorEmbed('Owner Only', 'This command can only be used by the bot owner.')] });
  }

  // ── Guild only check ─────────────────────────────────────────
  if (command.guildOnly && !message.guild) {
    return message.reply({ embeds: [errorEmbed('Server Only', 'This command can only be used in a server.')] });
  }

  // ── Permission check ─────────────────────────────────────────
  if (command.permissions && message.guild) {
    for (const perm of command.permissions) {
      if (!message.member.permissions.has(perm)) {
        return message.reply({ embeds: [errorEmbed('Missing Permission', `You need the \`${perm}\` permission to use this command.`)] });
      }
    }
  }

  // ── Cooldown check ───────────────────────────────────────────
  if (command.cooldown) {
    const key = `${message.author.id}_${command.name}`;
    const cd  = (command.cooldown || 3) * 1000;
    const now = Date.now();

    if (client.cooldowns.has(key)) {
      const expires = client.cooldowns.get(key) + cd;
      if (now < expires) {
        const remaining = ((expires - now) / 1000).toFixed(1);
        return message.reply({ embeds: [errorEmbed('Cooldown', `Please wait **${remaining}s** before using \`${command.name}\` again.`)] });
      }
    }

    client.cooldowns.set(key, now);
    setTimeout(() => client.cooldowns.delete(key), cd);
  }

  // ── Execute command ───────────────────────────────────────────
  try {
    await command.execute(message, args, client);
    incStat(message.guild?.id || '0', 'commands');

    // Track command usage
    const count = db.commandStats.get(command.name) || 0;
    db.commandStats.set(command.name, count + 1);
  } catch (err) {
    log('ERROR', `Command ${command.name} error: ${err.message}`);
    message.reply({ embeds: [errorEmbed('Execution Error', `An error occurred: ${err.message}`)] }).catch(() => {});
  }
});

// ── Interaction Create ─────────────────────────────────────────
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction);
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  } else if (interaction.isModalSubmit()) {
    await handleModal(interaction);
  }
});

// ── Slash Command Handler ─────────────────────────────────────
async function handleSlashCommand(interaction) {
  const name = interaction.commandName;

  if (db.blacklist.has(interaction.user.id)) {
    return interaction.reply({ embeds: [errorEmbed('Blacklisted', 'You have been blacklisted from using this bot.')], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: false }).catch(() => {});

  try {
    switch (name) {
      case 'ping': {
        const embed = new EmbedBuilder()
          .setTitle('🏓 Pong!')
          .addFields(
            { name: '🌐 API Latency', value: `${client.ws.ping}ms`, inline: true },
          )
          .setColor(Colors.Green)
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      case 'help': {
        const query = interaction.options.getString('command');
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          member: interaction.member,
          channel: interaction.channel,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandHelp.execute(fakeMsg, query ? [query] : []);
      }

      case 'userinfo': {
        const target = interaction.options.getMember('user') || interaction.member;
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          member: interaction.member,
          channel: interaction.channel,
          mentions: { members: { first: () => target } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandUserinfo.execute(fakeMsg, []);
      }

      case 'serverinfo': {
        const fakeMsg = {
          guild: interaction.guild,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandServerinfo.execute(fakeMsg, []);
      }

      case 'avatar': {
        const user = interaction.options.getUser('user') || interaction.user;
        const fakeMsg = {
          mentions: { users: { first: () => user } },
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandAvatar.execute(fakeMsg, []);
      }

      case 'balance': {
        const user = interaction.options.getUser('user') || interaction.user;
        const fakeMsg = {
          mentions: { users: { first: () => user } },
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandBalance.execute(fakeMsg, []);
      }

      case 'daily': {
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandDaily.execute(fakeMsg, []);
      }

      case 'work': {
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandWork.execute(fakeMsg, []);
      }

      case 'rank': {
        const target = interaction.options.getMember('user') || interaction.member;
        const fakeMsg = {
          mentions: { members: { first: () => target } },
          author: interaction.user,
          guild: interaction.guild,
          member: interaction.member,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandRank.execute(fakeMsg, []);
      }

      case '8ball': {
        const question = interaction.options.getString('question');
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandEightball.execute(fakeMsg, question.split(' '));
      }

      case 'coinflip': {
        const choice = interaction.options.getString('choice');
        const amount = interaction.options.getInteger('amount');
        const fakeMsg = {
          author: interaction.user,
          mentions: { users: { first: () => null } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandCoinflip.execute(fakeMsg, [choice, String(amount)]);
      }

      case 'gamble': {
        const amount = interaction.options.getInteger('amount');
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandGamble.execute(fakeMsg, [String(amount)]);
      }

      case 'kick': {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const fakeMsg = {
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          mentions: { members: { first: () => member } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandKick.execute(fakeMsg, [reason]);
      }

      case 'ban': {
        const user   = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days   = interaction.options.getInteger('days') || 0;
        const fakeMsg = {
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          mentions: { users: { first: () => user } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandBan.execute(fakeMsg, [String(days), reason]);
      }

      case 'warn': {
        const member = interaction.options.getMember('user');
        const reason = interaction.options.getString('reason');
        const fakeMsg = {
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          channel: interaction.channel,
          mentions: { members: { first: () => member } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandWarn.execute(fakeMsg, [member.id, ...reason.split(' ')]);
      }

      case 'purge': {
        const amount = interaction.options.getInteger('amount');
        await interaction.channel.bulkDelete(amount, true).catch(() => {});
        return interaction.editReply({ embeds: [successEmbed('Purged', `Deleted up to **${amount}** messages.`)] });
      }

      case 'mute': {
        const member = interaction.options.getMember('user');
        const duration = interaction.options.getString('duration');
        const reason   = interaction.options.getString('reason') || 'No reason provided';
        const fakeMsg = {
          author: interaction.user,
          member: interaction.member,
          guild: interaction.guild,
          mentions: { members: { first: () => member } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandMute.execute(fakeMsg, [member.id, duration, ...reason.split(' ')]);
      }

      case 'poll': {
        const question = interaction.options.getString('question');
        const optStr   = interaction.options.getString('options');
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          channel: interaction.channel,
          delete: async () => {},
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandPoll.execute(fakeMsg, [...question.split(' '), '|', ...optStr.split(' ')]);
      }

      case 'suggest': {
        const suggestion = interaction.options.getString('suggestion');
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          channel: interaction.channel,
          delete: async () => {},
          reply: async (data) => { await interaction.editReply(data); return { delete: () => {} }; },
        };
        return commandSuggest.execute(fakeMsg, suggestion.split(' '));
      }

      case 'ticket': {
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          channel: interaction.channel,
          member: interaction.member,
          mentions: { channels: { first: () => null } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandTicket.execute(fakeMsg, reason.split(' '));
      }

      case 'rps': {
        const choice = interaction.options.getString('choice');
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandRps.execute(fakeMsg, [choice]);
      }

      case 'trivia': {
        const fakeMsg = {
          author: interaction.user,
          guild: interaction.guild,
          member: interaction.member,
          channel: interaction.channel,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandTrivia.execute(fakeMsg, []);
      }

      case 'ship': {
        const u1 = interaction.options.getUser('user1');
        const u2 = interaction.options.getUser('user2') || interaction.user;
        const fakeMsg = {
          author: interaction.user,
          mentions: { users: { first: () => u1, at: () => u2 } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandShip.execute(fakeMsg, []);
      }

      case 'hug': {
        const target = interaction.options.getUser('user');
        const fakeMsg = {
          author: interaction.user,
          mentions: { users: { first: () => target } },
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandHug.execute(fakeMsg, []);
      }

      case 'botinfo': {
        const fakeMsg = {
          author: interaction.user,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandBotinfo.execute(fakeMsg, []);
      }

      case 'remind': {
        const duration = interaction.options.getString('duration');
        const msg      = interaction.options.getString('message');
        const fakeMsg = {
          author: interaction.user,
          channel: interaction.channel,
          reply: async (data) => { await interaction.editReply(data); return data; },
        };
        return commandReminder.execute(fakeMsg, [duration, ...msg.split(' ')]);
      }

      default:
        interaction.editReply({ embeds: [infoEmbed('Unknown Command', 'This slash command is not yet implemented.')] });
    }
  } catch (err) {
    log('ERROR', `Slash command error (${name}): ${err.message}`);
    interaction.editReply({ embeds: [errorEmbed('Error', err.message)] }).catch(() => {});
  }
}

// ── 🎫 ADVANCED Button Handler ────────────────────────────────
async function handleButton(interaction) {
  const id = interaction.customId;

  // ═══════════════════════════════════════════════════════════
  //  🎫 OPEN TICKET FROM PANEL
  // ═══════════════════════════════════════════════════════════
  if (id.startsWith('ticket_open_')) {
    const panelId = id.replace('ticket_open_', '');

    // Check blacklist
    if (db.ticketBlacklist.has(`${interaction.guild.id}_${interaction.user.id}`)) {
      return interaction.reply({ embeds: [errorEmbed('Blacklisted', 'You are blacklisted from creating tickets.')], ephemeral: true });
    }

    // Check if user already has open ticket
    const existing = [...db.tickets.values()].find(
      t => t.userId === interaction.user.id && t.guildId === interaction.guild.id && !t.closed
    );

    if (existing) {
      const ch = await interaction.guild.channels.fetch(existing.channelId).catch(() => null);
      return interaction.reply({
        embeds: [errorEmbed('Ticket Exists', `You already have an open ticket: ${ch || 'Unknown channel'}.`)],
        ephemeral: true,
      });
    }

    // Check for category select
    const categories = db.ticketCategories.get(interaction.guild.id);

    await interaction.deferReply({ ephemeral: true });

    if (categories && Object.keys(categories).length > 0) {
      const options = Object.entries(categories).slice(0, 25).map(([key, c]) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(c.label || key)
          .setValue(key)
          .setDescription(c.description || 'Open a ticket in this category')
          .setEmoji(c.emoji || '🎫')
      );

      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_category_select')
          .setPlaceholder('📂 Select a ticket category...')
          .addOptions(options),
      );

      return interaction.editReply({
        embeds: [infoEmbed('Select Category', 'Please select the category for your ticket from the menu below.')],
        components: [selectRow],
      });
    }

    // No categories configured — open directly
    const result = await createTicketChannel(interaction.guild, interaction.user, {
      reason: 'Opened from ticket panel',
      subject: 'Support Request',
      category: 'General',
      priority: 'normal',
      sourceChannel: interaction.channel,
    });

    if (result.error) {
      return interaction.editReply({ embeds: [errorEmbed('Error', result.error)] });
    }

    // Schedule auto-close
    scheduleAutoClose(result.channelId);

    return interaction.editReply({
      embeds: [successEmbed('Ticket Created', `Your ticket has been created: <#${result.channelId}>`)],
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 CLOSE TICKET
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_close') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')], ephemeral: true });

    const canClose = interaction.user.id === ticket.userId
      || ticket.claimedBy === interaction.user.id
      || interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!canClose) {
      return interaction.reply({ embeds: [errorEmbed('Cannot Close', 'You cannot close this ticket.')], ephemeral: true });
    }

    // Show confirmation
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_confirm_close').setLabel('Yes, Close').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
      new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    return interaction.reply({
      embeds: [warnEmbed('Confirm Close', 'Are you sure you want to close this ticket?\nA transcript will be generated and the channel will be deleted.')],
      components: [confirmRow],
      ephemeral: true,
    });
  }

  if (id === 'ticket_confirm_close') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'Error.')], ephemeral: true });
    if (ticket.closed) return interaction.update({ embeds: [infoEmbed('Already Closing', 'This ticket is already being closed.')], components: [] });

    ticket.closed   = true;
    ticket.closedAt = Date.now();
    ticket.closedBy = interaction.user.id;

    if (ticket.claimedBy) {
      const stats = getStaffStats(interaction.guild.id, ticket.claimedBy);
      stats.closed++;
    }

    await interaction.update({
      embeds: [successEmbed('Closing...', 'Generating transcript and deleting channel in 10 seconds.')],
      components: [],
    });

    // Generate + send transcript
    const transcript = await generateTicketTranscript(interaction.channel, ticket);
    await sendTicketTranscript(interaction.guild, ticket, transcript, interaction.user.id);

    // DM owner
    if (ticket.userId !== interaction.user.id) {
      try {
        const owner = await client.users.fetch(ticket.userId);
        const buf   = Buffer.from(transcript, 'utf8');
        const file  = new AttachmentBuilder(buf, { name: `ticket-${ticket.number}-transcript.txt` });
        await owner.send({
          embeds: [new EmbedBuilder()
            .setTitle('🎫 Your Ticket Has Been Closed')
            .setDescription(`Your ticket in **${interaction.guild.name}** has been closed by ${interaction.user.tag}.`)
            .setColor(Colors.Red)
            .setTimestamp()
          ],
          files: [file],
        }).catch(() => {});
      } catch (_) {}
    }

    await sendTicketRating(interaction.guild, ticket, interaction.user.id);

    await sleep(10000);
    await interaction.channel.delete('Ticket closed').catch(() => {});
    return;
  }

  if (id === 'ticket_cancel_close') {
    return interaction.update({ embeds: [infoEmbed('Cancelled', 'Ticket closure cancelled.')], components: [] });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 CLAIM / UNCLAIM
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_claim') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'This is not a ticket channel.')], ephemeral: true });
    if (ticket.closed) return interaction.reply({ embeds: [errorEmbed('Closed', 'Ticket is closed.')], ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can claim tickets.')], ephemeral: true });
    }

    if (ticket.claimedBy) {
      if (ticket.claimedBy === interaction.user.id) {
        ticket.claimedBy = null;
        return interaction.reply({ embeds: [warnEmbed('Unclaimed', `${interaction.user} unclaimed this ticket.`)] });
      }
      const claimer = await client.users.fetch(ticket.claimedBy).catch(() => ({ tag: 'Unknown' }));
      return interaction.reply({ embeds: [errorEmbed('Already Claimed', `Already claimed by **${claimer.tag}**.`)], ephemeral: true });
    }

    ticket.claimedBy = interaction.user.id;
    const stats = getStaffStats(interaction.guild.id, interaction.user.id);
    stats.claimed++;

    return interaction.reply({ embeds: [successEmbed('Claimed', `${interaction.user} has claimed this ticket.`)] });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 PRIORITY SELECTOR
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_priority') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'Error.')], ephemeral: true });

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only staff can set priority.')], ephemeral: true });
    }

    const options = Object.entries(TICKET_PRIORITIES).map(([key, p]) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(p.label)
        .setValue(key)
        .setEmoji(p.emoji)
        .setDescription(`SLA: ${formatDuration(p.sla)}`)
    );

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_set_priority')
        .setPlaceholder('⚡ Select priority level...')
        .addOptions(options)
    );

    return interaction.reply({ components: [row], ephemeral: true });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 ADD USER (opens modal)
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_adduser') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'Error.')], ephemeral: true });

    if (interaction.user.id !== ticket.userId && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only the owner or staff can add users.')], ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('ticket_adduser_modal')
      .setTitle('➕ Add User to Ticket');

    const input = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('User ID or @mention')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678 or @username')
      .setMaxLength(30)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    return interaction.showModal(modal);
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 TRANSCRIPT BUTTON
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_transcript') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed('Not a Ticket', 'Error.')], ephemeral: true });

    if (interaction.user.id !== ticket.userId && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [errorEmbed('Permission Denied', 'Only the owner or staff can request a transcript.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const content = await generateTicketTranscript(interaction.channel, ticket);
    const buffer  = Buffer.from(content, 'utf8');
    const file    = new AttachmentBuilder(buffer, { name: `ticket-${ticket.number}-transcript.txt` });

    return interaction.editReply({
      embeds: [successEmbed('Transcript Generated', `Here is the transcript (${content.length.toLocaleString()} bytes).`)],
      files:  [file],
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  ⭐ RATING BUTTONS
  // ═══════════════════════════════════════════════════════════
  if (id.startsWith('ticket_rate_')) {
    const parts    = id.split('_');
    const ticketId = parts[2];
    const rating   = parseInt(parts[3]);

    const ticket = db.tickets.get(ticketId);
    if (!ticket) return interaction.reply({ content: '❌ Ticket not found.', ephemeral: true });

    const feedbackKey = `${ticketId}_${interaction.user.id}`;
    if (db.ticketFeedback.has(feedbackKey)) {
      return interaction.reply({ content: '❌ You already rated this ticket.', ephemeral: true });
    }

    db.ticketFeedback.set(feedbackKey, {
      rating,
      userId: interaction.user.id,
      date:   Date.now(),
      ticketNumber: ticket.number,
    });

    // Update staff stats
    if (ticket.claimedBy) {
      const stats = getStaffStats(ticket.guildId, ticket.claimedBy);
      stats.ratingSum   += rating;
      stats.ratingCount += 1;
    }

    await interaction.update({
      embeds: [new EmbedBuilder()
        .setTitle('⭐ Thank You!')
        .setDescription(`You rated this ticket **${rating}/5** stars. Your feedback helps us improve!`)
        .setColor(Colors.Gold)
        .setFooter(brandFooter())
        .setTimestamp()
      ],
      components: [],
    });
    return;
  }

  // ═══════════════════════════════════════════════════════════
  //  LEGACY: Old button handlers (from previous versions)
  // ═══════════════════════════════════════════════════════════
}

// ── Select Menu Handler ───────────────────────────────────────
async function handleSelectMenu(interaction) {
  const id = interaction.customId;

  // ═══════════════════════════════════════════════════════════
  //  🎫 CATEGORY SELECT FROM TICKET COMMAND
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_category_select') {
    const categoryKey = interaction.values[0];
    const categories  = db.ticketCategories.get(interaction.guild.id) || {};
    const catConfig   = categories[categoryKey];

    if (!catConfig) {
      return interaction.update({ embeds: [errorEmbed('Invalid Category', 'That category no longer exists.')], components: [] });
    }

    // Check blacklist again
    if (db.ticketBlacklist.has(`${interaction.guild.id}_${interaction.user.id}`)) {
      return interaction.update({ embeds: [errorEmbed('Blacklisted', 'You are blacklisted.')], components: [] });
    }

    // Check existing ticket
    const existing = [...db.tickets.values()].find(
      t => t.userId === interaction.user.id && t.guildId === interaction.guild.id && !t.closed
    );

    if (existing) {
      return interaction.update({
        embeds: [errorEmbed('Ticket Exists', `You already have an open ticket: <#${existing.channelId}>`)],
        components: [],
      });
    }

    await interaction.deferUpdate();

    const result = await createTicketChannel(interaction.guild, interaction.user, {
      reason: `Opened via category: ${catConfig.label}`,
      subject: catConfig.label,
      category: catConfig.label,
      categoryKey,
      priority: 'normal',
    });

    if (result.error) {
      return interaction.editReply({ embeds: [errorEmbed('Error', result.error)] });
    }

    scheduleAutoClose(result.channelId);

    return interaction.editReply({
      embeds: [successEmbed('Ticket Created', `Your ticket has been created: <#${result.channelId}>`)],
      components: [],
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 PRIORITY SELECTION
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_set_priority') {
    const level = interaction.values[0];
    const ticket = db.tickets.get(interaction.channel.id);

    if (!ticket) return interaction.update({ embeds: [errorEmbed('Not a Ticket', 'Error.')], components: [] });
    if (!TICKET_PRIORITIES[level]) return interaction.update({ embeds: [errorEmbed('Invalid Priority', 'Error.')], components: [] });

    ticket.priority = level;
    const priority = TICKET_PRIORITIES[level];

    await interaction.update({
      embeds: [successEmbed('Priority Updated', `Priority set to **${priority.emoji} ${priority.label}**.`)],
      components: [],
    });

    // Post in channel
    await interaction.channel.send({
      embeds: [new EmbedBuilder()
        .setTitle(`${priority.emoji} Priority Changed`)
        .setDescription(`This ticket priority is now **${priority.label}**.\n**By:** ${interaction.user}\n**SLA:** ${formatDuration(priority.sla)}`)
        .setColor(priority.color)
        .setTimestamp()
      ]
    }).catch(() => {});
    return;
  }

  await interaction.deferUpdate().catch(() => {});
}

// ── Modal Handler ─────────────────────────────────────────────
async function handleModal(interaction) {
  const id = interaction.customId;

  // ═══════════════════════════════════════════════════════════
  //  🎫 TICKET SETUP MODAL
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_setup_modal') {
    if (!interaction.guild) {
      return interaction.reply({ content: '❌ This must be used in a server.', ephemeral: true });
    }

    const title       = interaction.fields.getTextInputValue('panel_title');
    const description = interaction.fields.getTextInputValue('panel_description');
    const categoryId  = interaction.fields.getTextInputValue('panel_category').trim();
    const staffRoleId = interaction.fields.getTextInputValue('panel_staffrole').trim();

    // Save config
    const config = getGuildConfig(interaction.guild.id);
    if (categoryId && /^\d{17,20}$/.test(categoryId)) {
      config.ticketCategory = categoryId;
    }
    if (staffRoleId && /^\d{17,20}$/.test(staffRoleId)) {
      config.ticketStaffRole = staffRoleId;
    }

    // Store panel
    db.ticketPanels.set(`setup_${interaction.guild.id}`, {
      guildId: interaction.guild.id,
      title,
      description,
      categoryId: categoryId || null,
      staffRoleId: staffRoleId || null,
    });

    return interaction.reply({
      embeds: [successEmbed('Setup Complete', `Panel configured!\n\n**Title:** ${title}\n**Category:** ${categoryId || 'None'}\n**Staff Role:** ${staffRoleId || 'None'}\n\nNow run \`!ticket panel\` in the channel where you want the panel to appear.`)],
      ephemeral: true,
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  🎫 ADD USER MODAL
  // ═══════════════════════════════════════════════════════════
  if (id === 'ticket_adduser_modal') {
    const ticket = db.tickets.get(interaction.channel.id);
    if (!ticket) return interaction.reply({ content: '❌ Not a ticket.', ephemeral: true });

    const input = interaction.fields.getTextInputValue('user_id').trim();
    const userId = input.replace(/[<@!>]/g, '');

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ content: '❌ Invalid user ID or mention.', ephemeral: true });
    }

    const target = await client.users.fetch(userId).catch(() => null);
    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
    if (target.id === ticket.userId) return interaction.reply({ content: '❌ User already owns this ticket.', ephemeral: true });

    try {
      await interaction.channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });

      await interaction.reply({
        embeds: [successEmbed('User Added', `${target} has been added to the ticket.`)],
      });

      await interaction.channel.send({
        content: `${target}`,
        embeds: [new EmbedBuilder()
          .setDescription(`👋 Welcome ${target}! You have been added to this ticket by ${interaction.user}.`)
          .setColor(Colors.Green)
          .setTimestamp()
        ],
      }).catch(() => {});
    } catch (err) {
      interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true });
    }
    return;
  }

  await interaction.deferUpdate().catch(() => {});
}

// ── Auto-Moderation ───────────────────────────────────────────
async function runAutomod(message) {
  const config = getGuildConfig(message.guild.id);
  if (!config.automod.enabled) return;

  // Skip if user has ManageMessages permission
  if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  // Skip whitelisted channels
  if (config.automod.whitelist.includes(message.channel.id)) return;

  let violated = false;
  let reason   = '';

  // Anti-Spam
  if (config.automod.antiSpam) {
    if (!spamTracker.has(message.author.id)) spamTracker.set(message.author.id, []);
    const timestamps = spamTracker.get(message.author.id);
    timestamps.push(Date.now());

    // Keep last 5 seconds
    const fiveSecsAgo = Date.now() - 5000;
    const recent = timestamps.filter(t => t > fiveSecsAgo);
    spamTracker.set(message.author.id, recent);

    if (recent.length >= 5) {
      violated = true;
      reason   = 'Anti-Spam: Too many messages';
    }
  }

  // Anti-Links
  if (!violated && config.automod.antiLinks) {
    const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
    if (linkRegex.test(message.content)) {
      violated = true;
      reason   = 'Anti-Links: External links not allowed';
    }
  }

  // Anti-Caps
  if (!violated && config.automod.antiCaps) {
    const content  = message.content;
    const letters  = content.replace(/[^a-zA-Z]/g, '');
    const caps     = content.replace(/[^A-Z]/g, '');
    if (letters.length >= 10 && (caps.length / letters.length) > 0.7) {
      violated = true;
      reason   = 'Anti-Caps: Too many capital letters';
    }
  }

  // Anti-Mass Mentions
  if (!violated) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (mentions >= config.automod.maxMentions) {
      violated = true;
      reason   = `Anti-Mentions: ${mentions} mentions (max ${config.automod.maxMentions})`;
    }
  }

  // Anti-Profanity
  if (!violated && config.automod.antiProfanity && config.automod.profanityList.length > 0) {
    const lower = message.content.toLowerCase();
    for (const word of config.automod.profanityList) {
      if (lower.includes(word.toLowerCase())) {
        violated = true;
        reason   = 'Anti-Profanity: Inappropriate language';
        break;
      }
    }
  }

  if (violated) {
    await message.delete().catch(() => {});

    const warn = await message.channel.send({
      content: `${message.author}`,
      embeds: [warnEmbed('⚠️ Auto-Mod', `Your message was deleted.\n**Reason:** ${reason}`)],
    }).catch(() => null);

    if (warn) safeDelete(warn, 5000);

    // Log to mod channel
    await sendLog(message.guild, new EmbedBuilder()
      .setTitle('🛡️ AutoMod Action')
      .addFields(
        { name: 'User',    value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel}`,                            inline: true },
        { name: 'Reason',  value: reason,                                          inline: false },
        { name: 'Message', value: truncate(message.content, 512) || '*[No text]*' },
      )
      .setColor(Colors.Orange)
      .setTimestamp()
    );
  }
}

// ── Message Delete (Snipe) ────────────────────────────────────
client.on('messageDelete', async message => {
  if (!message.guild || message.author?.bot) return;

  if (message.partial) {
    try { await message.fetch(); } catch (_) { return; }
  }

  db.snipe.set(message.channel.id, {
    content:     message.content || '',
    author:      message.author?.tag || 'Unknown',
    avatar:      message.author?.displayAvatarURL() || '',
    time:        Date.now(),
    attachments: message.attachments.map(a => a.proxyURL),
  });

  // Log message deletion
  if (!message.guild) return;
  const config = getGuildConfig(message.guild.id);
  if (!config.logsChannel && !config.modLogsChannel) return;

  // Add a delay to let audit log be populated
  await sleep(1000);

  const auditLogs = await message.guild.fetchAuditLogs({
    limit: 1,
    type:  AuditLogEvent.MessageDelete,
  }).catch(() => null);

  const entry   = auditLogs?.entries.first();
  const deletor = entry?.executor?.id !== message.author?.id ? entry?.executor : null;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .addFields(
      { name: 'Author',  value: message.author?.tag || 'Unknown',                    inline: true },
      { name: 'Channel', value: `${message.channel}`,                                 inline: true },
      { name: 'Content', value: truncate(message.content || '*[No content]*', 1024)  },
    )
    .setColor(Colors.Red)
    .setTimestamp();

  if (deletor) embed.addFields({ name: 'Deleted By', value: deletor.tag, inline: true });
  if (message.attachments.size > 0) embed.addFields({ name: '📎 Attachments', value: `${message.attachments.size}`, inline: true });

  await sendLog(message.guild, embed);
});

// ── Message Update (EditSnipe + Log) ──────────────────────────
client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot) return;

  if (oldMsg.content === newMsg.content) return;

  if (oldMsg.partial) {
    try { await oldMsg.fetch(); } catch (_) { return; }
  }

  db.editSnipe.set(oldMsg.channel.id, {
    oldContent: oldMsg.content || '',
    newContent: newMsg.content || '',
    author:     oldMsg.author?.tag || 'Unknown',
    avatar:     oldMsg.author?.displayAvatarURL() || '',
    time:       Date.now(),
  });

  // Log edit
  const config = getGuildConfig(oldMsg.guild.id);
  if (!config.logsChannel && !config.modLogsChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Message Edited')
    .setURL(newMsg.url)
    .addFields(
      { name: 'Author',  value: oldMsg.author?.tag || 'Unknown',    inline: true },
      { name: 'Channel', value: `${oldMsg.channel}`,                 inline: true },
      { name: 'Before',  value: truncate(oldMsg.content || '*[Empty]*', 512) },
      { name: 'After',   value: truncate(newMsg.content || '*[Empty]*', 512) },
    )
    .setColor(Colors.Yellow)
    .setTimestamp();

  await sendLog(oldMsg.guild, embed);
});

// ── Guild Member Add ──────────────────────────────────────────
client.on('guildMemberAdd', async member => {
  incStat(member.guild.id, 'joins');
  const config = getGuildConfig(member.guild.id);

  // Auto-roles
  for (const roleId of config.autoroles) {
    const role = member.guild.roles.cache.get(roleId);
    if (role) await member.roles.add(role).catch(() => {});
  }

  // Welcome message
  if (config.welcomeChannel) {
    const channel = await member.guild.channels.fetch(config.welcomeChannel).catch(() => null);
    if (channel) {
      const count  = member.guild.memberCount;
      const embed  = new EmbedBuilder()
        .setTitle('👋 Welcome!')
        .setDescription(`Welcome to **${member.guild.name}**, ${member}!\nYou are the **${ordinal(count)}** member!`)
        .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
        .setColor(Colors.Green)
        .setTimestamp();

      await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
    }
  }

  // Log join
  const embed = new EmbedBuilder()
    .setTitle('📥 Member Joined')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'User',    value: `${member.user.tag} (${member.id})`,   inline: true },
      { name: 'Created', value: `<t:${Math.floor(member.user.createdTimestamp/1000)}:R>`, inline: true },
      { name: 'Members', value: `${member.guild.memberCount}`,          inline: true },
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await sendLog(member.guild, embed);
});

// ── Guild Member Remove ───────────────────────────────────────
client.on('guildMemberRemove', async member => {
  incStat(member.guild.id, 'leaves');
  const config = getGuildConfig(member.guild.id);

  // Goodbye message
  if (config.goodbyeChannel) {
    const channel = await member.guild.channels.fetch(config.goodbyeChannel).catch(() => null);
    if (channel) {
      const embed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`**${member.user.tag}** has left **${member.guild.name}**.\nWe now have **${member.guild.memberCount}** members.`)
        .setThumbnail(member.user.displayAvatarURL({ size: 512 }))
        .setColor(Colors.Red)
        .setTimestamp();

      await channel.send({ embeds: [embed] }).catch(() => {});
    }
  }

  // Log leave
  const embed = new EmbedBuilder()
    .setTitle('📤 Member Left')
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'User',    value: `${member.user.tag} (${member.id})`,     inline: true },
      { name: 'Joined',  value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp/1000)}:R>` : 'Unknown', inline: true },
      { name: 'Members', value: `${member.guild.memberCount}`,            inline: true },
    )
    .setColor(Colors.Red)
    .setTimestamp();

  await sendLog(member.guild, embed);
});

// ── Guild Member Update ───────────────────────────────────────
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const config = getGuildConfig(newMember.guild.id);
  if (!config.logsChannel && !config.modLogsChannel) return;

  const addedRoles   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
  const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

  if (addedRoles.size === 0 && removedRoles.size === 0 && oldMember.nickname === newMember.nickname) return;

  const embed = new EmbedBuilder()
    .setTitle('🔄 Member Updated')
    .setThumbnail(newMember.user.displayAvatarURL())
    .addFields({ name: 'User', value: `${newMember.user.tag} (${newMember.id})` })
    .setColor(Colors.Yellow)
    .setTimestamp();

  if (oldMember.nickname !== newMember.nickname) {
    embed.addFields({ name: 'Nickname', value: `${oldMember.nickname || 'None'} → ${newMember.nickname || 'None'}` });
  }

  if (addedRoles.size > 0) {
    embed.addFields({ name: '+ Roles Added', value: addedRoles.map(r => `${r}`).join(', ') });
  }

  if (removedRoles.size > 0) {
    embed.addFields({ name: '- Roles Removed', value: removedRoles.map(r => `${r}`).join(', ') });
  }

  await sendLog(newMember.guild, embed);
});

// ── Guild Ban Add ─────────────────────────────────────────────
client.on('guildBanAdd', async ban => {
  await sleep(500);
  const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
  const entry     = auditLogs?.entries.first();

  const embed = new EmbedBuilder()
    .setTitle('🔨 Member Banned')
    .addFields(
      { name: 'User',      value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      { name: 'Reason',    value: ban.reason || entry?.reason || 'No reason',    inline: true },
      { name: 'Moderator', value: entry?.executor?.tag || 'Unknown',              inline: true },
    )
    .setColor(Colors.Red)
    .setTimestamp();

  await sendLog(ban.guild, embed);
});

// ── Guild Ban Remove ──────────────────────────────────────────
client.on('guildBanRemove', async ban => {
  await sleep(500);
  const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove }).catch(() => null);
  const entry     = auditLogs?.entries.first();

  const embed = new EmbedBuilder()
    .setTitle('🔓 Member Unbanned')
    .addFields(
      { name: 'User',      value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      { name: 'Moderator', value: entry?.executor?.tag || 'Unknown',   inline: true },
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await sendLog(ban.guild, embed);
});

// ── Voice State Update ────────────────────────────────────────
client.on('voiceStateUpdate', async (oldState, newState) => {
  const config = getGuildConfig(newState.guild.id);
  if (!config.logsChannel && !config.modLogsChannel) return;

  const member = newState.member;
  if (!member) return;

  let title = '';
  let color = Colors.Blue;

  if (!oldState.channel && newState.channel) {
    title = `🔊 Joined Voice: #${newState.channel.name}`;
    color = Colors.Green;
  } else if (oldState.channel && !newState.channel) {
    title = `🔇 Left Voice: #${oldState.channel.name}`;
    color = Colors.Red;
  } else if (oldState.channel !== newState.channel) {
    title = `🔄 Moved Voice: #${oldState.channel?.name} → #${newState.channel?.name}`;
    color = Colors.Yellow;
  } else if (oldState.selfMute !== newState.selfMute) {
    title = newState.selfMute ? '🔇 Self-Muted' : '🔊 Self-Unmuted';
  } else if (oldState.selfDeaf !== newState.selfDeaf) {
    title = newState.selfDeaf ? '🔇 Self-Deafened' : '🔊 Self-Undeafened';
  } else {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .addFields({ name: 'Member', value: `${member.user.tag} (${member.id})` })
    .setColor(color)
    .setTimestamp();

  // Only log significant events
  if (title.includes('Joined') || title.includes('Left') || title.includes('Moved')) {
    await sendLog(newState.guild, embed);
  }
});

// ── Channel Create ────────────────────────────────────────────
client.on('channelCreate', async channel => {
  if (!channel.guild) return;
  const embed = new EmbedBuilder()
    .setTitle('📝 Channel Created')
    .addFields(
      { name: 'Channel', value: `${channel} (${channel.name})`, inline: true },
      { name: 'Type',    value: `${channel.type}`,               inline: true },
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await sendLog(channel.guild, embed);
});

// ── Channel Delete ────────────────────────────────────────────
client.on('channelDelete', async channel => {
  if (!channel.guild) return;
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Channel Deleted')
    .addFields(
      { name: 'Channel', value: channel.name, inline: true },
      { name: 'Type',    value: `${channel.type}`, inline: true },
    )
    .setColor(Colors.Red)
    .setTimestamp();

  await sendLog(channel.guild, embed);
});

// ── Role Create ───────────────────────────────────────────────
client.on('roleCreate', async role => {
  const embed = new EmbedBuilder()
    .setTitle('🎭 Role Created')
    .addFields(
      { name: 'Role',  value: `${role} (${role.name})`, inline: true },
      { name: 'Color', value: role.hexColor,             inline: true },
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await sendLog(role.guild, embed);
});

// ── Role Delete ───────────────────────────────────────────────
client.on('roleDelete', async role => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Role Deleted')
    .addFields({ name: 'Role', value: role.name, inline: true })
    .setColor(Colors.Red)
    .setTimestamp();

  await sendLog(role.guild, embed);
});

// ── Reaction Add (Starboard + Reaction Roles) ─────────────────
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch (_) { return; }
  }

  const message = reaction.message;
  if (!message.guild) return;

  const config = getGuildConfig(message.guild.id);

  // Starboard
  if (reaction.emoji.name === '⭐' && config.starboardChannel && message.channel.id !== config.starboardChannel) {
    const starCount = reaction.count;

    if (starCount >= config.starboardMin) {
      const starChannel = await message.guild.channels.fetch(config.starboardChannel).catch(() => null);
      if (!starChannel) return;

      const existing = db.stars.get(message.id);

      if (!existing) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
          .setDescription(message.content || '*[No text]*')
          .addFields({ name: '🔗 Original', value: `[Jump to message](${message.url})` })
          .setColor(Colors.Gold)
          .setTimestamp(message.createdTimestamp);

        if (message.attachments.size > 0) {
          const img = message.attachments.find(a => a.contentType?.startsWith('image/'));
          if (img) embed.setImage(img.url);
        }

        const starMsg = await starChannel.send({ content: `⭐ **${starCount}** | ${message.channel}`, embeds: [embed] });
        db.stars.set(message.id, { count: starCount, boardMessageId: starMsg.id });

      } else {
        // Update star count
        const starMsg = await starChannel.messages.fetch(existing.boardMessageId).catch(() => null);
        if (starMsg) {
          await starMsg.edit({ content: `⭐ **${starCount}** | ${message.channel}` }).catch(() => {});
          existing.count = starCount;
        }
      }
    }
  }

  // Reaction Roles
  const rrKey = `${message.guild.id}_${message.id}`;
  const rr    = db.reactionRoles.get(rrKey);

  if (rr) {
    const rrEntry = rr.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
    if (rrEntry) {
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const role = message.guild.roles.cache.get(rrEntry.roleId);
        if (role) await member.roles.add(role).catch(() => {});
      }
    }
  }
});

// ── Reaction Remove (Reaction Roles) ─────────────────────────
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) {
    try { await reaction.fetch(); } catch (_) { return; }
  }

  const message = reaction.message;
  if (!message.guild) return;

  const rrKey = `${message.guild.id}_${message.id}`;
  const rr    = db.reactionRoles.get(rrKey);

  if (rr) {
    const rrEntry = rr.find(r => r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
    if (rrEntry) {
      const member = await message.guild.members.fetch(user.id).catch(() => null);
      if (member) {
        const role = message.guild.roles.cache.get(rrEntry.roleId);
        if (role) await member.roles.remove(role).catch(() => {});
      }
    }
  }
});

// ── Emoji Create/Delete ───────────────────────────────────────
client.on('emojiCreate', async emoji => {
  const embed = new EmbedBuilder()
    .setTitle('😀 Emoji Created')
    .setThumbnail(emoji.imageURL())
    .addFields(
      { name: 'Name',     value: emoji.name,       inline: true },
      { name: 'ID',       value: emoji.id,          inline: true },
      { name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
    )
    .setColor(Colors.Green)
    .setTimestamp();

  await sendLog(emoji.guild, embed);
});

client.on('emojiDelete', async emoji => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Emoji Deleted')
    .addFields({ name: 'Name', value: emoji.name, inline: true })
    .setColor(Colors.Red)
    .setTimestamp();

  await sendLog(emoji.guild, embed);
});

// ── Guild Update (Server Changes) ────────────────────────────
client.on('guildUpdate', async (oldGuild, newGuild) => {
  const changes = [];

  if (oldGuild.name !== newGuild.name)
    changes.push(`**Name:** ${oldGuild.name} → ${newGuild.name}`);
  if (oldGuild.description !== newGuild.description)
    changes.push(`**Description:** Changed`);
  if (oldGuild.verificationLevel !== newGuild.verificationLevel)
    changes.push(`**Verification Level:** ${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`);

  if (changes.length === 0) return;

  const embed = new EmbedBuilder()
    .setTitle('🔄 Server Updated')
    .setDescription(changes.join('\n'))
    .setColor(Colors.Yellow)
    .setTimestamp();

  await sendLog(newGuild, embed);
});

// ── Bot Joined a Guild ────────────────────────────────────────
client.on('guildCreate', async guild => {
  log('SUCCESS', `➕ Joined guild: ${guild.name} (${guild.id}) — now in ${client.guilds.cache.size} guilds`);
  try {
    const owner = await guild.fetchOwner().catch(() => null);
    if (owner) {
      await owner.send({ embeds: [infoEmbed('Thanks for adding me! 🎉',
        `Thanks for adding **${BOT_NAME}** to **${guild.name}**!

` +
        `• View all commands: \`${PREFIX}help\`
` +
        `• Change prefix: \`${PREFIX}setprefix\`
` +
        `• Set mod logs: \`${PREFIX}setlogs #channel\`
` +
        `• Server config: \`${PREFIX}serverconfig\`
` +
        `• Ticket setup: \`${PREFIX}ticket setup\`

` +
        `Have fun! 🚀`)] }).catch(() => {});
    }
  } catch (_) {}
});

// ── Bot Left a Guild ──────────────────────────────────────────
client.on('guildDelete', guild => {
  log('WARN', `➖ Left guild: ${guild.name} (${guild.id}) — now in ${client.guilds.cache.size} guilds`);
});

// ── Rate-Limit Guard ──────────────────────────────────────────
client.rest.on('rateLimited', info => {
  log('WARN', `Rate limited on ${info.method} ${info.route} — retry after ${info.retryAfter}ms (global: ${info.global})`);
});

// ── Graceful Shutdown ─────────────────────────────────────────
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    log('WARN', `Received ${sig} — shutting down gracefully...`);
    try {
      client.user?.setPresence({ activities: [{ name: 'Restarting…', type: ActivityType.Watching }], status: 'dnd' });
      await sleep(1500);
      client.destroy();
    } catch (_) {}
    process.exit(0);
  });
}

// ── Error Handling ────────────────────────────────────────────
client.on('error', err => {
  log('ERROR', `Client error: ${err.message}`);
});

client.on('warn', warn => {
  log('WARN', `Client warning: ${warn}`);
});

client.on('shardError', (error, shardId) => {
  log('ERROR', `Shard ${shardId} error: ${error.message}`);
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', `Unhandled rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  log('ERROR', `Uncaught exception: ${error.message}`);
  log('ERROR', error.stack);
});

// ── Sticky Messages ───────────────────────────────────────────
const commandSticky = {
  name: 'sticky',
  aliases: ['stickymsg', 'pin-msg'],
  description: 'Set a sticky message in a channel',
  usage: 'set <message> | clear | status',
  category: 'Utility',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'set') {
      const content = args.slice(1).join(' ');
      if (!content) return message.reply({ embeds: [errorEmbed('Missing Content', 'Please provide the sticky message content.')] });

      db.stickyMessages.set(message.channel.id, { content, messageId: null });
      const embed = new EmbedBuilder()
        .setTitle('📌 Sticky Message')
        .setDescription(content)
        .setColor(Colors.Yellow)
        .setFooter({ text: 'This message will stay at the bottom of the channel.' })
        .setTimestamp();

      const stickyMsg = await message.channel.send({ embeds: [embed] });
      db.stickyMessages.get(message.channel.id).messageId = stickyMsg.id;

      return message.reply({ embeds: [successEmbed('Sticky Set', 'Sticky message has been set!')] }).then(m => safeDelete(m, 5000));
    }

    if (sub === 'clear') {
      const sticky = db.stickyMessages.get(message.channel.id);
      if (!sticky) return message.reply({ embeds: [infoEmbed('No Sticky', 'No sticky message is set for this channel.')] });

      if (sticky.messageId) {
        const msg = await message.channel.messages.fetch(sticky.messageId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }

      db.stickyMessages.delete(message.channel.id);
      return message.reply({ embeds: [successEmbed('Sticky Cleared', 'Sticky message has been removed.')] });
    }

    if (sub === 'status') {
      const sticky = db.stickyMessages.get(message.channel.id);
      if (!sticky) return message.reply({ embeds: [infoEmbed('No Sticky', 'No sticky message in this channel.')] });

      return message.reply({ embeds: [infoEmbed('Sticky Message', `**Content:** ${sticky.content}`)] });
    }

    message.reply({ embeds: [infoEmbed('Sticky Usage', '`!sticky set <message>` — Set sticky\n`!sticky clear` — Remove sticky\n`!sticky status` — View sticky')] });
  },
};

client.commands.set(commandSticky.name, commandSticky);

// ── Handle sticky on message create ──────────────────────────
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const sticky = db.stickyMessages.get(message.channel.id);
  if (!sticky) return;

  // Delete old sticky if it's not the latest message
  if (sticky.messageId && sticky.messageId !== message.id) {
    const oldMsg = await message.channel.messages.fetch(sticky.messageId).catch(() => null);
    if (oldMsg) await oldMsg.delete().catch(() => {});

    // Re-send sticky
    const embed = new EmbedBuilder()
      .setTitle('📌 Sticky Message')
      .setDescription(sticky.content)
      .setColor(Colors.Yellow)
      .setFooter({ text: 'This message stays at the bottom.' })
      .setTimestamp();

    const newMsg = await message.channel.send({ embeds: [embed] }).catch(() => null);
    if (newMsg) sticky.messageId = newMsg.id;
  }
});

// ── Anti-Raid ─────────────────────────────────────────────────
client.on('guildMemberAdd', async member => {
  const now = Date.now();
  if (!antiRaidTracker.has(member.guild.id)) antiRaidTracker.set(member.guild.id, []);

  const joins = antiRaidTracker.get(member.guild.id);
  joins.push(now);

  // Keep only joins in last 10 seconds
  const recent = joins.filter(t => now - t < 10000);
  antiRaidTracker.set(member.guild.id, recent);

  if (recent.length >= 10) {
    // Potential raid detected!
    const config = getGuildConfig(member.guild.id);

    await sendLog(member.guild, new EmbedBuilder()
      .setTitle('🚨 RAID ALERT')
      .setDescription(`**${recent.length}** members joined in the last 10 seconds! Potential raid detected!`)
      .setColor(Colors.Red)
      .setTimestamp()
    );
  }
});

// ── Reaction Role Manager Command ─────────────────────────────
const commandReactionrole = {
  name: 'reactionrole',
  aliases: ['rr', 'rrole'],
  description: 'Manage reaction roles',
  usage: 'add <message_id> <emoji> <@role> | remove <message_id> <emoji> | list <message_id> | clear <message_id>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'add') {
      const msgId  = args[1];
      const emoji  = args[2];
      const role   = message.mentions.roles.first() || message.guild.roles.cache.get(args[3]);

      if (!msgId || !emoji || !role) {
        return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!reactionrole add <msg_id> <emoji> <@role>`')] });
      }

      const target = await message.channel.messages.fetch(msgId).catch(() => null);
      if (!target) return message.reply({ embeds: [errorEmbed('Message Not Found', 'Cannot find that message.')] });

      await target.react(emoji).catch(() => {});

      const key = `${message.guild.id}_${msgId}`;
      if (!db.reactionRoles.has(key)) db.reactionRoles.set(key, []);
      db.reactionRoles.get(key).push({ emoji, roleId: role.id });

      return message.reply({ embeds: [successEmbed('Reaction Role Added', `React with ${emoji} on [that message](${target.url}) to receive ${role}!`)] });
    }

    if (sub === 'remove') {
      const msgId = args[1];
      const emoji = args[2];
      const key   = `${message.guild.id}_${msgId}`;

      if (!db.reactionRoles.has(key)) return message.reply({ embeds: [errorEmbed('Not Found', 'No reaction roles on that message.')] });

      const rrs = db.reactionRoles.get(key);
      const idx = rrs.findIndex(r => r.emoji === emoji);

      if (idx === -1) return message.reply({ embeds: [errorEmbed('Not Found', 'No reaction role with that emoji.')] });

      rrs.splice(idx, 1);
      if (rrs.length === 0) db.reactionRoles.delete(key);

      return message.reply({ embeds: [successEmbed('Removed', `Reaction role for ${emoji} has been removed.`)] });
    }

    if (sub === 'list') {
      const msgId = args[1];
      const key   = `${message.guild.id}_${msgId}`;
      const rrs   = db.reactionRoles.get(key) || [];

      if (rrs.length === 0) return message.reply({ embeds: [infoEmbed('No Reaction Roles', 'No reaction roles on that message.')] });

      const lines = rrs.map(r => `${r.emoji} → <@&${r.roleId}>`).join('\n');
      return message.reply({ embeds: [infoEmbed('Reaction Roles', lines)] });
    }

    if (sub === 'clear') {
      const msgId = args[1];
      const key   = `${message.guild.id}_${msgId}`;
      db.reactionRoles.delete(key);
      return message.reply({ embeds: [successEmbed('Cleared', 'All reaction roles for that message have been removed.')] });
    }

    message.reply({ embeds: [infoEmbed('Reaction Role Usage', '`!rr add <msg_id> <emoji> <@role>`\n`!rr remove <msg_id> <emoji>`\n`!rr list <msg_id>`\n`!rr clear <msg_id>`')] });
  },
};

client.commands.set(commandReactionrole.name, commandReactionrole);

// ── Confession Command ─────────────────────────────────────────
const commandConfess = {
  name: 'confess',
  aliases: ['confession'],
  description: 'Send an anonymous confession',
  usage: '<message>',
  category: 'Fun',
  cooldown: 30,
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const channelId = config.confessChannel;

    if (!channelId) return message.reply({ embeds: [errorEmbed('Not Configured', 'No confession channel has been set up.')] });

    const content = args.join(' ');
    if (!content) return message.reply({ embeds: [errorEmbed('Missing Content', 'Please provide your confession.')] });
    if (content.length > 1000) return message.reply({ embeds: [errorEmbed('Too Long', 'Confession must be 1000 characters or less.')] });

    const channel = await message.guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return message.reply({ embeds: [errorEmbed('Channel Not Found', 'The confession channel could not be found.')] });

    const id = genId();
    const embed = new EmbedBuilder()
      .setTitle('🤫 Anonymous Confession')
      .setDescription(content)
      .setFooter({ text: `Confession #${id} | Anonymous` })
      .setColor(Colors.DarkButNotBlack)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});

    const reply = await message.channel.send({ embeds: [successEmbed('Confession Sent', `Your confession has been sent anonymously! (ID: \`${id}\`)`)] }).catch(() => null);
    if (reply) safeDelete(reply, 5000);
  },
};

client.commands.set(commandConfess.name, commandConfess);

// ── Setconfesschannel ──────────────────────────────────────────
const commandSetconfesschannel = {
  name: 'setconfesschannel',
  aliases: ['confesschannel'],
  description: 'Set the confession channel',
  usage: '<#channel|off>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);

    if (args[0]?.toLowerCase() === 'off') {
      config.confessChannel = null;
      return message.reply({ embeds: [successEmbed('Confessions Disabled', 'Confession channel has been cleared.')] });
    }

    const channel = message.mentions.channels.first() || message.channel;
    config.confessChannel = channel.id;

    message.reply({ embeds: [successEmbed('Confession Channel Set', `Confessions will be sent in ${channel}.`)] });
  },
};

client.commands.set(commandSetconfesschannel.name, commandSetconfesschannel);

// ── Advanced Stats Channels ────────────────────────────────────
const commandStatschannels = {
  name: 'statschannels',
  aliases: ['statschannel', 'sc'],
  description: 'Manage stats channels (member count, bot count, etc.)',
  usage: 'setup | update | disable',
  category: 'Config',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const sub    = args[0]?.toLowerCase();
    const config = getGuildConfig(message.guild.id);

    if (sub === 'setup') {
      const guild    = message.guild;
      const category = await guild.channels.create({
        name: '📊 Server Stats',
        type: ChannelType.GuildCategory,
      });

      const total   = await guild.channels.create({ name: `👥 Total: ${guild.memberCount}`,  type: ChannelType.GuildVoice, parent: category });
      const members = await guild.channels.create({ name: `👤 Members: ${guild.members.cache.filter(m => !m.user.bot).size}`, type: ChannelType.GuildVoice, parent: category });
      const bots    = await guild.channels.create({ name: `🤖 Bots: ${guild.members.cache.filter(m => m.user.bot).size}`, type: ChannelType.GuildVoice, parent: category });

      // Make channels view-only
      for (const ch of [total, members, bots]) {
        await ch.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: true,
          Connect: false,
        });
      }

      config.statsChannels = { total: total.id, members: members.id, bots: bots.id };

      return message.reply({ embeds: [successEmbed('Stats Channels Created', 'Stats channels have been set up! They will update automatically.')] });
    }

    if (sub === 'update') {
      await updateStatsChannels(message.guild);
      return message.reply({ embeds: [successEmbed('Updated', 'Stats channels have been updated.')] });
    }

    if (sub === 'disable') {
      config.statsChannels = {};
      return message.reply({ embeds: [successEmbed('Disabled', 'Stats channels configuration cleared.')] });
    }

    message.reply({ embeds: [infoEmbed('Stats Channels', '`!statschannels setup` — Create stats channels\n`!statschannels update` — Update counts now\n`!statschannels disable` — Clear config')] });
  },
};

client.commands.set(commandStatschannels.name, commandStatschannels);

async function updateStatsChannels(guild) {
  const config = getGuildConfig(guild.id);
  if (!config.statsChannels || Object.keys(config.statsChannels).length === 0) return;

  await guild.members.fetch();
  const total   = guild.memberCount;
  const members = guild.members.cache.filter(m => !m.user.bot).size;
  const bots    = guild.members.cache.filter(m => m.user.bot).size;

  const updates = [
    { id: config.statsChannels.total,   name: `👥 Total: ${total}`   },
    { id: config.statsChannels.members, name: `👤 Members: ${members}` },
    { id: config.statsChannels.bots,    name: `🤖 Bots: ${bots}`     },
  ];

  for (const u of updates) {
    if (!u.id) continue;
    const ch = await guild.channels.fetch(u.id).catch(() => null);
    if (ch) await ch.setName(u.name).catch(() => {});
  }
}

// Update stats channels on member join/leave
client.on('guildMemberAdd', async member => {
  await updateStatsChannels(member.guild);
});

client.on('guildMemberRemove', async member => {
  await updateStatsChannels(member.guild);
});

// Update stats channels every 10 minutes
setInterval(async () => {
  for (const guild of client.guilds.cache.values()) {
    await updateStatsChannels(guild).catch(() => {});
  }
}, 600000);

// ── Temp Channels ──────────────────────────────────────────────
const commandTempvcsetup = {
  name: 'tempvcsetup',
  aliases: ['tempvc'],
  description: 'Set up temporary voice channels (join to create)',
  usage: '<#voice_channel>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return message.reply({ embeds: [errorEmbed('Invalid Channel', 'Please mention a valid voice channel.')] });
    }

    const config = getGuildConfig(message.guild.id);
    config.tempVcTrigger = channel.id;

    message.reply({ embeds: [successEmbed('Temp VC Setup', `When someone joins ${channel}, a new temp VC will be created for them!`)] });
  },
};

client.commands.set(commandTempvcsetup.name, commandTempvcsetup);

// Handle temp VC creation
client.on('voiceStateUpdate', async (oldState, newState) => {
  const config = getGuildConfig(newState.guild.id);
  if (!config.tempVcTrigger) return;

  // Member joins the trigger channel
  if (newState.channelId === config.tempVcTrigger && newState.channelId !== oldState.channelId) {
    const member = newState.member;
    if (!member) return;

    try {
      const tempCh = await newState.guild.channels.create({
        name:   `🔊 ${member.displayName}'s Channel`,
        type:   ChannelType.GuildVoice,
        parent: newState.channel.parent,
        permissionOverwrites: [
          {
            id:    member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers, PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      await member.voice.setChannel(tempCh);
      db.tempChannels.set(tempCh.id, { owner: member.id, guildId: newState.guild.id });

    } catch (err) {
      log('ERROR', `Temp VC creation error: ${err.message}`);
    }
  }

  // Delete temp channel when it's empty
  if (oldState.channel) {
    const tempData = db.tempChannels.get(oldState.channelId);
    if (tempData && oldState.channel.members.size === 0) {
      await oldState.channel.delete('Temp VC empty').catch(() => {});
      db.tempChannels.delete(oldState.channelId);
    }
  }
});

// ── Random events system ──────────────────────────────────────
// Random events occur in servers occasionally to keep things interesting.

function startRandomEvents() {
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      const config = getGuildConfig(guild.id);
      if (!config.logsChannel) continue;

      // 5% chance of a random event per guild per 30 minutes
      if (Math.random() < 0.05) {
        const events = [
          { name: '🎁 Drop Event', description: 'A mystery box has appeared! Type `!collect` to claim $500!', reward: 500 },
          { name: '⭐ XP Boost', description: 'XP is doubled for the next 30 minutes!', reward: 0 },
          { name: '🎲 Trivia Rush', description: 'Use `!trivia` in the next 5 minutes for double XP!', reward: 0 },
        ];

        const event = randomChoice(events);
        const channel = await guild.channels.fetch(config.logsChannel).catch(() => null);
        if (channel) {
          await channel.send({ embeds: [new EmbedBuilder()
            .setTitle(`🌟 Random Event: ${event.name}`)
            .setDescription(event.description)
            .setColor(Colors.Gold)
            .setTimestamp()
          ] }).catch(() => {});
        }
      }
    }
  }, 1800000); // 30 minutes
}

// ── Collect command (for random drop events) ──────────────────
const commandCollect = {
  name: 'collect',
  aliases: ['grab', 'claim'],
  description: 'Collect a random drop event reward',
  usage: '',
  category: 'Economy',
  cooldown: 60,
  async execute(message) {
    // Simple implementation - in real use, track active drop events
    const chance = Math.random();
    if (chance < 0.3) {
      const amount = randInt(100, 500);
      const eco    = getEconomy(message.author.id);
      eco.balance += amount;
      return message.reply({ embeds: [successEmbed('🎁 Collected!', `You grabbed **$${formatNumber(amount)}** from a random drop!`)] });
    }
    message.reply({ embeds: [infoEmbed('Too Slow!', 'There are no active drops to collect right now.')] });
  },
};

client.commands.set(commandCollect.name, commandCollect);

// ── Pet System ────────────────────────────────────────────────
const commandPetcommand = {
  name: 'pet',
  aliases: ['pets', 'mypet'],
  description: 'Manage your virtual pet',
  usage: 'adopt <name> <type> | feed | play | status | release',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const pet = db.pets.get(message.author.id);

    if (sub === 'adopt') {
      if (pet) return message.reply({ embeds: [errorEmbed('Already Has Pet', 'You already have a pet! Release it first.')] });

      const name = args[1];
      const type = args[2]?.toLowerCase();
      const validTypes = ['dog', 'cat', 'bird', 'fish', 'dragon', 'fox', 'rabbit'];

      if (!name || !type) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!pet adopt <name> <type>`')] });
      if (!validTypes.includes(type)) return message.reply({ embeds: [errorEmbed('Invalid Type', `Valid types: ${validTypes.join(', ')}`)] });

      const emojis = { dog: '🐶', cat: '🐱', bird: '🐦', fish: '🐟', dragon: '🐉', fox: '🦊', rabbit: '🐰' };

      db.pets.set(message.author.id, {
        name, type, emoji: emojis[type],
        hunger: 100, happiness: 100, health: 100,
        xp: 0, level: 1, born: Date.now(),
      });

      return message.reply({ embeds: [successEmbed('Pet Adopted!', `You adopted a ${emojis[type]} **${name}**! Take good care of it!`)] });
    }

    if (!pet) return message.reply({ embeds: [errorEmbed('No Pet', 'You don\'t have a pet! Adopt one with `!pet adopt <name> <type>`.')] });

    if (sub === 'feed') {
      const eco = getEconomy(message.author.id);
      if (eco.balance < 50) return message.reply({ embeds: [errorEmbed('No Money', 'You need $50 to feed your pet.')] });

      eco.balance -= 50;
      pet.hunger   = Math.min(100, pet.hunger + 30);
      pet.xp      += 10;

      if (pet.xp >= pet.level * 100) { pet.level++; pet.xp = 0; }

      return message.reply({ embeds: [successEmbed('Fed!', `You fed **${pet.name}**! Hunger: ${pet.hunger}/100 | Level: ${pet.level}`)] });
    }

    if (sub === 'play') {
      pet.happiness = Math.min(100, pet.happiness + 20);
      pet.hunger    = Math.max(0, pet.hunger - 10);
      pet.xp       += 15;

      if (pet.xp >= pet.level * 100) { pet.level++; pet.xp = 0; }

      return message.reply({ embeds: [successEmbed('Playtime!', `You played with **${pet.name}**! Happiness: ${pet.happiness}/100`)] });
    }

    if (sub === 'status') {
      const age = formatDuration(Date.now() - pet.born);
      const embed = new EmbedBuilder()
        .setTitle(`${pet.emoji} ${pet.name}`)
        .addFields(
          { name: '🍖 Hunger',     value: progressBar(pet.hunger, 100, 10),    inline: false },
          { name: '😊 Happiness', value: progressBar(pet.happiness, 100, 10), inline: false },
          { name: '❤️ Health',    value: progressBar(pet.health, 100, 10),    inline: false },
          { name: '⭐ Level',     value: `${pet.level}`,                       inline: true  },
          { name: '✨ XP',        value: `${pet.xp}/${pet.level * 100}`,      inline: true  },
          { name: '🕑 Age',       value: age,                                  inline: true  },
        )
        .setColor(Colors.Green)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (sub === 'release') {
      const name = pet.name;
      db.pets.delete(message.author.id);
      return message.reply({ embeds: [warnEmbed('Pet Released', `You released **${name}** into the wild. Goodbye! 🌿`)] });
    }

    message.reply({ embeds: [infoEmbed('Pet Commands', '`!pet adopt <name> <type>` — Adopt a pet\n`!pet feed` — Feed your pet ($50)\n`!pet play` — Play with your pet\n`!pet status` — View pet status\n`!pet release` — Release your pet')] });
  },
};

client.commands.set(commandPetcommand.name, commandPetcommand);

// ── Translate command (mock) ───────────────────────────────────
const commandTranslate = {
  name: 'translate',
  aliases: ['tr'],
  description: 'Translate text (requires translation API)',
  usage: '<language> <text>',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const lang = args[0];
    const text = args.slice(1).join(' ');

    if (!lang || !text) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!translate <lang_code> <text>`\nExample: `!translate es Hello world`')] });

    // In production, connect to Google Translate or DeepL API
    message.reply({ embeds: [infoEmbed('Translation', `**Language:** ${lang}\n**Text:** ${text}\n\n⚠️ *Translation requires a translation API (Google Translate/DeepL). Please configure an API key and connect it to this command.*`)] });
  },
};

client.commands.set(commandTranslate.name, commandTranslate);

// ── Bot uptime display ─────────────────────────────────────────
const commandUptime = {
  name: 'uptime',
  aliases: ['up'],
  description: 'View the bot\'s uptime',
  usage: '',
  category: 'Info',
  cooldown: 5,
  async execute(message) {
    message.reply({ embeds: [infoEmbed('⏱️ Uptime', `The bot has been online for **${formatDuration(client.uptime)}**.`)] });
  },
};

client.commands.set(commandUptime.name, commandUptime);

// ── Mass DM command (owner only) ──────────────────────────────
const commandMassdm = {
  name: 'massdm',
  aliases: ['dmall'],
  description: '[OWNER] DM all server members',
  usage: '<guild_id> <message>',
  category: 'Owner',
  cooldown: 30,
  ownerOnly: true,
  async execute(message, args) {
    const guildId = args[0];
    const text    = args.slice(1).join(' ');

    if (!guildId || !text) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!massdm <guild_id> <message>`')] });

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) return message.reply({ embeds: [errorEmbed('Guild Not Found', 'Guild not found.')] });

    const members = await guild.members.fetch();
    let sent = 0, failed = 0;

    const embed = new EmbedBuilder()
      .setTitle(`📬 Message from ${guild.name}`)
      .setDescription(text)
      .setColor(Colors.Blue)
      .setTimestamp();

    for (const [, member] of members) {
      if (member.user.bot) continue;
      await member.send({ embeds: [embed] }).then(() => sent++).catch(() => failed++);
      await sleep(500); // Rate limit protection
    }

    message.reply({ embeds: [successEmbed('Mass DM Complete', `**Sent:** ${sent}\n**Failed:** ${failed}`)] });
  },
};

client.commands.set(commandMassdm.name, commandMassdm);

// ── Prefix manager ────────────────────────────────────────────
const commandPrefixshow = {
  name: 'currentprefix',
  aliases: ['prefixinfo', 'getprefix'],
  description: 'Show the current server prefix',
  usage: '',
  category: 'Info',
  cooldown: 3,
  async execute(message) {
    const config = getGuildConfig(message.guild?.id || '0');
    message.reply({ embeds: [infoEmbed('Current Prefix', `The prefix for this server is \`${config.prefix}\`\n\nChange it with \`${config.prefix}setprefix <new_prefix>\``)] });
  },
};

client.commands.set(commandPrefixshow.name, commandPrefixshow);

// ── Join / Leave message customiser ───────────────────────────
const commandWelcomemsg = {
  name: 'welcomemsg',
  aliases: ['setwelcomemessage'],
  description: 'Set a custom welcome message',
  usage: '<message> (Use {user} {guild} {membercount} as placeholders)',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const msg    = args.join(' ');

    if (!msg) return message.reply({ embeds: [errorEmbed('Missing Message', 'Please provide a welcome message. Use `{user}`, `{guild}`, `{membercount}` as placeholders.')] });

    config.welcomeMessage = msg;
    const preview = msg
      .replace('{user}', message.author.toString())
      .replace('{guild}', message.guild.name)
      .replace('{membercount}', message.guild.memberCount.toString());

    message.reply({ embeds: [successEmbed('Welcome Message Set', `**Preview:**\n${preview}`)] });
  },
};

client.commands.set(commandWelcomemsg.name, commandWelcomemsg);

// ── Image manipulation (Avatar-based) ────────────────────────
const commandWant = {
  name: 'wanted',
  aliases: ['wantedposter'],
  description: 'Generate a "Wanted" poster for a user',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 10,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ size: 256, format: 'png' });

    const embed = new EmbedBuilder()
      .setTitle('🤠 WANTED')
      .setDescription(`**WANTED: ${user.username}**\n\nDeadOrAlive\n\nReward: $${formatNumber(randInt(500, 5000))}`)
      .setImage(avatarUrl)
      .setColor(Colors.Yellow)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandWant.name, commandWant);

// ── Server Rules ──────────────────────────────────────────────
const commandRules = {
  name: 'rules',
  aliases: ['rule', 'serverrules'],
  description: 'Display server rules',
  usage: '[rule_number]',
  category: 'Info',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const rules  = config.rules || [
      'Be respectful to all members.',
      'No spamming or flooding the chat.',
      'No NSFW content outside of designated channels.',
      'No harassment or bullying.',
      'Follow Discord\'s Terms of Service.',
      'Listen to staff members.',
      'No advertising without permission.',
      'Keep discussions in relevant channels.',
      'No doxxing or sharing personal information.',
      'Have fun and be kind!',
    ];

    const ruleNum = parseInt(args[0]);
    if (!isNaN(ruleNum) && ruleNum >= 1 && ruleNum <= rules.length) {
      return message.reply({ embeds: [infoEmbed(`Rule #${ruleNum}`, rules[ruleNum - 1])] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${message.guild.name} Rules`)
      .setDescription(rules.map((r, i) => `**${i+1}.** ${r}`).join('\n\n'))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandRules.name, commandRules);

// ── Server rules setter ───────────────────────────────────────
const commandSetrule = {
  name: 'setrule',
  aliases: ['addrule', 'editrule'],
  description: 'Add or edit a server rule',
  usage: '<rule_number> <text>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    if (!config.rules) config.rules = [];

    const num  = parseInt(args[0]);
    const text = args.slice(1).join(' ');

    if (isNaN(num) || num < 1 || num > 25) return message.reply({ embeds: [errorEmbed('Invalid Number', 'Rule number must be between 1 and 25.')] });
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide rule text.')] });

    config.rules[num - 1] = text;
    message.reply({ embeds: [successEmbed('Rule Set', `Rule #${num} has been set:\n${text}`)] });
  },
};

client.commands.set(commandSetrule.name, commandSetrule);

// ── Lock all channels ─────────────────────────────────────────
const commandLockdown = {
  name: 'lockdown',
  aliases: ['lockall', 'fulllock'],
  description: 'Lock all text channels in the server',
  usage: '[reason]',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator],
  guildOnly: true,
  async execute(message, args) {
    const reason   = args.join(' ') || 'Server lockdown initiated';
    const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

    let locked = 0, failed = 0;

    await message.reply({ embeds: [warnEmbed('🔒 Lockdown Initiated', `Locking ${channels.size} channels...\n**Reason:** ${reason}`)] });

    for (const [, ch] of channels) {
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason }).then(() => locked++).catch(() => failed++);
    }

    await message.channel.send({ embeds: [successEmbed('Lockdown Complete', `Locked **${locked}** channels.\nFailed: **${failed}**\n**Reason:** ${reason}`)] });
    await sendLog(message.guild, new EmbedBuilder()
      .setTitle('🔒 SERVER LOCKDOWN')
      .addFields(
        { name: 'Moderator', value: message.author.tag, inline: true },
        { name: 'Channels',  value: `${locked} locked`,  inline: true },
        { name: 'Reason',    value: reason },
      )
      .setColor(Colors.DarkRed)
      .setTimestamp()
    );
  },
};

client.commands.set(commandLockdown.name, commandLockdown);

// ── Unlock all channels ───────────────────────────────────────
const commandUnlockall = {
  name: 'unlockall',
  aliases: ['unlockdown', 'fullunlock'],
  description: 'Unlock all text channels in the server',
  usage: '[reason]',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Administrator],
  guildOnly: true,
  async execute(message, args) {
    const reason   = args.join(' ') || 'Server lockdown lifted';
    const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

    let unlocked = 0, failed = 0;

    await message.reply({ embeds: [infoEmbed('🔓 Unlocking...', `Unlocking ${channels.size} channels...\n**Reason:** ${reason}`)] });

    for (const [, ch] of channels) {
      await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null }, { reason }).then(() => unlocked++).catch(() => failed++);
    }

    await message.channel.send({ embeds: [successEmbed('Lockdown Lifted', `Unlocked **${unlocked}** channels.\n**Reason:** ${reason}`)] });
  },
};

client.commands.set(commandUnlockall.name, commandUnlockall);

// ── Clone channel ─────────────────────────────────────────────
const commandClone = {
  name: 'clone',
  aliases: ['clonechannel', 'duplicate'],
  description: 'Clone a channel',
  usage: '[#channel] [new_name]',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;
    const newName = args.slice(1).join('-').replace(/ /g, '-') || `${channel.name}-clone`;

    try {
      const cloned = await channel.clone({ name: newName, reason: `Channel cloned by ${message.author.tag}` });
      message.reply({ embeds: [successEmbed('Channel Cloned', `Successfully cloned ${channel} as ${cloned}!`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandClone.name, commandClone);

// ── Nuke channel ──────────────────────────────────────────────
const commandNuke = {
  name: 'nuke',
  aliases: ['nukechannel', 'reset-channel'],
  description: 'Nuke a channel (clone then delete)',
  usage: '[#channel]',
  category: 'Moderation',
  cooldown: 30,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('nuke_yes').setLabel('Yes, Nuke It!').setStyle(ButtonStyle.Danger).setEmoji('💥'),
      new ButtonBuilder().setCustomId('nuke_no').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
    );

    const confirmMsg = await message.reply({ embeds: [warnEmbed('⚠️ Confirm Nuke', `Are you sure you want to nuke **${channel.name}**?\nThis will clone the channel and delete the original (all messages will be lost!)`)], components: [row] });

    const collector = confirmMsg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000,
      max: 1,
    });

    collector.on('collect', async i => {
      if (i.customId === 'nuke_yes') {
        try {
          const cloned = await channel.clone({ reason: `Channel nuked by ${message.author.tag}` });
          await channel.delete(`Nuked by ${message.author.tag}`);

          await cloned.send({ embeds: [new EmbedBuilder()
            .setTitle('💥 Channel Nuked')
            .setDescription('This channel has been nuked and recreated!')
            .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
            .setColor(Colors.Red)
            .setTimestamp()
          ] });
        } catch (err) {
          await i.update({ embeds: [errorEmbed('Error', err.message)], components: [] });
        }
      } else {
        await i.update({ embeds: [infoEmbed('Cancelled', 'Nuke cancelled.')], components: [] });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await confirmMsg.edit({ embeds: [infoEmbed('Timed Out', 'Nuke cancelled.')], components: [] });
      }
    });
  },
};

client.commands.set(commandNuke.name, commandNuke);

// ── Whois command (IP lookup mock) ───────────────────────────
const commandWhois = {
  name: 'whois',
  aliases: ['lookup'],
  description: 'Look up user information',
  usage: '[@user|id]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Alias for userinfo
    return commandUserinfo.execute(message, args);
  },
};

client.commands.set(commandWhois.name, commandWhois);

// ── Hackban (ban user not in server) ─────────────────────────
const commandHackban = {
  name: 'hackban',
  aliases: ['forceban', 'idban'],
  description: 'Ban a user not in the server by ID',
  usage: '<user_id> [reason]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    const userId = args[0];
    const reason = args.slice(1).join(' ') || 'Hackban';

    if (!userId || !/^\d{17,20}$/.test(userId)) {
      return message.reply({ embeds: [errorEmbed('Invalid ID', 'Please provide a valid user ID.')] });
    }

    try {
      await message.guild.members.ban(userId, { reason });
      message.reply({ embeds: [successEmbed('Hackban Applied', `User \`${userId}\` has been banned.\n**Reason:** ${reason}`)] });
      await sendLog(message.guild, new EmbedBuilder()
        .setTitle('🔨 Hackban')
        .addFields(
          { name: 'User ID',   value: userId,              inline: true },
          { name: 'Moderator',value: message.author.tag,   inline: true },
          { name: 'Reason',   value: reason },
        )
        .setColor(Colors.DarkRed)
        .setTimestamp()
      );
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandHackban.name, commandHackban);

// ── Message count (per user) ──────────────────────────────────
const commandMessagecount = {
  name: 'messagecount',
  aliases: ['msgcount', 'messages'],
  description: 'View message count for a user',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const entry  = getLevelEntry(message.guild.id, member.id);

    message.reply({ embeds: [infoEmbed('💬 Message Count', `**${member.user.tag}** has sent **${formatNumber(entry.messages)}** messages in this server.`)] });
  },
};

client.commands.set(commandMessagecount.name, commandMessagecount);

// ── Leaderboard by messages ───────────────────────────────────
const commandMsglb = {
  name: 'msgleaderboard',
  aliases: ['msglb', 'chatterbox'],
  description: 'View the message count leaderboard',
  usage: '[page]',
  category: 'Levels',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const page = parseInt(args[0]) || 1;

    const sorted = [...db.levels.entries()]
      .filter(([k]) => k.startsWith(message.guild.id))
      .sort(([,a], [,b]) => b.messages - a.messages);

    if (sorted.length === 0) return message.reply({ embeds: [infoEmbed('Empty', 'No data yet.')] });

    const { items, total } = paginate(sorted, page, 10);

    const lines = await Promise.all(items.map(async ([key, data], i) => {
      const uid  = key.split('_')[1];
      const user = await client.users.fetch(uid).catch(() => ({ tag: 'Unknown' }));
      return `${(page-1)*10+i+1}. **${user.tag}** — ${formatNumber(data.messages)} messages`;
    }));

    const embed = new EmbedBuilder()
      .setTitle(`💬 Message Leaderboard — ${message.guild.name}`)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Page ${page}/${total}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandMsglb.name, commandMsglb);

// ── Fun: Spotify (mock) ───────────────────────────────────────
const commandSpotify = {
  name: 'spotify',
  aliases: ['music-status', 'nowlistening'],
  description: 'Show a user\'s Spotify activity',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const spotify = member.presence?.activities.find(a => a.name === 'Spotify');

    if (!spotify) {
      return message.reply({ embeds: [infoEmbed('Not Listening', `**${member.user.tag}** is not currently listening to Spotify.`)] });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Spotify')
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .addFields(
        { name: '🎵 Song',   value: spotify.details || 'Unknown',      inline: true },
        { name: '👤 Artist', value: spotify.state || 'Unknown',        inline: true },
        { name: '💿 Album',  value: spotify.assets?.largeText || 'Unknown', inline: true },
      )
      .setThumbnail(spotify.assets?.largeImageURL?.() || null)
      .setColor('#1DB954')
      .setTimestamp();

    if (spotify.timestamps?.start && spotify.timestamps?.end) {
      const elapsed = Date.now() - spotify.timestamps.start;
      const total   = spotify.timestamps.end - spotify.timestamps.start;
      embed.addFields({ name: '⏱️ Progress', value: `${progressBar(elapsed, total)} ${formatDuration(elapsed)}/${formatDuration(total)}` });
    }

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandSpotify.name, commandSpotify);

// ── Fun: Status ────────────────────────────────────────────────
const commandStatus = {
  name: 'status',
  aliases: ['activity', 'presence'],
  description: 'View a user\'s status and activity',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const presence = member.presence;

    const statusEmojis = { online: '🟢', idle: '🟡', dnd: '🔴', offline: '⚫', invisible: '⚫' };
    const statusNames  = { online: 'Online', idle: 'Idle', dnd: 'Do Not Disturb', offline: 'Offline', invisible: 'Invisible' };

    const status = presence?.status || 'offline';

    const embed = new EmbedBuilder()
      .setTitle(`${statusEmojis[status]} ${member.user.tag}'s Status`)
      .addFields({ name: 'Status', value: statusNames[status] || 'Unknown', inline: true });

    if (presence?.activities?.length > 0) {
      const act = presence.activities[0];
      embed.addFields({
        name: `${act.name}`,
        value: [act.state, act.details].filter(Boolean).join('\n') || 'No details',
        inline: false,
      });
    }

    embed.setColor(Colors.Blue).setTimestamp();
    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandStatus.name, commandStatus);

// ── Password generator ────────────────────────────────────────
const commandPassword = {
  name: 'password',
  aliases: ['genpassword', 'pw'],
  description: 'Generate a secure random password',
  usage: '[length]',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const len = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    const password = Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    message.author.send({ embeds: [new EmbedBuilder()
      .setTitle('🔐 Generated Password')
      .setDescription(`\`\`\`${password}\`\`\``)
      .addFields({ name: 'Length', value: `${len} characters` })
      .setColor(Colors.Green)
      .setFooter({ text: 'Keep this safe! This message was sent privately.' })
      .setTimestamp()
    ] }).catch(() => {});

    message.reply({ embeds: [successEmbed('Password Sent', 'A secure password has been sent to your DMs!')] });
  },
};

client.commands.set(commandPassword.name, commandPassword);

// ── QR Code generator (link based) ───────────────────────────
const commandQr = {
  name: 'qr',
  aliases: ['qrcode'],
  description: 'Generate a QR code for text/URL',
  usage: '<text|url>',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const text = args.join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Missing Text', 'Please provide text or a URL.')] });

    const encoded = encodeURIComponent(text);
    const url     = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;

    const embed = new EmbedBuilder()
      .setTitle('📷 QR Code')
      .setDescription(`**Content:** ${text}`)
      .setImage(url)
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandQr.name, commandQr);

// ── Base64 encode/decode ──────────────────────────────────────
const commandBase64 = {
  name: 'base64',
  aliases: ['b64'],
  description: 'Encode or decode base64',
  usage: '<encode|decode> <text>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const mode = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');

    if (!mode || !text) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!base64 <encode|decode> <text>`')] });

    try {
      let result;
      if (mode === 'encode') {
        result = Buffer.from(text, 'utf8').toString('base64');
      } else if (mode === 'decode') {
        result = Buffer.from(text, 'base64').toString('utf8');
      } else {
        return message.reply({ embeds: [errorEmbed('Invalid Mode', 'Use `encode` or `decode`.')] });
      }

      if (result.length > 1900) return message.reply({ embeds: [errorEmbed('Too Long', 'Result is too long to display.')] });

      message.reply({ embeds: [infoEmbed(`Base64 ${mode === 'encode' ? 'Encoded' : 'Decoded'}`, `**Input:** ${text.slice(0, 200)}\n**Result:** ${result}`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', 'Invalid base64 input.')] });
    }
  },
};

client.commands.set(commandBase64.name, commandBase64);

// ── Hash command ─────────────────────────────────────────────
const commandHash = {
  name: 'hash',
  aliases: ['md5', 'sha256'],
  description: 'Hash text using MD5 or SHA256',
  usage: '<md5|sha256|sha1> <text>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const algo = args[0]?.toLowerCase();
    const text = args.slice(1).join(' ');

    if (!algo || !text) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!hash <md5|sha256|sha1> <text>`')] });

    const validAlgos = ['md5', 'sha256', 'sha1', 'sha512'];
    if (!validAlgos.includes(algo)) return message.reply({ embeds: [errorEmbed('Invalid Algorithm', `Valid algorithms: ${validAlgos.join(', ')}`)] });

    const crypto = require('crypto');
    const hash   = crypto.createHash(algo === 'md5' ? 'md5' : algo).update(text).digest('hex');

    message.reply({ embeds: [infoEmbed('🔒 Hash', `**Algorithm:** ${algo.toUpperCase()}\n**Input:** ${text.slice(0, 200)}\n**Hash:** \`${hash}\``)] });
  },
};

client.commands.set(commandHash.name, commandHash);

// ── AI fake quote generator ───────────────────────────────────
const commandFakequote = {
  name: 'fakequote',
  aliases: ['quote', 'fq'],
  description: 'Generate a fake inspirational quote',
  usage: '',
  category: 'Fun',
  cooldown: 3,
  async execute(message) {
    const quotes = [
      ['The secret of getting ahead is getting started.', 'Mark Twain'],
      ['The only way to do great work is to love what you do.', 'Steve Jobs'],
      ['In the middle of every difficulty lies opportunity.', 'Albert Einstein'],
      ['Success is not final, failure is not fatal.', 'Winston Churchill'],
      ['The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt'],
      ['It does not matter how slowly you go as long as you do not stop.', 'Confucius'],
      ['Life is what happens when you\'re busy making other plans.', 'John Lennon'],
      ['Spread love everywhere you go.', 'Mother Teresa'],
      ['When you reach the end of your rope, tie a knot in it and hang on.', 'Franklin D. Roosevelt'],
      ['Always remember that you are absolutely unique.', 'Margaret Mead'],
    ];

    const [quote, author] = randomChoice(quotes);

    const embed = new EmbedBuilder()
      .setTitle('💬 Quote')
      .setDescription(`*"${quote}"*`)
      .setFooter({ text: `— ${author}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandFakequote.name, commandFakequote);

// ── Dice rolling ─────────────────────────────────────────────
const commandDice = {
  name: 'dice',
  aliases: ['roll', 'diceroll'],
  description: 'Roll dice (e.g. 2d6, 1d20)',
  usage: '<NdN>',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const input = args[0] || '1d6';
    const match = input.match(/^(\d+)d(\d+)$/i);

    if (!match) return message.reply({ embeds: [errorEmbed('Invalid Format', 'Use format like `2d6` (2 six-sided dice).')] });

    const count = Math.min(parseInt(match[1]), 20);
    const sides = Math.min(parseInt(match[2]), 1000);

    if (count < 1 || sides < 2) return message.reply({ embeds: [errorEmbed('Invalid Dice', 'Must roll at least 1 die with at least 2 sides.')] });

    const rolls  = Array.from({ length: count }, () => randInt(1, sides));
    const total  = rolls.reduce((s, r) => s + r, 0);

    const embed = new EmbedBuilder()
      .setTitle(`🎲 Dice Roll: ${input}`)
      .addFields(
        { name: 'Rolls',  value: rolls.map(r => `\`${r}\``).join(' '), inline: false },
        { name: 'Total',  value: `**${total}**`, inline: true },
        { name: 'Average',value: `${(total/count).toFixed(2)}`, inline: true },
        { name: 'Max',    value: `${Math.max(...rolls)}`, inline: true },
        { name: 'Min',    value: `${Math.min(...rolls)}`, inline: true },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandDice.name, commandDice);

// ── Compliment ────────────────────────────────────────────────
const commandCompliment = {
  name: 'compliment',
  aliases: ['compliments', 'nice'],
  description: 'Send a compliment to someone',
  usage: '[@user]',
  category: 'Fun',
  cooldown: 3,
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;

    const compliments = [
      'You are an incredible human being!',
      'Your smile brightens up every room you walk into.',
      'You have an amazing sense of humor!',
      'You make the world a better place just by being in it.',
      'You are one of the most talented people I know.',
      'Your creativity is truly inspiring!',
      'You are an exceptional listener.',
      'You bring out the best in those around you.',
      'Your kindness knows no bounds.',
      'You are absolutely stunning inside and out!',
      'The world is a better place with you in it.',
      'You radiate positivity and it\'s contagious!',
    ];

    const compliment = randomChoice(compliments);

    const embed = new EmbedBuilder()
      .setTitle('💖 Compliment')
      .setDescription(`${target}, ${compliment}`)
      .setColor(Colors.Pink)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandCompliment.name, commandCompliment);

// ── Insult (gentle, SFW) ──────────────────────────────────────
const commandRoast = {
  name: 'roast',
  aliases: ['burn', 'insult'],
  description: 'Send a playful roast to someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;

    const roasts = [
      'Your WiFi password is probably just "password".',
      'You\'re the reason they put directions on shampoo.',
      'I\'d agree with you but then we\'d both be wrong.',
      'You\'re not stupid, you just have bad luck thinking.',
      'I\'ve seen people like you before, but I had to pay admission.',
      'You bring everyone so much joy when you leave the room.',
      'I would challenge you to a battle of wits, but I see you\'re unarmed.',
    ];

    const embed = new EmbedBuilder()
      .setTitle('🔥 Roast')
      .setDescription(`${target}, ${randomChoice(roasts)}`)
      .setColor(Colors.Orange)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandRoast.name, commandRoast);

// ── Colorful text (Discord formatting) ───────────────────────
const commandFormattext = {
  name: 'formattext',
  aliases: ['fmt', 'format'],
  description: 'Format text with Discord markdown',
  usage: '<bold|italic|underline|strikethrough|spoiler|mono|code> <text>',
  category: 'Utility',
  cooldown: 3,
  async execute(message, args) {
    const format = args[0]?.toLowerCase();
    const text   = args.slice(1).join(' ');

    if (!format || !text) return message.reply({ embeds: [infoEmbed('Format Types', 'bold, italic, underline, strikethrough, spoiler, mono, code')] });

    const formatters = {
      bold:          t => `**${t}**`,
      italic:        t => `*${t}*`,
      underline:     t => `__${t}__`,
      strikethrough: t => `~~${t}~~`,
      spoiler:       t => `||${t}||`,
      mono:          t => `\`${t}\``,
      code:          t => `\`\`\`${t}\`\`\``,
    };

    if (!formatters[format]) return message.reply({ embeds: [errorEmbed('Invalid Format', `Valid formats: ${Object.keys(formatters).join(', ')}`)] });

    await message.delete().catch(() => {});
    message.channel.send({ content: formatters[format](text) });
  },
};

client.commands.set(commandFormattext.name, commandFormattext);

// ── Giveaway entry check ───────────────────────────────────────
const commandGwcheck = {
  name: 'gwcheck',
  aliases: ['giveawaycheck', 'gwentries'],
  description: 'Check how many entries a giveaway has',
  usage: '<message_id>',
  category: 'Giveaways',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const id = args[0];
    const gw = db.giveaways.get(id);

    if (!gw) return message.reply({ embeds: [errorEmbed('Not Found', 'No giveaway found with that message ID.')] });

    const msg    = await message.channel.messages.fetch(id).catch(() => null);
    const reaction = msg?.reactions.cache.get('🎉');
    const count    = reaction ? reaction.count - 1 : gw.entries.length;

    message.reply({ embeds: [infoEmbed('Giveaway Entries', `**Prize:** ${gw.prize}\n**Entries:** ${count}\n**Winners:** ${gw.winners}\n**Ends:** <t:${Math.floor(gw.ends/1000)}:R>`)] });
  },
};

client.commands.set(commandGwcheck.name, commandGwcheck);

// ── Server template ───────────────────────────────────────────
const commandServertemplate = {
  name: 'template',
  aliases: ['servertemplate', 'guildtemplate'],
  description: 'Get a server template link',
  usage: '',
  category: 'Utility',
  cooldown: 30,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message) {
    try {
      const templates = await message.guild.fetchTemplates();
      if (templates.size === 0) {
        // Create one
        const template = await message.guild.createTemplate('Bot Template', 'Server template created by the bot.');
        return message.reply({ embeds: [successEmbed('Template Created', `Template link: https://discord.new/${template.code}`)] });
      }

      const template = templates.first();
      message.reply({ embeds: [infoEmbed('Server Template', `Template link: https://discord.new/${template.code}`)] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandServertemplate.name, commandServertemplate);

// ── Advanced search (member search) ──────────────────────────
const commandSearch = {
  name: 'search',
  aliases: ['find', 'findmember'],
  description: 'Search for members by name',
  usage: '<query>',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const query = args.join(' ').toLowerCase();
    if (!query) return message.reply({ embeds: [errorEmbed('Missing Query', 'Please provide a search query.')] });

    const results = message.guild.members.cache.filter(m =>
      m.user.tag.toLowerCase().includes(query) ||
      (m.nickname?.toLowerCase().includes(query))
    ).first(10);

    if (!results.size && results.length === 0) {
      return message.reply({ embeds: [infoEmbed('No Results', `No members found matching \`${query}\`.`)] });
    }

    const list = [...(results.values ? results.values() : [results])];

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Search Results for "${query}"`)
      .setDescription(list.map(m => `• **${m.user.tag}** ${m.nickname ? `*(${m.nickname})*` : ''} — \`${m.id}\``).join('\n'))
      .setFooter({ text: `Showing up to 10 results` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandSearch.name, commandSearch);

// ── Emoji list ────────────────────────────────────────────────
const commandEmojilist = {
  name: 'emojis',
  aliases: ['emojilist', 'allemojis'],
  description: 'List all custom emojis in the server',
  usage: '[page]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const page   = parseInt(args[0]) || 1;
    const emojis = [...message.guild.emojis.cache.values()];

    if (emojis.length === 0) return message.reply({ embeds: [infoEmbed('No Custom Emojis', 'This server has no custom emojis.')] });

    const { items, total } = paginate(emojis, page, 20);

    const embed = new EmbedBuilder()
      .setTitle(`😀 Custom Emojis (${emojis.length} total)`)
      .setDescription(items.map(e => `${e} \`:${e.name}:\``).join(' '))
      .setFooter({ text: `Page ${page}/${total}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandEmojilist.name, commandEmojilist);

// ── Sticker info ──────────────────────────────────────────────
const commandStickerlist = {
  name: 'stickers',
  aliases: ['stickerlist'],
  description: 'List all stickers in the server',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const stickers = [...message.guild.stickers.cache.values()];

    if (stickers.length === 0) return message.reply({ embeds: [infoEmbed('No Stickers', 'This server has no custom stickers.')] });

    const embed = new EmbedBuilder()
      .setTitle(`🪄 Custom Stickers (${stickers.length})`)
      .setDescription(stickers.map(s => `• **${s.name}** — ${s.description || 'No description'}`).join('\n'))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandStickerlist.name, commandStickerlist);

// ── Invite info ───────────────────────────────────────────────
const commandInvites = {
  name: 'invites',
  aliases: ['serverinvites', 'myinvites'],
  description: 'View server invites or your invite count',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const target = message.mentions.members.first() || message.member;
    const invites = await message.guild.invites.fetch().catch(() => null);

    if (!invites) return message.reply({ embeds: [errorEmbed('Error', 'Could not fetch invites.')] });

    const userInvites = invites.filter(i => i.inviter?.id === target.id);
    const totalUses   = userInvites.reduce((s, i) => s + (i.uses || 0), 0);

    const embed = new EmbedBuilder()
      .setTitle(`🔗 Invites — ${target.user.tag}`)
      .addFields(
        { name: '📊 Total Invites', value: `${userInvites.size}`, inline: true },
        { name: '👥 Total Joins',   value: `${totalUses}`,        inline: true },
      )
      .setThumbnail(target.user.displayAvatarURL())
      .setColor(Colors.Blue)
      .setTimestamp();

    if (userInvites.size > 0) {
      embed.addFields({
        name: 'Invite Links',
        value: [...userInvites.values()].slice(0, 5).map(i =>
          `\`${i.code}\` — ${i.uses} uses — ${i.channel}`
        ).join('\n'),
      });
    }

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandInvites.name, commandInvites);

// ── Purge until ───────────────────────────────────────────────
const commandPurgeuntil = {
  name: 'purgeuntil',
  aliases: ['clearuntil', 'purgeto'],
  description: 'Delete messages until a specific message ID',
  usage: '<message_id>',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const targetId = args[0];
    if (!targetId) return message.reply({ embeds: [errorEmbed('Missing ID', 'Please provide a message ID.')] });

    const messages = await message.channel.messages.fetch({ limit: 100, after: targetId });

    if (messages.size === 0) return message.reply({ embeds: [infoEmbed('No Messages', 'No messages found after that ID.')] });

    // Filter out messages older than 14 days
    const valid = messages.filter(m => Date.now() - m.createdTimestamp < 1209600000);

    if (valid.size === 0) return message.reply({ embeds: [errorEmbed('Too Old', 'All messages are older than 14 days and cannot be bulk deleted.')] });

    const deleted = await message.channel.bulkDelete(valid, true);
    message.reply({ embeds: [successEmbed('Purged', `Deleted **${deleted.size}** messages.`)] }).then(m => safeDelete(m, 5000));
  },
};

client.commands.set(commandPurgeuntil.name, commandPurgeuntil);

// ── Temporary ban ─────────────────────────────────────────────
const commandTempban = {
  name: 'tempban',
  aliases: ['tb', 'tban'],
  description: 'Temporarily ban a member',
  usage: '<@user> <duration> [reason]',
  category: 'Moderation',
  cooldown: 5,
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first()
      || await message.guild.members.fetch(args[0]).catch(() => null);

    if (!member) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a valid member.')] });
    if (!member.bannable) return message.reply({ embeds: [errorEmbed('Cannot Ban', 'I cannot ban this member.')] });

    const durationStr = args[1];
    if (!durationStr) return message.reply({ embeds: [errorEmbed('Missing Duration', 'Please provide a ban duration (e.g. 1h, 1d).')] });

    const ms = parseDuration(durationStr);
    if (ms < 60000) return message.reply({ embeds: [errorEmbed('Too Short', 'Minimum temp-ban duration is 1 minute.')] });

    const reason = args.slice(2).join(' ') || 'Temporary ban';
    const until  = new Date(Date.now() + ms);

    try {
      await member.send({ embeds: [warnEmbed('Temp Banned', `You have been temporarily banned from **${message.guild.name}**.\n**Duration:** ${formatDuration(ms)}\n**Until:** <t:${Math.floor(until.getTime()/1000)}:F>\n**Reason:** ${reason}`)] }).catch(() => {});
      await message.guild.members.ban(member.id, { reason });

      message.reply({ embeds: [successEmbed('Temp Ban Applied', `**${member.user.tag}** has been banned for **${formatDuration(ms)}**.\n**Until:** <t:${Math.floor(until.getTime()/1000)}:F>\n**Reason:** ${reason}`)] });

      setTimeout(async () => {
        await message.guild.members.unban(member.id, 'Temp ban expired').catch(() => {});
        log('INFO', `Temp ban expired for ${member.user.tag} in ${message.guild.name}`);
      }, ms);

      await sendLog(message.guild, modEmbed('Temp Ban', member.user, message.member, reason, {
        Duration: formatDuration(ms),
        Until: `<t:${Math.floor(until.getTime()/1000)}:F>`,
      }));
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandTempban.name, commandTempban);

// ── Slowmode escalation ───────────────────────────────────────
const commandFloodmode = {
  name: 'floodmode',
  aliases: ['fm', 'slowall'],
  description: 'Enable slowmode on all channels',
  usage: '<seconds|off>',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const input   = args[0]?.toLowerCase();
    const seconds = input === 'off' ? 0 : parseInt(input) || 5;

    const channels = message.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    let done = 0;

    for (const [, ch] of channels) {
      await ch.setRateLimitPerUser(seconds).catch(() => {});
      done++;
    }

    message.reply({ embeds: [successEmbed('Flood Mode', seconds === 0
      ? `Slowmode disabled on all **${done}** channels.`
      : `Slowmode set to **${seconds}s** on all **${done}** channels.`
    )] });
  },
};

client.commands.set(commandFloodmode.name, commandFloodmode);

// ── Nickname mass reset ───────────────────────────────────────
const commandResetallnicks = {
  name: 'resetallnicks',
  aliases: ['clearnicks'],
  description: 'Reset all nicknames in the server',
  usage: '',
  category: 'Moderation',
  cooldown: 30,
  permissions: [PermissionFlagsBits.ManageNicknames],
  guildOnly: true,
  async execute(message) {
    const members = await message.guild.members.fetch();
    let reset = 0, failed = 0;

    await message.reply({ embeds: [infoEmbed('Resetting...', `Resetting ${members.filter(m => m.nickname).size} nicknames...`)] });

    for (const [, member] of members) {
      if (member.nickname && member.manageable) {
        await member.setNickname(null).then(() => reset++).catch(() => failed++);
      }
    }

    message.channel.send({ embeds: [successEmbed('Nicknames Reset', `Reset **${reset}** nicknames.\nFailed: **${failed}**`)] });
  },
};

client.commands.set(commandResetallnicks.name, commandResetallnicks);

// ── Boost info ────────────────────────────────────────────────
const commandBoosts = {
  name: 'boosts',
  aliases: ['boosters', 'serverboosts'],
  description: 'View server boosters',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const boosters = message.guild.members.cache.filter(m => m.premiumSince);

    const embed = new EmbedBuilder()
      .setTitle(`💎 Server Boosters — ${message.guild.name}`)
      .setDescription(boosters.size > 0
        ? [...boosters.values()].map(m => `• ${m} — since <t:${Math.floor(m.premiumSinceTimestamp/1000)}:R>`).join('\n')
        : 'No boosters yet!')
      .addFields(
        { name: '🚀 Level',  value: `${message.guild.premiumTier}`,                 inline: true },
        { name: '💎 Boosts', value: `${message.guild.premiumSubscriptionCount}`,    inline: true },
        { name: '👥 Boosters',value: `${boosters.size}`,                            inline: true },
      )
      .setColor(Colors.Pink)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandBoosts.name, commandBoosts);

// ── Advanced Economy: Transfer tax ───────────────────────────
const commandBanktransfer = {
  name: 'banktransfer',
  aliases: ['banksend'],
  description: 'Transfer money between bank accounts (5% fee)',
  usage: '<@user> <amount>',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const target = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null);
    const amount = parseInt(args[1]);

    if (!target) return message.reply({ embeds: [errorEmbed('Invalid User', 'Please mention a user.')] });
    if (isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Invalid Amount', 'Please provide a valid amount.')] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Transfer to Yourself', 'You cannot transfer money to yourself.')] });

    const senderEco = getEconomy(message.author.id);
    const recvEco   = getEconomy(target.id);
    const fee       = Math.ceil(amount * 0.05);
    const total     = amount + fee;

    if (total > senderEco.bank) {
      return message.reply({ embeds: [errorEmbed('Insufficient Bank Funds', `You need $${formatNumber(total)} in your bank (including $${formatNumber(fee)} fee) but only have $${formatNumber(senderEco.bank)}.`)] });
    }

    senderEco.bank -= total;
    recvEco.bank   += amount;

    message.reply({ embeds: [successEmbed('Bank Transfer Complete', `Transferred **$${formatNumber(amount)}** to **${target.tag}**.\n**Fee:** $${formatNumber(fee)}\n**Your Bank:** $${formatNumber(senderEco.bank)}`)] });
  },
};

client.commands.set(commandBanktransfer.name, commandBanktransfer);

// ── Transaction history ───────────────────────────────────────
const commandTransactions = {
  name: 'transactions',
  aliases: ['history', 'txs'],
  description: 'View your recent transactions',
  usage: '',
  category: 'Economy',
  cooldown: 5,
  async execute(message) {
    const eco = getEconomy(message.author.id);

    if (!eco.transactions || eco.transactions.length === 0) {
      return message.reply({ embeds: [infoEmbed('No Transactions', 'You have no recorded transactions.')] });
    }

    const recent = eco.transactions.slice(-10).reverse();
    const embed  = new EmbedBuilder()
      .setTitle('💳 Recent Transactions')
      .setDescription(recent.map((t, i) => `${i+1}. ${t.type} — **${t.amount >= 0 ? '+' : ''}$${formatNumber(t.amount)}** — ${t.desc}`).join('\n'))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandTransactions.name, commandTransactions);

// ── Send embed from JSON ──────────────────────────────────────
const commandRawembed = {
  name: 'rawembed',
  aliases: ['jsonembed'],
  description: '[MOD] Send an embed from JSON',
  usage: '<json>',
  category: 'Utility',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const json = args.join(' ');
    if (!json) return message.reply({ embeds: [errorEmbed('Missing JSON', 'Please provide embed JSON.')] });

    try {
      const data  = JSON.parse(json);
      const embed = EmbedBuilder.from(data);
      await message.delete().catch(() => {});
      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Invalid JSON', err.message)] });
    }
  },
};

client.commands.set(commandRawembed.name, commandRawembed);

// ── Pin / Unpin messages ──────────────────────────────────────
const commandPin = {
  name: 'pin',
  aliases: ['pinmsg', 'pinmessage'],
  description: 'Pin a message',
  usage: '<message_id>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const id  = args[0];
    const msg = await message.channel.messages.fetch(id).catch(() => null);

    if (!msg) return message.reply({ embeds: [errorEmbed('Not Found', 'Message not found.')] });

    try {
      await msg.pin(`Pinned by ${message.author.tag}`);
      message.reply({ embeds: [successEmbed('Pinned', 'Message has been pinned!')] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandPin.name, commandPin);

const commandUnpin = {
  name: 'unpin',
  aliases: ['unpin-message'],
  description: 'Unpin a message',
  usage: '<message_id>',
  category: 'Moderation',
  cooldown: 3,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const id  = args[0];
    const msg = await message.channel.messages.fetch(id).catch(() => null);

    if (!msg) return message.reply({ embeds: [errorEmbed('Not Found', 'Message not found.')] });

    try {
      await msg.unpin(`Unpinned by ${message.author.tag}`);
      message.reply({ embeds: [successEmbed('Unpinned', 'Message has been unpinned!')] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandUnpin.name, commandUnpin);

// ── Pinned messages list ──────────────────────────────────────
const commandPinnedlist = {
  name: 'pinnedlist',
  aliases: ['pins', 'pinned'],
  description: 'View pinned messages in this channel',
  usage: '',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message) {
    const pinned = await message.channel.messages.fetchPinned().catch(() => null);

    if (!pinned || pinned.size === 0) {
      return message.reply({ embeds: [infoEmbed('No Pins', 'No pinned messages in this channel.')] });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📌 Pinned Messages (${pinned.size})`)
      .setDescription([...pinned.values()].map((m, i) =>
        `${i+1}. [Jump](${m.url}) — **${m.author.tag}** — ${truncate(m.content || '[Embed]', 50)}`
      ).join('\n'))
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandPinnedlist.name, commandPinnedlist);

// ── System info ───────────────────────────────────────────────
const commandSysinfo = {
  name: 'sysinfo',
  aliases: ['system', 'sys'],
  description: 'View server system information',
  usage: '',
  category: 'Info',
  cooldown: 10,
  ownerOnly: true,
  async execute(message) {
    const mem    = process.memoryUsage();
    const cpu    = process.cpuUsage();
    const uptime = process.uptime();

    const embed = new EmbedBuilder()
      .setTitle('🖥️ System Information')
      .addFields(
        { name: '💾 Heap Used',    value: humanBytes(mem.heapUsed),        inline: true },
        { name: '💾 Heap Total',   value: humanBytes(mem.heapTotal),       inline: true },
        { name: '💾 RSS',          value: humanBytes(mem.rss),             inline: true },
        { name: '⏱️ Process Up',  value: formatDuration(uptime * 1000),   inline: true },
        { name: '🔧 Node.js',      value: process.version,                 inline: true },
        { name: '📦 Platform',     value: process.platform,                inline: true },
        { name: '🔄 PID',          value: `${process.pid}`,               inline: true },
        { name: '🌐 Bot Uptime',   value: formatDuration(client.uptime),  inline: true },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandSysinfo.name, commandSysinfo);

// ── Command usage stats ───────────────────────────────────────
const commandCmdstats = {
  name: 'cmdstats',
  aliases: ['commandstats', 'cs'],
  description: 'View command usage statistics',
  usage: '[page]',
  category: 'Info',
  cooldown: 10,
  async execute(message, args) {
    const page   = parseInt(args[0]) || 1;
    const sorted = [...db.commandStats.entries()].sort(([,a], [,b]) => b - a);
    const { items, total } = paginate(sorted, page, 10);

    if (items.length === 0) return message.reply({ embeds: [infoEmbed('No Stats', 'No command usage recorded yet.')] });

    const embed = new EmbedBuilder()
      .setTitle('📊 Command Usage Stats')
      .setDescription(items.map(([cmd, uses], i) => `${(page-1)*10+i+1}. \`${cmd}\` — **${uses}** uses`).join('\n'))
      .setFooter({ text: `Page ${page}/${total} | Total commands: ${sorted.length}` })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandCmdstats.name, commandCmdstats);

// ── Lottery system ────────────────────────────────────────────
let lotteryPool = [];
let lotteryTicketPrice = 100;
let lotteryEndsAt = null;

const commandLottery = {
  name: 'lottery',
  aliases: ['lotto'],
  description: 'Enter the server lottery or view current pool',
  usage: 'buy | status | draw',
  category: 'Economy',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'buy') {
      const eco = getEconomy(message.author.id);

      if (eco.balance < lotteryTicketPrice) {
        return message.reply({ embeds: [errorEmbed('Insufficient Funds', `A lottery ticket costs $${formatNumber(lotteryTicketPrice)}.`)] });
      }

      if (lotteryPool.includes(message.author.id)) {
        return message.reply({ embeds: [errorEmbed('Already In', 'You already have a lottery ticket!')] });
      }

      eco.balance -= lotteryTicketPrice;
      lotteryPool.push(message.author.id);

      if (!lotteryEndsAt) {
        lotteryEndsAt = Date.now() + 3600000; // 1 hour
        setTimeout(drawLottery, 3600000);
      }

      return message.reply({ embeds: [successEmbed('Ticket Purchased!', `You entered the lottery for $${formatNumber(lotteryTicketPrice)}!\n**Pool:** $${formatNumber(lotteryPool.length * lotteryTicketPrice)}\n**Entries:** ${lotteryPool.length}\n**Draws:** <t:${Math.floor(lotteryEndsAt/1000)}:R>`)] });
    }

    if (sub === 'draw' && message.author.id === OWNER_ID) {
      await drawLottery(message.channel);
      return;
    }

    // Status
    const pool = lotteryPool.length * lotteryTicketPrice;
    message.reply({ embeds: [infoEmbed('🎟️ Lottery', `**Prize Pool:** $${formatNumber(pool)}\n**Tickets Sold:** ${lotteryPool.length}\n**Ticket Price:** $${formatNumber(lotteryTicketPrice)}\n**Draws:** ${lotteryEndsAt ? `<t:${Math.floor(lotteryEndsAt/1000)}:R>` : 'Not started (buy a ticket to begin!)'}`)] });
  },
};

async function drawLottery(channel) {
  if (lotteryPool.length === 0) {
    lotteryEndsAt = null;
    return;
  }

  const winner = randomChoice(lotteryPool);
  const prize  = lotteryPool.length * lotteryTicketPrice;

  const eco    = getEconomy(winner);
  eco.balance += prize;

  lotteryPool = [];
  lotteryEndsAt = null;

  const user = await client.users.fetch(winner).catch(() => ({ tag: 'Unknown' }));

  if (channel) {
    await channel.send({ embeds: [new EmbedBuilder()
      .setTitle('🎟️ Lottery Drawing!')
      .setDescription(`🎉 The winner is **${user.tag}**!\nThey won **$${formatNumber(prize)}**! Congratulations!`)
      .setColor(Colors.Gold)
      .setTimestamp()
    ] }).catch(() => {});
  }
}

client.commands.set(commandLottery.name, commandLottery);

// ── Stock market (simple simulation) ─────────────────────────
const stocks = new Map([
  ['AAPL', { price: 150, name: 'Apple Inc.' }],
  ['TSLA', { price: 800, name: 'Tesla' }],
  ['AMZN', { price: 3200, name: 'Amazon' }],
  ['GOOG', { price: 2800, name: 'Alphabet' }],
  ['MSFT', { price: 300, name: 'Microsoft' }],
  ['DBOT', { price: 100, name: 'DiscordBot Corp (fake)' }],
]);

// Simulate price fluctuation every 5 minutes
setInterval(() => {
  for (const [, stock] of stocks) {
    const change = (Math.random() - 0.5) * 0.1 * stock.price;
    stock.price  = Math.max(1, +(stock.price + change).toFixed(2));
  }
}, 300000);

const commandStock = {
  name: 'stock',
  aliases: ['stocks', 'market'],
  description: 'View or trade stocks in the simulated market',
  usage: 'list | buy <ticker> <shares> | sell <ticker> <shares> | portfolio',
  category: 'Economy',
  cooldown: 5,
  async execute(message, args) {
    const sub = args[0]?.toLowerCase();
    const eco = getEconomy(message.author.id);
    if (!eco.portfolio) eco.portfolio = {};

    if (!sub || sub === 'list') {
      const embed = new EmbedBuilder()
        .setTitle('📈 Stock Market')
        .setDescription([...stocks.entries()].map(([ticker, s]) =>
          `**${ticker}** — ${s.name}\n  Price: **$${formatNumber(s.price)}**`
        ).join('\n\n'))
        .setFooter({ text: 'Prices fluctuate every 5 minutes!' })
        .setColor(Colors.Blue)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (sub === 'buy') {
      const ticker = args[1]?.toUpperCase();
      const shares = parseInt(args[2]);
      const stock  = stocks.get(ticker);

      if (!stock)  return message.reply({ embeds: [errorEmbed('Invalid Ticker', 'Use `!stock list` to see available stocks.')] });
      if (isNaN(shares) || shares < 1) return message.reply({ embeds: [errorEmbed('Invalid Shares', 'Please provide a valid number of shares.')] });

      const cost = +(stock.price * shares).toFixed(2);
      if (cost > eco.balance) return message.reply({ embeds: [errorEmbed('Insufficient Funds', `You need $${formatNumber(cost)} but have $${formatNumber(eco.balance)}.`)] });

      eco.balance -= cost;
      eco.portfolio[ticker] = (eco.portfolio[ticker] || 0) + shares;

      return message.reply({ embeds: [successEmbed('Stocks Purchased!', `Bought **${shares}** shares of **${ticker}** for **$${formatNumber(cost)}**.\n**Balance:** $${formatNumber(eco.balance)}`)] });
    }

    if (sub === 'sell') {
      const ticker = args[1]?.toUpperCase();
      const shares = parseInt(args[2]);
      const stock  = stocks.get(ticker);

      if (!stock) return message.reply({ embeds: [errorEmbed('Invalid Ticker', 'Use `!stock list` to see available stocks.')] });
      if (isNaN(shares) || shares < 1) return message.reply({ embeds: [errorEmbed('Invalid Shares', 'Please provide a valid number of shares.')] });
      if ((eco.portfolio[ticker] || 0) < shares) return message.reply({ embeds: [errorEmbed('Not Enough Shares', `You only own **${eco.portfolio[ticker] || 0}** shares of **${ticker}**.`)] });

      const value = +(stock.price * shares).toFixed(2);
      eco.balance += value;
      eco.portfolio[ticker] -= shares;
      if (eco.portfolio[ticker] === 0) delete eco.portfolio[ticker];

      return message.reply({ embeds: [successEmbed('Stocks Sold!', `Sold **${shares}** shares of **${ticker}** for **$${formatNumber(value)}**.\n**Balance:** $${formatNumber(eco.balance)}`)] });
    }

    if (sub === 'portfolio') {
      const owned = Object.entries(eco.portfolio || {}).filter(([,v]) => v > 0);
      if (owned.length === 0) return message.reply({ embeds: [infoEmbed('Portfolio', 'You own no stocks. Use `!stock buy <ticker> <shares>` to invest!')] });

      let totalValue = 0;
      const lines = owned.map(([ticker, shares]) => {
        const stock = stocks.get(ticker);
        if (!stock) return `**${ticker}**: ${shares} shares (delisted)`;
        const value = +(stock.price * shares).toFixed(2);
        totalValue += value;
        return `**${ticker}** — ${shares} shares @ $${formatNumber(stock.price)} = **$${formatNumber(value)}**`;
      });

      const embed = new EmbedBuilder()
        .setTitle('📊 Your Portfolio')
        .setDescription(lines.join('\n'))
        .addFields({ name: '💰 Total Value', value: `$${formatNumber(totalValue)}`, inline: true })
        .setColor(Colors.Green)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    message.reply({ embeds: [infoEmbed('Stock Commands', '`!stock list` — View stocks\n`!stock buy <ticker> <shares>` — Buy shares\n`!stock sell <ticker> <shares>` — Sell shares\n`!stock portfolio` — View your holdings')] });
  },
};

client.commands.set(commandStock.name, commandStock);

// ── Fortune cookie ────────────────────────────────────────────
const commandFortune = {
  name: 'fortune',
  aliases: ['fortunecookie', 'wisdom'],
  description: 'Get a fortune cookie message',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const fortunes = [
      'A dream you have will come true.',
      'Your hard work will soon pay off.',
      'Good things come to those who wait.',
      'An unexpected opportunity is heading your way.',
      'You will find happiness where you least expect it.',
      'A kind word today may change someone\'s life forever.',
      'The best time to plant a tree was 20 years ago. The second best time is now.',
      'You have the strength to overcome any challenge ahead.',
      'Your creativity will bring great rewards soon.',
      'Someone in your life is wishing you well right now.',
      'Take the path less traveled — it will make all the difference.',
      'Today is a perfect day to start something new.',
      'Your smile is your greatest superpower.',
      'The stars are aligned in your favor today.',
      'Good luck awaits you when you least expect it.',
    ];

    const embed = new EmbedBuilder()
      .setTitle('🥠 Fortune Cookie')
      .setDescription(`*"${randomChoice(fortunes)}"*`)
      .setColor(Colors.Yellow)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandFortune.name, commandFortune);

// ── Zodiac sign ───────────────────────────────────────────────
const commandZodiac = {
  name: 'zodiac',
  aliases: ['horoscope', 'sign'],
  description: 'Get your zodiac sign info',
  usage: '<sign>',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const input = args[0]?.toLowerCase();
    const signs = {
      aries:       { dates: 'Mar 21 – Apr 19', element: 'Fire',  symbol: '♈', trait: 'Courageous, enthusiastic, optimistic' },
      taurus:      { dates: 'Apr 20 – May 20', element: 'Earth', symbol: '♉', trait: 'Reliable, patient, practical' },
      gemini:      { dates: 'May 21 – Jun 20', element: 'Air',   symbol: '♊', trait: 'Versatile, curious, affectionate' },
      cancer:      { dates: 'Jun 21 – Jul 22', element: 'Water', symbol: '♋', trait: 'Intuitive, emotional, caring' },
      leo:         { dates: 'Jul 23 – Aug 22', element: 'Fire',  symbol: '♌', trait: 'Creative, generous, warm-hearted' },
      virgo:       { dates: 'Aug 23 – Sep 22', element: 'Earth', symbol: '♍', trait: 'Analytical, kind, hardworking' },
      libra:       { dates: 'Sep 23 – Oct 22', element: 'Air',   symbol: '♎', trait: 'Diplomatic, gracious, fair-minded' },
      scorpio:     { dates: 'Oct 23 – Nov 21', element: 'Water', symbol: '♏', trait: 'Passionate, stubborn, resourceful' },
      sagittarius: { dates: 'Nov 22 – Dec 21', element: 'Fire',  symbol: '♐', trait: 'Generous, idealistic, humorous' },
      capricorn:   { dates: 'Dec 22 – Jan 19', element: 'Earth', symbol: '♑', trait: 'Responsible, disciplined, self-controlled' },
      aquarius:    { dates: 'Jan 20 – Feb 18', element: 'Air',   symbol: '♒', trait: 'Progressive, original, independent' },
      pisces:      { dates: 'Feb 19 – Mar 20', element: 'Water', symbol: '♓', trait: 'Compassionate, artistic, intuitive' },
    };

    if (!input || !signs[input]) {
      return message.reply({ embeds: [infoEmbed('Zodiac Signs', Object.keys(signs).map(s => `**${s}** — ${signs[s].symbol} ${signs[s].dates}`).join('\n'))] });
    }

    const sign = signs[input];
    const embed = new EmbedBuilder()
      .setTitle(`${sign.symbol} ${input.charAt(0).toUpperCase() + input.slice(1)}`)
      .addFields(
        { name: '📅 Dates',    value: sign.dates,    inline: true },
        { name: '🌊 Element', value: sign.element,   inline: true },
        { name: '✨ Traits',  value: sign.trait,     inline: false },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandZodiac.name, commandZodiac);

// ── Bible / Quote verse (mock) ─────────────────────────────────
const commandVerse = {
  name: 'verse',
  aliases: ['bible', 'quran'],
  description: 'Get a random inspirational verse',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    const verses = [
      { text: 'For God so loved the world that he gave his one and only Son.', ref: 'John 3:16' },
      { text: 'I can do all this through him who gives me strength.', ref: 'Philippians 4:13' },
      { text: 'Be strong and courageous. Do not be afraid; do not be discouraged.', ref: 'Joshua 1:9' },
      { text: 'Trust in the LORD with all your heart and lean not on your own understanding.', ref: 'Proverbs 3:5' },
      { text: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
    ];

    const verse = randomChoice(verses);
    const embed = new EmbedBuilder()
      .setTitle('📖 Inspirational Verse')
      .setDescription(`*"${verse.text}"*`)
      .setFooter({ text: verse.ref })
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandVerse.name, commandVerse);

// ── Server analytics ──────────────────────────────────────────
const commandAnalytics = {
  name: 'analytics',
  aliases: ['serverstats', 'guilstats'],
  description: 'View server analytics',
  usage: '',
  category: 'Utility',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message) {
    const stats = db.statistics.get(message.guild.id) || { commands: 0, messages: 0, joins: 0, leaves: 0 };

    const embed = new EmbedBuilder()
      .setTitle(`📊 Analytics — ${message.guild.name}`)
      .addFields(
        { name: '💬 Messages',   value: formatNumber(stats.messages),  inline: true },
        { name: '📦 Commands',   value: formatNumber(stats.commands),  inline: true },
        { name: '📥 Joins',      value: formatNumber(stats.joins),     inline: true },
        { name: '📤 Leaves',     value: formatNumber(stats.leaves),    inline: true },
        { name: '📈 Net Growth', value: formatNumber(stats.joins - stats.leaves), inline: true },
        { name: '👥 Current',   value: formatNumber(message.guild.memberCount),    inline: true },
      )
      .setColor(Colors.Blue)
      .setFooter({ text: 'Stats tracked since bot joined' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandAnalytics.name, commandAnalytics);

// ── GitHub command ────────────────────────────────────────────
const commandGithub = {
  name: 'github',
  aliases: ['gh'],
  description: 'View a GitHub user\'s profile',
  usage: '<username>',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const username = args[0];
    if (!username) return message.reply({ embeds: [errorEmbed('Missing Username', 'Please provide a GitHub username.')] });

    try {
      const res  = await fetch(`https://api.github.com/users/${username}`);
      const data = await res.json();

      if (data.message === 'Not Found') {
        return message.reply({ embeds: [errorEmbed('Not Found', `No GitHub user found with username \`${username}\`.`)] });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🐙 GitHub: ${data.login}`)
        .setURL(data.html_url)
        .setThumbnail(data.avatar_url)
        .addFields(
          { name: '📛 Name',       value: data.name || 'None',             inline: true },
          { name: '🏢 Company',    value: data.company || 'None',           inline: true },
          { name: '📍 Location',  value: data.location || 'None',          inline: true },
          { name: '📦 Repos',     value: `${data.public_repos}`,           inline: true },
          { name: '👥 Followers', value: `${data.followers}`,              inline: true },
          { name: '👤 Following', value: `${data.following}`,              inline: true },
          { name: '📅 Joined',    value: `<t:${Math.floor(new Date(data.created_at).getTime()/1000)}:R>`, inline: true },
        )
        .setColor(Colors.Default)
        .setTimestamp();

      if (data.bio) embed.setDescription(data.bio);

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch GitHub data.')] });
    }
  },
};

client.commands.set(commandGithub.name, commandGithub);

// ── NPM package lookup ────────────────────────────────────────
const commandNpm = {
  name: 'npm',
  aliases: ['package', 'pkg'],
  description: 'Look up an NPM package',
  usage: '<package_name>',
  category: 'Utility',
  cooldown: 5,
  async execute(message, args) {
    const pkg = args[0];
    if (!pkg) return message.reply({ embeds: [errorEmbed('Missing Package', 'Please provide a package name.')] });

    try {
      const res  = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
      const data = await res.json();

      if (data.error) return message.reply({ embeds: [errorEmbed('Not Found', `Package \`${pkg}\` not found.`)] });

      const embed = new EmbedBuilder()
        .setTitle(`📦 ${data.name}@${data.version}`)
        .setURL(`https://www.npmjs.com/package/${data.name}`)
        .setDescription(data.description || 'No description')
        .addFields(
          { name: '🔖 Version',   value: data.version,                          inline: true },
          { name: '📄 License',  value: data.license || 'None',                 inline: true },
          { name: '📅 Published', value: `<t:${Math.floor(new Date(data.time || Date.now()).getTime()/1000)}:R>`, inline: true },
        )
        .setColor('#CC3534')
        .setTimestamp();

      if (data.keywords?.length > 0) {
        embed.addFields({ name: '🏷️ Keywords', value: data.keywords.slice(0, 10).join(', ') });
      }

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch NPM data.')] });
    }
  },
};

client.commands.set(commandNpm.name, commandNpm);

// ── Urban dictionary ──────────────────────────────────────────
const commandUrban = {
  name: 'urban',
  aliases: ['ud', 'define'],
  description: 'Look up a term on Urban Dictionary',
  usage: '<term>',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const query = args.join(' ');
    if (!query) return message.reply({ embeds: [errorEmbed('Missing Term', 'Please provide a term to look up.')] });

    try {
      const res  = await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.list || data.list.length === 0) {
        return message.reply({ embeds: [errorEmbed('Not Found', `No definition found for \`${query}\`.`)] });
      }

      const def = data.list[0];

      const embed = new EmbedBuilder()
        .setTitle(`📖 ${def.word}`)
        .setURL(def.permalink)
        .setDescription(truncate(def.definition.replace(/\[|\]/g, ''), 1024))
        .addFields(
          { name: '💬 Example', value: truncate(def.example.replace(/\[|\]/g, '') || 'None', 512) },
          { name: '👍',         value: `${def.thumbs_up}`, inline: true },
          { name: '👎',         value: `${def.thumbs_down}`, inline: true },
        )
        .setFooter({ text: `By: ${def.author}` })
        .setColor(Colors.Blue)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch Urban Dictionary data.')] });
    }
  },
};

client.commands.set(commandUrban.name, commandUrban);

// ── Anime meme ────────────────────────────────────────────────
const commandWaifu = {
  name: 'waifu',
  aliases: ['animegirl'],
  description: 'Get a random anime image',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    try {
      const res  = await fetch('https://api.waifu.pics/sfw/waifu');
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle('🎌 Random Anime Image')
        .setImage(data.url)
        .setColor(Colors.Pink)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch anime image.')] });
    }
  },
};

client.commands.set(commandWaifu.name, commandWaifu);

// ── Cat / Dog API ──────────────────────────────────────────────
const commandCat = {
  name: 'cat',
  aliases: ['kitty', 'neko'],
  description: 'Get a random cat image',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    try {
      const res  = await fetch('https://api.thecatapi.com/v1/images/search');
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle('🐱 Random Cat')
        .setImage(data[0].url)
        .setColor(Colors.Orange)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a cat image.')] });
    }
  },
};

client.commands.set(commandCat.name, commandCat);

const commandDog = {
  name: 'dog',
  aliases: ['doggo', 'puppy'],
  description: 'Get a random dog image',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    try {
      const res  = await fetch('https://dog.ceo/api/breeds/image/random');
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle('🐶 Random Dog')
        .setImage(data.message)
        .setColor(Colors.Brown)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a dog image.')] });
    }
  },
};

client.commands.set(commandDog.name, commandDog);

// ── Fox image ─────────────────────────────────────────────────
const commandFox = {
  name: 'fox',
  aliases: ['foxpic'],
  description: 'Get a random fox image',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    try {
      const res  = await fetch('https://randomfox.ca/floof/');
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle('🦊 Random Fox')
        .setImage(data.image)
        .setColor(Colors.Orange)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a fox image.')] });
    }
  },
};

client.commands.set(commandFox.name, commandFox);

// ── Panda image ───────────────────────────────────────────────
const commandPanda = {
  name: 'panda',
  aliases: ['pandapic'],
  description: 'Get a random panda image',
  usage: '',
  category: 'Fun',
  cooldown: 5,
  async execute(message) {
    try {
      const res  = await fetch('https://some-random-api.ml/img/panda');
      const data = await res.json();

      const embed = new EmbedBuilder()
        .setTitle('🐼 Random Panda')
        .setImage(data.link)
        .setColor(Colors.Default)
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (_) {
      message.reply({ embeds: [errorEmbed('Error', 'Failed to fetch a panda image.')] });
    }
  },
};

client.commands.set(commandPanda.name, commandPanda);

// ── Inspect permissions ───────────────────────────────────────
const commandPerms = {
  name: 'perms',
  aliases: ['permissions', 'checkperms'],
  description: 'Check a member\'s permissions',
  usage: '[@user]',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const member = message.mentions.members.first() || message.member;
    const perms  = member.permissions.toArray();

    const important = [
      'Administrator', 'ManageGuild', 'ManageChannels', 'ManageMessages',
      'ManageRoles', 'ManageNicknames', 'KickMembers', 'BanMembers',
      'ModerateMembers', 'SendMessages', 'ReadMessageHistory', 'ViewChannel',
      'MentionEveryone', 'UseExternalEmojis', 'AddReactions',
    ];

    const has  = important.filter(p => member.permissions.has(PermissionFlagsBits[p]));
    const lack = important.filter(p => !member.permissions.has(PermissionFlagsBits[p]));

    const embed = new EmbedBuilder()
      .setTitle(`🔑 Permissions — ${member.user.tag}`)
      .addFields(
        { name: '✅ Has',       value: has.length  ? has.map(p => `\`${p}\``).join(', ')  : 'None' },
        { name: '❌ Lacks',    value: lack.length ? lack.map(p => `\`${p}\``).join(', ') : 'None' },
      )
      .setColor(Colors.Blue)
      .setTimestamp();

    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
      embed.setDescription('⚠️ This user is an **Administrator** and has all permissions!');
    }

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandPerms.name, commandPerms);

// ── Custom bot nickname ───────────────────────────────────────
const commandBotnick = {
  name: 'botnick',
  aliases: ['setnick-bot'],
  description: 'Change the bot\'s nickname in this server',
  usage: '<nickname|reset>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageNicknames],
  guildOnly: true,
  async execute(message, args) {
    const nick = args[0]?.toLowerCase() === 'reset' ? null : args.join(' ');

    try {
      await message.guild.members.me.setNickname(nick, `Nick changed by ${message.author.tag}`);
      message.reply({ embeds: [successEmbed('Bot Nick Changed', nick ? `Bot nickname set to **${nick}**.` : 'Bot nickname reset.')] });
    } catch (err) {
      message.reply({ embeds: [errorEmbed('Error', err.message)] });
    }
  },
};

client.commands.set(commandBotnick.name, commandBotnick);

// ── Game: Number guessing ─────────────────────────────────────
const commandGuessnumber = {
  name: 'guessnumber',
  aliases: ['guess', 'guessing'],
  description: 'Play a number guessing game',
  usage: '[1-1000]',
  category: 'Fun',
  cooldown: 5,
  async execute(message, args) {
    const max    = Math.min(parseInt(args[0]) || 100, 1000);
    const secret = randInt(1, max);
    let attempts = 0;
    const maxAttempts = Math.ceil(Math.log2(max)) + 2;

    const embed = new EmbedBuilder()
      .setTitle('🔢 Number Guessing Game')
      .setDescription(`Guess a number between **1** and **${max}**!\nYou have **${maxAttempts}** attempts.`)
      .setColor(Colors.Blue)
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    const filter = m => m.author.id === message.author.id && !isNaN(parseInt(m.content));
    const collector = message.channel.createMessageCollector({ filter, time: 60000, max: maxAttempts });

    collector.on('collect', async m => {
      const guess = parseInt(m.content);
      attempts++;

      if (guess === secret) {
        collector.stop('won');
        return m.reply({ embeds: [successEmbed('Correct! 🎉', `You guessed **${secret}** in **${attempts}** attempt(s)!`)] });
      }

      const remaining = maxAttempts - attempts;
      const hint      = guess < secret ? '📈 Too low!' : '📉 Too high!';

      if (remaining > 0) {
        m.reply({ embeds: [warnEmbed('Wrong!', `${hint} **${remaining}** attempt(s) remaining.`)] });
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason !== 'won') {
        await message.channel.send({ embeds: [errorEmbed('Game Over!', `You ran out of attempts! The number was **${secret}**.`)] });
      }
    });
  },
};

client.commands.set(commandGuessnumber.name, commandGuessnumber);

// ── Hangman game ──────────────────────────────────────────────
const commandHangman = {
  name: 'hangman',
  aliases: ['hm'],
  description: 'Play Hangman',
  usage: '',
  category: 'Fun',
  cooldown: 10,
  async execute(message) {
    const words = [
      'javascript', 'discord', 'programming', 'keyboard', 'developer',
      'computer', 'network', 'database', 'algorithm', 'function',
      'variable', 'operator', 'iteration', 'recursion', 'library',
    ];

    const word      = randomChoice(words);
    let guessed     = new Set();
    let wrong       = 0;
    const maxWrong  = 6;

    const display  = () => word.split('').map(c => guessed.has(c) ? c : '_').join(' ');
    const gallows  = ['😵', '💀😵', '💀', '😤', '😐', '😊', '🎉'];

    const buildEmbed = () => new EmbedBuilder()
      .setTitle('🎯 Hangman')
      .setDescription(`\`\`\`${display()}\`\`\``)
      .addFields(
        { name: 'Wrong Guesses', value: wrong > 0 ? [...guessed].filter(c => !word.includes(c)).join(', ') : 'None', inline: true },
        { name: 'Remaining',    value: `${maxWrong - wrong}/${maxWrong}`,                                               inline: true },
        { name: 'Status',       value: gallows[maxWrong - wrong] || '💀',                                               inline: true },
      )
      .setColor(wrong > 3 ? Colors.Red : Colors.Blue)
      .setTimestamp();

    const msg = await message.reply({ embeds: [buildEmbed()] });

    const filter = m => m.author.id === message.author.id && /^[a-zA-Z]$/.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 120000 });

    collector.on('collect', async m => {
      const letter = m.content.toLowerCase();

      if (guessed.has(letter)) {
        await m.reply({ content: 'Already guessed that letter!', ephemeral: true }).catch(() => {});
        return;
      }

      guessed.add(letter);

      if (!word.includes(letter)) wrong++;

      const won  = word.split('').every(c => guessed.has(c));
      const lost = wrong >= maxWrong;

      if (won || lost) {
        collector.stop();
        const finalEmbed = buildEmbed();
        finalEmbed.setDescription(won
          ? `🎉 **YOU WON!** The word was **${word}**!`
          : `💀 **GAME OVER!** The word was **${word}**.`);
        finalEmbed.setColor(won ? Colors.Green : Colors.Red);
        await msg.edit({ embeds: [finalEmbed] });
        return;
      }

      await msg.edit({ embeds: [buildEmbed()] });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        const finalEmbed = buildEmbed();
        finalEmbed.setDescription(`⏰ Time's up! The word was **${word}**.`);
        finalEmbed.setColor(Colors.Red);
        await msg.edit({ embeds: [finalEmbed] });
      }
    });
  },
};

client.commands.set(commandHangman.name, commandHangman);

// ── Wordle game (simplified) ──────────────────────────────────
const commandWordle = {
  name: 'wordle',
  aliases: ['wd', 'word-game'],
  description: 'Play a simplified Wordle game',
  usage: '',
  category: 'Fun',
  cooldown: 10,
  async execute(message) {
    const fiveLetterWords = [
      'brave', 'chess', 'cloud', 'coral', 'dance', 'eagle', 'flute', 'grace',
      'happy', 'ivory', 'joker', 'kneel', 'lemon', 'magic', 'noble', 'oaken',
      'piano', 'queen', 'river', 'stone', 'tiger', 'ultra', 'venom', 'water',
      'xenon', 'yacht', 'zebra', 'arrow', 'brush', 'crest',
    ];

    const word     = randomChoice(fiveLetterWords);
    let attempts   = 0;
    const maxAttempts = 6;
    const guesses  = [];

    const check = (guess) => {
      const result = [];
      for (let i = 0; i < 5; i++) {
        if (guess[i] === word[i]) result.push('🟩'); // Correct
        else if (word.includes(guess[i])) result.push('🟨'); // Wrong position
        else result.push('⬛'); // Not in word
      }
      return result.join('');
    };

    const buildEmbed = () => new EmbedBuilder()
      .setTitle('🟩 Wordle')
      .setDescription([
        ...guesses,
        ...Array(maxAttempts - guesses.length).fill('⬛⬛⬛⬛⬛'),
      ].join('\n'))
      .setFooter({ text: `${maxAttempts - attempts} guesses remaining | Type a 5-letter word!` })
      .setColor(Colors.Green)
      .setTimestamp();

    const msg = await message.reply({ embeds: [buildEmbed()] });

    const filter = m => m.author.id === message.author.id && /^[a-zA-Z]{5}$/.test(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 300000, max: maxAttempts });

    collector.on('collect', async m => {
      const guess = m.content.toLowerCase();
      attempts++;

      const row = `${check(guess)} → \`${guess}\``;
      guesses.push(row);

      const won = guess === word;

      if (won || attempts >= maxAttempts) {
        collector.stop();
        const final = buildEmbed();
        final.setDescription(
          guesses.join('\n') + (won
            ? `\n\n🎉 **You won in ${attempts} guess(es)!**`
            : `\n\n💀 **Game over!** The word was **${word}**.`)
        );
        final.setColor(won ? Colors.Green : Colors.Red);
        await msg.edit({ embeds: [final] });
        return;
      }

      await msg.edit({ embeds: [buildEmbed()] });
    });
  },
};

client.commands.set(commandWordle.name, commandWordle);

// ── Tic-tac-toe game ──────────────────────────────────────────
const commandTtt = {
  name: 'tictactoe',
  aliases: ['ttt', 'ttt-game'],
  description: 'Play Tic-Tac-Toe against someone',
  usage: '<@user>',
  category: 'Fun',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const opponent = message.mentions.users.first();
    if (!opponent) return message.reply({ embeds: [errorEmbed('Missing Opponent', 'Please mention a user to play against.')] });
    if (opponent.id === message.author.id) return message.reply({ embeds: [errorEmbed('Cannot Play Yourself', 'You cannot play Tic-Tac-Toe against yourself!')] });
    if (opponent.bot) return message.reply({ embeds: [errorEmbed('Cannot Play Bot', 'You cannot play against a bot in this version.')] });

    const board = Array(9).fill(null);
    let turn    = message.author.id;
    const marks = { [message.author.id]: '❌', [opponent.id]: '⭕' };

    const displayBoard = () => {
      const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
      return [0,3,6].map(row =>
        board.slice(row, row+3).map((cell, i) => cell || emojis[row+i]).join(' ')
      ).join('\n');
    };

    const checkWin = (b, mark) => {
      const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      return wins.some(([a,b,c]) => board[a]===mark && board[b]===mark && board[c]===mark);
    };

    const buildEmbed = () => new EmbedBuilder()
      .setTitle('❌ Tic-Tac-Toe ⭕')
      .setDescription(`${displayBoard()}\n\n${turn === message.author.id ? message.author : opponent}'s turn (${marks[turn]})`)
      .setColor(Colors.Blue)
      .setTimestamp();

    // Use 3x3 button grid
    const rows = () => [0, 3, 6].map(start =>
      new ActionRowBuilder().addComponents(
        [0, 1, 2].map(offset => {
          const idx = start + offset;
          return new ButtonBuilder()
            .setCustomId(`ttt_${idx}`)
            .setLabel(board[idx] || String(idx + 1))
            .setStyle(board[idx] ? (board[idx] === '❌' ? ButtonStyle.Danger : ButtonStyle.Primary) : ButtonStyle.Secondary)
            .setDisabled(!!board[idx]);
        })
      )
    );

    const msg = await message.reply({ embeds: [buildEmbed()], components: rows() });

    const collector = msg.createMessageComponentCollector({
      filter: i => [message.author.id, opponent.id].includes(i.user.id),
      time: 300000,
    });

    collector.on('collect', async i => {
      if (i.user.id !== turn) {
        return i.reply({ content: 'It\'s not your turn!', ephemeral: true });
      }

      const idx  = parseInt(i.customId.split('_')[1]);
      if (board[idx]) return i.reply({ content: 'That square is already taken!', ephemeral: true });

      board[idx] = marks[turn];

      const won  = checkWin(board, marks[turn]);
      const draw = !won && board.every(c => c !== null);

      await i.deferUpdate();

      if (won || draw) {
        collector.stop();
        const finalEmbed = new EmbedBuilder()
          .setTitle('❌ Tic-Tac-Toe ⭕')
          .setDescription(`${displayBoard()}\n\n${won ? `🎉 **${i.user} wins!** (${marks[turn]})` : '🤝 **It\'s a draw!**'}`)
          .setColor(won ? Colors.Gold : Colors.Grey)
          .setTimestamp();
        await msg.edit({ embeds: [finalEmbed], components: [] });
        return;
      }

      turn = turn === message.author.id ? opponent.id : message.author.id;
      await msg.edit({ embeds: [buildEmbed()], components: rows() });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await msg.edit({ embeds: [errorEmbed('Game Timed Out', 'Tic-Tac-Toe game timed out.')], components: [] });
      }
    });
  },
};

client.commands.set(commandTtt.name, commandTtt);

// ── Countdown command ─────────────────────────────────────────
const commandCountdown = {
  name: 'setcountdown',
  aliases: ['countdown-event'],
  description: 'Create a countdown event',
  usage: '<date YYYY-MM-DD> <event_name>',
  category: 'Utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const dateStr = args[0];
    const name    = args.slice(1).join(' ');

    if (!dateStr || !name) return message.reply({ embeds: [errorEmbed('Missing Args', 'Usage: `!setcountdown YYYY-MM-DD <event name>`')] });

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return message.reply({ embeds: [errorEmbed('Invalid Date', 'Please use the format YYYY-MM-DD.')] });
    if (date < new Date()) return message.reply({ embeds: [errorEmbed('Past Date', 'The countdown date must be in the future.')] });

    const ms = date.getTime() - Date.now();

    const embed = new EmbedBuilder()
      .setTitle(`⏰ Countdown: ${name}`)
      .setDescription(`**${name}** is in **${formatDuration(ms)}**!\n\n**Date:** <t:${Math.floor(date.getTime()/1000)}:F>`)
      .setColor(Colors.Blue)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};

client.commands.set(commandCountdown.name, commandCountdown);

// ── Announce command ──────────────────────────────────────────
const commandAnnounce = {
  name: 'announce',
  aliases: ['announcement', 'post'],
  description: 'Send an announcement embed',
  usage: '<#channel> <title> | <message>',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(message, args) {
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [errorEmbed('Missing Channel', 'Please mention a channel to post in.')] });

    const rest  = args.slice(1).join(' ');
    const parts = rest.split('|').map(p => p.trim());

    if (parts.length < 2) return message.reply({ embeds: [errorEmbed('Invalid Format', 'Usage: `!announce #channel <title> | <message>`')] });

    const [title, content] = parts;

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(content)
      .setColor(Colors.Blue)
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
      .setTimestamp();

    await channel.send({ content: '@everyone', embeds: [embed] });
    await message.delete().catch(() => {});
    message.channel.send({ embeds: [successEmbed('Announced', `Announcement posted in ${channel}!`)] }).then(m => safeDelete(m, 5000));
  },
};

client.commands.set(commandAnnounce.name, commandAnnounce);

// ── Log levels ────────────────────────────────────────────────
const commandSetloglevel = {
  name: 'setloglevel',
  aliases: ['loglevel'],
  description: 'Control what gets logged',
  usage: '<all|moderation|joins|messages|voice>',
  category: 'Config',
  cooldown: 5,
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(message, args) {
    const config = getGuildConfig(message.guild.id);
    const level  = args[0]?.toLowerCase();

    const validLevels = ['all', 'moderation', 'joins', 'messages', 'voice', 'off'];
    if (!level || !validLevels.includes(level)) {
      return message.reply({ embeds: [infoEmbed('Log Levels', `Valid levels: ${validLevels.join(', ')}`)] });
    }

    config.logLevel = level;
    message.reply({ embeds: [successEmbed('Log Level Set', `Log level set to **${level}**.`)] });
  },
};

client.commands.set(commandSetloglevel.name, commandSetloglevel);

// ── Bot leave server ──────────────────────────────────────────
const commandLeaveserver = {
  name: 'leaveserver',
  aliases: ['leave-guild'],
  description: '[OWNER] Make the bot leave a server',
  usage: '<guild_id>',
  category: 'Owner',
  cooldown: 0,
  ownerOnly: true,
  async execute(message, args) {
    const guildId = args[0];
    const guild   = client.guilds.cache.get(guildId);

    if (!guild) return message.reply({ embeds: [errorEmbed('Not Found', 'Bot is not in a guild with that ID.')] });

    const name = guild.name;
    await guild.leave();
    message.reply({ embeds: [successEmbed('Left Server', `Left **${name}** (${guildId}).`)] });
  },
};

client.commands.set(commandLeaveserver.name, commandLeaveserver);

// ── Category sort ─────────────────────────────────────────────
const commandSortcategory = {
  name: 'sortcategory',
  aliases: ['sortchannels'],
  description: 'Sort channels in a category alphabetically',
  usage: '<category_id>',
  category: 'Moderation',
  cooldown: 10,
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(message, args) {
    const catId = args[0];
    const cat   = await message.guild.channels.fetch(catId).catch(() => null);

    if (!cat || cat.type !== ChannelType.GuildCategory) {
      return message.reply({ embeds: [errorEmbed('Invalid Category', 'Please provide a valid category ID.')] });
    }

    const children = message.guild.channels.cache
      .filter(c => c.parentId === cat.id && c.type !== ChannelType.GuildCategory)
      .sort((a, b) => a.name.localeCompare(b.name));

    let pos = 0;
    for (const [, ch] of children) {
      await ch.setPosition(pos++).catch(() => {});
    }

    message.reply({ embeds: [successEmbed('Channels Sorted', `Sorted **${children.size}** channels alphabetically in **${cat.name}**.`)] });
  },
};

client.commands.set(commandSortcategory.name, commandSortcategory);

// ──────────────────────────────────────────────────────────────
//  FINAL SETUP & BOT LOGIN
// ──────────────────────────────────────────────────────────────

// Update command aliases for newly added commands
for (const [, cmd] of client.commands) {
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      if (!client.aliases.has(alias)) {
        client.aliases.set(alias, cmd.name);
      }
    }
  }
}

// Start random events
startRandomEvents();

// Log total registered commands
log('INFO', `Total prefix commands: ${client.commands.size}`);
log('INFO', `Total aliases: ${client.aliases.size}`);

// ── Login ────────────────────────────────────────────────────
if (!TOKEN || TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  log('ERROR', 'No bot token provided! Set TOKEN in your .env file.');
  process.exit(1);
}

client.login(TOKEN).then(() => {
  log('SUCCESS', 'Bot logged in successfully!');
}).catch(err => {
  log('ERROR', `Failed to log in: ${err.message}`);
  process.exit(1);
});

// ──────────────────────────────────────────────────────────────
//  END OF FILE
//  This file contains a comprehensive Discord bot with:
//  - 130+ prefix commands
//  - 25+ slash commands
//  - Advanced Ticket System (Panels, Categories, Priority, Transcripts, Ratings, Auto-Close)
//  - Economy system (balance, daily, work, gambling, shop, fishing, mining, hunting)
//  - Level system with XP, level-up messages, and role rewards
//  - Moderation (kick, ban, mute, warn, purge, lock, slowmode, etc.)
//  - Giveaway system with automatic drawing
//  - Auto-moderation (anti-spam, anti-links, anti-caps, anti-profanity)
//  - Welcome/goodbye messages
//  - Starboard
//  - Reaction roles
//  - Music queue system (requires @discordjs/voice)
//  - Fun commands (meme, 8ball, ship, trivia, games)
//  - Marriage system
//  - Pet system
//  - Rep system
//  - Stock market simulation
//  - Lottery system
//  - Mini-games (Blackjack, Wordle, Hangman, Tic-Tac-Toe, Number Guess)
//  - Utility (snipe, edit snipe, reminders, AFK, tags, polls)
//  - Sticky messages
//  - Temp voice channels
//  - Stats channels
//  - Anti-raid detection
//  - Comprehensive logging
//  - Owner-only commands
//  And much, much more!
// ──────────────────────────────────────────────────────────────

// ============================================================
//  DISCORD BOT - FULL FEATURED - index.js (Railway Optimized)
//  Created with discord.js v14
// ============================================================
