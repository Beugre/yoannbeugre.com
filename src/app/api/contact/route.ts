import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        // Validation basique
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: "Tous les champs sont requis" },
                { status: 400 }
            );
        }

        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Email invalide" },
                { status: 400 }
            );
        }

        // Longueur max pour éviter les abus
        if (message.length > 2000 || name.length > 100 || subject.length > 200) {
            return NextResponse.json(
                { error: "Contenu trop long" },
                { status: 400 }
            );
        }

        // Ici, intégrer un service d'envoi d'email (Resend, SendGrid, etc.)
        // Exemple avec Resend :
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // await resend.emails.send({
        //   from: "portfolio@yoannbeugre.dev",
        //   to: "contact@yoannbeugre.dev",
        //   subject: `[Portfolio] ${subject}`,
        //   text: `De: ${name} (${email})\n\n${message}`,
        // });

        // Pour l'instant, log côté serveur uniquement
        console.log("Contact form submission:", { name, email, subject, messageLength: message.length });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
