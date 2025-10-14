import FormData from 'form-data' // form-data v4.0.1
import Mailgun from 'mailgun.js' // mailgun.js v11.1.0
// @ts-ignore - no types available for this internal module
import MailComposer from 'nodemailer/lib/mail-composer/index.js'

interface User {
    username: string
    email: string
    userId: string
}

interface SendMessageParams {
    user: User
    token_id: string
}

// TODO: test after paying - currently can only send email to approved users (lol)
async function sendMessage({ user, token_id }: SendMessageParams): Promise<void> {
    const mailgun = new Mailgun(FormData)
    const mg = mailgun.client({
        username: 'api',
        key: process.env.MAILGUN_KEY!,
        // When you have an EU-domain, you must specify the endpoint:
        // url: "https://api.eu.mailgun.net/v3"
    })
    try {
        const { username, email, userId } = user
        const mail = new MailComposer({
            from: `Mailgun Sandbox <postmaster@${process.env.MAILGUN_DOMAIN}>`,
            to: [`${username} <${email}>`],
            subject: 'verify your email',
            text: `Thanks for signing up, ${username}.  copy paste this link: ${process.env.HOST_DOMAIN}/${userId}/verify/${token_id} to verify your email.`,
            html: `Thanks for signing up, ${username}.  click <a href="${process.env.HOST_DOMAIN}/${userId}/verify/${token_id}">here</a> (or copy paste ${process.env.HOST_DOMAIN}/${userId}/verify/${token_id} into your browser) to verify your email.`,
        })
        mail.compile().build(async (err: any, message: any) => {
            const data = await mg.messages.create(process.env.MAILGUN_DOMAIN!, { to: [`${username} <${email}>`], message })
            console.log(data) // logs response data
        })
    } catch (error) {
        console.log(error) //logs any error
    }
}
export default sendMessage
