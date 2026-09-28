// ============================================================
// البوت الكامل - ثيم برتقالي وأسود - MongoDB
// يشمل: رتب ذاتية + اقتراحات + تذاكر + تقييمات + حمام زاجل + تقديمات ديناميكية
// بدون نظام OG
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

app.get('/', (req, res) => res.send('✅ البوت يعمل'));
app.listen(port, () => console.log(`🌐 خادم الويب على المنفذ ${port}`));

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
  ticketLogChannel: String,
  pigeonChannel: String,
  pigeonTitle: { type: String, default: '🕊️ حمام الزاجل' },
  pigeonDescription: { type: String, default: 'لإرسال رسالة خاصة عبر الحمام الزاجل، اضغط على الزر أدناه.' },
  pigeonImage: String,
  // ✅ إعدادات بانل التقديمات (ديناميكي)
  applyPanelTitle: { type: String, default: '📋 التقديمات الإدارية' },
  applyPanelDescription: { type: String, default: 'اختر القسم الذي ترغب بالتقديم عليه من القائمة المنسدلة أدناه.\n\n**🖱️ بمجرد اختيارك للقسم، ستفتح لك استمارة التقديم.**' },
  applyPanelImage: String,
  applyPanelChannel: String,
  applyResultLog: String,
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

const TicketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true },
  sectionName: String,
  claimedBy: String,
  claimedAt: Date,
  addedMembers: [String],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});
const Ticket = mongoose.model('Ticket', TicketSchema);

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

const PigeonSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  messageId: { type: String },
  senderId: { type: String, required: true },
  recipientId: { type: String, required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  readAt: Date,
  createdAt: { type: Date, default: Date.now },
});
PigeonSchema.index({ guildId: 1, createdAt: -1 });
const Pigeon = mongoose.model('Pigeon', PigeonSchema);

// ✅ نموذج التقديمات (ديناميكي - أقسام + أسئلة)
const ApplicationSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  type: { type: String, required: true }, // اسم القسم
  answers: [{
    question: String,
    answer: String,
  }],
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reviewedBy: String,
  reviewedAt: Date,
  messageId: String,
  createdAt: { type: Date, default: Date.now },
});
ApplicationSchema.index({ guildId: 1, userId: 1, type: 1, createdAt: -1 });
const Application = mongoose.model('Application', ApplicationSchema);

// ✅ نموذج أقسام التقديمات (ديناميكي)
const ApplySectionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, default: '📋' },
  image: { type: String, default: null },
  roleId: { type: String, default: null },
  logChannelId: { type: String, default: null },
  questions: [{
    label: { type: String, required: true },
    style: { type: String, enum: ['SHORT', 'PARAGRAPH'], default: 'SHORT' },
    required: { type: Boolean, default: true },
  }],
  order: { type: Number, default: 0 },
}, { timestamps: true });
ApplySectionSchema.index({ guildId: 1, name: 1 }, { unique: true });
const ApplySection = mongoose.model('ApplySection', ApplySectionSchema);

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

async function getTicketByChannel(guildId, channelId) {
  return await Ticket.findOne({ guildId, channelId });
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

// ✅ دوال أقسام التقديمات
async function getApplySections(guildId) {
  return await ApplySection.find({ guildId }).sort({ order: 1, createdAt: 1 });
}

async function getApplySectionByName(guildId, name) {
  return await ApplySection.findOne({ guildId, name });
}

async function addApplySection(guildId, name, emoji = '📋') {
  const existing = await ApplySection.findOne({ guildId, name });
  if (existing) return false;
  const maxOrder = await ApplySection.findOne({ guildId }).sort({ order: -1 });
  const order = maxOrder ? maxOrder.order + 1 : 0;
  const section = new ApplySection({ guildId, name, emoji, order, questions: [] });
  await section.save();
  return true;
}

async function removeApplySection(guildId, name) {
  const result = await ApplySection.deleteOne({ guildId, name });
  return result.deletedCount > 0;
}

// ✅ دالة بناء قائمة التحكم في التذكرة
function buildTicketControlRow() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_control')
    .setPlaceholder('⚙️ اختر إجراءً للتحكم في التذكرة')
    .addOptions([
      { label: 'استلام التذكرة', description: 'سجّل نفسك كمستلم لهذه التذكرة', value: 'claim', emoji: '✋' },
      { label: 'إلغاء المطالبة', description: 'إلغاء استلامك للتذكرة', value: 'unclaim', emoji: '📌' },
      { label: 'إضافة عضو', description: 'أضف عضواً إلى هذه التذكرة', value: 'add_member', emoji: '👤' },
      { label: 'تغيير اسم التذكرة', description: 'غيّر اسم قناة التذكرة', value: 'rename', emoji: '✏️' },
      { label: 'حذف التذكرة', description: 'احذف قناة التذكرة نهائياً', value: 'delete', emoji: '🗑️' },
    ]);
  return new ActionRowBuilder().addComponents(menu);
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
  if (customMatch) return { name: customMatch[1], id: customMatch[2] };
  if (isValidEmoji(emoji)) return emoji;
  return null;
}

// ============================================================
// ========== دوال الرتب الذاتية ==========
// ============================================================

async function getSelfRoles(guildId) {
  return await SelfRole.find({ guildId }).sort({ order: 1, createdAt: 1 });
}

async function addSelfRole(guildId, roleId, label, emoji = '🎭', image = null, description = '') {
  if (!parseEmoji(emoji)) emoji = '🎭';
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
  if (data.emoji !== undefined && !parseEmoji(data.emoji)) data.emoji = '🎭';
  return await SelfRole.findOneAndUpdate({ guildId, roleId }, data, { new: true });
}

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
    const opt = { label: r.label.slice(0, 100), value: r.roleId };
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

async function buildPigeonPanel(config) {
  const title = config.pigeonTitle || '🕊️ حمام الزاجل';
  const text = config.pigeonDescription || 'لإرسال رسالة خاصة عبر الحمام الزاجل، اضغط على الزر أدناه.';
  const image = config.pigeonImage || null;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(text)
    .setColor(THEME.ORANGE)
    .setTimestamp()
    .setFooter({ text: '🕊️ نظام الرسائل المجهولة' });

  if (image) embed.setImage(image);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pigeon_send')
      .setLabel('📤 إرسال زاجل')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🕊️'),
    new ButtonBuilder()
      .setCustomId('pigeon_myhistory')
      .setLabel('📜 رسائلي السابقة')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, row };
}

// ✅ بانل التقديمات الديناميكي
async function buildApplyPanel(guildId, config) {
  const title = config.applyPanelTitle || '📋 التقديمات الإدارية';
  const text = config.applyPanelDescription || 'اختر القسم الذي ترغب بالتقديم عليه من القائمة المنسدلة أدناه.\n\n**🖱️ بمجرد اختيارك للقسم، ستفتح لك استمارة التقديم.**';
  const image = config.applyPanelImage || null;

  const sections = await getApplySections(guildId);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(text)
    .setColor(THEME.ORANGE)
    .setTimestamp()
    .setFooter({ text: '📋 نظام التقديمات' });

  if (image) embed.setImage(image);

  if (!sections.length) {
    return { embed, row: null, empty: true };
  }

  const options = sections.slice(0, 25).map(s => {
    const opt = {
      label: s.name.slice(0, 100),
      value: s.name.slice(0, 100),
    };
    const parsedEmoji = parseEmoji(s.emoji);
    if (parsedEmoji) opt.emoji = parsedEmoji;
    else opt.emoji = '📋';
    const qCount = s.questions?.length || 0;
    opt.description = `${qCount} سؤال${s.roleId ? ' • له رتبة' : ''}`.slice(0, 100);
    return opt;
  });

  // ✅ إضافة خيار "إعادة تعيين" للقائمة
  options.push({
    label: 'إعادة تعيين',
    value: 'APPLY_RESET',
    emoji: '🔄',
    description: 'إعادة إرسال بانل التقديمات',
  });

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('apply_section_select')
      .setPlaceholder('📋 اختر قسم التقديم...')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options)
  );

  return { embed, row, empty: false };
}

async function findMemberByName(guild, query) {
  if (!query || !guild) return null;

  let cleaned = query.trim();
  if (cleaned.startsWith('@')) cleaned = cleaned.slice(1);
  cleaned = cleaned.split('#')[0].trim();
  if (!cleaned) return null;

  if (/^\d{17,20}$/.test(cleaned)) {
    const byId = await guild.members.fetch(cleaned).catch(() => null);
    if (byId) return byId;
  }

  const mentionMatch = query.match(/^<@!?(\d{17,20})>$/);
  if (mentionMatch) {
    const byMention = await guild.members.fetch(mentionMatch[1]).catch(() => null);
    if (byMention) return byMention;
  }

  const lower = cleaned.toLowerCase();

  const cached = guild.members.cache.find(m =>
    m.user.username.toLowerCase() === lower ||
    (m.user.globalName && m.user.globalName.toLowerCase() === lower) ||
    (m.user.tag && m.user.tag.toLowerCase() === cleaned.toLowerCase()) ||
    m.displayName.toLowerCase() === lower ||
    m.user.username.toLowerCase().includes(lower) ||
    (m.user.globalName && m.user.globalName.toLowerCase().includes(lower)) ||
    m.displayName.toLowerCase().includes(lower)
  );
  if (cached) return cached;

  try {
    const allMembers = await guild.members.fetch();
    let found = allMembers.find(m =>
      m.user.username.toLowerCase() === lower ||
      (m.user.globalName && m.user.globalName.toLowerCase() === lower) ||
      (m.user.tag && m.user.tag.toLowerCase() === cleaned.toLowerCase()) ||
      m.displayName.toLowerCase() === lower
    );
    if (found) return found;
    found = allMembers.find(m =>
      m.user.username.toLowerCase().includes(lower) ||
      (m.user.globalName && m.user.globalName.toLowerCase().includes(lower)) ||
      m.displayName.toLowerCase().includes(lower)
    );
    if (found) return found;
  } catch (e) {
    console.error('❌ خطأ في جلب الأعضاء:', e.message);
  }

  try {
    const user = await client.users.fetch(cleaned).catch(() => null);
    if (user) {
      const member = await guild.members.fetch(user.id).catch(() => null);
      if (member) return member;
    }
  } catch (e) {}

  return null;
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
    try { await task(); } catch (e) { console.error('❌ خطأ في اللوق:', e); }
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
      } catch (e) { drawDefaultBackground(ctx, width, height); }
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
      description: `**المستخدم:** ${message.author?.tag || 'غير معروف'}\n**القناة:** ${message.channel.name}\n**المحتوى:** ${content || 'غير مرئي'}`,
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

function isAdminCommand(cmd) {
  const adminCmds = [
    'حظر', 'طرد', 'كتم', 'فك_كتم', 'تحذير', 'ابطال_تحذيرات',
    'مسح', 'قفل', 'فتح', 'نقل_كل',
    'حذف_قناة', 'تغيير_اسم_قناة'
  ];
  return adminCmds.includes(cmd);
}

// ============================================================
// 🔚 نهاية الدفعة 1/2
// ============================================================
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
      // ========== الأوامر العامة ==========
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
            { name: '🎫 التذاكر', value: '`بانل` `عرض_تذكرة` `تعيين تذكرة` `تعيين تكت_لوق #روم` (للمتحكمين)', inline: false },
            { name: '⭐ التقييمات', value: '`تقييمات` (للمتحكمين)', inline: false },
            { name: '🎭 الرتب الذاتية', value: '`تعيين رتب` (للمتحكمين)', inline: false },
            { name: '🕊️ الحمام الزاجل', value: '`بانل_زاجل` (للمتحكمين) | `تعيين روم_زاجل #روم`', inline: false },
            { name: '📋 التقديمات', value: '`بانل_تقديم` `تقديم اضافة [اسم] [ايموجي]` `تقديم حذف [اسم]` `تقديم عرض_الكل` `تقديم عرض [اسم]` `تقديم صورة [اسم] رابط` `تقديم رتبة [اسم] @رتبة` `تقديم لوق [اسم] #روم` `تقديم اضافة_سؤال [اسم] [نص]` `تقديم حذف_سؤال [اسم] [رقم]` `تقديم عرض_الأسئلة [اسم]` `نتيجة @عضو [اسم_القسم] [قبول/رفض]`', inline: false },
            { name: '✏️ تغيير الاسم', value: '`تغيير_اسم`', inline: false },
            { name: 'ℹ️ معلومات', value: '`معلومات` `سيرفر` `بينق`', inline: false },
            { name: '⚙️ إعدادات', value: '`تعيين` (للمتحكمين)', inline: false },
            { name: '📸 إنستغرام', value: '`ig رابط_الريلز`', inline: false }
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

      // ========== نظام التحكم ==========
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
          sentReply = await message.reply('❌ هذا هو مالك البوت.');
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
        sentReply = await message.reply(`✅ تم جعل ${member} متحكماً.`);
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
          sentReply = await message.reply('❌ لا يمكن إزالة صلاحية المالك.');
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
          sentReply = await message.reply('📋 لا يوجد متحكمون.');
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
          } else {
            valid++;
          }
        }
        sentReply = await message.reply(`✅ تم إصلاح **${fixed}** رتبة. الرتب السليمة: **${valid}**.`);
        deleteAfter(sentReply);
        return;
      }

      // ============================================================
      // ========== ✅ أوامر التقديمات الديناميكية ==========
      // ============================================================
      if (cmd === 'تقديم') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const action = args[0]?.toLowerCase();
        const rest = args.slice(1);

        if (!action) {
          const sections = await getApplySections(guildId);
          const embed = new EmbedBuilder()
            .setTitle('📋 إدارة أقسام التقديمات')
            .setColor(THEME.ORANGE)
            .setDescription('لإدارة أقسام التقديمات:')
            .addFields(
              { name: '➕ إضافة قسم', value: '`!تقديم اضافة [الاسم] [الايموجي]`', inline: false },
              { name: '🗑️ حذف قسم', value: '`!تقديم حذف [الاسم]`', inline: false },
              { name: '📋 عرض كل الأقسام', value: '`!تقديم عرض_الكل`', inline: false },
              { name: '👁️ عرض قسم معين', value: '`!تقديم عرض [الاسم]`', inline: false },
              { name: '🖼️ تعيين صورة القسم', value: '`!تقديم صورة [الاسم] [رابط]`', inline: false },
              { name: '🎭 تعيين رتبة القسم', value: '`!تقديم رتبة [الاسم] @رتبة`', inline: false },
              { name: '📥 تعيين لوق القسم', value: '`!تقديم لوق [الاسم] #روم`', inline: false },
              { name: '➕ إضافة سؤال', value: '`!تقديم اضافة_سؤال [الاسم] [نص السؤال]`', inline: false },
              { name: '🗑️ حذف سؤال', value: '`!تقديم حذف_سؤال [الاسم] [رقم السؤال]`', inline: false },
              { name: '📋 عرض أسئلة القسم', value: '`!تقديم عرض_الأسئلة [الاسم]`', inline: false }
            )
            .setFooter({ text: `إجمالي الأقسام: ${sections.length}` });
          if (generalImage) embed.setImage(generalImage);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        // ➕ إضافة قسم
        if (action === 'اضافة' || action === 'إضافة') {
          const sectionName = rest[0];
          let emoji = rest[1] || '📋';
          if (!sectionName) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم اضافة [الاسم] [الايموجي]`');
            deleteAfter(sentReply);
            return;
          }
          if (!parseEmoji(emoji)) emoji = '📋';

          const added = await addApplySection(guildId, sectionName, emoji);
          if (!added) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** موجود بالفعل.`);
            deleteAfter(sentReply);
            return;
          }
          sentReply = await message.channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('✅ تم إضافة القسم')
              .setColor(THEME.ORANGE)
              .setDescription(`تم إضافة قسم **${emoji} ${sectionName}** بنجاح.\n\n**الخطوات التالية:**\n1. أضف الأسئلة: \`!تقديم اضافة_سؤال ${sectionName} [نص السؤال]\`\n2. عيّن رتبة القبول: \`!تقديم رتبة ${sectionName} @رتبة\`\n3. عيّن روم اللوق: \`!تقديم لوق ${sectionName} #روم\`\n4. عيّن صورة (اختياري): \`!تقديم صورة ${sectionName} [رابط]\``)
            ]
          });
          deleteAfter(sentReply);
          logToChannel(guildId, { title: '📋 إضافة قسم تقديم', color: THEME.ORANGE, description: `**${message.author}** أضاف قسم **${sectionName}**` });
          return;
        }

        // 🗑️ حذف قسم
        if (action === 'حذف') {
          const sectionName = rest.join(' ').trim();
          if (!sectionName) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم حذف [الاسم]`');
            deleteAfter(sentReply);
            return;
          }
          const removed = await removeApplySection(guildId, sectionName);
          if (!removed) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          sentReply = await message.channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('🗑️ تم حذف القسم')
              .setColor(THEME.ORANGE)
              .setDescription(`تم حذف قسم **${sectionName}** بنجاح.`)
            ]
          });
          deleteAfter(sentReply);
          logToChannel(guildId, { title: '🗑️ حذف قسم تقديم', color: THEME.BLACK, description: `**${message.author}** حذف قسم **${sectionName}**` });
          return;
        }

        // 📋 عرض كل الأقسام
        if (action === 'عرض_الكل' || action === 'عرض-الكل') {
          const sections = await getApplySections(guildId);
          if (!sections.length) {
            sentReply = await message.reply('📭 لا توجد أقسام.');
            deleteAfter(sentReply);
            return;
          }
          const embed = new EmbedBuilder()
            .setTitle('📋 قائمة أقسام التقديمات')
            .setColor(THEME.ORANGE)
            .setFooter({ text: `إجمالي: ${sections.length} قسم` });
          for (const s of sections) {
            const role = s.roleId ? message.guild.roles.cache.get(s.roleId) : null;
            const logCh = s.logChannelId ? message.guild.channels.cache.get(s.logChannelId) : null;
            let val = `**الإيموجي:** ${s.emoji}\n**عدد الأسئلة:** ${s.questions.length}\n**رتبة القبول:** ${role ? role.toString() : '❌ غير محددة'}\n**روم اللوق:** ${logCh ? logCh.toString() : '❌ غير محدد'}`;
            if (s.image) val += `\n**الصورة:** [رابط](${s.image})`;
            embed.addFields({ name: `${s.emoji} ${s.name}`, value: val, inline: false });
          }
          if (generalImage) embed.setImage(generalImage);
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        // 👁️ عرض قسم
        if (action === 'عرض') {
          const sectionName = rest.join(' ').trim();
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          const role = section.roleId ? message.guild.roles.cache.get(section.roleId) : null;
          const logCh = section.logChannelId ? message.guild.channels.cache.get(section.logChannelId) : null;
          const embed = new EmbedBuilder()
            .setTitle(`${section.emoji} ${section.name}`)
            .setColor(THEME.ORANGE)
            .addFields(
              { name: '📝 عدد الأسئلة', value: `${section.questions.length}`, inline: true },
              { name: '🎭 رتبة القبول', value: role ? role.toString() : '❌ غير محددة', inline: true },
              { name: '📥 روم اللوق', value: logCh ? logCh.toString() : '❌ غير محدد', inline: true }
            );
          if (section.image) embed.setImage(section.image);
          if (section.questions.length) {
            const qList = section.questions.map((q, i) => `**${i + 1}.** ${q.label} (${q.style === 'SHORT' ? 'قصير' : 'طويل'})`).join('\n');
            embed.addFields({ name: '📋 الأسئلة', value: qList.slice(0, 1024), inline: false });
          }
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        // 🖼️ صورة القسم
        if (action === 'صورة') {
          const sectionName = rest[0];
          const image = rest.slice(1).join(' ');
          if (!sectionName || !image) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم صورة [الاسم] [رابط]`');
            deleteAfter(sentReply);
            return;
          }
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          section.image = image;
          await section.save();
          sentReply = await message.channel.send({
            embeds: [new EmbedBuilder()
              .setTitle('✅ تم تعيين الصورة')
              .setColor(THEME.ORANGE)
              .setDescription(`تم تعيين صورة لقسم **${sectionName}**`)
              .setImage(image)
            ]
          });
          deleteAfter(sentReply);
          return;
        }

        // 🎭 رتبة القسم
        if (action === 'رتبة') {
          const sectionName = rest[0];
          const role = message.mentions.roles.first();
          if (!sectionName || !role) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم رتبة [الاسم] @رتبة`');
            deleteAfter(sentReply);
            return;
          }
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          section.roleId = role.id;
          await section.save();
          sentReply = await message.reply(`✅ تم تعيين رتبة القبول لقسم **${sectionName}** إلى ${role}`);
          deleteAfter(sentReply);
          return;
        }

        // 📥 لوق القسم
        if (action === 'لوق') {
          const sectionName = rest[0];
          const channel = message.mentions.channels.first();
          if (!sectionName || !channel) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم لوق [الاسم] #روم`');
            deleteAfter(sentReply);
            return;
          }
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          section.logChannelId = channel.id;
          await section.save();
          sentReply = await message.reply(`✅ تم تعيين روم اللوق لقسم **${sectionName}** إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        // ➕ إضافة سؤال
        if (action === 'اضافة_سؤال' || action === 'إضافة_سؤال') {
          const sectionName = rest[0];
          const questionText = rest.slice(1).join(' ').trim();
          if (!sectionName || !questionText) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم اضافة_سؤال [الاسم] [نص السؤال]`');
            deleteAfter(sentReply);
            return;
          }
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          if (section.questions.length >= 5) {
            sentReply = await message.reply('⚠️ الحد الأقصى للأسئلة هو **5 أسئلة** لكل قسم (قيد من Discord).');
            deleteAfter(sentReply);
            return;
          }
          section.questions.push({ label: questionText.slice(0, 45), style: 'SHORT', required: true });
          await section.save();
          sentReply = await message.reply(`✅ تم إضافة السؤال رقم **${section.questions.length}** لقسم **${sectionName}**:\n> ${questionText}`);
          deleteAfter(sentReply);
          return;
        }

        // 🗑️ حذف سؤال
        if (action === 'حذف_سؤال') {
          const sectionName = rest[0];
          const index = parseInt(rest[1]);
          if (!sectionName || isNaN(index)) {
            sentReply = await message.reply('⚠️ الصيغة: `!تقديم حذف_سؤال [الاسم] [رقم السؤال]`');
            deleteAfter(sentReply);
            return;
          }
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          if (index < 1 || index > section.questions.length) {
            sentReply = await message.reply(`⚠️ رقم السؤال غير صحيح. القسم فيه **${section.questions.length}** سؤال.`);
            deleteAfter(sentReply);
            return;
          }
          const removed = section.questions.splice(index - 1, 1)[0];
          await section.save();
          sentReply = await message.reply(`✅ تم حذف السؤال: **${removed.label}**`);
          deleteAfter(sentReply);
          return;
        }

        // 📋 عرض الأسئلة
        if (action === 'عرض_الأسئلة') {
          const sectionName = rest.join(' ').trim();
          const section = await getApplySectionByName(guildId, sectionName);
          if (!section) {
            sentReply = await message.reply(`⚠️ قسم **${sectionName}** غير موجود.`);
            deleteAfter(sentReply);
            return;
          }
          if (!section.questions.length) {
            sentReply = await message.reply(`📭 قسم **${sectionName}** لا يحتوي على أسئلة بعد.`);
            deleteAfter(sentReply);
            return;
          }
          const qList = section.questions.map((q, i) => `**${i + 1}.** ${q.label}`).join('\n');
          const embed = new EmbedBuilder()
            .setTitle(`📋 أسئلة قسم ${sectionName}`)
            .setColor(THEME.ORANGE)
            .setDescription(qList)
            .setFooter({ text: `إجمالي: ${section.questions.length} سؤال` });
          sentReply = await message.channel.send({ embeds: [embed] });
          deleteAfter(sentReply);
          return;
        }

        sentReply = await message.reply('⚠️ أمر غير معروف. استخدم `!تقديم` لعرض القائمة.');
        deleteAfter(sentReply);
        return;
      }

      // ========== تعيين ==========
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
              { name: '🎫 التذاكر', value: '`تذكرة`، `تكت_لوق #روم`' },
              { name: '🎭 الرتب الذاتية', value: '`رتب` (لإدارة الرتب التفاعلية)' },
              { name: '⭐ التقييمات', value: '`تقييم [on/off]`، `قناة_تقييم #قناة`' },
              { name: '🕊️ الحمام الزاجل', value: '`روم_زاجل #روم`، `عنوان_زاجل نص`، `نص_زاجل نص`، `صورة_زاجل رابط`' },
              { name: '📋 التقديمات', value: '`تقديم بانل_عنوان نص`، `تقديم بانل_وصف نص`، `تقديم بانل_صورة رابط`، `تقديم بانل_روم #روم`، `تقديم لوق_نتائج #روم`' },
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

        // ✅ روم استلام التذاكر
        if (sub === 'تكت_لوق' || sub === 'تيكت_لوق') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { ticketLogChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين روم استلام التذاكر.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { ticketLogChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم استلام التذاكر إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        // ===== إعدادات بانل التقديمات =====
        if (sub === 'تقديم') {
          const option = args[1]?.toLowerCase();
          const optionValue = args.slice(2).join(' ');

          if (option === 'بانل_عنوان') {
            if (!optionValue) {
              sentReply = await message.reply('⚠️ أدخل العنوان.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelTitle: optionValue });
            sentReply = await message.reply(`✅ تم تعيين عنوان بانل التقديمات: "${optionValue}"`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_وصف') {
            if (!optionValue) {
              sentReply = await message.reply('⚠️ أدخل الوصف.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelDescription: optionValue });
            sentReply = await message.reply(`✅ تم تعيين وصف بانل التقديمات:\n${optionValue}`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_صورة') {
            if (!optionValue) {
              await updateGuildConfig(guildId, { applyPanelImage: null });
              sentReply = await message.reply('✅ تم إلغاء صورة بانل التقديمات.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelImage: optionValue });
            sentReply = await message.reply(`✅ تم تعيين صورة بانل التقديمات: ${optionValue}`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'بانل_روم') {
            const channel = message.mentions.channels.first();
            if (!channel) {
              await updateGuildConfig(guildId, { applyPanelChannel: null });
              sentReply = await message.reply('✅ تم إلغاء تعيين روم بانل التقديمات.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyPanelChannel: channel.id });
            sentReply = await message.reply(`✅ تم تعيين روم بانل التقديمات إلى ${channel}`);
            deleteAfter(sentReply);
            return;
          }

          if (option === 'لوق_نتائج') {
            const channel = message.mentions.channels.first();
            if (!channel) {
              await updateGuildConfig(guildId, { applyResultLog: null });
              sentReply = await message.reply('✅ تم إلغاء تعيين روم لوق النتائج.');
              deleteAfter(sentReply);
              return;
            }
            await updateGuildConfig(guildId, { applyResultLog: channel.id });
            sentReply = await message.reply(`✅ تم تعيين روم لوق النتائج إلى ${channel}`);
            deleteAfter(sentReply);
            return;
          }

          sentReply = await message.reply('⚠️ خيار غير معروف.\nاستخدم: `بانل_عنوان` / `بانل_وصف` / `بانل_صورة` / `بانل_روم` / `لوق_نتائج`');
          deleteAfter(sentReply);
          return;
        }

        // ===== إعدادات الزاجل =====
        if (sub === 'روم_زاجل') {
          const channel = message.mentions.channels.first();
          if (!channel) {
            await updateGuildConfig(guildId, { pigeonChannel: null });
            sentReply = await message.reply('✅ تم إلغاء تعيين روم الزاجل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonChannel: channel.id });
          sentReply = await message.reply(`✅ تم تعيين روم الزاجل إلى ${channel}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'عنوان_زاجل') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل العنوان.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonTitle: value });
          sentReply = await message.reply(`✅ تم تعيين عنوان الزاجل: "${value}"`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'نص_زاجل') {
          if (!value) {
            sentReply = await message.reply('⚠️ أدخل النص.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonDescription: value });
          sentReply = await message.reply(`✅ تم تعيين نص الزاجل:\n${value}`);
          deleteAfter(sentReply);
          return;
        }

        if (sub === 'صورة_زاجل') {
          if (!value) {
            await updateGuildConfig(guildId, { pigeonImage: null });
            sentReply = await message.reply('✅ تم إلغاء صورة الزاجل.');
            deleteAfter(sentReply);
            return;
          }
          await updateGuildConfig(guildId, { pigeonImage: value });
          sentReply = await message.reply(`✅ تم تعيين صورة الزاجل: ${value}`);
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
            if (!parseEmoji(emoji)) emoji = '🎭';
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
            logToChannel(guildId, { title: '🎭 إضافة رتبة ذاتية', color: THEME.ORANGE, description: `**${message.author}** أضاف رتبة **${label}**` });
            deleteAfter(sentReply);
            return;
          }

          if (action === 'تعديل') {
            const role = message.mentions.roles.first();
            if (!role) {
              sentReply = await message.reply('⚠️ منشن الرتبة.');
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
              sentReply = await message.reply('⚠️ لا توجد رتب مسجلة.');
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
          sentReply = await message.reply(`✅ تم تعيين قناة عرض التقييمات إلى ${channel}`);
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

      // ========== بانل الاقتراحات ==========
      if (cmd === 'بانل_اقتراح') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const fullText = args.join(' ');
        let customTitle = null;
        let customText = null;
        let customImage = null;

        const titleMatch = fullText.match(/عنوان\s*=\s*(.+?)(?=\s*(?:نص|صورة)\s*=|$)/);
        if (titleMatch) customTitle = titleMatch[1].trim();

        const textMatch = fullText.match(/نص\s*=\s*(.+?)(?=\s*(?:عنوان|صورة)\s*=|$)/);
        if (textMatch) customText = textMatch[1].trim();

        const imageMatch = fullText.match(/صورة\s*=\s*(https?:\/\/\S+)/);
        if (imageMatch) customImage = imageMatch[1].trim();

        const updateData = {};
        if (customTitle) updateData.suggestionsPanelTitle = customTitle;
        if (customText) updateData.suggestionsPanelText = customText;
        if (customImage) updateData.suggestionsPanelImage = customImage;
        if (Object.keys(updateData).length > 0) {
          await updateGuildConfig(guildId, updateData);
        }

        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildSuggestionPanel(updatedConfig);

        let targetChannel = message.channel;
        if (updatedConfig.suggestionsChannel) {
          const suggChannel = message.guild.channels.cache.get(updatedConfig.suggestionsChannel);
          if (suggChannel) targetChannel = suggChannel;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          logToChannel(guildId, { title: '💡 إنشاء لوحة اقتراحات', color: THEME.ORANGE, description: `**${message.author}** أنشأ لوحة الاقتراحات في ${targetChannel}` });
          sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم إنشاء لوحة الاقتراحات في ${targetChannel}`)] });
          deleteAfter(sentReply);
        } catch (err) {
          console.error('❌ خطأ في إرسال بانل الاقتراحات:', err);
          sentReply = await message.reply(`❌ فشل إنشاء البانل: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ========== بانل الزاجل ==========
      if (cmd === 'بانل_زاجل') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildPigeonPanel(updatedConfig);

        let targetChannel = message.channel;
        if (updatedConfig.pigeonChannel) {
          const pChannel = message.guild.channels.cache.get(updatedConfig.pigeonChannel);
          if (pChannel) targetChannel = pChannel;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          logToChannel(guildId, { title: '🕊️ إنشاء بانل الزاجل', color: THEME.ORANGE, description: `**${message.author}** أنشأ بانل الزاجل في ${targetChannel}` });
          sentReply = await message.reply({
            embeds: [new EmbedBuilder()
              .setColor(THEME.ORANGE)
              .setDescription(`✅ تم إنشاء بانل الزاجل في ${targetChannel}\n\n**ملاحظة:** ${updatedConfig.pigeonChannel ? '' : '⚠️ لم يتم تعيين روم للزاجل!'}`)
            ]
          });
          deleteAfter(sentReply);
        } catch (err) {
          console.error('❌ خطأ في إرسال بانل الزاجل:', err);
          sentReply = await message.reply(`❌ فشل إنشاء البانل: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ========== بانل التقديمات ==========
      if (cmd === 'بانل_تقديم') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const updatedConfig = await getGuildConfig(guildId);
        const panel = await buildApplyPanel(guildId, updatedConfig);

        if (panel.empty) {
          sentReply = await message.reply('⚠️ لا توجد أقسام تقديم. أضف قسم أولاً: `!تقديم اضافة [الاسم] [الايموجي]`');
          deleteAfter(sentReply);
          return;
        }

        let targetChannel = message.channel;
        if (updatedConfig.applyPanelChannel) {
          const applyCh = message.guild.channels.cache.get(updatedConfig.applyPanelChannel);
          if (applyCh) targetChannel = applyCh;
        }

        try {
          await targetChannel.send({ embeds: [panel.embed], components: [panel.row] });
          logToChannel(guildId, { title: '📋 إنشاء بانل التقديمات', color: THEME.ORANGE, description: `**${message.author}** أنشأ بانل التقديمات في ${targetChannel}` });
          sentReply = await message.reply({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم إنشاء بانل التقديمات في ${targetChannel}`)] });
          deleteAfter(sentReply);
        } catch (err) {
          console.error('❌ خطأ في إرسال بانل التقديمات:', err);
          sentReply = await message.reply(`❌ فشل إنشاء البانل: ${err.message}`);
          deleteAfter(sentReply);
        }
        return;
      }

      // ========== أمر النتيجة ==========
      if (cmd === 'نتيجة') {
        if (!(await hasPermission(message.member, guildId))) {
          sentReply = await message.reply('❌ تحتاج صلاحية متحكم.');
          deleteAfter(sentReply);
          return;
        }

        const member = message.mentions.members.first();
        const type = args[1];
        const result = args[2]?.toLowerCase();

        if (!member || !type || !result) {
          sentReply = await message.reply('⚠️ الاستخدام: `!نتيجة @عضو [اسم_القسم] [قبول/رفض]`');
          deleteAfter(sentReply);
          return;
        }

        if (!['قبول', 'رفض', 'accept', 'reject'].includes(result)) {
          sentReply = await message.reply('⚠️ النتيجة غير صحيحة. اختر من: `قبول` / `رفض`');
          deleteAfter(sentReply);
          return;
        }

        const section = await getApplySectionByName(guildId, type);
        if (!section) {
          sentReply = await message.reply(`⚠️ قسم **${type}** غير موجود.`);
          deleteAfter(sentReply);
          return;
        }

        const resultNormalized = (result === 'قبول' || result === 'accept') ? 'accept' : 'reject';
        const role = section.roleId ? message.guild.roles.cache.get(section.roleId) : null;
        const logChannel = section.logChannelId ? message.guild.channels.cache.get(section.logChannelId) : null;
        const resultLog = config.applyResultLog ? message.guild.channels.cache.get(config.applyResultLog) : null;

        if (resultNormalized === 'accept') {
          if (role && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            await member.roles.add(role).catch(() => {});
          }

          const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setTitle(`✅ ${member.user.username} مقبول`)
            .setDescription(`**تم قبولك في قسم ${section.name} في سيرفر ${message.guild.name}، حياك للتعليم والاختبار**`)
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
            .setColor(0x00FF00)
            .setTimestamp();

          if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
          if (resultLog) await resultLog.send({ embeds: [embed] }).catch(() => {});
          await member.send(`✅ تم قبولك في قسم **${section.name}** في السيرفر **${message.guild.name}**`).catch(() => {});

          await Application.findOneAndUpdate(
            { guildId, userId: member.id, type: section.name, status: 'pending' },
            { status: 'accepted', reviewedBy: message.author.id, reviewedAt: new Date() },
            { sort: { createdAt: -1 } }
          ).catch(() => {});

          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم قبول ${member} في قسم **${section.name}**`)] });
          deleteAfter(sentReply);

        } else {
          const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setTitle(`❌ ${member.user.username} مرفوض`)
            .setDescription(`**تم رفضك في قسم ${section.name} في سيرفر ${message.guild.name}**`)
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
            .setColor(0xFF0000)
            .setTimestamp();

          if (logChannel) await logChannel.send({ embeds: [embed] }).catch(() => {});
          if (resultLog) await resultLog.send({ embeds: [embed] }).catch(() => {});
          await member.send(`❌ تم رفضك في قسم **${section.name}** في السيرفر **${message.guild.name}**`).catch(() => {});

          await Application.findOneAndUpdate(
            { guildId, userId: member.id, type: section.name, status: 'pending' },
            { status: 'rejected', reviewedBy: message.author.id, reviewedAt: new Date() },
            { sort: { createdAt: -1 } }
          ).catch(() => {});

          sentReply = await message.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`❌ تم رفض ${member} في قسم **${section.name}**`)] });
          deleteAfter(sentReply);
        }

        logToChannel(guildId, {
          title: '📋 نتيجة تقديم',
          color: resultNormalized === 'accept' ? 0x00FF00 : 0xFF0000,
          description: `**العضو:** ${member.user.tag}\n**القسم:** ${section.name}\n**النتيجة:** ${resultNormalized === 'accept' ? '✅ قبول' : '❌ رفض'}\n**بواسطة:** ${message.author}`,
          footer: 'نظام التقديمات'
        });
        return;
      }

      // ========== بانل التذاكر ==========
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
          const opt = { label: s.name, value: s.name };
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
        // ✅ إضافة خيار "إعادة تعيين"
        options.push({
          label: 'إعادة تعيين',
          value: 'TICKET_RESET',
          emoji: '🔄',
          description: 'إعادة إرسال قائمة التذاكر',
        });
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

      // ========== أوامر عامة أخرى ==========
      if (cmd === 'عرض_تذكرة') {
        const settings = await getTicketSettings(guildId);
        const embed = new EmbedBuilder().setTitle('📋 إعدادات التذاكر').setColor(THEME.ORANGE)
          .setDescription(`**النص:** ${settings.text}`)
          .addFields(
            { name: '📌 الأقسام', value: settings.sections.map((s, i) => `${i+1}. ${s.emoji || '📌'} **${s.name}** ${s.roleId ? `<@&${s.roleId}>` : '(بدون دور)'}`).join('\n') || 'لا يوجد أقسام', inline: false },
            { name: '🖼️ الصورة', value: settings.image ? `[رابط](${settings.image})` : 'لا توجد صورة', inline: true },
            { name: '📥 روم استلام التذاكر', value: config.ticketLogChannel ? `<#${config.ticketLogChannel}>` : 'لم يتم التعيين', inline: true }
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
        const recentRatings = await TicketRating.find({ guildId }).sort({ createdAt: -1 }).limit(10);

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
        logToChannel(guildId, { title: '🧪 اختبار اللوق', color: THEME.ORANGE, description: `✅ اللوق يعمل بنجاح!\n**المنفذ:** ${message.author}`, footer: 'رسالة اختبار' });
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
        const embed = new EmbedBuilder().setTitle('🗑️ تم حذف الرد التلقائي').setColor(THEME.ORANGE).setDescription(`تم حذف الرد التلقائي للكلمة: **${keyword}**`);
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
        const embed = new EmbedBuilder().setTitle('💬 قائمة الردود التلقائية').setColor(THEME.ORANGE).setDescription(list).setFooter({ text: `عدد: ${replies.length}` });
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
        const imageMatch2 = description.match(/(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp))/i);
        if (imageMatch2) { embed.setImage(imageMatch2[1]); embed.setDescription(description.replace(imageMatch2[1], '').trim() || 'بدون وصف'); }
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

      // ========== أوامر الإشراف ==========
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

  // ========== XP، الأوتو لاين، الردود التلقائية ==========
  try {
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

    // ============================================================
    // ========== 🕊️ معالجات الزاجل ==========
    // ============================================================

    if (interaction.isButton() && interaction.customId === 'pigeon_send') {
      const modal = new ModalBuilder()
        .setCustomId('pigeon_send_modal')
        .setTitle('🕊️ إرسال رسالة زاجل')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pigeon_target')
              .setLabel('اسم المستخدم (بدون @)')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(2)
              .setMaxLength(50)
              .setPlaceholder('مثال: ahmed_2001')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pigeon_message')
              .setLabel('نص الرسالة')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(1500)
              .setPlaceholder('اكتب رسالتك هنا...')
          )
        );
      return await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'pigeon_send_modal') {
      await interaction.deferReply({ ephemeral: true });

      const targetQuery = interaction.fields.getTextInputValue('pigeon_target');
      const content = interaction.fields.getTextInputValue('pigeon_message');
      const guild = interaction.guild;

      const config = await getGuildConfig(guild.id);
      if (!config.pigeonChannel) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لم يتم تعيين روم الزاجل بعد. تواصل مع الإدارة.')]
        });
      }

      const pigeonChannel = guild.channels.cache.get(config.pigeonChannel);
      if (!pigeonChannel) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ روم الزاجل غير موجود.')]
        });
      }

      const target = await findMemberByName(guild, targetQuery);
      if (!target) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ لم أتمكن من العثور على عضو بالاسم: **${targetQuery}**`)]
        });
      }

      if (target.user.bot) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا يمكن إرسال زاجل للبوتات.')]
        });
      }

      if (target.id === interaction.user.id) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ لا يمكنك إرسال زاجل لنفسك.')]
        });
      }

      const pigeonEmbed = new EmbedBuilder()
        .setTitle('🕊️ وصلتك رسالة زاجل')
        .setDescription(
          `**📤 المُرسِل:** 🕵️ مجهول\n` +
          `**📥 المُرسَل إليه:** ${target}\n` +
          `**📅 التاريخ:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
          `_اضغط على زر **📖 قراءة زاجل** للاطلاع على المحتوى._\n\n` +
          `> 🔒 **ملاحظة:** هوية المُرسِل مخفية عن الجميع (بما فيهم أنت)، ما عدا الإدارة.`
        )
        .setColor(THEME.ORANGE)
        .setTimestamp()
        .setFooter({ text: '🕊️ نظام الحمام الزاجل - مُرسِل مجهول' });

      if (config.pigeonImage) pigeonEmbed.setImage(config.pigeonImage);

      const readRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`pigeon_read_${target.id}`)
          .setLabel('📖 قراءة زاجل')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🕊️')
      );

      let sentMsg;
      try {
        sentMsg = await pigeonChannel.send({
          content: `📩 ${target}، وصلتك رسالة زاجل جديدة!`,
          embeds: [pigeonEmbed],
          components: [readRow]
        });
      } catch (err) {
        console.error('❌ خطأ في إرسال الزاجل:', err);
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل إرسال الزاجل: ${err.message}`)]
        });
      }

      try {
        await Pigeon.create({
          guildId: guild.id,
          messageId: sentMsg.id,
          senderId: interaction.user.id,
          recipientId: target.id,
          content,
        });
      } catch (e) {
        console.error('❌ خطأ في حفظ الزاجل:', e);
      }

      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('🕊️ وصلتك رسالة زاجل جديدة!')
          .setDescription(
            `**📤 المُرسِل:** 🕵️ مجهول\n` +
            `**🏠 السيرفر:** ${guild.name}\n\n` +
            `> اذهب إلى الروم <#${pigeonChannel.id}> واضغط على **📖 قراءة زاجل** للاطلاع على محتوى الرسالة.`
          )
          .setColor(THEME.ORANGE)
          .setTimestamp()
          .setFooter({ text: '🕊️ نظام الحمام الزاجل - مُرسِل مجهول' });
        await target.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (e) {}

      logToChannel(guild.id, {
        title: '🕊️ زاجل جديد',
        color: THEME.ORANGE,
        description: `**من:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n**إلى:** ${target.user.tag} (\`${target.id}\`)\n**الروم:** ${pigeonChannel}`,
        footer: 'الحمام الزاجل (سجل إداري)',
      });

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setColor(THEME.ORANGE)
          .setTitle('✅ تم إرسال الزاجل')
          .setDescription(`تم إرسال زاجلك إلى **${target.user.tag}** بنجاح!\n📬 وصل في ${pigeonChannel}\n📩 وأُرسل تنبيه في الخاص.`)
        ]
      });
    }

    if (interaction.isButton() && interaction.customId.startsWith('pigeon_read_')) {
      const recipientId = interaction.customId.replace('pigeon_read_', '');

      const isRecipient = interaction.user.id === recipientId;
      const isAdmin = await hasPermission(interaction.member, interaction.guild.id);

      if (!isRecipient && !isAdmin) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ هذه الرسالة ليست لك!\n\n> فقط **المُرسَل إليه** أو **الإدارة** يمكنهم قراءتها.')],
          ephemeral: true
        });
      }

      let pigeonData = await Pigeon.findOne({ guildId: interaction.guild.id, messageId: interaction.message.id });
      if (!pigeonData) {
        pigeonData = await Pigeon.findOne({ guildId: interaction.guild.id, recipientId }).sort({ createdAt: -1 });
      }

      if (!pigeonData) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لم أتمكن من العثور على محتوى الرسالة.')],
          ephemeral: true
        });
      }

      const sender = await client.users.fetch(pigeonData.senderId).catch(() => null);
      const recipient = await client.users.fetch(pigeonData.recipientId).catch(() => null);

      let readEmbed;
      if (isAdmin && !isRecipient) {
        readEmbed = new EmbedBuilder()
          .setTitle('📖 قراءة زاجل (عرض إداري)')
          .setDescription(
            `**📤 المُرسِل الحقيقي:** ${sender ? `${sender.tag} (\`${sender.id}\`)` : `<@${pigeonData.senderId}>`}\n` +
            `**📥 المُرسَل إليه:** ${recipient ? `${recipient.tag}` : `<@${pigeonData.recipientId}>`}\n` +
            `**📅 التاريخ:** <t:${Math.floor(pigeonData.createdAt.getTime() / 1000)}:F>\n` +
            `**📖 حالة القراءة:** ${pigeonData.read ? `✅ قُرئت <t:${Math.floor(pigeonData.readAt.getTime() / 1000)}:R>` : '🆕 جديدة'}\n\n` +
            `**📜 محتوى الرسالة:**\n\`\`\`\n${pigeonData.content}\n\`\`\``
          )
          .setColor(THEME.ORANGE)
          .setTimestamp()
          .setFooter({ text: '🛡️ عرض إداري - يظهر المُرسِل الحقيقي' });
        if (sender) readEmbed.setThumbnail(sender.displayAvatarURL());
      } else {
        readEmbed = new EmbedBuilder()
          .setTitle('📖 قراءة زاجل')
          .setDescription(
            `**📤 المُرسِل:** 🕵️ مجهول\n` +
            `**📥 المُرسَل إليه:** ${recipient ? `${recipient.tag}` : `<@${pigeonData.recipientId}>`}\n` +
            `**📅 التاريخ:** <t:${Math.floor(pigeonData.createdAt.getTime() / 1000)}:F>\n` +
            `**📖 حالة القراءة:** ${pigeonData.read ? `✅ قُرئت <t:${Math.floor(pigeonData.readAt.getTime() / 1000)}:R>` : '🆕 جديدة'}\n\n` +
            `**📜 محتوى الرسالة:**\n\`\`\`\n${pigeonData.content}\n\`\`\``
          )
          .setColor(THEME.ORANGE)
          .setTimestamp()
          .setFooter({ text: '🕊️ رسالة مجهولة المصدر' });
      }

      if (isRecipient && !pigeonData.read) {
        pigeonData.read = true;
        pigeonData.readAt = new Date();
        await pigeonData.save().catch(() => {});
      }

      return interaction.reply({ embeds: [readEmbed], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'pigeon_myhistory') {
      await interaction.deferReply({ ephemeral: true });

      const myId = interaction.user.id;
      const guildId = interaction.guild.id;

      const [sent, received] = await Promise.all([
        Pigeon.find({ guildId, senderId: myId }).sort({ createdAt: -1 }).limit(10),
        Pigeon.find({ guildId, recipientId: myId }).sort({ createdAt: -1 }).limit(10),
      ]);

      if (!sent.length && !received.length) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('📭 لا توجد زاجلات سابقة لك.')]
        });
      }

      let desc = '';

      if (received.length) {
        desc += '**📥 الزاجلات المُستلمة (آخر 10):**\n';
        for (const p of received) {
          const status = p.read ? '✅' : '🆕';
          desc += `${status} من **🕵️ مجهول** — <t:${Math.floor(p.createdAt.getTime() / 1000)}:R>\n`;
        }
        desc += '\n';
      }

      if (sent.length) {
        desc += '**📤 الزاجلات المُرسَلة (آخر 10):**\n';
        for (const p of sent) {
          const r = await client.users.fetch(p.recipientId).catch(() => null);
          const name = r ? r.tag : `<@${p.recipientId}>`;
          const status = p.read ? '✅ قُرئت' : '⏳ لم تُقرأ';
          desc += `${status} إلى **${name}** — <t:${Math.floor(p.createdAt.getTime() / 1000)}:R>\n`;
        }
        desc += '\n> 🔒 **ملاحظة:** هويتك مخفية عن المُرسَل إليهم.';
      }

      return interaction.editReply({
        embeds: [new EmbedBuilder()
          .setTitle('📜 سجل زاجلاتك')
          .setColor(THEME.ORANGE)
          .setDescription(desc.slice(0, 4000))
          .setTimestamp()
          .setFooter({ text: '🕊️ نظام الحمام الزاجل' })
        ]
      });
    }

    // ============================================================
    // ========== مودال الاقتراح ==========
    // ============================================================
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
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('suggest_desc')
              .setLabel('تفاصيل الاقتراح')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setMinLength(10)
              .setMaxLength(1000)
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
        return interaction.reply({ content: '⚠️ لم يتم تعيين قناة للاقتراحات.', ephemeral: true });
      }

      const channel = guild.channels.cache.get(config.suggestionsChannel);
      if (!channel) return interaction.reply({ content: '❌ قناة الاقتراحات غير موجودة.', ephemeral: true });

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

      logToChannel(guild.id, { title: '💡 اقتراح جديد', color: THEME.ORANGE, description: `**المستخدم:** ${interaction.user.tag}\n**العنوان:** ${title}`, footer: 'الاقتراحات' });
    }

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
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('comment_text').setLabel('التعليق').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(3).setMaxLength(500)
          ));
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

    // ============================================================
    // ========== ✅ معالجات التقديمات الديناميكية ==========
    // ============================================================

    // ✅ اختيار قسم من قائمة التقديمات
    if (interaction.isStringSelectMenu() && interaction.customId === 'apply_section_select') {
      const selected = interaction.values[0];

      // ✅ إعادة تعيين البانل
      if (selected === 'APPLY_RESET') {
        try {
          const config = await getGuildConfig(interaction.guild.id);
          const panel = await buildApplyPanel(interaction.guild.id, config);
          if (panel.empty || !panel.row) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لا توجد أقسام تقديم حالياً.')],
              ephemeral: true
            });
          }
          await interaction.message.delete().catch(() => {});
          await interaction.channel.send({ embeds: [panel.embed], components: [panel.row] });
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setTitle('🔄 تم إعادة التعيين')
              .setColor(THEME.ORANGE)
              .setDescription('تم إعادة إرسال قائمة التقديمات بنجاح.')
              .setTimestamp()
            ],
            ephemeral: true
          });
        } catch (err) {
          console.error('❌ خطأ في إعادة تعيين التقديمات:', err);
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل إعادة التعيين: ${err.message}`)],
            ephemeral: true
          });
        }
      }

      // ✅ اختيار قسم تقديم
      const section = await getApplySectionByName(interaction.guild.id, selected);
      if (!section) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ القسم غير موجود.')],
          ephemeral: true
        });
      }

      if (!section.questions.length) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`⚠️ قسم **${section.name}** لا يحتوي على أسئلة بعد.`)],
          ephemeral: true
        });
      }

      // ✅ بناء الـ Modal
      const modal = new ModalBuilder()
        .setCustomId(`apply_modal_${section.name.slice(0, 80)}`)
        .setTitle(`تقديم: ${section.name}`.slice(0, 45));

      const rows = [];
      for (let i = 0; i < Math.min(section.questions.length, 5); i++) {
        const q = section.questions[i];
        rows.push(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId(`q_${i}`)
              .setLabel(q.label.slice(0, 45))
              .setStyle(q.style === 'PARAGRAPH' ? TextInputStyle.Paragraph : TextInputStyle.Short)
              .setRequired(q.required !== false)
              .setMaxLength(q.style === 'PARAGRAPH' ? 1000 : 200)
          )
        );
      }
      modal.addComponents(...rows);

      return await interaction.showModal(modal);
    }

    // ✅ استقبال مودال التقديم
    if (interaction.isModalSubmit() && interaction.customId.startsWith('apply_modal_')) {
      const sectionName = interaction.customId.replace('apply_modal_', '');
      const guildId = interaction.guild.id;
      const config = await getGuildConfig(guildId);

      const section = await getApplySectionByName(guildId, sectionName);
      if (!section) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('❌ القسم غير موجود.')],
          ephemeral: true
        });
      }

      // ✅ جمع الإجابات
      const answers = [];
      for (let i = 0; i < Math.min(section.questions.length, 5); i++) {
        const q = section.questions[i];
        const answer = interaction.fields.getTextInputValue(`q_${i}`);
        answers.push({ question: q.label, answer });
      }

      // ✅ حفظ في الداتابيس
      await Application.create({
        guildId,
        userId: interaction.user.id,
        type: section.name,
        answers,
        status: 'pending',
      });

      // ✅ إرسال في روم لوق القسم
      if (section.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(section.logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTitle(`📋 تقديم جديد - ${section.emoji} ${section.name}`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor(THEME.BLACK)
            .setTimestamp()
            .setFooter({ text: `بواسطة ${interaction.user.tag}` });

          const fields = answers.map(a => ({
            name: a.question.slice(0, 250) || 'سؤال',
            value: `\`${(a.answer || 'لا يوجد').slice(0, 1020)}\``,
            inline: false
          }));

          fields.push({ name: '\u200B', value: '\u200B', inline: false });
          fields.push({ name: '👤 المستخدم', value: `${interaction.user} (\`${interaction.user.id}\`)`, inline: true });

          logEmbed.addFields(...fields);

          // ✅ صورة القسم إن وجدت
          if (section.image) logEmbed.setImage(section.image);

          await logChannel.send({ embeds: [logEmbed] }).catch(err => {
            console.error('❌ فشل إرسال التقديم للوق:', err);
          });
        }
      }

      // ✅ رد على العضو
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ تم إرسال تقديمك')
        .setDescription(
          `مرحباً ${interaction.user}!\n\n` +
          `تم استلام تقديمك لقسم **${section.emoji} ${section.name}** بنجاح.\n\n` +
          `> **عدد الأسئلة:** ${answers.length}\n` +
          `> **الحالة:** ⏳ في انتظار المراجعة\n\n` +
          `_سيتم إشعارك بنتيجة تقديمك في أقرب وقت._`
        )
        .setColor(THEME.ORANGE)
        .setTimestamp()
        .setFooter({ text: '📋 نظام التقديمات' });

      if (section.image) confirmEmbed.setImage(section.image);

      return interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
    }

    // ============================================================
    // ========== رتب الإشعارات (القديمة) ==========
    // ============================================================
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
    // ========== القائمة المنسدلة للرتب الذاتية (Toggle) ==========
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'self_roles_toggle') {
      await interaction.deferReply({ ephemeral: true });

      const selectedValue = interaction.values[0];

      if (selectedValue === 'SELF_ROLES_RESET') {
        try {
          const cfg = await getGuildConfig(interaction.guild.id);
          const panel = await buildSelfRolesPanel(interaction.guild.id, interaction.guild, cfg);
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
              embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription('⚠️ لا توجد رتب مسجلة حالياً.')]
            });
          }
        } catch (err) {
          console.error('❌ خطأ في إعادة تعيين القائمة:', err);
          return interaction.editReply({
            embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل إعادة التعيين: ${err.message}`)]
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

    // ============================================================
    // ========== ✅ قائمة التحكم في التذكرة ==========
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_control') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ هذه القائمة للمتحكمين فقط!', ephemeral: true });
      }

      const action = interaction.values[0];
      const channel = interaction.channel;
      const ticketData = await getTicketByChannel(interaction.guild.id, channel.id);

      if (!ticketData) {
        return interaction.reply({ content: '❌ لم أجد بيانات هذه التذكرة.', ephemeral: true });
      }

      if (action === 'claim') {
        if (ticketData.claimedBy) {
          return interaction.reply({ content: `⚠️ هذه التذكرة مستلمة بالفعل من <@${ticketData.claimedBy}>`, ephemeral: true });
        }
        ticketData.claimedBy = interaction.user.id;
        ticketData.claimedAt = new Date();
        await ticketData.save();

        await channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✋ **${interaction.user}** استلم هذه التذكرة.`).setTimestamp()] });
        logToChannel(interaction.guild.id, { title: '✋ استلام تذكرة', color: THEME.ORANGE, description: `**المتحكم:** ${interaction.user.tag}\n**التذكرة:** ${channel.name}`, footer: 'نظام التذاكر' });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم استلام التذكرة بنجاح!`)],
          ephemeral: true
        });
      }

      if (action === 'unclaim') {
        if (!ticketData.claimedBy) {
          return interaction.reply({ content: '⚠️ هذه التذكرة غير مستلمة من أحد.', ephemeral: true });
        }
        const oldClaimer = ticketData.claimedBy;
        ticketData.claimedBy = null;
        ticketData.claimedAt = null;
        await ticketData.save();

        await channel.send({ embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`📌 **${interaction.user}** ألغى مطالبة <@${oldClaimer}> بهذه التذكرة.`).setTimestamp()] });
        logToChannel(interaction.guild.id, { title: '📌 إلغاء مطالبة', color: THEME.BLACK, description: `**المتحكم:** ${interaction.user.tag}\n**المطالب السابق:** <@${oldClaimer}>`, footer: 'نظام التذاكر' });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم إلغاء المطالبة بنجاح.`)],
          ephemeral: true
        });
      }

      if (action === 'add_member') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_add_member_modal')
          .setTitle('👤 إضافة عضو للتذكرة')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('member_query').setLabel('اسم المستخدم أو الآيدي').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('مثال: ahmed_2001')
          ));
        return await interaction.showModal(modal);
      }

      if (action === 'rename') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_rename_modal')
          .setTitle('✏️ تغيير اسم التذكرة')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('new_name').setLabel('الاسم الجديد').setStyle(TextInputStyle.Short).setRequired(true).setMinLength(2).setMaxLength(90).setValue(channel.name)
          ));
        return await interaction.showModal(modal);
      }

      if (action === 'delete') {
        const modal = new ModalBuilder()
          .setCustomId('ticket_delete_confirm_modal')
          .setTitle('🗑️ تأكيد حذف التذكرة')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('confirm_text').setLabel('اكتب "حذف" للتأكيد').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('حذف')
          ));
        return await interaction.showModal(modal);
      }
    }

    // إضافة عضو
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_add_member_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      }

      const query = interaction.fields.getTextInputValue('member_query');
      const target = await findMemberByName(interaction.guild, query);

      if (!target) {
        return interaction.reply({ content: `❌ لم أتمكن من العثور على العضو: **${query}**`, ephemeral: true });
      }

      try {
        await interaction.channel.permissionOverwrites.create(target.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });

        const ticketData = await getTicketByChannel(interaction.guild.id, interaction.channel.id);
        if (ticketData && !ticketData.addedMembers.includes(target.id)) {
          ticketData.addedMembers.push(target.id);
          await ticketData.save();
        }

        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`👤 **${interaction.user}** أضاف ${target} إلى هذه التذكرة.`).setTimestamp()] });
        logToChannel(interaction.guild.id, { title: '👤 إضافة عضو للتذكرة', color: THEME.ORANGE, description: `**المتحكم:** ${interaction.user.tag}\n**العضو المُضاف:** ${target.user.tag}\n**التذكرة:** ${interaction.channel.name}`, footer: 'نظام التذاكر' });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم إضافة **${target.user.tag}** للتذكرة.`)],
          ephemeral: true
        });
      } catch (err) {
        console.error('❌ خطأ في إضافة عضو:', err);
        return interaction.reply({ content: `❌ فشل إضافة العضو: ${err.message}`, ephemeral: true });
      }
    }

    // تغيير اسم التذكرة
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_rename_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      }

      const newName = interaction.fields.getTextInputValue('new_name');
      const oldName = interaction.channel.name;

      try {
        const safeName = sanitizeChannelName(newName);
        await interaction.channel.setName(safeName);

        await interaction.channel.send({ embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✏️ **${interaction.user}** غيّر اسم التذكرة من **${oldName}** إلى **${safeName}**`).setTimestamp()] });
        logToChannel(interaction.guild.id, { title: '✏️ تغيير اسم تذكرة', color: THEME.ORANGE, description: `**المتحكم:** ${interaction.user.tag}\n**القديم:** ${oldName}\n**الجديد:** ${safeName}`, footer: 'نظام التذاكر' });

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(THEME.ORANGE).setDescription(`✅ تم تغيير اسم التذكرة إلى **${safeName}**`)],
          ephemeral: true
        });
      } catch (err) {
        console.error('❌ خطأ في تغيير الاسم:', err);
        return interaction.reply({ content: `❌ فشل تغيير الاسم: ${err.message}`, ephemeral: true });
      }
    }

    // تأكيد حذف التذكرة
    if (interaction.isModalSubmit() && interaction.customId === 'ticket_delete_confirm_modal') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ هذه الميزة للمتحكمين فقط.', ephemeral: true });
      }

      const confirmText = interaction.fields.getTextInputValue('confirm_text').trim();
      if (confirmText !== 'حذف') {
        return interaction.reply({ content: '❌ يجب كتابة "حذف" بالضبط للتأكيد.', ephemeral: true });
      }

      const channelName = interaction.channel.name;

      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`🗑️ جاري حذف التذكرة...`)],
        ephemeral: true
      });

      logToChannel(interaction.guild.id, { title: '🗑️ حذف تذكرة', color: THEME.BLACK, description: `**المتحكم:** ${interaction.user.tag}\n**التذكرة:** ${channelName}`, footer: 'نظام التذاكر' });

      setTimeout(async () => {
        await interaction.channel.delete().catch(() => {});
      }, 2000);
      return;
    }

    // ============================================================
    // ========== زر تغيير الاسم ==========
    // ============================================================
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
    // ========== زر إغلاق التذكرة (للمتحكمين فقط) ==========
    // ============================================================
    if (interaction.isButton() && interaction.customId === 'close_ticket') {
      if (!(await hasPermission(interaction.member, interaction.guild.id))) {
        return interaction.reply({ content: '❌ إغلاق التذاكر متاح للمتحكمين فقط!', ephemeral: true });
      }

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
            { guildId: interaction.guild.id, userId: ticketOwnerId, closedBy: interaction.user.id, section: sectionName, ticketId: channel.id },
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
              `نرجو منك تقييم جودة الخدمة.\n\n` +
              `**⭐ = سيء جداً**\n` +
              `**⭐⭐⭐⭐⭐ = ممتاز**`
            )
            .setColor(THEME.ORANGE)
            .setThumbnail(interaction.guild.iconURL() || null)
            .setTimestamp()
            .setFooter({ text: `تذكرة ${sectionName} • ${interaction.guild.name}` });

          const ratingRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`rate_ticket_1_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`rate_ticket_2_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`rate_ticket_3_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`rate_ticket_4_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`rate_ticket_5_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Success)
          );

          const commentRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`rate_ticket_comment_${ticketOwnerId}_${channel.id}_${interaction.guild.id}`).setLabel('💬 إضافة تعليق (اختياري)').setStyle(ButtonStyle.Primary)
          );

          await owner.send({ embeds: [ratingEmbed], components: [ratingRow, commentRow] }).catch(() => {});
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

      await Ticket.findOneAndUpdate({ guildId: interaction.guild.id, channelId: channel.id }, { status: 'closed' }).catch(() => {});

      await interaction.reply({ content: '🔒 جاري إغلاق التذكرة...', ephemeral: true });

      setTimeout(async () => {
        await channel.delete().catch(() => {});
      }, 3000);
    }

    // ============================================================
    // ========== معالج أزرار التقييم ==========
    // ============================================================
    if (interaction.isButton() && interaction.customId.startsWith('rate_ticket_')) {
      const parts = interaction.customId.split('_');
      const isComment = parts[2] === 'comment';
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];
      const rating = isComment ? null : parseInt(parts[2]);

      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: '❌ هذا التقييم ليس لك.', ephemeral: true });
      }

      if (isComment) {
        const modal = new ModalBuilder()
          .setCustomId(`ticket_comment_modal_${ownerId}_${channelId}_${guildId}`)
          .setTitle('💬 إضافة تعليق على التذكرة')
          .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('ticket_comment_text').setLabel('تعليقك').setStyle(TextInputStyle.Paragraph).setRequired(true).setMinLength(3).setMaxLength(500)
          ));
        return await interaction.showModal(modal);
      }

      if (rating >= 1 && rating <= 5) {
        await TicketRating.findOneAndUpdate(
          { guildId, ticketId: channelId },
          { guildId, userId: ownerId, ticketId: channelId, rating },
          { upsert: true, new: true }
        );

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

              await ratingChannel.send({ embeds: [ratingLogEmbed] }).catch(() => {});
            }
          }
        } catch (e) {
          console.error('❌ خطأ في إرسال التقييم:', e);
        }

        const stars = '⭐'.repeat(rating);
        const thanksEmbed = new EmbedBuilder()
          .setTitle('✅ شكراً لتقييمك!')
          .setDescription(`تم تسجيل تقييمك: ${stars} (${rating}/5)\n\nنقدر وقتك ونسعى دائماً لتحسين خدماتنا. 💙`)
          .setColor(THEME.ORANGE)
          .setTimestamp();

        return interaction.update({ embeds: [thanksEmbed], components: [] });
      }

      return interaction.reply({ content: '❌ تقييم غير صالح.', ephemeral: true });
    }

    // معالج مودال تعليق التقييم
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_comment_modal_')) {
      const parts = interaction.customId.split('_');
      const ownerId = parts[3];
      const channelId = parts[4];
      const guildId = parts[5];

      if (interaction.user.id !== ownerId) {
        return interaction.reply({ content: '❌ هذا التقييم ليس لك.', ephemeral: true });
      }

      const comment = interaction.fields.getTextInputValue('ticket_comment_text');

      await TicketRating.findOneAndUpdate(
        { guildId, ticketId: channelId },
        { guildId, userId: ownerId, ticketId: channelId, comment },
        { upsert: true, new: true }
      );

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

      return interaction.reply({ embeds: [thanksEmbed], ephemeral: true });
    }

    // مودال تغيير الاسم
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

    // مودال التعليق على الاقتراح
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

    // ============================================================
    // ========== قائمة التذاكر (إنشاء تذكرة) ==========
    // ============================================================
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_menu') {
      await interaction.deferReply({ ephemeral: true });
      const selected = interaction.values[0];

      // ✅ إعادة تعيين البانل
      if (selected === 'TICKET_RESET') {
        try {
          const settings = await getTicketSettings(interaction.guild.id);
          const cfg = await getGuildConfig(interaction.guild.id);
          const generalImg = getGeneralImage(interaction.guild, cfg);
          const imageUrl = settings.image || 'https://i.imgur.com/GkKqN3G.png';
          const embed = new EmbedBuilder().setTitle('🎫 تذاكر دعم فني').setDescription(settings.text).setColor(THEME.ORANGE).setImage(imageUrl).setFooter({ text: 'سيتم إنشاء قناة خاصة بك.' });
          if (generalImg) embed.setThumbnail(generalImg);

          const options = settings.sections.map(s => {
            const opt = { label: s.name, value: s.name };
            const parsedEmoji = parseEmoji(s.emoji);
            if (parsedEmoji) opt.emoji = parsedEmoji;
            else opt.emoji = '📌';
            return opt;
          });
          options.push({ label: 'إعادة تعيين', value: 'TICKET_RESET', emoji: '🔄', description: 'إعادة إرسال قائمة التذاكر' });

          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('ticket_menu').setPlaceholder('📌 اختر القسم...').addOptions(options)
          );

          await interaction.message.delete().catch(() => {});
          await interaction.channel.send({ embeds: [embed], components: [row] });
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setTitle('🔄 تم إعادة التعيين')
              .setColor(THEME.ORANGE)
              .setDescription('تم إعادة إرسال قائمة التذاكر بنجاح.')
              .setTimestamp()
            ]
          });
        } catch (err) {
          console.error('❌ خطأ في إعادة تعيين التذاكر:', err);
          return interaction.editReply({
            embeds: [new EmbedBuilder().setColor(THEME.BLACK).setDescription(`❌ فشل إعادة التعيين: ${err.message}`)]
          });
        }
      }

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

        await Ticket.create({
          guildId: guild.id,
          channelId: channel.id,
          ownerId: member.id,
          sectionName: selected,
          status: 'open',
        });

        const embed = new EmbedBuilder()
          .setTitle(`🎫 تذكرة - ${selected}`)
          .setDescription(`مرحباً ${member}!\n\n**📌 القسم:** ${selected}\n**👤 صاحب التذكرة:** ${member}\n**📅 التاريخ:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n> يرجى شرح مشكلتك بالتفصيل، سيرد عليك فريق الدعم في أقرب وقت.`)
          .setColor(THEME.ORANGE)
          .setTimestamp()
          .setFooter({ text: '🔒 الإغلاق متاح للمتحكمين فقط' });

        if (generalImage) embed.setThumbnail(generalImage);

        let mention = section.roleId ? `<@&${section.roleId}>` : '';

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 إغلاق التذكرة').setStyle(ButtonStyle.Danger)
        );

        const controlRow = buildTicketControlRow();

        await channel.send({
          content: `${member} ${mention}`.trim(),
          embeds: [embed],
          components: [closeRow, controlRow]
        });

        // ❌ لا يوجد DM هنا (تم إلغاؤه بناءً على طلبك)

        if (config.ticketLogChannel) {
          const logCh = guild.channels.cache.get(config.ticketLogChannel);
          if (logCh) {
            const logEmbed = new EmbedBuilder()
              .setTitle('📥 تذكرة جديدة')
              .setColor(THEME.ORANGE)
              .setThumbnail(member.user.displayAvatarURL())
              .addFields(
                { name: '👤 صاحب التذكرة', value: `${member} (\`${member.user.tag}\`)`, inline: true },
                { name: '📌 القسم', value: selected, inline: true },
                { name: '📅 التاريخ', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '🔗 الرابط', value: `${channel}`, inline: false }
              )
              .setTimestamp()
              .setFooter({ text: 'نظام استلام التذاكر' });
            await logCh.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }

        logToChannel(guild.id, {
          title: '🎫 فتح تذكرة',
          color: THEME.ORANGE,
          description: `**${member.user.tag}** فتح تذكرة في قسم **${selected}**\n**القناة:** ${channel}`
        });

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
