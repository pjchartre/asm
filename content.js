
window.addEventListener('load', async (event) => {

    const req = await fetch('data/content.json');
    const content = await req.json();

    loadCacheFromContent(content);

    displayGridFromContent(content);

});

const loadCacheFromContent = (content) => {
    const assetList = [];

    content.forEach(c => {
        assetList.push(c.previewImage);
        assetList.push(...c.videos);
        assetList.push(c.explanationVideo);
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            console.log('[Content Loader] Service worker actif, chargement des ressources');
            assetList.forEach(e => fetch(e));
        });
    }
};

const displayGridFromContent = (content) => {
    const grid = document.querySelector('#scenari-grid');
    const scenarioTemplate = document.querySelector('#scenario-template');

    content.forEach(c => {
        const clone = scenarioTemplate.content.cloneNode(true);
        const img = clone.querySelector('.scenario-image img');
        img.setAttribute('src', c.previewImage);
        img.setAttribute('alt', c.title);
        clone.querySelector('.scenario-text').textContent = c.title;
        clone.querySelector('.scenario-description').textContent = c.subTitle;
        clone.children[0].addEventListener('click', e => {
            console.log('click triggered');
            selectScenario(c);
        });
        grid.appendChild(clone);
    });
};

const selectScenario = (scenario) => {
        console.log('selectScenario', scenario);
        const customEvent = new CustomEvent('scenario-selected', { detail: {scenario} });
        console.log('custom event', customEvent);
        window.dispatchEvent(customEvent);
};






