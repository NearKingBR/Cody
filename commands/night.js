
exports.run = async(message, args) => {
    if(!message.member.roles.get('555606582432628746')) return message.channel.send(`😒 ${message.member}, você **não** pode **enviar anúncios**.`)
    if(!args[0]) return message.channel.send(`🙄 Você **deve** inserir **alguma mensagem** para ser **enviada** aos usuários.\n**Como usar:** \`tk!avisar <link opcional> <mensagem>\`\nVocê também **pode** enviar o **arquivo da imagem**.`)
    let link = args[0].startsWith('http') ? args[0] : message.attachments.first() ? message.attachments.first().url : false
    let attach = message.attachments.first() ? true : false
    let mensagem = link ? attach ? args.join(' ') : args.slice(1).join(' ') : args.join(' ')
    let membrosDB = await database.Users.find({})
    let membros = await message.guild.members.filter(member => member)
    let embed = new Discord.RichEmbed()
        .setTitle(message.guild.name)
        .setDescription(mensagem)
        .setTimestamp(new Date())
        .setFooter(`Enviada por: ${message.author.tag}`, message.author.avatarURL)
        .setColor('RANDOM')
    if(link) {
        embed.setImage(link)
    }
    message.channel.send(`🙄 Esta mensagem **será enviada** para **${membros.size} usuários**, tem **certeza** que deseja **envia-la**?`, embed).then(async msg => {
        await msg.react('✅')
        await msg.react('❌')
        const confirmar = msg.createReactionCollector((r, u) => r.emoji.name === "✅" && u.id === message.author.id, { time: 60000 });
        const cancelar = msg.createReactionCollector((r, u) => r.emoji.name === "❌" && u.id === message.author.id, { time: 60000 });
        confirmar.on('collect', async r => {
            msg.delete().catch(e => {})
            message.delete().catch(e => {})
            await membros.forEach(async member => {
                member.send(embed).catch(e => {})
                if(!membrosDB.find(member2 => member2._id === member.id)) {
                    newDocDB({id: member.user.id})
                }
            })
            message.channel.send(`✅ ${message.member}, seu anúncio **foi enviado** com **sucesso**.`)
            cancelar.emit('end')
        })
        cancelar.on('collect', async r => {
            msg.delete().catch(e => {})
            message.delete().catch(e => {})
            cancelar.emit('end')
        })
        cancelar.on('end', async r => {
            msg.delete().catch(e => {})
            message.delete().catch(e => {})
        })
    })
}
