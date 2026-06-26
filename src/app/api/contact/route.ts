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

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.error("RESEND_API_KEY manquant dans .env.local");
            return NextResponse.json({ error: "Service d'envoi non configuré" }, { status: 503 });
        }

        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);

        await resend.emails.send({
            from: "Portfolio <onboarding@resend.dev>",
            to: ["yoann.beugre1@gmail.com"],
            replyTo: email,
            subject: `[Portfolio] ${subject}`,
            text: `Nouveau message depuis le portfolio\n\nDe : ${name}\nEmail : ${email}\nSujet : ${subject}\n\n${message}`,
            html: `<h2>Nouveau message depuis le portfolio</h2><p><strong>De :</strong> ${name} (${email})</p><p><strong>Sujet :</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, "<br/>")}</p>`,
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Erreur interne du serveur" },
            { status: 500 }
        );
    }
}
