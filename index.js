// ============================================================
// البوت - ثيم برتقالي وأسود - خلفية ترحيب - MongoDB
// نظام رتب تفاعلي بقائمة منسدلة (تبديل) - الاسم فقط
// + إعادة تعيين + تقييمات ترسل لروم + بانل اقتراحات مخصص
// ============================================================

const {
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  PermissionsBitField, ChannelType, ModalBuilder,
  TextInputBuilder, TextInputStyle, ActivityType, Partials
} = require('discord.js');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// ========== خادم الويب ==========
app.get('/', (req, res) => res.send('✅ البوت يعمل'));
app.listen(port, () => console.log(`🌐 خادم الويب على المنفذ ${port}`));

// ========== متغيرات البيئة ==========
const TOKEN = process.env.DISCORD_TOKEN;
const MONGO_URL = process.env.MONGO_URL;
const OWNER_ID = process.env.OWNER_ID || null;

if (!TOKEN) {
  console.error('❌ تأكد من وجود DISCORD_TOKEN في متغيرات البيئة.');
  process.exit(1);
}
if (!MONGO_URL) {
  console.error('❌ تأكد من وجود MONGO_URL في متغيرات البيئة.');
  process.exit(1);
}

// ============================================================
// ========== ثيم البوت: برتقالي وأسود ==========
// ============================================================
const THEME = {
  BLACK: 0x0d0d0d,
  DARK: 0x1a1a1a,
  ORANGE: 0xff6b00,
  ORANGE_LIGHT: 0xff8c33,
  ORANGE_DARK: 0xcc5500,
  ORANGE_HEX: '#ff6b00',
  BLACK_HEX: '#0d0d0d',
  DARK_HEX: '#1a1a1a',
  SUCCESS: 0xff6b00,
  ERROR: 0xed4245,
  WARN: 0xfaa61a,
};

try {
  // GlobalFonts.registerFromPath('./fonts/NotoNaskhArabic-Bold.ttf', 'NotoArabic');
} catch (e) {}
const ARABIC_FONT = 'NotoArabic, Arial, sans-serif';

// ========== اتصال MongoDB ==========
mongoose.connect(MONGO_URL)
  .then(() => console.log('✅ اتصال MongoDB ناجح'))
  .catch(err => {
    console.error('❌ فشل اتصال MongoDB:', err);
    process.exit(1);
  });

// ============================================================
// ========== نماذج MongoDB ==========
// ============================================================

const ConfigSchema = new mongoose.Schema({
  guildId: { type: String, unique: true, required: true },
  logChannel: String,
  welcomeChannel: String,
  welcomeMessage: { type: String, default: 'أهلاً بك في السيرفر! 🎉' },
  welcomeTitle: { type: String, default: '🔥 مرحباً بك في المجتمع' },
  welcomeImage: String,
  welcomeBackground: String,
  muteRole: String,
  joinRole: String,
  ticketPanelImage: String,
  rolesImage: String,
  rolesPanelText: String,
  bannerImage: String,
  generalImage: String,
  levelChannelId: String,
  suggestionsChannel: String,
  suggestionsTitle: { type: String, default: '💡 قناة الاقتراحات' },
  suggestionsDescription: { type: String, default: 'هل لديك فكرة لتطوير السيرفر؟ شاركنا اقتراحك!' },
  suggestionsColor: { type: String, default: '#ff6b00' },
  suggestionsImage: String,
  suggestionsPanelTitle: { type: String, default: '💡 قناة الاقتراحات' },
  suggestionsPanelText: { type: String, default: 'هل لديك فكرة لتطوير السيرفر؟ شاركنا اقتراحك!\n\n**🖱️ اضغط على الزر أدناه لتقديم اقتراحك.**' },
  suggestionsPanelImage: String,
  suggestionsPanelButtonText: { type: String, default: '📝 إرسال اقتراحك' },
  ticketRatingEnabled: { type: Boolean, default: true },
  ticketRatingChannel: String,
}, { timestamps: true });
const Config = mongoose.model('Config', ConfigSchema);

const UserSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
}, { timestamps: true });
UserSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const User = mongoose.model('User', UserSchema);

const EconomySchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  og: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  voiceSeconds: { type: Number, default: 0 },
  lastVoiceJoin: Date,
}, { timestamps: true });
EconomySchema.index({ guildId: 1, userId: 1 }, { unique: true });
const Economy = mongoose.model('Economy', EconomySchema);

const WarnSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  reason: String,
  moderator: String,
  date: { type: Date, default: Date.now },
});
const Warn = mongoose.model('Warn', WarnSchema);

const TicketSettingsSchema = new mongoose.Schema({
  guildId: { type: String, unique: true, required: true },
  sections: [{
    name: String,
    roleId: String,
    emoji: { type: String, default: '📌' },
  }],
  text: { type: String, default: 'مرحباً بكم جميعاً في قسم التذاكر، لفتح تذكرة أرجو ضغط على القائمة أدناه واختيار التذكرة التي تناسبك.' },
  image: { type: String, default: 'https://i.imgur.com/GkKqN3G.png' },
});
const TicketSettings = mongoose.model('TicketSettings', TicketSettingsSchema);

const TicketRatingSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  closedBy: String,
  section: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  ticketId: String,
  createdAt: { type: Date, default: Date.now },
});
TicketRatingSchema.index({ guildId: 1, ticketId: 1 }, { unique: true });
const TicketRating = mongoose.model('TicketRating', TicketRatingSchema);

const SelfRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  roleId: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  emoji: { type: String, default: '🎭' },
  image: { type: String, default: null },
  order: { type: Number, default: 0 },
}, { timestamps: true });
SelfRoleSchema.index({ guildId: 1, roleId: 1 }, { unique: true });
const SelfRole = mongoose.model('SelfRole', SelfRoleSchema);

const AutoLineSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  text: String,
  image: String,
  enabled: { type: Boolean, default: false },
});
AutoLineSchema.index({ guildId: 1, channelId: 1 }, { unique: true });
const AutoLine = mongoose.model('AutoLine', AutoLineSchema);

const AutoReplySchema = new mongoose.Schema({
  guildId: String,
  keyword: String,
  reply: String,
  image: String,
});
AutoReplySchema.index({ guildId: 1, keyword: 1 }, { unique: true });
const AutoReply = mongoose.model('AutoReply', AutoReplySchema);

const LevelRoleSchema = new mongoose.Schema({
  guildId: String,
  level: Number,
  roleId: String,
});
LevelRoleSchema.index({ guildId: 1, level: 1 }, { unique: true });
const LevelRole = mongoose.model('LevelRole', LevelRoleSchema);

const ControllerSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
});
ControllerSchema.index({ guildId: 1, userId: 1 }, { unique: true });
const Controller = mongoose.model('Controller', ControllerSchema);

const NameCooldownSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  timestamp: { type: Date, default: Date.now },
});
const NameCooldown = mongoose.model('NameCooldown', NameCooldownSchema);

// ============================================================
// ========== دوال مساعدة ==========
// ============================================================

async function getGuildConfig(guildId) {
  let config = await Config.findOne({ guildId });
  if (!config) {
    config = new Config({ guildId });
    await config.save();
  }
  return config;
}

async function updateGuildConfig(guildId, data) {
  await Config.findOneAndUpdate({ guildId }, data, { upsert: true, new: true });
}

async function getUserData(guildId, userId) {
  let data = await User.findOne({ guildId, userId });
  if (!data) {
    data = new User({ guildId, userId });
    await data.save();
  }
  return data;
}

async function getEconomy(guildId, userId) {
  let eco = await Economy.findOne({ guildId, userId });
  if (!eco) {
    eco = new Economy({ guildId, userId });
    await eco.save();
  }
  return eco;
}

async function getTicketSettings(guildId) {
  let settings = await TicketSettings.findOne({ guildId });
  if (!settings) {
    settings = new TicketSettings({ guildId });
    await settings.save();
  }
  return settings;
}

async function saveTicketSettings(guildId, data) {
  await TicketSettings.findOneAndUpdate({ guildId }, data, { upsert: true });
}

async function setAutoLine(guildId, channelId, data) {
  await AutoLine.findOneAndUpdate({ guildId, channelId }, data, { upsert: true });
}

async function deleteAutoLine(guildId, channelId) {
  await AutoLine.deleteOne({ guildId, channelId });
}

async function getAutoReplies(guildId) {
  return await AutoReply.find({ guildId });
}

async function addAutoReply(guildId, keyword, reply, image = null) {
  const existing = await AutoReply.findOne({ guildId, keyword: { $regex: new RegExp(`^${keyword}$`, 'i') } });
  if (existing) {
    existing.reply = reply;
    existing.image = image;
    await existing.save();
    return false;
  }
  const newReply = new AutoReply({ guildId, keyword, reply, image });
  await newReply.save();
  return true;
}

async function removeAutoReply(guildId, keyword) {
  const result = await AutoReply.deleteOne({ guildId, keyword: { $regex: new RegExp(`^${keyword}$`, 'i') } });
  return result.deletedCount > 0;
}

async function findAutoReply(guildId, content) {
  const replies = await AutoReply.find({ guildId });
  return replies.find(r => content.toLowerCase().includes(r.keyword.toLowerCase()));
}

async function addWarn(guildId, userId, reason, moderator) {
  const warn = new Warn({ guildId, userId, reason, moderator });
  await warn.save();
  return await Warn.countDocuments({ guildId, userId });
}

async function clearWarns(guildId, userId) {
  await Warn.deleteMany({ guildId, userId });
}

async function isController(userId, guildId) {
  if (OWNER_ID && userId === OWNER_ID) return true;
  const c = await Controller.findOne({ guildId, userId });
  return !!c;
}

async function addController(guildId, userId) {
  const existing = await Controller.findOne({ guildId, userId });
  if (!existing) {
    const c = new Controller({ guildId, userId });
    await c.save();
    return true;
  }
  return false;
}

async function removeController(guildId, userId) {
  const result = await Controller.deleteOne({ guildId, userId });
  return result.deletedCount > 0;
}

async function getControllers(guildId) {
  const docs = await Controller.find({ guildId });
  return docs.map(d => d.userId);
}

async function hasPermission(member, guildId) {
  if (!member) return false;
  if (OWNER_ID && member.id === OWNER_ID) return true;
  return await isController(member.id, guildId);
}

async function setNameCooldown(userId) {
  await NameCooldown.findOneAndUpdate({ userId }, { timestamp: new Date() }, { upsert: true });
}

async function getNameCooldown(userId) {
  const cd = await NameCooldown.findOne({ userId });
  return cd ? cd.timestamp : null;
}

function getGeneralImage(guild, config) {
  if (config.generalImage) return config.generalImage;
  if (config.bannerImage) return config.bannerImage;
  if (guild.iconURL()) return guild.iconURL({ size: 1024 });
  return null;
}

function sanitizeChannelName(name) {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
    .slice(0, 32) || 'ticket';
}

// ============================================================
// ========== دوال التحقق من الإيموجي ==========
// ============================================================

function isValidEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return false;
  if (/^<a?:\w{2,32}:\d{17,20}>$/.test(emoji)) return true;
  try {
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic})(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Extended_Pictographic}))*$/u;
    return emojiRegex.test(emoji) && emoji.length <= 8;
  } catch (e) {
    return false;
  }
}

function parseEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return null;
  const customMatch = emoji.match(/^<a?:(\w{2,32}):(\d{17,20})>$/);
  if (customMatch) {
    return { name: customMatch[1], id: customMatch[2] };
  }
  if (isValidEmoji(emoji)) {
    return emoji;
  }
  return null;
}

// ============================================================
// ========== دوال الرتب الذاتية ==========
// ============================================================

async function getSelfRoles(guildId) {
  return await SelfRole.find({ guildId }).sort({ order: 1, createdAt: 1 });
}

async function addSelfRole(guildId, roleId, label, emoji = '🎭', image = null, description = '') {
  if (!parseEmoji(emoji)) {
    emoji = '🎭';
  }
  
  const existing = await SelfRole.findOne({ guildId, roleId });
  const maxOrder = await SelfRole.findOne({ guildId }).sort({ order: -1 });
  const order = maxOrder ? maxOrder.order + 1 : 0;
  if (existing) {
    existing.label = label;
    existing.emoji = emoji;
    existing.image = image;
    existing.description = description;
    await existing.save();
    return false;
  }
  const newRole = new SelfRole({ guildId, roleId, label, emoji, image, description, order });
  await newRole.save();
  return true;
}

async function removeSelfRole(guildId, roleId) {
  const result = await SelfRole.deleteOne({ guildId, roleId });
  return result.deletedCount > 0;
}

async function updateSelfRole(guildId, roleId, data) {
  if (data.emoji !== undefined && !parseEmoji(data.emoji)) {
    data.emoji = '🎭';
  }
  return await SelfRole.findOneAndUpdate({ guildId, roleId }, data, { new: true });
}

// ========== دوال بناء بانل الرتب (مشتركة) ==========
async function buildSelfRolesPanel(guildId, guild, config) {
  const selfRoles = await getSelfRoles(guildId);
  if (!selfRoles.length) return null;

  const generalImage = getGeneralImage(guild, config);
  const panelText = config.rolesPanelText || 'اختر الرتب التي تناسبك من القائمة المنسدلة أدناه.\n\n**🖱️ اضغط على الرتبة لإضافتها، واضغط مرة أخرى لإزالتها.**';
  const panelImage = config.rolesImage || null;

  const embed = new EmbedBuilder()
    .setTitle('🎭 رتب الاختيار الذاتي')
    .setDescription(panelText)
    .setColor(THEME.ORANGE)
    .setFooter({ text: 'اضغط على الرتبة لإضافتها أو إزالتها من حسابك.' });

  if (panelImage) embed.setImage(panelImage);
  else if (generalImage) embed.setThumbnail(generalImage);

  const options = selfRoles.slice(0, 24).map(r => {
    const opt = {
      label: r.label.slice(0, 100),
      value: r.roleId,
    };
    const parsedEmoji = parseEmoji(r.emoji);
    if (parsedEmoji) opt.emoji = parsedEmoji;
    else opt.emoji = '🎭';
    if (r.description) opt.description = r.description.slice(0, 100);
    return opt;
  });

  options.push({
    label: 'إعادة تعيين',
    value: 'SELF_ROLES_RESET',
    emoji: '🔄',
    description: 'إلغاء التحديد وإعادة إرسال القائمة',
  });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('self_roles_toggle')
      .setPlaceholder('🎭 اختر رتبة...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options)
  );

  return { embed, row };
}

// ========== دوال بناء بانل الاقتراحات ==========
async function buildSuggestionPanel(config) {
  const title = config.suggestionsPanelTitle || '💡 قناة الاقتراحات';
  const text = config.suggestionsPanelText || 'هل لديك فكرة لتطوير السيرفر؟ شاركنا اقتراحك!\n\n**🖱️ اضغط على الزر أدناه لتقديم اقتراحك.**';
  const image = config.suggestionsPanelImage || config.suggestionsImage || null;
  const buttonText = config.suggestionsPanelButtonText || '📝 إرسال اقتراحك';
  const color = parseInt(config.suggestionsColor?.replace('#', '') || 'ff6b00', 16);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(text)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'شاركنا أفكارك لتطوير السيرفر ✨' });

  if (image) embed.setImage(image);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('suggest_modal')
      .setLabel(buttonText)
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝')
  );

  return { embed, row };
}

// ========== العميل ==========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.once('ready', () => {
  console.log(`✅ البوت جاهز باسم ${client.user.tag}`);
  if (OWNER_ID) console.log(`👑 صاحب البوت: ${OWNER_ID}`);
  client.user.setActivity('The Kingdom Never Falls.', { type: ActivityType.Watching });
});

// ============================================================
// ========== نظام اللوق ==========
// ============================================================

const logQueue = [];
let logProcessing = false;

async function processLogQueue() {
  if (logProcessing) return;
  logProcessing = true;
  while (logQueue.length > 0) {
    const task = logQueue.shift();
    try {
      await task();
    } catch (e) {
      console.error('❌ خطأ في اللوق:', e);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  logProcessing = false;
}

function logToChannel(guildId, data) {
  logQueue.push(async () => {
    const config = await getGuildConfig(guildId);
    if (!config.logChannel) return;
    const channel = client.channels.cache.get(config.logChannel);
    if (!channel) return;
    const embed = new EmbedBuilder()
      .setColor(data.color || THEME.BLACK)
      .setTitle(data.title || '📋 سجل')
      .setDescription(data.description || '')
      .setTimestamp();
    if (data.footer) embed.setFooter({ text: data.footer });
    if (data.fields) for (const f of data.fields) embed.addFields(f);
    if (data.thumbnail) embed.setThumbnail(data.thumbnail);
    if (data.image) embed.setImage(data.image);
    await channel.send({ embeds: [embed] });
  });
  processLogQueue();
}

// ============================================================
// ========== نظام الترحيب ==========
// ============================================================

function drawDefaultBackground(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0d0d0d');
  gradient.addColorStop(0.5, '#2b1500');
  gradient.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

async function generateWelcomeImage(member, memberCount, background = null) {
  const width = 1200;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  if (background) {
    if (background.match(/^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i)) {
      try {
        const bgImage = await loadImage(background);
        ctx.drawImage(bgImage, 0, 0, width, height);
      } catch (e) {
        drawDefaultBackground(ctx, width, height);
      }
    } else {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    drawDefaultBackground(ctx, width, height);
  }

  ctx.strokeStyle = THEME.ORANGE_HEX;
  ctx.lineWidth = 6;
  const borderRadius = 20;
  const x = 30, y = 30, w = width - 60, h = height - 60;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + w - borderRadius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
  ctx.lineTo(x + w, y + h - borderRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
  ctx.lineTo(x + borderRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
  ctx.lineTo(x, y + borderRadius);
  ctx.quadraticCurveTo(x, y, x + borderRadius, y);
  ctx.closePath();
  ctx.stroke();

  try {
    const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarURL);
    const radius = 140;
    const centerX = 250, centerY = 300;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = THEME.ORANGE_HEX;
    ctx.lineWidth = 6;
    ctx.stroke();
  } catch (e) {
    console.error('❌ خطأ في تحميل الصورة الرمزية:', e);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;

  const displayName = member.displayName || member.user.username;

  ctx.font = `bold 52px ${ARABIC_FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 15;
  ctx.fillText(`مرحباً ${displayName}`, 460, 190);

  ctx.font = `36px ${ARABIC_FONT}`;
  ctx.fillStyle = THEME.ORANGE_HEX;
  ctx.shadowBlur = 10;
  ctx.fillText(`العضو رقم #${memberCount}`, 460, 270);

  ctx.font = `28px ${ARABIC_FONT}`;
  ctx.fillStyle = '#cccccc';
  ctx.shadowBlur = 5;
  ctx.fillText('نتمنى لك قضاء وقت ممتع في السيرفر! 🎉', 460, 340);

  ctx.textAlign = 'right';
  ctx.font = `22px ${ARABIC_FONT}`;
  ctx.fillStyle = THEME.ORANGE_HEX;
  ctx.shadowBlur = 0;
  ctx.fillText('مرحباً بك', width - 50, height - 40);
  ctx.shadowBlur = 0;

  return canvas.toBuffer('image/png');
}

client.on('guildMemberAdd', async (member) => {
  try {
    const config = await getGuildConfig(member.guild.id);
    if (!config.welcomeChannel) return;
    const channel = member.guild.channels.cache.get(config.welcomeChannel);
    if (!channel) return;
    const memberCount = member.guild.memberCount;
    const imageBuffer = await generateWelcomeImage(member, memberCount, config.welcomeBackground);
    const generalImage = getGeneralImage(member.guild, config);
    const embed = new EmbedBuilder()
      .setTitle(config.welcomeTitle || '🔥 مرحباً بك في المجتمع')
      .setDescription(config.welcomeMessage || `أهلاً ${member} في السيرفر!`)
      .setColor(THEME.ORANGE)
      .setImage('attachment://welcome.png')
      .setTimestamp();
    if (config.welcomeImage) embed.setThumbnail(config.welcomeImage);
    if (generalImage) embed.setFooter({ text: 'نتمنى لك قضاء وقت ممتع!', iconURL: generalImage });
    await channel.send({ content: `${member}`, embeds: [embed], files: [{ attachment: imageBuffer, name: 'welcome.png' }] });
    if (config.joinRole) {
      const role = member.guild.roles.cache.get(config.joinRole);
      if (role) await member.roles.add(role).catch(() => {});
    }
    logToChannel(member.guild.id, {
      title: '👤 عضو جديد',
      color: THEME.ORANGE,
      description: `**${member.user.tag}** انضم إلى السيرفر.`,
      fields: [{ name: 'عدد الأعضاء', value: `${memberCount}`, inline: true }],
      thumbnail: member.user.displayAvatarURL(),
      footer: 'نظام الترحيب',
    });
  } catch (error) {
    console.error('❌ خطأ في الترحيب:', error);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    logToChannel(member.guild.id, {
      title: '🚫 عضو غادر',
      color: THEME.BLACK,
      description: `**${member.user.tag}** غادر السيرفر.`,
      thumbnail: member.user.displayAvatarURL(),
      footer: 'نظام الترحيب',
    });
  } catch (error) {
    console.error('❌ خطأ في مغادرة العضو:', error);
  }
});

client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;
  try {
    let content = message.content;
    if (!content && message.partial) {
      try {
        const fetched = await message.fetch();
        content = fetched.content;
      } catch (e) {}
    }
    logToChannel(message.guild.id, {
      title: '🗑️ حذف رسالة',
      color: THEME.BLACK,
      description: `**المستخدم:** ${message.author?.tag || 'غير معروف'}\n**القناة:** ${message.channel.name}\n**المحتوى:** ${content || 'غير مرئي (قد يحتوي على مرفقات)'}`,
      footer: 'سجلات الرسائل',
    });
  } catch (error) {
    console.error('❌ خطأ في حذف الرسالة:', error);
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author?.bot) return;
  try {
    let oldContent = oldMessage.content;
    let newContent = newMessage.content;
    if (oldMessage.partial) {
      try {
        const fetched = await oldMessage.fetch();
        oldContent = fetched.content;
      } catch (e) {}
    }
    if (oldContent === newContent) return;
    logToChannel(oldMessage.guild.id, {
      title: '✏️ تعديل رسالة',
      color: THEME.BLACK,
      description: `**المستخدم:** ${oldMessage.author?.tag || 'غير معروف'}\n**القناة:** ${oldMessage.channel.name}`,
      fields: [
        { name: '📜 النص القديم', value: oldContent || 'فارغ', inline: false },
        { name: '📝 النص الجديد', value: newContent || 'فارغ', inline: false },
      ],
      footer: 'سجلات الرسائل',
    });
  } catch (error) {
    console.error('❌ خطأ في تعديل الرسالة:', error);
  }
});

// ============================================================
// ========== نظام الفويس ==========
// ============================================================

client.on('voiceStateUpdate', async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;
  const guildId = newState.guild.id;
  const userId = member.id;

  try {
    if (!oldState.channelId && newState.channelId) {
      await Economy.findOneAndUpdate(
        { guildId, userId },
        { lastVoiceJoin: new Date() },
        { upsert: true }
      );
    }

    if (oldState.channelId && !newState.channelId) {
      const eco = await getEconomy(guildId, userId);
      if (eco.lastVoiceJoin) {
        const seconds = Math.floor((Date.now() - eco.lastVoiceJoin.getTime()) / 1000);
        const minutes = Math.floor(seconds / 60);
        eco.lastVoiceJoin = null;
        if (minutes >= 1) {
          const reward = Math.min(minutes, 30);
          eco.og += reward;
          eco.voiceSeconds += seconds;
          await eco.save();
          try {
            const dmEmbed = new EmbedBuilder()
              .setTitle('💰 مكافأة OG للفويس')
              .setDescription(`حصلت على **${reward} OG** مقابل ${reward} دقيقة في الروم الصوتي في **${oldState.guild.name}**!\nرصيدك الحالي: **${eco.og} OG**`)
              .setColor(THEME.ORANGE);
            await member.send({ embeds: [dmEmbed] }).catch(() => {});
          } catch (e) {}
        } else {
          await eco.save();
        }
      }
    }
  } catch (error) {
    console.error('❌ خطأ في voiceStateUpdate:', error);
  }
});

// ============================================================
// ========== قائمة الأوامر الإدارية ==========
// ============================================================

function isAdminCommand(cmd) {
  const adminCmds = [
    'حظر', 'طرد', 'كتم', 'فك_كتم', 'تحذير', 'ابطال_تحذيرات',
    'مسح', 'قفل', 'فتح', 'نقل_كل',
    'حذف_قناة', 'تغيير_اسم_قناة'
  ];
  return adminCmds.includes(cmd);
}

// ============================================================
// ========== المعالج الرئيسي الموحد لـ messageCreate ==========
// ============================================================

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const isCommand = message.content.startsWith('!');
  const config = await getGuildConfig(guildId);
  const generalImage = getGeneralImage(message.guild, config);

  // ============================================================
  // ===== الجزء 1: الأوامر النصية =====
  // ============================================================
  if (isCommand) {
    const args = message.content.slice(1).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    const deleteDelay = isAdminCommand(cmd) ? 5000 : 0;
    let sentReply = null;

    const deleteAfter = (replyMsg) => {
      if (deleteDelay === 0) return;
      setTimeout(async () => {
        try { await message.delete(); } catch (e) {}
        if (replyMsg) {
          try { await replyMsg.delete(); } catch (e) {}
        }
      }, deleteDelay);
    };

    try {
      // ============================================================
      // ===== أوامر العملة =====
      // ============================================================

      if (cmd === 'رصيدي') {
        const eco = await getEconomy(guildId, userId);
        const embed = new EmbedBuilder()
          .setTitle(`💰 رصيد ${message.author.username}`)
          .setDescription(`**${eco.og} OG**`)
          .setColor(THEME.ORANGE);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      if (cmd === 'توب') {
        const top = await Economy.find({ guildId }).sort({ og: -1 }).limit(10);
        if (!top.length) {
          await message.reply('📭 لا يوجد أي شخص لديه OG حتى الآن.');
          return;
        }
        let desc = '';
        let rank = 1;
        for (const entry of top) {
          const member = message.guild.members.cache.get(entry.userId);
          const name = member ? member.user.username : `مستخدم ${entry.userId}`;
          desc += `**#${rank}** ${name} - \`${entry.og} OG\`\n`;
          rank++;
        }
        const embed = new EmbedBuilder().setTitle('🏆 ترتيب أغنى 10 أشخاص').setDescription(desc).setColor(THEME.ORANGE).setTimestamp();
        await message.channel.send({ embeds: [embed] });
        return;
      }

      if (cmd === 'اعطاء_عملات' || cmd === 'اعطاء_عمله') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const target = message.mentions.members.first();
        const amount = parseInt(args[0]);
        if (!target || !amount || amount <= 0) {
          sentReply = await message.reply('⚠️ الاستخدام: `!اعطاء_عملات @شخص <المبلغ>`');
          deleteAfter(sentReply);
          return;
        }
        if (target.user.bot) {
          sentReply = await message.reply('❌ لا يمكن إعطاء البوتات.');
          deleteAfter(sentReply);
          return;
        }
        const eco = await getEconomy(guildId, target.id);
        eco.og += amount;
        await eco.save();
        const embed = new EmbedBuilder()
          .setTitle('✅ تم إعطاء العملات')
          .setDescription(`تم إعطاء <@${target.id}> **${amount} OG** بنجاح.\nرصيده الآن: **${eco.og} OG**`)
          .setColor(THEME.ORANGE);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle('💰 استلام OG')
            .setDescription(`تم إعطاؤك **${amount} OG** في **${message.guild.name}**!\nرصيدك الحالي: **${eco.og} OG**`)
            .setColor(THEME.ORANGE);
          await target.send({ embeds: [dmEmbed] }).catch(() => {});
        } catch (e) {}
        return;
      }

      if (cmd === 'سحب_عملات' || cmd === 'سحب_عمله') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const target = message.mentions.members.first();
        const amount = parseInt(args[0]);
        if (!target || !amount || amount <= 0) {
          sentReply = await message.reply('⚠️ الاستخدام: `!سحب_عملات @شخص <المبلغ>`');
          deleteAfter(sentReply);
          return;
        }
        if (target.user.bot) {
          sentReply = await message.reply('❌ لا يمكن السحب من البوتات.');
          deleteAfter(sentReply);
          return;
        }
        const eco = await getEconomy(guildId, target.id);
        if (eco.og < amount) {
          sentReply = await message.reply(`⚠️ رصيده غير كافٍ. لديه **${eco.og} OG** فقط.`);
          deleteAfter(sentReply);
          return;
        }
        eco.og -= amount;
        await eco.save();
        const embed = new EmbedBuilder()
          .setTitle('✅ تم سحب العملات')
          .setDescription(`تم سحب **${amount} OG** من <@${target.id}>.\nرصيده الآن: **${eco.og} OG**`)
          .setColor(THEME.ORANGE);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ===== الأوامر العامة =====
      // ============================================================

      if (cmd === 'مساعدة') {
        const embed = new EmbedBuilder()
          .setTitle('📖 قائمة الأوامر')
          .setColor(THEME.ORANGE)
          .addFields(
            { name: '👑 نظام التحكم', value: '`متحكم @شخص` `الغاء_متحكم @شخص` `قائمة_المتحكمين`', inline: false },
            { name: '🛡️ الإدارة', value: '`حظر` `طرد` `كتم` `فك_كتم` `تحذير` `ابطال_تحذيرات` `مسح` `قفل` `فتح`', inline: false },
            { name: '🎭 إدارة الرتب', value: '`اعطاء_رتبة` `سحب_رتبة` `عرض_رتب`', inline: false },
            { name: '📁 إدارة القنوات', value: '`انشاء_قناة` `حذف_قناة` `تغيير_اسم_قناة`', inline: false },
            { name: '🔊 إدارة الصوت', value: '`نقل_كل`', inline: false },
            { name: '📌 إدارة الرسائل', value: '`تثبيت` `الغاء_تثبيت`', inline: false },
            { name: '📊 المستويات', value: '`مستوى` `ترتيب` `تعيين روم_ليفل #قناة`', inline: false },
            { name: '👋 الترحيب', value: '`تعيين ترحيب #قناة` `تعيين رسالة_ترحيب نص` `تعيين صورة_ترحيب رابط` `تعيين عنوان_ترحيب نص` `تعيين خلفية_ترحيب [لون/رابط]`', inline: false },
            { name: '📋 اللوق', value: '`تعيين سجلات #قناة` `اختبار_لوق`', inline: false },
            { name: '🤖 الأوتو لاين', value: '`تعيين اوتر_لاين #روم [نص]` `تعيين صورة_اوترلاين #روم رابط` `تعيين تفعيل_اوترلاين #روم` `تعيين تعطيل_اوترلاين #روم` `تعيين حذف_اوترلاين #روم`', inline: false },
            { name: '💬 الردود التلقائية', value: '`رد_تلقائي كلمة رد` `رد_تلقائي_صورة كلمة رد رابط` `حذف_رد_تلقائي كلمة` `عرض_الردود`', inline: false },
            { name: '💡 الاقتراحات', value: '`بانل_اقتراح عنوان=... نص=... صورة=...` (للمتحكمين)', inline: false },
            { name: '🎫 التذاكر', value: '`بانل` `عرض_تذكرة` `تعيين تذكرة` (للمتحكمين)', inline: false },
            { name: '⭐ التقييمات', value: '`تقييمات` (للمتحكمين)', inline: false },
            { name: '🎭 الرتب الذاتية', value: '`تعيين رتب` (للمتحكمين)', inline: false },
            { name: '✏️ تغيير الاسم', value: '`تغيير_اسم`', inline: false },
            { name: 'ℹ️ معلومات', value: '`معلومات` `سيرفر` `بينق`', inline: false },
            { name: '⚙️ إعدادات', value: '`تعيين` (للمتحكمين)', inline: false },
            { name: '📸 إنستغرام', value: '`ig رابط_الريلز`', inline: false },
            { name: '💰 الاقتصاد', value: '`رصيدي` `توب` `اعطاء_عملات @شخص مبلغ` `سحب_عملات @شخص مبلغ`', inline: false }
          )
          .setFooter({ text: `🔥 البادئة: !` });
        if (generalImage) embed.setImage(generalImage);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      if (cmd === 'ig') {
        const url = args[0];
        if (!url) {
          sentReply = await message.reply('⚠️ أدخل رابط الرقصة (ريلز) من إنستغرام.');
          deleteAfter(sentReply);
          return;
        }
        const loadingMsg = await message.reply('⏳ جاري تحميل الفيديو...');
        try {
          const instagramGetUrl = require('instagram-url-direct');
          const result = await instagramGetUrl(url);
          const videoUrl = Array.isArray(result) ? result[0]?.url : result.url;
          if (!videoUrl) throw new Error('تعذر استخراج رابط الفيديو.');
          const response = await fetch(videoUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          await message.reply({ files: [{ attachment: buffer, name: 'reel.mp4' }] });
          await loadingMsg.delete().catch(() => {});
        } catch (error) {
          await loadingMsg.edit({ content: `❌ فشل التحميل: ${error.message}` }).catch(() => {});
        }
        return;
      }

      if (cmd === 'متحكم') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        if (member.id === client.user.id) {
          sentReply = await message.reply('❌ لا يمكنني جعل نفسي متحكماً.');
          deleteAfter(sentReply);
          return;
        }
        if (member.id === OWNER_ID) {
          sentReply = await message.reply('❌ هذا هو مالك البوت، يملك صلاحية مطلقة مسبقاً.');
          deleteAfter(sentReply);
          return;
        }
        if (await isController(member.id, guildId)) {
          sentReply = await message.reply(`⚠️ ${member} متحكم بالفعل.`);
          deleteAfter(sentReply);
          return;
        }
        await addController(guildId, member.id);
        logToChannel(guildId, { title: '🛡️ تعيين متحكم', color: THEME.ORANGE, description: `**${message.author}** جعل ${member} متحكماً.` });
        sentReply = await message.reply(`✅ تم جعل ${member} متحكماً على البوت في هذا السيرفر.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'الغاء_متحكم') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        if (member.id === OWNER_ID) {
          sentReply = await message.reply('❌ لا يمكن إزالة صلاحية مالك البوت.');
          deleteAfter(sentReply);
          return;
        }
        if (!(await isController(member.id, guildId))) {
          sentReply = await message.reply(`⚠️ ${member} ليس متحكماً.`);
          deleteAfter(sentReply);
          return;
        }
        await removeController(guildId, member.id);
        logToChannel(guildId, { title: '🛡️ إلغاء متحكم', color: THEME.BLACK, description: `**${message.author}** ألغى صلاحية ${member}.` });
        sentReply = await message.reply(`✅ تم إلغاء صلاحية التحكم عن ${member}.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'قائمة_المتحكمين') {
        const controllers = await getControllers(guildId);
        if (!controllers.length) {
          sentReply = await message.reply('📋 لا يوجد متحكمون في هذا السيرفر.');
          deleteAfter(sentReply);
          return;
        }
        const list = controllers.map(id => `<@${id}>`).join('\n');
        const embed = new EmbedBuilder().setTitle('🛡️ قائمة المتحكمين').setColor(THEME.ORANGE).setDescription(list).setTimestamp();
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'اصلاح_رتب') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        const allRoles = await SelfRole.find({ guildId });
        let fixed = 0;
        let valid = 0;
        for (const r of allRoles) {
          if (!parseEmoji(r.emoji)) {
            r.emoji = '🎭';
            await r.save();
            fixed++;
            console.log(`🔧 تم إصلاح إيموجي: ${r.label} → 🎭`);
          } else {
            valid++;
          }
        }
        sentReply = await message.reply(`✅ تم إصلاح **${fixed}** رتبة. الرتب السليمة: **${valid}**.`);
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ===== تعيين =====
      // ============================================================
      if (cmd === 'تعيين') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const sub = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        if (!sub) {
          const embed = new EmbedBuilder()
            .setTitle('⚙️ أوامر الإعدادات')
            .setColor(THEME.ORANGE)
            .addFields(
              { name: '👋 الترحيب', value: '`ترحيب #قناة`، `رسالة_ترحيب نص`، `صورة_ترحيب رابط`، `عنوان_ترحيب نص`، `خلفية_ترحيب [لون/رابط]`', inline: false },
              { name: '📋 اللوق', value: '`سجلات #قناة`' },
              { name: '📊 المستويات', value: '`روم_ليفل #قناة`' },
              { name: '🤖 الأوتو لاين', value: '`اوتر_لاين #روم [نص]`، `صورة_اوترلاين #روم رابط`، `تفعيل_اوترلاين #روم`، `تعطيل_اوترلاين #روم`، `حذف_اوترلاين #روم`' },
              { name: '🎫 التذاكر', value: '`تذكرة` (لإدارة الأقسام)' },
              { name: '🎭 الرتب الذاتية', value: '`رتب` (لإدارة الرتب التفاعلية)' },
              { name: '⭐ التقييمات', value: '`تقييم [on/off]`، `قناة_تقييم #قناة`' },
              { name: '🔔 رتب الإشعارات', value: '`صورة_رتب رابط`' },
              { name: '🖼️ عام', value: '`صورة_بنر رابط`، `صورة_عامة رابط`' },
              { name: '🚪 دور الدخول', value: '`دور_دخول @دور`' },
              { name: '💡 الاقتراحات', value: '`قناة_اقتراح #قناة`، `عنوان_اقتراح نص`، `وصف_اقتراح نص`، `لون_اقتراح #هيكس`، `صورة_اقتراح رابط`' }
            )
            .setFooter({ text: 'الصيغة: !تعيين [الخيار] [القيمة]' });
          if (generalImage) embed.setImage(generalImage);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        // ===== إدارة الرتب الذاتية =====
        if (sub === 'رتب') {
          const action = args[1]?.toLowerCase();
          const rest = args.slice(2);

          if (!action) {
            const selfRoles = await getSelfRoles(guildId);
            const listText = selfRoles.length
              ? selfRoles.map((r, i) => {
                  const role = message.guild.roles.cache.get(r.roleId);
                  return `**${i + 1}.** ${r.emoji} **${r.label}** ${role ? `→ ${role}` : '⚠️ (محذوفة)'}`;
                }).join('\n')
              : 'لا توجد رتب مسجلة بعد.';

            const embed = new EmbedBuilder()
              .setTitle('🎭 إدارة الرتب الذاتية')
              .setColor(THEME.ORANGE)
              .setDescription('نظام يسمح للأعضاء باختيار رتبهم بأنفسهم من قائمة منسدلة (Toggle).')
              .addFields(
                { name: '➕ إضافة رتبة', value: '`!تعيين رتب اضافة @رتبة [الاسم] [الايموجي] [رابط_صورة]`', inline: false },
                { name: '✏️ تعديل رتبة', value: '`!تعيين رتب تعديل @رتبة [الاسم/الايموجي/الصورة/الوصف] [القيمة]`', inline: false },
                { name: '🗑️ حذف رتبة', value: '`!تعيين رتب حذف @رتبة`', inline: false },
                { name: '📋 عرض الرتب', value: '`!تعيين رتب عرض`', inline: false },
                { name: '📢 إرسال البانل', value: '`!تعيين رتب بانل [#قناة]`', inline: false },
                { name: '🖼️ صورة البانل', value: '`!تعيين رتب صورة_بانل [رابط]`', inline: false },
                { name: '📝 نص البانل', value: '`!تعيين رتب نص_بانل [النص]`', inline: false },
                { name: '🔢 ترتيب رتبة', value: '`!تعيين رتب ترتيب @رتبة [رقم]`', inline: false },
                { name: '📌 الرتب المسجلة', value: listText.slice(0, 1024), inline: false }
              )
              .setFooter({ text: `إجمالي: ${selfRoles.length} رتبة` });
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'اضافة' || action === 'إضافة') {
            const role = message.mentions.roles.first();
            if (!role) {
              sentReply = await message.reply('⚠️ منشن الرتبة.\nالصيغة: `!تعيين رتب اضافة @رتبة [الاسم] [الايموجي] [رابط_صورة]`');
              deleteAfter(sentReply);
              return;
            }

            const label = rest[0] || role.name;
            let emoji = rest[1] || '🎭';
            const image = rest[2] && rest[2].match(/^https?:\/\//) ? rest[2] : null;
            const description = rest.slice(image ? 3 : 2).join(' ') || '';

            if (!parseEmoji(emoji)) {
              console.log(`⚠️ إيموجي غير صالح: "${emoji}" - سيتم استخدام 🎭`);
              emoji = '🎭';
            }

            if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
              sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
              deleteAfter(sentReply);
              return;
            }

            if (role.position >= message.guild.members.me.roles.highest.position) {
              sentReply = await message.reply('❌ هذه الرتبة أعلى من رتبة البوت.');
              deleteAfter(sentReply);
              return;
            }

            const added = await addSelfRole(guildId, role.id, label, emoji, image, description);

            const embed = new EmbedBuilder()
              .setTitle(added ? '✅ تم إضافة الرتبة' : '🔄 تم تحديث الرتبة')
              .setColor(THEME.ORANGE)
              .addFields(
                { name: '🎭 الرتبة', value: `${role}`, inline: true },
                { name: '📝 الاسم الظاهر', value: label, inline: true },
                { name: '😀 الإيموجي', value: emoji, inline: true }
              )
              .setFooter({ text: 'استخدم !تعيين رتب بانل لإرسال القائمة' });

            if (image) {
              embed.setImage(image);
              embed.addFields({ name: '🖼️ الصورة', value: `[رابط](${image})`, inline: false });
            }
            if (description) embed.addFields({ name: '📄 الوصف', value: description, inline: false });

            sentReply = await message.channel.send({ embeds: [embed] });
            logToChannel(guildId, { title: '🎭 إضافة رتبة ذاتية', color: THEME.ORANGE, description: `**${message.author}** أضاف رتبة **${label}** (${role.name})` });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'تعديل') {
            const role = message.mentions.roles.first();
            if (!role) {
              sentReply = await message.reply('⚠️ منشن الرتبة.\nالصيغة: `!تعيين رتب تعديل @رتبة [الاسم/الايموجي/الصورة/الوصف] [القيمة]`');
              deleteAfter(sentReply);
              return;
            }

            const existing = await SelfRole.findOne({ guildId, roleId: role.id });
            if (!existing) {
              sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.');
              deleteAfter(sentReply);
              return;
            }

            const option = rest[0]?.toLowerCase();
            const newValue = rest.slice(1).join(' ');

            if (!option || !newValue) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين رتب تعديل @رتبة [الاسم/الايموجي/الصورة/الوصف] [القيمة]`');
              deleteAfter(sentReply);
              return;
            }

            const updateData = {};
            if (option === 'الاسم') updateData.label = newValue;
            else if (option === 'الايموجي') {
              if (!parseEmoji(newValue)) {
                sentReply = await message.reply('⚠️ الإيموجي غير صالح.');
                deleteAfter(sentReply);
                return;
              }
              updateData.emoji = newValue;
            }
            else if (option === 'الصورة') updateData.image = newValue;
            else if (option === 'الوصف') updateData.description = newValue;
            else {
              sentReply = await message.reply('⚠️ خيار غير معروف.');
              deleteAfter(sentReply);
              return;
            }

            await updateSelfRole(guildId, role.id, updateData);

            sentReply = await message.channel.send({
              embeds: [new EmbedBuilder()
                .setTitle('✅ تم تعديل الرتبة')
                .setColor(THEME.ORANGE)
                .setDescription(`**الرتبة:** ${role}\n**الخيار:** ${option}\n**القيمة:** ${newValue}`)
              ]
            });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'حذف') {
            const role = message.mentions.roles.first();
            if (!role) {
              sentReply = await message.reply('⚠️ منشن الرتبة.');
              deleteAfter(sentReply);
              return;
            }

            const removed = await removeSelfRole(guildId, role.id);
            if (!removed) {
              sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.');
              deleteAfter(sentReply);
              return;
            }

            sentReply = await message.channel.send({
              embeds: [new EmbedBuilder()
                .setTitle('🗑️ تم حذف الرتبة')
                .setColor(THEME.ORANGE)
                .setDescription(`تم حذف الرتبة **${role.name}** من قائمة الاختيار الذاتي.`)
              ]
            });
            logToChannel(guildId, { title: '🗑️ حذف رتبة ذاتية', color: THEME.BLACK, description: `**${message.author}** حذف رتبة **${role.name}**` });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'عرض') {
            const selfRoles = await getSelfRoles(guildId);
            if (!selfRoles.length) {
              sentReply = await message.reply('📭 لا توجد رتب مسجلة.');
              deleteAfter(sentReply);
              return;
            }

            const embed = new EmbedBuilder()
              .setTitle('📋 قائمة الرتب المسجلة')
              .setColor(THEME.ORANGE)
              .setFooter({ text: `إجمالي: ${selfRoles.length}` });

            for (const r of selfRoles) {
              const role = message.guild.roles.cache.get(r.roleId);
              let value = `**الاسم الظاهر:** ${r.label}\n**الايموجي:** ${r.emoji}\n**الرتبة:** ${role ? role.toString() : '⚠️ محذوفة'}`;
              if (r.description) value += `\n**الوصف:** ${r.description}`;
              if (r.image) value += `\n**الصورة:** [رابط](${r.image})`;
              embed.addFields({ name: `${r.emoji} ${r.label}`, value, inline: false });
            }

            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'صورة_بانل') {
            const image = rest.join(' ');
            if (!image) {
              await updateGuildConfig(guildId, { rolesImage: null });
              sentReply = await message.reply('✅ تم إلغاء صورة البانل.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { rolesImage: image });
            sentReply = await message.channel.send({
              embeds: [new EmbedBuilder()
                .setTitle('✅ تم تعيين صورة البانل')
                .setColor(THEME.ORANGE)
                .setImage(image)
              ]
            });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'نص_بانل') {
            const text = rest.join(' ');
            if (!text) {
              sentReply = await message.reply('⚠️ أدخل النص.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { rolesPanelText: text });
            sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم تعيين نص البانل:\n${text}`)] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'ترتيب') {
            const role = message.mentions.roles.first();
            const order = parseInt(rest[0]);
            if (!role || isNaN(order)) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين رتب ترتيب @رتبة [رقم]`');
              deleteAfter(sentReply);
              return;
            }
            const existing = await SelfRole.findOne({ guildId, roleId: role.id });
            if (!existing) {
              sentReply = await message.reply('⚠️ هذه الرتبة غير مسجلة.');
              deleteAfter(sentReply);
              return;
            }
            await updateSelfRole(guildId, role.id, { order });
            sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم تعيين ترتيب **${role.name}** إلى **${order}**`)] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'بانل') {
            const panel = await buildSelfRolesPanel(guildId, message.guild, config);
            if (!panel) {
              sentReply = await message.reply('⚠️ لا توجد رتب مسجلة. استخدم `!تعيين رتب اضافة` أولاً.');
              deleteAfter(sentReply);
              return;
            }

            const targetChannel = message.mentions.channels.first() || message.channel;

            try {
              await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
              logToChannel(guildId, { title: '📢 إرسال بانل الرتب', color: THEME.ORANGE, description: `**${message.author}** أرسل بانل الرتب في ${targetChannel}` });
              sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم إرسال البانل في ${targetChannel}`)] });
              deleteAfter(sentReply);
            } catch (err) {
              console.error('❌ خطأ في إرسال البانل:', err);
              sentReply = await message.reply(`❌ فشل إرسال البانل: ${err.message}`);
              deleteAfter(sentReply);
            }
            return;
          }

          sentReply = await message.reply('⚠️ خيار غير معروف. استخدم `!تعيين رتب` لعرض المساعدة.');
          deleteAfter(sentReply);
          return;
        }

        // ===== باقي أوامر التعيين =====
        if (sub === 'ترحيب') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { welcomeChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تحديد قناة الترحيب.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الترحيب إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'رسالة_ترحيب') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل نص الترحيب الجديد.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeMessage: value });
          sentReply = await message.reply(`✅ تم تعيين نص الترحيب:\n${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_ترحيب') {
          if (!value) {
            await updateGuildConfig(guildId, { welcomeImage: null });
            sentReply = await message.reply('✅ تم إلغاء صورة الترحيب.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة الترحيب: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'عنوان_ترحيب') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل العنوان الجديد.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeTitle: value });
          sentReply = await message.reply(`✅ تم تعيين عنوان الترحيب: "${value}"`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'خلفية_ترحيب') {
          if (!value) {
            await updateGuildConfig(guildId, { welcomeBackground: null });
            sentReply = await message.reply('✅ تم إلغاء خلفية الترحيب.');
            deleteAfter(sentReply);
            return;
          }
          const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
          const isUrl = /^https?:\/\/.+\.(png|jpg|jpeg|gif|webp)/i.test(value);
          if (!isHex && !isUrl) {
            sentReply = await message.reply('⚠️ أدخل لوناً صحيحاً بصيغة Hex أو رابط صورة صالح.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { welcomeBackground: value });
          sentReply = await message.reply(`✅ تم تعيين خلفية الترحيب: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'سجلات') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { logChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين قناة اللوق.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { logChannel: channel.id });
          logToChannel(guildId, { title: '📋 تعيين قناة اللوق', color: THEME.ORANGE, description: `**${message.author}** عيّن قناة اللوق إلى ${channel}` });
          sentReply = await message.reply(`✅ تم تعيين قناة اللوق إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'روم_ليفل') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { levelChannelId: null });
            sentReply = await message.reply('✅ تم إلغاء تحديد قناة الليفل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { levelChannelId: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الليفل إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'اوتر_لاين') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن الروم.');
            deleteAfter(sentReply);
            return;
          }
          const text = args.slice(2).join(' ');
          await setAutoLine(guildId, channel.id, { text: text || null, enabled: true });
          logToChannel(guildId, { title: '🤖 تعيين أوتو لاين', color: THEME.ORANGE, description: `**${message.author}** عيّن الأوتو لاين في ${channel}` });
          const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين الأوتو لاين')
            .setColor(THEME.ORANGE)
            .setDescription(`**الروم:** ${channel}${text ? `\n**النص:** ${text}` : ''}`);
          if (generalImage) embed.setImage(generalImage);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن الروم.');
            deleteAfter(sentReply);
            return;
          }
          const imageUrl = args.slice(2).join(' ');
          if (!imageUrl) {
            await setAutoLine(guildId, channel.id, { image: null });
            sentReply = await message.reply(`✅ تم إزالة صورة الأوتو لاين من ${channel}`);
            deleteAfter(sentReply);
            return;
          }
          await setAutoLine(guildId, channel.id, { image: imageUrl });
          const embed = new EmbedBuilder()
            .setTitle('✅ تم تعيين صورة الأوتو لاين')
            .setColor(THEME.ORANGE)
            .setDescription(`**الروم:** ${channel}`)
            .setImage(imageUrl);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تفعيل_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن الروم.');
            deleteAfter(sentReply);
            return;
          }
          const auto = await AutoLine.findOne({ guildId, channelId: channel.id });
          if (!auto || (!auto.text && !auto.image)) {
            sentReply = await message.reply('⚠️ لم يتم تعيين نص أو صورة لهذا الروم.');
            deleteAfter(sentReply);
            return;
          }
          await setAutoLine(guildId, channel.id, { enabled: true });
          sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم تفعيل الأوتو لاين في ${channel}`)] });
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تعطيل_اوترلاين') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن الروم.');
            deleteAfter(sentReply);
            return;
          }
          await setAutoLine(guildId, channel.id, { enabled: false });
          sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`⏹️ تم تعطيل الأوتو لاين في ${channel}`)] });
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'حذف_اوترلاين' || sub === 'حذف_اوتر_لاين') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن الروم.');
            deleteAfter(sentReply);
            return;
          }
          await deleteAutoLine(guildId, channel.id);
          sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`🗑️ تم حذف الأوتو لاين من ${channel}`)] });
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'دور_دخول') {
          const role = message.mentions.roles.first();
          if (!role) {
            sentReply = await message.reply('⚠️ منشن الدور.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { joinRole: role.id });
          sentReply = await message.reply(`✅ تم تعيين دور الدخول إلى ${role}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_بانل') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { ticketPanelImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة البانل: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_رتب') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { rolesImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة رتب الإشعارات: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_بنر') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { bannerImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة البنر: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_عامة') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { generalImage: value });
          sentReply = await message.reply(`✅ تم تعيين الصورة العامة: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'قناة_اقتراح') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            sentReply = await message.reply('⚠️ منشن القناة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة الاقتراحات إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'عنوان_اقتراح') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل العنوان.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsTitle: value });
          sentReply = await message.reply(`✅ تم تعيين عنوان الاقتراحات: "${value}"`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'وصف_اقتراح') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل الوصف.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsDescription: value });
          sentReply = await message.reply(`✅ تم تعيين وصف الاقتراحات:\n${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'لون_اقتراح') {
          if (!value || !value.match(/^#[0-9a-fA-F]{6}$/)) {
            sentReply = await message.reply('⚠️ أدخل لوناً صحيحاً بصيغة Hex مثل `#ff6b00`.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsColor: value });
          sentReply = await message.reply(`✅ تم تعيين لون الاقتراحات: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_اقتراح') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { suggestionsImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة الاقتراحات: ${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تقييم') {
          if (!value || !['on', 'off'].includes(value.toLowerCase())) {
            sentReply = await message.reply('⚠️ الصيغة: `!تعيين تقييم [on/off]`');
            deleteAfter(sentReply);
            return;
          }
          const enabled = value.toLowerCase() === 'on';
          await updateGuildConfig(guildId, { ticketRatingEnabled: enabled });
          sentReply = await message.reply(`✅ تم ${enabled ? 'تفعيل' : 'تعطيل'} نظام تقييم التذاكر.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'قناة_تقييم') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { ticketRatingChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تحديد قناة عرض التقييمات.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { ticketRatingChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين قناة عرض التقييمات إلى ${channel}\n\n> التقييمات ستُرسل إلى هذه القناة تلقائياً.`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'تذكرة') {
          const settings = await getTicketSettings(guildId);
          const action = args[1]?.toLowerCase();
          const actionValue = args.slice(2).join(' ');

          if (!action) {
            const embed = new EmbedBuilder()
              .setTitle('⚙️ إدارة التذاكر')
              .setColor(THEME.ORANGE)
              .addFields(
                { name: '➕ إضافة قسم', value: '`!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:`' },
                { name: '🎨 تعيين إيموجي', value: '`!تعيين تذكرة تعيين_ايموجي [الاسم] :ايموجي:`' },
                { name: '➖ حذف قسم', value: '`!تعيين تذكرة حذف [الاسم]`' },
                { name: '📝 تغيير النص', value: '`!تعيين تذكرة نص [النص]`' },
                { name: '🖼️ تغيير الصورة', value: '`!تعيين تذكرة صورة [رابط]`' },
                { name: '👀 عرض الأقسام', value: '`!عرض_تذكرة`' }
              )
              .setFooter({ text: 'الأقسام: ' + settings.sections.map(s => `${s.emoji || '📌'} ${s.name}`).join(', ') });
            if (generalImage) embed.setImage(generalImage);
            sentReply = await message.channel.send({ embeds: [embed] });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'إضافة') {
            const parts = actionValue.match(/^(.+?)\s+<@&(\d+)>\s*(\S+)?$/);
            if (!parts) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين تذكرة إضافة [الاسم] @دور :ايموجي:`');
              deleteAfter(sentReply);
              return;
            }
            const sectionName = parts[1].trim();
            const roleId = parts[2];
            let emoji = parts[3] || '📌';
            if (!parseEmoji(emoji)) emoji = '📌';

            if (settings.sections.find(s => s.name === sectionName)) {
              sentReply = await message.reply(`⚠️ قسم "${sectionName}" موجود بالفعل.`);
              deleteAfter(sentReply);
              return;
            }

            settings.sections.push({ name: sectionName, roleId, emoji });
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم إضافة قسم **${sectionName}**.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'تعيين_ايموجي') {
            const parts = actionValue.match(/^(.+?)\s+(\S+)$/);
            if (!parts) {
              sentReply = await message.reply('⚠️ الصيغة: `!تعيين تذكرة تعيين_ايموجي [الاسم] :ايموجي:`');
              deleteAfter(sentReply);
              return;
            }
            const sectionName = parts[1].trim();
            let emoji = parts[2];
            if (!parseEmoji(emoji)) emoji = '📌';
            const section = settings.sections.find(s => s.name === sectionName);
            if (!section) {
              sentReply = await message.reply(`⚠️ قسم "${sectionName}" غير موجود.`);
              deleteAfter(sentReply);
              return;
            }
            section.emoji = emoji;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم تعيين الإيموجي ${emoji} لقسم **${sectionName}**.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'حذف') {
            const sectionName = actionValue.trim();
            const index = settings.sections.findIndex(s => s.name === sectionName);
            if (index === -1) {
              sentReply = await message.reply(`⚠️ قسم "${sectionName}" غير موجود.`);
              deleteAfter(sentReply);
              return;
            }
            settings.sections.splice(index, 1);
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم حذف قسم **${sectionName}**.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'نص') {
            if (!actionValue) {
              sentReply = await message.reply('⚠️ أدخل النص الجديد.');
              deleteAfter(sentReply);
              return;
            }
            settings.text = actionValue;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم تغيير نص التذاكر.`);
            deleteAfter(sentReply);
            return;
          }

          if (action === 'صورة') {
            if (!actionValue) {
              sentReply = await message.reply('⚠️ أدخل رابط الصورة.');
              deleteAfter(sentReply);
              return;
            }
            settings.image = actionValue;
            await saveTicketSettings(guildId, settings);
            sentReply = await message.reply(`✅ تم تغيير صورة التذاكر: ${actionValue}`);
            deleteAfter(sentReply);
            return;
          }

          sentReply = await message.reply('⚠️ أمر غير معروف.');
          deleteAfter(sentReply);
          return;
        }

        sentReply = await message.reply('⚠️ خيار غير معروف. استخدم `!تعيين` لعرض القائمة.');
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ===== بانل الاقتراحات (مع دعم العنوان + النص + الصورة) =====
      // ============================================================
      if (cmd === 'بانل_اقتراح') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        // تحليل الوسائط: عنوان=... نص=... صورة=...
        const fullText = args.join(' ');
        let customTitle = null;
        let customText = null;
        let customImage = null;

        // استخراج عنوان
        const titleMatch = fullText.match(/عنوان\s*=\s*(.+?)(?=\s*(?:نص|صورة)\s*=|$)/);
        if (titleMatch) customTitle = titleMatch[1].trim();

        // استخراج نص
        const textMatch = fullText.match(/نص\s*=\s*(.+?)(?=\s*(?:عنوان|صورة)\s*=|$)/);
        if (textMatch) customText = textMatch[1].trim();

        // استخراج صورة
        const imageMatch = fullText.match(/صورة\s*=\s*(https?:\/\/\S+)/);
        if (imageMatch) customImage = imageMatch[1].trim();

        // تحديث الإعدادات إذا تم تمرير قيم
        const updateData = {};
        if (customTitle) updateData.suggestionsPanelTitle = customTitle;
        if (customText) updateData.suggestionsPanelText = customText;
        if (customImage) updateData.suggestionsPanelImage = customImage;
        if (Object.keys(updateData).length > 0) {
          await updateGuildConfig(guildId, updateData);
        }

        // إعادة تحميل الـ config بعد التحديث
        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildSuggestionPanel(updatedConfig);

        // إرسال البانل في القناة الحالية (أو قناة الاقتراحات إذا كانت معيّنة)
        let targetChannel = message.channel;
        if (updatedConfig.suggestionsChannel) {
          const suggChannel = message.guild.channels.cache.get(updatedConfig.suggestionsChannel);
          if (suggChannel) targetChannel = suggChannel;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          logToChannel(guildId, { 
            title: '💡 إنشاء لوحة اقتراحات', 
            color: THEME.ORANGE, 
            description: `**${message.author}** أنشأ لوحة الاقتراحات في ${targetChannel}` 
          });
          sentReply = await message.reply({ 
            embeds: [new EmbedBuilder()
              .setColor(THEME.ORANGE)
              .setDescription(`✅ تم إنشاء لوحة الاقتراحات في ${targetChannel}\n\n**ملاحظة:** ${updatedConfig.suggestionsChannel ? '' : '⚠️ لم يتم تعيين قناة اقتراحات! استخدم `!تعيين قناة_اقتراح #قناة`'}`)
            ] 
          });
          deleteAfter(sentReply);
        } catch (err) {
          console.error('❌ خطأ في إرسال بانل الاقتراحات:', err);
          sentReply = await message.reply(`❌ فشل إنشاء البانل: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      if (cmd === 'بانل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const settings = await getTicketSettings(guildId);
        const imageUrl = settings.image || 'https://i.imgur.com/GkKqN3G.png';
        const embed = new EmbedBuilder().setTitle('🎫 تذاكر دعم فني').setDescription(settings.text).setColor(THEME.ORANGE).setImage(imageUrl).setFooter({ text: 'سيتم إنشاء قناة خاصة بك.' });
        if (generalImage) embed.setThumbnail(generalImage);
        const options = settings.sections.map(s => {
          const opt = {
            label: s.name,
            value: s.name,
          };
          const parsedEmoji = parseEmoji(s.emoji);
          if (parsedEmoji) opt.emoji = parsedEmoji;
          else opt.emoji = '📌';
          return opt;
        });
        if (!options.length) {
          sentReply = await message.reply('⚠️ لا توجد أقسام مضافة.');
          deleteAfter(sentReply);
          return;
        }
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ticket_menu')
            .setPlaceholder('📌 اختر القسم...')
            .addOptions(options)
        );
        try {
          await message.channel.send({ embeds: [embed], components: [row] });
          logToChannel(guildId, { title: '🎫 إنشاء لوحة تذاكر', color: THEME.ORANGE, description: `**${message.author}** أنشأ لوحة تذاكر.` });
          sentReply = await message.reply('✅ تم إنشاء لوحة التذاكر.');
          deleteAfter(sentReply);
        } catch (err) {
          console.error('❌ خطأ في إنشاء لوحة التذاكر:', err);
          sentReply = await message.reply(`❌ فشل إنشاء اللوحة: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ===== أوامر عامة أخرى =====
      // ============================================================

      if (cmd === 'عرض_تذكرة') {
        const settings = await getTicketSettings(guildId);
        const embed = new EmbedBuilder().setTitle('📋 إعدادات التذاكر').setColor(THEME.ORANGE)
          .setDescription(`**النص:** ${settings.text}`)
          .addFields(
            { name: '📌 الأقسام', value: settings.sections.map((s, i) => `${i+1}. ${s.emoji || '📌'} **${s.name}** ${s.roleId ? `<@&${s.roleId}>` : '(بدون دور)'}`).join('\n') || 'لا يوجد أقسام', inline: false },
            { name: '🖼️ الصورة', value: settings.image ? `[رابط](${settings.image})` : 'لا توجد صورة', inline: true }
          );
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تقييمات' || cmd === 'عرض_التقييمات') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const allRatings = await TicketRating.find({ guildId, rating: { $exists: true, $ne: null } });
        const recentRatings = await TicketRating.find({ guildId })
          .sort({ createdAt: -1 })
          .limit(10);

        if (!allRatings.length && !recentRatings.length) {
          sentReply = await message.reply('📭 لا توجد تقييمات حتى الآن.');
          deleteAfter(sentReply);
          return;
        }

        const avg = allRatings.length
          ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(2)
          : '0';

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const r of allRatings) {
          if (r.rating >= 1 && r.rating <= 5) distribution[r.rating]++;
        }

        let desc = `**📊 متوسط التقييم:** ${avg}/5 ⭐\n`;
        desc += `**📈 إجمالي التقييمات:** ${allRatings.length}\n\n`;
        desc += `**توزيع التقييمات:**\n`;
        for (let i = 5; i >= 1; i--) {
          const count = distribution[i];
          const bar = '█'.repeat(Math.min(count, 20));
          desc += `${'⭐'.repeat(i)} (${count}) ${bar}\n`;
        }
        desc += `\n**آخر 10 تقييمات:**\n\n`;

        for (const r of recentRatings) {
          const stars = r.rating ? '⭐'.repeat(r.rating) : '—';
          const user = await client.users.fetch(r.userId).catch(() => null);
          const name = user ? user.username : `مستخدم ${r.userId}`;
          const date = r.createdAt.toLocaleDateString('ar-EG');
          desc += `**${name}** - ${stars}${r.rating ? ` (${r.rating}/5)` : ''}\n`;
          if (r.section) desc += `> 📌 القسم: ${r.section}\n`;
          if (r.comment) desc += `> 💬 ${r.comment}\n`;
          desc += `> 📅 ${date}\n\n`;
        }

        const embed = new EmbedBuilder()
          .setTitle('⭐ تقييمات التذاكر')
          .setColor(THEME.ORANGE)
          .setDescription(desc.slice(0, 4000))
          .setFooter({ text: `إجمالي: ${allRatings.length} تقييم` });

        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'اختبار_لوق') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!config.logChannel) {
          sentReply = await message.reply('⚠️ لم يتم تعيين قناة اللوق.');
          deleteAfter(sentReply);
          return;
        }
        const channel = message.guild.channels.cache.get(config.logChannel);
        if (!channel) {
          sentReply = await message.reply('❌ قناة اللوق غير موجودة.');
          deleteAfter(sentReply);
          return;
        }
        logToChannel(guildId, {
          title: '🧪 اختبار اللوق',
          color: THEME.ORANGE,
          description: `✅ اللوق يعمل بنجاح!\n**المنفذ:** ${message.author}`,
          footer: 'رسالة اختبار',
        });
        sentReply = await message.reply('✅ تم إرسال رسالة اختبار.');
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'مستوى') {
        const member = message.mentions.members.first() || message.member;
        const userData = await getUserData(guildId, member.id);
        const embed = new EmbedBuilder()
          .setTitle(`📊 مستوى ${member.user.username}`)
          .setColor(THEME.ORANGE)
          .addFields(
            { name: 'المستوى', value: `${userData.level}`, inline: true },
            { name: 'XP', value: `${userData.xp}/${(userData.level + 1) * 100}`, inline: true },
            { name: 'الرسائل', value: `${userData.messages}`, inline: true }
          );
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'ترتيب') {
        const top = await User.find({ guildId }).sort({ level: -1, xp: -1 }).limit(10);
        if (!top.length) {
          sentReply = await message.reply('📭 لا توجد بيانات مستويات.');
          deleteAfter(sentReply);
          return;
        }
        let desc = '';
        let rank = 1;
        for (const entry of top) {
          const member = message.guild.members.cache.get(entry.userId);
          const name = member ? member.user.username : `مستخدم ${entry.userId}`;
          desc += `#${rank} ${name} - المستوى ${entry.level} (XP: ${entry.xp})\n`;
          rank++;
        }
        const embed = new EmbedBuilder().setTitle('🏆 ترتيب المستويات').setColor(THEME.ORANGE).setDescription(desc).setFooter({ text: 'أعلى 10 أعضاء' });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'معلومات') {
        const member = message.mentions.members.first() || message.member;
        const embed = new EmbedBuilder().setTitle(`ℹ️ معلومات ${member.user.username}`).setColor(THEME.ORANGE)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: '🆔 المعرف', value: member.id, inline: true },
            { name: '📅 تاريخ الانضمام', value: member.joinedAt?.toDateString() || 'غير معروف', inline: true },
            { name: '📅 تاريخ الحساب', value: member.user.createdAt.toDateString(), inline: true },
            { name: '🎭 أعلى رتبة', value: member.roles.highest.toString(), inline: true },
            { name: '🔊 في روم صوتي', value: member.voice.channel ? member.voice.channel.name : 'لا', inline: true }
          );
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'سيرفر') {
        const embed = new EmbedBuilder().setTitle(message.guild.name).setColor(THEME.ORANGE)
          .addFields(
            { name: '👥 الأعضاء', value: `${message.guild.memberCount}`, inline: true },
            { name: '💬 القنوات', value: `${message.guild.channels.cache.size}`, inline: true },
            { name: '👑 المالك', value: `<@${message.guild.ownerId}>`, inline: true }
          )
          .setThumbnail(message.guild.iconURL());
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'بينق') {
        const embed = new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`🏓 البينق: ${client.ws.ping}ms`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تغيير_اسم') {
        const last = await getNameCooldown(userId);
        if (last instanceof Date && Date.now() - last.getTime() < 5 * 60 * 60 * 1000) {
          const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last.getTime())) / (60 * 60 * 1000));
          sentReply = await message.reply(`⏳ يمكنك تغيير اسمك بعد ${remaining} ساعة.`);
          deleteAfter(sentReply);
          return;
        }
        const embed = new EmbedBuilder().setTitle('✏️ تغيير الاسم').setDescription('اضغط على الزر أدناه لتغيير اسمك.').setColor(THEME.ORANGE).setFooter({ text: 'يمكنك تغيير اسمك مرة كل 5 ساعات.' });
        if (generalImage) embed.setImage(generalImage);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('open_name_modal').setLabel('✏️ تغيير الاسم').setStyle(ButtonStyle.Primary));
        sentReply = await message.channel.send({ embeds: [embed], components: [row] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'رد_تلقائي') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args[0];
        const reply = args.slice(1).join(' ');
        if (!keyword || !reply) {
          sentReply = await message.reply('⚠️ الصيغة: `!رد_تلقائي [الكلمة] [الرد]`');
          deleteAfter(sentReply);
          return;
        }
        const added = await addAutoReply(guildId, keyword, reply);
        const embed = new EmbedBuilder()
          .setTitle(added ? '✅ تم إضافة رد تلقائي' : '🔄 تم تحديث رد تلقائي')
          .setColor(THEME.ORANGE)
          .setDescription(`**الكلمة:** ${keyword}\n**الرد:** ${reply}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'رد_تلقائي_صورة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args[0];
        const image = args[args.length - 1];
        const reply = args.slice(1, -1).join(' ');
        if (!keyword || !reply || !image) {
          sentReply = await message.reply('⚠️ الصيغة: `!رد_تلقائي_صورة [الكلمة] [الرد] [رابط_الصورة]`');
          deleteAfter(sentReply);
          return;
        }
        if (!image.match(/^https?:\/\/.+/)) {
          sentReply = await message.reply('⚠️ الرابط غير صالح.');
          deleteAfter(sentReply);
          return;
        }
        const added = await addAutoReply(guildId, keyword, reply, image);
        const embed = new EmbedBuilder()
          .setTitle(added ? '✅ تم إضافة رد تلقائي مع صورة' : '🔄 تم تحديث رد تلقائي مع صورة')
          .setColor(THEME.ORANGE)
          .setDescription(`**الكلمة:** ${keyword}\n**الرد:** ${reply}`)
          .setImage(image);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'حذف_رد_تلقائي') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const keyword = args.join(' ');
        if (!keyword) {
          sentReply = await message.reply('⚠️ اكتب الكلمة المفتاحية.');
          deleteAfter(sentReply);
          return;
        }
        const removed = await removeAutoReply(guildId, keyword);
        if (!removed) {
          sentReply = await message.reply(`⚠️ لا يوجد رد تلقائي للكلمة "${keyword}".`);
          deleteAfter(sentReply);
          return;
        }
        const embed = new EmbedBuilder()
          .setTitle('🗑️ تم حذف الرد التلقائي')
          .setColor(THEME.ORANGE)
          .setDescription(`تم حذف الرد التلقائي للكلمة: **${keyword}**`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'عرض_الردود') {
        const replies = await getAutoReplies(guildId);
        if (!replies.length) {
          sentReply = await message.reply('📭 لا توجد ردود تلقائية.');
          deleteAfter(sentReply);
          return;
        }
        const list = replies.map((r, i) => `${i+1}. **${r.keyword}** → ${r.reply}${r.image ? ' (🖼️)' : ''}`).join('\n');
        const embed = new EmbedBuilder()
          .setTitle('💬 قائمة الردود التلقائية')
          .setColor(THEME.ORANGE)
          .setDescription(list)
          .setFooter({ text: `عدد: ${replies.length}` });
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'قول') {
        const text = args.join(' ');
        if (!text) {
          sentReply = await message.reply('⚠️ اكتب النص.');
          deleteAfter(sentReply);
          return;
        }
        await message.channel.send(text);
        return;
      }

      if (cmd === 'ايمبد') {
        const fullText = args.join(' ');
        if (!fullText) {
          sentReply = await message.reply('⚠️ الصيغة: `!ايمبد [العنوان] ، [الوصف]`');
          deleteAfter(sentReply);
          return;
        }
        const parts = fullText.split(/[،,]\s*/).map(s => s.trim());
        let title = 'بدون عنوان', description = fullText;
        if (parts.length >= 2) { title = parts[0]; description = parts.slice(1).join(' ، '); }
        const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(THEME.ORANGE).setTimestamp();
        const imageMatch = description.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/i);
        if (imageMatch) { embed.setImage(imageMatch[1]); embed.setDescription(description.replace(imageMatch[1], '').trim() || 'بدون وصف'); }
        if (generalImage) embed.setThumbnail(generalImage);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      if (cmd === 'اعلان') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        let mentionType = 'everyone';
        let text = args.join(' ');
        if (args[0]?.toLowerCase() === 'here') { mentionType = 'here'; text = args.slice(1).join(' '); }
        if (!text) {
          sentReply = await message.reply('⚠️ اكتب نص الإعلان.');
          deleteAfter(sentReply);
          return;
        }
        const embed = new EmbedBuilder().setTitle('📢 إعلان').setDescription(text).setColor(THEME.ORANGE).setTimestamp().setFooter({ text: `بواسطة ${message.author.tag}` });
        if (generalImage) embed.setImage(generalImage);
        await message.channel.send({ content: mentionType === 'everyone' ? '@everyone' : '@here', embeds: [embed] });
        return;
      }

      if (cmd === 'اعطاء_رتبة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        const role = message.mentions.roles.first();
        if (!role) {
          sentReply = await message.reply('⚠️ منشن الرتبة.');
          deleteAfter(sentReply);
          return;
        }
        if (role.position >= message.member.roles.highest.position && !(OWNER_ID && message.author.id === OWNER_ID)) {
          sentReply = await message.reply('❌ لا يمكنك إعطاء رتبة أعلى من رتبتك.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
          deleteAfter(sentReply);
          return;
        }
        await member.roles.add(role);
        const embed = new EmbedBuilder().setTitle('✅ تم إعطاء الرتبة').setColor(THEME.ORANGE).setDescription(`تم إعطاء ${member} رتبة ${role}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🎭 إعطاء رتبة', color: THEME.ORANGE, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**الرتبة:** ${role.name}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'سحب_رتبة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        const role = message.mentions.roles.first();
        if (!role) {
          sentReply = await message.reply('⚠️ منشن الرتبة.');
          deleteAfter(sentReply);
          return;
        }
        if (role.position >= message.member.roles.highest.position && !(OWNER_ID && message.author.id === OWNER_ID)) {
          sentReply = await message.reply('❌ لا يمكنك سحب رتبة أعلى من رتبتك.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
          deleteAfter(sentReply);
          return;
        }
        await member.roles.remove(role);
        const embed = new EmbedBuilder().setTitle('✅ تم سحب الرتبة').setColor(THEME.ORANGE).setDescription(`تم سحب رتبة ${role} من ${member}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🎭 سحب رتبة', color: THEME.BLACK, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**الرتبة:** ${role.name}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'عرض_رتب') {
        const member = message.mentions.members.first() || message.member;
        const roles = member.roles.cache.filter(r => r.id !== message.guild.id).map(r => r.toString()).join(' ') || 'لا يوجد رتب';
        const embed = new EmbedBuilder().setTitle(`🎭 رتب ${member.user.username}`).setColor(THEME.ORANGE).setDescription(roles);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'انشاء_قناة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.');
          deleteAfter(sentReply);
          return;
        }
        const name = args.join(' ');
        if (!name) {
          sentReply = await message.reply('⚠️ أدخل اسم القناة.');
          deleteAfter(sentReply);
          return;
        }
        const safeName = sanitizeChannelName(name);
        const channel = await message.guild.channels.create({ name: safeName, type: ChannelType.GuildText });
        const embed = new EmbedBuilder().setTitle('✅ تم إنشاء القناة').setColor(THEME.ORANGE).setDescription(`تم إنشاء ${channel}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تثبيت') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const msgId = args[0];
        if (!msgId) {
          sentReply = await message.reply('⚠️ أدخل معرف الرسالة.');
          deleteAfter(sentReply);
          return;
        }
        try {
          const msg = await message.channel.messages.fetch(msgId);
          await msg.pin();
          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('📌 تم التثبيت').setColor(THEME.ORANGE).setDescription(`[رابط](${msg.url})`)] });
          deleteAfter(sentReply);
        } catch (e) {
          sentReply = await message.reply('❌ تأكد من المعرف.');
          deleteAfter(sentReply);
        }
        return;
      }

      if (cmd === 'الغاء_تثبيت') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const msgId = args[0];
        if (!msgId) {
          sentReply = await message.reply('⚠️ أدخل معرف الرسالة.');
          deleteAfter(sentReply);
          return;
        }
        try {
          const msg = await message.channel.messages.fetch(msgId);
          await msg.unpin();
          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('📌 تم إلغاء التثبيت').setColor(THEME.ORANGE).setDescription(`[رابط](${msg.url})`)] });
          deleteAfter(sentReply);
        } catch (e) {
          sentReply = await message.reply('❌ تأكد من المعرف.');
          deleteAfter(sentReply);
        }
        return;
      }

      // ============================================================
      // ===== أوامر الإشراف =====
      // ============================================================

      if (cmd === 'حظر') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers)) {
          sentReply = await message.reply('❌ لا أملك صلاحية الحظر.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        if (!member.bannable) {
          sentReply = await message.reply('❌ لا أستطيع حظر هذا العضو.');
          deleteAfter(sentReply);
          return;
        }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        await member.ban({ reason });
        const embed = new EmbedBuilder().setTitle('✅ تم الحظر').setColor(THEME.ORANGE).setDescription(`${member.user.tag} بسبب: ${reason}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🔨 حظر', color: THEME.BLACK, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'طرد') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
          sentReply = await message.reply('❌ لا أملك صلاحية الطرد.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        if (!member.kickable) {
          sentReply = await message.reply('❌ لا أستطيع طرد هذا العضو.');
          deleteAfter(sentReply);
          return;
        }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        await member.kick(reason);
        const embed = new EmbedBuilder().setTitle('✅ تم الطرد').setColor(THEME.ORANGE).setDescription(`${member.user.tag} بسبب: ${reason}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🚪 طرد', color: THEME.BLACK, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'كتم') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرتب.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        let muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
        if (!muteRole) {
          muteRole = await message.guild.roles.create({ name: 'Muted', permissions: [] });
          for (const [, ch] of message.guild.channels.cache) {
            await ch.permissionOverwrites.create(muteRole, { SendMessages: false }).catch(() => {});
          }
        }
        await member.roles.add(muteRole, reason);
        const embed = new EmbedBuilder().setTitle('🔇 تم الكتم').setColor(THEME.ORANGE).setDescription(`${member.user.tag} بسبب: ${reason}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🔇 كتم', color: THEME.BLACK, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'فك_كتم') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        const muteRole = message.guild.roles.cache.find(r => r.name === 'Muted');
        if (!muteRole) {
          sentReply = await message.reply('⚠️ لا يوجد دور Muted.');
          deleteAfter(sentReply);
          return;
        }
        await member.roles.remove(muteRole);
        const embed = new EmbedBuilder().setTitle('🔊 تم فك الكتم').setColor(THEME.ORANGE).setDescription(`${member.user.tag} تم فك الكتم عنه.`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '🔊 فك كتم', color: THEME.ORANGE, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}` });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تحذير') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        const reason = args.slice(1).join(' ') || 'لا يوجد سبب';
        const count = await addWarn(guildId, member.id, reason, message.author.id);
        const embed = new EmbedBuilder().setTitle('⚠️ تحذير').setColor(THEME.WARN).setDescription(`${member.user.tag} بسبب: ${reason}\nإجمالي: ${count}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        logToChannel(guildId, { title: '⚠️ تحذير', color: THEME.WARN, description: `**المنفذ:** ${message.author}\n**المستهدف:** ${member.user.tag}\n**السبب:** ${reason}\n**العدد:** ${count}` });
        try {
          const dmEmbed = new EmbedBuilder().setTitle('⚠️ تم تحذيرك').setColor(THEME.WARN)
            .setDescription(`**السيرفر:** ${message.guild.name}\n**السبب:** ${reason}\n**إجمالي تحذيراتك:** ${count}`)
            .setTimestamp().setFooter({ text: `بواسطة ${message.author.tag}` });
          await member.send({ embeds: [dmEmbed] });
        } catch (e) {}
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'ابطال_تحذيرات') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        const member = message.mentions.members.first();
        if (!member) {
          sentReply = await message.reply('⚠️ منشن العضو.');
          deleteAfter(sentReply);
          return;
        }
        await clearWarns(guildId, member.id);
        const embed = new EmbedBuilder().setTitle('✅ تم إبطال التحذيرات').setColor(THEME.ORANGE).setDescription(`تم إلغاء كل تحذيرات ${member.user.tag}.`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'مسح') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة الرسائل.');
          deleteAfter(sentReply);
          return;
        }
        let amount = parseInt(args[0]) || 5;
        if (amount > 100) amount = 100;
        if (amount < 1) amount = 1;
        const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
        const count = deleted ? deleted.size : 0;
        sentReply = await message.channel.send(`🗑️ تم مسح ${count} رسالة.`);
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'قفل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.');
          deleteAfter(sentReply);
          return;
        }
        await message.channel.permissionOverwrites.create(message.guild.id, { SendMessages: false });
        const embed = new EmbedBuilder().setTitle('🔒 تم القفل').setColor(THEME.BLACK).setDescription(`تم قفل ${message.channel}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'فتح') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.');
          deleteAfter(sentReply);
          return;
        }
        await message.channel.permissionOverwrites.delete(message.guild.id);
        const embed = new EmbedBuilder().setTitle('🔓 تم الفتح').setColor(THEME.ORANGE).setDescription(`تم فتح ${message.channel}`);
        if (generalImage) embed.setImage(generalImage);
        sentReply = await message.channel.send({ embeds: [embed] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'نقل_كل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
          sentReply = await message.reply('❌ لا أملك صلاحية نقل الأعضاء.');
          deleteAfter(sentReply);
          return;
        }
        if (message.mentions.channels.size < 2) {
          sentReply = await message.reply('⚠️ منشن رومين: `!نقل_كل #من #إلى`');
          deleteAfter(sentReply);
          return;
        }
        const from = message.mentions.channels.first();
        const to = message.mentions.channels.last();
        if (from.type !== ChannelType.GuildVoice || to.type !== ChannelType.GuildVoice) {
          sentReply = await message.reply('⚠️ يجب أن تكون القناتان صوتيتين.');
          deleteAfter(sentReply);
          return;
        }
        const members = from.members.filter(m => !m.user.bot);
        let count = 0;
        for (const m of members.values()) {
          await m.voice.setChannel(to).catch(() => {});
          count++;
        }
        sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🔊 تم النقل').setColor(THEME.ORANGE).setDescription(`تم نقل ${count} عضو`)] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'حذف_قناة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.');
          deleteAfter(sentReply);
          return;
        }
        const channel = message.mentions.channels.first();
        if (!channel) {
          sentReply = await message.reply('⚠️ منشن القناة.');
          deleteAfter(sentReply);
          return;
        }
        const channelName = channel.name;
        await channel.delete();
        sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('🗑️ تم الحذف').setColor(THEME.ORANGE).setDescription(`تم حذف ${channelName}`)] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'تغيير_اسم_قناة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
          sentReply = await message.reply('❌ لا أملك صلاحية إدارة القنوات.');
          deleteAfter(sentReply);
          return;
        }
        const channel = message.mentions.channels.first();
        if (!channel) {
          sentReply = await message.reply('⚠️ منشن القناة.');
          deleteAfter(sentReply);
          return;
        }
        const newName = args.slice(1).join(' ');
        if (!newName) {
          sentReply = await message.reply('⚠️ أدخل الاسم الجديد.');
          deleteAfter(sentReply);
          return;
        }
        const safeName = sanitizeChannelName(newName);
        await channel.setName(safeName);
        sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setTitle('✏️ تم التغيير').setColor(THEME.ORANGE).setDescription(`تم تغيير الاسم إلى ${safeName}`)] });
        deleteAfter(sentReply);
        return;
      }

      if (cmd === 'إيقاف') {
        if (!OWNER_ID || message.author.id !== OWNER_ID) {
          sentReply = await message.reply('❌ هذا الأمر للمالك فقط.');
          deleteAfter(sentReply);
          return;
        }
        await message.reply('🛑 جاري الإيقاف...');
        try {
          await mongoose.connection.close();
          client.destroy();
        } catch (e) {}
        process.exit(0);
      }

    } catch (error) {
      console.error('❌ خطأ في تنفيذ الأمر:', error);
      try {
        sentReply = await message.reply('❌ حدث خطأ أثناء تنفيذ الأمر.');
        deleteAfter(sentReply);
      } catch (e) {}
    }
    return;
  }

  // ============================================================
  // ===== الجزء 2: XP، الاقتصاد، الأوتو لاين، الردود التلقائية =====
  // ============================================================

  try {
    const eco = await getEconomy(guildId, userId);
    eco.messageCount += 1;
    if (eco.messageCount >= 30) {
      eco.messageCount = 0;
      eco.og += 15;
      await eco.save();
      try {
        const member = await message.guild.members.fetch(userId);
        const dmEmbed = new EmbedBuilder()
          .setTitle('💰 مكافأة OG')
          .setDescription(`حصلت على **15 OG** مقابل 30 رسالة في **${message.guild.name}**!\nرصيدك الحالي: **${eco.og} OG**`)
          .setColor(THEME.ORANGE);
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (e) {}
    } else {
      await eco.save();
    }

    const isLevelNotifyChannel = config.levelChannelId && message.channel.id === config.levelChannelId;
    if (!isLevelNotifyChannel) {
      const userData = await getUserData(guildId, userId);
      userData.messages += 1;
      const gain = Math.floor(Math.random() * 15) + 5;
      userData.xp += gain;
      const requiredXP = (userData.level + 1) * 100;

      if (userData.xp >= requiredXP) {
        userData.level += 1;
        userData.xp = 0;
        await userData.save();

        const levelChannelId = config.levelChannelId || message.channel.id;
        const levelChannel = message.guild.channels.cache.get(levelChannelId);
        if (levelChannel) {
          const embed = new EmbedBuilder()
            .setTitle('🎉 مستوى جديد!')
            .setDescription(`${message.author} وصل إلى المستوى **${userData.level}**!`)
            .setColor(THEME.ORANGE)
            .setTimestamp();
          const generalImg = getGeneralImage(message.guild, config);
          if (generalImg) embed.setThumbnail(generalImg);
          await levelChannel.send({ embeds: [embed] }).catch(() => {});
        }

        const levelRole = await LevelRole.findOne({ guildId, level: userData.level });
        if (levelRole) {
          const role = message.guild.roles.cache.get(levelRole.roleId);
          if (role && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            const member = await message.guild.members.fetch(userId).catch(() => null);
            if (member) await member.roles.add(role).catch(() => {});
          }
        }
      } else {
        await userData.save();
      }
    }

    const auto = await AutoLine.findOne({ guildId, channelId: message.channel.id });
    if (auto && auto.enabled && (auto.text || auto.image)) {
      const channel = client.channels.cache.get(message.channel.id);
      if (channel) {
        try {
          if (auto.text && auto.image) {
            const embed = new EmbedBuilder().setDescription(auto.text).setColor(THEME.ORANGE).setImage(auto.image).setTimestamp();
            await channel.send({ embeds: [embed] });
          } else if (auto.image) {
            const embed = new EmbedBuilder().setColor(THEME.ORANGE).setImage(auto.image).setTimestamp();
            await channel.send({ embeds: [embed] });
          } else if (auto.text) {
            await channel.send(auto.text);
          }
        } catch (e) {}
      }
      return;
    }

    const autoReply = await findAutoReply(guildId, message.content);
    if (autoReply) {
      try {
        if (autoReply.image) {
          const embed = new EmbedBuilder().setDescription(autoReply.reply).setColor(THEME.ORANGE).setImage(autoReply.image).setTimestamp();
          await message.reply({ embeds: [embed] });
        } else {
          await message.reply(autoReply.reply);
        }
      } catch (e) {
        await message.channel.send(autoReply.reply).catch(() => {});
      }
    }
  } catch (error) {
    console.error('❌ خطأ في معالجة الرسالة:', error);
  }
});

// ============================================================
// ========== معالج التفاعلات ==========
// ============================================================

client.on('interactionCreate', async (interaction) => {
  try {
    // ===== مودال الاقتراح =====
    if (interaction.isButton() && interaction.customId === 'suggest_modal') {
      const modal = new ModalBuilder()
        .setCustomId('suggest_modal_submit')
        .setTitle('📝 تقديم اقتراح')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('suggest_title')
              .setLabel('عنوان الاقتراح')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(3)
              .setMaxLength(100)
              .setPlaceholder('اكتب عنواناً مختصراً لاقتراحك...')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('suggest_desc')
              .setLabel('تفاصيل الاقتراح')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMinLength(10)
              .setMaxLength(1000)
              .setPlaceholder('اشرح فكرتك بالتفصيل...')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'suggest_modal_submit') {
      const title = interaction.fields.getTextInputValue('suggest_title');
      const desc = interaction.fields.getTextInputValue('suggest_desc');
      const guild = interaction.guild;
      const config = await getGuildConfig(guild.id);

      if (!config.suggestionsChannel) {
        return interaction.reply({
          content: '⚠️ لم يتم تعيين قناة للاقتراحات. تواصل مع الإدارة.',
          ephemeral: true
        });
      }

      const channel = guild.channels.cache.get(config.suggestionsChannel);
      if (!channel) {
        return interaction.reply({ content: '❌ قناة الاقتراحات غير موجودة.', ephemeral: true });
      }

      const color = parseInt(config.suggestionsColor?.replace('#', '') || 'ff6b00', 16);
      const embed = new EmbedBuilder()
        .setTitle(`💡 ${title}`)
        .setDescription(desc)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: `بواسطة ${interaction.user.tag} | ${interaction.user.id}` })
        .setThumbnail(interaction.user.displayAvatarURL());

      if (config.suggestionsImage) embed.setImage(config.suggestionsImage);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('suggest_accept').setLabel('✅ قبول').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('suggest_reject').setLabel('❌ رفض').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('suggest_comment').setLabel('💬 تعليق').setStyle(ButtonStyle.Secondary)
      );

      await channel.send({ content: `📩 اقتراح جديد من ${interaction.user}`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ تم إرسال اقتراحك بنجاح إلى ${channel}!`, ephemeral: true });

      logToChannel(guild.id, {
        title: '💡 اقتراح جديد',
        color: THEME.ORANGE,
        description: `**المستخدم:** ${interaction.user.tag}\n**العنوان:** ${title}`,
        footer: 'الاقتراحات',
      });
    }

    // ===== أزرار الاقتراحات =====
    if (interaction.isButton() && ['suggest_accept', 'suggest_reject', 'suggest_comment'].includes(interaction.customId)) {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ هذا الزر للمشرفين فقط.', ephemeral: true });
      }

      const msg = interaction.message;
      const embed = msg.embeds[0];
      if (!embed) return interaction.reply({ content: '❌ لا يوجد اقتراح.', ephemeral: true });

      if (interaction.customId === 'suggest_comment') {
        const modal = new ModalBuilder()
          .setCustomId('suggest_comment_modal')
          .setTitle('💬 تعليق على الاقتراح')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('comment_text')
                .setLabel('التعليق')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(500)
            )
          );
        return await interaction.showModal(modal);
      }

      const newEmbed = EmbedBuilder.from(embed);
      let action = '', footer = '';
      if (interaction.customId === 'suggest_accept') {
        action = '✅ تم قبول الاقتراح';
        footer = `قبل بواسطة ${interaction.user.tag}`;
      } else {
        action = '❌ تم رفض الاقتراح';
        footer = `رفض بواسطة ${interaction.user.tag}`;
      }

      newEmbed.setFooter({ text: `${footer} | ${new Date().toISOString()}` });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('suggest_comment').setLabel('💬 تعليق').setStyle(ButtonStyle.Secondary)
      );
      await interaction.update({ embeds: [newEmbed], components: [row] });
      await interaction.followUp({ content: `📌 ${action} بواسطة ${interaction.user}`, ephemeral: true });
    }

    // ===== رتب الإشعارات (القديمة) =====
    if (interaction.isButton() && ['role_game', 'role_event', 'role_ajr'].includes(interaction.customId)) {
      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.reply({ content: '❌ لا أملك صلاحية إدارة الرتب.', ephemeral: true });
      }
      const roleMap = { role_game: 'Game Notice', role_event: 'Event Notice', role_ajr: 'Ajr Notice' };
      const roleName = roleMap[interaction.customId];
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (!role) return interaction.reply({ content: `❌ رتبة "${roleName}" غير موجودة.`, ephemeral: true });
      const member = interaction.member;
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        await interaction.reply({ content: `✅ تم إزالة رتبة ${roleName}.`, ephemeral: true });
      } else {
        await member.roles.add(role);
        await interaction.reply({ content: `✅ تم منحك رتبة ${roleName}.`, ephemeral: true });
      }
    }

    // ============================================================
    // ===== القائمة المنسدلة للرتب الذاتية (Toggle) + إعادة تعيين =====
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'self_roles_toggle') {
      await interaction.deferReply({ ephemeral: true });

      const selectedValue = interaction.values[0];

      // ✅ معالج خيار "إعادة تعيين"
      if (selectedValue === 'SELF_ROLES_RESET') {
        try {
          const config = await getGuildConfig(interaction.guild.id);
          const panel = await buildSelfRolesPanel(interaction.guild.id, interaction.guild, config);
          if (panel) {
            await interaction.message.delete().catch(() => {});
            await interaction.channel.send({ embeds: [panel.embed], components: [panel.row] });
            return interaction.editReply({
              embeds: [new EmbedBuilder()
                .setTitle('🔄 تم إعادة التعيين')
                .setColor(THEME.ORANGE)
                .setDescription('تم إعادة إرسال القائمة بشكل نظيف.')
                .setTimestamp()
              ]
            });
          } else {
            return interaction.editReply({
              embeds: [new EmbedBuilder()
                .setColor(THEME.BLACK)
                .setDescription('⚠️ لا توجد رتب مسجلة حالياً.')
              ]
            });
          }
        } catch (err) {
          console.error('❌ خطأ في إعادة تعيين القائمة:', err);
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor(THEME.BLACK)
              .setDescription(`❌ فشل إعادة التعيين: ${err.message}`)
            ]
          });
        }
      }

      if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا أملك صلاحية إدارة الرتب.')]
        });
      }

      const role = interaction.guild.roles.cache.get(selectedValue);
      if (!role) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ الرتبة غير موجودة.')]
        });
      }

      const selfRole = await SelfRole.findOne({ guildId: interaction.guild.id, roleId: selectedValue });
      if (!selfRole) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ هذه الرتبة غير مسجلة في النظام.')]
        });
      }

      const member = interaction.member;

      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ رتبة **${selfRole.label}** أعلى من رتبتي، لا أستطيع إدارتها.`)]
        });
      }

      try {
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'إزالة ذاتية للرتب');
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('🗑️ تم إزالة الرتبة')
              .setColor(THEME.ORANGE)
              .setDescription(`${selfRole.emoji} **${selfRole.label}**`)
              .setTimestamp()
            ]
          });
        } else {
          await member.roles.add(role, 'اختيار ذاتي للرتب');
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('✅ تم إضافة الرتبة')
              .setColor(THEME.ORANGE)
              .setDescription(`${selfRole.emoji} **${selfRole.label}**`)
              .setTimestamp()
            ]
          });
        }
      } catch (err) {
        console.error('❌ خطأ في تبديل الرتبة:', err);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ حدث خطأ: ${err.message}`)]
        });
      }
    }

    // ===== زر تغيير الاسم =====
    if (interaction.isButton() && interaction.customId === 'open_name_modal') {
      const userId = interaction.user.id;
      const last = await getNameCooldown(userId);
      if (last instanceof Date && Date.now() - last.getTime() < 5 * 60 * 60 * 1000) {
        const remaining = Math.ceil((5 * 60 * 60 * 1000 - (Date.now() - last.getTime())) / (60 * 60 * 1000));
        return interaction.reply({ content: `⏳ يمكنك تغيير اسمك بعد ${remaining} ساعة.`, ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId('name_change_modal').setTitle('تغيير الاسم')
        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(32)));
      return await interaction.showModal(modal);
    }

    // ============================================================
    // ===== زر إغلاق التذكرة + إرسال طلب التقييم =====
    // ============================================================
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
      const channel = interaction.channel;
      if (!channel.name.startsWith('تذكرة-')) {
        return interaction.reply({ content: '⚠️ هذه ليست قناة تذكرة.', ephemeral: true });
      }

      const config = await getGuildConfig(interaction.guild.id);

      let ticketOwnerId = null;
      let createdDate = new Date();
      let messageCount = 0;
      try {
        const allMsgs = await channel.messages.fetch({ limit: 100 });
        const firstMsg = allMsgs.last();
        if (firstMsg && firstMsg.mentions.users.first()) {
          ticketOwnerId = firstMsg.mentions.users.first().id;
        }
        if (firstMsg) createdDate = firstMsg.createdAt;
        messageCount = allMsgs.size;
      } catch (e) {}

      const sectionName = channel.name.replace('تذكرة-', '').split('-')[0] || 'غير معروف';

      const summaryEmbed = new EmbedBuilder()
        .setTitle('📋 ملخص التذكرة المغلقة')
        .setColor(THEME.ORANGE)
        .addFields(
          { name: '📌 القسم', value: sectionName, inline: true },
          { name: '👤 صاحب التذكرة', value: ticketOwnerId ? `<@${ticketOwnerId}>` : 'غير معروف', inline: true },
          { name: '🆔 معرف القناة', value: channel.id, inline: true },
          { name: '📅 تاريخ الإنشاء', value: createdDate.toLocaleString('ar-EG'), inline: true },
          { name: '💬 عدد الرسائل', value: `${messageCount}`, inline: true },
          { name: '🔒 أغلق بواسطة', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'تم إغلاق التذكرة' });

      if (ticketOwnerId && config.ticketRatingEnabled !== false) {
        try {
          await TicketRating.findOneAndUpdate(
            { guildId: interaction.guild.id, ticketId: channel.id },
            {
              guildId: interaction.guild.id,
              userId: ticketOwnerId,
              closedBy: interaction.user.id,
              section: sectionName,
              ticketId: channel.id,
            },
            { upsert: true, new: true }
          );
        } catch (e) {
          console.error('❌ خطأ في إنشاء سجل التقييم:', e);
        }
      }

      if (ticketOwnerId && config.ticketRatingEnabled !== false) {
        try {
          const owner = await interaction.guild.members.fetch(ticketOwnerId);

          await owner.send({ embeds: [summaryEmbed] }).catch(() => {});

          const ratingEmbed = new EmbedBuilder()
            .setTitle('⭐ قيّم تجربتك مع الدعم')
            .setDescription(
              `مرحباً ${owner}!\n\n` +
              `تم إغلاق تذكرتك في قسم **${sectionName}**.\n` +
              `نرجو منك تقييم جودة الخدمة التي حصلت عليها من خلال الأزرار أدناه.\n\n` +
              `**⭐ = سيء جداً**\n` +
              `**⭐⭐⭐⭐⭐ = ممتاز**\n\n` +
              `_ملاحظة: تقييمك يساعدنا على تحسين جودة الخدمة._`
            )
            .setColor(THEME.ORANGE)
            .setThumbnail(interaction.guild.iconURL() || null)
            .setTimestamp()
            .setFooter({ text: `تذكرة ${sectionName} • ${interaction.guild.name}` });

          const ratingRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`rate_ticket_1_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('⭐')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`rate_ticket_2_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('⭐⭐')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`rate_ticket_3_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('⭐⭐⭐')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`rate_ticket_4_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('⭐⭐⭐⭐')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`rate_ticket_5_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('⭐⭐⭐⭐⭐')
              .setStyle(ButtonStyle.Success)
          );

          const commentRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`rate_ticket_comment_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`)
              .setLabel('💬 إضافة تعليق (اختياري)')
              .setStyle(ButtonStyle.Primary)
          );

          await owner.send({
            embeds: [ratingEmbed],
            components: [ratingRow, commentRow]
          }).catch(() => {});
        } catch (e) {
          console.error('❌ فشل إرسال DM لصاحب التذكرة:', e.message);
        }
      }

      logToChannel(interaction.guild.id, {
        title: '🔒 إغلاق تذكرة',
        color: THEME.BLACK,
        description: `**المستخدم:** ${interaction.user}\n**القناة:** ${channel.name}\n**صاحب التذكرة:** ${ticketOwnerId ? `<@${ticketOwnerId}>` : 'غير معروف'}`,
        footer: 'نظام التذاكر'
      });

      await interaction.reply({ content: '🔒 جاري إغلاق التذكرة...', ephemeral: true });

      setTimeout(async () => {
        await channel.delete().catch(() => {});
      }, 3000);
    }

    // ============================================================
    // ===== معالج أزرار التقييم (✅ يرسل لروم التقييمات الآن) =====
    // ============================================================
    if (interaction.isButton() && interaction.customId.startsWith('rate_ticket_')) {
      const parts = interaction.customId.split('_');
      const isComment = parts[2] === 'comment';
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];
      const rating = isComment ? null : parseInt(parts[2]);

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: '❌ هذا التقييم ليس لك، لا يمكنك التفاعل معه.',
          ephemeral: true
        });
      }

      if (isComment) {
        const modal = new ModalBuilder()
          .setCustomId(`ticket_comment_modal_${ownerId}_${channelId}_${guildId}`)
          .setTitle('💬 إضافة تعليق على التذكرة')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('ticket_comment_text')
                .setLabel('تعليقك')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(500)
                .setPlaceholder('اكتب تعليقك هنا...')
            )
          );
        return await interaction.showModal(modal);
      }

      if (rating >= 1 && rating <= 5) {
        await TicketRating.findOneAndUpdate(
          { guildId, ticketId: channelId },
          {
            guildId,
            userId: ownerId,
            ticketId: channelId,
            rating,
          },
          { upsert: true, new: true }
        );

        // ✅ إرسال التقييم لروم التقييمات إذا كانت معيّنة
        try {
          const config = await getGuildConfig(guildId);
          if (config.ticketRatingChannel) {
            const ratingChannel = interaction.client.channels.cache.get(config.ticketRatingChannel);
            if (ratingChannel) {
              const ratingData = await TicketRating.findOne({ guildId, ticketId: channelId });
              const stars = '⭐'.repeat(rating);
              const member = await interaction.guild.members.fetch(ownerId).catch(() => null);
              const closedByMember = ratingData?.closedBy ? await interaction.guild.members.fetch(ratingData.closedBy).catch(() => null) : null;

              const ratingLogEmbed = new EmbedBuilder()
                .setTitle('⭐ تقييم جديد')
                .setColor(THEME.ORANGE)
                .setThumbnail(member ? member.user.displayAvatarURL() : null)
                .addFields(
                  { name: '👤 صاحب التذكرة', value: member ? `${member.user.tag} (${member})` : `<@${ownerId}>`, inline: true },
                  { name: '🎯 التقييم', value: `${stars} (${rating}/5)`, inline: true },
                  { name: '📌 القسم', value: ratingData?.section || 'غير معروف', inline: true },
                  { name: '🔒 أغلق بواسطة', value: closedByMember ? `${closedByMember.user.tag}` : (ratingData?.closedBy ? `<@${ratingData.closedBy}>` : 'غير معروف'), inline: true },
                  { name: '🆔 معرف التذكرة', value: `\`${channelId}\``, inline: true },
                  { name: '📅 التاريخ', value: new Date().toLocaleString('ar-EG'), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `نظام تقييم التذاكر • ${interaction.guild.name}` });

              if (ratingData?.comment) {
                ratingLogEmbed.addFields({ name: '💬 التعليق', value: ratingData.comment, inline: false });
              }

              await ratingChannel.send({ embeds: [ratingLogEmbed] }).catch(err => {
                console.error('❌ فشل إرسال التقييم للروم:', err);
              });
            }
          }
        } catch (e) {
          console.error('❌ خطأ في إرسال التقييم:', e);
        }

        const stars = '⭐'.repeat(rating);
        const thanksEmbed = new EmbedBuilder()
          .setTitle('✅ شكراً لتقييمك!')
          .setDescription(
            `تم تسجيل تقييمك: ${stars} (${rating}/5)\n\n` +
            `نقدر وقتك ونسعى دائماً لتحسين خدماتنا. 💙`
          )
          .setColor(THEME.ORANGE)
          .setTimestamp();

        return interaction.update({
          embeds: [thanksEmbed],
          components: []
        });
      }

      return interaction.reply({ content: '❌ تقييم غير صالح.', ephemeral: true });
    }

    // ===== معالج مودال تعليق التقييم =====
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_comment_modal_')) {
      const parts = interaction.customId.split('_');
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];

      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: '❌ هذا التقييم ليس لك.',
          ephemeral: true
        });
      }

      const comment = interaction.fields.getTextInputValue('ticket_comment_text');

      await TicketRating.findOneAndUpdate(
        { guildId, ticketId: channelId },
        {
          guildId,
          userId: ownerId,
          ticketId: channelId,
          comment,
        },
        { upsert: true, new: true }
      );

      // ✅ إرسال التعليق لروم التقييمات إذا كانت معيّنة
      try {
        const config = await getGuildConfig(guildId);
        if (config.ticketRatingChannel) {
          const ratingChannel = interaction.client.channels.cache.get(config.ticketRatingChannel);
          if (ratingChannel) {
            const ratingData = await TicketRating.findOne({ guildId, ticketId: channelId });
            const member = await interaction.guild.members.fetch(ownerId).catch(() => null);

            const commentEmbed = new EmbedBuilder()
              .setTitle('💬 تعليق جديد على تقييم')
              .setColor(THEME.ORANGE)
              .setThumbnail(member ? member.user.displayAvatarURL() : null)
              .addFields(
                { name: '👤 صاحب التذكرة', value: member ? `${member.user.tag}` : `<@${ownerId}>`, inline: true },
                { name: '🎯 التقييم', value: ratingData?.rating ? `${'⭐'.repeat(ratingData.rating)} (${ratingData.rating}/5)` : 'لم يقيّم بعد', inline: true },
                { name: '📌 القسم', value: ratingData?.section || 'غير معروف', inline: true },
                { name: '💬 التعليق', value: comment, inline: false }
              )
              .setTimestamp()
              .setFooter({ text: `نظام تقييم التذاكر • ${interaction.guild.name}` });

            await ratingChannel.send({ embeds: [commentEmbed] }).catch(() => {});
          }
        }
      } catch (e) {
        console.error('❌ خطأ في إرسال التعليق:', e);
      }

      const thanksEmbed = new EmbedBuilder()
        .setTitle('✅ تم استلام تعليقك!')
        .setDescription(`شكراً لك على مشاركة رأيك:\n\n> ${comment}`)
        .setColor(THEME.ORANGE)
        .setTimestamp();

      return interaction.reply({
        embeds: [thanksEmbed],
        ephemeral: true
      });
    }

    // ===== مودال تغيير الاسم =====
    if (interaction.isModalSubmit() && interaction.customId === 'name_change_modal') {
      const newName = interaction.fields.getTextInputValue('new_name');
      if (newName.length < 2 || newName.length > 32) {
        return interaction.reply({ content: '⚠️ الاسم يجب أن يكون بين 2 و 32 حرفاً.', ephemeral: true });
      }
      try {
        const oldName = interaction.member.displayName;
        await interaction.member.setNickname(newName);
        await setNameCooldown(interaction.user.id);
        logToChannel(interaction.guild.id, { title: '✏️ تغيير اسم', color: THEME.ORANGE, description: `**المستخدم:** ${interaction.user}\n**القديم:** ${oldName}\n**الجديد:** ${newName}` });
        await interaction.reply({ content: `✅ تم تغيير اسمك إلى **${newName}**`, ephemeral: true });
      } catch (error) {
        await interaction.reply({ content: '❌ لا أملك صلاحية تغيير اسمك.', ephemeral: true });
      }
    }

    // ===== مودال التعليق على الاقتراح =====
    if (interaction.isModalSubmit() && interaction.customId === 'suggest_comment_modal') {
      const comment = interaction.fields.getTextInputValue('comment_text');
      const msg = interaction.message;
      const embed = msg.embeds[0];
      if (!embed) return interaction.reply({ content: '❌ لا يوجد اقتراح.', ephemeral: true });

      const newEmbed = EmbedBuilder.from(embed);
      newEmbed.addFields({ name: '💬 تعليق من الإدارة', value: comment, inline: false });
      newEmbed.setFooter({ text: `علق بواسطة ${interaction.user.tag} | ${new Date().toISOString()}` });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('suggest_accept').setLabel('✅ قبول').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('suggest_reject').setLabel('❌ رفض').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('suggest_comment').setLabel('💬 تعليق').setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ embeds: [newEmbed], components: [row] });
      await interaction.followUp({ content: `💬 تم إضافة تعليق بواسطة ${interaction.user}`, ephemeral: true });
    }

    // ===== قائمة التذاكر =====
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
      await interaction.deferReply({ ephemeral: true });
      const selected = interaction.values[0];
      const guild = interaction.guild;
      const member = interaction.member;
      const config = await getGuildConfig(guild.id);
      const generalImage = getGeneralImage(guild, config);
      const settings = await getTicketSettings(guild.id);
      const section = settings.sections.find(s => s.name === selected);
      if (!section) return interaction.editReply({ content: '❌ القسم غير موجود.', ephemeral: true });

      const ticketName = sanitizeChannelName(`تذكرة-${member.user.username}`);
      try {
        const channel = await guild.channels.create({
          name: ticketName, type: ChannelType.GuildText, parent: null,
          permissionOverwrites: [
            { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
          ]
        });
        const embed = new EmbedBuilder().setTitle(`🎫 تذكرة - ${selected}`).setDescription(`مرحباً ${member}!\nالقسم: **${selected}**\nيرجى شرح مشكلتك، سيرد عليك فريق الدعم قريباً.`).setColor(THEME.ORANGE).setTimestamp();
        if (generalImage) embed.setImage(generalImage);
        let mention = section.roleId ? `<@&${section.roleId}>` : '';
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Danger));
        await channel.send({ content: `${member} ${mention}`.trim(), embeds: [embed], components: [row] });
        logToChannel(guild.id, { title: '🎫 فتح تذكرة', color: THEME.ORANGE, description: `**${member.user.tag}** فتح تذكرة في قسم **${selected}**\nالقناة: ${channel}` });
        await interaction.editReply({ content: `✅ تم إنشاء تذكرتك: ${channel}`, ephemeral: true });
      } catch (error) {
        console.error('❌ خطأ في إنشاء التذكرة:', error);
        await interaction.editReply({ content: '❌ حدث خطأ في إنشاء التذكرة.', ephemeral: true });
      }
    }

  } catch (error) {
    console.error('❌ خطأ في معالج التفاعلات:', error);
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ حدث خطأ.', ephemeral: true });
      }
    } catch (e) {}
  }
});

// ============================================================
// ========== معالجة الأخطاء العامة ==========
// ============================================================

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// ============================================================
// ========== تشغيل البوت ==========
// ============================================================

client.login(TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err);
  process.exit(1);
});
