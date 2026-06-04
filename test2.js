fetch('http://localhost:8765', {
    method: 'POST',
    body: JSON.stringify({action: 'modelTemplates', version: 6, params: {modelName: 'JP::Kanji'}})
}).then(r=>r.text()).then(t => console.log(t));
