const { command } = require('../utils')

module.exports = class Config extends command {
    constructor (name, client) {
        super (name, client)
        this.aliases = ['configurar']
    }
    async run ({message, args, prefix, usuario, servidor}, t) {
        if(!(await this.client.verPerm(['MANAGE_GUILD', 'owner', 'subowner', 'operator'], message.member, usuario))) return message.channel.send(t('comandos:config.noPermission'));
        var configs = ['prefix']
        if(args[0] && configs.includes(args[0].toLowerCase())) {
            var config = args[0].toLowerCase()
            if(config === 'prefix') {
                if(!args[1]) return message.channel.send(t('comandos:config.prefix.noArgs'))
                var newPrefix = args[1]
                if(newPrefix.length > 4) return message.channel.send(t('comandos:config.prefix.bigPrefix'))
                servidor.prefix = newPrefix
                servidor.save()
                message.channel.send(t('comandos:config.prefix.defined', { prefix: newPrefix }))
            }
        } else {
            var embed = new this.client.Discord.RichEmbed()
                .setTitle(t('comandos:config.howToUse'))
                .setDescription(`${prefix}config prefix <new-prefix>`)
                .setThumbnail('https://i.imgur.com/b4fhI15.png')
                .setTimestamp(new Date())
                .setFooter(message.author.username, message.author.displayAvatarURL)
                .setColor(2631906)
            message.channel.send(embed)
        }
    }
}