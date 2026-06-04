fetch('https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/098df.svg').then(r=>r.text()).then(t => require('fs').writeFileSync('kanji.svg', t));
