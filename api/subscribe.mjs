import admin from 'firebase-admin';

function getAdmin() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }
    return admin;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
        const fb = getAdmin();
        await fb.messaging().subscribeToTopic(token, 'daily-reminder');
        res.json({ success: true });
    } catch (err) {
        console.error('Subscribe error:', err);
        res.status(500).json({ error: err.message, stack: err.stack });
    }
}
