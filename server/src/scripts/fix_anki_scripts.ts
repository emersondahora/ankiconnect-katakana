import { AnkiService } from '../services/AnkiService.js';

async function fixTemplateScripts(modelName: string) {
    const res = await AnkiService.invoke('modelTemplates', { modelName });
    if (!res) return;

    const templatesToUpdate: Record<string, any> = {};

    for (const target of Object.keys(res)) {
        let front = res[target].Front;
        let back = res[target].Back;

        // Helper to combine and wrap <script> tags
        const wrapScript = (html: string) => {
            let combinedScriptContent = '';
            
            // Extract all scripts and remove their tags
            const cleanedHtml = html.replace(/<script>([\s\S]*?)<\/script>/g, (match, scriptContent) => {
                let content = scriptContent.trim();
                
                // Remove previously added IIFEs if they exist
                if (content.startsWith('(function() {') && content.endsWith('})();')) {
                    content = content.substring(13, content.length - 5).trim();
                }
                
                combinedScriptContent += '\n' + content + '\n';
                return ''; // Remove script from original location
            });

            if (!combinedScriptContent.trim()) {
                return html;
            }

            // Append a single combined script at the end
            return cleanedHtml + `\n<script>\n(function() {\n${combinedScriptContent}\n})();\n</script>`;
        };

        templatesToUpdate[target] = {
            Front: wrapScript(front),
            Back: wrapScript(back)
        };
    }

    await AnkiService.invoke('updateModelTemplates', {
        model: {
            name: modelName,
            templates: templatesToUpdate
        }
    });
    console.log(`Updated ${modelName} successfully!`);
}

async function run() {
    await fixTemplateScripts('JP::Kanji');
    await fixTemplateScripts('JP::Vocabulary');
    await fixTemplateScripts('JP::Grammar');
}

run().catch(console.error);
