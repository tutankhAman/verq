const admin = require('firebase-admin');

try {
    // Check if Firebase app is already initialized
    if (!admin.apps.length) {
        console.log('Initializing Firebase Admin...');
        
        // Initialize Firebase Admin
        const serviceAccount = {
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
        };

        // Validate required environment variables
        const requiredEnvVars = [
            'FIREBASE_TYPE',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_PRIVATE_KEY_ID',
            'FIREBASE_PRIVATE_KEY',
            'FIREBASE_CLIENT_EMAIL',
            'FIREBASE_CLIENT_ID',
            'FIREBASE_AUTH_URI',
            'FIREBASE_TOKEN_URI',
            'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
            'FIREBASE_CLIENT_X509_CERT_URL'
        ];

        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
        if (missingEnvVars.length > 0) {
            throw new Error(`Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`);
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        
        console.log('Firebase Admin initialized successfully');
    } else {
        console.log('Firebase Admin already initialized');
    }
} catch (error) {
    console.error('Error initializing Firebase Admin:', {
        error: error.message,
        stack: error.stack
    });
    throw error;
}

module.exports = admin; 