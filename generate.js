import fs from 'fs';
import gplay from 'google-play-scraper';
import { join, resolve } from 'path';

// Usage: node generate.js <package_name> <subfolder>
const PACKAGE_NAME = process.argv[2];
const SUBFOLDER = process.argv[3];

if (!PACKAGE_NAME || !SUBFOLDER) {
    console.error("Erreur : Paramètres manquants.");
    console.log("Usage : node update-rating.js <package_id> <folder_path>");
    console.log("Exemple : node update-rating.js com.whatsapp ./public");
    process.exit(1);
}

const TARGET_DIR = resolve(SUBFOLDER);
const TEMPLATE_PATH = join(TARGET_DIR, 'index.html.template');
const OUTPUT_PATH = join(TARGET_DIR, 'index.html');

async function updateIndex() {
    try {
        console.log(`\nDémarrage de la mise à jour...`);
        console.log(`Package : ${PACKAGE_NAME}`);
        console.log(`Dossier : ${TARGET_DIR}`);

        if (!fs.existsSync(TEMPLATE_PATH)) {
            throw new Error(`Template introuvable dans : ${TEMPLATE_PATH}`);
        }

        const data = await gplay.app({ appId: PACKAGE_NAME });

        if (!data || !data.scoreText) {
            throw new Error("Impossible de récupérer les données du Play Store.");
        }

        const score = parseFloat(data.scoreText.replace(',', '.'));
        const reviews = parseInt(data.ratings);
        const downloads = data.installs;
        const category = data.genre || 'Sport';
        const lastVersionNumber = data.version;
        const lastVersionDate = new Date(data.updated).toISOString().split('T')[0];
        const lastVersionChangelog = data.recentChanges;

        if (isNaN(score) || score < 1) throw new Error("Score récupéré invalide.");

        let htmlContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');

        htmlContent = htmlContent
            .replace(/{{YEAR}}/g, new Date().getFullYear())
            .replace(/{{APP_SCORE}}/g, score.toFixed(1))
            .replace(/{{APP_REVIEWS}}/g, reviews.toLocaleString('fr-FR'))
            .replace(/{{APP_REVIEWS_NUMBER}}/g, reviews.toString())
            .replace(/{{APP_DOWNLOADS}}/g, downloads)
            .replace(/{{LAST_VERSION_NUMBER}}/g, lastVersionNumber)
            .replace(/{{LAST_VERSION_DATE}}/g, lastVersionDate)
            .replace(/{{LAST_VERSION_CHANGELOG}}/g, lastVersionChangelog)
            .replace(/{{APP_CATEGORY}}/g, category);

        const tempPath = `${OUTPUT_PATH}.tmp`;
        fs.writeFileSync(tempPath, htmlContent);
        fs.renameSync(tempPath, OUTPUT_PATH);

        console.log(`SUCCÈS : ${OUTPUT_PATH} a été mis à jour.`);

    } catch (error) {
        console.error(`\n[ERREUR] : ${error.message}\n`);
        process.exit(1);
    }
}

updateIndex();