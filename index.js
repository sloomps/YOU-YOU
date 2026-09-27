// ============================================================
//  index.js — Discord Bot | Advanced Welcome System
//  VANTA for WORM 🖤
//  Node 18+ | discord.js v14
//  npm i discord.js @discordjs/rest discord-api-types
// ============================================================

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActivityType,
} = require('discord.js');

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const fs = require('fs');
const path = require('path');

// ------------------------------------------------------------
//  CONFIG — عدّل هاي القيم بس
// ------------------------------------------------------------
const CONFIG = {
  token: process.env.DISCORD_TOKEN || 'ضع_التوكن_هنا',
  clientId: process.env.CLIENT_ID || 'ضع_الايدي_هنا',
  guildId: process.env.GUILD_ID || 'ضع_ايدي_السيرفر_هنا', // خليه فاضي '' للنشر العام
  dataFile: path.join(__dirname, 'welcome-data.json'),
};

// ------------------------------------------------------------
//  STORAGE — حفظ/قراءة إعدادات كل سيرفر
// ------------------------------------------------------------
function loadData() {
  try {
    if (!fs.existsSync(CONFIG.dataFile)) return {};
    return JSON.parse(fs.readFileSync(CONFIG.dataFile, 'utf8'));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(CONFIG.dataFile, JSON.stringify(data, null, 2));
}

let store = loadData();

function getGuild(guildId) {
  if (!store[guildId]) {
    store[guildId] = {
      channelId: null,
      message: 'أهلاً {user} في {server}! 🖤',
      title: 'عضو جديد',
      image: null,
      color: '#8B0000',
      embed: true,
    };
  }
  return store[guildId];
}

// ------------------------------------------------------------
//  TEMPLATE ENGINE — {user} {server} {count} {tag}
// ------------------------------------------------------------
function render(template, member) {
  return template
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{tag}/g, member.user.tag)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{count}/g, member.guild.memberCount);
}

// ------------------------------------------------------------
//  CLIENT
// ------------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember, Partials.User, Partials.Channel],
});

// ------------------------------------------------------------
//  SLASH COMMANDS DEFINITION
// ------------------------------------------------------------
const commands = [
  new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('إعدادات نظام الترحيب')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription('تحديد قناة الترحيب')
        .addChannelOption((opt) =>
          opt
            .setName('channel')
            .setDescription('القناة')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('message')
        .setDescription('تعديل نص الترحيب')
        .addStringOption((opt) =>
          opt
            .setName('text')
            .setDescription('استخدم {user} {server} {count} {tag}')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('title')
        .setDescription('عنوان الإيمبد')
        .addStringOption((opt) => opt.setName('text').setDescription('العنوان').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('image')
        .setDescription('تعيين صورة الترحيب')
        .addStringOption((opt) =>
          opt.setName('url').setDescription('رابط الصورة المباشر').setRequired(false)
        )
        .addAttachmentOption((opt) =>
          opt.setName('file').setDescription('أو ارفع صورة').setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('color')
        .setDescription('لون الإيمبد')
        .addStringOption((opt) =>
          opt.setName('hex').setDescription('مثال: #8B0000').setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('تشغيل/إيقاف استخدام الإيمبد')
        .addBooleanOption((opt) => opt.setName('embed').setDescription('embed on/off').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('test').setDescription('تجربة رسالة الترحيب الآن'))
    .addSubcommand((sub) => sub.setName('show').setDescription('عرض الإعدادات الحالية'))
    .addSubcommand((sub) => sub.setName('reset').setDescription('إعادة ضبط الإعدادات')),
].map((c) => c.toJSON());

// ------------------------------------------------------------
//  REGISTER COMMANDS
// ------------------------------------------------------------
client.once('ready', async () => {
  console.log(`🖤 VANTA online as ${client.user.tag}`);

  client.user.setActivity('over WORM', { type: ActivityType.Watching });

  const rest = new REST({ version: '10' }).setToken(CONFIG.token);
  try {
    if (CONFIG.guildId) {
      await rest.put(Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId), {
        body: commands,
      });
      console.log('✅ Slash commands registered (guild).');
    } else {
      await rest.put(Routes.applicationCommands(CONFIG.clientId), { body: commands });
      console.log('✅ Slash commands registered (global — may take up to 1h).');
    }
  } catch (err) {
    console.error('❌ Command registration failed:', err);
  }
});

// ------------------------------------------------------------
//  WELCOME BUILDER
// ------------------------------------------------------------
function buildWelcome(member, cfg) {
  const text = render(cfg.message, member);
  const title = render(cfg.title || '', member);

  if (!cfg.embed) {
    return { content: text, files: cfg.image ? [cfg.image] : [] };
  }

  const embed = new EmbedBuilder()
    .setTitle(title || null)
    .setDescription(text)
    .setColor(cfg.color || '#8B0000')
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
    .setFooter({ text: `${member.guild.name} • عضو #${member.guild.memberCount}` })
    .setTimestamp();

  if (cfg.image) embed.setImage(cfg.image);

  return { embeds: [embed] };
}

// ------------------------------------------------------------
//  GUILD MEMBER ADD
// ------------------------------------------------------------
client.on('guildMemberAdd', async (member) => {
  const cfg = getGuild(member.guild.id);
  if (!cfg.channelId) return;

  const channel = member.guild.channels.cache.get(cfg.channelId);
  if (!channel || !channel.isTextBased()) return;

  try {
    await channel.send(buildWelcome(member, cfg));
  } catch (err) {
    console.error('❌ Welcome send failed:', err);
  }
});

// ------------------------------------------------------------
//  INTERACTIONS
// ------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'welcome') return;

  const sub = interaction.options.getSubcommand();
  const cfg = getGuild(interaction.guild.id);
  const ok = (msg) =>
    interaction.reply({ content: msg, ephemeral: true });

  try {
    switch (sub) {
      case 'set': {
        const ch = interaction.options.getChannel('channel');
        cfg.channelId = ch.id;
        saveData(store);
        return ok(`✅ قناة الترحيب: <#${ch.id}>`);
      }

      case 'message': {
        cfg.message = interaction.options.getString('text');
        saveData(store);
        return ok(`✅ تم تحديث نص الترحيب.`);
      }

      case 'title': {
        cfg.title = interaction.options.getString('text');
        saveData(store);
        return ok(`✅ تم تحديث العنوان.`);
      }

      case 'image': {
        const url = interaction.options.getString('url');
        const file = interaction.options.getAttachment('file');
        if (!url && !file) return ok('⚠️ حدد رابط أو ارفع صورة.');
        cfg.image = url || file.url;
        saveData(store);
        return ok(`✅ تم تعيين الصورة.`);
      }

      case 'color': {
        const hex = interaction.options.getString('hex');
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return ok('⚠️ صيغة اللون غلط. مثال: #8B0000');
        cfg.color = hex;
        saveData(store);
        return ok(`✅ اللون: ${hex}`);
      }

      case 'toggle': {
        cfg.embed = interaction.options.getBoolean('embed');
        saveData(store);
        return ok(`✅ الإيمبد: ${cfg.embed ? 'مفعّل' : 'معطّل'}`);
      }

      case 'test': {
        if (!cfg.channelId) return ok('⚠️ ما في قناة محددة. استخدم /welcome set أول.');
        const channel = interaction.guild.channels.cache.get(cfg.channelId);
        if (!channel) return ok('⚠️ القناة غير موجودة.');
        await channel.send(buildWelcome(interaction.member, cfg));
        return ok('✅ تم إرسال رسالة تجريبية.');
      }

      case 'show': {
        const ch = cfg.channelId ? `<#${cfg.channelId}>` : 'غير محدد';
        const embed = new EmbedBuilder()
          .setTitle('⚙️ إعدادات الترحيب')
          .setColor(cfg.color || '#8B0000')
          .addFields(
            { name: 'القناة', value: ch, inline: false },
            { name: 'العنوان', value: cfg.title || '—', inline: false },
            { name: 'النص', value: cfg.message, inline: false },
            { name: 'الصورة', value: cfg.image ? '[رابط]' : 'غير محددة', inline: true },
            { name: 'اللون', value: cfg.color, inline: true },
            { name: 'إيمبد', value: cfg.embed ? 'مفعّل' : 'معطّل', inline: true }
          )
          .setImage(cfg.image || null);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      case 'reset': {
        store[interaction.guild.id] = {
          channelId: null,
          message: 'أهلاً {user} في {server}! 🖤',
          title: 'عضو جديد',
          image: null,
          color: '#8B0000',
          embed: true,
        };
        saveData(store);
        return ok('✅ تم إعادة الضبط.');
      }
    }
  } catch (err) {
    console.error('❌ Interaction error:', err);
    if (!interaction.replied) {
      interaction.reply({ content: '❌ صار خطأ.', ephemeral: true }).catch(() => {});
    }
  }
});

// ------------------------------------------------------------
//  ERROR GUARDS
// ------------------------------------------------------------
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

// ------------------------------------------------------------
//  LOGIN
// ------------------------------------------------------------
client.login(CONFIG.token);
