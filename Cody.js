const { Client, Collection } = require('discord.js')
const { readdirSync, statSync } = require('fs')
module.exports = class Cody extends Client {
    constructor (options = {}) {
        super (options)
        this.fs = require('fs')
        this.commands = new Collection()
        this.Discord = require('discord.js')
        this.DBL = require("dblapi.js");
        this.dbl = new this.DBL(process.env.dbl, this);
        this.database = require('./database.js')
        this.config = require('./global.json')
        this.i18next = require('i18next')
        this.translationBackend = require('i18next-node-fs-backend')
        this.moment = require('moment')
        require('moment-duration-format')
        this.ms = require('ms')
        this.setGameTime = Date.now()
        this.regionsLang = {
            'sydney': 'en-US',
            'us-south': 'en-US',
            'us-west': 'en-US',
            'us-central': 'en-US',
            'us-east': 'en-US',
            'brazil': 'pt-BR'
        }
        this.dataStaff = new Map()
            .set('owner', [])
            .set('subowner', [])
            .set('operator', [])
            .set('developer', [])
            .set('supervisor', [])
            .set('designer', [])
            .set('lastUpdate', Date.now())
        this.guildsAlt = {
            size: async () => {
                let servidores = await this.shard.fetchClientValues('guilds.size');
                return servidores.reduce((a, b) => a + b, 0);
            }
        }
        this.usersAlt = {
            size: async () => {
                let usuarios = await this.shard.fetchClientValues('users.size');
                return usuarios.reduce((a, b) => a + b, 0);
            }
        }
        this.channelsAlt = {
            size: async () => {
                let canais = await this.shard.fetchClientValues('channels.size');
                return canais.reduce((a, b) => a + b, 0);
            }
        }
        this.initializeEvents('./events')
        this.initializeCommands('./commands')
    }
    async shardLog (cnt) {
        cnt = `Shard ${this.shard.id + 1}: ${cnt}`
        console.log(cnt)
        return cnt;
    }
    async firstUpperLetter (str) {
        if(!str) return 'no string';
        return str[0].toUpperCase() + str.slice(1);
    }
    async setDataStaff () {
        this.database.Users.find({}).then(async users => {
            users.forEach(async user => {
                let roles = ['owner', 'subowner', 'operator', 'developer', 'supervisor', 'designer']
                if((await this.verPerm(roles, false, user))) {
                    roles.forEach(async role => {
                        if(user.cargos.get(role) && !this.dataStaff.get(role).includes(user._id)) {
                            !this.dataStaff.get(role).push(user._id)
                        } else if(!user.cargos.get(role) && this.dataStaff.get(role).includes(user._id)) {
                            this.dataStaff.get(role).splice(this.dataStaff.get(role).indexOf(user._id), 1)
                        }
                    })
                }
            })
        })
        this.dataStaff.set('lastUpdate', Date.now())
    }
    async newDocDB (doc) {
        if(doc.type === 1) {
            if(doc.content.bot) return;
            let usuario = new this.database.Users({
                _id: doc.id,
                banned: { ban: false, tempban: false, time: 0 },
                cargos: { owner: false, subowner: false, operator: false, developer: false, supervisor: false, designer: false },
                vip: false,
                cmdcoldown: '0000000000000'
            })
            usuario.save()
        } else if(doc.type === 2) {
            let servidor = new this.database.Guilds({
                _id: doc.id,
                lang: this.regionsLang[doc.content.region] ? this.regionsLang[doc.content.region] : 'pt-BR',
                prefix: this.user.id === this.config.canaryID ? 'c.' : 'c!',
                concierge: { welcome: { on: false, message: 'None', channel: 'None' }, byebye: { on: false, message: 'None', channel: 'None' } },
                autorole: { on: false, idRoles: [] },
                sugest: { on: false, channel: 'None', type: 0},
                config: { vipMessages: true },
                muteds: [],
                lockedChannels: []
            })
            servidor.save()
        } else if(doc.type === 3) {
            let comando = new this.database.Commands({
                _id: doc.id,
                maintenance: false
            })
            comando.save()
        } else if(doc.type === 4) {
            let formulario = new this.database.Forms({
                _id: doc.id,
                user: doc.user,
                role: doc.role,
                reason: doc.reason,
                date: Date.now()
            })
            formulario.save()
        }
    }
    async setGame (content) {
        if((Date.now() - this.setGameTime) >= 240000 || content.force) {
            if(content.random) {
                let playing = ['Minecraft', 'GTA V', 'Dead Cells', 'https://discord.gg/5Xt3uHF', 'Vote em mim e adquira vários benefícios: https://discordbots.org/bot/507292506942210048/vote']
                let streaming = [`Night Core - ${await this.usersAlt.size()} usuários em ${await this.guildsAlt.size()} servidores com ${await this.channelsAlt.size()} canais.`]
                let listening = ['Spotify.', `${await this.usersAlt.size()} usuários fazerem suas coisas.`]
                let watching = ['animes.', 'Netflix.']
                let randomGames = [{
                    content: playing[Math.round(Math.random() * (playing.length - 1))],
                    type: 0,
                    url: 'https://www.twitch.tv/zmarciogod'
                }, {
                    content: streaming[Math.round(Math.random() * (streaming.length - 1))],
                    type: 1,
                    url: false
                }, {
                    content: listening[Math.round(Math.random() * (listening.length - 1))],
                    type: 2,
                    url: false
                }, {
                    content: watching[Math.round(Math.random() * (watching.length - 1))],
                    type: 3,
                    url: false
                }]
                if(this.user.presence.game && randomGames.find(game => game.content === this.user.presence.game.name)) {
                    for(let i = 0; i < randomGames.length - 1; i++) {
                        if(randomGames[i].content === this.user.presence.game.name) {
                            randomGames.splice(i, 1)
                        }
                    }
                }
                let random = randomGames[Math.round(Math.random() * (randomGames.length - 1))]
                if(random.url) {
                    this.user.setPresence({ game: { name: random.content, type: random.type, url: random.url } });
                } else {
                    this.user.setPresence({ game: { name: random.content, type: random.type } });
                }
                this.setGameTime = Date.now()
            } else {
                if(content.url) {
                    this.user.setPresence({ game: { name: content.txt, type: content.type, url: content.url } });
                } else {
                    this.user.setPresence({ game: { name: content.txt, type: content.type } });
                }
            }
        }
    }
    async verPerm (prm, userDC, userDB) {
        if(userDB._id === this.config.ownerID || userDC.id === this.config.ownerID) return true;
        let dcPerms = ['CREATE_INSTANT_INVITE', 'KICK_MEMBERS', 'BAN_MEMBERS', 'ADMINISTRATOR', 'MANAGE_CHANNELS', 'MANAGE_GUILD', 'ADD_REACTIONS', 'READ_MESSAGES', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'EXTERNAL_EMOJIS', 'CONNECT', 'SPEAK', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'USE_VAD', 'CHANGE_NICKNAME', 'MANAGE_NICKNAMES', 'MANAGE_ROLES_OR_PERMISSIONS', 'MANAGE_WEBHOOKS', 'MANAGE_EMOJIS']
        if(!prm) return false;
        if(!userDB && !userDC) return false;
        let possui = false
        prm.forEach(perm => {
            if(possui) return;
            if(!dcPerms.includes(perm)) {
                if(userDB.cargos.get(perm)) { possui = true }
            } else {
                if(userDC.hasPermission([perm])) { possui = true }
            }
        })
        return possui;
    }
    initializeCommands (path) {
        readdirSync(path).forEach(file => {
            try {
                const filePath = path + '/' + file
                if (file.endsWith('.js')) {
                    const Command = require(filePath)
                    const commandName = file.replace(/.js/g,'').toLowerCase()
                    const command = new Command(commandName, this)
                    this.commands.set(commandName, command)
                } else if (statSync(filePath).isDirectory()) {
                    this.initializeCommands(filePath)
                }
            } catch (error) {
                console.log(error)
            }
        })
    }
    initializeEvents (path) {
        readdirSync(path).forEach(file => {
            try {
                let filePath = path + '/' + file
                if (file.endsWith('.js')) {
                    let Listener = require(filePath)
                    this.on(file.replace(/.js/g, ''), Listener)
                } else if (statSync(filePath).isDirectory()) {
                    this.initializeEvents(filePath)
                }
            } catch (error) {
                console.log(error)
            }
        })
    }
}
