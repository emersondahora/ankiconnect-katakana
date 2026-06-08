const text = `Tópico: [Vます] + たいです

Frase: バナナを**食[た]べたいです**。

Estrutura:
Expressa o desejo de realizar uma ação, equivalente a "querer fazer algo".

**Formação:**
- Verbo na forma ます → remova ます → adicione **たいです**
- 食べます → **食べたいです**
- 飲みます → **飲みたいです**
- 行きます → **行きたいです**

Análise:
バナナ|banana||を|partícula de objeto direto||食[た]べたいです|quero comer

Observações:
Normalmente expressa o desejo do próprio falante||Com verbos de movimento, が pode aparecer no lugar de を (日本へ行きたいです)||Forma casual: ～たい

Exemplos:
寿司[すし]を**食[た]べたいです**。|Quero comer sushi||
日本[にほん]へ**行[い]きたいです**。|Quero ir ao Japão||
水[みず]を**飲[の]みたいです**。|Quero beber água||
新[あたら]しいゲームを**買[か]いたいです**。|Quero comprar um jogo novo||
今日[きょう]は早[はや]く**寝[ね]たいです**。|Quero dormir cedo hoje

Dica:
**たいです = quero fazer**
Basta trocar o ます por **たいです**.`;

const extract = (key, nextKeys) => {
    const nextKeysPattern = nextKeys.length ? nextKeys.map(k => `(?:\\*?\\*?${k}\\*?\\*?\\s*:)`).join('|') : '';
    const lookahead = nextKeysPattern ? `(?=${nextKeysPattern}|$)` : '(?=$)';
    
    const regex = new RegExp(`\\*?\\*?${key}\\*?\\*?\\s*:([\\s\\S]*?)${lookahead}`, 'i');
    console.log("REGEX FOR", key, regex.toString());
    const match = text.match(regex);
    return match ? match[1].trim() : '';
};

const keys = ['Tópico', 'Frase', 'Estrutura', 'Análise', 'Observações', 'Exemplos', 'Dica'];

const topic = extract('Tópico', keys.slice(1));
const sentence = extract('Frase', keys.slice(2));
const structure = extract('Estrutura', keys.slice(3));
const analysis = extract('Análise', keys.slice(4));
const observations = extract('Observações', keys.slice(5));
const examples = extract('Exemplos', keys.slice(6));
const hint = extract('Dica', []);

console.log({ topic, sentence, structure, analysis, observations, examples, hint });
